export interface Item {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateItem {
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateItem {
  name?: string;
  description?: string;
  status?: string;
}

export interface DashboardStats {
  total_items: number;
  active_items: number;
  recent_items: Item[];
}

export interface InstalledBase {
  id: string;
  sap_debitor_id: string;
  parent_account_name: string | null;
  account_name: string;
  equipment_name: string;
  component_type: string;
  component_name: string;
  purchase_date: string | null;
  parent_equipment_name: string | null;
  machine_type: string;
  physical_country: string;
  created_at: string;
}

export interface InstalledBaseStats {
  total_equipments: number;
  total_accounts: number;
  countries: { country: string; count: number }[];
  machine_types: { machine_type: string; count: number }[];
}

export interface ClientEquipment {
  id: string;
  customer_id: string;
  description: string;
  equipment: string;
  id_guardian_offer: string | null;
  import_amount: number | null;
  row_guardian: number | null;
  workload: number | null;
  old_id: number | null;
  created_at: string;
}

export interface ClientSummary {
  customer_id: string;
  equipment_count: number;
}

export interface Module {
  id: string;
  component_description: string | null;
  component_name: string;
  description: string;
  old_id: number | null;
  created_at: string;
}

export interface Price {
  id: string;
  full_diet_rate: number | null;
  half_diet_rate: number | null;
  hotel_rate: number | null;
  hourly_rate_specialist: number | null;
  hourly_rate_technician: number | null;
  km_rate: number | null;
  year_price: number | null;
  guardian_blades_discount: number | null;
  guardian_spare_parts_discount: number | null;
  guardian_technician_discount: number | null;
  old_id: number | null;
  created_at: string;
}

export interface Offer {
  id: string;
  id_guardian_offer: string;
  customer_id: string;
  account_name: string | null;
  date_guardian: string | null;
  status: string | null;
  responsible_person: string | null;
  equipment_plate: string | null;
  inspection_frequency: string | null;
  language: string | null;
  diets: number | null;
  hotel_nights: number | null;
  trip: number | null;
  trip_hours: number | null;
  work_hours: number | null;
  total_hours: number | null;
  basic_kit: boolean | null;
  basic_kit_hours: number | null;
  basic_kit_price: number | null;
  discount: number | null;
  hours_import: number | null;
  report_hours: number | null;
  total: number | null;
  total_end: number | null;
  general_comments: string | null;
  summary_notes: string | null;
  created_at: string;
}

export interface OfferItem {
  id: string;
  offer_id: string;
  customer_id: string;
  description: string;
  equipment: string;
  import_amount: number | null;
  workload: number | null;
  row_guardian: number | null;
  created_at: string;
}

export interface CreateOffer {
  id_guardian_offer: string;
  customer_id: string;
  account_name?: string;
  date_guardian?: string;
  status?: string;
  responsible_person?: string;
  equipment_plate?: string;
  inspection_frequency?: string;
  language?: string;
  diets?: number;
  hotel_nights?: number;
  trip?: number;
  trip_hours?: number;
  work_hours?: number;
  total_hours?: number;
  basic_kit?: boolean;
  basic_kit_hours?: number;
  basic_kit_price?: number;
  discount?: number;
  hours_import?: number;
  report_hours?: number;
  total?: number;
  total_end?: number;
  general_comments?: string;
  summary_notes?: string;
  items?: {
    customer_id: string;
    description: string;
    equipment: string;
    import_amount?: number;
    workload?: number;
    row_guardian?: number;
  }[];
}
