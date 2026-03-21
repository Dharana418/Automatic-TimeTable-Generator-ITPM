// Hybrid Scheduler (Genetic + Ant Colony + PSO + Tabu) for Faculty Coordinator

import psoScheduler from './psoScheduler.js';
import antColonyScheduler from './antColonyScheduler.js';
import geneticScheduler from './geneticScheduler.js';
import tabuScheduler from './tabuScheduler.js';

export default function hybridScheduler(constraints, options = {}) {
    const results = {
        pso: psoScheduler(constraints, options),
        ant: antColonyScheduler(constraints, options),
        genetic: geneticScheduler(constraints, options),
        tabu: tabuScheduler(constraints, options),
    };

    const scoreOf = (r) => {
        if (!r) return Number.NEGATIVE_INFINITY;
        const coverage = Number(r.stats?.coverage || 0);
        const conflicts = Number(r.conflicts?.length || 0);
        const fitness = Number(r.fitness ?? 0);
        return fitness + coverage - conflicts * 0.05;
    };

    const ranked = Object.entries(results).sort((a, b) => scoreOf(b[1]) - scoreOf(a[1]));
    const [bestAlgorithm, chosen] = ranked[0];

    return {
        algorithm: 'hybrid',
        bestAlgorithm,
        schedule: chosen.schedule,
        stats: chosen.stats,
        conflicts: chosen.conflicts,
        fitness: chosen.fitness,
        all: results,
    };
}
