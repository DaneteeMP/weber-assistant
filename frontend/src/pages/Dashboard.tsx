import { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import type { DashboardStats } from '../types';
import StatCard from '../components/StatCard';
import DataTable, { type Column } from '../components/DataTable';
import type { Item } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const recentColumns: Column<Item>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {row.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Items" value={stats?.total_items ?? 0} color="indigo" icon="📦" />
        <StatCard title="Active Items" value={stats?.active_items ?? 0} color="green" icon="✅" />
        <StatCard title="Recent Items" value={stats?.recent_items?.length ?? 0} color="amber" icon="🕐" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Items</h2>
        <DataTable
          columns={recentColumns}
          data={stats?.recent_items ?? []}
          emptyMessage="No recent items"
        />
      </div>
    </div>
  );
}
