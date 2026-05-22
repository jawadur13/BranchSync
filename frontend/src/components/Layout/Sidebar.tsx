import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../Logo/BranchSync_Logo.png';
import './Layout.css';

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'SYSTEM_ADMIN';
    const isManager = user?.role === 'BRANCH_MANAGER' || user?.role === 'OPERATION_MANAGER' || user?.role === 'FIRST_EXECUTIVE_OFFICER';
    const isOfficer = user?.role === 'OFFICER';
    const isCashOfficer = isOfficer && user?.departmentName?.toLowerCase().includes('cash');
    const isCashRelevant = isManager || isCashOfficer || isAdmin;
    const isStockRelevant = isManager || isOfficer || isAdmin;

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
                {user?.role !== 'DELIVERY_PERSON' && user?.role !== 'HQ_LOGISTICS_OFFICER' && (
                    <NavLink to="/transfers/new" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">➕</span> New Request
                    </NavLink>
                )}
                {isManager && (
                    <NavLink to="/branch-directory" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">🏢</span> Branch Directory
                    </NavLink>
                )}
                <NavLink to="/transfers/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="nav-icon">📜</span> History
                </NavLink>

                {isCashRelevant && (
                    <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-section-label">Cash Management</div>
                        {(isManager || isAdmin || isCashOfficer) && (
                            <NavLink to="/cash/ledger" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                <span className="nav-icon">💰</span> Cash Ledger
                            </NavLink>
                        )}
                        {(isManager || isCashOfficer) && (
                            <NavLink to="/cash/adjust" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                <span className="nav-icon">⚙️</span> Cash Adjustments
                            </NavLink>
                        )}
                    </>
                )}

                {isStockRelevant && (
                    <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-section-label">Stock Management</div>
                        <NavLink to="/stock/ledger" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                            <span className="nav-icon">📦</span> Stock Ledger
                        </NavLink>
                        {(isManager || isOfficer) && (
                            <NavLink to="/stock/adjust" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                                <span className="nav-icon">⚙️</span> Stock Adjustments
                            </NavLink>
                        )}
                    </>
                )}

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
