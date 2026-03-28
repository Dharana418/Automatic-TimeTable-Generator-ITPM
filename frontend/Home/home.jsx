import { useNavigate } from "react-router-dom";

import building from "../src/assets/SLIIT-Building.jpg";
import campus from "../src/assets/sliit-metro-campus-facilities-7.jpg";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background images */}
      <div className="absolute inset-0 z-[1] flex">
        <img src={building} alt="SLIIT Building" className="h-full w-1/2 scale-105 object-cover" />
        <img src={campus} alt="SLIIT Campus" className="h-full w-1/2 scale-105 object-cover" />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-br from-slate-950/90 via-slate-900/75 to-indigo-950/70" />

      {/* Content */}
      <div className="relative z-[3] flex min-h-screen flex-col">
        {/* Top nav bar */}
        <header className="flex items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-lg">
              ST
            </div>
            <span className="text-sm font-bold text-white tracking-tight">SLIIT Scheduler</span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            Sign In
          </button>
        </header>

        {/* Hero */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Smart Scheduling Platform
          </span>

          <h1 className="text-4xl font-black leading-tight text-white drop-shadow-lg md:text-6xl lg:text-7xl">
            Driven by
            <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Algorithms
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Designed for SLIIT to build conflict-free timetables with speed, clarity, and confidence.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate("/login")}
              className="group flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-900/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-900/50"
            >
              Get Started
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-2xl border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
            >
              Learn More
            </button>
          </div>

          {/* Feature pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {['Conflict-Free Scheduling', 'Role-Based Access', 'Real-Time Updates', 'Smart Optimization'].map((feat) => (
              <span
                key={feat}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm"
              >
                ✓ {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} SLIIT Automatic Timetable Generator
        </footer>
      </div>
    </div>
  );
}
