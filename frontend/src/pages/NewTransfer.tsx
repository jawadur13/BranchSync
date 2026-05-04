import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface DepartmentOption {
    departmentId: number;
    departmentName: string;
}

const NewTransfer = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [priority, setPriority] = useState('NORMAL');
    const [destinationBranchId, setDestinationBranchId] = useState('');
    const [destinationDepartmentId, setDestinationDepartmentId] = useState('');

    // Lookup data
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
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
            const [branchRes, departmentRes, categoryRes] = await Promise.all([
                api.get('/lookup/branches'),
                api.get('/lookup/departments'),
                api.get('/lookup/categories'),
            ]);
            setBranches(branchRes.data);
            setDepartments(departmentRes.data);
            setCategories(categoryRes.data);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const payload = {
                title,
                description,
                categoryId: Number(categoryId),
                priority,
                destinationBranchId: Number(destinationBranchId),
                destinationDepartmentId: destinationDepartmentId ? Number(destinationDepartmentId) : null,
            };

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
                </div>

                {/* Section 2: Routing */}
                <div className="form-section">
                    <div className="form-section-header">
                        <span className="section-number">2</span>
                        <div>
                            <h3>Transfer Routing</h3>
                            <p>Define the origin and destination for this transfer</p>
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

                        <div className="form-group">
                            <label htmlFor="destination">Destination Branch <span className="required">*</span></label>
                            <select
                                id="destination"
                                value={destinationBranchId}
                                onChange={(e) => setDestinationBranchId(e.target.value)}
                                required
                            >
                                <option value="">Select Destination</option>
                                {branches
                                    .filter(b => b.id !== user?.branchId)
                                    .map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({b.code}) — {b.district}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="destDept">Target Department</label>
                            <select
                                id="destDept"
                                value={destinationDepartmentId}
                                onChange={(e) => setDestinationDepartmentId(e.target.value)}
                            >
                                <option value="">Select Department (Optional)</option>
                                {departments.map(d => (
                                    <option key={d.departmentId} value={d.departmentId}>
                                        {d.departmentName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Route Visual */}
                    {originBranch && destinationBranchId && (
                        <div className="route-visual">
                            <div className="route-node">
                                <span className="route-dot origin"></span>
                                <span className="route-label">{originBranch.name}</span>
                            </div>
                            <div className="route-line">
                                <span className="route-arrow">→</span>
                            </div>
                            <div className="route-node">
                                <span className="route-dot destination"></span>
                                <span className="route-label">
                                    {branches.find(b => b.id === Number(destinationBranchId))?.name}
                                </span>
                            </div>
                        </div>
                    )}
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
