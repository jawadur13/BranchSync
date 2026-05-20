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

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableRows = entries.map((e, idx) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${formatDate(e.createdAt)}</td>
                <td>${getEntryLabel(e.entryType)}</td>
                <td style="color: ${e.balanceAfter < e.balanceBefore ? '#dc2626' : '#16a34a'}; font-weight: 700;">
                    ${e.balanceAfter < e.balanceBefore ? '-' : '+'}${formatAmt(e.amount)}
                </td>
                <td>${formatAmt(e.balanceBefore)}</td>
                <td style="font-weight: 700;">${formatAmt(e.balanceAfter)}</td>
                <td>${e.actorFullName || '—'}${e.actorEmployeeId ? ` (${e.actorEmployeeId})` : ''}</td>
                <td>${e.approverFullName || '—'}</td>
                <td>${e.requestCode || '—'}</td>
                <td>${e.reason || '—'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Jamuna Bank PLC - Cash Ledger Report</title>
                    <style>
                        body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; }
                        .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 26px; color: #003366; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
                        .meta { font-size: 13px; color: #64748b; margin-top: 5px; font-weight: 500; }
                        .branch-details { margin-bottom: 20px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th, td { border: 1px solid #cbd5e1; padding: 10px 8px; text-align: left; }
                        th { background-color: #f1f5f9; color: #0f172a; font-weight: 600; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        .summary { margin-top: 30px; padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 14px; color: #166534; }
                        @page { size: landscape; margin: 15mm; }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <div>
                            <div class="title">JAMUNA BANK PLC</div>
                            <div class="meta">💰 Cash Ledger Audit & Transaction Report</div>
                        </div>
                        <div style="text-align: right; font-size: 13px; color: #475569; line-height: 1.5;">
                            <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                            <strong>Generated By:</strong> ${user?.fullName || 'System User'} (${user?.role})
                        </div>
                    </div>
                    
                    ${balance ? `
                    <div class="branch-details">
                        <strong>Branch:</strong> ${balance.branchName} (${balance.branchCode}) &nbsp;|&nbsp; 
                        <strong>Current Cash Balance:</strong> <span style="color: #16a34a; font-weight: 800;">${formatAmt(balance.currentBalance)}</span> &nbsp;|&nbsp; 
                        <strong>Last Updated:</strong> ${formatDate(balance.lastUpdatedAt)}
                    </div>
                    ` : ''}

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px; text-align: center;">#</th>
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
                            ${tableRows}
                        </tbody>
                    </table>
                    
                    <div class="summary">
                        <strong>Report Summary:</strong> Showing ${entries.length} cash ledger entries. &nbsp;|&nbsp; 
                        <strong>Credits:</strong> ${entries.filter(e => e.balanceAfter >= e.balanceBefore).length} &nbsp;|&nbsp; 
                        <strong>Debits:</strong> ${entries.filter(e => e.balanceAfter < e.balanceBefore).length}
                    </div>

                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintAllBranches = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const totalCash = allBalances.reduce((sum, b) => sum + (Number(b.currentBalance) || 0), 0);

        const tableRows = allBalances.map((b, idx) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${b.branchName}</strong></td>
                <td>${b.branchCode}</td>
                <td style="font-weight: 800; color: #1e3a8a;">${formatAmt(b.currentBalance)}</td>
                <td>${b.lastUpdatedAt ? formatDate(b.lastUpdatedAt) : 'Not initialized'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Jamuna Bank PLC - All Branch Cash Balances Report</title>
                    <style>
                        body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; }
                        .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 26px; color: #003366; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
                        .meta { font-size: 13px; color: #64748b; margin-top: 5px; font-weight: 500; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                        th, td { border: 1px solid #cbd5e1; padding: 12px 10px; text-align: left; }
                        th { background-color: #f1f5f9; color: #0f172a; font-weight: 600; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        .summary { margin-top: 30px; padding: 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 15px; color: #1e40af; }
                        @page { size: portrait; margin: 15mm; }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <div>
                            <div class="title">JAMUNA BANK PLC</div>
                            <div class="meta">🏢 Consolidated Branch Cash Balances Report</div>
                        </div>
                        <div style="text-align: right; font-size: 13px; color: #475569; line-height: 1.5;">
                            <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                            <strong>Generated By:</strong> ${user?.fullName || 'System Admin'} (${user?.role})
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px; text-align: center;">#</th>
                                <th>Branch Name</th>
                                <th>Branch Code</th>
                                <th>Current Vault Cash Balance</th>
                                <th>Last Transaction Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    
                    <div class="summary">
                        <strong>Consolidated Summary:</strong><br/>
                        <div style="margin-top: 8px; font-size: 14px;">
                            • Total Active Cash-tracked Branches: <strong>${allBalances.length}</strong><br/>
                            • Total Vault Cash in System: <strong style="font-size: 17px; color: #1e3a8a;">৳${totalCash.toLocaleString('en-BD')}</strong>
                        </div>
                    </div>

                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
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
                <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedBranchId && entries.length > 0 && (
                        <button className="btn-ghost" onClick={handlePrint}>
                            🖨️ Export PDF / Print
                        </button>
                    )}
                    {isAdmin && !selectedBranchId && allBalances.length > 0 && (
                        <button className="btn-ghost" onClick={handlePrintAllBranches}>
                            🖨️ Print All Branch Balances
                        </button>
                    )}
                    {(isManager || isCashOfficer) && (
                        <button className="btn-ghost" onClick={() => navigate('/cash/adjust')}>
                            ⚙️ Manual Adjustment
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="ledger-error">{error}</div>}

            {/* Admin: branch selector */}
            {isAdmin && (
                <div className="ledger-branch-grid">
                    {allBalances.map(b => (
                        <div
                            key={b.branchId}
                            className={`branch-balance-card ${selectedBranchId === b.branchId ? 'selected' : ''}`}
                            onClick={() => {
                                if (selectedBranchId === b.branchId) {
                                    setSelectedBranchId(null);
                                    setBalance(null);
                                    setEntries([]);
                                } else {
                                    loadLedger(b.branchId);
                                }
                            }}
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
