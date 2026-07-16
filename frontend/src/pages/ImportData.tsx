import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { resetData } from '../services/api';

interface ImportResult {
  table: string;
  inserted: number;
  errors: string[];
}

interface ParsedData {
  headers: string[];
  rows: Record<string, string | number>[];
}

const TABLE_CONFIGS = {
  customers: {
    label: 'Clients (TblCustomers)',
    description: 'Import client data',
    requiredColumns: ['CustomerID', 'Account name'],
    exampleColumns: ['CustomerID', 'Account name', 'Account address', 'Account city', 'Account Country', 'Sector', 'Type', 'SalesMan'],
  },
  clients_equipment: {
    label: 'Equipment per Offer (TblSubGuardianOffers)',
    description: 'Modules included in each offer',
    requiredColumns: ['CustomerID', 'Description', 'Equipment'],
    exampleColumns: ['CustomerID', 'Description', 'Equipment', 'Import', 'WorkLoad'],
  },
  equipment: {
    label: 'Machines (TblEquipment)',
    description: 'Physical equipment installed at clients',
    requiredColumns: ['CustomerID', 'Configuration'],
    exampleColumns: ['CustomerID', 'Configuration', 'Description', 'Model', 'Serial', 'Year'],
  },
  modules: {
    label: 'Modules (TblModules)',
    description: 'Module/component definitions',
    requiredColumns: ['Component Name'],
    exampleColumns: ['Component Description', 'Component Name', 'Description'],
  },
  prices: {
    label: 'Prices (TblPrices)',
    description: 'Rates (diets, hotel, hours, km)',
    requiredColumns: ['FullDietRate', 'HotelRate', 'HourlyRate Technician'],
    exampleColumns: ['FullDietRate', 'HalfDietRate', 'HotelRate', 'HourlyRate Specialist', 'HourlyRate Technician', 'KmRate', 'YearPrice'],
  },
  guardian_summary: {
    label: 'Guardian Summary (TblGuardianSummary)',
    description: 'Offer summary with status, costs and maintenance',
    requiredColumns: ['IdGuardianOffer', 'CustomerID'],
    exampleColumns: ['IdGuardianOffer', 'CustomerID', 'Account name', 'Equipment', 'DateGuardian', 'Status', 'Total', 'TotalEnd', 'Discount'],
  },
  distances: {
    label: 'Distances (TblDistances)',
    description: 'Km and travel hours by province',
    requiredColumns: ['Province', 'Km', 'TripHours'],
    exampleColumns: ['Province', 'Km', 'TripHours'],
  },
  offers: {
    label: 'Offers (TblGuardianOffers)',
    description: 'Import existing Guardian offers',
    requiredColumns: ['IdGuardianOffer', 'CustomerID'],
    exampleColumns: ['IdGuardianOffer', 'CustomerID', 'Account name', 'DateGuardian', 'Status', 'Diets', 'HotelNights', 'Trip', 'TripHours', 'WorkHours', 'Total', 'TotalEnd'],
  },
  basic_kit: {
    label: 'Basic Kit (TblBasicKit)',
    description: 'Basic kit price and hours by model',
    requiredColumns: ['Model'],
    exampleColumns: ['Model', 'SpareParts', 'WorkloadBasicKit'],
  },
  workload: {
    label: 'Workload (TblWorkLoad)',
    description: 'Work hours per component',
    requiredColumns: ['Component Description'],
    exampleColumns: ['Component Description', 'Workload'],
  },
} as const;

type TableKey = keyof typeof TABLE_CONFIGS;

export default function ImportData() {
  const [selectedTable, setSelectedTable] = useState<TableKey | ''>('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  async function handleReset() {
    if (!confirm('Are you sure? This will DELETE ALL data from the database.')) return;
    setResetting(true);
    setResetResult(null);
    try {
      const res = await resetData();
      setResetResult(`Data reset. Tables cleared: ${res.tables_reset.join(', ')}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error resetting data');
    }
    setResetting(false);
  }

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsedData(null);
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
          raw: false,
          defval: '',
        });

        if (jsonData.length === 0) {
          setError('The file is empty or has no valid data');
          return;
        }

        const headers = Object.keys(jsonData[0]);
        setParsedData({ headers, rows: jsonData });
      } catch {
        setError('Error reading file. Make sure it is a valid .xlsx file');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  async function handleImport() {
    if (!selectedTable || !parsedData) return;

    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/import/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          rows: parsedData.rows,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Import error');
      }

      const importResult: ImportResult = await res.json();
      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
    setImporting(false);
  }

  function reset() {
    setParsedData(null);
    setResult(null);
    setError(null);
  }

  const config = selectedTable ? TABLE_CONFIGS[selectedTable] : null;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
          <p className="text-gray-500 mt-1">Load data from Excel files (.xlsx) into the database</p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          {resetting ? 'Resetting...' : 'Reset Data'}
        </button>
      </div>

      {resetResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-700">{resetResult}</p>
        </div>
      )}

      {/* Step 1: Select Table */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">1. Select target table</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.entries(TABLE_CONFIGS) as [TableKey, typeof TABLE_CONFIGS[TableKey]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setSelectedTable(key); reset(); }}
              className={`p-4 rounded-lg border-2 text-left transition ${
                selectedTable === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{cfg.label}</div>
              <div className="text-sm text-gray-500 mt-1">{cfg.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Upload File */}
      {selectedTable && config && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">2. Upload Excel file</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Required columns: {config.requiredColumns.join(', ')}</p>
            <p className="text-sm text-gray-500">Expected columns: {config.exampleColumns.join(', ')}</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition">
              <span className="text-sm font-medium text-gray-700">Select .xlsx file</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {parsedData && (
              <span className="text-sm text-green-600 font-medium">
                {parsedData.rows.length} rows detected
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {parsedData && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">3. Preview ({parsedData.rows.length} rows)</h3>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: '#1D4F91' }}
            >
              {importing ? 'Importing...' : `Import ${parsedData.rows.length} rows`}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                  {parsedData.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedData.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    {parsedData.headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-48 truncate">
                        {String(row[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.rows.length > 50 && (
              <div className="p-3 text-center text-sm text-gray-500">
                Showing 50 of {parsedData.rows.length} rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-lg shadow p-6 ${result.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
          <h3 className="font-semibold text-gray-900 mb-2">Import Result</h3>
          <p className="text-sm">
            <span className="font-medium">{result.inserted}</span> rows imported into <span className="font-medium">{result.table}</span>
          </p>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-yellow-800">{result.errors.length} errors:</p>
              <ul className="mt-1 text-sm text-yellow-700 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 20).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.errors.length > 20 && (
                  <li>... and {result.errors.length - 20} more errors</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
