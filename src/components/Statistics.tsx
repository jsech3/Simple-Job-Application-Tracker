import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { JobApplication, ApplicationStats } from '../types';
import { StorageService } from '../services/storage';

interface StatisticsProps {
  jobs: JobApplication[];
  onClose: () => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const emptyStats: ApplicationStats = {
  total: 0,
  byStatus: {} as ApplicationStats['byStatus'],
  byPlatform: {} as ApplicationStats['byPlatform'],
  byWorkEnvironment: {} as ApplicationStats['byWorkEnvironment'],
  byWorkType: {} as ApplicationStats['byWorkType'],
  responseRate: 0,
  averageResponseTime: 0,
  applicationsOverTime: [],
  compensationRanges: [],
};

export const Statistics = ({ jobs, onClose }: StatisticsProps) => {
  const [stats, setStats] = useState<ApplicationStats>(emptyStats);

  useEffect(() => {
    StorageService.getStatistics().then(setStats);
  }, [jobs]);

  // Prepare data for pie charts
  const statusData = Object.entries(stats.byStatus).map(([name, value]) => ({
    name,
    value,
  }));

  const platformData = Object.entries(stats.byPlatform).map(([name, value]) => ({
    name,
    value,
  }));

  const workEnvData = Object.entries(stats.byWorkEnvironment).map(([name, value]) => ({
    name,
    value,
  }));

  const workTypeData = Object.entries(stats.byWorkType).map(([name, value]) => ({
    name,
    value,
  }));

  // Custom label for pie charts
  const renderCustomLabel = (entry: any) => {
    return `${entry.name}: ${entry.value}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Statistics</h2>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-500 mt-0.5">Your job search at a glance</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">{stats.total}</p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">Response Rate</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                {stats.responseRate.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">Avg Response</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                {stats.averageResponseTime > 0 ? `${stats.averageResponseTime.toFixed(0)}d` : 'N/A'}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">Active</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                {stats.total - (stats.byStatus['Rejected'] || 0) - (stats.byStatus['Withdrawn'] || 0) - (stats.byStatus['Offer Received'] || 0)}
              </p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Applications Over Time */}
            {stats.applicationsOverTime.length > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Over Time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.applicationsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      tick={{ fontSize: 11, fill: '#71717a' }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Applications"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Status Breakdown */}
            {statusData.length > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Status Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={75}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Platform Distribution */}
            {platformData.length > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-4">By Platform</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {platformData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Work Environment */}
            {workEnvData.length > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Work Environment</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={workEnvData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={75}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {workEnvData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Work Type */}
            {workTypeData.length > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Work Type</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={workTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {workTypeData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Compensation Ranges */}
            {stats.compensationRanges.length > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Compensation</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.compensationRanges}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: 12 }} />
                    <Bar dataKey="count" name="Applications" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-[13px] font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
