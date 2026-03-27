import { useNavigate } from "react-router-dom";

import building from "../src/assets/SLIIT-Building.jpg";
import campus from "../src/assets/sliit-metro-campus-facilities-7.jpg";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";

const features = [
  {
    icon: "🗓️",
    title: "Smart Timetabling",
    description: "AI-driven scheduling that resolves conflicts automatically and optimises room and faculty allocation.",
  },
  {
    icon: "🏫",
    title: "Resource Management",
    description: "Real-time visibility into hall availability, faculty workloads, and campus resources.",
  },
  {
    icon: "👨‍🏫",
    title: "Faculty Coordination",
    description: "Centralised control for coordinators to manage batches, staff, and scheduling preferences.",
  },
  {
    icon: "📊",
    title: "Insightful Reports",
    description: "Generate and export timetable snapshots, conflict reports, and resource utilisation summaries.",
  },
];

const stats = [
  { value: "100+", label: "Batches Managed" },
  { value: "50+", label: "Faculty Members" },
  { value: "Zero", label: "Scheduling Conflicts" },
  { value: "24/7", label: "Platform Access" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Background Images */}
      <div className="absolute inset-0 z-[1] flex">
        <img src={building} alt="SLIIT Building" className="h-full w-1/2 scale-105 object-cover" />
        <img src={campus} alt="SLIIT Campus Facilities" className="h-full w-1/2 scale-105 object-cover" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-slate-950/85 via-slate-900/70 to-slate-950/95" />

      {/* Scrollable content */}
      <div className="relative z-[3] flex min-h-screen flex-col">
        {/* Top Nav Bar */}
        <nav className="flex items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-3">
            <img src={sliitLogo} alt="SLIIT Logo" className="h-10 w-auto drop-shadow-lg" />
            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">Sri Lanka Institute of Information Technology</p>
              <p className="text-sm font-bold text-white">Automatic Timetable Generator</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="rounded-full border border-indigo-400/60 bg-indigo-600/80 px-6 py-2 text-sm font-semibold text-white backdrop-blur-md transition duration-200 hover:bg-indigo-500"
          >
            Sign In
          </button>
        </nav>

        {/* Hero Section */}
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            Smart Scheduling Platform
          </span>

          <h1 className="mx-auto mt-2 max-w-4xl text-4xl font-extrabold leading-tight text-white md:text-6xl lg:text-7xl">
            Conflict-Free Timetables,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Driven by Algorithms
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Designed exclusively for SLIIT to build intelligent, conflict-free academic timetables with speed,
            clarity, and confidence — empowering coordinators, lecturers, and administrators.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate("/login")}
              className="group flex items-center gap-2 rounded-full bg-indigo-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-indigo-900/50 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              Get Started
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-white/10 bg-white/5 backdrop-blur-md">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center py-6 px-4 text-center">
                <p className="text-3xl font-extrabold text-indigo-300">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-16 md:px-12">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-indigo-400">Platform Capabilities</p>
            <h2 className="mb-10 text-center text-2xl font-bold text-white md:text-3xl">
              Everything you need to manage academic scheduling
            </h2>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition duration-200 hover:border-indigo-400/40 hover:bg-white/10"
                >
                  <div className="mb-4 text-4xl">{feature.icon}</div>
                  <h3 className="mb-2 text-sm font-bold text-white">{feature.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 pb-16 text-center">
          <div className="mx-auto max-w-2xl rounded-3xl border border-indigo-500/30 bg-indigo-600/10 px-8 py-10 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white md:text-3xl">Ready to transform your scheduling?</h2>
            <p className="mt-3 text-sm text-slate-300">
              Sign in to your coordinator account and start building smarter timetables today.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-10 py-3 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              Sign In to Your Account
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-5 text-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Sri Lanka Institute of Information Technology · Automatic Timetable Generator
          </p>
        </footer>
      </div>
    </div>
  );
}
