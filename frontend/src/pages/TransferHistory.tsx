import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import type { TransferResponseDto } from '../types/transfer';
import { useAuth } from '../context/AuthContext';
import './TransferHistory.css';

const STATUS_LABELS: Record<string, string> = {
    COMPLETED:           'Completed',
    REJECTED_ON_RECEIPT: 'Rejected on Receipt',
    REJECTED_BY_HQ:      'Rejected by HQ',
    REJECTED_BY_MANAGER: 'Rejected by Manager',
    CANCELLED:           'Cancelled',
    PENDING_INTERNAL:    'Pending Manager',
    PENDING_HQ_APPROVAL: 'Pending HQ',
    PENDING_ASSIGNMENT:  'Pending Assignment',
    PENDING_FINAL_RELEASE: 'Pending Release',
    READY_FOR_PICKUP:     'Ready for Pickup',
    IN_TRANSIT:          'In Transit',
    DELIVERED:           'Delivered',
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
    const [filterBranch,    setFilterBranch]    = useState('');
    const [startDate,       setStartDate]       = useState('');
    const [endDate,         setEndDate]         = useState('');
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

    // dynamic branch options extracted from visible records
    const uniqueBranches = Array.from(
        new Set(transfers.flatMap(t => [t.originBranchName, t.destinationBranchName]).filter(Boolean))
    ).sort();

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
                t.categoryName?.toLowerCase().includes(q) ||
                t.initiatedByFullName?.toLowerCase().includes(q);
            const matchStatus   = !filterStatus   || t.status === filterStatus;
            const matchPriority = !filterPriority || t.priority === filterPriority;
            const matchBranch   = !filterBranch   || t.originBranchName === filterBranch || t.destinationBranchName === filterBranch;
            
            const reqDate = new Date(t.requestedAt);
            const matchStart = !startDate || reqDate >= new Date(startDate);
            const matchEnd = !endDate || reqDate <= new Date(endDate + 'T23:59:59');

            return matchSearch && matchStatus && matchPriority && matchBranch && matchStart && matchEnd;
        })
        .sort((a, b) => {
            const da = new Date(a.requestedAt).getTime();
            const db = new Date(b.requestedAt).getTime();
            return sortOrder === 'desc' ? db - da : da - db;
        });

    const getStatusClass = (status: string) => {
        if (status === 'COMPLETED')           return 'hist-badge hist-badge-success';
        if (status === 'REJECTED_ON_RECEIPT') return 'hist-badge hist-badge-danger';
        if (status === 'REJECTED_BY_HQ')      return 'hist-badge hist-badge-danger';
        if (status === 'REJECTED_BY_MANAGER') return 'hist-badge hist-badge-danger';
        if (status === 'CANCELLED')           return 'hist-badge hist-badge-neutral';
        
        // Active/Pending states
        if (status === 'IN_TRANSIT')          return 'hist-badge hist-badge-high';
        if (status === 'READY_FOR_PICKUP')    return 'hist-badge hist-badge-high';
        if (status === 'DELIVERED')           return 'hist-badge hist-badge-success';
        
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

    // ── Print Report Handler ──────────────────────────────────────────
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableRows = filtered.map((t, idx) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${t.requestCode}</strong></td>
                <td>${t.title}</td>
                <td>${t.categoryName}</td>
                <td>${t.originBranchName} → ${t.destinationBranchName}</td>
                <td>${t.priority}</td>
                <td>${STATUS_LABELS[t.status] || t.status}</td>
                <td>${formatDate(t.requestedAt)}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Jamuna Bank PLC - Transfer History Report</title>
                    <style>
                        body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; }
                        .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 26px; color: #003366; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
                        .meta { font-size: 13px; color: #64748b; margin-top: 5px; font-weight: 500; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                        th, td { border: 1px solid #cbd5e1; padding: 12px 10px; text-align: left; }
                        th { background-color: #f1f5f9; color: #0f172a; font-weight: 600; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        .summary { margin-top: 30px; padding: 15px; background: #f0f6ff; border: 1px solid #bae6fd; border-radius: 8px; font-size: 14px; color: #075985; }
                        @page { size: landscape; margin: 15mm; }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <div>
                            <div class="title">JAMUNA BANK PLC</div>
                            <div class="meta">Inter-Branch Coordination & Logistics Report</div>
                        </div>
                        <div style="text-align: right; font-size: 13px; color: #475569; line-height: 1.5;">
                            <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                            <strong>Generated By:</strong> ${user?.fullName || 'System User'} (${user?.role})
                        </div>
                    </div>
                    <h3 style="color: #0f172a; margin-bottom: 10px;">${user?.role === 'SYSTEM_ADMIN' ? '📜 All Transfer Request History' : '📜 Closed Transfer Request History'}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40px; text-align: center;">#</th>
                                <th>Code</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Route</th>
                                <th>Priority</th>
                                <th>Outcome</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <div class="summary">
                        <strong>Report Summary:</strong> Showing ${filtered.length} of ${transfers.length} total history records.
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // ── stats ─────────────────────────────────────────────────────────
    const stats = {
        total:    transfers.length,
        completed: transfers.filter(t => t.status === 'COMPLETED').length,
        rejected:  transfers.filter(t => t.status === 'REJECTED_ON_RECEIPT' || t.status === 'REJECTED_BY_HQ' || t.status === 'REJECTED_BY_MANAGER').length,
        cancelled: transfers.filter(t => t.status === 'CANCELLED').length,
        active:    transfers.filter(t => !['COMPLETED', 'REJECTED_ON_RECEIPT', 'REJECTED_BY_HQ', 'REJECTED_BY_MANAGER', 'CANCELLED'].includes(t.status)).length,
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
                            ? 'All transfer requests (active, in-transit, and closed)'
                            : 'Closed transfers from your branch'}
                    </p>
                </div>
                <div className="hist-actions">
                    <button className="hist-action-btn print-btn" onClick={handlePrint} title="Print report or save as PDF">
                        🖨️ Print / Save PDF
                    </button>
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
                {user?.role === 'SYSTEM_ADMIN' && (
                    <div className="hist-stat-card hist-stat-active">
                        <span className="hist-stat-num">{stats.active}</span>
                        <span className="hist-stat-lbl">Active</span>
                    </div>
                )}
            </div>

            {error && <div className="hist-error">{error}</div>}

            {/* ── Filters ── */}
            <div className="hist-filters-wrapper">
                <div className="hist-filters">
                    <input
                        className="hist-search"
                        type="text"
                        placeholder="🔍 Search code, title, category, initiator..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select className="hist-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">All Statuses</option>
                        {Array.from(new Set(transfers.map(t => t.status))).filter(Boolean).sort().map(status => (
                            <option key={status} value={status}>
                                {STATUS_LABELS[status] || status}
                            </option>
                        ))}
                    </select>
                    <select className="hist-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                        <option value="">All Priorities</option>
                        {PRIORITY_OPTIONS.filter(Boolean).map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <select className="hist-select" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                        <option value="">All Branches</option>
                        {uniqueBranches.map(br => (
                            <option key={br} value={br}>{br}</option>
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
                <div className="hist-date-filters">
                    <div className="date-group">
                        <label>From:</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="date-group">
                        <label>To:</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    {(startDate || endDate || filterBranch) && (
                        <button className="clear-filters-btn" onClick={() => { setStartDate(''); setEndDate(''); setFilterBranch(''); }}>
                            Clear Extra
                        </button>
                    )}
                </div>
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
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span>{t.categoryName}</span>
                                            {t.behaviorType && (
                                                <span className={`type-badge behavior-${t.behaviorType.toLowerCase()}`} style={{ alignSelf: 'flex-start', padding: '1px 6px', fontSize: '10px', width: 'fit-content' }}>
                                                    {t.behaviorType}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="hist-route-flex">
                                            <span className="hist-branch">{t.originBranchName}</span>
                                            <span className="hist-arrow">→</span>
                                            <span className="hist-branch">{t.destinationBranchName}</span>
                                        </div>
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
