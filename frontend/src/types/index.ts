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
