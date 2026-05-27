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
interface BranchOption { branchId: number; branchName: string; branchCode: string; departmentIds?: number[]; }
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
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [modalError, setModalError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    // Form fields
    const [form, setForm] = useState({
        employeeId: '', fullName: '', email: '', phoneNumber: '',
        password: '', currentPassword: '', roleId: '', branchId: '', departmentId: ''
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
        setModalError('');
        setShowPassword(false);
        setShowCurrentPassword(false);
        setForm({ employeeId: '', fullName: '', email: '', phoneNumber: '', password: '', currentPassword: '', roleId: '', branchId: '', departmentId: '' });
        setShowModal(true);
    };

    const openEditModal = (u: UserRow) => {
        setEditMode(true);
        setSelectedUserId(u.userId);
        setModalError('');
        setShowPassword(false);
        setShowCurrentPassword(false);
        setForm({
            employeeId: u.employeeId,
            fullName: u.fullName,
            email: u.email,
            phoneNumber: u.phoneNumber || '',
            password: '', // Leave blank to keep current
            currentPassword: '',
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
        setModalError('');
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
            let msg = err.response?.data?.message || err.message || 'Action failed.';
            if (msg.includes('Incorrect current password of the employee') || msg.includes('current password')) {
                msg = 'Incorrect current password. Please verify the employee\'s current password and try again.';
            } else if (msg.includes('unexpected error occurred') && msg.toLowerCase().includes('password')) {
                msg = 'Incorrect current password. Please verify the employee\'s current password and try again.';
            }
            setModalError(msg);
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

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              u.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBranch = filterBranch ? (u.branchId && u.branchId.toString() === filterBranch) : true;
        const matchesRole = filterRole ? u.roleId.toString() === filterRole : true;
        return matchesSearch && matchesBranch && matchesRole;
    });

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

            <div className="admin-filters" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input 
                    type="text" 
                    placeholder="Search by Name or ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, minWidth: '200px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <select 
                    value={filterRole} 
                    onChange={(e) => setFilterRole(e.target.value)}
                    style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                >
                    <option value="">All Roles</option>
                    {roles.map(r => (
                        <option key={r.roleId} value={r.roleId}>{r.roleName.replace(/_/g, ' ')}</option>
                    ))}
                </select>
                <select 
                    value={filterBranch} 
                    onChange={(e) => setFilterBranch(e.target.value)}
                    style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                        <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                    ))}
                </select>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Full Name</th>
                            <th>Role</th>
                            <th>Branch</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.userId} className={!u.isActive ? 'row-inactive' : ''}>
                                <td className="fw-semibold">{u.employeeId}</td>
                                <td>{u.fullName}</td>
                                <td>
                                    <span className={`role-badge role-${u.roleName?.toLowerCase().replace(/_/g, '-')}`}>
                                        {u.roleName?.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td>{u.branchName || 'None (Floating)'}</td>
                                <td>{u.departmentName || '—'}</td>
                                <td>
                                    <span className={`status-dot ${u.isActive ? 'dot-active' : 'dot-inactive'}`}></span>
                                    {u.isActive ? 'Active' : 'Inactive'}
                                </td>
                                <td>
                                    <div className="action-group">
                                        <button className="btn-icon" onClick={() => setViewUser(u)} title="View Profile">👁️</button>
                                        <button className="btn-icon" onClick={() => openEditModal(u)} title="Edit">✏️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={7} className="empty-row">No users found.</td></tr>
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
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewUser.branchName || 'None (Floating Staff)'}</span>
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
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            name="password" 
                                            type={showPassword ? 'text' : 'password'} 
                                            value={form.password} 
                                            onChange={handleChange} 
                                            placeholder={editMode ? '********' : 'Minimum 6 characters'} 
                                            required={!editMode} 
                                            style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#64748b',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                userSelect: 'none'
                                            }}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {editMode && form.password.trim() !== '' && (
                                    <div className="form-group full-width">
                                        <label>Current Password of Employee <span className="required">*</span></label>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                name="currentPassword" 
                                                type={showCurrentPassword ? 'text' : 'password'} 
                                                value={form.currentPassword} 
                                                onChange={handleChange} 
                                                placeholder="Enter the employee's current password to authorize change" 
                                                required 
                                                style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#64748b',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    userSelect: 'none'
                                                }}
                                            >
                                                {showCurrentPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                                    <label>Branch {!(roles.find(r => r.roleId.toString() === form.roleId)?.roleName === 'DELIVERY_PERSON' || roles.find(r => r.roleId.toString() === form.roleId)?.roleName === 'SYSTEM_ADMIN') && <span className="required">*</span>}</label>
                                    <select 
                                        name="branchId" 
                                        value={form.branchId} 
                                        onChange={handleChange} 
                                        required={!(roles.find(r => r.roleId.toString() === form.roleId)?.roleName === 'DELIVERY_PERSON' || roles.find(r => r.roleId.toString() === form.roleId)?.roleName === 'SYSTEM_ADMIN')}
                                        disabled={roles.find(r => r.roleId.toString() === form.roleId)?.roleName === 'DELIVERY_PERSON'}
                                    >
                                        <option value="">{roles.find(r => r.roleId.toString() === form.roleId)?.roleName === 'DELIVERY_PERSON' ? 'N/A (Floating)' : 'Select Branch'}</option>
                                        {branches.map(b => (
                                            <option key={b.branchId} value={b.branchId}>{b.branchName} ({b.branchCode})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <select name="departmentId" value={form.departmentId} onChange={handleChange} disabled={!form.branchId}>
                                        <option value="">None</option>
                                        {departments.filter(d => 
                                            branches.find(b => b.branchId.toString() === form.branchId)?.departmentIds?.includes(d.departmentId)
                                        ).map(d => (
                                            <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                                        ))}
                                    </select>
                                    {!form.branchId && <small style={{ color: '#a0aec0', display: 'block', marginTop: '4px' }}>Select a branch first</small>}
                                </div>
                            </div>
                            <div className="modal-actions">
                                {editMode && selectedUserId && (
                                    <button 
                                        type="button" 
                                        className={`btn-toggle ${users.find(u => u.userId === selectedUserId)?.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                                        onClick={() => {
                                            handleToggleActive(selectedUserId);
                                            // Refreshing visual state inside the modal if needed, 
                                            // though fetchAll() will trigger a re-render.
                                        }}
                                        style={{ marginRight: 'auto' }}
                                    >
                                        {users.find(u => u.userId === selectedUserId)?.isActive ? 'Deactivate Account' : 'Activate Account'}
                                    </button>
                                )}
                                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-admin-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editMode ? '💾 Save Changes' : '✅ Create Employee')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Error Alert Popup Overlay */}
            {modalError && (
                <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setModalError('')}>
                    <div className="modal-content" style={{ maxWidth: '400px', width: '95%', padding: '24px', textAlign: 'center', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #fee2e2', background: 'white' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h3 style={{ fontSize: '1.2rem', color: '#991b1b', fontWeight: 'bold', marginBottom: '12px' }}>Verification Failed</h3>
                        <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.5', marginBottom: '24px' }}>
                            {modalError}
                        </p>
                        <button 
                            type="button" 
                            className="btn-admin-primary" 
                            onClick={() => setModalError('')}
                            style={{ width: '100%', backgroundColor: '#dc2626', borderColor: '#dc2626', color: 'white', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
