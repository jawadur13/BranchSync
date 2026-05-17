import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout: React.FC = () => {
    const { user } = useAuth();
    const roleClass = user?.role ? `role-bg-${user.role.toLowerCase()}` : '';

    return (
        <div className={`layout-container ${roleClass}`}>
            <Sidebar />
            <div className="layout-main">
                <Topbar />
                <main className="layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
