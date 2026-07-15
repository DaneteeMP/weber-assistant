import type { Item, CreateItem, UpdateItem, DashboardStats, InstalledBase, InstalledBaseStats } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export function getDashboard(): Promise<DashboardStats> {
  return request<DashboardStats>('/api/dashboard');
}

export function getItems(): Promise<Item[]> {
  return request<Item[]>('/api/items');
}

export function getItem(id: string): Promise<Item> {
  return request<Item>(`/api/items/${id}`);
}

export function createItem(data: CreateItem): Promise<Item> {
  return request<Item>('/api/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateItem(id: string, data: UpdateItem): Promise<Item> {
  return request<Item>(`/api/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteItem(id: string): Promise<void> {
  return request<void>(`/api/items/${id}`, {
    method: 'DELETE',
  });
}

export function getInstalledBase(): Promise<InstalledBase[]> {
  return request<InstalledBase[]>('/api/installed-base');
}

export function searchInstalledBase(params: {
  country?: string;
  machine_type?: string;
  component_type?: string;
  search?: string;
}): Promise<InstalledBase[]> {
  const query = new URLSearchParams();
  if (params.country) query.set('country', params.country);
  if (params.machine_type) query.set('machine_type', params.machine_type);
  if (params.component_type) query.set('component_type', params.component_type);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return request<InstalledBase[]>(`/api/installed-base/search${qs ? `?${qs}` : ''}`);
}

export function getInstalledBaseStats(): Promise<InstalledBaseStats> {
  return request<InstalledBaseStats>('/api/installed-base/stats');
}
