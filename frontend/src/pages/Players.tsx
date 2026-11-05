
import React, { useEffect, useState } from 'react';
import { Player, PlayerApi } from '../services/playerApi';

export const Players: React.FC = () => {
  const emptyPlayer: Player = {
    playerName: '',
    email: '',
    mobileNumber: '',
    age: 18,
    gender: '',
    profileImage: '',
    address: '',
  };

  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState<Player>(emptyPlayer);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await PlayerApi.getAll();
      setPlayers(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load players');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    try {
      if (editingId !== null) {
        await PlayerApi.update(editingId, form);
        setMessage('Player updated successfully');
      } else {
        await PlayerApi.create(form);
        setMessage('Player registered successfully');
      }

      setForm(emptyPlayer);
      setEditingId(null);
      await loadPlayers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  const handleEdit = (player: Player) => {
    if (player.playerId === undefined) return;
    setForm({ ...player });
    setEditingId(player.playerId);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id?: number) => {
    if (id === undefined || !window.confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      await PlayerApi.delete(id);
      setMessage('Player deleted successfully');
      await loadPlayers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleCancel = () => {
    setForm(emptyPlayer);
    setEditingId(null);
    setMessage('');
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Player Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Register, view, update and manage players.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-sm">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">
          {editingId !== null ? 'Update Player' : 'Register New Player'}
        </h2>

        <input
          className={inputClass}
          placeholder="Player name"
          value={form.playerName}
          onChange={(e) => setForm({ ...form, playerName: e.target.value })}
          required
        />

        <input
          className={inputClass}
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          className={inputClass}
          placeholder="Mobile number"
          value={form.mobileNumber}
          onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
          required
        />

        <input
          className={inputClass}
          type="number"
          min="1"
          placeholder="Age"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
          required
        />

        <select
          className={inputClass}
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          required
        >
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <input
          className={inputClass}
          placeholder="Profile image URL (optional)"
          value={form.profileImage || ''}
          onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
        />

        <textarea
          className={`${inputClass} sm:col-span-2`}
          placeholder="Address"
          rows={3}
          value={form.address || ''}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-5 py-2 text-white font-semibold hover:bg-emerald-700"
          >
            {editingId !== null ? 'Update Player' : 'Register Player'}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg bg-slate-200 dark:bg-slate-700 px-5 py-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h2 className="text-lg font-semibold mb-4">
          Registered Players ({players.length})
        </h2>

        {loading && <p>Loading players...</p>}

        {!loading && players.length === 0 && (
          <p className="text-sm text-slate-500">No players registered yet.</p>
        )}

        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.playerId}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-900 p-4"
            >
              <div>
                <h3 className="font-semibold">{player.playerName}</h3>
                <p className="text-sm text-slate-500">{player.email}</p>
                <p className="text-sm text-slate-500">{player.mobileNumber}</p>
                <p className="text-sm text-slate-500">
                  Age: {player.age} | Gender: {player.gender}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(player)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(player.playerId)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
