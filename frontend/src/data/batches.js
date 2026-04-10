const SUBGROUP_CAPACITY = 60;

const yearlyPlan = {
  1: [
    { specialization: 'IT', capacity: 1000 },
    { specialization: 'SE', capacity: 300 },
    { specialization: 'DS', capacity: 300 },
    { specialization: 'ISE', capacity: 200 },
    { specialization: 'IM', capacity: 50 },
    { specialization: 'CYBER SECURITY', capacity: 150 },
  ],
  2: [
    { specialization: 'IT', capacity: 1000 },
    { specialization: 'SE', capacity: 300 },
    { specialization: 'DS', capacity: 300 },
    { specialization: 'ISE', capacity: 200 },
    { specialization: 'IM', capacity: 50 },
    { specialization: 'CYBER SECURITY', capacity: 150 },
  ],
  3: [
    { specialization: 'IT', capacity: 1000 },
    { specialization: 'SE', capacity: 300 },
    { specialization: 'DS', capacity: 300 },
    { specialization: 'ISE', capacity: 200 },
    { specialization: 'IM', capacity: 50 },
    { specialization: 'CYBER SECURITY', capacity: 200 },
  ],
  4: [
    { specialization: 'IT', capacity: 1000 },
    { specialization: 'SE', capacity: 300 },
    { specialization: 'DS', capacity: 300 },
    { specialization: 'ISE', capacity: 200 },
    { specialization: 'IM', capacity: 50 },
    { specialization: 'CYBER SECURITY', capacity: 200 },
  ],
};

const buildBatchId = ({ year, semester, mode, specialization, group, subgroup }) => {
  const groupToken = String(group).padStart(2, '0');
  const subgroupToken = String(subgroup).padStart(2, '0');
  return `Y${year}.S${semester}.${mode}.${specialization}.${groupToken}.${subgroupToken}`;
};

const splitStudentsIntoBatches = ({ year, semester, mode, specialization, capacity }) => {
  const rows = [];
  let remaining = Number(capacity || 0);
  let group = 1;
  let subgroup = 1;

  while (remaining > 0) {
    const subgroupCapacity = Math.min(SUBGROUP_CAPACITY, remaining);
    rows.push({
      id: buildBatchId({ year, semester, mode, specialization, group, subgroup }),
      capacity: subgroupCapacity,
    });

    remaining -= subgroupCapacity;
    subgroup += 1;

    if (subgroup > 2) {
      subgroup = 1;
      group += 1;
    }
  }

  return rows;
};

const batchObjects = [];

for (const year of [1, 2, 3, 4]) {
  for (const semester of [1, 2]) {
    const mode = semester === 1 ? 'WD' : 'WE';

    for (const plan of yearlyPlan[year]) {
      batchObjects.push(
        ...splitStudentsIntoBatches({
          year,
          semester,
          mode,
          specialization: plan.specialization,
          capacity: plan.capacity,
        })
      );
    }
  }
}

export default batchObjects;
