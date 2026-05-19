import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import './BranchDirectory.css';

interface DirectoryUser {
    userId: number;
    employeeId: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    roleName: string | null;
    departmentName: string | null;
    isActive: boolean;
}

const BranchDirectory = () => {
    const [users, setUsers] = useState<DirectoryUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterRole, setFilterRole] = useState('');

    useEffect(() => {
        fetchDirectory();
    }, []);

    const fetchDirectory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users/branch-directory');
            setUsers(res.data);
        } catch (err) {
            setError('Failed to load branch directory.');
        } finally {
            setLoading(false);
        }
    };

    const uniqueDepartments = Array.from(new Set(users.map(u => u.departmentName).filter(Boolean))).sort();
    const uniqueRoles = Array.from(new Set(users.map(u => u.roleName).filter(Boolean))).sort();

    const filteredUsers = users.filter(u => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = !q || 
            u.fullName.toLowerCase().includes(q) || 
            u.employeeId.toLowerCase().includes(q) || 
            (u.email && u.email.toLowerCase().includes(q));
            
        const matchesDept = !filterDepartment || u.departmentName === filterDepartment;
        const matchesRole = !filterRole || u.roleName === filterRole;

        return matchesSearch && matchesDept && matchesRole;
    });

    if (loading) return <div className="directory-loading"><span className="directory-spinner" /> Loading directory...</div>;

    return (
        <div className="directory-container">
            <div className="directory-header">
                <div>
                    <h1 className="directory-title">🏢 Branch Directory</h1>
                    <p className="directory-subtitle">Contact details for all staff in your branch</p>
                </div>
            </div>

            {error && <div className="directory-error">{error}</div>}

            <div className="directory-filters-wrapper">
                <input
                    className="directory-search"
                    type="text"
                    placeholder="🔍 Search by name, ID, or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <select className="directory-select" value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
                    <option value="">All Departments</option>
                    {uniqueDepartments.map(dept => (
                        <option key={dept as string} value={dept as string}>{dept as string}</option>
                    ))}
                </select>
                <select className="directory-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="">All Roles</option>
                    {uniqueRoles.map(role => (
                        <option key={role as string} value={role as string}>{(role as string).replace(/_/g, ' ')}</option>
                    ))}
                </select>
                {(searchTerm || filterDepartment || filterRole) && (
                    <button className="directory-clear-btn" onClick={() => { setSearchTerm(''); setFilterDepartment(''); setFilterRole(''); }}>
                        Clear Filters
                    </button>
                )}
            </div>

            <div className="directory-card">
                {filteredUsers.length === 0 ? (
                    <div className="directory-empty">
                        <span className="directory-empty-icon">📭</span>
                        <h3>No Staff Found</h3>
                        <p>No staff members match your filters.</p>
                    </div>
                ) : (
                    <table className="directory-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Full Name</th>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Phone Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.userId} className={`directory-row ${!u.isActive ? 'inactive' : ''}`}>
                                    <td className="directory-id">{u.employeeId}</td>
                                    <td className="directory-name">
                                        {u.fullName}
                                        {!u.isActive && <span className="directory-badge-inactive">Inactive</span>}
                                    </td>
                                    <td>{u.departmentName || '—'}</td>
                                    <td>{u.roleName ? u.roleName.replace(/_/g, ' ') : '—'}</td>
                                    <td>{u.email ? <a href={`mailto:${u.email}`} className="directory-link">{u.email}</a> : '—'}</td>
                                    <td>{u.phoneNumber ? <a href={`tel:${u.phoneNumber}`} className="directory-link">{u.phoneNumber}</a> : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <p className="directory-count">
                Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> staff members
            </p>
        </div>
    );
};

export default BranchDirectory;
