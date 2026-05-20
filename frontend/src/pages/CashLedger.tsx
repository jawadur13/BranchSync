import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './CashLedger.css';

interface LedgerEntry {
    ledgerId: number;
    entryType: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    reason: string | null;
    createdAt: string;
    requestId: number | null;
    requestCode: string | null;
    actorFullName: string | null;
    actorEmployeeId: string | null;
    approverFullName: string | null;
    approverEmployeeId: string | null;
}

interface BranchBalance {
    branchId: number;
    branchName: string;
    branchCode: string;
    currentBalance: number;
    lastUpdatedAt: string | null;
}

const CashLedger = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isAdmin = user?.role === 'SYSTEM_ADMIN';
    const isManager = user?.role === 'BRANCH_MANAGER' || user?.role === 'OPERATION_MANAGER' || user?.role === 'FIRST_EXECUTIVE_OFFICER';
    const isCashOfficer = user?.role === 'OFFICER' && user?.departmentName?.toLowerCase().includes('cash');

    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [balance, setBalance] = useState<BranchBalance | null>(null);
    const [allBalances, setAllBalances] = useState<BranchBalance[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(isAdmin ? null : user?.branchId || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAdmin) {
            loadAllBalances();
        } else if (user?.branchId) {
            loadLedger(user.branchId);
        }
    }, []);

    const loadAllBalances = async () => {
        try {
            const res = await api.get('/cash/balances');
            setAllBalances(res.data);
        } catch {
            setError('Failed to load branch balances.');
        }
    };

    const loadLedger = async (branchId: number) => {
        setLoading(true); setError('');
        try {
            const [balRes, ledgerRes] = await Promise.all([
                api.get(`/cash/balance/${branchId}`),
                api.get(`/cash/ledger/${branchId}`),
            ]);
            setBalance(balRes.data);
            setEntries(ledgerRes.data);
            setSelectedBranchId(branchId);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load ledger.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (s: string | null) => {
        if (!s) return '—';
        return new Date(s).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatAmt = (n: number) => `৳${Number(n).toLocaleString('en-BD')}`;

    const getEntryStyle = (type: string) => {
        if (type === 'TRANSFER_IN' || type === 'REVERSAL_IN') return 'entry-in';
        if (type === 'TRANSFER_OUT' || type === 'REVERSAL_OUT') return 'entry-out';
        return 'entry-adj';
    };

    const getEntryLabel = (type: string) => {
        switch (type) {
            case 'TRANSFER_IN': return '⬇️ Cash Received';
            case 'TRANSFER_OUT': return '⬆️ Cash Sent';
            case 'REVERSAL_IN': return '↩️ Reversal (Credit)';
            case 'REVERSAL_OUT': return '↩️ Reversal (Debit)';
            case 'MANUAL_ADJUSTMENT': return '⚙️ Manual Adjustment';
            default: return type.replace(/_/g, ' ');
        }
    };

    // Access control
    if (!isAdmin && !isManager && !isCashOfficer) {
        return (
            <div className="ledger-container">
                <div className="ledger-access-denied">
                    🔒 Access Denied — Only Branch Managers, Cash Department Officers, and System Administrators can view the Cash Ledger.
                </div>
            </div>
        );
    }

    return (
        <div className="ledger-container">
            <div className="ledger-header">
                <div>
                    <h1 className="ledger-title">💰 Cash Ledger</h1>
                    <p className="ledger-subtitle">Per-branch cash balance & movement audit trail</p>
                </div>
                {(isManager || isCashOfficer) && (
                    <button className="btn-ghost" onClick={() => navigate('/cash/adjust')}>
                        ⚙️ Manual Adjustment
                    </button>
                )}
            </div>

            {error && <div className="ledger-error">{error}</div>}

            {/* Admin: branch selector */}
            {isAdmin && (
                <div className="ledger-branch-grid">
                    {allBalances.map(b => (
                        <div
                            key={b.branchId}
                            className={`branch-balance-card ${selectedBranchId === b.branchId ? 'selected' : ''}`}
                            onClick={() => loadLedger(b.branchId)}
                        >
                            <div className="bbc-name">{b.branchName}</div>
                            <div className="bbc-code">{b.branchCode}</div>
                            <div className="bbc-balance">{formatAmt(b.currentBalance)}</div>
                            <div className="bbc-updated">{b.lastUpdatedAt ? formatDate(b.lastUpdatedAt) : 'Not initialized'}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Balance hero */}
            {balance && (
                <div className="balance-hero">
                    <div className="balance-hero-left">
                        <div className="balance-branch-name">{balance.branchName}</div>
                        <div className="balance-label">Current Cash Balance</div>
                        <div className="balance-amount">{formatAmt(balance.currentBalance)}</div>
                        {balance.lastUpdatedAt && (
                            <div className="balance-updated">Last updated: {formatDate(balance.lastUpdatedAt)}</div>
                        )}
                    </div>
                    <div className="balance-hero-right">
                        <div className="balance-stat">
                            <span>{entries.filter(e => e.entryType === 'TRANSFER_IN' || e.entryType === 'REVERSAL_IN').length}</span>
                            <label>Credits</label>
                        </div>
                        <div className="balance-stat">
                            <span>{entries.filter(e => e.entryType === 'TRANSFER_OUT' || e.entryType === 'REVERSAL_OUT').length}</span>
                            <label>Debits</label>
                        </div>
                        <div className="balance-stat">
                            <span>{entries.filter(e => e.entryType === 'MANUAL_ADJUSTMENT').length}</span>
                            <label>Adjustments</label>
                        </div>
                    </div>
                </div>
            )}

            {/* Ledger table */}
            {loading ? (
                <div className="ledger-loading">Loading ledger...</div>
            ) : selectedBranchId && entries.length === 0 ? (
                <div className="ledger-empty">No cash movements recorded yet for this branch.</div>
            ) : selectedBranchId ? (
                <div className="ledger-table-wrapper">
                    <table className="ledger-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Balance Before</th>
                                <th>Balance After</th>
                                <th>Actor</th>
                                <th>Approved By</th>
                                <th>Linked Request</th>
                                <th>Reason / Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(e => (
                                <tr key={e.ledgerId} className={`ledger-row ${getEntryStyle(e.entryType)}`}>
                                    <td className="ledger-date">{formatDate(e.createdAt)}</td>
                                    <td><span className={`ledger-badge ${getEntryStyle(e.entryType)}`}>{getEntryLabel(e.entryType)}</span></td>
                                    <td className={`ledger-amount ${e.balanceAfter < e.balanceBefore ? 'amt-out' : 'amt-in'}`}>
                                        {e.balanceAfter < e.balanceBefore ? '-' : '+'}{formatAmt(e.amount)}
                                    </td>
                                    <td className="ledger-bal">{formatAmt(e.balanceBefore)}</td>
                                    <td className="ledger-bal ledger-bal-after">{formatAmt(e.balanceAfter)}</td>
                                    <td>{e.actorFullName || '—'}{e.actorEmployeeId ? <><br/><small>{e.actorEmployeeId}</small></> : null}</td>
                                    <td>{e.approverFullName || '—'}</td>
                                    <td>
                                        {e.requestCode
                                            ? <span className="ledger-req-link" onClick={() => navigate(`/transfers/${e.requestId}`)}>{e.requestCode}</span>
                                            : '—'}
                                    </td>
                                    <td className="ledger-reason">{e.reason || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="ledger-empty">Select a branch to view its cash ledger.</div>
            )}
        </div>
    );
};

export default CashLedger;
