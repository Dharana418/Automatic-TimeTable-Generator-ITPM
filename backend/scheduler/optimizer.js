function parseJSONField(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKEND = ['Sat', 'Sun'];
const WEEKDAY_SLOTS = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '13:30-14:30',
  '14:30-15:30',
  '15:30-16:30',
  '16:30-17:30',
];
const WEEKEND_SLOTS = [
  ...WEEKDAY_SLOTS,
  '17:30-18:30',
  '18:30-19:30',
  '19:30-20:30',
];
const SLOTS = [...WEEKEND_SLOTS];

const DEFAULT_WEIGHTS = {
  w1: 100,
  w2: 90,
  w3: 100,
  w4: 85,
  w5: 15,
};

const getNormalizedDay = (value) => {
  const v = String(value || '').toLowerCase().slice(0, 3);
  const map = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
  return map[v] || null;
};

const normalizeRole = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function isLabModule(module) {
  const details = module?.details || {};
  const roomType = String(details.roomType || details.room_type || module.roomType || '').toLowerCase();
  const moduleName = String(module?.name || '').toLowerCase();
  return roomType.includes('lab') || moduleName.includes('lab') || Boolean(details.isLab || module.isLab);
}

function getLabSpan(module) {
  const details = module?.details || {};
  const span = Number(details.h_l || details.lab_hours || details.labSpan || module.h_l || module.labSpan || 1);
  const normalizedSpan = Number.isFinite(span) ? Math.max(1, Math.round(span)) : 1;

  const code = String(module?.code || '').toLowerCase();
  const moduleName = String(module?.name || '').toLowerCase();
  const isSoftwareEngineering =
    code.startsWith('se') ||
    moduleName.includes('software engineering') ||
    moduleName.includes('software eng');

  // Domain rule: Software Engineering lab sessions must run for at least 2 hourly slots.
  if (isLabModule(module) && isSoftwareEngineering) {
    return Math.max(2, normalizedSpan);
  }

  return normalizedSpan;
}

function getModuleExpectedSize(module) {
  return Number(
    module.batch_size ||
      module.expected_students ||
      module.expected_size ||
      module?.details?.expected_students ||
      60
  );
}

function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase();
}

function normalizeAmenities(amenities = null) {
  if (!amenities || typeof amenities !== 'object' || Array.isArray(amenities)) return new Set();
  return new Set(
    Object.entries(amenities)
      .filter(([, enabled]) => enabled === true)
      .map(([name]) => normalizeText(name))
      .filter(Boolean)
  );
}

function getEffectiveHallCapacity(hall = {}) {
  const rawCapacity = Number(hall?.capacity || 0);
  const normalizedCapacity = Number.isFinite(rawCapacity) && rawCapacity > 0 ? rawCapacity : 0;

  const hallType = normalizeText(
    hall?.features?.hallType || hall?.features?.roomType || hall?.roomType || hall?.hallType
  );

  const isLectureOrLab =
    hallType.includes('lecture') ||
    hallType.includes('hall') ||
    hallType.includes('lab');

  if (isLectureOrLab) {
    // Domain rule: one lecture hall or one lab can host at most 120 students.
    return normalizedCapacity ? Math.min(normalizedCapacity, 120) : 120;
  }

  return normalizedCapacity;
}

function getModuleStructureRequirements(module = {}) {
  const details = module?.details || {};

  const requiredHallType =
    normalizeText(details.requiredHallType || details.hallType || details.roomType || module.requiredHallType || module.roomType);
  const preferredBuilding = normalizeText(details.preferredBuilding || details.building || module.preferredBuilding);
  const preferredFloor = normalizeText(details.preferredFloor || details.floor || module.preferredFloor);

  const requiredAmenities = new Set();
  const amenitiesFromObject = normalizeAmenities(details.requiredAmenities || details.amenities || module.requiredAmenities || null);
  amenitiesFromObject.forEach((item) => requiredAmenities.add(item));

  const amenitiesFromList = [
    ...(Array.isArray(details.requiredAmenityList) ? details.requiredAmenityList : []),
    ...(Array.isArray(module.requiredAmenityList) ? module.requiredAmenityList : []),
  ]
    .map((item) => normalizeText(item))
    .filter(Boolean);
  amenitiesFromList.forEach((item) => requiredAmenities.add(item));

  return {
    requiredHallType,
    preferredBuilding,
    preferredFloor,
    requiredAmenities,
  };
}

function getModuleCampus(module = {}) {
  const details = module?.details || {};
  return normalizeText(details.campus || details.campusName || module.campus || module.campus_name);
}

function getHallCampus(hall = {}) {
  const features = hall?.features || {};
  return normalizeText(features.campus || features.campusName || hall.campus || hall.campus_name);
}

function getModuleCohortKey(module = {}) {
  const details = module?.details || {};

  const specialization = normalizeText(
    details.specialization || details.spec || details.stream || module.specialization || module.department
  ) || 'general';
  const academicYear = String(module?.academic_year || details?.academic_year || details?.year || 'na').trim().toLowerCase();
  const semester = String(module?.semester || details?.semester || details?.sem || 'na').trim().toLowerCase();
  const campus = getModuleCampus(module) || 'anycampus';

  return `cohort:${specialization}:y${academicYear}:s${semester}:c${campus}`;
}

function normalizeSpecializationToken(value = '') {
  const normalized = normalizeText(value).replace(/[^a-z0-9]/g, '');
  const aliases = {
    computerscience: 'cs',
    informationsystemengineering: 'ise',
    interactmedia: 'im',
    interactivemedia: 'im',
    cybersecurity: 'cybersecurity',
  };

  return aliases[normalized] || normalized;
}

function parseBatchIdentity(batchId = '') {
  const [yearToken = '', semesterToken = '', modeToken = '', specializationToken = '', groupToken = '', subgroupToken = ''] = String(batchId)
    .trim()
    .split('.');

  if (!yearToken || !semesterToken || !modeToken || !specializationToken || !groupToken || !subgroupToken) {
    return null;
  }

  return {
    year: Number(String(yearToken).replace(/[^0-9]/g, '')),
    semester: Number(String(semesterToken).replace(/[^0-9]/g, '')),
    mode: normalizeText(modeToken),
    specialization: normalizeSpecializationToken(specializationToken),
    group: String(groupToken).trim(),
    subgroup: String(subgroupToken).trim(),
  };
}

function inferModuleYear(module = {}) {
  const details = module?.details || {};
  const direct = Number(module?.academic_year || details?.academic_year || details?.year || 0);
  if (direct >= 1 && direct <= 10) return direct;

  const match = String(module?.code || '').toUpperCase().match(/^[A-Z]+(\d)/);
  return match ? Number(match[1]) : null;
}

function inferModuleSemester(module = {}) {
  const details = module?.details || {};
  const direct = Number(module?.semester || details?.semester || details?.sem || 0);
  if (direct === 1 || direct === 2) return direct;
  return null;
}

function inferModuleSpecialization(module = {}) {
  const details = module?.details || {};
  const explicit =
    details?.specialization ||
    details?.spec ||
    details?.stream ||
    module?.specialization ||
    module?.department ||
    '';

  const normalizedExplicit = normalizeSpecializationToken(explicit);
  if (normalizedExplicit) return normalizedExplicit;

  const code = String(module?.code || '').toLowerCase();
  if (code.startsWith('it')) return 'it';
  if (code.startsWith('se')) return 'se';
  if (code.startsWith('ds')) return 'ds';
  if (code.startsWith('is')) return 'ise';
  if (code.startsWith('cs')) return 'cs';
  if (code.startsWith('cn')) return 'cn';
  if (code.startsWith('im') || code.startsWith('ie')) return 'im';
  return '';
}

function getTargetBatchesForModule(module = {}, batches = []) {
  const details = module?.details || {};
  const explicitBatchIds = [
    ...(Array.isArray(details.batch_ids) ? details.batch_ids : []),
    ...(Array.isArray(details.batchIds) ? details.batchIds : []),
    details.batch_id,
    details.batchId,
    module.batch_id,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  if (explicitBatchIds.length) {
    const idSet = new Set(explicitBatchIds);
    return batches.filter((batch) => idSet.has(String(batch?.id || '').trim()));
  }

  const moduleYear = inferModuleYear(module);
  const moduleSemester = inferModuleSemester(module);
  const moduleSpecialization = inferModuleSpecialization(module);
  const dayType = normalizeText(module?.day_type || details?.day_type || 'weekday');

  return batches.filter((batch) => {
    const parsed = parseBatchIdentity(batch?.id || batch?.name || '');
    if (!parsed) return false;

    if (moduleYear && parsed.year && parsed.year !== moduleYear) return false;
    if (moduleSemester && parsed.semester && parsed.semester !== moduleSemester) return false;
    if (moduleSpecialization && parsed.specialization !== moduleSpecialization) return false;

    if (dayType === 'weekend' && parsed.mode !== 'we') return false;
    if ((dayType === 'weekday' || dayType === '') && parsed.mode !== 'wd') return false;

    return true;
  });
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.round(parsed);
  return normalized > 0 ? normalized : fallback;
}

function getModuleSessionBlueprints(module = {}, options = {}) {
  const details = module?.details || {};
  const logicalMode = options.logicalScheduling !== false;

  if (options.fixedSessionBlueprint === true) {
    const fixedLectureDuration = parsePositiveInteger(options.lectureDurationHours, 3);
    const fixedLabDuration = parsePositiveInteger(options.labDurationHours, 2);

    return [
      { type: 'lecture', count: 1, durationSlots: fixedLectureDuration },
      { type: 'lab', count: 1, durationSlots: fixedLabDuration },
    ];
  }

  const lectureCount = parsePositiveInteger(
    details.lecture_sessions_per_week || module.lecture_sessions_per_week || options.lectureSessionsPerWeek,
    logicalMode ? 1 : parsePositiveInteger(module.lectures_per_week || details.lectures_per_week, 1)
  );

  const lectureDuration = parsePositiveInteger(
    details.lecture_hours || details.lectureDurationHours || module.lecture_hours || options.lectureDurationHours,
    logicalMode ? 3 : 1
  );

  const forceLabAndTutorial = logicalMode && options.enforceWeeklyLabAndTutorial !== false;

  const labCount = parsePositiveInteger(
    details.lab_sessions_per_week || module.lab_sessions_per_week || options.labSessionsPerWeek,
    forceLabAndTutorial ? 1 : 0
  );
  const labDuration = parsePositiveInteger(
    details.lab_hours || details.h_l || details.labDurationHours || module.lab_hours || options.labDurationHours,
    2
  );

  const tutorialCount = parsePositiveInteger(
    details.tutorial_sessions_per_week || module.tutorial_sessions_per_week || options.tutorialSessionsPerWeek,
    forceLabAndTutorial ? 1 : 0
  );
  const tutorialDuration = parsePositiveInteger(
    details.tutorial_hours || details.h_t || details.tutorialDurationHours || module.tutorial_hours || options.tutorialDurationHours,
    1
  );

  return [
    { type: 'lecture', count: lectureCount, durationSlots: lectureDuration },
    { type: 'lab', count: labCount, durationSlots: labDuration },
    { type: 'tutorial', count: tutorialCount, durationSlots: tutorialDuration },
  ].filter((entry) => entry.count > 0 && entry.durationSlots > 0);
}

function hallMatchesModule(hall, module, sessionType = 'lecture') {
  const details = module?.details || {};
  const preferredHallIdsRaw = [
    ...(Array.isArray(details.preferredHallIds) ? details.preferredHallIds : []),
    ...(Array.isArray(module?.preferredHallIds) ? module.preferredHallIds : []),
    details.preferredHallId,
    details.allocatedHallId,
    module?.preferred_hall_id,
  ];

  const preferredHallIds = new Set(
    preferredHallIdsRaw
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  );

  if (preferredHallIds.size > 0 && !preferredHallIds.has(String(hall?.id || '').trim())) {
    return false;
  }

  const moduleCampus = getModuleCampus(module);
  const hallCampus = getHallCampus(hall);
  if (moduleCampus && hallCampus && moduleCampus !== hallCampus) {
    return false;
  }

  const expectedSize = getModuleExpectedSize(module);
  const hallCapacity = getEffectiveHallCapacity(hall);
  if (Number.isFinite(expectedSize) && expectedSize > 0 && Number.isFinite(hallCapacity) && hallCapacity > 0 && hallCapacity < expectedSize) {
    return false;
  }

  const requirements = getModuleStructureRequirements(module);
  const hallFeatures = hall?.features || {};
  const hallType = normalizeText(hallFeatures.hallType || hallFeatures.roomType || hall.roomType);
  const hallBuilding = normalizeText(hallFeatures.building || hall.building);
  const hallFloor = normalizeText(hallFeatures.floor || hall.floor);
  const hallAmenities = normalizeAmenities(hallFeatures.amenities);

  if (requirements.requiredHallType) {
    const typeMatch =
      hallType &&
      (hallType.includes(requirements.requiredHallType) || requirements.requiredHallType.includes(hallType));
    if (!typeMatch) return false;
  }

  if (requirements.preferredBuilding && hallBuilding && hallBuilding !== requirements.preferredBuilding) {
    return false;
  }

  if (requirements.preferredFloor && hallFloor && hallFloor !== requirements.preferredFloor) {
    return false;
  }

  for (const requiredAmenity of requirements.requiredAmenities) {
    if (!hallAmenities.has(requiredAmenity)) {
      return false;
    }
  }

  if (sessionType === 'lab' && !hallType.includes('lab')) {
    return false;
  }

  if (sessionType === 'tutorial') {
    const isTutorialFriendly = hallType.includes('tutorial') || hallType.includes('lecture') || hallType.includes('class');
    if (!isTutorialFriendly && hallType) {
      return false;
    }
  }

  const moduleRoomType = String(module?.details?.roomType || module?.details?.room_type || module?.roomType || '').toLowerCase();
  const hallRoomType = String(hall?.features?.roomType || hall?.features?.room_type || '').toLowerCase();
  if (!moduleRoomType || !hallRoomType) return true;
  return hallRoomType.includes(moduleRoomType) || moduleRoomType.includes(hallRoomType);
}

function instructorAvailable(instructor, day, slotIndexes) {
  const avail = instructor?.availabilities || [];
  if (!avail?.length) return true;

  const dayAvail = avail.find((entry) => getNormalizedDay(entry?.day || entry?.dayOfWeek || entry?.day_name) === day);
  if (!dayAvail) return false;
  if (!dayAvail.slots || !dayAvail.slots.length) return true;

  return slotIndexes.every((idx) => dayAvail.slots.includes(SLOTS[idx]));
}

function resolveWeekdayFreeDay(options = {}) {
  const configuredDay = getNormalizedDay(
    options.weekdayFreeDay || options?.softConstraints?.weekdayFreeDay || 'Fri'
  );
  if (!configuredDay || !WEEKDAYS.includes(configuredDay)) return 'Fri';
  return configuredDay;
}

function getAllowedDays(module, options = {}) {
  const dt = String(module.day_type || module?.details?.day_type || 'weekday').toLowerCase();
  const weekdayFreeDay = resolveWeekdayFreeDay(options);

  const weekdayDays = WEEKDAYS.filter((day) => day !== weekdayFreeDay);
  const safeWeekdayDays = weekdayDays.length ? weekdayDays : [...WEEKDAYS];

  if (dt === 'weekend') return WEEKEND;
  if (dt === 'any' || dt === 'both') return [...safeWeekdayDays, ...WEEKEND];
  return safeWeekdayDays;
}

function getAllowedSlotIndexes(module, allSlots = SLOTS) {
  const dt = String(module.day_type || module?.details?.day_type || 'weekday').toLowerCase();

  const allowedLabels =
    dt === 'weekend'
      ? WEEKEND_SLOTS
      : dt === 'any' || dt === 'both'
        ? allSlots
        : WEEKDAY_SLOTS;

  const allowedSet = new Set();
  allSlots.forEach((label, idx) => {
    if (allowedLabels.includes(label)) {
      allowedSet.add(idx);
    }
  });

  return allowedSet;
}

function getModuleBatchKeys(module, batches = []) {
  const details = module?.details || {};
  const keys = new Set();

  const pushBatch = (value) => {
    if (!value) return;
    keys.add(String(value));
  };

  if (details.batch_id) pushBatch(details.batch_id);
  if (details.batchId) pushBatch(details.batchId);
  if (Array.isArray(details.batch_ids)) details.batch_ids.forEach(pushBatch);
  if (Array.isArray(details.batchIds)) details.batchIds.forEach(pushBatch);
  if (module.batch_id) pushBatch(module.batch_id);

  if (!keys.size && details.batch_name) {
    const targetName = String(details.batch_name).toLowerCase();
    const matched = batches.find((batch) => String(batch.name || '').toLowerCase() === targetName);
    if (matched) keys.add(String(matched.id || matched.name));
  }

  if (!keys.size && module.batch_size) {
    keys.add(`size:${module.batch_size}`);
  }

  if (!keys.size) {
    keys.add(`module:${module.id || module.code || module.name}`);
  }

  // Force same cohort modules (specialization + year + semester + campus) to avoid overlap.
  keys.add(getModuleCohortKey(module));

  return [...keys];
}

function buildSoftConstraintModel(options = {}) {
  const soft = options.softConstraints || {};
  const preferredDays = new Set((soft.preferredDays || []).map(getNormalizedDay).filter(Boolean));
  const preferredTimeSlots = new Set((soft.preferredTimeSlots || []).map((slot) => String(slot)));
  return { preferredDays, preferredTimeSlots };
}

export function buildProblem(constraints = {}, options = {}) {
  const halls = (constraints.halls || []).map((hall) => ({ ...hall, features: parseJSONField(hall.features) }));
  const modules = (constraints.modules || []).map((module) => ({ ...module, details: parseJSONField(module.details) || {} }));
  const instructors = (constraints.instructors || []).map((ins) => ({ ...ins, availabilities: parseJSONField(ins.availabilities) || [] }));
  const batches = (constraints.batches || []).map((batch) => ({ ...batch }));

  const sessions = [];
  modules.forEach((module) => {
    const components = getModuleSessionBlueprints(module, options);
    const targetBatches = getTargetBatchesForModule(module, batches);
    let runningIndex = 0;

    const resolvedTargets = targetBatches.length ? targetBatches : [null];

    resolvedTargets.forEach((targetBatch) => {
      components.forEach((component) => {
        for (let i = 0; i < component.count; i += 1) {
          sessions.push({
            module,
            targetBatch,
            sessionType: component.type,
            sessionIndex: runningIndex,
            isLab: component.type === 'lab' || isLabModule(module),
            durationSlots: component.type === 'lab' ? Math.max(2, component.durationSlots) : component.durationSlots,
            expectedStudents: Number(targetBatch?.capacity || getModuleExpectedSize(module)),
            batchKeys: targetBatch?.id ? [String(targetBatch.id)] : getModuleBatchKeys(module, batches),
          });
          runningIndex += 1;
        }
      });
    });
  });

  const placements = sessions.map((session) => {
    const possible = [];
    const allowedDays = getAllowedDays(session.module, options);
    const allowedSlotIndexes = getAllowedSlotIndexes(session.module, SLOTS);
    const maxStart = SLOTS.length - session.durationSlots;

    for (const day of allowedDays) {
      for (let start = 0; start <= maxStart; start += 1) {
        if (!allowedSlotIndexes.has(start)) continue;
        const slotIndexes = Array.from({ length: session.durationSlots }, (_, i) => start + i);
        if (!slotIndexes.every((idx) => allowedSlotIndexes.has(idx))) continue;

        for (let hallIndex = 0; hallIndex < halls.length; hallIndex += 1) {
          const hall = halls[hallIndex];
          if (!hallMatchesModule(hall, session.module, session.sessionType)) continue;

          if (!instructors.length) {
            possible.push({ day, slotIndexes, hallIndex, instructorIndex: null });
            continue;
          }

          for (let instructorIndex = 0; instructorIndex < instructors.length; instructorIndex += 1) {
            const instructor = instructors[instructorIndex];
            if (!instructorAvailable(instructor, day, slotIndexes)) continue;
            possible.push({ day, slotIndexes, hallIndex, instructorIndex });
          }
        }
      }
    }

    if (!possible.length && halls.length) {
      const fallbackDays = getAllowedDays(session.module, options);
      const maxStartFallback = Math.max(0, SLOTS.length - session.durationSlots);
      for (const day of fallbackDays) {
        for (let start = 0; start <= maxStartFallback; start += 1) {
          if (!allowedSlotIndexes.has(start)) continue;
          const slotIndexes = Array.from({ length: session.durationSlots }, (_, i) => start + i);
          if (!slotIndexes.every((idx) => allowedSlotIndexes.has(idx))) continue;
          for (let hallIndex = 0; hallIndex < halls.length; hallIndex += 1) {
            possible.push({ day, slotIndexes, hallIndex, instructorIndex: null });
          }
        }
      }
    }

    return possible;
  });

  return {
    halls,
    modules,
    instructors,
    batches,
    sessions,
    placements,
    days: DAYS,
    slots: SLOTS,
    softModel: buildSoftConstraintModel(options),
  };
}

export function evaluateSolution(solution, problem, options = {}) {
  const weights = {
    ...DEFAULT_WEIGHTS,
    ...(options.weights || {}),
  };

  const schedule = [];
  const hardConflicts = [];

  const hallUsage = new Map();
  const lecturerUsage = new Map();
  const batchUsage = new Map();

  let scheduledCount = 0;
  let capacityViolations = 0;
  let labContinuityViolations = 0;
  let softViolations = 0;

  for (let s = 0; s < problem.sessions.length; s += 1) {
    const session = problem.sessions[s];
    const placementOptions = problem.placements[s] || [];

    if (!placementOptions.length) {
      hardConflicts.push({ type: 'unplaceable_session', session: s, moduleId: session.module.id || session.module.code || session.module.name });
      continue;
    }

    const idx = Math.abs(solution[s] ?? 0) % placementOptions.length;
    const placement = placementOptions[idx];
    const hall = problem.halls[placement.hallIndex];
    const instructor = placement.instructorIndex != null ? problem.instructors[placement.instructorIndex] : null;

    scheduledCount += 1;

    const slotLabels = placement.slotIndexes.map((slotIdx) => problem.slots[slotIdx]);
    const startSlot = slotLabels[0];

    const effectiveHallCapacity = getEffectiveHallCapacity(hall);
    if (!hall || (session.expectedStudents && effectiveHallCapacity && Number(effectiveHallCapacity) < Number(session.expectedStudents))) {
      capacityViolations += 1;
      hardConflicts.push({
        type: 'capacity_violation',
        moduleId: session.module.id || session.module.code || session.module.name,
        hallId: hall?.id || hall?.name || null,
        expected: session.expectedStudents,
        capacity: effectiveHallCapacity || null,
      });
    }

    if (session.isLab) {
      const expectedLen = session.durationSlots;
      const isConsecutive = placement.slotIndexes.every((slotIdx, index) => index === 0 || slotIdx === placement.slotIndexes[index - 1] + 1);
      if (!isConsecutive || placement.slotIndexes.length !== expectedLen) {
        labContinuityViolations += 1;
        hardConflicts.push({
          type: 'lab_non_consecutive',
          moduleId: session.module.id || session.module.code || session.module.name,
        });
      }
    }

    for (const slotIdx of placement.slotIndexes) {
      const slot = problem.slots[slotIdx];
      const usageKey = `${placement.day}|${slot}`;

      const hallKey = `${usageKey}|${hall?.id || hall?.name || `hall:${placement.hallIndex}`}`;
      const hallCount = hallUsage.get(hallKey) || 0;
      hallUsage.set(hallKey, hallCount + 1);

      if (placement.instructorIndex != null) {
        const lecKey = `${usageKey}|${placement.instructorIndex}`;
        const lecCount = lecturerUsage.get(lecKey) || 0;
        lecturerUsage.set(lecKey, lecCount + 1);
      }

      session.batchKeys.forEach((batchKey) => {
        const key = `${usageKey}|${batchKey}`;
        const batchCount = batchUsage.get(key) || 0;
        batchUsage.set(key, batchCount + 1);
      });

      if (problem.softModel.preferredDays.size && !problem.softModel.preferredDays.has(placement.day)) {
        softViolations += 1;
      }
      if (problem.softModel.preferredTimeSlots.size && !problem.softModel.preferredTimeSlots.has(slot)) {
        softViolations += 1;
      }
    }

    schedule.push({
      moduleId: session.module.id || session.module.code || session.module.name,
      moduleName: session.module.name || null,
      sessionType: session.sessionType || 'lecture',
      isLab: session.isLab,
      durationSlots: session.durationSlots,
      batchId: session.targetBatch?.id || null,
      batchName: session.targetBatch?.name || session.targetBatch?.id || null,
      instructorId: instructor ? (instructor.id || instructor._id || instructor.email || instructor.name) : null,
      instructorName: instructor?.name || null,
      hallId: hall?.id || hall?.name || null,
      hallName: hall?.name || null,
      day: placement.day,
      slot: startSlot,
      slots: slotLabels,
      batchKeys: session.batchKeys,
    });
  }

  let roomOverlapViolations = 0;
  hallUsage.forEach((count, key) => {
    if (count > 1) {
      roomOverlapViolations += count - 1;
      hardConflicts.push({ type: 'room_overlap', key, count });
    }
  });

  let lecturerDoubleBookingViolations = 0;
  lecturerUsage.forEach((count, key) => {
    if (count > 1) {
      lecturerDoubleBookingViolations += count - 1;
      hardConflicts.push({ type: 'lecturer_double_booking', key, count });
    }
  });

  let batchOverlapViolations = 0;
  batchUsage.forEach((count, key) => {
    if (count > 1) {
      batchOverlapViolations += count - 1;
      hardConflicts.push({ type: 'batch_overlap', key, count });
    }
  });

  const c1 = batchOverlapViolations;
  const c2 = capacityViolations;
  const c3 = lecturerDoubleBookingViolations;
  const c4 = labContinuityViolations + roomOverlapViolations;
  const c5 = softViolations;

  const penalty =
    weights.w1 * c1 +
    weights.w2 * c2 +
    weights.w3 * c3 +
    weights.w4 * c4 +
    weights.w5 * c5;

  const totalRequired = problem.sessions.length;
  const coverage = totalRequired > 0 ? scheduledCount / totalRequired : 0;

  const fitness = -penalty + coverage;

  const penaltyBreakdown = {
    w1: { weight: weights.w1, violations: c1, score: weights.w1 * c1, label: 'Batch overlap' },
    w2: { weight: weights.w2, violations: c2, score: weights.w2 * c2, label: 'Room capacity' },
    w3: { weight: weights.w3, violations: c3, score: weights.w3 * c3, label: 'Lecturer double-booking' },
    w4: { weight: weights.w4, violations: c4, score: weights.w4 * c4, label: 'Lab continuity/room overlap' },
    w5: { weight: weights.w5, violations: c5, score: weights.w5 * c5, label: 'Soft preference mismatch' },
    totalPenalty: penalty,
  };

  return {
    schedule,
    conflicts: hardConflicts,
    fitness,
    objective: penalty,
    stats: {
      scheduled: scheduledCount,
      totalRequired,
      coverage,
      conflictFree: penalty === 0,
      hardConstraintViolations: c1 + c2 + c3 + c4,
      softConstraintViolations: c5,
      penalty,
      fOfS: penalty,
    },
    penaltyBreakdown,
  };
}

function randomSolution(problem) {
  return problem.sessions.map((_, sessionIdx) => {
    const choices = problem.placements[sessionIdx]?.length || 1;
    return Math.floor(Math.random() * choices);
  });
}

function evaluatePopulation(population, problem, options) {
  return population.map((solution) => ({ solution, evaluation: evaluateSolution(solution, problem, options) }));
}

export function runACO(problem, options = {}) {
  const ants = options.ants || 40;
  const iterations = options.iterations || 60;
  const evaporation = options.evaporation || 0.15;

  const pheromone = problem.placements.map((choices) => new Array(Math.max(1, choices.length)).fill(1));
  let best = null;

  const heuristic = (sessionIdx, choiceIdx) => {
    const choice = problem.placements[sessionIdx]?.[choiceIdx];
    if (!choice) return 0.1;

    let score = 1;
    const hall = problem.halls[choice.hallIndex];
    const session = problem.sessions[sessionIdx];

    if (hall?.capacity && session?.expectedStudents) {
      const remaining = Number(hall.capacity) - Number(session.expectedStudents);
      score += remaining >= 0 ? 0.6 : -1;
    }

    if (session?.isLab && session?.durationSlots > 1) {
      score += 0.5;
    }

    return Math.max(0.1, score);
  };

  for (let it = 0; it < iterations; it += 1) {
    const antSolutions = [];

    for (let ant = 0; ant < ants; ant += 1) {
      const solution = [];
      for (let sessionIdx = 0; sessionIdx < problem.sessions.length; sessionIdx += 1) {
        const choices = problem.placements[sessionIdx] || [];
        if (!choices.length) {
          solution.push(0);
          continue;
        }

        const weights = choices.map((_, choiceIdx) => {
          const tau = pheromone[sessionIdx][choiceIdx] || 1;
          const eta = heuristic(sessionIdx, choiceIdx);
          return tau * eta;
        });

        const total = weights.reduce((sum, value) => sum + value, 0);
        let r = Math.random() * total;
        let selected = 0;
        for (let i = 0; i < weights.length; i += 1) {
          r -= weights[i];
          if (r <= 0) {
            selected = i;
            break;
          }
        }

        solution.push(selected);
      }

      const evaluation = evaluateSolution(solution, problem, options);
      antSolutions.push({ solution, evaluation });
      if (!best || evaluation.fitness > best.evaluation.fitness) best = { solution, evaluation };
    }

    for (let s = 0; s < pheromone.length; s += 1) {
      for (let c = 0; c < pheromone[s].length; c += 1) {
        pheromone[s][c] *= (1 - evaporation);
        if (pheromone[s][c] < 0.0001) pheromone[s][c] = 0.0001;
      }
    }

    antSolutions.forEach(({ solution, evaluation }) => {
      const reinforcement = Math.max(0.0001, -evaluation.objective + 1);
      solution.forEach((choice, sessionIdx) => {
        if (pheromone[sessionIdx] && pheromone[sessionIdx][choice] != null) {
          pheromone[sessionIdx][choice] += reinforcement;
        }
      });
    });
  }

  return {
    bestSolution: best?.solution || randomSolution(problem),
    ...(best?.evaluation || evaluateSolution(randomSolution(problem), problem, options)),
  };
}

export function runGA(problem, options = {}) {
  const popSize = options.popSize || 60;
  const generations = options.generations || 120;
  const mutationRate = options.mutationRate || 0.08;
  const crossoverRate = options.crossoverRate || 0.85;

  const seedPopulation = Array.isArray(options.initialPopulation) ? options.initialPopulation : [];

  const population = [];
  seedPopulation.forEach((sol) => {
    if (Array.isArray(sol) && sol.length === problem.sessions.length) {
      population.push(sol.slice());
    }
  });

  while (population.length < popSize) population.push(randomSolution(problem));

  let scored = evaluatePopulation(population, problem, options).sort((a, b) => b.evaluation.fitness - a.evaluation.fitness);

  const tournamentPick = () => {
    const a = scored[Math.floor(Math.random() * scored.length)];
    const b = scored[Math.floor(Math.random() * scored.length)];
    return a.evaluation.fitness >= b.evaluation.fitness ? a.solution : b.solution;
  };

  for (let generation = 0; generation < generations; generation += 1) {
    const next = [];
    const eliteCount = Math.max(2, Math.floor(popSize * 0.12));

    for (let i = 0; i < eliteCount; i += 1) next.push(scored[i].solution.slice());

    while (next.length < popSize) {
      const parentA = tournamentPick();
      const parentB = tournamentPick();

      let child = parentA.slice();
      if (Math.random() < crossoverRate) {
        const point = Math.floor(Math.random() * parentA.length);
        child = parentA.slice(0, point).concat(parentB.slice(point));
      }

      for (let idx = 0; idx < child.length; idx += 1) {
        if (Math.random() < mutationRate) {
          const choices = problem.placements[idx]?.length || 1;
          child[idx] = Math.floor(Math.random() * choices);
        }
      }

      next.push(child);
    }

    scored = evaluatePopulation(next, problem, options).sort((a, b) => b.evaluation.fitness - a.evaluation.fitness);
  }

  return {
    bestSolution: scored[0].solution,
    ...scored[0].evaluation,
  };
}

export function runPSO(problem, options = {}) {
  const swarmSize = options.swarmSize || 36;
  const iterations = options.iterations || 70;
  const inertia = options.inertia || 0.6;
  const c1 = options.c1 || 1.5;
  const c2 = options.c2 || 1.5;

  const sessionCount = problem.sessions.length;

  const particles = Array.from({ length: swarmSize }, () => {
    const position = problem.sessions.map((_, idx) => Math.random() * (problem.placements[idx]?.length || 1));
    const velocity = problem.sessions.map(() => (Math.random() - 0.5) * 2);
    const discrete = position.map((value, idx) => Math.abs(Math.floor(value)) % (problem.placements[idx]?.length || 1));
    const evaluation = evaluateSolution(discrete, problem, options);

    return {
      position,
      velocity,
      pBestPosition: position.slice(),
      pBestDiscrete: discrete,
      pBestEvaluation: evaluation,
    };
  });

  let gBest = particles.reduce((best, particle) => (
    !best || particle.pBestEvaluation.fitness > best.pBestEvaluation.fitness ? particle : best
  ), null);

  for (let it = 0; it < iterations; it += 1) {
    particles.forEach((particle) => {
      for (let d = 0; d < sessionCount; d += 1) {
        const r1 = Math.random();
        const r2 = Math.random();

        particle.velocity[d] =
          inertia * particle.velocity[d] +
          c1 * r1 * (particle.pBestPosition[d] - particle.position[d]) +
          c2 * r2 * (gBest.pBestPosition[d] - particle.position[d]);

        particle.position[d] += particle.velocity[d];
        if (particle.position[d] < 0) particle.position[d] = 0;
      }

      const discrete = particle.position.map((value, idx) => Math.abs(Math.floor(value)) % (problem.placements[idx]?.length || 1));
      const evaluation = evaluateSolution(discrete, problem, options);

      if (evaluation.fitness > particle.pBestEvaluation.fitness) {
        particle.pBestEvaluation = evaluation;
        particle.pBestDiscrete = discrete;
        particle.pBestPosition = particle.position.slice();
      }

      if (evaluation.fitness > gBest.pBestEvaluation.fitness) {
        gBest = {
          ...particle,
          pBestEvaluation: evaluation,
          pBestDiscrete: discrete,
          pBestPosition: particle.position.slice(),
        };
      }
    });
  }

  return {
    bestSolution: gBest.pBestDiscrete,
    ...gBest.pBestEvaluation,
  };
}

export function runTabu(problem, options = {}) {
  const iterations = options.iterations || 180;
  const neighborhoodSize = options.neighborhoodSize || 120;
  const baseTabuTenure = options.tabuTenure || Math.max(6, Math.floor(problem.sessions.length * 0.08));

  const stagnationLimit = options.stagnationLimit || 18;
  const probabilisticFallbackRate = options.probabilisticFallbackRate || 0.25;

  let current = Array.isArray(options.initialSolution) ? options.initialSolution.slice() : randomSolution(problem);
  let currentEvaluation = evaluateSolution(current, problem, options);
  let best = { solution: current.slice(), evaluation: currentEvaluation };

  let tenure = baseTabuTenure;
  let stagnation = 0;
  const tabu = new Map();

  const moveKey = (sessionIdx, targetChoice) => `${sessionIdx}:${targetChoice}`;

  const decayTabu = () => {
    Array.from(tabu.keys()).forEach((key) => {
      const nextValue = (tabu.get(key) || 0) - 1;
      if (nextValue <= 0) tabu.delete(key);
      else tabu.set(key, nextValue);
    });
  };

  for (let it = 0; it < iterations; it += 1) {
    let selected = null;

    for (let n = 0; n < neighborhoodSize; n += 1) {
      const sIdx = Math.floor(Math.random() * problem.sessions.length);
      const choices = problem.placements[sIdx]?.length || 1;
      if (choices <= 1) continue;

      let candidateChoice = Math.floor(Math.random() * choices);
      if (candidateChoice === current[sIdx]) candidateChoice = (candidateChoice + 1) % choices;

      const candidate = current.slice();
      candidate[sIdx] = candidateChoice;

      const candidateEvaluation = evaluateSolution(candidate, problem, options);
      const key = moveKey(sIdx, candidateChoice);
      const isTabu = tabu.has(key);
      const aspiration = candidateEvaluation.fitness > best.evaluation.fitness;

      if (isTabu && !aspiration) continue;

      if (!selected || candidateEvaluation.fitness > selected.evaluation.fitness) {
        selected = { candidate, evaluation: candidateEvaluation, move: { sIdx, candidateChoice, key } };
      }
    }

    if (!selected) {
      current = randomSolution(problem);
      currentEvaluation = evaluateSolution(current, problem, options);
      continue;
    }

    current = selected.candidate;
    currentEvaluation = selected.evaluation;

    tabu.set(moveKey(selected.move.sIdx, current[selected.move.sIdx]), tenure);
    decayTabu();

    if (currentEvaluation.fitness > best.evaluation.fitness) {
      best = { solution: current.slice(), evaluation: currentEvaluation };
      stagnation = 0;
      tenure = Math.max(baseTabuTenure, tenure - 1);
    } else {
      stagnation += 1;
      tenure = Math.min(baseTabuTenure * 3, tenure + 1);
    }

    if (stagnation >= stagnationLimit) {
      if (Math.random() < probabilisticFallbackRate) {
        const perturbed = best.solution.slice();
        const jump = Math.max(1, Math.floor(problem.sessions.length * 0.1));
        for (let k = 0; k < jump; k += 1) {
          const sIdx = Math.floor(Math.random() * problem.sessions.length);
          const choices = problem.placements[sIdx]?.length || 1;
          perturbed[sIdx] = Math.floor(Math.random() * choices);
        }
        current = perturbed;
        currentEvaluation = evaluateSolution(current, problem, options);
      } else {
        current = randomSolution(problem);
        currentEvaluation = evaluateSolution(current, problem, options);
      }
      stagnation = 0;
    }
  }

  return {
    bestSolution: best.solution,
    ...best.evaluation,
    meta: {
      finalTabuTenure: tenure,
      stagnationLimit,
      probabilisticFallbackRate,
    },
  };
}

export default {
  buildProblem,
  evaluateSolution,
  runGA,
  runPSO,
  runACO,
  runTabu,
  DEFAULT_WEIGHTS,
  normalizeRole,
};
