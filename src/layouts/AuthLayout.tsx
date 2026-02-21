import React, { ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            {/* Left Panel - Branding */}
            <div className="hidden md:flex md:w-1/2 bg-primary-600 relative overflow-hidden flex-col justify-center items-center text-white px-12">
                {/* Abstract Background Shapes */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                <div className="relative z-10 text-center">
                    <div className="flex justify-center mb-8">
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                            {/* Placeholder for Logo Note: user mentioned niitndt.com */}
                            <h1 className="text-4xl font-extrabold text-primary-600 tracking-tight">NIIT NDT</h1>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Enterprise Management System</h2>
                    <p className="text-primary-100 text-lg max-w-md mx-auto">
                        Streamline your workflow, manage enrollments, and coordinate with ease through our unified portal.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form Container */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-white">
                <div className="w-full max-w-md">
                    <div className="md:hidden text-center mb-10">
                        <h1 className="text-3xl font-bold text-primary-600 tracking-tight">NIIT NDT</h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                        <p className="text-gray-500">{subtitle}</p>
                    </div>

                    {/* Form Content */}
                    <div className="bg-white">
                        {children}
                    </div>
                    {/* Simple Branding Signature */}
                    <div className="mt-12 text-center animate-in fade-in duration-1000">
                        <p className="text-[10px] font-medium text-gray-400 tracking-wider">Powered by</p>
                        <p className="text-xs font-bold text-gray-500 mt-0.5 hover:text-primary-600 transition-colors cursor-default">Viplora Tech</p>
                    </div>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        </div>
    );
};
