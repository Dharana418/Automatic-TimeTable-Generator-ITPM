import { Link } from 'react-router-dom';
import { Calendar, Github, Twitter, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import autoschedule from '../assets/SLIIT_LOGO.png';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-slate-200/60 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-950/80">
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
                            <h2 className="m-0 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent dark:from-blue-400 dark:to-indigo-400">
                                SLIIT Scheduler
                            </h2>
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            The next-generation smart timetable generation and resource allocation platform designed exclusively for the Sri Lanka Institute of Information Technology.
                        </p>
                        <div className="mt-6 flex gap-4">
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400">
                                <Twitter className="h-5 w-5" />
                                <span className="sr-only">Twitter</span>
                            </a>
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400">
                                <Github className="h-5 w-5" />
                                <span className="sr-only">GitHub</span>
                            </a>
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400">
                                <Linkedin className="h-5 w-5" />
                                <span className="sr-only">LinkedIn</span>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Quick Links</h3>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <Link to="/dashboard" className="group flex w-max items-center text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                                    <span className="relative overflow-hidden">
                                        Dashboard
                                        <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left -translate-x-full bg-indigo-600 transition-transform duration-300 group-hover:translate-x-0 dark:bg-indigo-400"></span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/scheduler" className="group flex w-max items-center text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                                    <span className="relative overflow-hidden">
                                        Advanced Scheduler
                                        <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left -translate-x-full bg-indigo-600 transition-transform duration-300 group-hover:translate-x-0 dark:bg-indigo-400"></span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="group flex w-max items-center text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                                    <span className="relative overflow-hidden">
                                        My Profile
                                        <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left -translate-x-full bg-indigo-600 transition-transform duration-300 group-hover:translate-x-0 dark:bg-indigo-400"></span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="group flex w-max items-center text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                                    <span className="relative overflow-hidden">
                                        Documentation
                                        <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left -translate-x-full bg-indigo-600 transition-transform duration-300 group-hover:translate-x-0 dark:bg-indigo-400"></span>
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Contact Us</h3>
                        <ul className="mt-4 space-y-4">
                            <li className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                                <span>SLIIT Malabe Campus,<br />New Kandy Road,<br />Malabe 10115</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                <Phone className="h-5 w-5 shrink-0 text-indigo-500" />
                                <a href="tel:+94117544801" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">+94 11 754 4801</a>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                <Mail className="h-5 w-5 shrink-0 text-indigo-500" />
                                <a href="mailto:info@sliit.lk" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">info@sliit.lk</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-200/60 pt-8 dark:border-slate-800/60 md:flex-row">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        &copy; {currentYear} SLIIT Scheduler. All rights reserved.
                    </p>
                    <div className="mt-4 flex space-x-6 md:mt-0">
                        <a href="#" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">Privacy Policy</a>
                        <a href="#" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">Terms of Service</a>
                        <a href="#" className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">Cookie Settings</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
