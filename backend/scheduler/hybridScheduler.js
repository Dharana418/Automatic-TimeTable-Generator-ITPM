import optimizer from './optimizer.js';

export default function hybridScheduler(constraints, options = {}) {
    const problem = optimizer.buildProblem(constraints, options);

    const aco = optimizer.runACO(problem, {
        ...options,
        ants: options.ants || 40,
        iterations: options.acoIterations || Math.max(40, Math.floor((options.iterations || 120) * 0.4)),
    });

    const initialPopulation = [aco.bestSolution];
    const ga = optimizer.runGA(problem, {
        ...options,
        iterations: options.gaIterations || Math.max(80, options.iterations || 120),
        initialPopulation,
    });

    const tabu = optimizer.runTabu(problem, {
        ...options,
        initialSolution: ga.bestSolution,
        iterations: options.tabuIterations || Math.max(120, options.iterations || 160),
        tabuTenure: options.tabuTenure,
        stagnationLimit: options.stagnationLimit,
        probabilisticFallbackRate: options.probabilisticFallbackRate ?? 0.25,
    });

    const chain = {
        aco: {
            fitness: aco.fitness,
            objective: aco.objective,
            stats: aco.stats,
            penaltyBreakdown: aco.penaltyBreakdown,
        },
        ga: {
            fitness: ga.fitness,
            objective: ga.objective,
            stats: ga.stats,
            penaltyBreakdown: ga.penaltyBreakdown,
        },
        tabu: {
            fitness: tabu.fitness,
            objective: tabu.objective,
            stats: tabu.stats,
            penaltyBreakdown: tabu.penaltyBreakdown,
            meta: tabu.meta,
        },
    };

    return {
        algorithm: 'hybrid',
        bestAlgorithm: 'tabu_refined_from_ga_seeded_by_aco',
        schedule: tabu.schedule,
        stats: tabu.stats,
        conflicts: tabu.conflicts,
        fitness: tabu.fitness,
        objective: tabu.objective,
        penaltyBreakdown: tabu.penaltyBreakdown,
        all: chain,
    };
}
