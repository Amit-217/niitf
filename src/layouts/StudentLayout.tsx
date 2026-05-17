import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, GraduationCap, LayoutDashboard, ClipboardList } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const StudentLayout: React.FC = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken }).catch(() => {});
            }
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            navigate('/student-login', { replace: true });
        }
    };

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navbar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <GraduationCap size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">NIIT NDT</span>
                        <span className="text-gray-300 mx-1">|</span>
                        <span className="text-xs text-gray-500 font-medium">Student Portal</span>
                    </div>

                    {/* Nav links */}
                    <nav className="hidden sm:flex items-center gap-1">
                        <NavLink to="/student/dashboard" className={navLinkClass}>
                            <LayoutDashboard size={15} />
                            Dashboard
                        </NavLink>
                        <NavLink to="/student/tests" className={navLinkClass}>
                            <ClipboardList size={15} />
                            My Tests
                        </NavLink>
                    </nav>

                    {/* User + Logout */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 font-medium hidden sm:block">
                            {user?.fullName || 'Student'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-medium transition-colors"
                        >
                            <LogOut size={14} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile nav */}
                <div className="sm:hidden border-t border-gray-100 px-4 py-2 flex gap-2">
                    <NavLink to="/student/dashboard" className={navLinkClass}>
                        <LayoutDashboard size={14} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/student/tests" className={navLinkClass}>
                        <ClipboardList size={14} />
                        My Tests
                    </NavLink>
                </div>
            </header>

            {/* Page content */}
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
};

export default StudentLayout;
