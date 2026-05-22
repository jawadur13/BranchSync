import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './Admin.css';

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
    behaviorType?: string;
}

const ItemManagement = () => {
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [departments, setDepartments] = useState<DeptRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showItemForm, setShowItemForm] = useState(false);
    const [editItemId, setEditItemId] = useState<number | null>(null);
    const [viewItem, setViewItem] = useState<CategoryRow | null>(null);
    const [searchItem, setSearchItem] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{ categoryId: number, categoryName: string } | null>(null);
    const [behaviorWarning, setBehaviorWarning] = useState(false);

    const [itemForm, setItemForm] = useState({
        categoryName: '', departmentId: '' as string | number, sensitivityLevel: 'LOW', description: '', behaviorType: 'DOCUMENT_CASE'
    });

    const [stockItems, setStockItems] = useState<any[]>([]);
    const [loadingStockItems, setLoadingStockItems] = useState(false);
    const [showStockItemForm, setShowStockItemForm] = useState(false);
    const [editStockItemId, setEditStockItemId] = useState<number | null>(null);
    const [stockItemForm, setStockItemForm] = useState({
        itemName: '', itemCode: '', unit: 'pcs', description: ''
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cRes, dRes] = await Promise.all([
                api.get('/admin/org/items'),
                api.get('/admin/org/departments'),
            ]);
            setCategories(cRes.data);
            setDepartments(dRes.data);
        } catch {
            setError('Failed to load organization item category data.');
        } finally {
            setLoading(false);
        }
    };

    const openEditItem = (c: CategoryRow) => {
        setEditItemId(c.categoryId);
        setItemForm({
            categoryName: c.categoryName,
            departmentId: c.departmentId || '',
            sensitivityLevel: c.sensitivityLevel,
            description: c.description || '',
            behaviorType: c.behaviorType || 'DOCUMENT_CASE'
        });
        setShowItemForm(true);
    };

    const handleItemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editItemId) {
            const orig = categories.find(cat => cat.categoryId === editItemId);
            if (orig && orig.behaviorType !== itemForm.behaviorType) {
                setBehaviorWarning(true);
                return; // Show confirmation popup before saving
            }
        }
        await executeItemSubmit();
    };

    const executeItemSubmit = async () => {
        setSubmitting(true); setError(''); setSuccess('');
        try {
            const payload = {
                categoryName: itemForm.categoryName,
                departmentId: itemForm.departmentId !== '' ? Number(itemForm.departmentId) : null,
                sensitivityLevel: itemForm.sensitivityLevel,
                description: itemForm.description || null,
                behaviorType: itemForm.behaviorType
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
            setItemForm({ categoryName: '', departmentId: '', sensitivityLevel: 'LOW', description: '', behaviorType: 'DOCUMENT_CASE' });
            setBehaviorWarning(false);
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

    const handleDeleteItem = (categoryId: number, categoryName: string) => {
        setConfirmDelete({ categoryId, categoryName });
    };

    // ── Stock Items Operations ──────────────────────────────────────────────

    useEffect(() => {
        if (viewItem && viewItem.behaviorType === 'STOCK') {
            fetchStockItems(viewItem.categoryId);
        } else {
            setStockItems([]);
            setShowStockItemForm(false);
            setEditStockItemId(null);
        }
    }, [viewItem]);

    const fetchStockItems = async (categoryId: number) => {
        setLoadingStockItems(true);
        try {
            const res = await api.get(`/admin/org/items/${categoryId}/stock-items`);
            setStockItems(res.data);
        } catch (err) {
            console.error("Failed to fetch stock items", err);
        } finally {
            setLoadingStockItems(false);
        }
    };

    const handleStockItemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewItem) return;
        setSubmitting(true);
        try {
            if (editStockItemId) {
                await api.put(`/admin/org/stock-items/${editStockItemId}`, stockItemForm);
            } else {
                await api.post(`/admin/org/items/${viewItem.categoryId}/stock-items`, stockItemForm);
            }
            setStockItemForm({ itemName: '', itemCode: '', unit: 'pcs', description: '' });
            setShowStockItemForm(false);
            setEditStockItemId(null);
            fetchStockItems(viewItem.categoryId);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save stock item");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStockItemActive = async (itemId: number) => {
        if (!viewItem) return;
        try {
            await api.put(`/admin/org/stock-items/${itemId}/toggle-active`);
            fetchStockItems(viewItem.categoryId);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to toggle status");
        }
    };

    const openEditStockItem = (item: any) => {
        setEditStockItemId(item.stockItemId);
        setStockItemForm({
            itemName: item.itemName,
            itemCode: item.itemCode || '',
            unit: item.unit || 'pcs',
            description: item.description || ''
        });
        setShowStockItemForm(true);
    };

    const filteredCategories = categories.filter(c =>
        c.categoryName.toLowerCase().includes(searchItem.toLowerCase())
    );

    if (loading) return <div className="admin-loading">Loading organization item category data...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">📦 Item Categories</h1>
                    <p className="admin-subtitle">Manage inventory items and routing rules</p>
                </div>
            </div>

            {error && <div className="admin-alert admin-alert-error">{error}</div>}
            {success && <div className="admin-alert admin-alert-success">{success}</div>}

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
                            setItemForm({ categoryName: '', departmentId: '', sensitivityLevel: 'LOW', description: '', behaviorType: 'DOCUMENT_CASE' });
                        }
                        setShowItemForm(!showItemForm);
                    }}>
                        {showItemForm ? '✕ Cancel' : '+ Add Category'}
                    </button>
                </div>



                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Category Name</th>
                            <th>Behavior</th>
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
                                    <span className={`type-badge behavior-${cat.behaviorType?.toLowerCase() || 'document'}`}>
                                        {cat.behaviorType || 'DOCUMENT_CASE'}
                                    </span>
                                </td>
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
                            <tr><td colSpan={7} className="empty-row">No item categories found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

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
                                <div className="profile-item">
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Behavior Type</span>
                                    <span className={`type-badge behavior-${viewItem.behaviorType?.toLowerCase() || 'document'}`} style={{ display: 'inline-block', fontSize: '13px', fontWeight: 600 }}>{viewItem.behaviorType || 'DOCUMENT_CASE'}</span>
                                </div>
                                <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="profile-label" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Description</span>
                                    <span className="profile-value" style={{ fontSize: '15px', color: '#2d3748' }}>{viewItem.description || '—'}</span>
                                </div>
                            </div>
                            {viewItem.behaviorType === 'STOCK' && (
                                <div className="stock-items-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            📦 Stock Items under this category
                                        </h3>
                                        <button 
                                            type="button"
                                            className="btn-admin-primary" 
                                            onClick={() => {
                                                if (!showStockItemForm) {
                                                    setEditStockItemId(null);
                                                    setStockItemForm({ itemName: '', itemCode: '', unit: 'pcs', description: '' });
                                                }
                                                setShowStockItemForm(!showStockItemForm);
                                            }}
                                            style={{ padding: '4px 10px', fontSize: '12px' }}
                                        >
                                            {showStockItemForm ? '✕ Cancel' : '+ Add Stock Item'}
                                        </button>
                                    </div>

                                    {showStockItemForm && (
                                        <form onSubmit={handleStockItemSubmit} style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px', border: '1px solid #edf2f7', marginBottom: '15px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '10px', marginBottom: '10px' }}>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '4px' }}>Item Name *</label>
                                                    <input 
                                                        value={stockItemForm.itemName} 
                                                        onChange={e => setStockItemForm({ ...stockItemForm, itemName: e.target.value })} 
                                                        placeholder="e.g. Executive Chair" 
                                                        required 
                                                        style={{ padding: '6px 8px', fontSize: '13px', width: '100%', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '4px' }}>Item Code</label>
                                                    <input 
                                                        value={stockItemForm.itemCode} 
                                                        onChange={e => setStockItemForm({ ...stockItemForm, itemCode: e.target.value })} 
                                                        placeholder="e.g. OFF-CHR-01" 
                                                        style={{ padding: '6px 8px', fontSize: '13px', width: '100%', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '4px' }}>Unit</label>
                                                    <input 
                                                        value={stockItemForm.unit} 
                                                        onChange={e => setStockItemForm({ ...stockItemForm, unit: e.target.value })} 
                                                        placeholder="pcs" 
                                                        style={{ padding: '6px 8px', fontSize: '13px', width: '100%', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group" style={{ margin: '0 0 10px 0' }}>
                                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '4px' }}>Description</label>
                                                <input 
                                                    value={stockItemForm.description} 
                                                    onChange={e => setStockItemForm({ ...stockItemForm, description: e.target.value })} 
                                                    placeholder="Brief description" 
                                                    style={{ padding: '6px 8px', fontSize: '13px', width: '100%', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                />
                                            </div>
                                            <button type="submit" className="btn-admin-primary" disabled={submitting} style={{ padding: '5px 12px', fontSize: '12px' }}>
                                                {submitting ? 'Saving...' : (editStockItemId ? '💾 Update Item' : '✅ Add Item')}
                                            </button>
                                        </form>
                                    )}

                                    {loadingStockItems ? (
                                        <div style={{ color: '#718096', fontSize: '13px', textAlign: 'center', padding: '10px' }}>Loading stock items...</div>
                                    ) : (
                                        <table className="admin-table" style={{ fontSize: '12px' }}>
                                            <thead>
                                                <tr>
                                                    <th>Item Name</th>
                                                    <th>Code</th>
                                                    <th>Unit</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stockItems.map(item => (
                                                    <tr key={item.stockItemId} className={!item.isActive ? 'row-inactive' : ''}>
                                                        <td className="fw-semibold">{item.itemName}</td>
                                                        <td>{item.itemCode || '—'}</td>
                                                        <td>{item.unit || 'pcs'}</td>
                                                        <td>
                                                            <span className={`status-dot ${item.isActive ? 'dot-active' : 'dot-inactive'}`}></span>
                                                            {item.isActive ? 'Active' : 'Inactive'}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button type="button" className="btn-icon" onClick={() => openEditStockItem(item)} title="Edit Item" style={{ padding: '2px', fontSize: '12px', border: 'none', background: 'transparent' }}>✏️</button>
                                                                <button type="button" className="btn-icon" onClick={() => handleToggleStockItemActive(item.stockItemId)} title={item.isActive ? "Deactivate" : "Activate"} style={{ padding: '2px', fontSize: '12px', border: 'none', background: 'transparent' }}>🔄</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {stockItems.length === 0 && (
                                                    <tr><td colSpan={5} className="empty-row" style={{ padding: '15px' }}>No stock items defined.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-actions" style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-admin-primary" onClick={() => { setViewItem(null); openEditItem(viewItem); }}>Edit Category</button>
                            <button className="btn-ghost" onClick={() => setViewItem(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', padding: '24px' }}>
                        <h2 style={{ marginTop: 0, color: '#e53e3e' }}>⚠️ Confirm Deletion</h2>
                        <p>Are you sure you want to delete the item category <strong>"{confirmDelete.categoryName}"</strong>?</p>
                        <p style={{ color: '#718096', fontSize: '14px' }}>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button className="btn-admin-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn-admin-primary" style={{ background: '#e53e3e' }} onClick={async () => {
                                setError(''); setSuccess('');
                                try {
                                    const res = await api.delete(`/admin/org/items/${confirmDelete.categoryId}`);
                                    setSuccess(res.data.message || 'Item category deleted successfully.');
                                    setConfirmDelete(null);
                                    fetchAll();
                                } catch (err: any) {
                                    setError(err.response?.data?.message || 'Failed to delete item category.');
                                    setConfirmDelete(null);
                                }
                            }}>
                                Delete Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Behavior Warning Modal */}
            {behaviorWarning && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', padding: '24px' }}>
                        <h2 style={{ marginTop: 0, color: '#dd6b20' }}>⚠️ Confirm Behavior Change</h2>
                        <p>Changing the behavior of an existing category with transfer history may cause unexpected behavior across the system.</p>
                        <p style={{ color: '#718096', fontSize: '14px' }}>Are you sure you want to proceed and save changes?</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button className="btn-admin-secondary" onClick={() => setBehaviorWarning(false)}>
                                Cancel
                            </button>
                            <button className="btn-admin-primary" style={{ background: '#dd6b20' }} onClick={() => executeItemSubmit()} disabled={submitting}>
                                {submitting ? 'Saving...' : 'Yes, Confirm Change'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Item Form Modal */}
            {showItemForm && (
                <div className="modal-overlay" onClick={() => setShowItemForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', padding: '24px' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c' }}>
                                {editItemId ? '✏️ Edit Item Category' : '➕ Add Item Category'}
                            </h2>
                            <button type="button" className="modal-close" onClick={() => setShowItemForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#a0aec0' }}>✕</button>
                        </div>
                        <form onSubmit={handleItemSubmit}>
                            <div className="modal-grid" style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Category Name <span className="required" style={{ color: '#e53e3e' }}>*</span></label>
                                    <input
                                        value={itemForm.categoryName}
                                        onChange={e => setItemForm({ ...itemForm, categoryName: e.target.value })}
                                        placeholder="e.g. Cash Bundle"
                                        required
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Behavior Type</label>
                                    <select
                                        value={itemForm.behaviorType}
                                        onChange={e => setItemForm({ ...itemForm, behaviorType: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                    >
                                        <option value="DOCUMENT_CASE">DOCUMENT_CASE (Plain Workflow)</option>
                                        <option value="CASH">CASH (Vault Ledger & Denoms)</option>
                                        <option value="STOCK">STOCK (Operational Inventory)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Sensitivity Level</label>
                                    <select
                                        value={itemForm.sensitivityLevel}
                                        onChange={e => setItemForm({ ...itemForm, sensitivityLevel: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                    >
                                        <option value="LOW">LOW</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HIGH">HIGH</option>
                                        <option value="CRITICAL">CRITICAL</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Responsible Department</label>
                                    <select
                                        value={itemForm.departmentId}
                                        onChange={e => setItemForm({ ...itemForm, departmentId: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                    >
                                        <option value="">Unassigned (Open Access)</option>
                                        {departments.map(d => (
                                            <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>Description</label>
                                    <input
                                        value={itemForm.description}
                                        onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                        placeholder="Brief description of the item category"
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn-admin-secondary" onClick={() => setShowItemForm(false)}>Cancel</button>
                                <button type="submit" className="btn-admin-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editItemId ? '💾 Save Changes' : '✅ Create Category')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemManagement;
