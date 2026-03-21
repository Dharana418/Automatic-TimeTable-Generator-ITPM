import { useNavigate } from "react-router-dom";

import building from "../src/assets/SLIIT-Building.jpg";
import campus from "../src/assets/sliit-metro-campus-facilities-7.jpg";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-[1] flex">
        <img src={building} alt="SLIIT Building" className="h-full w-1/2 scale-105 object-cover blur-[1px]" />
        <img src={campus} alt="SLIIT Campus Facilities" className="h-full w-1/2 scale-105 object-cover blur-[1px]" />
      </div>

      <div className="absolute inset-0 z-[2] bg-gradient-to-br from-slate-950/80 via-slate-900/65 to-indigo-950/60" />

      <div className="relative z-[3] flex h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur-xl md:p-12">
          <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">
            Smart Scheduling Platform
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">Driven by Algorithms</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-100 md:text-xl">
            Designed for SLIIT to build conflict-free timetables with speed, clarity, and confidence.
          </p>
        </div>

        <div className="mt-8">
          <button
            className="group rounded-full border border-white/40 bg-white/15 px-12 py-4 text-base font-bold text-white shadow-lg backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white/25"
            onClick={() => navigate("/login")}
          >
            Get Started
            <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
