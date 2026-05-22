
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewTransfer from './pages/NewTransfer';
import TransferHistory from './pages/TransferHistory';
import TransferDetails from './pages/TransferDetails';
import UserManagement from './pages/admin/UserManagement';
import BranchManagement from './pages/admin/BranchManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import ItemManagement from './pages/admin/ItemManagement';
import Profile from './pages/Profile';
import BranchDirectory from './pages/BranchDirectory';
import CashLedger from './pages/CashLedger';
import ManualAdjustment from './pages/ManualAdjustment';
import StockLedger from './pages/StockLedger';
import StockAdjustment from './pages/StockAdjustment';
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
          <Route path="branch-directory" element={<BranchDirectory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="cash/ledger" element={<CashLedger />} />
          <Route path="cash/adjust" element={<ManualAdjustment />} />
          <Route path="stock/ledger" element={<StockLedger />} />
          <Route path="stock/adjust" element={<StockAdjustment />} />

          {/* Admin Routes */}
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="admin/branches" element={<BranchManagement />} />
          <Route path="admin/departments" element={<DepartmentManagement />} />
          <Route path="admin/items" element={<ItemManagement />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
