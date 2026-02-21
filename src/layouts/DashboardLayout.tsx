import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    Menu, X, Bell, User, LogOut, LayoutDashboard,
    Users, BookOpen, Clock, CircleHelp, Briefcase,
    ChevronLeft, ChevronRight
} from 'lucide-react';

import { toast } from 'react-toastify';

export const DashboardLayout: React.FC = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // desktop sidebar collapsed state
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const profileRef = useRef<HTMLDivElement>(null);

    // Retrieve user data
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role || 'EMPLOYEE';
    const basePath = role === 'ADMIN' || role === 'SUPER_ADMIN' ? 'admin' : 'employee';

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

    const navLinks = [
        { name: 'Dashboard', path: `/${basePath}/dashboard`, icon: LayoutDashboard },
        ...(role === 'ADMIN' || role === 'SUPER_ADMIN' ? [
            { name: 'Users', path: `/${basePath}/users`, icon: Users },
            { name: 'Courses', path: `/${basePath}/courses`, icon: BookOpen },
        ] : []),
        { name: 'Batches', path: `/${basePath}/batches`, icon: Clock },
        { name: 'Enquiries', path: `/${basePath}/enquiries`, icon: CircleHelp },
        { name: 'Settings', path: `/${basePath}/settings`, icon: Briefcase },
    ];


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* ── Top Navbar ─────────────────────────────────────────────────── */}
            <header className="bg-white border border-gray-200 shadow-sm z-30 fixed w-full top-0 h-16 flex items-center justify-between px-4 lg:px-6 rounded-b-2xl">
                <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
                    <button className="text-gray-500 hover:text-primary-600 relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
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
                        ${isCollapsed ? 'w-16' : 'w-64'}
                    `}
                >
                    {/* Nav Links */}
                    <div className="flex-1 overflow-y-auto py-5 px-2 space-y-0.5">
                        {!isCollapsed && (
                            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Menu</p>
                        )}
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    title={isCollapsed ? link.name : undefined}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                                        ${isCollapsed ? 'justify-center' : ''}
                                        ${isActive
                                            ? 'bg-primary-50 text-primary-700 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                                    `}
                                    onClick={() => setIsMobileSidebarOpen(false)}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon size={19} className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                            {!isCollapsed && <span className="truncate">{link.name}</span>}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* Simple Branding Footer */}
                    <div className="p-4 border-t border-gray-50 flex flex-col items-center justify-center">
                        {!isCollapsed ? (
                            <div className="text-center group cursor-default">
                                <p className="text-[10px] font-medium text-gray-400 tracking-wider">
                                    Powered by
                                </p>
                                <p className="text-xs font-bold text-gray-500 mt-0.5 group-hover:text-primary-600 transition-colors">
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
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex absolute top-6 -right-4 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg transition-all z-30"
                    >
                        {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                    </button>
                </aside>

                {/* ── Main Content ───────────────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto bg-gray-50/50 min-w-0">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl animate-in fade-in zoom-in duration-300">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
