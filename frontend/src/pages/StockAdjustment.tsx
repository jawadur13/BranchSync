import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './StockAdjustment.css';

interface StockItem {
    stockItemId: number;
    itemName: string;
    unit: string;
}

interface CategoryOption {
    categoryId: number;
    categoryName: string;
    behaviorType: string;
}

interface StockManualAdjustment {
    adjustmentId: number;
    branchId: number;
    branchName: string;
    stockItemId: number;
    itemName: string;
    quantity: number;
    reason: string;
    status: string;
    submittedAt: string;
    submittedByFullName: string | null;
    submittedByEmployeeId: string | null;
    approvedByFullName: string | null;
    decidedAt: string | null;
    decisionNote: string | null;
}

const StockAdjustment = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isManager = user?.role === 'BRANCH_MANAGER' || user?.role === 'OPERATION_MANAGER' || user?.role === 'FIRST_EXECUTIVE_OFFICER';
    const isOfficer = user?.role === 'OFFICER';

    const [adjustments, setAdjustments] = useState<StockManualAdjustment[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Submission form (Officer)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedStockItemId, setSelectedStockItemId] = useState<string>('');
    const [quantity, setQuantity] = useState('');
    const [isCredit, setIsCredit] = useState(true);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [currentBalance, setCurrentBalance] = useState<number | null>(null);

    // Manager decision states
    const [decisionNote, setDecisionNote] = useState<Record<number, string>>({});
    const [deciding, setDeciding] = useState<number | null>(null);

    useEffect(() => {
        if (isOfficer || isManager) {
            fetchAdjustments();
        }
        if (isOfficer) {
            fetchCategories();
        }
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/lookup/categories');
            // Filter to only display STOCK behavior categories
            const stockCats = res.data.filter((c: any) => c.behaviorType === 'STOCK');
            setCategories(stockCats);
        } catch (err) {
            console.error('Failed to load stock categories', err);
        }
    };

    const handleCategoryChange = async (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        setSelectedStockItemId('');
        setCurrentBalance(null);
        if (!categoryId) {
            setStockItems([]);
            return;
        }
        try {
            const res = await api.get(`/lookup/stock-items/${categoryId}`);
            setStockItems(res.data);
        } catch (err) {
            console.error('Failed to load stock items for category', err);
        }
    };

    const handleStockItemChange = async (itemId: string) => {
        setSelectedStockItemId(itemId);
        setCurrentBalance(null);
        if (!itemId || !user?.branchId) return;

        try {
            const res = await api.get(`/stock/balance/${user.branchId}/${itemId}`);
            setCurrentBalance(res.data.currentQuantity);
        } catch {
            setCurrentBalance(0);
        }
    };

    const fetchAdjustments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/stock/adjust/all');
            setAdjustments(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load adjustments.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStockItemId || !quantity || !reason.trim()) { 
            setError('Please select stock item, quantity and provide a reason.'); 
            return; 
        }
        
        const numericQty = parseInt(quantity);
        if (isNaN(numericQty) || numericQty <= 0) {
            setError('Please enter a valid positive quantity.');
            return;
        }

        if (!isCredit && currentBalance !== null && numericQty > currentBalance) {
            setError(`Insufficient stock balance! Your branch currently has ${currentBalance} items, so you cannot request a debit of ${numericQty} items.`);
            return;
        }

        setSubmitting(true); setError(''); setSuccess('');
        try {
            const signedQty = isCredit ? numericQty : -numericQty;
            await api.post('/stock/adjust', { 
                stockItemId: Number(selectedStockItemId), 
                quantity: signedQty, 
                reason 
            });
            setSuccess('Adjustment submitted! Awaiting manager approval.');
            setQuantity(''); setReason(''); setSelectedStockItemId(''); setSelectedCategoryId(''); setStockItems([]); setCurrentBalance(null);
            fetchAdjustments();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit adjustment.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecide = async (adjustmentId: number, approved: boolean) => {
        setDeciding(adjustmentId); setError(''); setSuccess('');
        try {
            await api.post(`/stock/adjust/${adjustmentId}/decide`, {
                approved,
                decisionNote: decisionNote[adjustmentId] || '',
            });
            setSuccess(`Adjustment ${approved ? 'approved' : 'rejected'} successfully.`);
            fetchAdjustments();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setDeciding(null);
        }
    };

    const formatDate = (s: string | null) => {
        if (!s) return '—';
        return new Date(s).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status: string) => {
        if (status === 'APPROVED') return 'adj-badge-approved';
        if (status === 'REJECTED') return 'adj-badge-rejected';
        return 'adj-badge-pending';
    };

    const pending = adjustments.filter(a => a.status === 'PENDING');
    const history = adjustments.filter(a => a.status !== 'PENDING');

    if (!isOfficer && !isManager) {
        return (
            <div className="adj-container">
                <div className="adj-access-denied">🔒 Access Denied — Stock adjustments are only accessible to branch Officers and Managers.</div>
            </div>
        );
    }

    return (
        <div className="adj-container">
            <div className="adj-header">
                <div>
                    <h1 className="adj-title">⚙️ Stock Quantity Adjustments</h1>
                    <p className="adj-subtitle">Manual asset count corrections with mandatory manager approval</p>
                </div>
                <button className="btn-ghost" onClick={() => navigate('/stock/ledger')}>
                    📒 View Stock Ledger
                </button>
            </div>

            {error && <div className="adj-alert adj-alert-error">{error}</div>}
            {success && <div className="adj-alert adj-alert-success">{success}</div>}

            <div className="adj-grid">
                {isOfficer && (
                    <div className="adj-panel-card">
                        <h3>➕ Request Stock Correction</h3>
                        <form onSubmit={handleSubmit} className="adj-form">
                            <div className="form-group">
                                <label className="form-label">Asset Category</label>
                                <select 
                                    className="form-control" 
                                    value={selectedCategoryId} 
                                    onChange={e => handleCategoryChange(e.target.value)}
                                    required
                                >
                                    <option value="">Select category...</option>
                                    {categories.map(c => (
                                        <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Stock Item</label>
                                <select 
                                    className="form-control" 
                                    value={selectedStockItemId} 
                                    onChange={e => handleStockItemChange(e.target.value)}
                                    disabled={!selectedCategoryId}
                                    required
                                >
                                    <option value="">Select stock item...</option>
                                    {stockItems.map(item => (
                                        <option key={item.stockItemId} value={item.stockItemId}>{item.itemName}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedStockItemId && currentBalance !== null && (
                                <div className="balance-info-alert">
                                    Current Quantity On Hand: <strong>{currentBalance} items</strong>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Adjustment Type</label>
                                <div className="radio-toggle-group">
                                    <button 
                                        type="button" 
                                        className={`toggle-btn ${isCredit ? 'active active-green' : ''}`}
                                        onClick={() => setIsCredit(true)}
                                    >
                                        🟢 Credit (Add items)
                                    </button>
                                    <button 
                                        type="button" 
                                        className={`toggle-btn ${!isCredit ? 'active active-red' : ''}`}
                                        onClick={() => setIsCredit(false)}
                                    >
                                        🔴 Debit (Reduce items)
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    placeholder="Enter item count change"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mandatory Correction Reason</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder="Explain why this correction is necessary (e.g. audit audit, damage, etc.)"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-admin-primary" style={{ width: '100%' }} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Correction Request'}
                            </button>
                        </form>
                    </div>
                )}

                <div className={isOfficer ? "adj-panel-card" : "adj-panel-card full-width-card"}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>⏳ Pending Manager Review</h3>
                        <span className="count-indicator">{pending.length} pending</span>
                    </div>

                    {pending.length === 0 ? (
                        <div className="adj-empty-state">
                            <span className="empty-icon">🎉</span>
                            <h4>No Pending Adjustments</h4>
                            <p>No stock adjustments are awaiting manager review at this time.</p>
                        </div>
                    ) : (
                        <div className="adjustments-list">
                            {pending.map(adj => (
                                <div key={adj.adjustmentId} className="adj-item-card">
                                    <div className="adj-card-top">
                                        <div className="adj-item-name">📦 {adj.itemName}</div>
                                        <div className={`adj-badge ${getStatusBadge(adj.status)}`}>{adj.status}</div>
                                    </div>
                                    <div className="adj-details-meta">
                                        <span>Submitted By: <strong>{adj.submittedByFullName}</strong></span>
                                        <span>Submitted At: <strong>{formatDate(adj.submittedAt)}</strong></span>
                                    </div>
                                    <div className="adj-amount-line">
                                        Adjustment: <strong className={adj.quantity > 0 ? "text-green" : "text-red"}>
                                            {adj.quantity > 0 ? `+${adj.quantity}` : `${adj.quantity}`} items
                                        </strong>
                                    </div>
                                    <div className="adj-reason-quote">
                                        <strong>Reason:</strong> "{adj.reason}"
                                    </div>

                                    {isManager && (
                                        <div className="manager-action-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                style={{ marginBottom: '8px', fontSize: '13px' }}
                                                placeholder="Decision Note (Optional)"
                                                value={decisionNote[adj.adjustmentId] || ''}
                                                onChange={e => setDecisionNote(prev => ({ ...prev, [adj.adjustmentId]: e.target.value }))}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="action-btn action-approve" 
                                                    style={{ flex: 1, padding: '8px' }}
                                                    onClick={() => handleDecide(adj.adjustmentId, true)}
                                                    disabled={deciding === adj.adjustmentId}
                                                >
                                                    ✅ Approve
                                                </button>
                                                <button 
                                                    className="action-btn action-rejected" 
                                                    style={{ flex: 1, padding: '8px' }}
                                                    onClick={() => handleDecide(adj.adjustmentId, false)}
                                                    disabled={deciding === adj.adjustmentId}
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="table-card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3>📜 Correction History Logs</h3>
                </div>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>Loading adjustments logs...</div>
                ) : history.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0', fontStyle: 'italic' }}>
                        No resolved manual stock adjustments logs found for this branch.
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Item</th>
                                <th>Qty Change</th>
                                <th>Status</th>
                                <th>Submitted By</th>
                                <th>Reason</th>
                                <th>Decided By</th>
                                <th>Decision Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(adj => (
                                <tr key={adj.adjustmentId}>
                                    <td className="whitespace-nowrap">{formatDate(adj.submittedAt)}</td>
                                    <td><strong>{adj.itemName}</strong></td>
                                    <td style={{ color: adj.quantity > 0 ? '#319795' : '#e53e3e', fontWeight: 'bold' }}>
                                        {adj.quantity > 0 ? `+${adj.quantity}` : `${adj.quantity}`}
                                    </td>
                                    <td>
                                        <span className={`entry-badge ${adj.status === 'APPROVED' ? 'badge-in' : 'badge-out'}`}>
                                            {adj.status}
                                        </span>
                                    </td>
                                    <td>{adj.submittedByFullName || '—'}</td>
                                    <td>{adj.reason}</td>
                                    <td>{adj.approvedByFullName || '—'}</td>
                                    <td>{adj.decisionNote || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default StockAdjustment;
