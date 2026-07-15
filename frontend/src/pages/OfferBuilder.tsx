import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getClientEquipment, getModulesByEquipment, getPrices, createOffer } from '../services/api';
import type { ClientEquipment, Module, Price } from '../types';

interface SelectedModule {
  module: Module;
  importAmount: number;
  workload: number;
}

export default function OfferBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer_id') || '';

  const [equipmentList, setEquipmentList] = useState<ClientEquipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [prices, setPrices] = useState<Price | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Offer fields
  const [offerId, setOfferId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [language, setLanguage] = useState('Español');
  const [inspectionFrequency, setInspectionFrequency] = useState('Anual');
  const [diets, setDiets] = useState(0);
  const [hotelNights, setHotelNights] = useState(0);
  const [trip, setTrip] = useState(0);
  const [tripHours, setTripHours] = useState(0);
  const [workHours, setWorkHours] = useState(0);
  const [basicKit, setBasicKit] = useState(false);
  const [basicKitHours, setBasicKitHours] = useState(0);
  const [basicKitPrice, setBasicKitPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [generalComments, setGeneralComments] = useState('');

  useEffect(() => {
    loadData();
  }, [customerId]);

  useEffect(() => {
    if (selectedEquipment) {
      loadModules(selectedEquipment);
    }
  }, [selectedEquipment]);

  async function loadData() {
    setLoading(true);
    try {
      const [equipData, priceData] = await Promise.all([
        getClientEquipment(customerId),
        getPrices(),
      ]);
      setEquipmentList(equipData);
      if (priceData.length > 0) {
        setPrices(priceData[0]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  }

  async function loadModules(equipment: string) {
    try {
      const mods = await getModulesByEquipment(equipment);
      setModules(mods);
      setSelectedModules([]);
    } catch (err) {
      console.error('Error loading modules:', err);
    }
  }

  function toggleModule(mod: Module) {
    const existing = selectedModules.find((m) => m.module.id === mod.id);
    if (existing) {
      setSelectedModules(selectedModules.filter((m) => m.module.id !== mod.id));
    } else {
      const equipItem = equipmentList.find((e) => e.equipment === mod.description);
      setSelectedModules([
        ...selectedModules,
        {
          module: mod,
          importAmount: equipItem?.import_amount || 0,
          workload: equipItem?.workload || 0,
        },
      ]);
    }
  }

  function updateModuleImport(moduleId: string, value: number) {
    setSelectedModules((prev) =>
      prev.map((m) => (m.module.id === moduleId ? { ...m, importAmount: value } : m))
    );
  }

  function updateModuleWorkload(moduleId: string, value: number) {
    setSelectedModules((prev) =>
      prev.map((m) => (m.module.id === moduleId ? { ...m, workload: value } : m))
    );
  }

  const modulesTotal = selectedModules.reduce((sum, m) => sum + m.importAmount, 0);
  const modulesWorkload = selectedModules.reduce((sum, m) => sum + m.workload, 0);

  const techRate = prices?.hourly_rate_technician || 0;
  const specRate = prices?.hourly_rate_specialist || 0;
  const dietRate = prices?.full_diet_rate || 0;
  const hotelRate = prices?.hotel_rate || 0;

  const dietCost = diets * dietRate;
  const hotelCost = hotelNights * hotelRate;
  const travelCost = trip;
  const workCost = workHours * techRate;
  const basicKitCost = basicKit ? basicKitHours * techRate + basicKitPrice : 0;

  const subtotal = modulesTotal + dietCost + hotelCost + travelCost + workCost + basicKitCost;
  const totalEnd = subtotal - discount;
  const totalHours = tripHours + workHours + modulesWorkload + (basicKit ? basicKitHours : 0);

  async function handleSave() {
    if (!offerId.trim()) {
      alert('Introduce el ID de la oferta');
      return;
    }

    setSaving(true);
    try {
      await createOffer({
        id_guardian_offer: offerId,
        customer_id: customerId,
        account_name: accountName || undefined,
        responsible_person: responsiblePerson || undefined,
        language,
        inspection_frequency: inspectionFrequency,
        diets,
        hotel_nights: hotelNights,
        trip,
        trip_hours: tripHours,
        work_hours: workHours,
        total_hours: totalHours,
        basic_kit: basicKit,
        basic_kit_hours: basicKit ? basicKitHours : 0,
        basic_kit_price: basicKit ? basicKitPrice : 0,
        discount,
        total: subtotal,
        total_end: totalEnd,
        general_comments: generalComments || undefined,
        items: selectedModules.map((m, i) => ({
          customer_id: customerId,
          description: m.module.component_name,
          equipment: m.module.description,
          import_amount: m.importAmount,
          workload: m.workload,
          row_guardian: i + 1,
        })),
      });
      navigate('/offers');
    } catch (err) {
      console.error('Error creating offer:', err);
      alert('Error al crear la oferta');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Oferta</h1>
          <p className="text-gray-500 mt-1">Cliente: {customerId}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Oferta'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Config */}
        <div className="xl:col-span-1 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Información Básica</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID Oferta *</label>
                <input
                  type="text"
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  placeholder="WGA-XX-XX-XX"
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Cliente</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Técnico Responsable</label>
                <input
                  type="text"
                  value={responsiblePerson}
                  onChange={(e) => setResponsiblePerson(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Idioma</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Español">Español</option>
                    <option value="Portugués">Portugués</option>
                    <option value="Inglés">Inglés</option>
                    <option value="Francés">Francés</option>
                    <option value="Alemán">Alemán</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frecuencia</label>
                  <select
                    value={inspectionFrequency}
                    onChange={(e) => setInspectionFrequency(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Anual">Anual</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Trimestral">Trimestral</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Costes Adicionales</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dietas ({dietRate}€/ud)
                  </label>
                  <input
                    type="number"
                    value={diets}
                    onChange={(e) => setDiets(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Noches Hotel ({hotelRate}€/noche)
                  </label>
                  <input
                    type="number"
                    value={hotelNights}
                    onChange={(e) => setHotelNights(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Viaje (€)</label>
                  <input
                    type="number"
                    value={trip}
                    onChange={(e) => setTrip(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horas Viaje</label>
                  <input
                    type="number"
                    value={tripHours}
                    onChange={(e) => setTripHours(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Horas Trabajo ({techRate}€/h)
                </label>
                <input
                  type="number"
                  value={workHours}
                  onChange={(e) => setWorkHours(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  min="0"
                  step="0.5"
                />
              </div>
              <div className="border-t pt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={basicKit}
                    onChange={(e) => setBasicKit(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Kit Básico</span>
                </label>
                {basicKit && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-sm text-gray-600">Horas Kit</label>
                      <input
                        type="number"
                        value={basicKitHours}
                        onChange={(e) => setBasicKitHours(Number(e.target.value))}
                        className="mt-1 w-full px-3 py-2 border rounded-lg"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Precio Kit (€)</label>
                      <input
                        type="number"
                        value={basicKitPrice}
                        onChange={(e) => setBasicKitPrice(Number(e.target.value))}
                        className="mt-1 w-full px-3 py-2 border rounded-lg"
                        min="0"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descuento (€)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Comentarios</label>
                <textarea
                  value={generalComments}
                  onChange={(e) => setGeneralComments(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Módulos ({selectedModules.length})</span>
                <span className="font-medium">{modulesTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dietas</span>
                <span className="font-medium">{dietCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hotel</span>
                <span className="font-medium">{hotelCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Viaje</span>
                <span className="font-medium">{travelCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trabajo</span>
                <span className="font-medium">{workCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              {basicKit && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Kit Básico</span>
                  <span className="font-medium">{basicKitCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento</span>
                  <span className="font-medium">-{discount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-base font-bold">
                <span>TOTAL</span>
                <span className="text-blue-600">{totalEnd.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Horas totales</span>
                <span>{totalHours.toFixed(1)}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Equipment & Modules */}
        <div className="xl:col-span-2 space-y-6">
          {/* Equipment Selector */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Seleccionar Equipo</h3>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">-- Selecciona un equipo --</option>
              {[...new Set(equipmentList.map((e) => e.equipment))].map((eq) => (
                <option key={eq} value={eq}>
                  {eq} ({equipmentList.filter((e) => e.equipment === eq).length} módulos)
                </option>
              ))}
            </select>
          </div>

          {/* Modules */}
          {selectedEquipment && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">
                  Módulos disponibles ({modules.length})
                </h3>
                <p className="text-sm text-gray-500">Selecciona los módulos a incluir en la oferta</p>
              </div>
              <div className="divide-y">
                {modules.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No se encontraron módulos para este equipo
                  </div>
                ) : (
                  modules.map((mod) => {
                    const selected = selectedModules.find((m) => m.module.id === mod.id);
                    return (
                      <div
                        key={mod.id}
                        className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition ${
                          selected ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleModule(mod)}
                      >
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleModule(mod)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{mod.component_name}</div>
                          <div className="text-sm text-gray-500">{mod.component_description}</div>
                        </div>
                        {selected && (
                          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <label className="text-xs text-gray-500">Importe (€)</label>
                              <input
                                type="number"
                                value={selected.importAmount}
                                onChange={(e) => updateModuleImport(mod.id, Number(e.target.value))}
                                className="w-24 px-2 py-1 border rounded text-sm"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Horas</label>
                              <input
                                type="number"
                                value={selected.workload}
                                onChange={(e) => updateModuleWorkload(mod.id, Number(e.target.value))}
                                className="w-20 px-2 py-1 border rounded text-sm"
                                min="0"
                                step="0.5"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Selected Modules Summary */}
          {selectedModules.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Módulos Seleccionados ({selectedModules.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Módulo</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Descripción</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Importe</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Horas</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedModules.map((m) => (
                      <tr key={m.module.id}>
                        <td className="px-3 py-2 font-medium">{m.module.component_name}</td>
                        <td className="px-3 py-2 text-gray-600">{m.module.component_description}</td>
                        <td className="px-3 py-2 text-right">
                          {m.importAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="px-3 py-2 text-right">{m.workload}h</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => toggleModule(m.module)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-medium">
                    <tr>
                      <td colSpan={2} className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right">
                        {modulesTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="px-3 py-2 text-right">{modulesWorkload.toFixed(1)}h</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
