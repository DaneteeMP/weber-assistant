import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getClients, getClientEquipment, getEquipmentByCustomer,
  getGuardianSummaryByCustomer, getDistances, getPrices, getOffersByCustomer, getBasicKit
} from '../services/api';
import type { ClientSummary, Equipment, ClientEquipment, Distance, Price, GuardianSummary, Offer, BasicKit } from '../types';

export default function OfferBuilder() {
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState<ClientSummary | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [clientEquipmentList, setClientEquipmentList] = useState<ClientEquipment[]>([]);
  const [summaries, setSummaries] = useState<GuardianSummary[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [distances, setDistances] = useState<Distance[]>([]);
  const [prices, setPrices] = useState<Price | null>(null);
  const [basicKits, setBasicKits] = useState<BasicKit[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      getClients().then(setClients),
      getDistances().then(setDistances),
      getPrices().then(p => { if (p.length > 0) setPrices(p[0]); }),
      getBasicKit().then(setBasicKits),
    ]).then(() => {
      const urlCustomerId = searchParams.get('customer_id');
      const urlOfferId = searchParams.get('offer');
      if (urlCustomerId) {
        loadClient(urlCustomerId).then((result) => {
          if (result && urlOfferId) {
            const found = result.offerData.find(o => o.id_guardian_offer === urlOfferId);
            if (found) {
              setSelectedOffer(found);
              const equipForOffer = result.ceData
                .filter(ce => ce.id_guardian_offer === found.id_guardian_offer)
                .map(ce => ce.equipment)
                .filter((v, i, a) => a.indexOf(v) === i);
              setSelectedEquipment(equipForOffer);
            }
          }
        });
      }
    });
  }, []);

  async function loadClient(customerId: string) {
    setSelectedClientId(customerId);
    setClientSearch('');
    setLoading(true);
    setSelectedOffer(null);
    setSelectedEquipment([]);
    try {
      const [eqData, ceData, summaryData, offerData] = await Promise.all([
        getEquipmentByCustomer(customerId),
        getClientEquipment(customerId),
        getGuardianSummaryByCustomer(customerId),
        getOffersByCustomer(customerId),
      ]);
      setEquipmentList(eqData);
      setClientEquipmentList(ceData);
      setSummaries(summaryData);
      setOffers(offerData);
      const cl = clients.find(c => c.customer_id === customerId) || null;
      setCustomer(cl);
      setLoading(false);
      return { ceData, offerData };
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
    return { ceData: [], offerData: [] };
  }

  const filteredClients = clients.filter(c =>
    c.account_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.customer_id.includes(clientSearch)
  );

  const kmRate = prices?.km_rate || 0;
  const techRate = prices?.hourly_rate_technician || 0;
  const dietRate = prices?.full_diet_rate || 0;
  const halfDietRate = prices?.half_diet_rate || 0;
  const hotelRate = prices?.hotel_rate || 0;
  const discountRate = 0.15;

  const province = customer?.account_province || '';
  const distance = useMemo(() => {
    if (!province) return null;
    return distances.find(d => d.province.toLowerCase() === province.toLowerCase()) || null;
  }, [province, distances]);

  const km = distance?.km || 0;
  const tripHoursBase = distance?.trip_hours || 0;

  const availableEquipment = useMemo(() => {
    const allEquipmentCodes = new Set(clientEquipmentList.map(ce => ce.equipment));
    return Array.from(allEquipmentCodes).filter(e => !selectedEquipment.includes(e));
  }, [clientEquipmentList, selectedEquipment]);

  const selectedEquipmentModules = useMemo(() => {
    if (selectedEquipment.length === 0) return [];
    return clientEquipmentList.filter(ce => selectedEquipment.includes(ce.equipment));
  }, [clientEquipmentList, selectedEquipment]);

  const uniqueEquipmentInOffer = useMemo(() => {
    const set = new Set(selectedEquipmentModules.map(m => m.equipment));
    return Array.from(set);
  }, [selectedEquipmentModules]);

  function toggleEquipment(equipCode: string) {
    setSelectedEquipment(prev =>
      prev.includes(equipCode)
        ? prev.filter(e => e !== equipCode)
        : [...prev, equipCode]
    );
  }

  const totalWorkLoad = useMemo(() => {
    return selectedEquipmentModules.reduce((sum, m) => sum + (m.workload || 0), 0);
  }, [selectedEquipmentModules]);

  const reportHours = useMemo(() => {
    return uniqueEquipmentInOffer.length * 2;
  }, [uniqueEquipmentInOffer]);

  const basicKitInfo = useMemo(() => {
    if (!selectedOffer?.basic_kit) return { hours: 0, price: 0 };
    let totalHours = 0;
    let totalPrice = 0;
    for (const eq of uniqueEquipmentInOffer) {
      const equipRecord = equipmentList.find(e => e.description === eq);
      if (equipRecord?.configuration) {
        const kit = basicKits.find(bk => bk.model === equipRecord.configuration);
        if (kit) {
          totalHours += kit.workload_basic_kit || 0;
          totalPrice += kit.spare_parts || 0;
        }
      }
    }
    return { hours: totalHours, price: totalPrice };
  }, [selectedOffer, uniqueEquipmentInOffer, equipmentList, basicKits]);

  const calc = useMemo(() => {
    const workHours = totalWorkLoad;
    const bkHours = selectedOffer?.basic_kit ? basicKitInfo.hours : 0;
    const rptHours = reportHours;

    let totalHoursRaw = tripHoursBase + workHours + bkHours + rptHours;
    const totalHoursRounded = Math.ceil(totalHoursRaw / 8) * 8;
    const adjustment = totalHoursRounded - totalHoursRaw;

    let adjustedWorkHours = workHours + adjustment;
    let adjustedBkHours = bkHours;
    if (selectedOffer?.basic_kit && adjustment > 0) {
      const halfAdj = Math.floor(adjustment / 2);
      adjustedBkHours = bkHours + halfAdj;
      adjustedWorkHours = workHours + adjustment - halfAdj;
    }
    if (adjustedWorkHours < 1) {
      adjustedWorkHours = 1;
      adjustedBkHours = Math.max(0, adjustedBkHours - 1);
    }

    const totalHours = totalHoursRounded;
    const numDays = Math.max(1, Math.floor(totalHours / 8));

    let tripCost = 0;
    let tripHoursVal = tripHoursBase;
    let diets = 0;
    let hotelNights = 0;

    if (km < 200) {
      tripCost = (km * kmRate) * numDays;
      tripHoursVal = tripHoursBase * numDays;
      diets = numDays * halfDietRate;
    } else {
      tripCost = (km * kmRate) + (tripHoursBase * techRate);
      hotelNights = (numDays - 1) * hotelRate;
      diets = (numDays - 1) * dietRate + halfDietRate;
    }

    const expensesImport = tripCost + diets + hotelNights;
    const hoursImport = totalHours * techRate;
    const discount = hoursImport * discountRate;
    const bkPrice = selectedOffer?.basic_kit ? basicKitInfo.price : 0;
    const total = hoursImport + discount + expensesImport + bkPrice;
    const totalEnd = total - discount;

    return {
      workHours: adjustedWorkHours,
      bkHours: adjustedBkHours,
      reportHours: rptHours,
      totalHours,
      numDays,
      tripCost,
      tripHours: tripHoursVal,
      diets,
      hotelNights,
      expensesImport,
      hoursImport,
      discount,
      bkPrice,
      total,
      totalEnd,
    };
  }, [totalWorkLoad, tripHoursBase, reportHours, basicKitInfo, km, kmRate, techRate, dietRate, halfDietRate, hotelRate, selectedOffer]);

  const moduleRows = useMemo(() => {
    return selectedEquipmentModules.map((m, i) => ({
      pos: i + 1,
      equipment: m.equipment,
      module: m.description,
      importAmount: m.import_amount || 0,
      workload: m.workload || 0,
    }));
  }, [selectedEquipmentModules]);

  const colorMap = useMemo(() => {
    const colors = ['#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0', '#f3e5f5', '#e0f7fa', '#fff9c4', '#efebe9'];
    const map: Record<string, string> = {};
    uniqueEquipmentInOffer.forEach((eq, i) => {
      map[eq] = colors[i % colors.length];
    });
    return map;
  }, [uniqueEquipmentInOffer]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="text-white px-6 py-3 flex items-center justify-between shadow" style={{ background: 'linear-gradient(135deg, #1D4F91, #2563EB)' }}>
        <h1 className="text-xl font-bold tracking-wide">OFERTA GUARDIAN</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition">PRINT PDF</button>
          <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition">DELETE OFFER</button>
          <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition">CLOSE OFFER</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* Customer + Offer info row */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Customer Data */}
            <div className="col-span-5 border-r pr-4">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">Customer data</div>
              <div className="relative mb-2">
                <select
                  value={selectedClientId}
                  onChange={e => {
                    const cid = e.target.value;
                    if (cid) loadClient(cid);
                    else {
                      setSelectedClientId('');
                      setCustomer(null);
                      setEquipmentList([]);
                      setClientEquipmentList([]);
                      setSummaries([]);
                      setOffers([]);
                      setSelectedOffer(null);
                    }
                  }}
                  className="w-full px-2 py-1.5 border rounded text-sm bg-blue-50"
                >
                  <option value="">Seleccionar cliente...</option>
                  {filteredClients.slice(0, 50).map(c => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_id}  {c.account_name}
                    </option>
                  ))}
                </select>
              </div>
              {customer && (
                <div className="text-sm">
                  <div className="font-semibold">{customer.account_name}</div>
                  <div className="text-gray-600">{customer.account_address}</div>
                  <div className="text-gray-600">{customer.account_city}, {customer.account_province} ({customer.account_country})</div>
                </div>
              )}
            </div>

            {/* Offer Info */}
            <div className="col-span-4 border-r pr-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-28">Offer no.:</span>
                  <span className="font-mono font-bold">{selectedOffer?.id_guardian_offer || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-28">Offer date:</span>
                  <span>{selectedOffer?.date_guardian || new Date().toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-28">Acceptance data:</span>
                  <span className="border-b border-gray-300 min-w-[120px] inline-block">{summaries.find(s => s.acceptance_date)?.acceptance_date || ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-28">Guardian type:</span>
                  <select className="border rounded px-1 py-0.5 text-sm bg-blue-50" defaultValue={selectedOffer?.id_guardian_offer?.includes('-01-') ? 'Basic Kit' : selectedOffer?.id_guardian_offer?.includes('-02-') ? 'Audit' : selectedOffer?.id_guardian_offer?.includes('-03-') ? 'Off-Guardian' : 'Audit'}>
                    <option>Basic Kit</option>
                    <option>Audit</option>
                    <option>Off-Guardian</option>
                    <option>Campaign</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right info */}
            <div className="col-span-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Language:</span>
                <select className="border rounded px-1 py-0.5 text-sm bg-blue-50" defaultValue={selectedOffer?.language || 'Español'}>
                  <option>Español</option>
                  <option>Portugués</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Inspection frequency:</span>
                <select className="border rounded px-1 py-0.5 text-sm bg-blue-50" defaultValue={selectedOffer?.inspection_frequency || 'Anual'}>
                  <option>Anual</option>
                  <option>Semestral</option>
                  <option>Bienal</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Status:</span>
                <select className="border rounded px-1 py-0.5 text-sm bg-blue-50" defaultValue={selectedOffer?.status || 'Pending response'}>
                  <option>Draft</option>
                  <option>Pending response</option>
                  <option>Finished</option>
                  <option>Cancelled</option>
                  <option>Rejected</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Responsible offer:</span>
                <select className="border rounded px-1 py-0.5 text-sm bg-blue-50" defaultValue={selectedOffer?.responsible_person || ''}>
                  <option value="">-</option>
                  <option>Xevi Mira</option>
                  <option>David</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main content: 3 columns */}
        <div className="grid grid-cols-12 gap-3 flex-1" style={{ minHeight: '400px' }}>
          {/* Left: Equipment Lists */}
          <div className="col-span-2 space-y-3">
            {/* No Selected */}
            <div className="bg-white rounded shadow p-2">
              <div className="text-xs font-bold text-gray-500 uppercase mb-1">No selected</div>
              <div className="border rounded h-32 overflow-y-auto bg-gray-50">
                {availableEquipment.length === 0 ? (
                  <div className="p-2 text-xs text-gray-400">Vacío</div>
                ) : availableEquipment.map(eq => (
                  <div
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className="px-2 py-1 text-xs hover:bg-blue-100 cursor-pointer border-b last:border-0"
                  >
                    {eq}
                  </div>
                ))}
              </div>
            </div>
            {/* Selected */}
            <div className="bg-white rounded shadow p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Selected</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedEquipment(clientEquipmentList.map(ce => ce.equipment).filter((v, i, a) => a.indexOf(v) === i))}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedEquipment([])}
                    className="text-[10px] text-red-600 hover:underline"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="border rounded h-32 overflow-y-auto bg-blue-50">
                {selectedEquipment.length === 0 ? (
                  <div className="p-2 text-xs text-gray-400">Ninguno</div>
                ) : selectedEquipment.map(eq => (
                  <div
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className="px-2 py-1 text-xs cursor-pointer border-b last:border-0 font-medium hover:bg-red-100 bg-blue-200"
                  >
                    {eq}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Modules Table */}
          <div className="col-span-6">
            <div className="bg-white rounded shadow h-full flex flex-col">
              <div className="overflow-auto flex-1">
                <table className="w-full text-xs">
                  <thead className="bg-gray-700 text-white sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left w-10">Pos</th>
                      <th className="px-2 py-2 text-left">Equipo</th>
                      <th className="px-2 py-2 text-left">Módulo</th>
                      <th className="px-2 py-2 text-right w-24">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleRows.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Selecciona equipos en la lista izquierda</td></tr>
                    ) : moduleRows.map(row => (
                      <tr key={row.pos} style={{ backgroundColor: colorMap[row.equipment] || '#fff' }} className="border-b">
                        <td className="px-2 py-1.5 font-medium">{row.pos}</td>
                        <td className="px-2 py-1.5 font-semibold">{row.equipment}</td>
                        <td className="px-2 py-1.5">{row.module}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{row.importAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Cost Breakdown */}
          <div className="col-span-4">
            <div className="bg-white rounded shadow p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Trip (Km):</span>
                <span className="font-mono">{calc.tripCost.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Diets:</span>
                <span className="font-mono">{calc.diets.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hotels:</span>
                <span className="font-mono">{calc.hotelNights.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trip hours:</span>
                <span className="font-mono">{calc.tripHours.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Audit / Work hours:</span>
                <span className="font-mono">{(calc.workHours + calc.bkHours).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hours report:</span>
                <span className="font-mono">{calc.reportHours.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hours Basic Kit:</span>
                <span className="font-mono">{calc.bkHours.toFixed(1)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>TOTAL HOURS:</span>
                <span className="font-mono">{calc.totalHours.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold">
                <span>TOTAL GUARDIAN H.:</span>
                <span className="font-mono">{calc.totalHours.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-orange-600 font-bold">
                <span>TOTAL CAMPAIGN H.:</span>
                <span className="font-mono">0,00</span>
              </div>
              <div className="flex justify-between text-blue-600 font-bold">
                <span>TOTAL OFF-GUARDIAN H.:</span>
                <span className="font-mono">0,00</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>HOURS IMPORT:</span>
                <span className="font-mono">{calc.hoursImport.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>EXPENSES IMPORT:</span>
                <span className="font-mono">{calc.expensesImport.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: Comments + Totals */}
        <div className="grid grid-cols-12 gap-3">
          {/* Comments */}
          <div className="col-span-8">
            <div className="bg-white rounded shadow p-3">
              <div className="text-xs font-bold text-gray-500 uppercase mb-1">Comments</div>
              <textarea
                className="w-full border rounded p-2 text-sm h-16 resize-none"
                placeholder="Notas de la oferta..."
                defaultValue={selectedOffer?.general_comments || ''}
              />
            </div>
          </div>
          {/* Totals */}
          <div className="col-span-4">
            <div className="bg-white rounded shadow p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-mono font-bold">{calc.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Spare parts kit:</span>
                <span className="font-mono">{calc.bkPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-mono text-red-600">{calc.discount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total amount:</span>
                <span className="font-mono text-blue-700">{calc.totalEnd.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Offers list */}
        {offers.length > 0 && (
          <div className="bg-white rounded shadow p-3">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Ofertas del cliente ({offers.length})</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1.5 text-left">ID</th>
                    <th className="px-2 py-1.5 text-left">Fecha</th>
                    <th className="px-2 py-1.5 text-left">Idioma</th>
                    <th className="px-2 py-1.5 text-left">Estado</th>
                    <th className="px-2 py-1.5 text-left">Frecuencia</th>
                    <th className="px-2 py-1.5 text-right">Total</th>
                    <th className="px-2 py-1.5 text-right">Total End</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map(o => (
                    <tr
                      key={o.id_guardian_offer}
                      onClick={() => {
                        setSelectedOffer(o);
                        const equipForOffer = clientEquipmentList
                          .filter(ce => ce.id_guardian_offer === o.id_guardian_offer)
                          .map(ce => ce.equipment)
                          .filter((v, i, a) => a.indexOf(v) === i);
                        setSelectedEquipment(equipForOffer);
                      }}
                      className={`cursor-pointer border-b ${selectedOffer?.id_guardian_offer === o.id_guardian_offer ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-2 py-1.5 font-mono font-bold text-blue-600">{o.id_guardian_offer}</td>
                      <td className="px-2 py-1.5">{o.date_guardian || '-'}</td>
                      <td className="px-2 py-1.5">{o.language || '-'}</td>
                      <td className="px-2 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          o.status === 'Finished' ? 'bg-green-100 text-green-700' :
                          o.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          o.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{o.status || 'Draft'}</span>
                      </td>
                      <td className="px-2 py-1.5">{o.inspection_frequency || '-'}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{(o.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                      <td className="px-2 py-1.5 text-right font-mono font-bold">{(o.total_end || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg text-sm font-medium">Cargando datos...</div>
        </div>
      )}
    </div>
  );
}
