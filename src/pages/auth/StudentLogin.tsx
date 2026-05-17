import React, { useState } from 'react';
import { Mail, Calendar, ArrowRight, Loader2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export const StudentLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // This will be DOB
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Convert YYYY-MM-DD (from date input) → DD/MM/YYYY (backend expects)
            const [year, month, day] = password.split('-');
            const dob = `${day}/${month}/${year}`;

            const authData: any = await api.post('/auth/student-login', {
                email,
                dob,
                rememberMe,
            });

            // Store token and user data
            localStorage.setItem('accessToken', authData.accessToken);
            if (authData.refreshToken) {
                localStorage.setItem('refreshToken', authData.refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(authData.user));

            toast.success('Login successful! Welcome to the Exam Portal.');
            navigate('/student/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Student Portal"
            subtitle="Sign in to your account to take CBT Tests"
        >
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                    <GraduationCap size={32} />
                </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Registered Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="student@example.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth (Password)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Calendar size={18} />
                        </div>
                        <input
                            type="date"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-600"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-600 cursor-pointer select-none font-medium"
                    >
                        Remember me for 30 days
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm mt-4"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Authenticating...
                        </>
                    ) : (
                        <>
                            Access Portal
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
                
                <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed font-semibold px-4">
                    Strict tracking enabled. Do not share your login tokens.
                </p>
            </form>
        </AuthLayout>
    );
};
