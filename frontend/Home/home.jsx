import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./home.css";

import building from "../src/assets/SLIIT-Building.jpg";
import logo from "../src/assets/SLIIT_LOGO.png";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
// ~55% of cells are filled to give the background grid a realistic, lively appearance
const GRID_FILL_THRESHOLD = 0.45;
const MODULES = [
  { code: "SE3040", name: "Algorithm Design", color: "#6366f1" },
  { code: "IT3030", name: "Database Systems", color: "#0ea5e9" },
  { code: "CS2050", name: "Operating Systems", color: "#10b981" },
  { code: "SE2020", name: "Software Engineering", color: "#f59e0b" },
  { code: "IT4010", name: "Machine Learning", color: "#ec4899" },
  { code: "CS3060", name: "Computer Networks", color: "#8b5cf6" },
  { code: "SE4050", name: "Cloud Computing", color: "#14b8a6" },
  { code: "IT2040", name: "Web Technologies", color: "#f97316" },
];

function AnimatedGrid() {
  const [cells, setCells] = useState([]);

  useEffect(() => {
    const filled = [];
    DAYS.forEach((day, di) => {
      SLOTS.forEach((slot, si) => {
        if (Math.random() > GRID_FILL_THRESHOLD) {
          const mod = MODULES[Math.floor(Math.random() * MODULES.length)];
          filled.push({ day, slot, di, si, ...mod, delay: Math.random() * 2 });
        }
      });
    });
    setCells(filled);
  }, []);

  return (
    <div className="home-grid-bg" aria-hidden="true">
      <div className="home-grid-inner">
        {/* Header row */}
        <div className="home-grid-header">
          <div className="home-grid-time-label" />
          {DAYS.map((d) => (
            <div key={d} className="home-grid-day-label">{d}</div>
          ))}
        </div>
        {/* Body rows */}
        {SLOTS.map((slot) => (
          <div key={slot} className="home-grid-row">
            <div className="home-grid-time-label">{slot}</div>
            {DAYS.map((day) => {
              const cell = cells.find((c) => c.day === day && c.slot === slot);
              return (
                <div key={day} className="home-grid-cell">
                  {cell && (
                    <div
                      className="home-grid-pill"
                      style={{ background: cell.color, animationDelay: `${cell.delay}s` }}
                    >
                      <span className="home-grid-pill-code">{cell.code}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: "⚡",
    title: "Algorithm-Powered",
    desc: "Constraint-satisfaction algorithms generate conflict-free schedules in seconds.",
  },
  {
    icon: "🔄",
    title: "Conflict Resolution",
    desc: "Automatically detects and resolves room, lecturer, and batch collisions.",
  },
  {
    icon: "🏛️",
    title: "Hall Allocation",
    desc: "Smart room booking considers capacity, amenities, and availability together.",
  },
  {
    icon: "👥",
    title: "Role-Based Access",
    desc: "Separate views for Admin, Faculty Coordinator, LIC, Instructors, and Lecturers.",
  },
  {
    icon: "📊",
    title: "Live Analytics",
    desc: "Track utilization rates, lecturer workloads, and scheduling efficiency at a glance.",
  },
  {
    icon: "📤",
    title: "Export Ready",
    desc: "Download polished timetables in print-friendly formats with one click.",
  },
];

const STATS = [
  { value: "500+", label: "Modules Scheduled" },
  { value: "< 3s", label: "Generation Time" },
  { value: "100%", label: "Conflict-Free" },
  { value: "6", label: "Roles Supported" },
];

export default function Home() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="home-root">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="home-hero-section" ref={heroRef}>
        {/* Background photo */}
        <img src={building} alt="SLIIT Building" className="home-hero-bg-img" />
        {/* Animated timetable grid overlay */}
        <AnimatedGrid />
        {/* Dark gradient overlay */}
        <div className="home-hero-overlay" />

        {/* Hero content */}
        <div className="home-hero-content">
          <img src={logo} alt="SLIIT Logo" className="home-hero-logo" />

          <span className="home-hero-badge">
            🎓 Automatic Timetable Generator · SLIIT
          </span>

          <h1 className="home-hero-heading">
            Schedule Smarter,<br />
            <span className="home-hero-accent">Not Harder</span>
          </h1>

          <p className="home-hero-sub">
            Conflict-free, algorithm-driven timetables for Sri Lanka Institute of
            Information Technology — built for every stakeholder on campus.
          </p>

          <div className="home-hero-actions">
            <button
              className="home-btn-primary"
              onClick={() => navigate("/login")}
            >
              Get Started →
            </button>
            <button
              className="home-btn-ghost"
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More ↓
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`home-scroll-indicator${scrolled ? " home-scroll-indicator--hidden" : ""}`}>
          <div className="home-scroll-mouse">
            <div className="home-scroll-dot" />
          </div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="home-stats-bar">
        {STATS.map((s) => (
          <div key={s.label} className="home-stat-item">
            <span className="home-stat-value">{s.value}</span>
            <span className="home-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section ref={featuresRef} className="home-features-section">
        <div className="home-section-inner">
          <p className="home-section-eyebrow">What We Offer</p>
          <h2 className="home-section-heading">Everything You Need to Run a Campus</h2>
          <p className="home-section-sub">
            One intelligent platform that brings administrators, coordinators, and
            teaching staff onto the same page — literally.
          </p>

          <div className="home-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="home-feature-card">
                <span className="home-feature-icon">{f.icon}</span>
                <h3 className="home-feature-title">{f.title}</h3>
                <p className="home-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="home-how-section">
        <div className="home-section-inner">
          <p className="home-section-eyebrow home-eyebrow-light">How It Works</p>
          <h2 className="home-section-heading home-heading-light">Three Steps to a Perfect Timetable</h2>

          <div className="home-steps">
            {[
              { n: "01", title: "Input Constraints", desc: "Define modules, lecturer availability, hall capacities, and batch requirements." },
              { n: "02", title: "Run the Algorithm", desc: "Our scheduler solves the CSP and generates an optimal, conflict-free timetable." },
              { n: "03", title: "Review & Publish", desc: "Coordinators review, adjust if needed, and publish directly to all stakeholders." },
            ].map((step) => (
              <div key={step.n} className="home-step">
                <div className="home-step-number">{step.n}</div>
                <div className="home-step-body">
                  <h3 className="home-step-title">{step.title}</h3>
                  <p className="home-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="home-cta-section">
        <div className="home-cta-inner">
          <h2 className="home-cta-heading">Ready to Transform Scheduling at SLIIT?</h2>
          <p className="home-cta-sub">
            Log in with your institutional account and let the algorithm do the heavy lifting.
          </p>
          <button className="home-btn-primary home-btn-large" onClick={() => navigate("/login")}>
            Sign In Now →
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <img src={logo} alt="SLIIT" className="home-footer-logo" />
        <p className="home-footer-text">
          © {new Date().getFullYear()} SLIIT — Automatic Timetable Generator. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
