import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './NewTransfer.css';

interface BranchOption {
    id: number;
    code: string;
    name: string;
    type: string;
    district: string;
}

interface CategoryOption {
    id: number;
    name: string;
    sensitivityLevel: string;
    departmentId: number | null;
}


const NewTransfer = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const location = useLocation();

    // Form state initialized with location state if available (for Duplicate action)
    const [title, setTitle] = useState(location.state?.title || '');
    const [description, setDescription] = useState(location.state?.description || '');
    const [categoryId, setCategoryId] = useState('');
    const [priority, setPriority] = useState(location.state?.priority || 'NORMAL');
    const [requestedAmount, setRequestedAmount] = useState('');

    // Lookup data
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchLookupData();
    }, []);

    const fetchLookupData = async () => {
        try {
            const [branchRes, categoryRes] = await Promise.all([
                api.get('/lookup/branches'),
                api.get('/lookup/categories'),
            ]);
            setBranches(branchRes.data);
            setCategories(categoryRes.data);
            
            if (location.state?.categoryName) {
                const match = categoryRes.data.find((c: CategoryOption) => c.name === location.state.categoryName);
                if (match) setCategoryId(match.id.toString());
            }
        } catch (err) {
            setError('Failed to load form data. Please refresh the page.');
        }
    };

    const isHigherRole = user?.role === 'BRANCH_MANAGER' || user?.role === 'OPERATION_MANAGER' || user?.role === 'FIRST_EXECUTIVE_OFFICER' || user?.role === 'SYSTEM_ADMIN';
    
    const filteredCategories = categories.filter(c => {
        if (isHigherRole) return true;
        // Regular employees can only request items assigned to their department
        return c.departmentId === user?.departmentId;
    });

    const selectedCategory = categories.find(c => c.id === Number(categoryId));
    const isCashBundle = selectedCategory?.name?.toLowerCase().includes('cash bundle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const payload: any = {
                title,
                description,
                categoryId: Number(categoryId),
                priority,
                destinationBranchId: null,
                destinationDepartmentId: null,
            };
            if (isCashBundle && requestedAmount) {
                payload.requestedAmount = parseFloat(requestedAmount);
            }

            await api.post('/transfers', payload);
            setSuccess('Transfer request submitted successfully!');
            
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit transfer request.');
        } finally {
            setLoading(false);
        }
    };

    const originBranch = branches.find(b => b.id === user?.branchId);

    // HQ officers are not permitted to create transfer requests
    if (user?.role === 'HQ_LOGISTICS_OFFICER') {
        return (
            <div className="new-transfer-container">
                <div className="form-alert form-alert-error" style={{ marginTop: '2rem' }}>
                    🏛️ <strong>Access Denied</strong> — HQ Logistics Officers are not permitted to create transfer requests.
                    Your role is to review and verify transfers, not initiate them.
                </div>
            </div>
        );
    }

    return (
        <div className="new-transfer-container">
            <div className="new-transfer-header">
                <div>
                    <h1 className="page-title">New Transfer Request</h1>
                    <p className="page-subtitle">Initiate an inter-branch transfer or requisition</p>
                </div>
                <button className="btn-ghost" onClick={() => navigate('/')}>
                    ← Back to Dashboard
                </button>
            </div>

            {error && <div className="form-alert form-alert-error">{error}</div>}
            {success && <div className="form-alert form-alert-success">{success}</div>}

            <form className="transfer-form" onSubmit={handleSubmit}>
                {/* Section 1: Basic Info */}
                <div className="form-section">
                    <div className="form-section-header">
                        <span className="section-number">1</span>
                        <div>
                            <h3>Basic Information</h3>
                            <p>Provide the core details for this transfer request</p>
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label htmlFor="title">Request Title <span className="required">*</span></label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Cash Transfer for Monthly Settlement"
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the reason and details of the transfer..."
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="category">Category <span className="required">*</span></label>
                            <select
                                id="category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="">Select Category</option>
                                {filteredCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="priority">Priority <span className="required">*</span></label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                required
                            >
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Category Info Card */}
                    {selectedCategory && (
                        <div className="info-card">
                            <div className="info-card-row">
                                <span className="info-label">Sensitivity Level</span>
                                <span className={`badge badge-${selectedCategory.sensitivityLevel.toLowerCase()}`}>
                                    {selectedCategory.sensitivityLevel}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Cash Bundle: Amount Requested */}
                    {isCashBundle && (
                        <div className="form-group full-width" style={{ marginTop: '12px' }}>
                            <label htmlFor="requestedAmount">
                                💵 Amount Requested (৳) <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="requestedAmount"
                                min="1"
                                step="1"
                                value={requestedAmount}
                                onChange={(e) => setRequestedAmount(e.target.value)}
                                placeholder="e.g. 500000"
                                required={isCashBundle}
                                style={{ borderLeft: '3px solid #f59e0b' }}
                            />
                            <span className="field-hint">The exact cash amount the destination branch will need to prepare and send.</span>
                        </div>
                    )}
                </div>

                {/* Section 2: Routing */}
                <div className="form-section">
                    <div className="form-section-header">
                        <span className="section-number">2</span>
                        <div>
                            <h3>Transfer Routing & HQ Verification</h3>
                            <p>Define the origin for this transfer. Destination will be allocated by HQ.</p>
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Origin Branch</label>
                            <div className="readonly-field">
                                <span className="readonly-icon">📍</span>
                                <span>{originBranch ? `${originBranch.name} (${originBranch.code})` : 'Your Branch'}</span>
                            </div>
                            <span className="field-hint">Auto-assigned from your session</span>
                        </div>

                        <div className="form-group full-width" style={{ marginTop: '10px' }}>
                            <div className="info-card" style={{ borderLeft: '4px solid var(--color-primary-blue)', backgroundColor: '#f8fafc' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🏛️</span>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Central Logistics Routing</h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                            To ensure strict audit compliance, the destination branch is assigned directly by the <strong>HQ Logistics Officer</strong> during the verification stage.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Priority Warning */}
                {priority === 'CRITICAL' && (
                    <div className="form-alert form-alert-warning">
                        ⚠️ CRITICAL priority requests are flagged for immediate executive review.
                    </div>
                )}

                {/* Submit */}
                <div className="form-actions">
                    <button type="button" className="btn-ghost" onClick={() => navigate('/')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Submitting...' : '📤 Submit Transfer Request'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewTransfer;
