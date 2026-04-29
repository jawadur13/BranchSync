import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './Admin.css';

interface BranchRow {
    branchId: number; branchCode: string; branchName: string;
    branchType: string; district: string; division: string;
    address: string; phone: string | null; isActive: boolean;
}
interface DeptRow {
    departmentId: number; departmentName: string;
    branchName: string; branchId: number | null;
}

const OrgManagement = () => {
    const [branches, setBranches] = useState<BranchRow[]>([]);
    const [departments, setDepartments] = useState<DeptRow[]>([]);
    const [activeTab, setActiveTab] = useState<'branches' | 'departments'>('branches');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [showDeptForm, setShowDeptForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [branchForm, setBranchForm] = useState({
        branchCode: '', branchName: '', branchType: 'BRANCH',
        district: '', division: '', address: '', phone: ''
    });
    const [deptForm, setDeptForm] = useState({ departmentName: '', branchId: '' });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [bRes, dRes] = await Promise.all([
                api.get('/admin/org/branches'),
                api.get('/admin/org/departments'),
            ]);
            setBranches(bRes.data);
            setDepartments(dRes.data);
        } catch {
            setError('Failed to load organization data.');
        } finally {
            setLoading(false);
        }
    };

    const handleBranchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError(''); setSuccess('');
        try {
            await api.post('/admin/org/branches', branchForm);
            setSuccess('Branch created successfully!');
            setShowBranchForm(false);
            setBranchForm({ branchCode: '', branchName: '', branchType: 'BRANCH', district: '', division: '', address: '', phone: '' });
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create branch.');
        } finally { setSubmitting(false); }
    };

    const handleDeptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError(''); setSuccess('');
        try {
            await api.post('/admin/org/departments', {
                departmentName: deptForm.departmentName,
                branchId: deptForm.branchId ? Number(deptForm.branchId) : null,
            });
            setSuccess('Department created successfully!');
            setShowDeptForm(false);
            setDeptForm({ departmentName: '', branchId: '' });
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create department.');
        } finally { setSubmitting(false); }
    };

    if (loading) return <div className="admin-loading">Loading organization data...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">🏛️ Organization Management</h1>
                    <p className="admin-subtitle">Manage branches and departments</p>
                </div>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}
            {success && <div className="admin-alert admin-alert-success">{success}</div>}

            {/* Tabs */}
            <div className="admin-tabs">
                <button className={`tab-btn ${activeTab === 'branches' ? 'tab-active' : ''}`} onClick={() => setActiveTab('branches')}>
                    🏢 Branches ({branches.length})
                </button>
                <button className={`tab-btn ${activeTab === 'departments' ? 'tab-active' : ''}`} onClick={() => setActiveTab('departments')}>
                    🏷️ Departments ({departments.length})
                </button>
            </div>

            {/* Branches Tab */}
            {activeTab === 'branches' && (
                <div className="admin-card">
                    <div className="card-toolbar">
                        <button className="btn-admin-primary" onClick={() => setShowBranchForm(!showBranchForm)}>
                            {showBranchForm ? '✕ Cancel' : '+ Add Branch'}
                        </button>
                    </div>

                    {showBranchForm && (
                        <form className="inline-form" onSubmit={handleBranchSubmit}>
                            <div className="modal-grid">
                                <div className="form-group">
                                    <label>Branch Code <span className="required">*</span></label>
                                    <input value={branchForm.branchCode} onChange={e => setBranchForm({ ...branchForm, branchCode: e.target.value })} placeholder="e.g. JBL-DHK-01" required />
                                </div>
                                <div className="form-group">
                                    <label>Branch Name <span className="required">*</span></label>
                                    <input value={branchForm.branchName} onChange={e => setBranchForm({ ...branchForm, branchName: e.target.value })} placeholder="e.g. Motijheel Main Branch" required />
                                </div>
                                <div className="form-group">
                                    <label>Type <span className="required">*</span></label>
                                    <select value={branchForm.branchType} onChange={e => setBranchForm({ ...branchForm, branchType: e.target.value })}>
                                        <option value="HQ">HQ</option>
                                        <option value="REGIONAL">Regional</option>
                                        <option value="BRANCH">Branch</option>
                                        <option value="SUB_BRANCH">Sub-Branch</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>District <span className="required">*</span></label>
                                    <input value={branchForm.district} onChange={e => setBranchForm({ ...branchForm, district: e.target.value })} placeholder="e.g. Dhaka" required />
                                </div>
                                <div className="form-group">
                                    <label>Division <span className="required">*</span></label>
                                    <input value={branchForm.division} onChange={e => setBranchForm({ ...branchForm, division: e.target.value })} placeholder="e.g. Dhaka" required />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} placeholder="+880-2-XXXXXXXX" />
                                </div>
                                <div className="form-group full-width">
                                    <label>Address <span className="required">*</span></label>
                                    <input value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} placeholder="Full address" required />
                                </div>
                            </div>
                            <button type="submit" className="btn-admin-primary" disabled={submitting} style={{ marginTop: '12px' }}>
                                {submitting ? 'Creating...' : '✅ Create Branch'}
                            </button>
                        </form>
                    )}

                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>District</th>
                                <th>Division</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.map(b => (
                                <tr key={b.branchId}>
                                    <td className="fw-semibold">{b.branchCode}</td>
                                    <td>{b.branchName}</td>
                                    <td><span className="type-badge">{b.branchType}</span></td>
                                    <td>{b.district}</td>
                                    <td>{b.division}</td>
                                    <td>
                                        <span className={`status-dot ${b.isActive ? 'dot-active' : 'dot-inactive'}`}></span>
                                        {b.isActive ? 'Active' : 'Inactive'}
                                    </td>
                                </tr>
                            ))}
                            {branches.length === 0 && (
                                <tr><td colSpan={6} className="empty-row">No branches found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
                <div className="admin-card">
                    <div className="card-toolbar">
                        <button className="btn-admin-primary" onClick={() => setShowDeptForm(!showDeptForm)}>
                            {showDeptForm ? '✕ Cancel' : '+ Add Department'}
                        </button>
                    </div>

                    {showDeptForm && (
                        <form className="inline-form" onSubmit={handleDeptSubmit}>
                            <div className="modal-grid">
                                <div className="form-group">
                                    <label>Department Name <span className="required">*</span></label>
                                    <input value={deptForm.departmentName} onChange={e => setDeptForm({ ...deptForm, departmentName: e.target.value })} placeholder="e.g. Cash Operations" required />
                                </div>
                                <div className="form-group">
                                    <label>Branch (Optional)</label>
                                    <select value={deptForm.branchId} onChange={e => setDeptForm({ ...deptForm, branchId: e.target.value })}>
                                        <option value="">All Branches (Global)</option>
                                        {branches.map(b => (
                                            <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn-admin-primary" disabled={submitting} style={{ marginTop: '12px' }}>
                                {submitting ? 'Creating...' : '✅ Create Department'}
                            </button>
                        </form>
                    )}

                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Department Name</th>
                                <th>Assigned Branch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map(d => (
                                <tr key={d.departmentId}>
                                    <td className="fw-semibold">#{d.departmentId}</td>
                                    <td>{d.departmentName}</td>
                                    <td>{d.branchName}</td>
                                </tr>
                            ))}
                            {departments.length === 0 && (
                                <tr><td colSpan={3} className="empty-row">No departments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrgManagement;
