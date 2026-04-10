import { Link, useLocation } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import autoschedule from '../assets/SLIIT_LOGO.png';

const Footer = ({ isAuthenticated, user, hasFixedSidebarOffset = false }) => {
    const currentYear = new Date().getFullYear();
    const location = useLocation();
    const shouldOffsetForSidebar = hasFixedSidebarOffset && (
        location.pathname === '/dashboard'
        || location.pathname.startsWith('/faculty')
        || location.pathname.startsWith('/scheduler')
    );

    return (
        <footer className={`mt-auto border-t border-blue-300 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 text-white transition-all duration-300 ${shouldOffsetForSidebar ? 'lg:pl-[284px]' : ''}`}>
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
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100">
                            The next-generation smart timetable generation and resource allocation platform designed exclusively for the Sri Lanka Institute of Information Technology.
                        </p>
                        <div className="mt-6 flex gap-4">
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 text-sm font-bold" title="Twitter">
                                𝕏
                                <span className="sr-only">Twitter</span>
                            </a>
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 text-sm font-bold" title="GitHub">
                                ⚙️
                                <span className="sr-only">GitHub</span>
                            </a>
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 text-sm font-bold" title="LinkedIn">
                                in
                                <span className="sr-only">LinkedIn</span>
                            </a>
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
        </footer>
    );
};

export default Footer;
