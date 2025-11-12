'use client'; 
import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';

// Use Next.js public environment variables
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper to get a date one month from now
const getOneMonthLater = () => {
    const today = new Date();
    // Add 30 days to ensure it's valid for testing
    today.setDate(today.getDate() + 30); 
    return today.toISOString().split('T')[0];
};

export default function LicenseAdmin() {
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editData, setEditData] = useState({ id: null, date: getOneMonthLater(), clientId: '', licenseKey: '' });
    
    // --- READ Licenses ---
    const fetchLicenses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('licenses')
            .select('*')
            .order('valid_until', { ascending: false });

        if (error) console.error('Error fetching licenses:', error.message);
        else setLicenses(data);
        setLoading(false);
    };

    // --- CREATE New License ---
    const addLicense = async () => {
        if (!editData.clientId || !editData.licenseKey || !editData.date) {
            return alert('Please fill in Client ID, License Key, and Validity Date.');
        }
        
        const { error } = await supabase
            .from('licenses')
            .insert([{ 
                client_id: editData.clientId, 
                license_key: editData.licenseKey, 
                valid_until: editData.date 
            }]);

        if (error) {
            alert(`Error adding license: ${error.message}`);
        } else {
            alert(`License for ${editData.clientId} added successfully!`);
            setEditData({ id: null, date: getOneMonthLater(), clientId: '', licenseKey: '' });
            fetchLicenses();
        }
    };
    
    // --- UPDATE License Validity ---
    const updateValidity = async (clientId) => {
        if (!editData.date) return alert('Please enter a new date.');

        const { error } = await supabase
            .from('licenses')
            .update({ valid_until: editData.date })
            .eq('client_id', clientId);

        if (error) {
            alert(`Error updating license: ${error.message}`);
        } else {
            alert(`License for ${clientId} updated successfully to ${editData.date}!`);
            setEditData({ ...editData, id: null });
            fetchLicenses();
        }
    };

    useEffect(() => {
        fetchLicenses();
    }, []);

    if (loading) return <div className="loading-container">Loading licenses...</div>;

    return (
        <div className="admin-container">
            <style jsx global>{`
                /* Global/Reset Styles */
                body {
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f4f7f9;
                    color: #333;
                }
                .admin-container {
                    max-width: 1200px;
                    margin: 40px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #1a202c;
                    border-bottom: 2px solid #4299e1;
                    padding-bottom: 10px;
                    margin-bottom: 30px;
                }
                h3 {
                    color: #2c5282;
                    margin-top: 0;
                }
                
                /* Form and Input Styles */
                .add-license-form {
                    border: 1px solid #e2e8f0;
                    padding: 20px;
                    margin-bottom: 30px;
                    border-radius: 8px;
                    background-color: #f7fafc;
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                input[type="text"], input[type="date"] {
                    padding: 10px;
                    border: 1px solid #cbd5e0;
                    border-radius: 4px;
                    flex-grow: 1;
                    min-width: 180px;
                }
                
                /* Button Styles */
                button {
                    padding: 10px 18px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s, transform 0.1s;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .add-license-form button {
                    background-color: #3182ce;
                    color: white;
                }
                .add-license-form button:hover {
                    background-color: #2c5282;
                }
                .update-button {
                    background-color: #48bb78;
                    color: white;
                }
                .update-button:hover {
                    background-color: #38a169;
                }
                .save-button {
                    background-color: #dd6b20;
                    color: white;
                }
                .save-button:hover {
                    background-color: #c05621;
                }
                .cancel-button {
                    background-color: #e2e8f0;
                    color: #4a5568;
                }
                .cancel-button:hover {
                    background-color: #cbd5e0;
                }

                /* Table Styles */
                table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    border-radius: 8px;
                    overflow: hidden;
                }
                th, td {
                    border: 1px solid #e2e8f0;
                    padding: 12px 15px;
                    text-align: left;
                }
                th {
                    background-color: #ebf8ff;
                    color: #2b6cb0;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 0.9em;
                }
                tr:nth-child(even) {
                    background-color: #fcfdfe;
                }
                tr:hover {
                    background-color: #f5faff;
                }
                .action-cell {
                    display: flex;
                    gap: 5px;
                    align-items: center;
                }
            `}</style>

            <h1>License Admin Panel 🔑</h1>
            <p>Ensure you are logged in as the Admin user defined in your RLS policy.</p>

            {/* --- Add New License Form --- */}
            <div className="add-license-form">
                <h3>Add New License</h3>
                <input 
                    type="text"
                    placeholder="Client ID (e.g., USER_XYZ)"
                    value={editData.clientId}
                    onChange={(e) => setEditData({ ...editData, clientId: e.target.value })}
                />
                <input 
                    type="text"
                    placeholder="License Key (CRON_SECRET)"
                    value={editData.licenseKey}
                    onChange={(e) => setEditData({ ...editData, licenseKey: e.target.value })}
                />
                <input 
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
                <button onClick={addLicense}>Add License</button>
            </div>

            <h2>Current Licenses</h2>
            <table>
                <thead>
                    <tr>
                        <th>Client ID</th>
                        <th>License Key (First 8 Chars)</th>
                        <th>Valid Until</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {licenses.map((license) => (
                        <tr key={license.client_id}>
                            <td>{license.client_id}</td>
                            <td>{license.license_key.substring(0, 8)}...</td> 
                            <td>{new Date(license.valid_until).toLocaleDateString()}</td>
                            <td>
                                {editData.id === license.client_id ? (
                                    <div className="action-cell">
                                        <input 
                                            type="date"
                                            value={editData.date}
                                            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                        />
                                        <button className="save-button" onClick={() => updateValidity(license.client_id)}>Save</button>
                                        <button className="cancel-button" onClick={() => setEditData({ ...editData, id: null })}>Cancel</button>
                                    </div>
                                ) : (
                                    <button 
                                        className="update-button"
                                        onClick={() => setEditData({ ...editData, id: license.client_id, date: license.valid_until.split('T')[0] })}
                                    >
                                        Update Validity
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}