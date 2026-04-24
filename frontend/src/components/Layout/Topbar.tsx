import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Topbar: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="topbar">
            <div className="topbar-search">
                <input type="text" placeholder="Search requests..." />
            </div>
            <div className="topbar-user">
                <div className="user-info">
                    <span className="user-name">{user?.employeeId}</span>
                    <span className="user-role">{user?.role?.replace('ROLE_', '').replace('_', ' ')}</span>
                </div>
                <div className="user-avatar">
                    {user?.employeeId?.substring(0, 2).toUpperCase() || 'JB'}
                </div>
                <button onClick={logout} className="logout-btn">
                    Logout
                </button>
            </div>
        </header>
    );
};

export default Topbar;
