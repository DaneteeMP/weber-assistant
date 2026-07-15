import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getClientEquipment } from '../services/api';
import type { ClientSummary, ClientEquipment } from '../types';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<ClientEquipment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadClients();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  async function loadClients() {
    setLoading(true);
    try {
      const data = await getClients(search || undefined);
      setClients(data);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
    setLoading(false);
  }

  async function selectClient(customerId: string) {
    setSelectedClient(customerId);
    setLoadingEquipment(true);
    try {
      const data = await getClientEquipment(customerId);
      setEquipment(data);
    } catch (err) {
      console.error('Error loading equipment:', err);
    }
    setLoadingEquipment(false);
  }

  function goToNewOffer(customerId: string) {
    navigate(`/offers/new?customer_id=${customerId}`);
  }

  const totalModules = equipment.reduce((sum, e) => sum + (e.import_amount || 0), 0);

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
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                    onClick={() => selectClient(client.customer_id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                      selectedClient === client.customer_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{client.customer_id}</div>
                    <div className="text-sm text-gray-500">
                      {client.equipment_count} equipo{client.equipment_count !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Equipment Details */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Equipos del cliente {selectedClient}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {equipment.length} módulo{equipment.length !== 1 ? 's' : ''} · Importe total: {totalModules.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <button
                  onClick={() => goToNewOffer(selectedClient)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Nueva Oferta
                </button>
              </div>
              <div className="overflow-x-auto">
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
                    {loadingEquipment ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Cargando equipos...
                        </td>
                      </tr>
                    ) : equipment.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No se encontraron equipos para este cliente
                        </td>
                      </tr>
                    ) : (
                      equipment.map((item) => (
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
