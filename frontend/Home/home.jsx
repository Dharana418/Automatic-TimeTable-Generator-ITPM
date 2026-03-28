import { useNavigate } from "react-router-dom";

import building from "../src/assets/SLIIT-Building.jpg";
import campus from "../src/assets/sliit-metro-campus-facilities-7.jpg";
import logo from "../src/assets/SLIIT_LOGO.png";

const FEATURES = [
  {
    icon: "🧬",
    title: "Genetic Algorithm",
    desc: "Evolves optimal timetable solutions generation by generation, eliminating scheduling conflicts automatically.",
  },
  {
    icon: "🐝",
    title: "Ant Colony Optimization",
    desc: "Swarm intelligence finds the shortest path to the perfect schedule, just like nature intended.",
  },
  {
    icon: "🔵",
    title: "Particle Swarm Optimization",
    desc: "Particles converge on the global optimum, ensuring no two classes clash across halls or time slots.",
  },
  {
    icon: "🚫",
    title: "Tabu Search",
    desc: "Escapes local optima using a memory-guided strategy, producing consistently high-quality schedules.",
  },
  {
    icon: "⚡",
    title: "Hybrid Scheduler",
    desc: "Combines multiple algorithms for unmatched accuracy — the best of every approach in one run.",
  },
  {
    icon: "🏛️",
    title: "Smart Hall Allocation",
    desc: "Automatically matches lecture halls to batches by capacity, type, and amenity requirements.",
  },
];

const STATS = [
  { value: "5+", label: "AI Algorithms" },
  { value: "<2s", label: "Schedule Generation" },
  { value: "100%", label: "Conflict-Free" },
  { value: "6", label: "Role Dashboards" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Configure Modules", desc: "Add courses, batches, lecturers and hall resources through role-specific dashboards." },
  { step: "02", title: "Choose Algorithm", desc: "Select from Genetic, PSO, ACO, Tabu or Hybrid scheduling engines." },
  { step: "03", title: "Generate", desc: "The AI engine produces a conflict-free timetable in seconds." },
  { step: "04", title: "Review & Publish", desc: "Coordinators review, fine-tune, and publish the final schedule instantly." },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-hidden bg-slate-950 text-white">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background imagery */}
        <div className="absolute inset-0 z-[1] flex">
          <img src={building} alt="SLIIT Building" className="h-full w-1/2 scale-110 object-cover" />
          <img src={campus} alt="SLIIT Campus" className="h-full w-1/2 scale-110 object-cover" />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-slate-950/70 via-slate-900/60 to-slate-950" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-indigo-950/40 via-transparent to-indigo-950/40" />

        {/* Decorative grid */}
        <div
          className="absolute inset-0 z-[2] opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Hero content */}
        <div className="relative z-[3] flex min-h-screen flex-col items-center justify-center px-4 py-24">
          {/* Logo + badge row */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <img src={logo} alt="SLIIT Logo" className="h-14 w-auto drop-shadow-xl" />
            <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300 backdrop-blur-sm">
              Smart Scheduling Platform · SLIIT
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-center text-5xl font-black leading-tight tracking-tight md:text-7xl lg:text-8xl">
            <span className="block text-white drop-shadow-lg">Timetables,</span>
            <span
              className="block"
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Perfected by AI
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-slate-300 md:text-xl">
            Harness the power of Genetic Algorithms, PSO, ACO, Tabu Search and Hybrid Scheduling
            to generate conflict-free timetables for every faculty, batch and hall — in seconds.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate("/login")}
              className="group relative overflow-hidden rounded-full bg-indigo-600 px-10 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("features");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-white/25 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20"
            >
              Explore Features ↓
            </button>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center backdrop-blur-md">
                <p className="text-3xl font-black text-indigo-300">{s.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 z-[3] -translate-x-1/2 flex flex-col items-center gap-1 opacity-60">
          <span className="text-xs text-slate-400 tracking-widest uppercase">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-slate-400 to-transparent" />
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="bg-slate-950 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Capabilities
            </span>
            <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">
              Powered by Six{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #818cf8, #c084fc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Intelligent Engines
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Every scheduling engine is purpose-built to eliminate conflicts and maximise resource utilisation across the entire university.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-2xl transition-all duration-300 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="bg-gradient-to-b from-slate-950 to-indigo-950/30 px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-purple-400">
              How It Works
            </span>
            <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">From Setup to Schedule in Minutes</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative flex flex-col">
                {/* Connector line (not on last item) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute top-5 left-full hidden h-px w-8 bg-gradient-to-r from-indigo-500/60 to-transparent lg:block" />
                )}
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/10 text-xs font-black text-indigo-400">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-indigo-950 px-4 py-24 text-center">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, rgba(99,102,241,0.6) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(192,132,252,0.4) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="text-4xl font-black text-white md:text-5xl">Ready to Build Smarter Schedules?</h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-300">
            Join SLIIT coordinators, lecturers and administrators already using the Automatic TimeTable Generator.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-10 rounded-full bg-white px-12 py-4 text-base font-black text-indigo-700 shadow-xl shadow-indigo-900/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50"
          >
            Sign In to Your Dashboard →
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-800 px-4 py-8 text-center text-xs text-slate-500">
        <img src={logo} alt="SLIIT" className="mx-auto mb-3 h-8 w-auto opacity-50" />
        <p>© {new Date().getFullYear()} SLIIT — Automatic TimeTable Generator · All rights reserved.</p>
      </footer>
    </div>
  );
}
