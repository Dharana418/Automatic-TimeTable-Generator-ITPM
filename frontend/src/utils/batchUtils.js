import batchObjects from '../data/batches.js';

/**
 * Parse batch ID to extract components
 * Format: Y{year}.S{semester}.{type}.{specialization}.{number}
 */
export const parseBatchId = (id) => {
  const parts = String(id).split('.');
  if (parts.length < 5) return null;
  
  return {
    year: parts[0],      // Y1, Y2, Y3, Y4
    semester: parts[1],  // S1, S2
    type: parts[2],      // WE, WD
    specialization: parts[3], // IT, CS, SE, DS, etc.
    number: parts[4],

  };
};

/**
 * Aggregate batch data by year/semester
 * Returns array of { label, value, name } for pie chart
 */
export const aggregateBatchesByYearSemester = () => {
  const aggregated = {};
  
  batchObjects.forEach((batch) => {
    const parsed = parseBatchId(batch.id);
    if (!parsed) return;
    
    const key = `${parsed.year} - ${parsed.semester}`;
    if (!aggregated[key]) {
      aggregated[key] = 0;
    }
    aggregated[key] += batch.capacity;
  });
  
  return Object.entries(aggregated).map(([label, value]) => ({
    name: label,
    value,
    label,
  }));
};

/**
 * Aggregate batch data by specialization
 * Returns array of { label, value, name } for pie chart
 */
export const aggregateBatchesBySpecialization = () => {
  const aggregated = {};
  
  batchObjects.forEach((batch) => {
    const parsed = parseBatchId(batch.id);
    if (!parsed) return;
    
    const spec = parsed.specialization;
    if (!aggregated[spec]) {
      aggregated[spec] = 0;
    }
    aggregated[spec] += batch.capacity;
  });
  
  return Object.entries(aggregated).map(([label, value]) => ({
    name: label,
    value,
    label,
  }));
};

/**
 * Aggregate batch data by year
 * Returns array of { label, value, name } for pie chart
 */
export const aggregateBatchesByYear = () => {
  const aggregated = {};
  
  batchObjects.forEach((batch) => {
    const parsed = parseBatchId(batch.id);
    if (!parsed) return;
    
    const year = parsed.year;
    if (!aggregated[year]) {
      aggregated[year] = 0;
    }
    aggregated[year] += batch.capacity;
  });
  
  return Object.entries(aggregated).map(([label, value]) => ({
    name: label,
    value,
    label,
  }));
};

/**
 * Aggregate batch data by year and specialization combined
 * Returns array of { label, value, name } for pie chart
 */
export const aggregateBatchesByYearAndSpecialization = () => {
  const aggregated = {};
  
  batchObjects.forEach((batch) => {
    const parsed = parseBatchId(batch.id);
    if (!parsed) return;
    
    const key = `${parsed.year} - ${parsed.specialization}`;
    if (!aggregated[key]) {
      aggregated[key] = 0;
    }
    aggregated[key] += batch.capacity;
  });
  
  return Object.entries(aggregated).map(([label, value]) => ({
    name: label,
    value,
    label,
  }));
};

/**
 * Get color for specialization
 */
export const getSpecializationColor = (spec) => {
  const colors = {
    'IT': '#38bdf8',
    'SE': '#a78bfa',
    'DS': '#f59e0b',
    'ISE': '#f472b6',
    'CS': '#60a5fa',
    'CSNE': '#34d399',
    'IM': '#fb923c',
    'CN': '#818cf8',
  };
  return colors[spec] || '#94a3b8';
};
