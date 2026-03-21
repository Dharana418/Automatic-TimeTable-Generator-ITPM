// Tabu Search scheduler implementation
import { buildProblem, evaluateSolution } from './optimizer.js';

function randSolution(problem) {
  const sessions = problem.sessions.length;
  const sol = new Array(sessions);
  for (let i = 0; i < sessions; i++) {
    sol[i] = Math.floor(Math.random() * problem.placements[i].length);
  }
  return sol;
}

function cloneSolution(sol) { return sol.slice(); }

export default function tabuScheduler(constraints = {}, options = {}) {
  const problem = buildProblem(constraints);
  const iterations = options.iterations || 200;
  const tabuTenure = options.tabuTenure || Math.max(5, Math.floor(problem.sessions.length * 0.1));
  const neighborLimit = options.neighborLimit || 200;

  // initial solution
  let current = randSolution(problem);
  let currentEval = evaluateSolution(current, problem, options);
  let best = cloneSolution(current);
  let bestEval = currentEval;

  // tabu list: map from moveKey -> remaining tenure
  const tabu = new Map();

  function decTabu() {
    for (const k of Array.from(tabu.keys())) {
      const v = tabu.get(k) - 1;
      if (v <= 0) tabu.delete(k); else tabu.set(k, v);
    }
  }

  function moveKey(sessionIdx, value) { return `${sessionIdx}:${value}`; }

  for (let it = 0; it < iterations; it++) {
    let bestNeighbor = null;
    let bestNeighborEval = null;
    // generate neighbors (random sample up to neighborLimit)
    const sessionsCount = problem.sessions.length;
    const tried = new Set();
    for (let n = 0; n < neighborLimit; n++) {
      const s = Math.floor(Math.random() * sessionsCount);
      const choices = problem.placements[s].length;
      if (choices <= 1) continue;
      let newChoice = Math.floor(Math.random() * choices);
      const key = `${s}:${newChoice}`;
      if (newChoice === current[s]) continue;
      if (tried.has(key)) continue;
      tried.add(key);

      // skip tabu unless aspiration (improves best)
      const isTabu = tabu.has(moveKey(s, newChoice));

      const cand = cloneSolution(current);
      cand[s] = newChoice;
      const evalR = evaluateSolution(cand, problem, options);

      if (isTabu && evalR.fitness <= bestEval.fitness) continue;

      if (!bestNeighbor || evalR.fitness > bestNeighborEval.fitness) {
        bestNeighbor = cand;
        bestNeighborEval = evalR;
      }
    }

    if (!bestNeighbor) {
      // no neighbor found, random restart
      current = randSolution(problem);
      currentEval = evaluateSolution(current, problem, options);
      if (currentEval.fitness > bestEval.fitness) { best = cloneSolution(current); bestEval = currentEval; }
      continue;
    }

    // apply best neighbor
    // determine move (first differing session)
    let appliedMove = null;
    for (let i = 0; i < current.length; i++) {
      if (current[i] !== bestNeighbor[i]) { appliedMove = { s: i, from: current[i], to: bestNeighbor[i] }; break; }
    }

    current = bestNeighbor;
    currentEval = bestNeighborEval;

    // aspiration: update global best
    if (currentEval.fitness > bestEval.fitness) {
      best = cloneSolution(current);
      bestEval = currentEval;
    }

    // add reverse move to tabu to prevent immediate backtracking
    if (appliedMove) {
      tabu.set(moveKey(appliedMove.s, appliedMove.from), tabuTenure);
    }

    decTabu();
  }

  // return best found schedule and stats
  return { schedule: bestEval.schedule, stats: bestEval.stats, conflicts: bestEval.conflicts, fitness: bestEval.fitness };
}
