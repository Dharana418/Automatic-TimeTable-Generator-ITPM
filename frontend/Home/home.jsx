import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import "./home.css";
import building from "../src/assets/SLIIT-Building.jpg";
import campus from "../src/assets/sliit-metro-campus-facilities-7.jpg";
import sliitHD from "../src/assets/SliitHD.jpg";
import logo from "../src/assets/SLIIT_LOGO.png";

const FEATURES = [
  {
    icon: "⚡",
    title: "Instant Generation",
    desc: "Produce complete, conflict-free timetables in seconds using advanced scheduling algorithms.",
  },
  {
    icon: "🔒",
    title: "Conflict Detection",
    desc: "Automatically detect and resolve room, lecturer, and batch clashes before they happen.",
  },
  {
    icon: "👥",
    title: "Multi-Role Access",
    desc: "Tailored dashboards for Faculty Coordinators, LICs, Lecturers, and Administrators.",
  },
  {
    icon: "📊",
    title: "Smart Analytics",
    desc: "Track resource utilisation, hall allocation, and workload distribution at a glance.",
  },
];

const STATS = [
  { value: "100%", label: "Conflict-Free" },
  { value: "4+", label: "Role Levels" },
  { value: "∞", label: "Iterations" },
  { value: "24/7", label: "Availability" },
];

const PARTICLE_COUNT = 60;
const CONNECTION_THRESHOLD = 110;

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.x += d.dx;
        d.y += d.dy;
        if (d.x < 0 || d.x > canvas.width) d.dx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.dy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${d.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
          if (dist < CONNECTION_THRESHOLD) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(148,163,184,${0.12 * (1 - dist / CONNECTION_THRESHOLD)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="home-particle-canvas" />;
}

export default function Home() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-root">
      {/* ── HERO ── */}
      <section className="home-hero-section">
        {/* Background images */}
        <div className="home-bg-images">
          <img src={building} alt="SLIIT Building" className="home-bg-img" />
          <img src={campus} alt="SLIIT Campus" className="home-bg-img" />
        </div>

        {/* Gradient overlay */}
        <div className="home-gradient-overlay" />

        {/* Animated particle network */}
        <ParticleCanvas />

        {/* Hero content */}
        <div className="home-hero-content">
          {/* Logo badge */}
          <div className="home-logo-badge">
            <img src={logo} alt="SLIIT Logo" className="home-logo-img" />
          </div>

          {/* Pill tag */}
          <span className="home-pill">Smart Scheduling Platform</span>

          {/* Headline */}
          <h1 className="home-headline">
            Driven by <span className="home-headline-accent">Algorithms</span>
          </h1>

          {/* Sub-headline */}
          <p className="home-subheadline">
            Built for SLIIT — generate conflict-free timetables with speed,
            clarity, and confidence.
          </p>

          {/* CTA buttons */}
          <div className="home-cta-group">
            <button className="home-cta-primary" onClick={() => navigate("/login")}>
              Get Started
              <span className="home-cta-arrow">→</span>
            </button>
            <button className="home-cta-secondary" onClick={scrollToFeatures}>
              Learn More
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="home-scroll-indicator">
          <span className="home-scroll-dot" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="home-features" ref={featuresRef} className="home-features-section">
        <div className="home-section-inner">
          <span className="home-section-pill">What We Offer</span>
          <h2 className="home-section-title">Everything You Need to Schedule Smarter</h2>
          <p className="home-section-sub">
            One platform powering academic timetabling across departments, roles, and campuses.
          </p>

          <div className="home-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="home-feature-card">
                <div className="home-feature-icon">{f.icon}</div>
                <h3 className="home-feature-title">{f.title}</h3>
                <p className="home-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="home-stats-section">
        <div className="home-stats-bg">
          <img src={sliitHD} alt="SLIIT campus" className="home-stats-bg-img" />
          <div className="home-stats-overlay" />
        </div>
        <div className="home-stats-inner">
          {STATS.map((s) => (
            <div key={s.label} className="home-stat-item">
              <span className="home-stat-value">{s.value}</span>
              <span className="home-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="home-final-cta-section">
        <div className="home-final-cta-inner">
          <h2 className="home-final-title">Ready to Automate Your Timetable?</h2>
          <p className="home-final-sub">
            Join your faculty and start building intelligent, constraint-aware schedules today.
          </p>
          <button className="home-cta-primary home-final-btn" onClick={() => navigate("/login")}>
            Sign In to Start
            <span className="home-cta-arrow">→</span>
          </button>
        </div>
      </section>
    </div>
  );
}
