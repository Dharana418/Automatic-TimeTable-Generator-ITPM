import optimizer from './optimizer.js';

export default function tabuScheduler(constraints, options = {}) {
  const problem = optimizer.buildProblem(constraints);
  const result = optimizer.runTabu(problem, options);
  return {
    schedule: result.schedule,
    stats: result.stats,
    conflicts: result.conflicts,
    fitness: result.fitness,
  };
}
