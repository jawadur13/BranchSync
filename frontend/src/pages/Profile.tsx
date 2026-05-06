import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import './Profile.css';

interface UserProfile {
    userId: number;
    employeeId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    roleName: string;
    branchName: string;
    branchCode: string;
    departmentName: string;
    isActive: boolean;
    createdAt: string;
}

const Profile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                setProfile(res.data);
            } catch (err) {
                setError('Failed to load profile information.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const formatDate = (iso: string) => {
        if (!iso) return 'N/A';
        return new Date(iso).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) return <div className="profile-loading">Loading profile...</div>;
    if (error) return <div className="profile-error">{error}</div>;
    if (!profile) return <div className="profile-error">Profile not found.</div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-avatar">
                    {profile.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div className="profile-titles">
                    <h1>{profile.fullName}</h1>
                    <p className="profile-role-badge">{profile.roleName.replace(/_/g, ' ')}</p>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-card main-info">
                    <h3>Basic Information</h3>
                    <div className="info-item">
                        <span className="label">Employee ID</span>
                        <span className="value">{profile.employeeId}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Full Name</span>
                        <span className="value">{profile.fullName}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Email Address</span>
                        <span className="value">{profile.email}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Phone Number</span>
                        <span className="value">{profile.phoneNumber || 'Not provided'}</span>
                    </div>
                </div>

                <div className="profile-card org-info">
                    <h3>Organization & Status</h3>
                    <div className="info-item">
                        <span className="label">Branch</span>
                        <span className="value">{profile.branchName} ({profile.branchCode})</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Department</span>
                        <span className="value">{profile.departmentName || 'Main Branch'}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Account Status</span>
                        <span className={`value status-${profile.isActive ? 'active' : 'inactive'}`}>
                            {profile.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="label">Member Since</span>
                        <span className="value">{formatDate(profile.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
