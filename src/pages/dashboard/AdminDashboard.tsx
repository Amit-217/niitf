import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, TrendingUp, Loader2, MessageSquare } from 'lucide-react';
import api from '../../api/axios';

interface Stats {
    totalUsers: number;
    totalCourses: number;
    totalBatches: number;
    totalEnquiries: number;
    newEnquiries: number;
    convertedEnquiries: number;
    revenue: number;
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response: any = await api.get('/dashboard/stats');
            setStats(response.data.stats);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

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
                    <span className="text-3xl font-bold text-gray-800">{stats?.totalUsers || 0}</span>
                </div>

                <div className="glass-card rounded-xl p-5 border-l-4 border-l-purple-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">Active Courses</span>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BookOpen size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">{stats?.totalCourses || 0}</span>
                </div>

                <div className="glass-card rounded-xl p-5 border-l-4 border-l-orange-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">Active Batches</span>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">{stats?.totalBatches || 0}</span>
                </div>

                <div className="glass-card rounded-xl p-5 border-l-4 border-l-sky-500 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 font-medium">New Enquiries</span>
                        <div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><MessageSquare size={20} /></div>
                    </div>
                    <span className="text-3xl font-bold text-gray-800">{stats?.newEnquiries || 0}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Enquiry Overview</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Total Leads</span>
                            <span className="font-bold text-gray-800">{stats?.totalEnquiries || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Converted</span>
                            <span className="font-bold text-emerald-600">{stats?.convertedEnquiries || 0}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                                className="bg-emerald-500 h-2 rounded-full" 
                                style={{ width: `${(stats?.totalEnquiries ? (stats.convertedEnquiries / stats.totalEnquiries) * 100 : 0)}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp size={48} className="mb-2 opacity-20" />
                    <p>Charts & Trends Coming Soon</p>
                </div>
            </div>
        </div>
    );
};
