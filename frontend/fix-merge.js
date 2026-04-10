const fs = require('fs');

function fixNavigation() {
  let nav = fs.readFileSync('src/components/Navigation.jsx', 'utf8');

  if (nav.includes('<<<<<<< HEAD')) {
    nav = nav.replace('const Navigation = ({ isAuthenticated, user, apiBase = "http://localhost:5000", hasFixedSidebarOffset = false }) => {', 'const Navigation = ({ isAuthenticated, user, apiBase = "http://localhost:5000", theme, onToggleTheme, hasFixedSidebarOffset = false }) => {');
    
    if (!nav.includes('const displayName =')) {
      nav = nav.replace('    const navBtnBase =', '    const displayName = user?.name || user?.username || "";\n    const displayRole = user?.role || "";\n    const shouldShowName = Boolean(displayName);\n    const profilePhoto = user?.profilePhoto || null;\n\n    const navBtnBase =');
    }

    let startMarker = nav.indexOf('<<<<<<< HEAD');
    let splitMarker = nav.indexOf('=======', startMarker);
    let endMarker = nav.indexOf('>>>>>>>', splitMarker);
    let endMarkerEnd = nav.indexOf('\n', endMarker);

    if (endMarkerEnd === -1) endMarkerEnd = nav.length;

    let headCode = nav.substring(nav.indexOf('\n', startMarker) + 1, splitMarker);

    headCode = headCode.replace('<nav className="', '<nav className={`').replace('supports-[backdrop-filter]:bg-white/60">', 'supports-[backdrop-filter]:bg-white/60 ${shouldOffsetForSidebar ? \'lg:pl-[284px]\' : \'\'}`}>');

    nav = nav.substring(0, startMarker) + headCode + nav.substring(endMarkerEnd + 1);
    fs.writeFileSync('src/components/Navigation.jsx', nav);
    console.log('Navigation.jsx fixed');
  } else {
    console.log('Navigation.jsx already fixed');
  }
}

function fixFooter() {
  let footer = fs.readFileSync('src/components/Footer.jsx', 'utf8');
  if (footer.includes('<<<<<<< HEAD')) {
    let startF = footer.indexOf('<<<<<<< HEAD');
    let splitF = footer.indexOf('=======', startF);
    let endF = footer.indexOf('>>>>>>>', splitF);
    let endFEnd = footer.indexOf('\n', endF);
    if (endFEnd === -1) endFEnd = footer.length;

    let headFooter = footer.substring(footer.indexOf('\n', startF) + 1, splitF);
    headFooter = headFooter.replace('const Footer = () => {', 'const Footer = ({ isAuthenticated, user, hasFixedSidebarOffset = false }) => {\n    const location = useLocation();\n    const shouldOffsetForSidebar = hasFixedSidebarOffset && (location.pathname === "/dashboard" || location.pathname.startsWith("/faculty") || location.pathname.startsWith("/scheduler"));');
    
    if (!headFooter.includes('useLocation')) {
      headFooter = "import { useLocation } from 'react-router-dom';\n" + headFooter;
    }
    
    headFooter = headFooter.replace('<footer className="mt-auto', '<footer className={`mt-auto').replace('dark:bg-slate-950/80">', 'dark:bg-slate-950/80 ${shouldOffsetForSidebar ? \'lg:pl-[284px]\' : \'\'}`}>');

    footer = footer.substring(0, startF) + headFooter + footer.substring(endFEnd + 1);
    fs.writeFileSync('src/components/Footer.jsx', footer);
    console.log('Footer.jsx fixed');
  } else {
    console.log('Footer.jsx already fixed');
  }
}

fixNavigation();
fixFooter();
