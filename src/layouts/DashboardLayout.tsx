import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    Menu, X, Bell, User, LogOut, LayoutDashboard,
    Users, BookOpen, Clock, CircleHelp, Briefcase,
    ChevronLeft, ChevronRight, ListTodo, FileText, GraduationCap, Search,
    ChevronDown, ChevronUp, Building2, Magnet, Droplets, Waves, Satellite, FileBarChart2, Ruler, ClipboardList, GitBranch
} from 'lucide-react';

import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const DashboardLayout: React.FC = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // desktop sidebar collapsed state
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Sub-menu states
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
        userManagement: true,
        studentManagement: true,
        customerManagement: true
    });

    const toggleMenu = (menuKey: string) => {
        setOpenMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sidebarCollapsed = isCollapsed && !isMobile;

    const navigate = useNavigate();
    const profileRef = useRef<HTMLDivElement>(null);

    // Retrieve user data
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role || 'EMPLOYEE';
    const basePath = role === 'STUDENT' ? 'student' : (role === 'ADMIN' || role === 'SUPER_ADMIN' ? 'admin' : 'employee');

    // Close profile dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        toast.info('Logged out successfully.');
        navigate('/login');
    };

    const groups = role === 'STUDENT' ? [
        {
            name: 'Exam Center',
            key: 'examCenter',
            icon: FileText,
            links: [
                { name: 'My Tests', path: `/${basePath}/dashboard`, icon: FileText }
            ]
        }
    ] : [
        {
            name: 'User Management',
            key: 'userManagement',
            icon: Users,
            links: [
                ...(role === 'ADMIN' || role === 'SUPER_ADMIN' ? [
                    { name: 'Users', path: `/${basePath}/users`, icon: Users },
                    { name: 'Salary Generation', path: `/${basePath}/payroll/records`, icon: LayoutDashboard },
                    { name: 'Payroll Config', path: `/${basePath}/payroll/config`, icon: Briefcase },
                    { name: 'Attendance', path: `/${basePath}/attendance`, icon: Clock },
                    { name: 'Task Master', path: `/${basePath}/tasks`, icon: ListTodo },
                    { name: 'Overtime', path: `/${basePath}/payroll/overtime`, icon: Clock },
                    { name: 'Advances', path: `/${basePath}/payroll/advances`, icon: Briefcase },
                ] : [
                    { name: 'My Tasks', path: `/${basePath}/tasks`, icon: ListTodo },
                ]),
            ]
        },
        {
            name: 'Student Management',
            key: 'studentManagement',
            icon: GraduationCap,
            links: [
                { name: 'Courses', path: `/${basePath}/courses`, icon: BookOpen },
                { name: 'Batches', path: `/${basePath}/batches`, icon: Clock },
                { name: 'Students', path: `/${basePath}/students`, icon: Users },
                { name: 'Admissions', path: `/${basePath}/admissions`, icon: GraduationCap },
                { name: 'CBT Tests', path: `/${basePath}/tests`, icon: FileText },
                { name: 'Enquiries', path: `/${basePath}/enquiries`, icon: CircleHelp },
                { name: 'Test Login Portal', path: '/student-login', icon: BookOpen },
            ]
        },
        {
            name: 'Customer Management',
            key: 'customerManagement',
            icon: Building2,
            links: [
                { name: 'All Reports', path: `/${basePath}/reports`, icon: FileBarChart2 },
                { name: 'Customer', path: `/${basePath}/customers`, icon: Users },
                { name: 'MPT Report', path: `/${basePath}/reports/mpt/new`, icon: Magnet },
                { name: 'PT Report', path: `/${basePath}/reports/pt/new`, icon: Droplets },
                { name: 'UT Report', path: `/${basePath}/reports/ut/new`, icon: Waves },
                { name: 'VSSC-UT Report', path: `/${basePath}/reports/vssc-ut/new`, icon: Satellite },
                { name: 'UTG Report', path: `/${basePath}/reports/utg/new`, icon: Ruler },
                { name: 'TPI IVR Report', path: `/${basePath}/reports/tpi-ivr/new`, icon: ClipboardList },
                { name: 'AWS D1.1 Report', path: `/${basePath}/reports/awsd/new`, icon: GitBranch },
            ]
        }
    ];

    const standaloneLinks = role === 'STUDENT' ? [
        { name: 'Dashboard', path: `/${basePath}/dashboard`, icon: LayoutDashboard }
    ] : [
        { name: 'Dashboard', path: `/${basePath}/dashboard`, icon: LayoutDashboard },
        { name: 'Settings', path: `/${basePath}/settings`, icon: Briefcase },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* ── Top Navbar ─────────────────────────────────────────────────── */}
            <header className="bg-white border border-gray-200 shadow-sm z-30 fixed w-full top-0 h-16 flex items-center justify-between px-2 sm:px-4 lg:px-6 rounded-b-2xl">
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                        className="lg:hidden p-2 text-gray-500 hover:text-primary-600 focus:outline-none rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {isMobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>

                    {/* Brand Logo — navigates to dashboard */}
                    <button
                        onClick={() => navigate(`/${basePath}/dashboard`)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="bg-primary-600 text-white font-bold text-sm w-8 h-8 flex items-center justify-center rounded-lg">
                            NN
                        </div>
                        <span className="hidden sm:block text-lg font-extrabold text-primary-900 tracking-tight">NIIT NDT</span>
                    </button>
                </div>

                {/* Right Header */}
                <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    <button className="text-gray-500 hover:text-primary-600 relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Bell size={18} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="flex items-center gap-2 focus:outline-none p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                            </div>
                            <span className="hidden md:block text-sm font-medium text-gray-700">
                                {user?.name || 'User'}
                            </span>
                        </button>

                        {isProfileDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in duration-150">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                                    <span className="inline-block mt-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full capitalize">
                                        {role.replace('_', ' ').toLowerCase()}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                    <LogOut size={15} />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 pt-16">
                {/* Mobile overlay background */}
                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-gray-900/50 z-10 lg:hidden backdrop-blur-sm"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* ── Sidebar ───────────────────────────────────────────────── */}
                <aside
                    className={`
                        fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)]
                        bg-white border border-gray-200 rounded-r-2xl
                        shadow-lg z-20 flex flex-col
                        transition-all duration-300 ease-in-out
                        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        ${sidebarCollapsed ? 'lg:w-16 w-64' : 'w-64'}
                    `}
                >
                    {/* Sidebar Search - only desktop & expanded */}
                    {!sidebarCollapsed && (
                        <div className="px-4 pt-4 mb-2">
                            <div className="relative group">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Search modules..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Nav Links */}
                    <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
                        {/* Standalone Link: Dashboard */}
                        <NavLink
                            to={standaloneLinks[0].path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                                ${sidebarCollapsed ? 'justify-center' : ''}
                                ${isActive
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                            `}
                            onClick={() => setIsMobileSidebarOpen(false)}
                        >
                            {({ isActive }) => {
                                const Icon = standaloneLinks[0].icon;
                                return (
                                    <>
                                        <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-white'}`}>
                                            <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                        </div>
                                        {!sidebarCollapsed && <span className="truncate flex-1">{standaloneLinks[0].name}</span>}
                                    </>
                                );
                            }}
                        </NavLink>

                        {/* Grouped Menus */}
                        {groups.map((group) => (
                            <div key={group.key} className="mt-2">
                                {!sidebarCollapsed && (
                                    <button
                                        onClick={() => toggleMenu(group.key)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                                    >
                                        <span>{group.name}</span>
                                        {openMenus[group.key] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                )}
                                {(openMenus[group.key] || sidebarCollapsed) && (
                                    <div className={`space-y-0.5 ${!sidebarCollapsed ? 'ml-2 border-l border-gray-100 pl-1' : ''}`}>
                                        {group.links
                                            .filter(link => link.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map((link) => {
                                                const Icon = link.icon;
                                                return (
                                                    <NavLink
                                                        key={link.name}
                                                        to={link.path}
                                                        title={sidebarCollapsed ? link.name : undefined}
                                                        className={({ isActive }) => `
                                                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                                                            ${sidebarCollapsed ? 'justify-center' : ''}
                                                            ${isActive
                                                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                                        `}
                                                        onClick={() => setIsMobileSidebarOpen(false)}
                                                    >
                                                        {({ isActive }) => (
                                                            <>
                                                                <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-white'}`}>
                                                                    <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                                                </div>
                                                                {!sidebarCollapsed && <span className="truncate flex-1">{link.name}</span>}
                                                                {isActive && !sidebarCollapsed && <div className="w-1 h-4 bg-primary-600 rounded-full" />}
                                                            </>
                                                        )}
                                                    </NavLink>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Standalone Link: Settings */}
                        {standaloneLinks.length > 1 && (
                            <NavLink
                                to={standaloneLinks[1].path}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group mt-2
                                    ${sidebarCollapsed ? 'justify-center' : ''}
                                    ${isActive
                                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                                onClick={() => setIsMobileSidebarOpen(false)}
                            >
                                {({ isActive }) => {
                                    const Icon = standaloneLinks[1].icon;
                                    return (
                                        <>
                                            <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-white'}`}>
                                                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                            </div>
                                            {!sidebarCollapsed && <span className="truncate flex-1">{standaloneLinks[1].name}</span>}
                                        </>
                                    );
                                }}
                            </NavLink>
                        )}
                    </div>

                    {/* Simple Branding Footer */}
                    <div className="p-4 border-t border-gray-50 flex flex-col items-center justify-center">
                        {!sidebarCollapsed ? (
                            <div className="text-center group cursor-default">
                                <p className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">
                                    Powered by
                                </p>
                                <p className="text-xs font-black text-gray-600 mt-0.5 group-hover:text-primary-600 transition-colors">
                                    Viplora Tech
                                </p>
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-100 shadow-sm">
                                VT
                            </div>
                        )}
                    </div>

                    {/* Floating collapse button — only desktop */}
                    <button
                        onClick={() => setIsCollapsed(!sidebarCollapsed)}
                        className="hidden lg:flex absolute top-6 -right-4 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg transition-all z-30"
                    >
                        {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                    </button>
                </aside>

                {/* ── Main Content ───────────────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto bg-gray-50/50 min-w-0">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Breadcrumbs />
                        <Outlet />
                    </div>
                </main>
            </div>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" style={{ zIndex: 99999 }} />
        </div>
    );
};
