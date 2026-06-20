import React, { useState, useEffect } from 'react';
import api from "../api/axiosConfig.jsx";

const ViewAllUser = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // State for Editing User
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', password: '' });

    // State for Deleting User (Swipe to Confirm)
    const [userToDelete, setUserToDelete] = useState(null);
    const [swipeValue, setSwipeValue] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/v1/auth/users');
            setUsers(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching users:", error);
            setLoading(false);
        }
    };

    // --- TOGGLE STATUS LOGIC ---
    const handleToggleStatus = async (user) => {
        const updatedUserPayload = { ...user, enable: !user.enable };
        
        try {
            const response = await api.put(`/v1/auth/email/${user.email}`, updatedUserPayload);
            setUsers(users.map(u => u.id === user.id ? response.data : u));
        } catch (error) {
            console.error("Error toggling user status:", error);
            alert("Failed to update user status.");
        }
    };

    // --- EDIT USER LOGIC ---
    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({ name: user.name, email: user.email, password: '' }); 
    };

    const handleEditFormChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const updatedUserPayload = {
                ...editingUser,
                name: editFormData.name,
                email: editFormData.email
            };

            if (editFormData.password.trim() !== '') {
                updatedUserPayload.password = editFormData.password;
            }

            const response = await api.put(`/v1/auth/email/${editingUser.email}`, updatedUserPayload);
            setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user details.");
        }
    };

    // --- DELETE USER LOGIC (SWIPE TO CONFIRM) ---
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setSwipeValue(0); // Reset slider when opening modal
    };

    const executeDelete = async () => {
        try {
            await api.delete(`/v1/auth/email/${userToDelete.email}`);
            // Remove user from local state list
            setUsers(users.filter(u => u.id !== userToDelete.id));
            setUserToDelete(null); // Close modal
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
            setSwipeValue(0); // Reset slider on error
        }
    };

    const handleSwipeChange = (e) => {
        const val = e.target.value;
        setSwipeValue(val);
        // If the slider reaches 100, trigger the delete action
        if (val === "100") {
            executeDelete();
        }
    };

    const handleSwipeEnd = () => {
        // Snap back to 0 if they didn't swipe all the way to 100
        if (swipeValue < 100) {
            setSwipeValue(0);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Loading users...</div>;

    return (
        <div style={{ padding: '20px', position: 'relative' }}>
            <h2>All System Users</h2>
            
            <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '10px', marginBottom: '20px', width: '100%', maxWidth: '400px', borderRadius: '4px', border: '1px solid #ccc' }}
            />

            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4' }}>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Roles</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map((user) => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                {user.roles && user.roles.length > 0 
                                    ? user.roles.map(r => r.name).join(', ') 
                                    : 'No Roles'}
                            </td>
                            <td>
                                <button 
                                    onClick={() => handleToggleStatus(user)}
                                    style={{
                                        backgroundColor: user.enable ? '#28a745' : '#dc3545', 
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        width: '90px',
                                        transition: 'background-color 0.3s'
                                    }}
                                >
                                    {user.enable ? 'Enabled' : 'Disabled'}
                                </button>
                            </td>
                            <td>
                                <button 
                                    onClick={() => handleEditClick(user)}
                                    style={{ 
                                        cursor: 'pointer', 
                                        padding: '8px 12px', 
                                        backgroundColor: '#007bff', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        marginRight: '10px'
                                    }}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(user)}
                                    style={{ 
                                        cursor: 'pointer', 
                                        padding: '8px 12px', 
                                        backgroundColor: '#dc3545', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* --- EDIT MODAL OVERLAY --- */}
            {editingUser && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{ marginTop: 0 }}>Edit User</h3>
                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={styles.label}>Name</label>
                                <input type="text" name="name" value={editFormData.name} onChange={handleEditFormChange} required style={styles.input} />
                            </div>
                            <div>
                                <label style={styles.label}>Email Address</label>
                                <input type="email" name="email" value={editFormData.email} onChange={handleEditFormChange} required style={styles.input} />
                            </div>
                            <div>
                                <label style={styles.label}>New Password <small style={{ fontWeight: 'normal', color: '#666' }}>(leave blank to keep current)</small></label>
                                <input type="password" name="password" value={editFormData.password} onChange={handleEditFormChange} placeholder="••••••••" style={styles.input} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={styles.saveBtn}>Save Changes</button>
                                <button type="button" onClick={() => setEditingUser(null)} style={styles.cancelBtn}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {userToDelete && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{ marginTop: 0, color: '#dc3545' }}>Warning: Delete User</h3>
                        <p>Are you sure you want to permanently delete <strong>{userToDelete.name}</strong> ({userToDelete.email})?</p>
                        
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3f3', borderRadius: '8px', border: '1px solid #ffcdd2' }}>
                            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', textAlign: 'center', color: '#dc3545' }}>
                                {swipeValue === "100" ? "Deleting..." : "Swipe right to confirm ->"}
                            </p>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={swipeValue}
                                onChange={handleSwipeChange}
                                onMouseUp={handleSwipeEnd}
                                onTouchEnd={handleSwipeEnd}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                        </div>

                        <div style={{ display: 'flex', marginTop: '20px' }}>
                            <button type="button" onClick={() => setUserToDelete(null)} style={{...styles.cancelBtn, width: '100%'}}>
                                Cancel / Keep User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    },
    label: { fontWeight: 'bold', fontSize: '0.9rem', color: '#333', marginBottom: '5px', display: 'block' },
    input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '1rem' },
    saveBtn: { flex: 1, padding: '10px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { flex: 1, padding: '10px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

export default ViewAllUser;