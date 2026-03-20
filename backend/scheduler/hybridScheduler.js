// Hybrid Scheduler (Ant Colony + PSO) for Faculty Coordinator
// This is a stub. Implement the algorithm logic as needed.

import psoScheduler from './psoScheduler.js';
import antColonyScheduler from './antColonyScheduler.js';
import geneticScheduler from './geneticScheduler.js';

export default function hybridScheduler(constraints, options = {}) {
        // Run each algorithm stub and pick the solution with best coverage
        const results = {};
        const pso = psoScheduler(constraints, options);
        results.pso = pso;
        const ant = antColonyScheduler(constraints, options);
        results.ant = ant;
        const genetic = geneticScheduler(constraints, options);
        results.genetic = genetic;

        // choose best by coverage (scheduled/required)
        function coverageOf(r) {
            if (!r || !r.stats) return 0;
            return r.stats.coverage || 0;
        }

        const chosen = [pso, ant, genetic].reduce((best, cur) => {
            return coverageOf(cur) > coverageOf(best) ? cur : best;
        }, pso);

        return { chosen, all: results };
}
