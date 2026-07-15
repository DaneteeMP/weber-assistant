import type { Item, CreateItem, UpdateItem, DashboardStats } from '../types';

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
