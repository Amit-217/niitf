import React from 'react';
import { Users, BookOpen, Clock, TrendingUp } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back. Here is the operational summary of the system.</p>
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">Total Users</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">1,248</span>
                    <span className="text-xs text-green-600 font-medium mt-2 flex items-center"><TrendingUp size={12} className="mr-1" /> +12% from last month</span>
                </div>

                <div className="glass-card rounded-xl p-5 border-l-4 border-l-purple-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">Active Courses</span>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BookOpen size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">32</span>
                </div>

                <div className="glass-card rounded-xl p-5 border-l-4 border-l-orange-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">Running Batches</span>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">84</span>
                </div>

                <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">Revenue</span>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">$45,200</span>
                    <span className="text-xs text-green-600 font-medium mt-2 flex items-center"><TrendingUp size={12} className="mr-1" /> +4% from last month</span>
                </div>
            </div>

            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px] flex items-center justify-center text-gray-400">
                [ Chart / Data Table Placeholder ]
            </div>
        </div>
    );
};
