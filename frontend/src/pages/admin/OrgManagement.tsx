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
interface CategoryRow {
    categoryId: number;
    categoryName: string;
    sensitivityLevel: string;
    description: string | null;
    departmentId: number | null;
    departmentName: string;
    isActive?: boolean;
}

const OrgManagement = ({ defaultTab = 'branches' }: { defaultTab?: 'branches' | 'departments' | 'items' }) => {
    const [branches, setBranches] = useState<BranchRow[]>([]);
    const [departments, setDepartments] = useState<DeptRow[]>([]);
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const activeTab = defaultTab;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [showDeptForm, setShowDeptForm] = useState(false);
    const [showItemForm, setShowItemForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [viewBranch, setViewBranch] = useState<BranchRow | null>(null);
    const [viewDept, setViewDept] = useState<DeptRow | null>(null);
    const [viewItem, setViewItem] = useState<CategoryRow | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [searchBranch, setSearchBranch] = useState('');
    const [searchDept, setSearchDept] = useState('');
    const [searchItem, setSearchItem] = useState('');
    const [editBranchId, setEditBranchId] = useState<number | null>(null);
    const [editDeptId, setEditDeptId] = useState<number | null>(null);
    const [editItemId, setEditItemId] = useState<number | null>(null);

    const [branchForm, setBranchForm] = useState({
        branchCode: '', branchName: '', branchType: 'BRANCH',
        district: '', division: '', address: '', phone: '', departmentIds: [] as number[]
    });
    const [deptForm, setDeptForm] = useState({ departmentName: '' });
    const [itemForm, setItemForm] = useState({
        categoryName: '', departmentId: '' as string | number, sensitivityLevel: 'LOW', description: ''
    });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [bRes, dRes, uRes, cRes] = await Promise.all([
                api.get('/admin/org/branches'),
                api.get('/admin/org/departments'),
                api.get('/admin/users'),
                api.get('/admin/org/items'),
            ]);
            setBranches(bRes.data);
            setDepartments(dRes.data);
            setUsers(uRes.data);
            setCategories(cRes.data);
        } catch {
            setError('Failed to load organization data.');
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

    const openEditDept = (d: DeptRow) => {
        setEditDeptId(d.departmentId);
        setDeptForm({
            departmentName: d.departmentName
        });
        setShowDeptForm(true);
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

    // const handleItemMap = async (categoryId: number, departmentId: string) => {
    //     setSubmitting(true); setError(''); setSuccess('');
    //     try {
    //         await api.put(`/admin/org/items/${categoryId}/map`, { departmentId: departmentId ? Number(departmentId) : null });
    //         setSuccess('Item mapping updated!');
    //         fetchAll();
    //     } catch (err: any) {
    //         setError(err.response?.data?.message || 'Failed to map item.');
    //     } finally { setSubmitting(false); }
    // };

    const openEditItem = (c: CategoryRow) => {
        setEditItemId(c.categoryId);
        setItemForm({
            categoryName: c.categoryName,
            departmentId: c.departmentId || '',
            sensitivityLevel: c.sensitivityLevel,
            description: c.description || ''
        });
        setShowItemForm(true);
    };

    const handleItemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError(''); setSuccess('');
        try {
            const payload = {
                categoryName: itemForm.categoryName,
                departmentId: itemForm.departmentId !== '' ? Number(itemForm.departmentId) : null,
                sensitivityLevel: itemForm.sensitivityLevel,
                description: itemForm.description || null
            };
            if (editItemId) {
                await api.put(`/admin/org/items/${editItemId}`, payload);
                setSuccess('Item category updated successfully!');
            } else {
                await api.post('/admin/org/items', payload);
                setSuccess('Item category created successfully!');
            }
            setShowItemForm(false);
            setEditItemId(null);
            setItemForm({ categoryName: '', departmentId: '', sensitivityLevel: 'LOW', description: '' });
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save item category.');
        } finally { setSubmitting(false); }
    };

    const handleToggleItemActive = async (categoryId: number) => {
        setError(''); setSuccess('');
        try {
            const res = await api.put(`/admin/org/items/${categoryId}/toggle-active`);
            setSuccess(res.data.message || 'Item category status updated!');
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to toggle status.');
        }
    };

    const handleDeleteItem = async (categoryId: number, categoryName: string) => {
        if (!window.confirm(`Are you sure you want to delete the item category "${categoryName}"?`)) return;
        setError(''); setSuccess('');
        try {
            const res = await api.delete(`/admin/org/items/${categoryId}`);
            setSuccess(res.data.message || 'Item category deleted successfully.');
            fetchAll();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete item category.');
        }
    };

    const filteredBranches = branches.filter(b => 
        b.branchName.toLowerCase().includes(searchBranch.toLowerCase()) || 
        b.branchCode.toLowerCase().includes(searchBranch.toLowerCase())
    );

    const filteredDepartments = departments.filter(d => 
        d.departmentName.toLowerCase().includes(searchDept.toLowerCase())
    );

    const filteredCategories = categories.filter(c =>
        c.categoryName.toLowerCase().includes(searchItem.toLowerCase())
    );

    if (loading) return <div className="admin-loading">Loading organization data...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    {activeTab === 'branches' && (
                        <>
                            <h1 className="admin-title">🏢 Branches</h1>
                            <p className="admin-subtitle">Manage branch locations and assignments</p>
                        </>
                    )}
                    {activeTab === 'departments' && (
                        <>
                            <h1 className="admin-title">🏷️ Departments</h1>
                            <p className="admin-subtitle">Manage organizational departments</p>
                        </>
                    )}
                    {activeTab === 'items' && (
                        <>
                            <h1 className="admin-title">📦 Item Categories</h1>
                            <p className="admin-subtitle">Manage inventory items and routing rules</p>
                        </>
                    )}
                </div>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}
            {success && <div className="admin-alert admin-alert-success">{success}</div>}

            {/* Branches Tab */}
            {activeTab === 'branches' && (
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
                                        <option value="AD_BRANCH">AD_BRANCH</option>
                                        <option value="SUB_BRANCH">SUB_BRANCH</option>
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
                                <div className="form-group full-width">
                                    <label>Assign Departments to Branch</label>
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
                            <button type="submit" className="btn-admin-primary" disabled={submitting} style={{ marginTop: '12px' }}>
                                {submitting ? 'Saving...' : (editBranchId ? '💾 Save Changes' : '✅ Create Branch')}
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
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
                <div className="admin-card">
                    <div className="card-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <input 
                            type="text" 
                            placeholder="Search department by Name or Branch..." 
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

                    {showDeptForm && (
                        <form className="inline-form" onSubmit={handleDeptSubmit}>
                            <div className="modal-grid">
                                <div className="form-group">
                                    <label>Department Name <span className="required">*</span></label>
                                    <input value={deptForm.departmentName} onChange={e => setDeptForm({ ...deptForm, departmentName: e.target.value })} placeholder="e.g. Cash Operations" required />
                                </div>

                            </div>
                            <button type="submit" className="btn-admin-primary" disabled={submitting} style={{ marginTop: '12px' }}>
                                {submitting ? 'Saving...' : (editDeptId ? '💾 Save Changes' : '✅ Create Department')}
                            </button>
                        </form>
                    )}

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
            )}

            {/* Items Tab */}
            {activeTab === 'items' && (
                <div className="admin-card">
                    <div className="card-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <input
                            type="text"
                            placeholder="Search item categories..."
                            value={searchItem}
                            onChange={(e) => setSearchItem(e.target.value)}
                            style={{ flex: 1, maxWidth: '300px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        />
                        <button className="btn-admin-primary" onClick={() => {
                            if (!showItemForm) {
                                setEditItemId(null);
                                setItemForm({ categoryName: '', departmentId: '', sensitivityLevel: 'LOW', description: '' });
                            }
                            setShowItemForm(!showItemForm);
                        }}>
                            {showItemForm ? '✕ Cancel' : '+ Add Category'}
                        </button>
                    </div>

                    {showItemForm && (
                        <form className="inline-form" onSubmit={handleItemSubmit}>
                            <div className="modal-grid">
                                <div className="form-group">
                                    <label>Category Name <span className="required">*</span></label>
                                    <input
                                        value={itemForm.categoryName}
                                        onChange={e => setItemForm({ ...itemForm, categoryName: e.target.value })}
                                        placeholder="e.g. Cash Bundle"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Sensitivity Level</label>
                                    <select
                                        value={itemForm.sensitivityLevel}
                                        onChange={e => setItemForm({ ...itemForm, sensitivityLevel: e.target.value })}
                                    >
                                        <option value="LOW">LOW</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HIGH">HIGH</option>
                                        <option value="CRITICAL">CRITICAL</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Responsible Department</label>
                                    <select
                                        value={itemForm.departmentId}
                                        onChange={e => setItemForm({ ...itemForm, departmentId: e.target.value })}
                                    >
                                        <option value="">Unassigned (Open Access)</option>
                                        {departments.map(d => (
                                            <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <input
                                        value={itemForm.description}
                                        onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                        placeholder="Brief description of the item category"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-admin-primary" disabled={submitting} style={{ marginTop: '12px' }}>
                                {submitting ? 'Saving...' : (editItemId ? '💾 Save Changes' : '✅ Create Category')}
                            </button>
                        </form>
                    )}

                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Sensitivity</th>
                                <th>Responsible Dept</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map(cat => (
                                <tr key={cat.categoryId} className={cat.isActive === false ? 'row-inactive' : ''}>
                                    <td className="fw-semibold">{cat.categoryName}</td>
                                    <td>
                                        <span className={`type-badge sensitivity-${cat.sensitivityLevel?.toLowerCase()}`}>
                                            {cat.sensitivityLevel}
                                        </span>
                                    </td>
                                    <td>{cat.departmentName}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {cat.description || <span style={{ color: '#a0aec0' }}>—</span>}
                                    </td>
                                    <td>
                                        <span className={`status-dot ${cat.isActive !== false ? 'dot-active' : 'dot-inactive'}`}></span>
                                        {cat.isActive !== false ? 'Active' : 'Inactive'}
                                    </td>
                                    <td>
                                        <div className="action-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <button className="btn-icon" onClick={() => setViewItem(cat)} title="View Details">👁️</button>
                                            <button className="btn-icon" onClick={() => openEditItem(cat)} title="Edit Category">✏️</button>
                                            <button 
                                                className="btn-icon" 
                                                onClick={() => handleToggleItemActive(cat.categoryId)} 
                                                title={cat.isActive !== false ? "Deactivate" : "Activate"}
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
                                            >
                                                🔄
                                            </button>
                                            <button 
                                                className="btn-icon btn-delete" 
                                                onClick={() => handleDeleteItem(cat.categoryId, cat.categoryName)} 
                                                title="Delete Category"
                                                style={{ color: '#e53e3e', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCategories.length === 0 && (
                                <tr><td colSpan={6} className="empty-row">No item categories found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* View Item Modal */}
            {viewItem && (
                <div className="modal-overlay" onClick={() => setViewItem(null)}>
                    <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📦 Item Category Details</h2>
                            <button className="modal-close" onClick={() => setViewItem(null)}>✕</button>
                        </div>
                        <div className="profile-details">
                            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
                                <div className="profile-avatar" style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                    📦
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#1a202c' }}>{viewItem.categoryName}</h3>
                                    <span className={`type-badge sensitivity-${viewItem.sensitivityLevel?.toLowerCase()}`}>{viewItem.sensitivityLevel}</span>
                                </div>
                            </div>
                            <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Responsible Department</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewItem.departmentName}</span>
                                </div>
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Sensitivity Level</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{viewItem.sensitivityLevel}</span>
                                </div>
                                <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Description</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748' }}>{viewItem.description || '—'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-admin-primary" onClick={() => { setViewItem(null); openEditItem(viewItem); }}>Edit Category</button>
                            <button className="btn-ghost" onClick={() => setViewItem(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
};

export default OrgManagement;
