// Simple optimizer implementations (GA, PSO, ACO) for timetable scheduling.
// These are not production-grade but provide real search behavior improving coverage and reducing conflicts.

function parseJSONField(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return val; }
}

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri'];
const WEEKEND = ['Sat','Sun'];
const SLOTS = ['09:00-10:00','10:00-11:00','11:00-12:00','13:00-14:00','14:00-15:00'];

function hallMatchesModule(hall, module) {
  const moduleRoomType = String(module?.details?.roomType || module?.details?.room_type || module?.roomType || '').toLowerCase();
  const hallRoomType = String(hall?.features?.roomType || hall?.features?.room_type || '').toLowerCase();

  if (!moduleRoomType || !hallRoomType) return true;
  return hallRoomType.includes(moduleRoomType) || moduleRoomType.includes(hallRoomType);
}

// Build problem sessions and placements
export function buildProblem(constraints = {}) {
  const halls = (constraints.halls || []).map(h => ({...h, features: parseJSONField(h.features)}));
  const modules = (constraints.modules || []).map(m => ({...m, details: parseJSONField(m.details)}));
  const instructors = (constraints.instructors || []).map(i => ({...i, availabilities: parseJSONField(i.availabilities)}));

  // Build sessions: each module may require multiple lectures per week
  const sessions = [];
  modules.forEach(mod => {
    const lectures = Number(mod.lectures_per_week || mod.lectures || (mod.details && mod.details.lectures_per_week) || 1);
    // normalize batch size and day_type
    mod.batch_size = Number(mod.batch_size || (mod.details && mod.details.batch_size) || 60);
    mod.day_type = (mod.day_type || (mod.details && mod.details.day_type) || 'weekday');
    for (let i=0;i<lectures;i++) {
      sessions.push({ module: mod, index: i });
    }
  });

  // placements per session: all combos of day x slot x hall x instructor (filtered by availability)
  const placements = sessions.map(sess => {
    const mod = sess.module;
    const possible = [];
    // choose allowed days based on module day_type
    let allowedDays = WEEKDAYS;
    if (mod.day_type === 'weekend') allowedDays = WEEKEND;
    else if (mod.day_type === 'any' || mod.day_type === 'both') allowedDays = WEEKDAYS.concat(WEEKEND);

    for (const day of allowedDays) {
      for (const slot of SLOTS) {
        for (let hIdx=0; hIdx<halls.length; hIdx++) {
          const hall = halls[hIdx];
          if (!hallMatchesModule(hall, mod)) continue;

          if (!instructors.length) {
            possible.push({ day, slot, hallIndex: hIdx, instructorIndex: null });
            continue;
          }

          for (let insIdx=0; insIdx<instructors.length; insIdx++) {
            const ins = instructors[insIdx];
            // check availability simple: if instructor has specified availabilities, require match
            const avail = ins.availabilities || [];
            let ok = true;
            if (avail && avail.length) {
              const found = avail.find(a => (a.day === day) && (!a.slots || a.slots.includes(slot)));
              if (!found) ok = false;
            }
            if (!ok) continue;
            possible.push({ day, slot, hallIndex: hIdx, instructorIndex: insIdx });
          }
        }
      }
    }
    // if no placements found, fallback to hall-only placements with null instructor
    if (possible.length === 0 && halls.length > 0) {
      for (const day of DAYS) {
        for (const slot of SLOTS) {
          for (let hIdx = 0; hIdx < halls.length; hIdx++) {
            const hall = halls[hIdx];
            if (!hallMatchesModule(hall, mod)) continue;
            possible.push({ day, slot, hallIndex: hIdx, instructorIndex: null });
          }
        }
      }
    }
    return possible;
  });

  return { halls, modules, instructors, sessions, placements, DAYS, SLOTS };
}

// Evaluate a solution: array of placement indices (one per session)
export function evaluateSolution(solution, problem, options = {}) {
  const { halls, modules, instructors, sessions, placements } = problem;
  const schedule = [];
  const conflicts = [];

  // occupancy maps to detect double-bookings: day|slot -> hallIndex -> sessionIndexes[], instructorIndex -> sessionIndexes[]
  const occHall = {}; const occInstr = {};
  const hallUsageMap = {};

  let scheduledCount = 0;
  const totalRequired = sessions.length;

  for (let s=0; s<sessions.length; s++) {
    const choiceIdx = solution[s];
    const placementList = placements[s] || [];

    if (placementList.length === 0) {
      const mod = sessions[s].module;
      conflicts.push({
        type: 'no_hall_or_slot_available',
        session: s,
        moduleId: mod.id || mod.code || mod._id,
      });
      continue;
    }

    const p = placementList[Math.abs(choiceIdx) % placementList.length];
    const mod = sessions[s].module;
    const hall = halls[p.hallIndex];
    const instr = (p.instructorIndex != null) ? instructors[p.instructorIndex] : null;

    const entry = {
      moduleId: mod.id || mod.code || mod._id,
      moduleName: mod.name || null,
      instructorId: instr ? (instr.id||instr._id||instr.email||instr.name) : null,
      instructorName: instr ? instr.name : null,
      hallId: hall ? (hall.id||hall.name) : null,
      hallName: hall ? hall.name : null,
      day: p.day,
      slot: p.slot,
      durationSlots: 1,
      weeks: options.weeks || [1]
    };

    const key = `${p.day}|${p.slot}`;
    if (!occHall[key]) occHall[key] = {};
    if (!occInstr[key]) occInstr[key] = {};

    // check hall double booking
    const hallKey = p.hallIndex;
    if (!occHall[key][hallKey]) occHall[key][hallKey] = [];
    occHall[key][hallKey].push(s);

    // instructor double booking
    if (p.instructorIndex != null) {
      const insKey = p.instructorIndex;
      if (!occInstr[key][insKey]) occInstr[key][insKey] = [];
      occInstr[key][insKey].push(s);
    }

    // capacity violation — use module.batch_size if provided, default to 60
    if (hall && mod) {
      const expected = Number(mod.batch_size || mod.expected_students || (mod.details && mod.details.expected_students) || 60);
      if (expected && hall.capacity && Number(hall.capacity) < expected) {
        conflicts.push({ type: 'capacity_violation', session: s, moduleId: entry.moduleId, hallId: entry.hallId, expected, capacity: hall.capacity });
      }
    }

    // instructor unavailable (if placement chosen had instructor but their availability doesn't include slot)
    if (instr && instr.availabilities && instr.availabilities.length) {
      const found = instr.availabilities.find(a => a.day === p.day && (!a.slots || a.slots.includes(p.slot)));
      if (!found) {
        conflicts.push({ type: 'instructor_unavailable', session: s, instructorId: entry.instructorId, day: p.day, slot: p.slot });
      }
    }

    schedule.push(entry);
    scheduledCount++;

    if (entry.hallId) {
      if (!hallUsageMap[entry.hallId]) {
        hallUsageMap[entry.hallId] = {
          hallId: entry.hallId,
          hallName: entry.hallName || entry.hallId,
          sessions: 0,
        };
      }
      hallUsageMap[entry.hallId].sessions += 1;
    }
  }

  // detect doubles
  for (const key in occHall) {
    for (const h in occHall[key]) {
      const arr = occHall[key][h];
      if (arr.length > 1) {
        conflicts.push({ type: 'hall_double', dayslot: key, hallIndex: Number(h), sessions: arr });
      }
    }
  }
  for (const key in occInstr) {
    for (const ins in occInstr[key]) {
      const arr = occInstr[key][ins];
      if (arr.length > 1) {
        conflicts.push({ type: 'instructor_double', dayslot: key, instructorIndex: Number(ins), sessions: arr });
      }
    }
  }

  // Fitness: prioritize coverage, penalize conflicts
  const coverage = totalRequired > 0 ? (scheduledCount / totalRequired) : 0;
  const conflictPenalty = (options.conflictWeight || 1) * conflicts.length;
  const fitness = coverage - 0.1 * conflictPenalty; // simple
  const hallUsage = Object.values(hallUsageMap).sort((a, b) => b.sessions - a.sessions);

  return {
    schedule,
    stats: {
      scheduled: scheduledCount,
      totalRequired,
      coverage,
      hallsFetched: halls.length,
      hallsUsed: hallUsage.length,
      hallUsage,
    },
    conflicts,
    fitness,
  };
}

// Genetic Algorithm
export function runGA(problem, opts = {}) {
  const popSize = opts.popSize || 50;
  const generations = opts.generations || 100;
  const mutationRate = opts.mutationRate || 0.1;

  const sessions = problem.sessions.length;
  // helper to create random solution
  function randSolution() {
    const sol = new Array(sessions);
    for (let i=0;i<sessions;i++) {
      const choices = problem.placements[i].length;
      sol[i] = Math.floor(Math.random()*choices);
    }
    return sol;
  }

  // initial population: include greedy seeding
  const population = [];
  population.push(...Array.from({length: Math.max(1, Math.floor(popSize*0.2))}, randSolution));
  while (population.length < popSize) population.push(randSolution());

  let best = null;

  for (let gen=0; gen<generations; gen++) {
    const scored = population.map(sol => ({ sol, eval: evaluateSolution(sol, problem, opts) }));
    scored.sort((a,b)=>b.eval.fitness - a.eval.fitness);
    if (!best || scored[0].eval.fitness > best.eval.fitness) best = scored[0];

    // selection + breeding
    const next = [];
    // elitism
    const elites = Math.max(1, Math.floor(popSize*0.1));
    for (let i=0;i<elites;i++) next.push(scored[i].sol.slice());

    while (next.length < popSize) {
      // tournament selection
      function pick() {
        const a = scored[Math.floor(Math.random()*scored.length)].sol;
        const b = scored[Math.floor(Math.random()*scored.length)].sol;
        const ea = evaluateSolution(a, problem, opts).fitness;
        const eb = evaluateSolution(b, problem, opts).fitness;
        return ea>eb? a : b;
      }
      const parentA = pick();
      const parentB = pick();
      // crossover
      const cp = Math.floor(Math.random()*sessions);
      const child = parentA.slice(0,cp).concat(parentB.slice(cp));
      // mutation
      for (let i=0;i<sessions;i++) if (Math.random() < mutationRate) child[i] = Math.floor(Math.random()*problem.placements[i].length);
      next.push(child);
    }
    population.length = 0; population.push(...next);
  }

  const result = evaluateSolution(best.sol, problem, opts);
  return { bestSolution: best.sol, ...result };
}

// PSO
export function runPSO(problem, opts = {}) {
  const swarmSize = opts.swarmSize || 40;
  const iterations = opts.iterations || 80;
  const w = opts.inertia || 0.5;
  const c1 = opts.c1 || 1.5;
  const c2 = opts.c2 || 1.5;

  const sessions = problem.sessions.length;

  // particles: position (real), velocity (real), pbest
  const particles = [];
  function randPos() {
    const pos = new Array(sessions);
    for (let i=0;i<sessions;i++) pos[i] = Math.random()*problem.placements[i].length;
    return pos;
  }
  function randVel() { const v = new Array(sessions); for (let i=0;i<sessions;i++) v[i] = (Math.random()-0.5)*2; return v; }

  let gbest = null;

  for (let i=0;i<swarmSize;i++) {
    const pos = randPos();
    const vel = randVel();
    const solIdx = pos.map((p,idx)=> Math.floor(p)%problem.placements[idx].length);
    const evalR = evaluateSolution(solIdx, problem, opts);
    const pbest = { pos: pos.slice(), eval: evalR, solIdx };
    particles.push({ pos, vel, pbest });
    if (!gbest || evalR.fitness > gbest.eval.fitness) gbest = pbest;
  }

  for (let it=0; it<iterations; it++) {
    for (const p of particles) {
      for (let d=0; d<sessions; d++) {
        const r1 = Math.random(), r2 = Math.random();
        p.vel[d] = w*p.vel[d] + c1*r1*(p.pbest.pos[d]-p.pos[d]) + c2*r2*(gbest.pos[d]-p.pos[d]);
        p.pos[d] += p.vel[d];
        // clamp
        if (p.pos[d] < 0) p.pos[d] = (problem.placements[d].length * 1000) + (p.pos[d] % problem.placements[d].length);
      }
      const solIdx = p.pos.map((v,idx) => Math.abs(Math.floor(v)) % problem.placements[idx].length);
      const evalR = evaluateSolution(solIdx, problem, opts);
      if (evalR.fitness > p.pbest.eval.fitness) { p.pbest = { pos: p.pos.slice(), eval: evalR, solIdx }; }
      if (evalR.fitness > gbest.eval.fitness) gbest = { pos: p.pos.slice(), eval: evalR, solIdx };
    }
  }

  return { bestSolution: gbest.solIdx, ...gbest.eval };
}

// Ant Colony Optimization (constructive)
export function runACO(problem, opts = {}) {
  const ants = opts.ants || 40;
  const iterations = opts.iterations || 80;
  const rho = opts.evaporation || 0.1;

  const sessions = problem.sessions.length;
  // pheromone: for each session and each placement index
  const pher = problem.placements.map(pl => new Array(pl.length).fill(1.0));

  let best = null;
  for (let it=0; it<iterations; it++) {
    const solutions = [];
    for (let a=0;a<ants;a++) {
      const sol = new Array(sessions);
      for (let s=0;s<sessions;s++) {
        const weights = pher[s].map((ph,idx)=> ph);
        // normalize
        const sum = weights.reduce((x,y)=>x+y,0);
        let r = Math.random()*sum;
        let chosen = 0;
        for (let k=0;k<weights.length;k++) { r -= weights[k]; if (r<=0) { chosen = k; break; } }
        sol[s] = chosen;
      }
      const evalR = evaluateSolution(sol, problem, opts);
      solutions.push({ sol, eval: evalR });
      if (!best || evalR.fitness > best.eval.fitness) best = { sol, eval: evalR };
    }
    // evaporate
    for (let s=0;s<pher.length;s++) for (let k=0;k<pher[s].length;k++) pher[s][k] *= (1-rho);
    // reinforce
    for (const solObj of solutions) {
      const reward = Math.max(0, solObj.eval.fitness);
      for (let s=0;s<sessions;s++) pher[s][solObj.sol[s]] += reward;
    }
  }

  return { bestSolution: best.sol, ...best.eval };
}

// Tabu Search
export function runTabu(problem, opts = {}) {
  const sessions = problem.sessions.length;
  const iterations = opts.iterations || 120;
  const tabuTenure = opts.tabuTenure || 10;
  const neighborhoodSize = opts.neighborhoodSize || 60;

  function randSolution() {
    const sol = new Array(sessions);
    for (let i = 0; i < sessions; i++) {
      const choices = problem.placements[i].length;
      sol[i] = Math.floor(Math.random() * choices);
    }
    return sol;
  }

  let current = randSolution();
  let currentEval = evaluateSolution(current, problem, opts);
  let best = { sol: current.slice(), eval: currentEval };

  const tabuMap = new Map();

  function keyForMove(sessionIndex, placementIndex) {
    return `${sessionIndex}:${placementIndex}`;
  }

  for (let it = 0; it < iterations; it++) {
    const neighborhood = [];

    for (let n = 0; n < neighborhoodSize; n++) {
      const sIdx = Math.floor(Math.random() * sessions);
      const choices = problem.placements[sIdx].length;
      if (choices <= 1) continue;

      let newChoice = Math.floor(Math.random() * choices);
      if (newChoice === current[sIdx]) {
        newChoice = (newChoice + 1) % choices;
      }

      const candidate = current.slice();
      candidate[sIdx] = newChoice;
      const candidateEval = evaluateSolution(candidate, problem, opts);
      const moveKey = keyForMove(sIdx, newChoice);
      const tabuUntil = tabuMap.get(moveKey) || -1;
      const isTabu = tabuUntil > it;
      const aspiration = candidateEval.fitness > best.eval.fitness;

      if (!isTabu || aspiration) {
        neighborhood.push({ candidate, eval: candidateEval, moveKey, sIdx, newChoice });
      }
    }

    if (neighborhood.length === 0) continue;

    neighborhood.sort((a, b) => b.eval.fitness - a.eval.fitness);
    const selected = neighborhood[0];

    current = selected.candidate;
    currentEval = selected.eval;

    tabuMap.set(selected.moveKey, it + tabuTenure);

    if (currentEval.fitness > best.eval.fitness) {
      best = { sol: current.slice(), eval: currentEval };
    }
  }

  return { bestSolution: best.sol, ...best.eval };
}

export default { buildProblem, evaluateSolution, runGA, runPSO, runACO, runTabu };
