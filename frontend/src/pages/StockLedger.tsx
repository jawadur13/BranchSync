import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './StockLedger.css';

interface StockItem {
    stockItemId: number;
    itemName: string;
    unit: string;
    description: string;
}

interface StockLedgerEntry {
    ledgerId: number;
    stockItem: StockItem;
    entryType: string;
    quantity: number;
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

interface StockBalance {
    stockBalanceId: number;
    branchId: number;
    branchName: string;
    branchCode: string;
    stockItemId: number;
    itemName: string;
    categoryName: string;
    currentQuantity: number;
    unit: string;
    lastUpdatedAt: string | null;
    departmentId?: number | null;
    departmentName?: string | null;
}

interface BranchStockSummary {
    branchId: number;
    branchName: string;
    branchCode: string;
    itemsCount: number;
    totalQuantity: number;
}

const StockLedger = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isNetworkViewer = user?.role === 'SYSTEM_ADMIN' || user?.role === 'HQ_LOGISTICS_OFFICER';

    const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
    const [balances, setBalances] = useState<StockBalance[]>([]);
    const [branchSummaries, setBranchSummaries] = useState<BranchStockSummary[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(isNetworkViewer ? null : user?.branchId || null);
    const [selectedBranchName, setSelectedBranchName] = useState<string>('');
    const [selectedStockItemId, setSelectedStockItemId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [balanceSearchTerm, setBalanceSearchTerm] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState<number | string>('ALL');
    const [departmentsLookup, setDepartmentsLookup] = useState<{ departmentId: number; departmentName: string }[]>([]);

    useEffect(() => {
        // Fetch all departments lookup list
        api.get('/lookup/departments')
            .then(res => setDepartmentsLookup(res.data))
            .catch(() => {});

        if (isNetworkViewer) {
            loadBranchSummaries();
        } else if (user?.branchId) {
            loadLedger(user.branchId);
        }
    }, []);

    const loadBranchSummaries = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get('/stock/balances');
            // Group balances by branch to create a summary
            const map: Record<number, BranchStockSummary> = {};
            res.data.forEach((b: any) => {
                if (!map[b.branchId]) {
                    map[b.branchId] = {
                        branchId: b.branchId,
                        branchName: b.branchName,
                        branchCode: b.branchCode,
                        itemsCount: 0,
                        totalQuantity: 0
                    };
                }
                map[b.branchId].itemsCount += 1;
                map[b.branchId].totalQuantity += b.currentQuantity || b.quantity || 0;
            });
            setBranchSummaries(Object.values(map));
        } catch (err: any) {
            setError('Failed to load branch stock summaries.');
        } finally {
            setLoading(false);
        }
    };

    const loadLedger = async (branchId: number) => {
        setLoading(true); setError('');
        try {
            const balRes = await api.get(`/stock/balances/${branchId}`);
            
            // Filter balances by department if user is an OFFICER
            const filteredBalances = balRes.data.filter((b: any) => {
                if (user?.role === 'OFFICER') {
                    return b.departmentId === user?.departmentId;
                }
                return true;
            });
            
            setBalances(filteredBalances);
            setSelectedBranchId(branchId);
            setSelectedDeptId('ALL');
            if (filteredBalances.length > 0) {
                setSelectedBranchName(filteredBalances[0].branchName || `Branch #${branchId}`);
                // Select All Items (0) by default
                loadLedgerForItem(branchId, 0);
            } else {
                setSelectedBranchName(isNetworkViewer ? `Branch #${branchId}` : 'Your Branch');
                setEntries([]);
                setSelectedStockItemId(null);
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load stock balances.');
            setLoading(false);
        }
    };

    const loadLedgerForItem = async (branchId: number, stockItemId: number) => {
        setLoading(true); setError('');
        try {
            const ledgerRes = await api.get(`/stock/ledger/${branchId}/${stockItemId}`);
            setEntries(ledgerRes.data);
            setSelectedStockItemId(stockItemId);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load stock ledger.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (s: string | null) => {
        if (!s) return '—';
        return new Date(s).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getEntryLabel = (type: string) => {
        switch (type) {
            case 'TRANSFER_IN': return '⬇️ Stock Received';
            case 'TRANSFER_OUT': return '⬆️ Stock Sent';
            case 'REVERSAL_IN': return '↩️ Reversal Credit';
            case 'REVERSAL_OUT': return '↩️ Reversal Debit';
            case 'MANUAL_ADJUSTMENT': return '⚙️ Manual Adjustment';
            default: return type.replace(/_/g, ' ');
        }
    };

    const activeItemName = selectedStockItemId === 0 ? 'All Items' : balances.find(b => b.stockItemId === selectedStockItemId)?.itemName || '';

    // Extract unique departments from the loaded balances for the branch
    const availableDepts = balances.reduce((acc: { id: number; name: string }[], current) => {
        if (current.departmentId && !acc.some(d => d.id === current.departmentId)) {
            const resolvedName = departmentsLookup.find(d => d.departmentId === current.departmentId)?.departmentName 
                || current.departmentName 
                || 'General';
            acc.push({ id: current.departmentId, name: resolvedName });
        }
        return acc;
    }, []);

    const handlePrintBalances = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Ensure we print the currently filtered list (respecting search AND department filter)
        const listToPrint = filteredBalancesList;

        const tableRows = listToPrint.map((b, idx) => {
            const resolvedDeptName = b.departmentId 
                ? (departmentsLookup.find(d => d.departmentId === b.departmentId)?.departmentName || b.departmentName || 'General')
                : 'General';
            return `
                <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td>${b.itemName}</td>
                    <td>${b.categoryName || '—'}</td>
                    <td>${resolvedDeptName}</td>
                    <td style="font-weight: 700; text-align: right;">${b.currentQuantity} ${b.unit || 'pcs'}</td>
                </tr>
            `;
        }).join('');

        const totalItems = listToPrint.reduce((sum, b) => sum + (b.currentQuantity || 0), 0);
        
        const activeDeptName = selectedDeptId === 'ALL' 
            ? 'All Departments' 
            : availableDepts.find(d => d.id.toString() === selectedDeptId.toString())?.name || 'Departmental';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Jamuna Bank PLC - Current Asset Quantity Balances</title>
                    <style>
                        body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; }
                        .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 26px; color: #003366; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
                        .meta { font-size: 13px; color: #64748b; margin-top: 5px; font-weight: 500; }
                        .branch-details { margin-bottom: 20px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; display: flex; justify-content: space-between; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                        th, td { border: 1px solid #cbd5e1; padding: 12px 10px; text-align: left; }
                        th { background-color: #f1f5f9; color: #0f172a; font-weight: 600; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <div>
                            <div class="title">JAMUNA BANK PLC</div>
                            <div class="meta">📦 Branch Inventory Snapshot</div>
                        </div>
                        <div style="text-align: right; font-size: 13px; color: #475569; line-height: 1.5;">
                            <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                            <strong>Generated By:</strong> ${user?.fullName || 'System User'} (${user?.role})
                        </div>
                    </div>
                    <div class="branch-details">
                        <div>
                            <strong>Branch:</strong> ${selectedBranchName}<br/>
                            <strong>Department:</strong> ${activeDeptName}<br/>
                            <strong>Search Filter:</strong> ${balanceSearchTerm.trim() !== '' ? `"${balanceSearchTerm}"` : 'None'}
                        </div>
                        <div style="text-align: right;">
                            <strong>Total Assets Counted:</strong> ${totalItems}
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px; text-align: center;">#</th>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Department</th>
                                <th style="text-align: right;">Current Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows || '<tr><td colspan="5" style="text-align: center;">No items found.</td></tr>'}
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableRows = entries.map((e, idx) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                ${selectedStockItemId === 0 ? `<td>${e.stockItem?.itemName || (e as any).itemName || '—'} (${e.stockItem?.unit || (e as any).unit || 'pcs'})</td>` : ''}
                <td>${formatDate(e.createdAt)}</td>
                <td>${getEntryLabel(e.entryType)}</td>
                <td style="color: ${e.balanceAfter < e.balanceBefore ? '#dc2626' : '#16a34a'}; font-weight: 700;">
                    ${e.balanceAfter < e.balanceBefore ? '-' : '+'}${e.quantity}
                </td>
                <td>${e.balanceBefore}</td>
                <td style="font-weight: 700;">${e.balanceAfter}</td>
                <td>${e.actorFullName || '—'}${e.actorEmployeeId ? ` (${e.actorEmployeeId})` : ''}</td>
                <td>${e.approverFullName || '—'}</td>
                <td>${e.requestCode || '—'}</td>
                <td>${e.reason || '—'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Jamuna Bank PLC - Stock Ledger Report</title>
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
                        @page { size: landscape; margin: 15mm; }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <div>
                            <div class="title">JAMUNA BANK PLC</div>
                            <div class="meta">📦 Stock Ledger Audit & Transaction Report</div>
                        </div>
                        <div style="text-align: right; font-size: 13px; color: #475569; line-height: 1.5;">
                            <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                            <strong>Generated By:</strong> ${user?.fullName || 'System User'} (${user?.role})
                        </div>
                    </div>
                    <div class="branch-details">
                        <strong>Branch:</strong> ${selectedBranchName}<br/>
                        <strong>Asset Item:</strong> ${activeItemName}<br/>
                        <strong>Current Balance:</strong> ${selectedStockItemId === 0 
                            ? `${balances.reduce((sum, b) => sum + (b.currentQuantity || 0), 0)} items` 
                            : `${balances.find(b => b.stockItemId === selectedStockItemId)?.currentQuantity || 0} ${balances.find(b => b.stockItemId === selectedStockItemId)?.unit || 'pcs'}`}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px; text-align: center;">#</th>
                                ${selectedStockItemId === 0 ? '<th>Item</th>' : ''}
                                <th>Timestamp</th>
                                <th>Transaction Type</th>
                                <th>Qty Change</th>
                                <th>Bal Before</th>
                                <th>Bal After</th>
                                <th>Responsible Person</th>
                                <th>Approved By</th>
                                <th>Transfer Code</th>
                                <th>Reason / Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows || '<tr><td colspan="10" style="text-align: center;">No transactions found.</td></tr>'}
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredBalancesList = balances.filter(b => {
        const matchesSearch = b.itemName.toLowerCase().includes(balanceSearchTerm.toLowerCase());
        const matchesDept = selectedDeptId === 'ALL' ? true : b.departmentId?.toString() === selectedDeptId.toString();
        return matchesSearch && matchesDept;
    });

    return (
        <div className="stock-ledger-container">
            <div className="ledger-header-panel">
                <div>
                    <h1 className="ledger-title">📦 Operational Stock Ledger</h1>
                    <p className="ledger-subtitle">
                        {isNetworkViewer
                            ? 'Monitor countable branch inventory, assets, and audit trials across the entire network.'
                            : `Audit trial and current asset balances for your branch.`}
                    </p>
                </div>
                {selectedBranchId && isNetworkViewer && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-ghost" onClick={() => { setSelectedBranchId(null); setEntries([]); setBalances([]); setSelectedStockItemId(null); }}>
                            🔙 Back to Branches
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="ledger-alert ledger-alert-error">{error}</div>}

            {isNetworkViewer && !selectedBranchId ? (
                /* Admin View: Grid of Branches showing summaries */
                <div className="branches-grid">
                    {branchSummaries.map((summary) => (
                        <div key={summary.branchId} className="branch-card clickable-branch-card" style={{ borderLeft: '4px solid var(--color-primary-blue)' }} onClick={() => loadLedger(summary.branchId)}>
                            <div className="branch-card-header">
                                <div className="branch-icon">🏢</div>
                                <div>
                                    <h3>{summary.branchName}</h3>
                                    <span className="branch-code">{summary.branchCode}</span>
                                </div>
                            </div>
                            <div className="branch-card-details">
                                <div className="branch-detail-item">
                                    <span className="detail-lbl">Counted Item Types</span>
                                    <span className="detail-val">{summary.itemsCount}</span>
                                </div>
                                <div className="branch-detail-item">
                                    <span className="detail-lbl">Total Asset Quantity</span>
                                    <span className="detail-val">{summary.totalQuantity} items</span>
                                </div>
                            </div>
                            <div className="branch-card-footer">
                                <span>Click to inspect full audit ledger</span>
                                <span>→</span>
                            </div>
                        </div>
                    ))}
                    {branchSummaries.length === 0 && !loading && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#718096' }}>
                            🏢 No operational stock data or active branch balances established yet.
                        </div>
                    )}
                </div>
            ) : (
                <div className="ledger-details-view">
                    {balances.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                            <button className="btn-admin-primary" onClick={handlePrintBalances} title="Print asset inventory list">
                                🖨️ Print List
                            </button>
                        </div>
                    )}
                    <div className="current-balances-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ margin: 0 }}>📦 Current Asset Quantity Balances ({selectedBranchName})</h3>
                            {balances.length > 0 && (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {(user?.role === 'BRANCH_MANAGER' || user?.role === 'FIRST_EXECUTIVE_OFFICER' || user?.role === 'OPERATION_MANAGER' || user?.role === 'HQ_LOGISTICS_OFFICER' || user?.role === 'SYSTEM_ADMIN') && (
                                        <select
                                            value={selectedDeptId}
                                            onChange={e => setSelectedDeptId(e.target.value)}
                                            style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', outline: 'none', cursor: 'pointer', fontWeight: '600', color: '#1e293b' }}
                                        >
                                            <option value="ALL">All Departments</option>
                                            {availableDepts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    <input
                                        type="text"
                                        placeholder="🔍 Search items..."
                                        value={balanceSearchTerm}
                                        onChange={e => setBalanceSearchTerm(e.target.value)}
                                        style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '13px', width: '200px', outline: 'none', transition: 'border-color 0.2s' }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="stock-balances-flex" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '10px', paddingBottom: '10px' }}>
                            {balances.length > 0 && balanceSearchTerm === '' && (
                                <div 
                                    className={`stock-balance-pill clickable-pill ${selectedStockItemId === 0 ? 'active' : ''}`}
                                    onClick={() => selectedBranchId && loadLedgerForItem(selectedBranchId, 0)}
                                    style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '24px', transition: 'all 0.2s', border: selectedStockItemId === 0 ? '2px solid var(--color-primary-blue)' : '1px solid #cbd5e1', backgroundColor: selectedStockItemId === 0 ? '#ebf8ff' : '#ffffff' }}
                                >
                                    <span className="pill-name" style={{ color: selectedStockItemId === 0 ? 'var(--color-primary-blue)' : '#4a5568', fontWeight: 'bold' }}>All Items</span>
                                    <span className="pill-qty" style={{ marginLeft: '8px', background: 'var(--color-primary-blue)', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                                        {balances.reduce((sum, b) => sum + (b.currentQuantity || 0), 0)} items
                                    </span>
                                </div>
                            )}
                            {filteredBalancesList.map(b => (
                                <div 
                                    key={b.stockBalanceId} 
                                    className={`stock-balance-pill clickable-pill ${selectedStockItemId === b.stockItemId ? 'active' : ''}`}
                                    onClick={() => selectedBranchId && loadLedgerForItem(selectedBranchId, b.stockItemId)}
                                    style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '24px', transition: 'all 0.2s', border: selectedStockItemId === b.stockItemId ? '2px solid var(--color-primary-blue)' : '1px solid #cbd5e1', backgroundColor: selectedStockItemId === b.stockItemId ? '#ebf8ff' : '#ffffff' }}
                                >
                                    <span className="pill-name" style={{ color: selectedStockItemId === b.stockItemId ? 'var(--color-primary-blue)' : '#4a5568', fontWeight: 'bold' }}>{b.itemName}</span>
                                    <span className="pill-qty" style={{ marginLeft: '8px', background: 'var(--color-primary-blue)', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>{b.currentQuantity} {b.unit || 'pcs'}</span>
                                </div>
                            ))}
                            {filteredBalancesList.length === 0 && balances.length > 0 && (
                                <div style={{ color: '#718096', fontSize: '13px', fontStyle: 'italic', padding: '10px' }}>
                                    No items match your search.
                                </div>
                            )}
                            {balances.length === 0 && (
                                <div style={{ color: '#718096', fontSize: '13px', fontStyle: 'italic', padding: '10px' }}>
                                    No assets have been recorded in branch inventory yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {balances.length > 0 && selectedBranchId && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                            <button className="btn-admin-primary" onClick={handlePrint} title="Print report or save as PDF">
                                🖨️ Print / Save PDF
                            </button>
                        </div>
                    )}

                    <div className="table-card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>📜 Asset Transaction & Audit Logs — {selectedStockItemId === 0 ? 'All Items' : activeItemName || 'Select Item'}</h3>
                            {balances.length > 0 && selectedBranchId && (
                                <select 
                                    className="action-select" 
                                    style={{ width: '220px', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}
                                    value={selectedStockItemId !== null ? selectedStockItemId : ''} 
                                    onChange={e => loadLedgerForItem(selectedBranchId, Number(e.target.value))}
                                >
                                    <option value={0}>All Items</option>
                                    {balances.map(b => (
                                        <option key={b.stockItemId} value={b.stockItemId}>{b.itemName}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        {loading ? (
                            <div className="ledger-loading">Loading asset transactions...</div>
                        ) : entries.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📭</span>
                                <h3>No Transactions Found</h3>
                                <p>There are no historical stock records or adjustments logged for this item.</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        {selectedStockItemId === 0 && <th>Item</th>}
                                        <th>Timestamp</th>
                                        <th>Type</th>
                                        <th>Qty Change</th>
                                        <th>Before</th>
                                        <th>After</th>
                                        <th>Responsible</th>
                                        <th>Approved By</th>
                                        <th>Transfer Code</th>
                                        <th>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((e) => (
                                        <tr key={e.ledgerId}>
                                            {selectedStockItemId === 0 && (
                                                <td style={{ fontWeight: '600', color: '#1a202c' }}>
                                                    {e.stockItem?.itemName || (e as any).itemName || '—'} 
                                                    <span style={{ fontSize: '11px', color: '#718096', fontWeight: 'normal', marginLeft: '4px' }}>
                                                        ({e.stockItem?.unit || (e as any).unit || 'pcs'})
                                                    </span>
                                                </td>
                                            )}
                                            <td className="whitespace-nowrap">{formatDate(e.createdAt)}</td>
                                            <td>
                                                <span className={`entry-badge ${e.balanceAfter < e.balanceBefore ? 'badge-out' : 'badge-in'}`}>
                                                    {getEntryLabel(e.entryType)}
                                                </span>
                                            </td>
                                            <td style={{ color: e.balanceAfter < e.balanceBefore ? '#e53e3e' : '#319795', fontWeight: 'bold' }}>
                                                {e.balanceAfter < e.balanceBefore ? '-' : '+'}{e.quantity}
                                            </td>
                                            <td>{e.balanceBefore}</td>
                                            <td className="fw-semibold">{e.balanceAfter}</td>
                                            <td>
                                                <span style={{ fontSize: '13px' }}>{e.actorFullName || '—'}</span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '13px' }}>{e.approverFullName || '—'}</span>
                                            </td>
                                            <td>
                                                {e.requestId ? (
                                                    <span className="ledger-code-link" onClick={() => navigate(`/transfers/${e.requestId}`)}>
                                                        {e.requestCode}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '12px', color: '#4a5568' }} title={e.reason || ''}>
                                                    {e.reason || '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockLedger;
