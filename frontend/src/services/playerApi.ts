
export interface Player {
  playerId?: number;
  playerName: string;
  email: string;
  mobileNumber: string;
  age: number;
  gender: string;
  profileImage?: string;
  address?: string;
  createdDate?: string;
}

const BASE_URL = '/api/v1/players';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed: ${response.status}`
    );
  }

  return result as T;
}

export const PlayerApi = {
  create: (player: Player) =>
    request<Player>('', {
      method: 'POST',
      body: JSON.stringify(player),
    }),

  getAll: () =>
    request<Player[]>(''),

  getById: (id: number) =>
    request<Player>(`/${id}`),

  update: (id: number, player: Player) =>
    request<Player>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(player),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/${id}`, {
      method: 'DELETE',
    }),
};
