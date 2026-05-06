import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../Logo/BranchSync_Logo.png';
import './Layout.css';

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'SYSTEM_ADMIN';

    return (
        <aside className="sidebar">
            <Link to="/" className="sidebar-header-link">
                <div className="sidebar-header">
                    <img src={logo} alt="BranchSync Logo" className="sidebar-logo" />
                    <h2>BranchSync</h2>
                </div>
            </Link>
            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
                    <span className="nav-icon">📊</span> Dashboard
                </NavLink>
                {user?.role !== 'DELIVERY_PERSON' && (
                    <NavLink to="/transfers/new" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">➕</span> New Request
                    </NavLink>
                )}
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
                        <NavLink to="/admin/branches" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            <span className="nav-icon">🏢</span> Branches
                        </NavLink>
                        <NavLink to="/admin/departments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            <span className="nav-icon">🏷️</span> Departments
                        </NavLink>
                        <NavLink to="/admin/items" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            <span className="nav-icon">📦</span> Items & Depts
                        </NavLink>
                    </>
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;
