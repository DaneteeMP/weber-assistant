import { useEffect, useState } from 'react';
import { getInstalledBase, getInstalledBaseStats } from '../services/api';
import type { InstalledBase, InstalledBaseStats } from '../types';
import DataTable, { type Column } from '../components/DataTable';
import StatCard from '../components/StatCard';

export default function InstalledBasePage() {
  const [data, setData] = useState<InstalledBase[]>([]);
  const [stats, setStats] = useState<InstalledBaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    Promise.all([getInstalledBase(), getInstalledBaseStats()])
      .then(([baseData, statsData]) => {
        setData(baseData);
        setStats(statsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((item) => {
    if (countryFilter && item.physical_country !== countryFilter) return false;
    if (machineFilter && item.machine_type !== machineFilter) return false;
    if (typeFilter && item.component_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.account_name.toLowerCase().includes(q) ||
        item.equipment_name.toLowerCase().includes(q) ||
        item.component_name.toLowerCase().includes(q) ||
        item.sap_debitor_id.includes(q)
      );
    }
    return true;
  });

  const uniqueCountries = [...new Set(data.map((d) => d.physical_country))].sort();
  const uniqueMachines = [...new Set(data.map((d) => d.machine_type))].sort();
  const uniqueTypes = [...new Set(data.map((d) => d.component_type))].sort();

  const columns: Column<InstalledBase>[] = [
    { key: 'sap_debitor_id', header: 'SAP ID' },
    { key: 'account_name', header: 'Account' },
    { key: 'equipment_name', header: 'Equipment' },
    { key: 'machine_type', header: 'Machine' },
    { key: 'component_type', header: 'Type' },
    { key: 'component_name', header: 'Component' },
    {
      key: 'purchase_date',
      header: 'Purchase Date',
      render: (row) => (row.purchase_date ? new Date(row.purchase_date).toLocaleDateString() : '-'),
    },
    { key: 'physical_country', header: 'Country' },
  ];

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
        <p className="font-medium">Failed to load data</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Installed Base</h1>
        <p className="mt-1 text-sm text-gray-500">Weber equipment installations in Iberia</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Equipments" value={stats.total_equipments} color="indigo" />
          <StatCard title="Unique Accounts" value={stats.total_accounts} color="green" />
          <StatCard
            title="Countries"
            value={stats.countries.length}
            color="amber"
          />
          <StatCard
            title="Machine Types"
            value={stats.machine_types.length}
            color="indigo"
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search accounts, equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">All Countries</option>
            {uniqueCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">All Machines</option>
            {uniqueMachines.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">All Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Showing {filtered.length} of {data.length} records
        </div>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No equipment found" />

      {stats && stats.countries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">By Country</h3>
            <div className="space-y-2">
              {stats.countries.map((c) => (
                <div key={c.country} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{c.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{
                          width: `${(c.count / stats.total_equipments) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{c.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">By Machine Type</h3>
            <div className="space-y-2">
              {stats.machine_types.map((m) => (
                <div key={m.machine_type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{m.machine_type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(m.count / stats.total_equipments) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{m.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
