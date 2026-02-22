import React, { useState } from 'react';
import { KeyRound, ArrowRight, Loader2, RefreshCcw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export const VerifyOtp: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [isLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    if (!email) {
        navigate('/forgot-password');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('OTP must be exactly 6 digits.');
            return;
        }

        // In this flow, they just get the OTP and go to reset password.
        // We pass the email and OTP to the reset screen.
        navigate('/reset-password', { state: { email, otp } });
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            await api.post('/auth/resend-otp', { email });
            toast.success('A new OTP has been sent to your email.');
        } catch (error: any) {
            toast.error(error.message || 'Error resending OTP.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <AuthLayout
            title="Verify OTP"
            subtitle={`Enter the 6-digit code sent to ${email}`}
        >
            <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">One-Time Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <KeyRound size={18} />
                        </div>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only allow numbers
                            className="input-field pl-10 tracking-[0.5em] text-center font-bold text-lg"
                            placeholder="000000"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="btn-primary"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin mr-2" size={20} />
                    ) : (
                        <>
                            Verify Code
                            <ArrowRight className="ml-2" size={18} />
                        </>
                    )}
                </button>

                <div className="mt-6 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Didn't receive the code?</span>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending}
                        className="ml-2 flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                        {isResending ? <Loader2 size={16} className="animate-spin mr-1" /> : <RefreshCcw size={16} className="mr-1" />}
                        Resend OTP
                    </button>
                </div>

            </form>
        </AuthLayout>
    );
};
