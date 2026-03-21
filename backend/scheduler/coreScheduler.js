// Core greedy scheduler used by PSO/Ant/Genetic stubs.
// Produces a feasible timetable by assigning module sessions to day/slots and halls.

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKEND = ['Sat', 'Sun'];
const DAYS = [...WEEKDAYS, ...WEEKEND];
const SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00'];

function parseJSONField(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return val; }
}

function instructorAvailable(instructor, day, slot) {
  const avail = parseJSONField(instructor.availabilities) || instructor.availabilities;
  if (!avail || avail.length === 0) return true; // assume available if not specified
  // avail is expected [{day:'Mon', slots:['09:00-10:00']}, ...]
  for (const a of avail) {
    if (!a) continue;
    const aDay = a.day || a.dayOfWeek || a.day_name;
    if (aDay === day) {
      if (!a.slots || a.slots.length === 0) return true;
      if (a.slots.includes(slot)) return true;
    }
  }
  return false;
}

export function scheduleGreedy(constraints = {}, options = {}) {
  const halls = (constraints.halls || []).map(h => ({...h, features: parseJSONField(h.features)}));
  const modules = (constraints.modules || []).map(m => ({...m, details: parseJSONField(m.details)}));
  const lics = (constraints.lics || []).map(l => ({...l, details: parseJSONField(l.details)}));
  const instructors = (constraints.instructors || []).map(i => ({...i, availabilities: parseJSONField(i.availabilities)}));

  // occupancy map: day -> slot -> {hallId, moduleId, instructorId}
  const occupancy = {};
  for (const d of DAYS) occupancy[d] = {};

  const schedule = [];
  let totalRequired = 0;
  let scheduledCount = 0;

  // helper to find hall available for slot and capacity
  function findHallFor(module, day, slot) {
    const expected = Number(module.batch_size || module.expected_students || (module.details && module.details.expected_students) || module.expected_size || null);
    for (const h of halls) {
      if (h.capacity && expected && Number(h.capacity) < Number(expected)) continue;
      const key = `${day}:${slot}`;
      if (!occupancy[day][slot]) return h; // simple: first free hall
      // else check if hall free
      const occupiedEntries = occupancy[day][slot];
      // occupiedEntries may be object mapping hallId -> true
      if (!occupiedEntries[h.id]) return h;
    }
    return null;
  }

  // Build quick instructor map
  const instrMap = {};
  for (const ins of instructors) instrMap[ins.id || ins.identifier || ins._id || ins.email || ins.name] = ins;

  for (const mod of modules) {
    // normalize batch_size and day_type
    mod.batch_size = Number(mod.batch_size || (mod.details && mod.details.batch_size) || 60);
    mod.day_type = (mod.day_type || (mod.details && mod.details.day_type) || 'weekday');
    const lectures = Number(mod.lectures_per_week || mod.lectures || (mod.details && mod.details.lectures_per_week) || 1);
    totalRequired += lectures;

    // try to identify instructor(s) for this module
    let assignedInstructor = null;
    if (mod.instructor_id || mod.instructorId || mod.instructor) {
      const key = mod.instructor_id || mod.instructorId || mod.instructor;
      assignedInstructor = instrMap[key] || null;
    }

    for (let s = 0; s < lectures; s++) {
      let placed = false;
      // try allowed day-slot combos
      let allowedDays = WEEKDAYS;
      if (mod.day_type === 'weekend') allowedDays = WEEKEND;
      else if (mod.day_type === 'any' || mod.day_type === 'both') allowedDays = WEEKDAYS.concat(WEEKEND);

      for (const day of allowedDays) {
        for (const slot of SLOTS) {
          // ensure not already occupied too many times
          // find instructor candidate
          let instructorCandidate = assignedInstructor;
          if (!instructorCandidate) {
            // pick any instructor available at this slot
            instructorCandidate = instructors.find(ins => instructorAvailable(ins, day, slot));
          } else {
            if (!instructorAvailable(instructorCandidate, day, slot)) continue;
          }

          if (!instructorCandidate) continue;

          // find hall
          const hall = findHallFor(mod, day, slot);
          if (!hall) continue;

          // reserve
          if (!occupancy[day][slot]) occupancy[day][slot] = {};
          occupancy[day][slot][hall.id || hall.id === 0 ? hall.id : `${hall.name || Math.random()}`] = true;

          schedule.push({
            moduleId: mod.id || mod.code || mod._id,
            moduleName: mod.name || null,
            instructorId: instructorCandidate.id || instructorCandidate.identifier || instructorCandidate._id || instructorCandidate.email || instructorCandidate.name,
            instructorName: instructorCandidate.name || null,
            hallId: hall.id || hall.name,
            hallName: hall.name || null,
            day,
            slot
          });
          scheduledCount++;
          placed = true;
          break;
        }
        if (placed) break;
      }
      if (!placed) {
        // couldn't place this lecture
      }
    }
  }

  const coverage = totalRequired > 0 ? (scheduledCount / totalRequired) : 0;
  return { schedule, stats: { scheduled: scheduledCount, totalRequired, coverage } };
}

export default { scheduleGreedy };
