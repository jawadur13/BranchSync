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
    // Cash Bundle
    requestedAmount: number | null;
    denominationsSubmitted: boolean | null;
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
    const [internalRejectionNote, setInternalRejectionNote] = useState('');
    const [destDeclineNote, setDestDeclineNote] = useState('');
    const [releaseDeclineNote, setReleaseDeclineNote] = useState('');

    // Cash tracking state
    const DENOMINATION_TYPES = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
    const [denomQtys, setDenomQtys] = useState<Record<number, number>>({});
    const [denomLoading, setDenomLoading] = useState(false);
    const [existingDenoms, setExistingDenoms] = useState<any[]>([]);
    const [branchBalances, setBranchBalances] = useState<Record<number, number>>({});
    const [destBranchBalance, setDestBranchBalance] = useState<number | null>(null);
    
    // HQ Destination Assignment states
    const [branches, setBranches] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState('');

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

    useEffect(() => {
        if (user?.role === 'HQ_LOGISTICS_OFFICER') {
            fetchHqLookupData();
        }
    }, [user]);

    useEffect(() => {
        if (selectedBranchId) {
            fetchDepartmentsForBranch(selectedBranchId);
        } else {
            setDepartments([]);
            setSelectedDeptId('');
        }
    }, [selectedBranchId]);

    const fetchHqLookupData = async () => {
        try {
            const branchRes = await api.get('/lookup/branches');
            setBranches(branchRes.data);
            // Also fetch all cash balances for HQ routing
            try {
                const balRes = await api.get('/cash/balances');
                const balMap: Record<number, number> = {};
                balRes.data.forEach((b: any) => { balMap[b.branchId] = b.currentBalance; });
                setBranchBalances(balMap);
            } catch { /* ignore */ }
        } catch (err) {
            console.error('Failed to load HQ lookup data', err);
        }
    };

    const fetchDepartmentsForBranch = async (branchId: string) => {
        try {
            const res = await api.get(`/lookup/branches/${branchId}/departments`);
            setDepartments(res.data);
            setSelectedDeptId(''); // Reset selected department on branch change
        } catch (err) {
            console.error('Failed to load departments for branch', err);
        }
    };

    const fetchTransferDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/transfers/${id}`);
            setTransfer(response.data);

            // If in Step 2, fetch available delivery persons
            if (response.data.status === 'PENDING_ASSIGNMENT') {
                const delRes = await api.get('/lookup/users/delivery-persons/available');
                setAvailableDeliveryPersons(delRes.data);
                // Fetch denominations already submitted (if any)
                try {
                    const denomRes = await api.get(`/cash/denominations/${response.data.requestId}`);
                    setExistingDenoms(denomRes.data);
                } catch { /* none yet */ }
                // Fetch destination branch balance for Cash Bundle
                if (response.data.categoryName?.toLowerCase().includes('cash bundle') &&
                    response.data.destinationBranchId) {
                    try {
                        const balRes = await api.get(`/cash/balance/${response.data.destinationBranchId}`);
                        setDestBranchBalance(balRes.data.currentBalance);
                    } catch { /* ignore */ }
                }
            }
            // If user is HQ officer and status is PENDING_HQ_APPROVAL, also load Cash Bundle denominations display
            if (response.data.categoryName?.toLowerCase().includes('cash bundle') &&
                response.data.requestId) {
                try {
                    const denomRes = await api.get(`/cash/denominations/${response.data.requestId}`);
                    setExistingDenoms(denomRes.data);
                } catch { /* ignore */ }
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

    const handleRejectInternal = () => {
        if (!internalRejectionNote.trim()) {
            setError('Please provide a rejection reason.');
            return;
        }
        triggerActionWithConfirm('Reject this request internally?', async () => {
            setActionLoading(true); setActionSuccess(''); setError('');
            try {
                await api.post(`/transfers/${id}/reject-internal`, { rejectionNote: internalRejectionNote });
                setActionSuccess('Request internally rejected.');
                setInternalRejectionNote('');
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
        const isCashBundle = transfer?.categoryName?.toLowerCase().includes('cash bundle');
        // Cash Bundle: denominations must be submitted first
        if (isCashBundle && !transfer?.denominationsSubmitted) {
            setError('Please submit the denomination breakdown before accepting.');
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

    const handleSubmitDenominations = async () => {
        const entries = DENOMINATION_TYPES
            .map(d => ({ denomination: d, quantity: denomQtys[d] || 0 }))
            .filter(e => e.quantity > 0);
        if (entries.length === 0) {
            setError('Please enter at least one denomination quantity.');
            return;
        }
        setDenomLoading(true); setError('');
        try {
            const res = await api.post(`/cash/denominations/${id}`, { denominations: entries });
            setExistingDenoms(res.data);
            setActionSuccess('Denomination breakdown saved!');
            fetchTransferDetails(); // refresh denominationsSubmitted flag
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save denominations.');
        } finally {
            setDenomLoading(false);
        }
    };

    const handleRejectDestination = () => {
        if (!destDeclineNote.trim()) {
            setError('Please provide decline feedback.');
            return;
        }
        triggerActionWithConfirm('Decline routing and return this transfer to Central HQ?', async () => {
            setActionLoading(true); setActionSuccess(''); setError('');
            try {
                await api.post(`/transfers/${id}/reject-destination`, { rejectionNote: destDeclineNote });
                setActionSuccess('Returned to Central HQ for routing review.');
                setDestDeclineNote('');
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

    const handleRejectRelease = () => {
        if (!releaseDeclineNote.trim()) {
            setError('Please provide decline reason.');
            return;
        }
        triggerActionWithConfirm('Decline release and return this transfer to Central HQ?', async () => {
            setActionLoading(true); setActionSuccess(''); setError('');
            try {
                await api.post(`/transfers/${id}/reject-release`, { rejectionNote: releaseDeclineNote });
                setActionSuccess('Returned to Central HQ for routing review.');
                setReleaseDeclineNote('');
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
        if (approved && !selectedBranchId) {
            setError('Please select a destination branch.');
            return;
        }
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
                    destinationBranchId: approved ? Number(selectedBranchId) : null,
                    destinationDepartmentId: approved && selectedDeptId ? Number(selectedDeptId) : null,
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

    const handlePrintDetails = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow || !transfer) return;

        const auditTrailRows = (transfer.auditLogs || []).map((log, idx) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${log.action.replace(/_/g, ' ')}</strong></td>
                <td>${log.actorFullName || 'System Event'} (${log.actorRoleName?.replace(/_/g, ' ') || 'N/A'})</td>
                <td>${formatActionDescription(log.action)}</td>
                <td>${formatDate(log.actedAt)}</td>
                <td>${log.remarks ? `"${log.remarks}"` : '—'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Transfer Slip - ${transfer.requestCode}</title>
                    <style>
                        body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; max-width: 900px; margin: 0 auto; }
                        .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 26px; color: #003366; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
                        .sub { font-size: 13px; color: #64748b; margin-top: 5px; font-weight: 500; }
                        .status-pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
                        .priority-pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; margin-left: 6px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; }
                        .grid-item { font-size: 13px; line-height: 1.6; color: #334155; }
                        .grid-item strong { color: #0f172a; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th, td { border: 1px solid #cbd5e1; padding: 10px 8px; text-align: left; }
                        th { background-color: #f1f5f9; color: #0f172a; font-weight: 600; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        @media print { body { padding: 0; max-width: 100%; } }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <div>
                            <div class="title">JAMUNA BANK PLC</div>
                            <div class="sub">Official Inter-Branch Transfer Request Slip</div>
                        </div>
                        <div style="text-align: right; line-height: 1.6;">
                            <div>
                                <span class="status-pill">${transfer.status}</span>
                                <span class="priority-pill">${transfer.priority}</span>
                            </div>
                            <div style="font-size: 13px; font-weight: bold; color: #003366; margin-top: 8px;">CODE: ${transfer.requestCode}</div>
                        </div>
                    </div>
                    
                    <div class="grid">
                        <div class="grid-item">
                            <strong>Transfer Title:</strong> ${transfer.title}<br/>
                            <strong>Category:</strong> ${transfer.categoryName || 'General'}<br/>
                            <strong>Sensitivity:</strong> ${transfer.sensitivityLevel || 'Normal'}<br/>
                            <strong>Requested By:</strong> ${transfer.initiatedByFullName} (ID: ${transfer.initiatedByEmployeeId})<br/>
                            <strong>Date Requested:</strong> ${formatDate(transfer.requestedAt)}
                        </div>
                        <div class="grid-item">
                            <strong>Origin Branch:</strong> ${transfer.originBranchName} (${transfer.originDepartmentName || 'Main Department'})<br/>
                            <strong>Destination Branch:</strong> ${transfer.destinationBranchName || 'Awaiting HQ Allocation'} (${transfer.destinationDepartmentName || 'Pending Central Routing'})<br/>
                            ${transfer.deliveryPersonFullName ? `<strong>Assigned Courier:</strong> ${transfer.deliveryPersonFullName}<br/>` : ''}
                            ${transfer.closedAt ? `<strong>Date Completed:</strong> ${formatDate(transfer.closedAt)}<br/>` : ''}
                        </div>
                    </div>

                    ${transfer.description ? `
                    <div style="margin-bottom: 30px; font-size: 13px; color: #334155; line-height: 1.5; background: #ffffff; padding: 15px; border: 1px solid #cbd5e1; border-radius: 8px;">
                        <strong style="color: #0f172a; display: block; margin-bottom: 5px;">📝 Item Description:</strong>
                        ${transfer.description}
                    </div>
                    ` : ''}

                    ${transfer.categoryName?.toLowerCase().includes('cash bundle') && existingDenoms.length > 0 ? `
                    <h3 style="color: #0f172a; font-size: 16px; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-bottom: 12px; margin-top: 30px;">💰 Cash Bundle — Denomination Breakdown</h3>
                    <div style="margin-bottom: 6px; font-size: 13px; color: #92400e; font-weight: 600;">
                        Requested Amount: ৳${Number(transfer.requestedAmount).toLocaleString('en-BD')}
                    </div>
                    <table style="width: 300px;">
                        <thead>
                            <tr>
                                <th>Denomination</th>
                                <th style="text-align: right;">Quantity</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${existingDenoms.map(d => `
                            <tr>
                                <td>৳${d.denomination}</td>
                                <td style="text-align: right;">${d.quantity}</td>
                                <td style="text-align: right; font-weight: 600;">৳${Number(d.subtotal).toLocaleString('en-BD')}</td>
                            </tr>`).join('')}
                            <tr style="background: #fef3c7; font-weight: 700;">
                                <td colspan="2">Total</td>
                                <td style="text-align: right;">৳${existingDenoms.reduce((s: number, d: any) => s + Number(d.subtotal), 0).toLocaleString('en-BD')}</td>
                            </tr>
                        </tbody>
                    </table>
                    ` : ''}

                    <h3 style="color: #0f172a; font-size: 16px; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px; margin-top: 30px;">🏛️ Complete Action Lifecycle & Audit Trail</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px; text-align: center;">#</th>
                                <th>Action</th>
                                <th>Performer</th>
                                <th>Action Description</th>
                                <th>Date & Time</th>
                                <th>Comments / Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${auditTrailRows || `<tr><td colspan="6" style="text-align: center;">No audit logs available for this transfer.</td></tr>`}
                        </tbody>
                    </table>

                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
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
            'REJECTED_BY_MANAGER':    { class: 'status-rejected',  icon: '❌' },
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

    const handleDuplicate = () => {
        if (!transfer) return;
        navigate('/transfers/new', {
            state: {
                title: transfer.title,
                description: transfer.description || '',
                categoryName: transfer.categoryName,
                priority: transfer.priority,
                destinationBranchId: transfer.destinationBranchId,
                destinationDepartmentId: transfer.destinationDepartmentId,
            }
        });
    };

    const canDuplicate = user?.role !== 'HQ_LOGISTICS_OFFICER' && user?.role !== 'DELIVERY_PERSON';

    return (
        <div className="transfer-details-container">
            <div className="details-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn-ghost" onClick={() => navigate('/')}>← Back</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {canDuplicate && (
                        <button className="hist-action-btn print-btn" onClick={handleDuplicate} title="Create a new transfer with these details" style={{ backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', boxShadow: 'none' }}>
                            📋 Duplicate Request
                        </button>
                    )}
                    <button className="hist-action-btn print-btn" onClick={handlePrintDetails} title="Print Transfer Slip or save as PDF" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🖨️ Print Slip / Save PDF
                    </button>
                </div>
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
                                    {transfer.destinationBranchName ? (
                                        <>
                                            <span className="route-branch">{transfer.destinationBranchName}</span>
                                            <span className="route-dept">{transfer.destinationDepartmentName || 'General Dept'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="route-branch" style={{ color: '#64748b', fontStyle: 'italic', fontWeight: 'normal' }}>Awaiting HQ Allocation</span>
                                            <span className="route-dept">Pending central routing</span>
                                        </>
                                    )}
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

                    {/* Cash Bundle Info */}
                    {transfer.categoryName?.toLowerCase().includes('cash bundle') && (
                        <div className="detail-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                            <h3 className="card-title">💰 Cash Bundle Details</h3>
                            <div className="classification-grid">
                                <div className="classification-item">
                                    <span className="cl-label">Requested Amount</span>
                                    <span className="cl-value" style={{ fontWeight: '700', fontSize: '1.05rem', color: '#92400e' }}>
                                        {transfer.requestedAmount ? `৳${Number(transfer.requestedAmount).toLocaleString('en-BD')}` : '—'}
                                    </span>
                                </div>
                                <div className="classification-item">
                                    <span className="cl-label">Denominations</span>
                                    <span className="cl-value">{transfer.denominationsSubmitted ? '✅ Submitted' : '⏳ Pending'}</span>
                                </div>
                            </div>
                            {existingDenoms.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                        <thead>
                                            <tr style={{ background: '#fef3c7' }}>
                                                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #f59e0b' }}>Denomination</th>
                                                <th style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f59e0b' }}>Qty</th>
                                                <th style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f59e0b' }}>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {existingDenoms.map((d: any) => (
                                                <tr key={d.denominationId} style={{ borderBottom: '1px solid #fde68a' }}>
                                                    <td style={{ padding: '5px 8px' }}>৳{d.denomination}</td>
                                                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{d.quantity}</td>
                                                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '600' }}>৳{Number(d.subtotal).toLocaleString('en-BD')}</td>
                                                </tr>
                                            ))}
                                            <tr style={{ background: '#fef3c7', fontWeight: '700' }}>
                                                <td style={{ padding: '6px 8px' }} colSpan={2}>Total</td>
                                                <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                                                    ৳{existingDenoms.reduce((s: number, d: any) => s + Number(d.subtotal), 0).toLocaleString('en-BD')}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="details-sidebar">
                    <div className="detail-card action-card">
                        <h3 className="card-title">⚡ Actions</h3>
                        <div className="action-buttons">
                            {canApproveInternal() && (
                                <div className="action-driver-group">
                                    <textarea
                                        className="action-textarea"
                                        value={internalRejectionNote}
                                        onChange={(e) => setInternalRejectionNote(e.target.value)}
                                        placeholder="Reason for rejection (mandatory if rejecting)"
                                    />
                                    <div className="action-close-buttons">
                                        <button className="action-btn action-approve" onClick={handleApproveInternal} disabled={actionLoading}>
                                            ✅ Approve Internally
                                        </button>
                                        <button className="action-btn action-rejected" onClick={handleRejectInternal} disabled={actionLoading || !internalRejectionNote.trim()}>
                                            ❌ Reject Request
                                        </button>
                                    </div>
                                </div>
                            )}
                            {canAcceptAndAssign() && (
                                <div className="action-driver-group">
                                    <h4 className="action-subtitle" style={{ fontSize: '0.88rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>🚚 Accept &amp; Assign Courier</h4>

                                    {/* Cash Bundle Denomination Form */}
                                    {transfer.categoryName?.toLowerCase().includes('cash bundle') && (
                                        <div style={{ marginBottom: '1rem', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px', color: '#92400e' }}>
                                                💰 Cash Bundle — Denomination Breakdown Required
                                            </div>
                                            {transfer.requestedAmount && (
                                                <div style={{ fontSize: '0.82rem', color: '#78350f', marginBottom: '8px' }}>
                                                    Requested Amount: <strong>৳{Number(transfer.requestedAmount).toLocaleString('en-BD')}</strong>
                                                </div>
                                            )}
                                            {destBranchBalance !== null && (
                                                <div style={{ fontSize: '0.82rem', marginBottom: '10px', color: destBranchBalance < (transfer.requestedAmount || 0) ? '#dc2626' : '#15803d', fontWeight: '600' }}>
                                                    {destBranchBalance < (transfer.requestedAmount || 0)
                                                        ? `⛔ Insufficient balance: ৳${destBranchBalance.toLocaleString('en-BD')} available. Add cash balance before accepting.`
                                                        : `✅ Available balance: ৳${destBranchBalance.toLocaleString('en-BD')}`
                                                    }
                                                </div>
                                            )}
                                            {DENOMINATION_TYPES.map(denom => (
                                                <div key={denom} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span style={{ width: '60px', fontSize: '0.82rem', color: '#374151', fontWeight: '600' }}>৳{denom}</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={denomQtys[denom] || ''}
                                                        onChange={e => setDenomQtys(prev => ({ ...prev, [denom]: parseInt(e.target.value) || 0 }))}
                                                        style={{ width: '70px', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.82rem' }}
                                                    />
                                                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                                        = ৳{((denomQtys[denom] || 0) * denom).toLocaleString('en-BD')}
                                                    </span>
                                                </div>
                                            ))}
                                            <div style={{ borderTop: '1px solid #f59e0b', paddingTop: '8px', marginTop: '6px', fontSize: '0.85rem', fontWeight: '700', color: '#92400e' }}>
                                                Total: ৳{DENOMINATION_TYPES.reduce((sum, d) => sum + (denomQtys[d] || 0) * d, 0).toLocaleString('en-BD')}
                                                {transfer.requestedAmount && DENOMINATION_TYPES.reduce((sum, d) => sum + (denomQtys[d] || 0) * d, 0) !== transfer.requestedAmount && (
                                                    <span style={{ color: '#dc2626', marginLeft: '8px', fontWeight: '600' }}>⚠ Must equal ৳{Number(transfer.requestedAmount).toLocaleString('en-BD')}</span>
                                                )}
                                            </div>
                                            <button
                                                className="action-btn action-approve"
                                                style={{ marginTop: '10px', width: '100%' }}
                                                onClick={handleSubmitDenominations}
                                                disabled={denomLoading}
                                            >
                                                {denomLoading ? 'Saving...' : (transfer.denominationsSubmitted ? '✅ Update Denomination Breakdown' : '💾 Save Denomination Breakdown')}
                                            </button>
                                            {transfer.denominationsSubmitted && (
                                                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#15803d', fontWeight: '600' }}>✅ Denominations saved — you can now Accept.</div>
                                            )}
                                        </div>
                                    )}

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
                                    <textarea
                                        className="action-textarea"
                                        value={destDeclineNote}
                                        onChange={(e) => setDestDeclineNote(e.target.value)}
                                        placeholder="Decline feedback (mandatory if returning to HQ)"
                                        style={{ marginTop: '0.5rem' }}
                                    />
                                    <div className="action-close-buttons" style={{ marginTop: '0.5rem' }}>
                                        <button className="action-btn action-approve" onClick={handleAcceptAndAssign} disabled={actionLoading || !selectedDeliveryPersonId || (transfer.categoryName?.toLowerCase().includes('cash bundle') && !transfer.denominationsSubmitted)}>
                                            ✅ Accept &amp; Assign
                                        </button>
                                        <button className="action-btn action-rejected" onClick={handleRejectDestination} disabled={actionLoading || !destDeclineNote.trim()}>
                                            ❌ Return to HQ
                                        </button>
                                    </div>
                                </div>
                            )}
                            {canHqVerify() && (
                                <div className="action-close-group">
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        🏛️ <strong>HQ Review & Allocation</strong> — Select a destination branch and department to verify and forward, or reject with a mandatory explanation.
                                    </p>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                Destination Branch <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                className="action-select"
                                                value={selectedBranchId}
                                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            >
                                                <option value="">Select Destination Branch...</option>
                                                 {branches
                                                    .filter(b => b.id !== transfer.originBranchId)
                                                    .map(b => {
                                                        const isCashBundleReq = transfer.categoryName?.toLowerCase().includes('cash bundle');
                                                        const bal = branchBalances[b.id];
                                                        const hasEnough = !isCashBundleReq || bal === undefined || bal >= (transfer.requestedAmount || 0);
                                                        return (
                                                            <option key={b.id} value={b.id}>
                                                                {b.name} ({b.code}){isCashBundleReq && bal !== undefined ? ` — ৳${bal.toLocaleString('en-BD')}${!hasEnough ? ' ⚠️ LOW' : ''}` : ''}
                                                            </option>
                                                        );
                                                    })
                                                }
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                Target Department (Optional)
                                            </label>
                                            <select
                                                className="action-select"
                                                value={selectedDeptId}
                                                onChange={(e) => setSelectedDeptId(e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            >
                                                <option value="">Select Target Department...</option>
                                                {departments.map(d => (
                                                    <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <textarea
                                        className="action-textarea"
                                        value={hqRejectionNote}
                                        onChange={(e) => setHqRejectionNote(e.target.value)}
                                        placeholder="Rejection reason (required if rejecting)"
                                    />
                                    <div className="action-close-buttons">
                                        <button className="action-btn action-confirmed" onClick={() => handleHqVerify(true)} disabled={actionLoading || !selectedBranchId}>
                                            ✅ Verify & Forward
                                        </button>
                                        <button className="action-btn action-rejected" onClick={() => handleHqVerify(false)} disabled={actionLoading || !hqRejectionNote.trim()}>
                                            ❌ Reject Transfer
                                        </button>
                                    </div>
                                </div>
                            )}
                            {canRelease() && (
                                <div className="action-driver-group">
                                    <h4 className="action-subtitle" style={{ fontSize: '0.88rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>🟢 Final Green Light &amp; Release</h4>
                                    <textarea
                                        className="action-textarea"
                                        value={releaseDeclineNote}
                                        onChange={(e) => setReleaseDeclineNote(e.target.value)}
                                        placeholder="Decline reason (mandatory if returning to HQ)"
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    <div className="action-close-buttons">
                                        <button className="action-btn action-approve" onClick={handleRelease} disabled={actionLoading}>
                                            🟢 Final Release
                                        </button>
                                        <button className="action-btn action-rejected" onClick={handleRejectRelease} disabled={actionLoading || !releaseDeclineNote.trim()}>
                                            ❌ Return to HQ
                                        </button>
                                    </div>
                                </div>
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
