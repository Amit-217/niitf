import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });

            toast.success('OTP sent successfully to your email.');
            // Pass the email flag to the next screen
            navigate('/verify-otp', { state: { email } });
        } catch (error: any) {
            toast.error(error.message || 'Error sending OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your email and we'll send you an OTP"
        >
            <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field pl-10"
                            placeholder="admin@niitndt.com"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin mr-2" size={20} />
                    ) : (
                        <>
                            Send OTP
                            <ArrowRight className="ml-2" size={18} />
                        </>
                    )}
                </button>

                <div className="mt-6 flex items-center justify-center">
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1" /> Back to Login
                    </button>
                </div>

            </form>
        </AuthLayout>
    );
};
