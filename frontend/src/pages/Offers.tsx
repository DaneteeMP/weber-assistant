import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOffers, deleteOffer } from '../services/api';
import type { Offer } from '../types';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Active: 'bg-green-100 text-green-700',
  Finished: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-red-100 text-red-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function Offers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    setLoading(true);
    try {
      const data = await getOffers();
      setOffers(data);
    } catch (err) {
      console.error('Error loading offers:', err);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta oferta?')) return;
    try {
      await deleteOffer(id);
      setOffers(offers.filter((o) => o.id !== id));
    } catch (err) {
      console.error('Error deleting offer:', err);
    }
  }

  const filtered = offers.filter(
    (o) =>
      o.id_guardian_offer.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_id.toLowerCase().includes(search.toLowerCase()) ||
      (o.account_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ofertas</h1>
          <p className="text-gray-500 mt-1">{offers.length} oferta{offers.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Nueva Oferta
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Buscar por ID, cliente o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ID Oferta</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Técnico</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {offers.length === 0
                      ? 'No hay ofertas creadas aún'
                      : 'No se encontraron ofertas con esos criterios'}
                  </td>
                </tr>
              ) : (
                filtered.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{offer.id_guardian_offer}</td>
                    <td className="px-4 py-3 text-gray-900">{offer.customer_id}</td>
                    <td className="px-4 py-3 text-gray-600">{offer.account_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{offer.responsible_person || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[offer.status || 'Draft'] || 'bg-gray-100 text-gray-700'}`}>
                        {offer.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {(offer.total_end || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(offer.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
