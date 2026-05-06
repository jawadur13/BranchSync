import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import type { TransferResponseDto } from '../types/transfer';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [transfers, setTransfers] = useState<TransferResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTransfers();
    }, []);

    const fetchTransfers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/transfers');
            setTransfers(response.data);
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
            case 'PENDING_FINAL_RELEASE':
            case 'READY_FOR_PICKUP':
                return 'badge-info';
            case 'IN_TRANSIT':
                return 'badge-transit';
            case 'DELIVERED':
                return 'badge-received';
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

            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Overview</h1>
                    <p className="dashboard-subtitle">
                        {user?.role === 'FIRST_EXECUTIVE_OFFICER' 
                            ? 'Pending High-Priority Approvals' 
                            : 'Active transfers for your branch'}
                    </p>
                </div>
                <Link to="/transfers/new" className="btn-primary">
                    + New Request
                </Link>
            </div>

            {error && <div className="dashboard-error">{error}</div>}

            <div className="table-card">
                {transfers.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>No Active Transfers</h3>
                        <p>There are currently no transfers requiring your attention.</p>
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
                                    <td>{t.categoryName}</td>
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
