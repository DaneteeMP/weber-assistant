import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getClientEquipment, getEquipmentByCustomer, getClientSubsidiaries } from '../services/api';
import type { ClientSummary, ClientEquipment, Equipment } from '../types';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [clientEquipment, setClientEquipment] = useState<ClientEquipment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [activeTab, setActiveTab] = useState<'machines' | 'modules'>('machines');
  const [subsidiaries, setSubsidiaries] = useState<string[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState('');

  useEffect(() => {
    getClientSubsidiaries().then(setSubsidiaries).catch(console.error);
    loadClients();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadClients();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, selectedSubsidiary]);

  async function loadClients() {
    setLoading(true);
    try {
      const data = await getClients(search || undefined, selectedSubsidiary || undefined);
      setClients(data);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
    setLoading(false);
  }

  async function selectClient(client: ClientSummary) {
    setSelectedClient(client);
    setLoadingEquipment(true);
    setActiveTab('machines');
    try {
      const [eqData, ceData] = await Promise.all([
        getEquipmentByCustomer(client.customer_id),
        getClientEquipment(client.customer_id),
      ]);
      setEquipment(eqData);
      setClientEquipment(ceData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoadingEquipment(false);
  }

  function goToOfferViewer(customerId: string) {
    navigate(`/offers/new?customer_id=${customerId}`);
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 mt-1">Selecciona un cliente para ver sus equipos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b space-y-2">
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4F91]"
              />
              <select
                value={selectedSubsidiary}
                onChange={(e) => setSelectedSubsidiary(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4F91]"
              >
                <option value="">Todos los paises</option>
                {subsidiaries.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Cargando...</div>
              ) : clients.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No se encontraron clientes</div>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.customer_id}
                    onClick={() => selectClient(client)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                      selectedClient?.customer_id === client.customer_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{client.account_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{client.customer_id}</div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <span>{client.equipment_count} equipo{client.equipment_count !== 1 ? 's' : ''}</span>
                      {client.subsidiary && <span>· {client.subsidiary}</span>}
                      {client.account_city && <span>· {client.account_city}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className="bg-white rounded-lg shadow">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedClient.account_name}</h2>
                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                      <div>ID: {selectedClient.customer_id}</div>
                      {selectedClient.account_address && <div>{selectedClient.account_address}</div>}
                      {(selectedClient.account_city || selectedClient.account_country) && (
                        <div>{[selectedClient.account_city, selectedClient.account_province, selectedClient.account_country].filter(Boolean).join(', ')}</div>
                      )}
                    </div>
                  </div>
                <button
                  onClick={() => goToOfferViewer(selectedClient.customer_id)}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: '#1D4F91' }}
                >
                  Ver Ofertas
                </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('machines')}
                  className={`px-4 py-3 text-sm font-medium transition ${
                    activeTab === 'machines'
                      ? 'text-[#1D4F91] border-b-2 border-[#1D4F91]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Máquinas ({equipment.length})
                </button>
                <button
                  onClick={() => setActiveTab('modules')}
                  className={`px-4 py-3 text-sm font-medium transition ${
                    activeTab === 'modules'
                      ? 'text-[#1D4F91] border-b-2 border-[#1D4F91]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Módulos ({clientEquipment.length})
                </button>
              </div>

              {/* Content */}
              <div className="overflow-x-auto">
                {loadingEquipment ? (
                  <div className="p-8 text-center text-gray-500">Cargando...</div>
                ) : activeTab === 'machines' ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Configuración</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Descripción</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Modelo</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Serie</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Año</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {equipment.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            No hay máquinas registradas para este cliente
                          </td>
                        </tr>
                      ) : (
                        equipment.map((eq) => (
                          <tr key={eq.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{eq.configuration || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{eq.description || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{eq.model || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{eq.serial || '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{eq.year || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Equipo</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Descripción</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Importe</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Workload</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {clientEquipment.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No hay módulos registrados para este cliente
                          </td>
                        </tr>
                      ) : (
                        clientEquipment.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{item.equipment}</td>
                            <td className="px-4 py-3 text-gray-600">{item.description}</td>
                            <td className="px-4 py-3 text-right text-gray-900">
                              {item.import_amount != null
                                ? item.import_amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {item.workload != null ? `${item.workload}h` : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
              Selecciona un cliente de la lista para ver sus equipos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
