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
    categoryName: string;
    requiresDualVerification: boolean;
    requiresHqApproval: boolean;
    sensitivityLevel: string;
    priority: string;
    requestType: string;
    initiatedByFullName: string;
    initiatedByEmployeeId: string;
    initiatedByBranchId: number;
    requestedAt: string;
    expectedDeliveryDate: string | null;
    closedAt: string | null;
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

    useEffect(() => {
        fetchTransferDetails();
    }, [id]);

    const fetchTransferDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/transfers/${id}`);
            setTransfer(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load transfer details.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve this transfer?')) return;
        setActionLoading(true);
        setActionSuccess('');
        setError('');
        try {
            await api.post(`/transfers/${id}/approve`);
            setActionSuccess('Transfer approved successfully!');
            fetchTransferDetails();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Approval failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerify = async (isOriginConfirmation: boolean) => {
        const side = isOriginConfirmation ? 'Origin' : 'Destination';
        if (!confirm(`Confirm ${side} verification for this transfer?`)) return;
        setActionLoading(true);
        setActionSuccess('');
        setError('');
        try {
            await api.post(`/transfers/${id}/verify`, { isOriginConfirmation });
            setActionSuccess(`${side} verification completed successfully!`);
            fetchTransferDetails();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed.');
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
            'DRAFT': { class: 'status-draft', icon: '📝' },
            'PENDING_APPROVAL': { class: 'status-pending', icon: '⏳' },
            'APPROVED': { class: 'status-approved', icon: '✅' },
            'DISPATCHED': { class: 'status-dispatched', icon: '📦' },
            'IN_TRANSIT': { class: 'status-transit', icon: '🚚' },
            'RECEIVED': { class: 'status-received', icon: '📬' },
            'CONFIRMED': { class: 'status-confirmed', icon: '✔️' },
            'CLOSED': { class: 'status-closed', icon: '🔒' },
            'REJECTED': { class: 'status-rejected', icon: '❌' },
            'ESCALATED': { class: 'status-escalated', icon: '⚡' },
            'CANCELLED': { class: 'status-cancelled', icon: '🚫' },
        };
        return configs[status] || { class: 'status-draft', icon: '📄' };
    };

    // Determine which actions the current user can take
    const canApprove = () => {
        if (!transfer || !user) return false;
        const isApprovalStatus = transfer.status === 'PENDING_APPROVAL';
        const isApprover = user.role === 'ROLE_BRANCH_MANAGER' || user.role === 'ROLE_FIRST_EXECUTIVE_OFFICER';
        return isApprovalStatus && isApprover;
    };

    const canVerifyOrigin = () => {
        if (!transfer || !user) return false;
        return transfer.status === 'APPROVED' && user.branchId === transfer.originBranchId;
    };

    const canVerifyDestination = () => {
        if (!transfer || !user) return false;
        return transfer.status === 'APPROVED' && user.branchId === transfer.destinationBranchId;
    };

    if (loading) {
        return (
            <div className="details-loading">
                <div className="loading-spinner"></div>
                <p>Loading transfer details...</p>
            </div>
        );
    }

    if (!transfer) {
        return (
            <div className="details-error-page">
                <span className="error-icon">🔍</span>
                <h2>Transfer Not Found</h2>
                <p>The transfer you are looking for does not exist or has been removed.</p>
                <Link to="/" className="btn-ghost">← Back to Dashboard</Link>
            </div>
        );
    }

    const statusConfig = getStatusConfig(transfer.status);

    return (
        <div className="transfer-details-container">
            {/* Top Navigation */}
            <div className="details-nav">
                <button className="btn-ghost" onClick={() => navigate('/')}>← Back to Dashboard</button>
            </div>

            {/* Alerts */}
            {error && <div className="detail-alert detail-alert-error">{error}</div>}
            {actionSuccess && <div className="detail-alert detail-alert-success">{actionSuccess}</div>}

            {/* Hero Header */}
            <div className="details-hero">
                <div className="hero-left">
                    <div className="hero-code">{transfer.requestCode}</div>
                    <h1 className="hero-title">{transfer.title}</h1>
                    <div className="hero-meta">
                        <span className="meta-item">
                            👤 {transfer.initiatedByFullName} ({transfer.initiatedByEmployeeId})
                        </span>
                        <span className="meta-separator">•</span>
                        <span className="meta-item">
                            🕐 {formatDate(transfer.requestedAt)}
                        </span>
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

            {/* Content Grid */}
            <div className="details-grid">
                {/* Left Column: Info */}
                <div className="details-main">
                    {/* Route Card */}
                    <div className="detail-card">
                        <h3 className="card-title">📍 Transfer Route</h3>
                        <div className="route-display">
                            <div className="route-point">
                                <div className="route-marker origin"></div>
                                <div className="route-info">
                                    <span className="route-label">ORIGIN</span>
                                    <span className="route-branch">{transfer.originBranchName}</span>
                                    <span className="route-code">{transfer.originBranchCode}</span>
                                </div>
                            </div>
                            <div className="route-connector">
                                <div className="connector-line"></div>
                                <span className="connector-type">{transfer.requestType.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="route-point">
                                <div className="route-marker destination"></div>
                                <div className="route-info">
                                    <span className="route-label">DESTINATION</span>
                                    <span className="route-branch">{transfer.destinationBranchName}</span>
                                    <span className="route-code">{transfer.destinationBranchCode}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category & Classification */}
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
                            <div className="classification-item">
                                <span className="cl-label">Dual Verification</span>
                                <span className={`cl-flag ${transfer.requiresDualVerification ? 'flag-active' : 'flag-inactive'}`}>
                                    {transfer.requiresDualVerification ? '✅ Required' : '— Not Required'}
                                </span>
                            </div>
                            <div className="classification-item">
                                <span className="cl-label">HQ Approval</span>
                                <span className={`cl-flag ${transfer.requiresHqApproval ? 'flag-active' : 'flag-inactive'}`}>
                                    {transfer.requiresHqApproval ? '✅ Required' : '— Not Required'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {transfer.description && (
                        <div className="detail-card">
                            <h3 className="card-title">📝 Description</h3>
                            <p className="description-text">{transfer.description}</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Actions & Timeline */}
                <div className="details-sidebar">
                    {/* Action Panel */}
                    {(canApprove() || canVerifyOrigin() || canVerifyDestination()) && (
                        <div className="detail-card action-card">
                            <h3 className="card-title">⚡ Actions Required</h3>
                            <div className="action-buttons">
                                {canApprove() && (
                                    <button
                                        className="action-btn action-approve"
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : '✅ Approve Transfer'}
                                    </button>
                                )}
                                {canVerifyOrigin() && (
                                    <button
                                        className="action-btn action-verify-origin"
                                        onClick={() => handleVerify(true)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : '📤 Confirm Origin Dispatch'}
                                    </button>
                                )}
                                {canVerifyDestination() && (
                                    <button
                                        className="action-btn action-verify-dest"
                                        onClick={() => handleVerify(false)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : '📥 Confirm Destination Receipt'}
                                    </button>
                                )}
                            </div>
                            <p className="action-hint">
                                {canApprove() && 'Review the transfer details above before approving.'}
                                {canVerifyOrigin() && 'Confirm that the items have been dispatched from your branch.'}
                                {canVerifyDestination() && 'Confirm that the items have been received at your branch.'}
                            </p>
                        </div>
                    )}

                    {/* Key Dates */}
                    <div className="detail-card">
                        <h3 className="card-title">🗓️ Timeline</h3>
                        <div className="timeline-list">
                            <div className="timeline-item">
                                <div className="timeline-dot active"></div>
                                <div className="timeline-content">
                                    <span className="timeline-label">Requested</span>
                                    <span className="timeline-date">{formatDate(transfer.requestedAt)}</span>
                                </div>
                            </div>
                            {transfer.expectedDeliveryDate && (
                                <div className="timeline-item">
                                    <div className="timeline-dot pending"></div>
                                    <div className="timeline-content">
                                        <span className="timeline-label">Expected Delivery</span>
                                        <span className="timeline-date">{transfer.expectedDeliveryDate}</span>
                                    </div>
                                </div>
                            )}
                            {transfer.closedAt && (
                                <div className="timeline-item">
                                    <div className="timeline-dot completed"></div>
                                    <div className="timeline-content">
                                        <span className="timeline-label">Closed</span>
                                        <span className="timeline-date">{formatDate(transfer.closedAt)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="detail-card">
                        <h3 className="card-title">📊 Quick Info</h3>
                        <div className="quick-info-list">
                            <div className="quick-info-item">
                                <span className="qi-label">Request ID</span>
                                <span className="qi-value">#{transfer.requestId}</span>
                            </div>
                            <div className="quick-info-item">
                                <span className="qi-label">Request Type</span>
                                <span className="qi-value">{transfer.requestType.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="quick-info-item">
                                <span className="qi-label">Initiated By</span>
                                <span className="qi-value">{transfer.initiatedByEmployeeId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferDetails;
