import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './ManualAdjustment.css';

interface Adjustment {
    adjustmentId: number;
    branchName: string;
    amount: number;
    reason: string;
    status: string;
    submittedAt: string;
    submittedByFullName: string | null;
    submittedByEmployeeId: string | null;
    approvedByFullName: string | null;
    decidedAt: string | null;
    decisionNote: string | null;
}

const ManualAdjustment = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isManager = user?.role === 'BRANCH_MANAGER' || user?.role === 'OPERATION_MANAGER' || user?.role === 'FIRST_EXECUTIVE_OFFICER';
    const isOfficer = user?.role === 'OFFICER';

    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Submission form (Officer)
    const [amount, setAmount] = useState('');
    const [isCredit, setIsCredit] = useState(true);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [currentBalance, setCurrentBalance] = useState<number | null>(null);

    // Manager decision states
    const [decisionNote, setDecisionNote] = useState<Record<number, string>>({});
    const [deciding, setDeciding] = useState<number | null>(null);

    useEffect(() => {
        fetchAdjustments();
        if (user?.branchId) {
            fetchBranchBalance();
        }
    }, []);

    const fetchBranchBalance = async () => {
        if (!user?.branchId) return;
        try {
            const res = await api.get(`/cash/balance/${user.branchId}`);
            setCurrentBalance(res.data.currentBalance);
        } catch (err) {
            console.error('Failed to load branch cash balance', err);
        }
    };

    const fetchAdjustments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/cash/adjust/all');
            setAdjustments(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load adjustments.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !reason.trim()) { setError('Amount and reason are required.'); return; }
        
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }

        if (!isCredit && currentBalance !== null && numericAmount > currentBalance) {
            setError(`Insufficient cash balance! Your branch currently has ৳${currentBalance.toLocaleString('en-BD')}, so you cannot request a debit of ৳${numericAmount.toLocaleString('en-BD')}.`);
            return;
        }

        setSubmitting(true); setError(''); setSuccess('');
        try {
            const signedAmount = isCredit ? numericAmount : -numericAmount;
            await api.post('/cash/adjust', { amount: signedAmount, reason });
            setSuccess('Adjustment submitted! Awaiting manager approval.');
            setAmount(''); setReason('');
            fetchAdjustments();
            fetchBranchBalance();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit adjustment.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecide = async (adjustmentId: number, approved: boolean) => {
        setDeciding(adjustmentId); setError(''); setSuccess('');
        try {
            await api.post(`/cash/adjust/${adjustmentId}/decide`, {
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
                <div className="adj-access-denied">🔒 Access Denied — Cash adjustments are only accessible to Officers and Managers.</div>
            </div>
        );
    }

    return (
        <div className="adj-container">
            <div className="adj-header">
                <div>
                    <h1 className="adj-title">⚙️ Cash Balance Adjustments</h1>
                    <p className="adj-subtitle">Manual balance corrections with mandatory manager approval</p>
                </div>
                <button className="btn-ghost" onClick={() => navigate('/cash/ledger')}>
                    📒 View Cash Ledger
                </button>
            </div>

            {error && <div className="adj-alert adj-error">{error}</div>}
            {success && <div className="adj-alert adj-success">{success}</div>}

            {/* Officer: Submit form */}
            {isOfficer && (
                <div className="adj-form-card">
                    <div className="adj-form-header-row">
                        <div>
                            <h3 className="adj-card-title">📝 Submit Adjustment Request</h3>
                            <p className="adj-card-subtitle">
                                Manual adjustments must be approved by your branch Manager or FEO before they take effect.
                            </p>
                        </div>
                        {currentBalance !== null && (
                            <div className="adj-balance-badge">
                                Branch Cash Balance: <strong>৳{currentBalance.toLocaleString('en-BD')}</strong>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="adj-form">
                        <div className="adj-type-toggle">
                            <button
                                type="button"
                                className={`adj-type-btn ${isCredit ? 'active-credit' : ''}`}
                                onClick={() => setIsCredit(true)}
                            >
                                ➕ Add Cash (Credit)
                            </button>
                            <button
                                type="button"
                                className={`adj-type-btn ${!isCredit ? 'active-debit' : ''}`}
                                onClick={() => setIsCredit(false)}
                            >
                                ➖ Remove Cash (Debit)
                            </button>
                        </div>
                        <div className="adj-form-row">
                            <div className="adj-form-group">
                                <label>Amount (৳) <span className="required">*</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="e.g. 50000"
                                    required
                                    style={{ borderLeft: isCredit ? '3px solid #16a34a' : '3px solid #dc2626' }}
                                />
                            </div>
                            <div className="adj-form-group adj-reason-group">
                                <label>Reason <span className="required">*</span></label>
                                <textarea
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="Mandatory: describe why this adjustment is needed (e.g. 'Initial cash vault setup', 'Petty cash reconciliation')"
                                    rows={3}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="adj-submit-btn" disabled={submitting}>
                            {submitting ? 'Submitting...' : '📤 Submit for Manager Approval'}
                        </button>
                    </form>
                </div>
            )}

            {/* Manager: Pending approvals */}
            {isManager && pending.length > 0 && (
                <div className="adj-section">
                    <h3 className="adj-section-title">⏳ Pending Approvals ({pending.length})</h3>
                    <div className="adj-list">
                        {pending.map(a => (
                            <div key={a.adjustmentId} className="adj-card adj-card-pending">
                                <div className="adj-card-top">
                                    <div className="adj-amount-display" style={{ color: a.amount >= 0 ? '#16a34a' : '#dc2626' }}>
                                        {a.amount >= 0 ? '+' : ''}৳{Math.abs(a.amount).toLocaleString('en-BD')}
                                        <span className="adj-type-label">{a.amount >= 0 ? 'Credit' : 'Debit'}</span>
                                    </div>
                                    <span className={`adj-badge ${getStatusBadge(a.status)}`}>{a.status}</span>
                                </div>
                                <div className="adj-reason-text">💬 {a.reason}</div>
                                <div className="adj-meta">
                                    Submitted by <strong>{a.submittedByFullName}</strong> ({a.submittedByEmployeeId}) · {formatDate(a.submittedAt)}
                                </div>
                                <div className="adj-decision-form">
                                    <textarea
                                        placeholder="Decision note (optional)"
                                        rows={2}
                                        value={decisionNote[a.adjustmentId] || ''}
                                        onChange={e => setDecisionNote(prev => ({ ...prev, [a.adjustmentId]: e.target.value }))}
                                        className="adj-decision-textarea"
                                    />
                                    <div className="adj-decision-btns">
                                        <button
                                            className="adj-btn adj-btn-approve"
                                            onClick={() => handleDecide(a.adjustmentId, true)}
                                            disabled={deciding === a.adjustmentId}
                                        >
                                            ✅ Approve
                                        </button>
                                        <button
                                            className="adj-btn adj-btn-reject"
                                            onClick={() => handleDecide(a.adjustmentId, false)}
                                            disabled={deciding === a.adjustmentId}
                                        >
                                            ❌ Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* History */}
            <div className="adj-section">
                <h3 className="adj-section-title">📋 Adjustment History</h3>
                {loading ? (
                    <div className="adj-loading">Loading...</div>
                ) : history.length === 0 && pending.length === 0 ? (
                    <div className="adj-empty">No adjustments submitted yet for your branch.</div>
                ) : history.length === 0 ? (
                    <div className="adj-empty">No decided adjustments yet.</div>
                ) : (
                    <div className="adj-list">
                        {history.map(a => (
                            <div key={a.adjustmentId} className={`adj-card adj-card-${a.status.toLowerCase()}`}>
                                <div className="adj-card-top">
                                    <div className="adj-amount-display" style={{ color: a.amount >= 0 ? '#16a34a' : '#dc2626' }}>
                                        {a.amount >= 0 ? '+' : ''}৳{Math.abs(a.amount).toLocaleString('en-BD')}
                                        <span className="adj-type-label">{a.amount >= 0 ? 'Credit' : 'Debit'}</span>
                                    </div>
                                    <span className={`adj-badge ${getStatusBadge(a.status)}`}>{a.status}</span>
                                </div>
                                <div className="adj-reason-text">💬 {a.reason}</div>
                                <div className="adj-meta">
                                    Submitted by <strong>{a.submittedByFullName}</strong> ({a.submittedByEmployeeId}) · {formatDate(a.submittedAt)}
                                </div>
                                {a.approvedByFullName && (
                                    <div className="adj-decision-result">
                                        {a.status === 'APPROVED' ? '✅' : '❌'} Decided by <strong>{a.approvedByFullName}</strong> · {formatDate(a.decidedAt)}
                                        {a.decisionNote && <span className="adj-decision-note"> — "{a.decisionNote}"</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualAdjustment;
