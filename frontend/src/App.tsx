
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewTransfer from './pages/NewTransfer';
import TransferHistory from './pages/TransferHistory';
import TransferDetails from './pages/TransferDetails';
import UserManagement from './pages/admin/UserManagement';
import OrgManagement from './pages/admin/OrgManagement';
import Profile from './pages/Profile';
import Layout from './components/Layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes inside Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="transfers/new" element={<NewTransfer />} />
          <Route path="transfers/:id" element={<TransferDetails />} />
          <Route path="transfers/history" element={<TransferHistory />} />
          <Route path="profile" element={<Profile />} />

          {/* Admin Routes */}
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="admin/branches" element={<OrgManagement defaultTab="branches" />} />
          <Route path="admin/departments" element={<OrgManagement defaultTab="departments" />} />
          <Route path="admin/items" element={<OrgManagement defaultTab="items" />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
