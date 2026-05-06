import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import type { TransferResponseDto } from '../types/transfer';
import { useAuth } from '../context/AuthContext';
import './TransferHistory.css';

const STATUS_LABELS: Record<string, string> = {
    COMPLETED:           'Completed',
    REJECTED_ON_RECEIPT: 'Rejected',
    CANCELLED:           'Cancelled',
};

const PRIORITY_OPTIONS = ['', 'NORMAL', 'HIGH', 'CRITICAL'];

const TransferHistory = () => {
    const { user } = useAuth();
    const [transfers, setTransfers] = useState<TransferResponseDto[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');

    // filters
    const [searchTerm,      setSearchTerm]      = useState('');
    const [filterStatus,    setFilterStatus]    = useState('');
    const [filterPriority,  setFilterPriority]  = useState('');
    const [sortOrder,       setSortOrder]       = useState<'desc' | 'asc'>('desc');

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/transfers/history');
            setTransfers(res.data);
        } catch {
            setError('Failed to load transfer history.');
        } finally {
            setLoading(false);
        }
    };

    // ── derived list ──────────────────────────────────────────────────
    const filtered = transfers
        .filter(t => {
            const q = searchTerm.toLowerCase();
            const matchSearch =
                !q ||
                t.requestCode?.toLowerCase().includes(q) ||
                t.title?.toLowerCase().includes(q) ||
                t.originBranchName?.toLowerCase().includes(q) ||
                t.destinationBranchName?.toLowerCase().includes(q) ||
                t.categoryName?.toLowerCase().includes(q);
            const matchStatus   = !filterStatus   || t.status === filterStatus;
            const matchPriority = !filterPriority || t.priority === filterPriority;
            return matchSearch && matchStatus && matchPriority;
        })
        .sort((a, b) => {
            const da = new Date(a.requestedAt).getTime();
            const db = new Date(b.requestedAt).getTime();
            return sortOrder === 'desc' ? db - da : da - db;
        });

    const getStatusClass = (status: string) => {
        if (status === 'COMPLETED')           return 'hist-badge hist-badge-success';
        if (status === 'REJECTED_ON_RECEIPT') return 'hist-badge hist-badge-danger';
        if (status === 'CANCELLED')           return 'hist-badge hist-badge-neutral';
        return 'hist-badge hist-badge-neutral';
    };

    const getPriorityClass = (p: string) => {
        if (p === 'CRITICAL') return 'hist-badge hist-badge-critical';
        if (p === 'HIGH')     return 'hist-badge hist-badge-high';
        return 'hist-badge hist-badge-low';
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString('en-BD', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    // ── stats ─────────────────────────────────────────────────────────
    const stats = {
        total:    transfers.length,
        completed: transfers.filter(t => t.status === 'COMPLETED').length,
        rejected:  transfers.filter(t => t.status === 'REJECTED_ON_RECEIPT').length,
        cancelled: transfers.filter(t => t.status === 'CANCELLED').length,
    };

    if (loading) return <div className="hist-loading"><span className="hist-spinner" /> Loading history...</div>;

    return (
        <div className="hist-container">
            {/* ── Header ── */}
            <div className="hist-header">
                <div>
                    <h1 className="hist-title">📜 Transfer History</h1>
                    <p className="hist-subtitle">
                        {user?.role === 'SYSTEM_ADMIN'
                            ? 'All completed, rejected, and cancelled transfers'
                            : 'Closed transfers from your branch'}
                    </p>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="hist-stats">
                <div className="hist-stat-card hist-stat-total">
                    <span className="hist-stat-num">{stats.total}</span>
                    <span className="hist-stat-lbl">Total Records</span>
                </div>
                <div className="hist-stat-card hist-stat-completed">
                    <span className="hist-stat-num">{stats.completed}</span>
                    <span className="hist-stat-lbl">Completed</span>
                </div>
                <div className="hist-stat-card hist-stat-rejected">
                    <span className="hist-stat-num">{stats.rejected}</span>
                    <span className="hist-stat-lbl">Rejected</span>
                </div>
                <div className="hist-stat-card hist-stat-cancelled">
                    <span className="hist-stat-num">{stats.cancelled}</span>
                    <span className="hist-stat-lbl">Cancelled</span>
                </div>
            </div>

            {error && <div className="hist-error">{error}</div>}

            {/* ── Filters ── */}
            <div className="hist-filters">
                <input
                    className="hist-search"
                    type="text"
                    placeholder="🔍  Search by code, title, branch, category..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <select className="hist-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED_ON_RECEIPT">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
                <select className="hist-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="">All Priorities</option>
                    {PRIORITY_OPTIONS.filter(Boolean).map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                <button
                    className="hist-sort-btn"
                    onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                    title="Toggle sort order"
                >
                    {sortOrder === 'desc' ? '↓ Newest First' : '↑ Oldest First'}
                </button>
            </div>

            {/* ── Table ── */}
            <div className="hist-card">
                {filtered.length === 0 ? (
                    <div className="hist-empty">
                        <span className="hist-empty-icon">📭</span>
                        <h3>No Records Found</h3>
                        <p>{transfers.length === 0 ? 'No closed transfers yet.' : 'No transfers match your filters.'}</p>
                    </div>
                ) : (
                    <table className="hist-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Code</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Origin → Destination</th>
                                <th>Priority</th>
                                <th>Outcome</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((t, i) => (
                                <tr key={t.requestId} className="hist-row">
                                    <td className="hist-num">{i + 1}</td>
                                    <td className="hist-code">{t.requestCode}</td>
                                    <td className="hist-title-cell">{t.title}</td>
                                    <td>{t.categoryName}</td>
                                    <td className="hist-route">
                                        <span className="hist-branch">{t.originBranchName}</span>
                                        <span className="hist-arrow">→</span>
                                        <span className="hist-branch">{t.destinationBranchName}</span>
                                    </td>
                                    <td>
                                        <span className={getPriorityClass(t.priority)}>
                                            {t.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={getStatusClass(t.status)}>
                                            {STATUS_LABELS[t.status] ?? t.status}
                                        </span>
                                    </td>
                                    <td className="hist-date">{formatDate(t.requestedAt as unknown as string)}</td>
                                    <td>
                                        <Link to={`/transfers/${t.requestId}`} className="hist-view-btn">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="hist-count">
                Showing <strong>{filtered.length}</strong> of <strong>{transfers.length}</strong> records
            </p>
        </div>
    );
};

export default TransferHistory;
