import { useNavigate } from "react-router-dom";
import "./home.css";

import building from "../src/assets/SLIIT-Building.jpg";
import campus from "../src/assets/sliit-metro-campus-facilities-7.jpg";
import logo from "../src/assets/SLIIT_LOGO.png";

const FEATURES = [
  {
    icon: "⚡",
    title: "Instant Generation",
    desc: "Produce complete, conflict-free timetables in seconds using advanced scheduling algorithms.",
  },
  {
    icon: "🔒",
    title: "Zero Conflicts",
    desc: "Automatically detect and resolve hall clashes, instructor overlaps, and batch collisions.",
  },
  {
    icon: "👥",
    title: "Multi-Role Access",
    desc: "Tailored dashboards for Coordinators, LICs, Instructors, and Administrative staff.",
  },
  {
    icon: "📊",
    title: "Smart Optimisation",
    desc: "AI-driven slot allocation ensures balanced workloads and optimal resource utilisation.",
  },
];

const TIMETABLE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMETABLE_SLOTS = ["8–9", "9–10", "10–11", "11–12", "1–2", "2–3"];

const CELL_COLORS = [
  "bg-indigo-400/70",
  "bg-emerald-400/70",
  "bg-amber-400/70",
  "bg-rose-400/70",
  "bg-cyan-400/70",
  "bg-violet-400/70",
];

const PRESET_CELLS = {
  "0-0": 0, "0-2": 2, "0-4": 4,
  "1-1": 1, "1-3": 3, "1-5": 5,
  "2-0": 3, "2-2": 1, "2-4": 0,
  "3-1": 4, "3-3": 2, "3-5": 1,
  "4-0": 5, "4-2": 0, "4-4": 3,
};

function MiniTimetable() {
  return (
    <div className="home-timetable-grid" aria-hidden="true">
      <div className="home-tt-corner" />
      {TIMETABLE_SLOTS.map((s) => (
        <div key={s} className="home-tt-header">{s}</div>
      ))}
      {TIMETABLE_DAYS.map((day, di) => (
        <>
          <div key={`day-${di}`} className="home-tt-day">{day}</div>
          {TIMETABLE_SLOTS.map((_, si) => {
            const key = `${di}-${si}`;
            const colorIdx = PRESET_CELLS[key];
            return (
              <div
                key={key}
                className={`home-tt-cell ${colorIdx !== undefined ? CELL_COLORS[colorIdx] : "bg-white/5"}`}
              />
            );
          })}
        </>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-root">
      {/* ── Background images ── */}
      <div className="home-bg-images">
        <img src={building} alt="" className="home-bg-img home-bg-img--left" />
        <img src={campus}   alt="" className="home-bg-img home-bg-img--right" />
      </div>

      {/* ── Gradient overlay ── */}
      <div className="home-overlay" />

      {/* ── Animated grid pattern ── */}
      <div className="home-grid-pattern" aria-hidden="true" />

      {/* ── Floating blobs ── */}
      <div className="home-blob home-blob--a" aria-hidden="true" />
      <div className="home-blob home-blob--b" aria-hidden="true" />

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <div className="home-content">

        {/* Logo + badge */}
        <div className="home-logo-row">
          <img src={logo} alt="SLIIT Logo" className="home-logo" />
          <span className="home-badge">Automatic Timetable Generator</span>
        </div>

        {/* Hero headline */}
        <h1 className="home-headline">
          <span className="home-headline__top">Schedule Smarter.</span>
          <span className="home-headline__bottom">Teach Better.</span>
        </h1>

        <p className="home-subline">
          SLIIT&rsquo;s intelligent scheduling engine builds perfectly optimised,{" "}
          conflict-free academic timetables — automatically.
        </p>

        {/* Mini timetable visual */}
        <div className="home-tt-wrapper">
          <MiniTimetable />
          <div className="home-tt-glow" aria-hidden="true" />
        </div>

        {/* Feature cards */}
        <div className="home-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="home-feature-card">
              <span className="home-feature-icon">{f.icon}</span>
              <h3 className="home-feature-title">{f.title}</h3>
              <p className="home-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="home-stats">
          {[
            { value: "5+", label: "User Roles" },
            { value: "100%", label: "Conflict-Free" },
            { value: "Real-Time", label: "Optimisation" },
            { value: "SLIIT", label: "Trusted By" },
          ].map((s) => (
            <div key={s.label} className="home-stat">
              <span className="home-stat__value">{s.value}</span>
              <span className="home-stat__label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="home-cta-row">
          <button
            className="home-cta-btn home-cta-btn--primary"
            onClick={() => navigate("/login")}
          >
            Get Started &rarr;
          </button>
          <button
            className="home-cta-btn home-cta-btn--ghost"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </div>

        <p className="home-footer-note">
          &copy; {new Date().getFullYear()} SLIIT &mdash; IT Project Management Team
        </p>
      </div>
    </div>
  );
}
