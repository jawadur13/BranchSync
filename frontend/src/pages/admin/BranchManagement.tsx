import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './Admin.css';

interface BranchRow {
    branchId: number; branchCode: string; branchName: string;
    branchType: string; district: string; division: string;
    address: string; phone: string | null; isActive: boolean;
    departmentIds?: number[]; departments?: string[];
}
interface DeptRow {
    departmentId: number; departmentName: string;
}

const BranchManagement = () => {
    const [branches, setBranches] = useState<BranchRow[]>([]);
    const [departments, setDepartments] = useState<DeptRow[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [editBranchId, setEditBranchId] = useState<number | null>(null);
    const [viewBranch, setViewBranch] = useState<BranchRow | null>(null);
    const [searchBranch, setSearchBranch] = useState('');

    const [branchForm, setBranchForm] = useState({
        branchCode: '', branchName: '', branchType: 'BRANCH',
        district: '', division: '', address: '', phone: '', departmentIds: [] as number[]
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [bRes, dRes, uRes] = await Promise.all([
                api.get('/admin/org/branches'),
                api.get('/admin/org/departments'),
                api.get('/admin/users'),
            ]);
            setBranches(bRes.data);
            setDepartments(dRes.data);
            setUsers(uRes.data);
        } catch {
            setError('Failed to load organization branch data.');
        } finally {
            setLoading(false);
        }
    };

    const openEditBranch = (b: BranchRow) => {
        setEditBranchId(b.branchId);
        setBranchForm({
            branchCode: b.branchCode,
            branchName: b.branchName,
            branchType: b.branchType,
            district: b.district,
            division: b.division,
            address: b.address,
            phone: b.phone || '',
            departmentIds: b.departmentIds || []
        });
        setShowBranchForm(true);
    };

    const handleBranchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError(''); setSuccess('');
        try {
            if (editBranchId) {
                await api.put(`/admin/org/branches/${editBranchId}`, branchForm);
                setSuccess('Branch updated successfully!');
            } else {
                await api.post('/admin/org/branches', branchForm);
                setSuccess('Branch created successfully!');
            }
            setShowBranchForm(false);
            setEditBranchId(null);
            setBranchForm({ branchCode: '', branchName: '', branchType: 'AD_BRANCH', district: '', division: '', address: '', phone: '', departmentIds: [] });
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save branch.');
        } finally { setSubmitting(false); }
    };

    const filteredBranches = branches.filter(b => 
        b.branchName.toLowerCase().includes(searchBranch.toLowerCase()) || 
        b.branchCode.toLowerCase().includes(searchBranch.toLowerCase())
    );

    if (loading) return <div className="admin-loading">Loading organization branch data...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">🏢 Branches</h1>
                    <p className="admin-subtitle">Manage branch locations and assignments</p>
                </div>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}
            {success && <div className="admin-alert admin-alert-success">{success}</div>}

            <div className="admin-card">
                <div className="card-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        placeholder="Search branch by Name or Code..." 
                        value={searchBranch}
                        onChange={(e) => setSearchBranch(e.target.value)}
                        style={{ flex: 1, maxWidth: '300px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                    <button className="btn-admin-primary" onClick={() => {
                        if (!showBranchForm) {
                            setEditBranchId(null);
                            setBranchForm({ branchCode: '', branchName: '', branchType: 'AD_BRANCH', district: '', division: '', address: '', phone: '', departmentIds: [] });
                        }
                        setShowBranchForm(!showBranchForm);
                    }}>
                        {showBranchForm ? '✕ Cancel' : '+ Add Branch'}
                    </button>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>District</th>
                            <th>Division</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBranches.map(b => (
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
                                <td>
                                    <div className="action-group" style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-icon" onClick={() => setViewBranch(b)} title="View Profile">👁️</button>
                                        <button className="btn-icon" onClick={() => openEditBranch(b)} title="Edit Branch">✏️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredBranches.length === 0 && (
                            <tr><td colSpan={7} className="empty-row">No branches found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Branch Modal */}
            {viewBranch && (
                <div className="modal-overlay" onClick={() => setViewBranch(null)}>
                    <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Branch Profile</h2>
                            <button className="modal-close" onClick={() => setViewBranch(null)}>✕</button>
                        </div>
                        <div className="profile-details">
                            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
                                <div className="profile-avatar" style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#e6fffa', color: '#319795', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                    🏢
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#1a202c' }}>{viewBranch.branchName}</h3>
                                    <p className="profile-role" style={{ margin: 0, color: '#718096', fontSize: '14px', fontWeight: 500 }}>{viewBranch.branchType}</p>
                                </div>
                            </div>
                            <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Branch Code</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewBranch.branchCode}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Phone</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewBranch.phone || 'N/A'}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>District</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewBranch.district}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Division</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewBranch.division}</span>
                                </div>
                                <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Address</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewBranch.address}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Employees</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>
                                        {users.filter(u => u.branchId === viewBranch.branchId).length} Employees
                                    </span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Departments</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>
                                        {viewBranch.departments?.length || 0} Departments
                                    </span>
                                </div>
                                <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Assigned Departments</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {viewBranch.departments && viewBranch.departments.length > 0 ? (
                                            viewBranch.departments.map((dept, i) => (
                                                <span key={i} style={{ background: '#edf2f7', color: '#4a5568', padding: '4px 10px', borderRadius: '15px', fontSize: '13px', fontWeight: 500 }}>
                                                    {dept}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '14px', color: '#a0aec0' }}>No departments assigned.</span>
                                        )}
                                    </div>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Status</span>
                                    <span className={`status-badge ${viewBranch.isActive ? 'active' : 'inactive'}`} style={{ fontWeight: 'bold', color: viewBranch.isActive ? '#38a169' : '#e53e3e' }}>
                                        {viewBranch.isActive ? '🟢 Active' : '🔴 Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-admin-primary" onClick={() => { setViewBranch(null); openEditBranch(viewBranch); }}>Edit Branch</button>
                            <button className="btn-ghost" onClick={() => setViewBranch(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Branch Form Modal */}
            {showBranchForm && (
                <div className="modal-overlay" onClick={() => setShowBranchForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', padding: '24px' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c' }}>
                                {editBranchId ? '✏️ Edit Branch' : '➕ Add Branch'}
                            </h2>
                            <button type="button" className="modal-close" onClick={() => setShowBranchForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#a0aec0' }}>✕</button>
                        </div>
                        <form onSubmit={handleBranchSubmit}>
                            <div className="modal-grid" style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Branch Code <span className="required" style={{ color: '#e53e3e' }}>*</span></label>
                                    <input value={branchForm.branchCode} onChange={e => setBranchForm({ ...branchForm, branchCode: e.target.value })} placeholder="e.g. JBL-DHK-01" required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Branch Name <span className="required" style={{ color: '#e53e3e' }}>*</span></label>
                                    <input value={branchForm.branchName} onChange={e => setBranchForm({ ...branchForm, branchName: e.target.value })} placeholder="e.g. Motijheel Main Branch" required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Type <span className="required" style={{ color: '#e53e3e' }}>*</span></label>
                                    <select value={branchForm.branchType} onChange={e => setBranchForm({ ...branchForm, branchType: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}>
                                        <option value="HQ">HQ</option>
                                        <option value="AD_BRANCH">AD_BRANCH</option>
                                        <option value="SUB_BRANCH">SUB_BRANCH</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Phone</label>
                                    <input value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} placeholder="+880-2-XXXXXXXX" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>District <span className="required" style={{ color: '#e53e3e' }}>*</span></label>
                                    <input value={branchForm.district} onChange={e => setBranchForm({ ...branchForm, district: e.target.value })} placeholder="e.g. Dhaka" required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Division <span className="required" style={{ color: '#e53e3e' }}>*</span></label>
                                    <input value={branchForm.division} onChange={e => setBranchForm({ ...branchForm, division: e.target.value })} placeholder="e.g. Dhaka" required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Address <span className="required" style={{ color: '#e53e3e' }}>*</span></label>
                                    <input value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} placeholder="Full address" required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Assign Departments to Branch</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '8px' }}>
                                        {departments.map(d => (
                                            <label key={d.departmentId} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={branchForm.departmentIds.includes(d.departmentId)}
                                                    onChange={(e) => {
                                                        const current = branchForm.departmentIds;
                                                        if (e.target.checked) setBranchForm({ ...branchForm, departmentIds: [...current, d.departmentId] });
                                                        else setBranchForm({ ...branchForm, departmentIds: current.filter(id => id !== d.departmentId) });
                                                    }}
                                                />
                                                <span style={{ fontSize: '14px', color: '#4a5568' }}>{d.departmentName}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn-admin-secondary" onClick={() => setShowBranchForm(false)}>Cancel</button>
                                <button type="submit" className="btn-admin-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editBranchId ? '💾 Save Changes' : '✅ Create Branch')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchManagement;
