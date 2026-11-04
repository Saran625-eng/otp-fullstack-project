import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { StatusBadge, DeliveryBadge } from '../components/Badge';
import { ApiService } from '../services/api';
import { OtpHistoryItem, OtpStatus, DeliveryMethod } from '../types';

interface HistoryProps {
  onNavigate: (tab: string, state?: any) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const History: React.FC<HistoryProps> = ({ onNavigate, onNotify }) => {
  const [items, setItems] = useState<OtpHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OtpStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<DeliveryMethod | ''>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getHistory({
        search: search.trim() || undefined,
        status: (statusFilter || undefined) as OtpStatus,
        deliveryMethod: (methodFilter || undefined) as DeliveryMethod,
        limit,
        offset: (page - 1) * limit
      });
      setItems(res.data);
      setTotal(res.total);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter, methodFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    onNotify('info', 'OTP ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-2">
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>Audit & Verification Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Testing History & Activity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time tracking of generated OTPs, delivery channels, attempts, and verification outcomes.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by destination (phone, email) or OTP ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OtpStatus | '');
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="FAILED">Failed</option>
            <option value="EXPIRED">Expired</option>
            <option value="LOCKED">Locked</option>
            <option value="RESENT">Resent</option>
          </select>

          {/* Delivery Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value as DeliveryMethod | '');
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Delivery Methods</option>
            <option value="TESTING">Testing Mode</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table Container */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500">Loading records from database...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <HistoryIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No matching records found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or generate a new OTP to see history entries appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="text-[11px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">OTP ID</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Delivery</th>
                  <th className="px-6 py-4">Length</th>
                  <th className="px-6 py-4">Generated Time</th>
                  <th className="px-6 py-4">Expiry Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Attempts</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.id.slice(0, 8)}...
                        </span>
                        <button
                          onClick={() => handleCopy(item.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                          title="Copy Full UUID"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {item.destination}
                    </td>

                    <td className="px-6 py-4">
                      <DeliveryBadge method={item.deliveryMethod} />
                    </td>

                    <td className="px-6 py-4 font-mono font-semibold">
                      {item.otpLength} Digits
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">
                      {new Date(item.expiresAt).toLocaleTimeString()}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`font-mono font-bold ${
                          item.attempts >= item.maxAttempts
                            ? 'text-rose-600'
                            : item.attempts > 0
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.attempts} / {item.maxAttempts}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {item.status === 'PENDING' ? (
                        <button
                          onClick={() =>
                            onNavigate('verify', {
                              otpId: item.id,
                              destination: item.destination,
                              otpLength: item.otpLength,
                              expiresAt: item.expiresAt,
                              resendAvailableAt: item.resendAvailableAt
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            onNavigate('verify', {
                              otpId: item.id,
                              destination: item.destination,
                              otpLength: item.otpLength,
                              expiresAt: item.expiresAt
                            })
                          }
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium"
                        >
                          Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            Showing <strong className="text-slate-900 dark:text-white">{items.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{total}</strong> total records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
