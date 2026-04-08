import { Link, useLocation } from 'react-router-dom';

const Footer = ({ isAuthenticated, user, hasFixedSidebarOffset = false }) => {
  const location = useLocation();
  const year = new Date().getFullYear();
  const shouldOffsetForSidebar = hasFixedSidebarOffset && (
    location.pathname === '/dashboard'
    || location.pathname.startsWith('/faculty')
    || location.pathname.startsWith('/scheduler')
  );

  return (
    <footer className="border-t border-blue-300/30 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-slate-100">
      <div className={`mx-auto grid w-full max-w-none grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-12 xl:px-16 ${shouldOffsetForSidebar ? 'lg:pl-[284px]' : ''}`}>
        <section>
          <h3 className="text-base font-bold tracking-wide text-white">SLIIT Timetable Generator</h3>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/90">
            Intelligent timetable generation platform for faculty scheduling, allocation planning, and academic operations.
          </p>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-100">Quick Links</h4>
          <nav className="mt-3 flex flex-wrap gap-2">
            <Link to="/" className="rounded-md border border-blue-200/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20">Home</Link>
            {!isAuthenticated && (
              <Link to="/login" className="rounded-md border border-blue-200/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20">Login</Link>
            )}
            {isAuthenticated && (
              <Link to="/dashboard" className="rounded-md border border-blue-200/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20">Dashboard</Link>
            )}
            {isAuthenticated && user?.role === 'Faculty Coordinator' && (
              <Link to="/scheduler/by-year" className="rounded-md border border-blue-200/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20">Schedule</Link>
            )}
          </nav>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-100">Contact</h4>
          <ul className="mt-3 space-y-1 text-sm text-blue-100/90">
            <li>Email: timetable.support@sliit.lk</li>
            <li>Campus: SLIIT Malabe</li>
            <li>Status: {isAuthenticated ? `Signed in as ${user?.name || user?.username || 'User'}` : 'Guest session'}</li>
          </ul>
        </section>
      </div>

      <div className={`border-t border-blue-200/20 px-4 py-3 text-center text-xs text-blue-100/80 sm:px-6 lg:px-12 xl:px-16 ${shouldOffsetForSidebar ? 'lg:pl-[284px]' : ''}`}>
        Copyright {year} SLIIT Timetable Generator. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
