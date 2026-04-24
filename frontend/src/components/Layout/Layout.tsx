import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css';

const Layout: React.FC = () => {
    return (
        <div className="layout-container">
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
