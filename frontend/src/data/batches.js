const BATCH_CAPACITY = 120;

export const buildBatches = () => {
  const items = [];

  const addSeries = ({ year, semester, mode, department, count }) => {
    for (let index = 1; index <= count; index += 1) {
      const serial = String(index).padStart(2, '0');
      items.push(`Y${year}.S${semester}.${mode}.${department}.${serial}`);
    }
  };

  const plan = [
    { year: 1, semester: 2, mode: 'WE', department: 'IT', count: 6 },
    { year: 1, semester: 2, mode: 'WD', department: 'IT', count: 18 },
    { year: 2, semester: 1, mode: 'WD', department: 'IT', count: 4 },
    { year: 2, semester: 2, mode: 'WE', department: 'IT', count: 6 },
    { year: 2, semester: 2, mode: 'WD', department: 'IT', count: 8 },
    { year: 3, semester: 1, mode: 'WE', department: 'IT', count: 5 },
    { year: 3, semester: 1, mode: 'WD', department: 'IT', count: 4 },
    { year: 3, semester: 2, mode: 'WE', department: 'IT', count: 4 },
    { year: 3, semester: 2, mode: 'WD', department: 'IT', count: 3 },
    { year: 4, semester: 1, mode: 'WE', department: 'IT', count: 1 },
    { year: 4, semester: 1, mode: 'WD', department: 'IT', count: 1 },

    { year: 2, semester: 2, mode: 'WE', department: 'SE', count: 2 },
    { year: 2, semester: 2, mode: 'WD', department: 'SE', count: 2 },
    { year: 3, semester: 1, mode: 'WE', department: 'SE', count: 2 },
    { year: 3, semester: 1, mode: 'WD', department: 'SE', count: 2 },
    { year: 3, semester: 2, mode: 'WE', department: 'SE', count: 3 },
    { year: 3, semester: 2, mode: 'WD', department: 'SE', count: 1 },
    { year: 4, semester: 1, mode: 'WE', department: 'SE', count: 2 },
    { year: 4, semester: 1, mode: 'WD', department: 'SE', count: 1 },
    { year: 4, semester: 2, mode: 'WE', department: 'SE', count: 1 },
    { year: 4, semester: 2, mode: 'WD', department: 'SE', count: 1 },

    { year: 2, semester: 2, mode: 'WE', department: 'DS', count: 1 },
    { year: 2, semester: 2, mode: 'WD', department: 'DS', count: 1 },
    { year: 3, semester: 1, mode: 'WE', department: 'DS', count: 2 },
    { year: 3, semester: 1, mode: 'WD', department: 'DS', count: 1 },
    { year: 3, semester: 2, mode: 'WE', department: 'DS', count: 2 },
    { year: 3, semester: 2, mode: 'WD', department: 'DS', count: 1 },
    { year: 4, semester: 1, mode: 'WE', department: 'DS', count: 2 },
    { year: 4, semester: 1, mode: 'WD', department: 'DS', count: 1 },
    { year: 4, semester: 2, mode: 'WE', department: 'DS', count: 2 },
    { year: 4, semester: 2, mode: 'WD', department: 'DS', count: 1 },

    { year: 2, semester: 2, mode: 'WE', department: 'CS', count: 1 },
    { year: 2, semester: 2, mode: 'WD', department: 'CS', count: 1 },
    { year: 3, semester: 1, mode: 'WE', department: 'CS', count: 1 },
    { year: 3, semester: 1, mode: 'WD', department: 'CS', count: 1 },
    { year: 3, semester: 2, mode: 'WE', department: 'CS', count: 1 },
    { year: 3, semester: 2, mode: 'WD', department: 'CS', count: 1 },
    { year: 4, semester: 1, mode: 'WE', department: 'CS', count: 1 },
    { year: 4, semester: 1, mode: 'WD', department: 'CS', count: 1 },
    { year: 4, semester: 2, mode: 'WE', department: 'CS', count: 1 },
    { year: 4, semester: 2, mode: 'WD', department: 'CS', count: 1 },

    { year: 2, semester: 2, mode: 'WE', department: 'ISE', count: 1 },
    { year: 2, semester: 2, mode: 'WD', department: 'ISE', count: 1 },
    { year: 3, semester: 1, mode: 'WE', department: 'ISE', count: 1 },
    { year: 3, semester: 1, mode: 'WD', department: 'ISE', count: 1 },
    { year: 3, semester: 2, mode: 'WE', department: 'ISE', count: 1 },
    { year: 3, semester: 2, mode: 'WD', department: 'ISE', count: 1 },
    { year: 4, semester: 1, mode: 'WE', department: 'ISE', count: 1 },
    { year: 4, semester: 1, mode: 'WD', department: 'ISE', count: 1 },
    { year: 4, semester: 2, mode: 'WE', department: 'ISE', count: 1 },
    { year: 4, semester: 2, mode: 'WD', department: 'ISE', count: 1 },

    { year: 2, semester: 2, mode: 'WE', department: 'IM', count: 1 },
    { year: 2, semester: 2, mode: 'WD', department: 'IM', count: 1 },
    { year: 3, semester: 1, mode: 'WE', department: 'IM', count: 1 },
    { year: 3, semester: 1, mode: 'WD', department: 'IM', count: 1 },
    { year: 3, semester: 2, mode: 'WE', department: 'IM', count: 1 },
    { year: 3, semester: 2, mode: 'WD', department: 'IM', count: 1 },
    { year: 4, semester: 1, mode: 'WE', department: 'IM', count: 1 },
    { year: 4, semester: 1, mode: 'WD', department: 'IM', count: 1 },
    { year: 4, semester: 2, mode: 'WE', department: 'IM', count: 1 },
    { year: 4, semester: 2, mode: 'WD', department: 'IM', count: 1 },

    { year: 2, semester: 2, mode: 'WE', department: 'CSNE', count: 1 },
    { year: 2, semester: 2, mode: 'WD', department: 'CSNE', count: 1 },
    { year: 3, semester: 1, mode: 'WE', department: 'CSNE', count: 1 },
    { year: 3, semester: 1, mode: 'WD', department: 'CSNE', count: 1 },
    { year: 3, semester: 2, mode: 'WE', department: 'CSNE', count: 1 },
    { year: 3, semester: 2, mode: 'WD', department: 'CSNE', count: 1 },
    { year: 4, semester: 1, mode: 'WE', department: 'CSNE', count: 1 },
    { year: 4, semester: 2, mode: 'WE', department: 'CSNE', count: 1 },
    { year: 4, semester: 2, mode: 'WD', department: 'CSNE', count: 1 },
  ];

  plan.forEach(addSeries);

  const unique = new Set(items);
  if (items.length !== 130 || unique.size !== 130) {
    throw new Error(`Batch plan must produce exactly 130 unique items. Got ${items.length} total and ${unique.size} unique.`);
  }

  return items;
};

const batches = buildBatches();
const batchObjects = batches.map((id) => ({ id, capacity: BATCH_CAPACITY }));

export default batchObjects;
