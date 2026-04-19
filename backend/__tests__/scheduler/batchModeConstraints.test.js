import { buildProblem } from '../../scheduler/optimizer.js';

const makeProblem = ({ batchId, dayType = 'any' }) => buildProblem(
  {
    halls: [
      {
        id: 'hall-1',
        name: 'Main Hall',
        capacity: 120,
        features: { hallType: 'Lecture Hall' },
      },
    ],
    modules: [
      {
        id: 'module-1',
        code: 'IT1010',
        name: 'Foundations',
        batch_size: 60,
        day_type: dayType,
        details: {
          batch_id: batchId,
          day_type: dayType,
          lectures_per_week: 1,
        },
      },
    ],
    batches: [
      {
        id: batchId,
        name: batchId,
        capacity: 60,
      },
    ],
    instructors: [],
  },
  {
    logicalScheduling: true,
    fixedSessionBlueprint: true,
    lectureSessionsPerWeek: 1,
    labSessionsPerWeek: 0,
    tutorialSessionsPerWeek: 0,
  }
);

describe('Batch mode timetable constraints', () => {
  it('keeps weekday batches on weekdays only', () => {
    const problem = makeProblem({ batchId: 'Y1.S1.WD.IT.01.01', dayType: 'any' });
    const placementDays = new Set(problem.placements[0].map((placement) => placement.day));

    expect(placementDays.has('Sat')).toBe(false);
    expect(placementDays.has('Sun')).toBe(false);
    expect([...placementDays].every((day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day))).toBe(true);
  });

  it('keeps weekend batches on weekend days only', () => {
    const problem = makeProblem({ batchId: 'Y1.S1.WE.IT.01.01', dayType: 'any' });
    const placementDays = new Set(problem.placements[0].map((placement) => placement.day));

    expect(placementDays.has('Mon')).toBe(false);
    expect(placementDays.has('Tue')).toBe(false);
    expect(placementDays.has('Wed')).toBe(false);
    expect(placementDays.has('Thu')).toBe(false);
    expect(placementDays.has('Fri')).toBe(false);
    expect([...placementDays].every((day) => ['Sat', 'Sun'].includes(day))).toBe(true);
  });
});