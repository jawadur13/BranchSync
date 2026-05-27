import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import type { TransferResponseDto } from '../types/transfer';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [transfers, setTransfers] = useState<TransferResponseDto[]>([]);
    const [pendingAdjustments, setPendingAdjustments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isManager = user?.role === 'BRANCH_MANAGER' || user?.role === 'OPERATION_MANAGER' || user?.role === 'FIRST_EXECUTIVE_OFFICER';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/transfers');
            setTransfers(response.data);

            if (isManager) {
                try {
                    const adjRes = await api.get('/cash/adjust/pending');
                    setPendingAdjustments(adjRes.data);
                } catch { /* ignore */ }
            }
        } catch (err) {
            setError('Failed to fetch transfers. Please try again later.');
            console.error('Error fetching dashboard transfers:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'badge-success';
            case 'PENDING_INTERNAL':
            case 'PENDING_ASSIGNMENT':
                return 'badge-warning';
            case 'PENDING_HQ_APPROVAL':
                return 'badge-hq';
            case 'PENDING_FINAL_RELEASE':
            case 'READY_FOR_PICKUP':
                return 'badge-info';
            case 'IN_TRANSIT':
                return 'badge-transit';
            case 'DELIVERED':
                return 'badge-received';
            case 'REJECTED_BY_HQ':
            case 'REJECTED_BY_MANAGER':
            case 'REJECTED_ON_RECEIPT':
            case 'CANCELLED':
                return 'badge-danger';
            default:
                return 'badge-neutral';
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        return priority === 'CRITICAL' ? 'badge-danger-outline' : 'badge-neutral-outline';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const isActionable = (t: TransferResponseDto) => {
        if (!user) return false;
        if (user.role === 'SYSTEM_ADMIN') return false; 
        if (user.role === 'HQ_LOGISTICS_OFFICER' && t.status === 'PENDING_HQ_APPROVAL') return true;
        
        const isManager = ['BRANCH_MANAGER', 'OPERATION_MANAGER', 'FIRST_EXECUTIVE_OFFICER'].includes(user.role);
        // Note: The backend already scopes list elements to the user's branch.
        // Therefore, if a manager sees PENDING_INTERNAL, they must be the origin branch manager.
        if (isManager && (t.status === 'PENDING_INTERNAL' || t.status === 'PENDING_FINAL_RELEASE')) return true;
        if (!isManager && t.status === 'PENDING_ASSIGNMENT') return true; 
        
        if (user.role === 'DELIVERY_PERSON' && (t.status === 'READY_FOR_PICKUP' || t.status === 'IN_TRANSIT')) return true;
        if (t.status === 'DELIVERED' && t.initiatedByFullName === user.fullName) return true;
        
        return false;
    };

    const attentionTransfers = transfers.filter(isActionable);

    if (loading) {
        return <div className="dashboard-loading">Loading transfers...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="welcome-banner">
                <div className="welcome-text">
                    <h2>{getGreeting()}, {user?.fullName || user?.employeeId}! 👋</h2>
                    <p>
                        {user?.role === 'SYSTEM_ADMIN' 
                            ? "You're logged in as System Administrator. Monitoring all inter-branch activities."
                            : `Welcome back to the ${user?.role?.replace('ROLE_', '').replace('_', ' ')} dashboard.`}
                    </p>
                </div>
            </div>

            {(attentionTransfers.length > 0 || pendingAdjustments.length > 0) && (
                <div className="attention-widget">
                    <div className="attention-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="attention-icon">🔔</span>
                            <h3 className="attention-title">Attention Required</h3>
                        </div>
                        <span className="attention-badge">{attentionTransfers.length + pendingAdjustments.length} Action{attentionTransfers.length + pendingAdjustments.length !== 1 ? 's' : ''} Pending</span>
                    </div>
                    <p className="attention-subtitle">You have active requests that require your immediate input or approval.</p>
                    <div className="attention-list">
                        {pendingAdjustments.length > 0 && (
                            <div className="attention-item" onClick={() => navigate('/cash/adjust')} style={{ cursor: 'pointer', background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
                                <div className="attention-item-code">⚙️ CASH ADJUSTMENTS</div>
                                <div className="attention-item-title">
                                    You have <strong>{pendingAdjustments.length}</strong> pending cash adjustment request{pendingAdjustments.length > 1 ? 's' : ''} waiting for your approval.
                                </div>
                                <div className="attention-item-status">
                                    <span className="badge badge-warning">PENDING APPROVAL</span>
                                </div>
                                <div className="attention-item-arrow">→</div>
                            </div>
                        )}
                        {attentionTransfers.map(t => (
                            <Link key={t.requestId} to={`/transfers/${t.requestId}`} className="attention-item">
                                <div className="attention-item-code">{t.requestCode}</div>
                                <div className="attention-item-title">{t.title}</div>
                                <div className="attention-item-status">
                                    <span className={`badge ${getStatusBadgeClass(t.status)}`}>{t.status.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="attention-item-arrow">→</div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Overview</h1>
                    <p className="dashboard-subtitle">
                        {user?.role === 'SYSTEM_ADMIN'
                            ? 'Monitoring all active transfers across the bank network'
                            : user?.role === 'FIRST_EXECUTIVE_OFFICER' 
                            ? 'Pending High-Priority Approvals' 
                            : 'Active transfers for your branch'}
                    </p>
                </div>
                {user?.role !== 'SYSTEM_ADMIN' && user?.role !== 'HQ_LOGISTICS_OFFICER' && (
                    <Link to="/transfers/new" className="btn-primary">
                        + New Request
                    </Link>
                )}
            </div>

            {error && <div className="dashboard-error">{error}</div>}

            <div className="table-card">
                {transfers.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>No Active Transfers</h3>
                        <p>
                            {user?.role === 'SYSTEM_ADMIN'
                                ? 'There are currently no active transfers in transit across the bank network.'
                                : 'There are currently no transfers requiring your attention.'}
                        </p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Origin</th>
                                <th>Destination</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.map((t) => (
                                <tr key={t.requestId}>
                                    <td className="fw-semibold">{t.requestCode}</td>
                                    <td>{t.title}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span>{t.categoryName}</span>
                                            {t.behaviorType && (
                                                <span className={`type-badge behavior-${t.behaviorType.toLowerCase()}`} style={{ alignSelf: 'flex-start', padding: '1px 6px', fontSize: '10px', width: 'fit-content' }}>
                                                    {t.behaviorType}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{t.originBranchName}</td>
                                    <td>{t.destinationBranchName}</td>
                                    <td>
                                        <span className={`badge ${getPriorityBadgeClass(t.priority)}`}>
                                            {t.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadgeClass(t.status)}`}>
                                            {t.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/transfers/${t.requestId}`} className="btn-secondary-sm">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
