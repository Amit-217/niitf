import React from 'react';
import { Clock, CircleHelp, CheckCircle } from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'Employee'}</h1>
                    <p className="text-gray-500 mt-1">Here is your operational dashboard for today.</p>
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">My Batches</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">4</span>
                </div>

                <div className="glass-card rounded-xl p-5 border-l-4 border-l-orange-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">Pending Enquiries</span>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><CircleHelp size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">12</span>
                </div>

                <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">Tasks Completed</span>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">8</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-gray-400 min-h-[250px]">
                    [ Upcoming Schedule Placeholder ]
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-gray-400 min-h-[250px]">
                    [ Recent Enquiries List Placeholder ]
                </div>
            </div>
        </div>
    );
};
