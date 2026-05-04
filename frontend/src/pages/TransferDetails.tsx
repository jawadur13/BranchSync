import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './TransferDetails.css';

interface TransferDetail {
    requestId: number;
    requestCode: string;
    status: string;
    title: string;
    description: string | null;
    originBranchId: number;
    originBranchName: string;
    originBranchCode: string;
    destinationBranchId: number;
    destinationBranchName: string;
    destinationBranchCode: string;
    originDepartmentId: number | null;
    originDepartmentName: string | null;
    destinationDepartmentId: number | null;
    destinationDepartmentName: string | null;
    categoryName: string;
    sensitivityLevel: string;
    priority: string;
    initiatedByUserId: number;
    initiatedByFullName: string;
    initiatedByEmployeeId: string;
    initiatedByBranchId: number;
    requestedAt: string;
    closedAt: string | null;
    pickedUpAt: string | null;
    deliveredAt: string | null;
    deliveryPersonId: number | null;
    deliveryPersonFullName: string | null;
    finalNote: string | null;
}

const TransferDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [transfer, setTransfer] = useState<TransferDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');
    const [availableDeliveryPersons, setAvailableDeliveryPersons] = useState<any[]>([]);
    const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState('');
    const [finalNote, setFinalNote] = useState('');

    useEffect(() => {
        fetchTransferDetails();
    }, [id]);

    const fetchTransferDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/transfers/${id}`);
            setTransfer(response.data);
            
            // If in Step 2, fetch available delivery persons
            if (response.data.status === 'PENDING_ASSIGNMENT') {
                const delRes = await api.get('/lookup/users/delivery-persons/available');
                setAvailableDeliveryPersons(delRes.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load transfer details.');
        } finally {
            setLoading(false);
        }
    };

    // Step 1 Gate: Internal Approval
    const handleApproveInternal = async () => {
        if (!confirm('Approve this request internally for your branch?')) return;
        setActionLoading(true); setActionSuccess(''); setError('');
        try {
            await api.post(`/transfers/${id}/approve-internal`);
            setActionSuccess('Internally approved! Now waiting for destination acceptance.');
            fetchTransferDetails();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Step 2: Accept and Assign
    const handleAcceptAndAssign = async () => {
        if (!selectedDeliveryPersonId) {
            setError('Please select a delivery person.');
            return;
        }
        if (!confirm('Accept this request and assign the selected driver?')) return;
        setActionLoading(true); setActionSuccess(''); setError('');
        try {
            await api.post(`/transfers/${id}/accept`, { deliveryPersonId: Number(selectedDeliveryPersonId) });
            setActionSuccess('Request accepted and driver assigned!');
            fetchTransferDetails();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Step 3: Final Release
    const handleRelease = async () => {
        if (!confirm('Give final green light for this transfer?')) return;
        setActionLoading(true); setActionSuccess(''); setError('');
        try {
            await api.post(`/transfers/${id}/release`);
            setActionSuccess('Final release granted! Driver can now pick up.');
            fetchTransferDetails();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Step 4: Pickup
    const handlePickup = async () => {
        if (!confirm('Confirm pickup of items?')) return;
        setActionLoading(true); setActionSuccess(''); setError('');
        try {
            await api.post(`/transfers/${id}/pickup`);
            setActionSuccess('Items marked as Picked Up!');
            fetchTransferDetails();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Step 5: Deliver
    const handleDeliver = async () => {
        if (!confirm('Confirm delivery at destination?')) return;
        setActionLoading(true); setActionSuccess(''); setError('');
        try {
            await api.post(`/transfers/${id}/deliver`);
            setActionSuccess('Items marked as Delivered!');
            fetchTransferDetails();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Step 6: Close (Accept/Reject)
    const handleClose = async (accepted: boolean) => {
        if (!finalNote && !accepted) {
            setError('Please provide a reason for rejection.');
            return;
        }
        const actionText = accepted ? 'Complete' : 'Reject';
        if (!confirm(`Are you sure you want to ${actionText} this transfer?`)) return;
        
        setActionLoading(true); setActionSuccess(''); setError('');
        try {
            await api.post(`/transfers/${id}/close`, { finalNote, accepted });
            setActionSuccess(`Transfer ${accepted ? 'Completed' : 'Rejected'} successfully!`);
            fetchTransferDetails();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { class: string; icon: string }> = {
            'PENDING_INTERNAL': { class: 'status-pending', icon: '⏳' },
            'PENDING_ASSIGNMENT': { class: 'status-pending', icon: '🤝' },
            'PENDING_FINAL_RELEASE': { class: 'status-approved', icon: '🚦' },
            'READY_FOR_PICKUP': { class: 'status-approved', icon: '📦' },
            'IN_TRANSIT': { class: 'status-transit', icon: '🚚' },
            'DELIVERED': { class: 'status-received', icon: '📍' },
            'COMPLETED': { class: 'status-confirmed', icon: '✔️' },
            'REJECTED_ON_RECEIPT': { class: 'status-rejected', icon: '❌' },
            'CANCELLED': { class: 'status-cancelled', icon: '🚫' },
        };
        return configs[status] || { class: 'status-draft', icon: '📄' };
    };

    // Role-based logic
    const isManager = user?.role === 'BRANCH_MANAGER' || user?.role === 'OPERATION_MANAGER' || user?.role === 'FIRST_EXECUTIVE_OFFICER';
    
    const canApproveInternal = () => {
        return transfer?.status === 'PENDING_INTERNAL' && isManager && user?.branchId === transfer?.originBranchId;
    };

    const canAcceptAndAssign = () => {
        // Staff at destination department
        return transfer?.status === 'PENDING_ASSIGNMENT' && user?.branchId === transfer?.destinationBranchId;
    };

    const canRelease = () => {
        return transfer?.status === 'PENDING_FINAL_RELEASE' && isManager && user?.branchId === transfer?.destinationBranchId;
    };

    const canPickup = () => {
        return transfer?.status === 'READY_FOR_PICKUP' && user?.userId === transfer?.deliveryPersonId;
    };

    const canDeliver = () => {
        return transfer?.status === 'IN_TRANSIT' && user?.userId === transfer?.deliveryPersonId;
    };

    const canClose = () => {
        // Only original requester
        return transfer?.status === 'DELIVERED' && user?.userId === transfer?.initiatedByUserId;
    };

    if (loading) {
        return <div className="details-loading"><div className="loading-spinner"></div><p>Loading...</p></div>;
    }

    if (!transfer) return <div className="details-error-page"><h2>Not Found</h2><Link to="/">Back</Link></div>;

    const statusConfig = getStatusConfig(transfer.status);

    return (
        <div className="transfer-details-container">
            <div className="details-nav">
                <button className="btn-ghost" onClick={() => navigate('/')}>← Back</button>
            </div>

            {error && <div className="detail-alert detail-alert-error">{error}</div>}
            {actionSuccess && <div className="detail-alert detail-alert-success">{actionSuccess}</div>}

            <div className="details-hero">
                <div className="hero-left">
                    <div className="hero-code">{transfer.requestCode}</div>
                    <h1 className="hero-title">{transfer.title}</h1>
                    <div className="hero-meta">
                        <span>👤 {transfer.initiatedByFullName}</span>
                        <span className="meta-separator">•</span>
                        <span>🕐 {formatDate(transfer.requestedAt)}</span>
                    </div>
                </div>
                <div className="hero-right">
                    <div className={`status-pill ${statusConfig.class}`}>
                        <span>{statusConfig.icon}</span>
                        <span>{transfer.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className={`priority-pill priority-${transfer.priority.toLowerCase()}`}>
                        {transfer.priority}
                    </div>
                </div>
            </div>

            <div className="details-grid">
                <div className="details-main">
                    <div className="detail-card">
                        <h3 className="card-title">📍 Transfer Route</h3>
                        <div className="route-display">
                            <div className="route-point">
                                <div className="route-marker origin"></div>
                                <div className="route-info">
                                    <span className="route-label">ORIGIN</span>
                                    <span className="route-branch">{transfer.originBranchName}</span>
                                    <span className="route-dept">{transfer.originDepartmentName || 'Main Branch'}</span>
                                </div>
                            </div>
                            <div className="route-connector"><div className="connector-line"></div></div>
                            <div className="route-point">
                                <div className="route-marker destination"></div>
                                <div className="route-info">
                                    <span className="route-label">DESTINATION</span>
                                    <span className="route-branch">{transfer.destinationBranchName}</span>
                                    <span className="route-dept">{transfer.destinationDepartmentName || 'General Dept'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-card">
                        <h3 className="card-title">📋 Classification</h3>
                        <div className="classification-grid">
                            <div className="classification-item">
                                <span className="cl-label">Category</span>
                                <span className="cl-value">{transfer.categoryName?.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="classification-item">
                                <span className="cl-label">Sensitivity</span>
                                <span className={`sensitivity-badge sensitivity-${transfer.sensitivityLevel?.toLowerCase()}`}>
                                    {transfer.sensitivityLevel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {transfer.description && (
                        <div className="detail-card">
                            <h3 className="card-title">📝 Description</h3>
                            <p className="description-text">{transfer.description}</p>
                        </div>
                    )}
                </div>

                <div className="details-sidebar">
                    <div className="detail-card action-card">
                        <h3 className="card-title">⚡ Actions</h3>
                        <div className="action-buttons">
                            {canApproveInternal() && (
                                <button className="action-btn action-approve" onClick={handleApproveInternal} disabled={actionLoading}>
                                    {actionLoading ? '...' : '✅ Approve Internally'}
                                </button>
                            )}
                            {canAcceptAndAssign() && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <select 
                                        value={selectedDeliveryPersonId} 
                                        onChange={(e) => setSelectedDeliveryPersonId(e.target.value)}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    >
                                        <option value="">Select Delivery Driver...</option>
                                        {availableDeliveryPersons.map(p => (
                                            <option key={p.userId} value={p.userId}>{p.fullName}</option>
                                        ))}
                                    </select>
                                    <button className="action-btn action-approve" onClick={handleAcceptAndAssign} disabled={actionLoading || !selectedDeliveryPersonId}>
                                        Accept & Assign Driver
                                    </button>
                                </div>
                            )}
                            {canRelease() && (
                                <button className="action-btn action-verify-dest" onClick={handleRelease} disabled={actionLoading}>
                                    🟢 Final Green Light (Release)
                                </button>
                            )}
                            {canPickup() && (
                                <button className="action-btn action-verify-origin" onClick={handlePickup} disabled={actionLoading}>
                                    📦 Confirm Pickup
                                </button>
                            )}
                            {canDeliver() && (
                                <button className="action-btn action-verify-dest" onClick={handleDeliver} disabled={actionLoading}>
                                    📍 Confirm Delivery
                                </button>
                            )}
                            {canClose() && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <textarea 
                                        value={finalNote}
                                        onChange={(e) => setFinalNote(e.target.value)}
                                        placeholder="Final remarks (required for rejection)"
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="action-btn action-confirmed" onClick={() => handleClose(true)} disabled={actionLoading} style={{ flex: 1, background: '#38a169' }}>
                                            ✅ Accept
                                        </button>
                                        <button className="action-btn action-rejected" onClick={() => handleClose(false)} disabled={actionLoading} style={{ flex: 1, background: '#e53e3e' }}>
                                            ❌ Reject
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!canApproveInternal() && !canAcceptAndAssign() && !canRelease() && !canPickup() && !canDeliver() && transfer.status !== 'DELIVERED' && (
                                <p style={{ fontSize: '13px', color: '#718096', textAlign: 'center' }}>No actions available for your role at this stage.</p>
                            )}
                        </div>
                    </div>

                    <div className="detail-card">
                        <h3 className="card-title">🗓️ Timeline</h3>
                        <div className="timeline-list">
                            <div className="timeline-item"><div className="timeline-dot active"></div><div className="timeline-content"><span className="timeline-label">Requested</span><span className="timeline-date">{formatDate(transfer.requestedAt)}</span></div></div>
                            {transfer.pickedUpAt && <div className="timeline-item"><div className="timeline-dot active"></div><div className="timeline-content"><span className="timeline-label">Picked Up</span><span className="timeline-date">{formatDate(transfer.pickedUpAt)}</span></div></div>}
                            {transfer.deliveredAt && <div className="timeline-item"><div className="timeline-dot active"></div><div className="timeline-content"><span className="timeline-label">Delivered</span><span className="timeline-date">{formatDate(transfer.deliveredAt)}</span></div></div>}
                            {transfer.closedAt && <div className="timeline-item"><div className="timeline-dot completed"></div><div className="timeline-content"><span className="timeline-label">Closed</span><span className="timeline-date">{formatDate(transfer.closedAt)}</span></div></div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferDetails;
