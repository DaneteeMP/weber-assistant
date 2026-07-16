import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOffers } from '../services/api';
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
          <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
          <p className="text-gray-500 mt-1">{offers.length} offer{offers.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: '#1D4F91' }}
        >
          + New Offer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search by ID, client or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4F91]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Offer ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Client</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Technician</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Total End</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {offers.length === 0
                      ? 'No offers created yet'
                      : 'No offers found matching those criteria'}
                  </td>
                </tr>
              ) : (
                filtered.map((offer) => (
                  <tr
                    key={offer.id}
                    onClick={() => navigate(`/offers/new?customer_id=${offer.customer_id}&offer=${offer.id_guardian_offer}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: '#1D4F91' }}>{offer.id_guardian_offer}</td>
                    <td className="px-4 py-3 text-gray-900">{offer.customer_id}</td>
                    <td className="px-4 py-3 text-gray-600">{offer.account_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{offer.responsible_person || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[offer.status || 'Draft'] || 'bg-gray-100 text-gray-700'}`}>
                        {offer.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {(offer.total_end || 0).toLocaleString('en-GB', { style: 'currency', currency: 'EUR' })}
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
