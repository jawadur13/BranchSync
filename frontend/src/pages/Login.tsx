import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import './Login.css';

const Login: React.FC = () => {
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { employeeId, password });
            const { token, id, role, branchId } = response.data;
            
            // Save to context
            login(token, { id, employeeId: response.data.employeeId, role, branchId });
            
            // Redirect to dashboard
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials or server error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img src="/favicon.svg" alt="Jamuna Bank Logo" className="login-logo" />
                    <h2>BranchSync</h2>
                    <p>Inter-Branch Coordination System</p>
                </div>
                
                {error && <div className="login-error">{error}</div>}
                
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="employeeId">Employee ID</label>
                        <input 
                            type="text" 
                            id="employeeId"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            placeholder="e.g. EMP001"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            type="password" 
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
                <div className="login-footer">
                    <p>Jamuna Bank PLC © 2026</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
