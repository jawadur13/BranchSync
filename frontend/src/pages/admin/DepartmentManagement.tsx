import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './Admin.css';

interface DeptRow {
    departmentId: number; departmentName: string;
}

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState<DeptRow[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showDeptForm, setShowDeptForm] = useState(false);
    const [editDeptId, setEditDeptId] = useState<number | null>(null);
    const [viewDept, setViewDept] = useState<DeptRow | null>(null);
    const [searchDept, setSearchDept] = useState('');

    const [deptForm, setDeptForm] = useState({ departmentName: '' });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [dRes, uRes] = await Promise.all([
                api.get('/admin/org/departments'),
                api.get('/admin/users'),
            ]);
            setDepartments(dRes.data);
            setUsers(uRes.data);
        } catch {
            setError('Failed to load department data.');
        } finally {
            setLoading(false);
        }
    };

    const openEditDept = (d: DeptRow) => {
        setEditDeptId(d.departmentId);
        setDeptForm({
            departmentName: d.departmentName
        });
        setShowDeptForm(true);
    };

    const handleDeptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError(''); setSuccess('');
        try {
            const payload = {
                departmentName: deptForm.departmentName
            };
            if (editDeptId) {
                await api.put(`/admin/org/departments/${editDeptId}`, payload);
                setSuccess('Department updated successfully!');
            } else {
                await api.post('/admin/org/departments', payload);
                setSuccess('Department created successfully!');
            }
            setShowDeptForm(false);
            setEditDeptId(null);
            setDeptForm({ departmentName: '' });
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save department.');
        } finally { setSubmitting(false); }
    };

    const filteredDepartments = departments.filter(d => 
        d.departmentName.toLowerCase().includes(searchDept.toLowerCase())
    );

    if (loading) return <div className="admin-loading">Loading department data...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">🏷️ Departments</h1>
                    <p className="admin-subtitle">Manage organizational departments</p>
                </div>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}
            {success && <div className="admin-alert admin-alert-success">{success}</div>}

            <div className="admin-card">
                <div className="card-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        placeholder="Search department by Name..." 
                        value={searchDept}
                        onChange={(e) => setSearchDept(e.target.value)}
                        style={{ flex: 1, maxWidth: '300px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                    <button className="btn-admin-primary" onClick={() => {
                        if (!showDeptForm) {
                            setEditDeptId(null);
                            setDeptForm({ departmentName: '' });
                        }
                        setShowDeptForm(!showDeptForm);
                    }}>
                        {showDeptForm ? '✕ Cancel' : '+ Add Department'}
                    </button>
                </div>



                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Department Name</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDepartments.map(d => (
                            <tr key={d.departmentId}>
                                <td className="fw-semibold">#{d.departmentId}</td>
                                <td>{d.departmentName}</td>
                                <td>
                                    <div className="action-group" style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-icon" onClick={() => setViewDept(d)} title="View Profile">👁️</button>
                                        <button className="btn-icon" onClick={() => openEditDept(d)} title="Edit Department">✏️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredDepartments.length === 0 && (
                            <tr><td colSpan={3} className="empty-row">No departments found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Dept Modal */}
            {viewDept && (
                <div className="modal-overlay" onClick={() => setViewDept(null)}>
                    <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Department Profile</h2>
                            <button className="modal-close" onClick={() => setViewDept(null)}>✕</button>
                        </div>
                        <div className="profile-details">
                            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
                                <div className="profile-avatar" style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#ebf4ff', color: '#4299e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                    🏷️
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#1a202c' }}>{viewDept.departmentName}</h3>
                                    <p className="profile-role" style={{ margin: 0, color: '#718096', fontSize: '14px', fontWeight: 500 }}>ID: #{viewDept.departmentId}</p>
                                </div>
                            </div>
                            <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Scope</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>Global (Master List)</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Employees</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>
                                        {users.filter(u => u.departmentId === viewDept.departmentId).length} Employees
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-admin-primary" onClick={() => { setViewDept(null); openEditDept(viewDept); }}>Edit Department</button>
                            <button className="btn-ghost" onClick={() => setViewDept(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Form Modal */}
            {showDeptForm && (
                <div className="modal-overlay" onClick={() => setShowDeptForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '100%', padding: '24px' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c' }}>
                                {editDeptId ? '✏️ Edit Department' : '➕ Add Department'}
                            </h2>
                            <button type="button" className="modal-close" onClick={() => setShowDeptForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#a0aec0' }}>✕</button>
                        </div>
                        <form onSubmit={handleDeptSubmit}>
                            <div className="modal-grid" style={{ display: 'grid', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Department Name <span className="required" style={{ color: '#e53e3e' }}>*</span></label>
                                    <input value={deptForm.departmentName} onChange={e => setDeptForm({ ...deptForm, departmentName: e.target.value })} placeholder="e.g. Cash Operations" required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }} />
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn-admin-secondary" onClick={() => setShowDeptForm(false)}>Cancel</button>
                                <button type="submit" className="btn-admin-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editDeptId ? '💾 Save Changes' : '✅ Create Department')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentManagement;
