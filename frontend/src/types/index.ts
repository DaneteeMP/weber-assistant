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
