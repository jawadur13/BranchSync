import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'SYSTEM_ADMIN';

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src="/favicon.svg" alt="Logo" className="sidebar-logo" />
                <h2>BranchSync</h2>
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
                    <span className="nav-icon">📊</span> Dashboard
                </NavLink>
                <NavLink to="/transfers/new" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="nav-icon">➕</span> New Request
                </NavLink>
                <NavLink to="/transfers/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="nav-icon">📜</span> History
                </NavLink>

                {isAdmin && (
                    <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-section-label">Administration</div>
                        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            <span className="nav-icon">👥</span> User Management
                        </NavLink>
                        <NavLink to="/admin/org" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            <span className="nav-icon">🏛️</span> Branches & Depts
                        </NavLink>
                    </>
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;
