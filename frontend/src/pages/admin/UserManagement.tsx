import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './Admin.css';

interface UserRow {
    userId: number;
    employeeId: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    roleName: string;
    roleId: number;
    branchName: string;
    branchId: number;
    departmentName: string | null;
    departmentId: number | null;
    isActive: boolean;
    createdAt: string;
}

interface RoleOption { roleId: number; roleName: string; }
interface BranchOption { branchId: number; branchName: string; branchCode: string; }
interface DeptOption { departmentId: number; departmentName: string; }

const UserManagement = () => {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [departments, setDepartments] = useState<DeptOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [viewUser, setViewUser] = useState<UserRow | null>(null);

    // Form fields
    const [form, setForm] = useState({
        employeeId: '', fullName: '', email: '', phoneNumber: '',
        password: '', roleId: '', branchId: '', departmentId: ''
    });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes, branchesRes, deptsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/org/roles'),
                api.get('/admin/org/branches'),
                api.get('/admin/org/departments'),
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
            setBranches(branchesRes.data);
            setDepartments(deptsRes.data);
        } catch (err) {
            setError('Failed to load data. Ensure you have admin privileges.');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedUserId(null);
        setForm({ employeeId: '', fullName: '', email: '', phoneNumber: '', password: '', roleId: '', branchId: '', departmentId: '' });
        setShowModal(true);
    };

    const openEditModal = (u: UserRow) => {
        setEditMode(true);
        setSelectedUserId(u.userId);
        setForm({
            employeeId: u.employeeId,
            fullName: u.fullName,
            email: u.email,
            phoneNumber: u.phoneNumber || '',
            password: '', // Leave blank to keep current
            roleId: u.roleId.toString(),
            branchId: u.branchId.toString(),
            departmentId: u.departmentId ? u.departmentId.toString() : ''
        });
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');
        try {
            if (editMode && selectedUserId) {
                await api.put(`/admin/users/${selectedUserId}`, {
                    ...form,
                    roleId: Number(form.roleId),
                    branchId: Number(form.branchId),
                    departmentId: form.departmentId ? Number(form.departmentId) : null,
                });
                setSuccess('User updated successfully!');
            } else {
                await api.post('/admin/users', {
                    ...form,
                    roleId: Number(form.roleId),
                    branchId: Number(form.branchId),
                    departmentId: form.departmentId ? Number(form.departmentId) : null,
                });
                setSuccess('User created successfully!');
            }
            setShowModal(false);
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (userId: number) => {
        try {
            await api.put(`/admin/users/${userId}/toggle-active`);
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update user status.');
        }
    };

    if (loading) return <div className="admin-loading">Loading user data...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">👥 User Management</h1>
                    <p className="admin-subtitle">Create and manage employee accounts</p>
                </div>
                <button className="btn-admin-primary" onClick={openCreateModal}>
                    + Add New User
                </button>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}
            {success && <div className="admin-alert admin-alert-success">{success}</div>}

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Full Name</th>
                            <th>Role</th>
                            <th>Branch</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.userId} className={!u.isActive ? 'row-inactive' : ''}>
                                <td className="fw-semibold">{u.employeeId}</td>
                                <td>{u.fullName}</td>
                                <td>
                                    <span className={`role-badge role-${u.roleName?.toLowerCase().replace(/_/g, '-')}`}>
                                        {u.roleName?.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td>{u.branchName}</td>
                                <td>
                                    <span className={`status-dot ${u.isActive ? 'dot-active' : 'dot-inactive'}`}></span>
                                    {u.isActive ? 'Active' : 'Inactive'}
                                </td>
                                <td>
                                    <div className="action-group">
                                        <button className="btn-icon" onClick={() => setViewUser(u)} title="View Profile">👁️</button>
                                        <button className="btn-icon" onClick={() => openEditModal(u)} title="Edit">✏️</button>
                                        <button
                                            className={`btn-toggle ${u.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                                            onClick={() => handleToggleActive(u.userId)}
                                        >
                                            {u.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan={6} className="empty-row">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Profile Modal */}
            {viewUser && (
                <div className="modal-overlay" onClick={() => setViewUser(null)}>
                    <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>User Profile</h2>
                            <button className="modal-close" onClick={() => setViewUser(null)}>✕</button>
                        </div>
                        <div className="profile-details">
                            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
                                <div className="profile-avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f0f4f8', color: '#3182ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                                    {viewUser.fullName.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#1a202c' }}>{viewUser.fullName}</h3>
                                    <p className="profile-role" style={{ margin: 0, color: '#718096', fontSize: '14px', fontWeight: 500 }}>{viewUser.roleName?.replace(/_/g, ' ')}</p>
                                </div>
                            </div>
                            <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Employee ID</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewUser.employeeId}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Email</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewUser.email}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Phone</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewUser.phoneNumber || 'N/A'}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Branch</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewUser.branchName}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Department</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewUser.departmentName || 'None (Branch Level)'}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Status</span>
                                    <span className={`status-badge ${viewUser.isActive ? 'active' : 'inactive'}`} style={{ fontWeight: 'bold', color: viewUser.isActive ? '#38a169' : '#e53e3e' }}>
                                        {viewUser.isActive ? '🟢 Active' : '🔴 Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                            <button className="btn-admin-primary" onClick={() => { setViewUser(null); openEditModal(viewUser); }}>
                                Edit User
                            </button>
                            <button className="btn-ghost" onClick={() => setViewUser(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editMode ? 'Edit Employee' : 'Add New Employee'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="modal-grid">
                                <div className="form-group">
                                    <label>Employee ID {!editMode && <span className="required">*</span>}</label>
                                    <input name="employeeId" value={form.employeeId} onChange={handleChange} disabled={editMode} placeholder="e.g. EMP002" required={!editMode} />
                                </div>
                                <div className="form-group">
                                    <label>Full Name <span className="required">*</span></label>
                                    <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="e.g. Md. Rafiq Ahmed" required />
                                </div>
                                <div className="form-group">
                                    <label>Email <span className="required">*</span></label>
                                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="rafiq@jamunabank.com" required />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="+880-1XXXXXXXXX" />
                                </div>
                                <div className="form-group full-width">
                                    <label>Password {editMode ? '(Leave blank to keep current)' : <span className="required">*</span>}</label>
                                    <input name="password" type="password" value={form.password} onChange={handleChange} placeholder={editMode ? '********' : 'Minimum 6 characters'} required={!editMode} />
                                </div>
                                <div className="form-group">
                                    <label>Role <span className="required">*</span></label>
                                    <select name="roleId" value={form.roleId} onChange={handleChange} required>
                                        <option value="">Select Role</option>
                                        {roles.map(r => (
                                            <option key={r.roleId} value={r.roleId}>{r.roleName.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Branch <span className="required">*</span></label>
                                    <select name="branchId" value={form.branchId} onChange={handleChange} required>
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b.branchId} value={b.branchId}>{b.branchName} ({b.branchCode})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <select name="departmentId" value={form.departmentId} onChange={handleChange}>
                                        <option value="">None</option>
                                        {departments.map(d => (
                                            <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-admin-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editMode ? '💾 Save Changes' : '✅ Create Employee')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
