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
    // HQ Approval
    hqApproverId: number | null;
    hqApproverFullName: string | null;
    hqApprovedAt: string | null;
    hqRejectionNote: string | null;
    auditLogs?: AuditLogResponse[];
}

interface AuditLogResponse {
    auditId: number;
    action: string;
    fromStatus: string | null;
    toStatus: string | null;
    remarks: string | null;
    actedAt: string;
    ipAddress: string | null;
    actorUserId: number | null;
    actorFullName: string | null;
    actorEmployeeId: string | null;
    actorRoleName: string | null;
    actorBranchName: string | null;
    actorDepartmentName: string | null;
}

const formatActionDescription = (action: string): string => {
    switch (action.toUpperCase()) {
        case 'CREATED':
            return 'Initiated the transfer request';
        case 'APPROVED_INTERNAL':
            return 'Approved the request internally at origin branch';
        case 'HQ_APPROVED':
            return 'Verified and approved the request at Central HQ';
        case 'HQ_REJECTED':
            return 'Rejected the request at Central HQ';
        case 'ASSIGNED_DRIVER':
            return 'Accepted request and assigned the delivery driver';
        case 'RELEASED':
            return 'Released the transfer request (Green Light)';
        case 'PICKED_UP':
            return 'Picked up the items (Transit Started)';
        case 'DELIVERED':
            return 'Delivered the items to destination branch';
        case 'COMPLETED':
            return 'Confirmed receipt and completed the request';
        case 'REJECTED':
            return 'Rejected the items upon receipt';
        default:
            return action.replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, c => c.toUpperCase());
    }
};

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
    const [hqRejectionNote, setHqRejectionNote] = useState('');
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const triggerActionWithConfirm = (message: string, onConfirm: () => Promise<void> | void) => {
        setConfirmModal({
            isOpen: true,
            message,
            onConfirm: async () => {
                setConfirmModal(null);
                await onConfirm();
            }
        });
    };

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
    const handleApproveInternal = () => {
        triggerActionWithConfirm('Approve this request internally for your branch?', async () => {
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
        });
    };

    // Step 2: Accept and Assign
    const handleAcceptAndAssign = () => {
        if (!selectedDeliveryPersonId) {
            setError('Please select a delivery person.');
            return;
        }
        triggerActionWithConfirm('Accept this request and assign the selected driver?', async () => {
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
        });
    };

    // Step 3: Final Release
    const handleRelease = () => {
        triggerActionWithConfirm('Give final green light for this transfer?', async () => {
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
        });
    };

    // Step 4: Pickup
    const handlePickup = () => {
        triggerActionWithConfirm('Confirm pickup of items?', async () => {
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
        });
    };

    // Step 5: Deliver
    const handleDeliver = () => {
        triggerActionWithConfirm('Confirm delivery at destination?', async () => {
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
        });
    };

    // Step 6: Close (Accept/Reject)
    const handleClose = (accepted: boolean) => {
        if (!finalNote && !accepted) {
            setError('Please provide a reason for rejection.');
            return;
        }
        const actionText = accepted ? 'Complete' : 'Reject';
        triggerActionWithConfirm(`Are you sure you want to ${actionText} this transfer?`, async () => {
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
        });
    };

    // HQ Step: Verify or Reject
    const handleHqVerify = (approved: boolean) => {
        if (!approved && !hqRejectionNote.trim()) {
            setError('A rejection note is required when rejecting a transfer.');
            return;
        }
        const actionText = approved ? 'forward to destination branch' : 'reject';
        triggerActionWithConfirm(`Are you sure you want to ${actionText} this transfer?`, async () => {
            setActionLoading(true); setActionSuccess(''); setError('');
            try {
                await api.post(`/transfers/${id}/hq-verify`, {
                    approved,
                    rejectionNote: hqRejectionNote || null,
                });
                setActionSuccess(approved
                    ? '✅ Transfer verified and forwarded to destination branch!'
                    : '❌ Transfer rejected. The requester has been notified.'
                );
                fetchTransferDetails();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Action failed.');
            } finally {
                setActionLoading(false);
            }
        });
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
            'PENDING_INTERNAL':       { class: 'status-pending',   icon: '⏳' },
            'PENDING_HQ_APPROVAL':    { class: 'status-hq',        icon: '🏛️' },
            'PENDING_ASSIGNMENT':     { class: 'status-pending',   icon: '🤝' },
            'PENDING_FINAL_RELEASE':  { class: 'status-approved',  icon: '🚦' },
            'READY_FOR_PICKUP':       { class: 'status-approved',  icon: '📦' },
            'IN_TRANSIT':             { class: 'status-transit',   icon: '🚚' },
            'DELIVERED':              { class: 'status-received',  icon: '📍' },
            'COMPLETED':              { class: 'status-confirmed', icon: '✔️' },
            'REJECTED_BY_HQ':         { class: 'status-rejected',  icon: '🏛️❌' },
            'REJECTED_ON_RECEIPT':    { class: 'status-rejected',  icon: '❌' },
            'CANCELLED':              { class: 'status-cancelled', icon: '🚫' },
        };
        return configs[status] || { class: 'status-draft', icon: '📄' };
    };

    // Role-based logic
    const isManager = user?.role === 'BRANCH_MANAGER' || user?.role === 'OPERATION_MANAGER' || user?.role === 'FIRST_EXECUTIVE_OFFICER';
    const isHqOfficer = user?.role === 'HQ_LOGISTICS_OFFICER';
    
    const canApproveInternal = () => {
        return transfer?.status === 'PENDING_INTERNAL' && isManager && user?.branchId === transfer?.originBranchId;
    };

    const canHqVerify = () => {
        return transfer?.status === 'PENDING_HQ_APPROVAL' && isHqOfficer;
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
                                <div className="action-driver-group">
                                    <select
                                        className="action-select"
                                        value={selectedDeliveryPersonId}
                                        onChange={(e) => setSelectedDeliveryPersonId(e.target.value)}
                                    >
                                        <option value="">Select Delivery Driver...</option>
                                        {availableDeliveryPersons.map(p => (
                                            <option key={p.userId} value={p.userId}>{p.fullName}</option>
                                        ))}
                                    </select>
                                    <button className="action-btn action-approve" onClick={handleAcceptAndAssign} disabled={actionLoading || !selectedDeliveryPersonId}>
                                        Accept &amp; Assign Driver
                                    </button>
                                </div>
                            )}
                            {canHqVerify() && (
                                <div className="action-close-group">
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        🏛️ <strong>HQ Review</strong> — Verify this transfer to forward it to the destination branch, or reject it with a mandatory explanation.
                                    </p>
                                    <textarea
                                        className="action-textarea"
                                        value={hqRejectionNote}
                                        onChange={(e) => setHqRejectionNote(e.target.value)}
                                        placeholder="Rejection reason (required if rejecting)"
                                    />
                                    <div className="action-close-buttons">
                                        <button className="action-btn action-confirmed" onClick={() => handleHqVerify(true)} disabled={actionLoading}>
                                            ✅ Verify & Forward
                                        </button>
                                        <button className="action-btn action-rejected" onClick={() => handleHqVerify(false)} disabled={actionLoading || !hqRejectionNote.trim()}>
                                            ❌ Reject Transfer
                                        </button>
                                    </div>
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
                                <div className="action-close-group">
                                    <textarea
                                        className="action-textarea"
                                        value={finalNote}
                                        onChange={(e) => setFinalNote(e.target.value)}
                                        placeholder="Final remarks (required for rejection)"
                                    />
                                    <div className="action-close-buttons">
                                        <button className="action-btn action-confirmed" onClick={() => handleClose(true)} disabled={actionLoading}>
                                            ✅ Accept
                                        </button>
                                        <button className="action-btn action-rejected" onClick={() => handleClose(false)} disabled={actionLoading}>
                                            ❌ Reject
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!canApproveInternal() && !canHqVerify() && !canAcceptAndAssign() && !canRelease() && !canPickup() && !canDeliver() && transfer.status !== 'DELIVERED' && (
                                <p className="action-no-action">No actions available for your role at this stage.</p>
                            )}
                        </div>
                    </div>

                    <div className="detail-card">
                        <h3 className="card-title">🗓️ Timeline</h3>
                        <div className="timeline-list">
                            <div className="timeline-item"><div className="timeline-dot active"></div><div className="timeline-content"><span className="timeline-label">Requested</span><span className="timeline-date">{formatDate(transfer.requestedAt)}</span></div></div>
                            {transfer.hqApprovedAt && <div className="timeline-item"><div className={`timeline-dot ${transfer.status === 'REJECTED_BY_HQ' ? 'rejected' : 'active'}`}></div><div className="timeline-content"><span className="timeline-label">{transfer.status === 'REJECTED_BY_HQ' ? 'HQ Rejected' : 'HQ Approved'}</span><span className="timeline-date">{formatDate(transfer.hqApprovedAt)}</span></div></div>}
                            {transfer.pickedUpAt && <div className="timeline-item"><div className="timeline-dot active"></div><div className="timeline-content"><span className="timeline-label">Picked Up</span><span className="timeline-date">{formatDate(transfer.pickedUpAt)}</span></div></div>}
                            {transfer.deliveredAt && <div className="timeline-item"><div className="timeline-dot active"></div><div className="timeline-content"><span className="timeline-label">Delivered</span><span className="timeline-date">{formatDate(transfer.deliveredAt)}</span></div></div>}
                            {transfer.closedAt && <div className="timeline-item"><div className="timeline-dot completed"></div><div className="timeline-content"><span className="timeline-label">Closed</span><span className="timeline-date">{formatDate(transfer.closedAt)}</span></div></div>}
                        </div>
                    </div>

                    {transfer.hqRejectionNote && (
                        <div className="detail-card" style={{ borderLeft: '3px solid #ef4444' }}>
                            <h3 className="card-title">🏛️ HQ Rejection Reason</h3>
                            <p style={{ color: '#ef4444', fontStyle: 'italic', margin: 0 }}>{transfer.hqRejectionNote}</p>
                            {transfer.hqApproverFullName && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Reviewed by: <strong>{transfer.hqApproverFullName}</strong>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {transfer.auditLogs && transfer.auditLogs.length > 0 && (
                    <div className="detail-card admin-audit-card">
                        <h3 className="card-title">🏛️ Full System Audit & Lifecycle Trail</h3>
                        <div className="audit-table-wrapper">
                            <table className="audit-table">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>Performer Details</th>
                                        <th>Action Taken</th>
                                        <th>Date &amp; Time</th>
                                        <th>Remarks &amp; IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transfer.auditLogs.map((log) => (
                                        <tr key={log.auditId} className="audit-row">
                                            <td className="audit-cell-action">
                                                <span className={`audit-badge badge-${log.action.toLowerCase()}`}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="audit-cell-actor">
                                                <div className="actor-name">{log.actorFullName || 'System Event'}</div>
                                                <div className="actor-meta">
                                                    <span className="actor-emp">ID: {log.actorEmployeeId || 'N/A'}</span>
                                                    <span className="meta-bullet">•</span>
                                                    <span className="actor-role">{log.actorRoleName?.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div className="actor-dept-branch">
                                                    {log.actorBranchName && <span className="actor-branch">🏦 {log.actorBranchName}</span>}
                                                    {log.actorDepartmentName && <span className="actor-dept"> 📁 {log.actorDepartmentName}</span>}
                                                </div>
                                            </td>
                                            <td className="audit-cell-action-taken">
                                                <span className="action-description-text">
                                                    {formatActionDescription(log.action)}
                                                </span>
                                            </td>
                                            <td className="audit-cell-time">
                                                <div className="acted-time">{formatDate(log.actedAt)}</div>
                                            </td>
                                            <td className="audit-cell-remarks">
                                                {log.remarks && <div className="audit-remarks">💬 "{log.remarks}"</div>}
                                                <div className="audit-ip">🖥️ {log.ipAddress || '127.0.0.1'}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {confirmModal?.isOpen && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-container">
                        <div className="custom-modal-icon">⚠️</div>
                        <h3 className="custom-modal-title">Confirm Action</h3>
                        <p className="custom-modal-message">{confirmModal.message}</p>
                        <div className="custom-modal-actions">
                            <button className="btn-modal-cancel" onClick={() => setConfirmModal(null)}>
                                Cancel
                            </button>
                            <button className="btn-modal-confirm" onClick={confirmModal.onConfirm}>
                                Yes, Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransferDetails;
