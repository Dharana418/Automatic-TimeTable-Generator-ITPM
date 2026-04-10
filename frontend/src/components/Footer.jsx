import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, MapPin, Phone, GraduationCap, Landmark, BookOpenCheck, ShieldCheck, Clock3, ArrowUp } from 'lucide-react';
import autoschedule from '../assets/SLIIT_LOGO.png';

const Footer = ({ isAuthenticated, user, hasFixedSidebarOffset = false }) => {
    const currentYear = new Date().getFullYear();
    const location = useLocation();
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 380);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const backToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    };

    const shouldOffsetForSidebar = hasFixedSidebarOffset && (
        location.pathname === '/dashboard'
        || location.pathname.startsWith('/faculty')
        || location.pathname.startsWith('/scheduler')
        || location.pathname.startsWith('/academic')
        || location.pathname.startsWith('/admin')
    );

    return (
        <footer className={`relative z-30 mt-auto border-t border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white transition-all duration-300 ${shouldOffsetForSidebar ? 'lg:pl-[260px]' : ''}`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/10 via-white/5 to-transparent backdrop-blur-[1px]" />
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1 lg:col-span-2">
                        <Link to="/" className="group flex items-center gap-3 no-underline outline-none">
                            <img 
                                src={autoschedule} 
                                alt="SLIIT Logo" 
                                className="h-10 w-auto object-contain drop-shadow-sm transition-all duration-300 group-hover:brightness-110" 
                            />
                            <h2 className="m-0 text-xl font-extrabold tracking-tight text-white">
                                SLIIT Scheduler
                            </h2>
                        </Link>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/60 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                <GraduationCap className="h-3.5 w-3.5" />
                                Academic-first
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                                <BookOpenCheck className="h-3.5 w-3.5" />
                                Rule-based Scheduling
                            </span>
                        </div>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100">
                            The next-generation smart timetable generation and resource allocation platform designed exclusively for the Sri Lanka Institute of Information Technology.
                        </p>
                        <div className="mt-6 flex gap-4">
                            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-100">
                                <Landmark className="h-4 w-4 text-cyan-300" />
                                Malabe Campus
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-100">
                                <Clock3 className="h-4 w-4 text-amber-300" />
                                Mon - Sat Planning
                            </span>
                        </div>
                    </div>

                    {/* Quick Links Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Quick Links</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link to="/dashboard" className="group flex w-max items-center text-sm font-medium text-blue-100 transition-colors hover:text-white">
                                    <span className="relative overflow-hidden">
                                        Dashboard
                                        <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left -translate-x-full bg-white transition-transform duration-300 group-hover:translate-x-0"></span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/scheduler" className="group flex w-max items-center text-sm font-medium text-blue-100 transition-colors hover:text-white">
                                    <span className="relative overflow-hidden">
                                        Advanced Scheduler
                                        <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left -translate-x-full bg-white transition-transform duration-300 group-hover:translate-x-0"></span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="group flex w-max items-center text-sm font-medium text-blue-100 transition-colors hover:text-white">
                                    <span className="relative overflow-hidden">
                                        My Profile
                                        <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left -translate-x-full bg-white transition-transform duration-300 group-hover:translate-x-0"></span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="group flex w-max items-center text-sm font-medium text-blue-100 transition-colors hover:text-white">
                                    <span className="relative overflow-hidden">
                                        Documentation
                                        <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left -translate-x-full bg-white transition-transform duration-300 group-hover:translate-x-0"></span>
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Contact Us</h3>
                        <ul className="mt-4 space-y-4">
                            <li className="flex items-start gap-3 text-sm font-medium text-blue-100">
                                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-200" />
                                <span>SLIIT Malabe Campus,<br />New Kandy Road,<br />Malabe 10115</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-blue-100">
                                <Phone className="h-5 w-5 shrink-0 text-blue-200" />
                                <a href="tel:+94117544801" className="transition-colors hover:text-white">+94 11 754 4801</a>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-blue-100">
                                <Mail className="h-5 w-5 shrink-0 text-blue-200" />
                                <a href="mailto:info@sliit.lk" className="transition-colors hover:text-white">info@sliit.lk</a>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-blue-100">
                                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
                                <span>Secure Academic Resource Management</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 flex flex-col items-center justify-between border-t border-blue-300/40 pt-8 md:flex-row">
                    <p className="text-sm font-medium text-blue-100">
                        &copy; {currentYear} SLIIT Scheduler. All rights reserved.
                    </p>
                    <div className="mt-4 flex space-x-6 md:mt-0">
                        <a href="#" className="text-sm font-medium text-blue-100 transition-colors hover:text-white">Privacy Policy</a>
                        <a href="#" className="text-sm font-medium text-blue-100 transition-colors hover:text-white">Terms of Service</a>
                        <a href="#" className="text-sm font-medium text-blue-100 transition-colors hover:text-white">Cookie Settings</a>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={backToTop}
                aria-label="Back to top"
                className={`fixed bottom-6 right-5 z-[70] inline-flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-slate-900/95 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cyan-100 shadow-[0_12px_28px_rgba(2,6,23,0.45)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-slate-800 ${shouldOffsetForSidebar ? 'lg:right-6' : ''} ${showBackToTop ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-3'}`}
            >
                <ArrowUp className="h-3.5 w-3.5" />
                Top
            </button>
        </footer>
    );
};

export default Footer;
