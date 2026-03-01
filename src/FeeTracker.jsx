// src/FeeTracker.jsx
import React, { useState, useEffect } from "react";
import { appendFeeEntry, fetchFeeData } from "./api/googleSheets";

// ----- Helper for Month/Year Options -----
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth(); // 0-based

// ----- Fee Form -----
function FeeForm({ onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        court: "Court 1",
        name: "",
        timing: "6-7am",
        customTiming: "",
        date: "",
        type: "Member",
        fee: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Basic validation
        if (!formData.name || !formData.fee) {
            alert("Please fill required fields.");
            return;
        }

        const finalTiming = formData.timing === "Manual" ? formData.customTiming : formData.timing;
        if (formData.timing === "Manual" && !finalTiming) {
            alert("Please enter a custom timing.");
            return;
        }

        const payload = { ...formData, timing: finalTiming };
        delete payload.customTiming; // Remove customTiming from payload being sent to sheets

        setIsSubmitting(true);
        try {
            await appendFeeEntry(payload);
            setFormData({
                court: "Court 1",
                name: "",
                timing: "6-7am",
                customTiming: "",
                date: "",
                type: "Member",
                fee: "",
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            alert("Failed to submit entry. Check console for details.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitting) {
        return (
            <div className="fee-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div className="spinner" style={{ border: '4px solid rgba(255, 255, 255, 0.1)', borderTop: '4px solid #10b981', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                <h3 style={{ marginTop: '1rem', color: '#10b981', textAlign: 'center' }}>Recording Entry...</h3>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="fee-form">
            <h3 className="form-header">Add Record</h3>
            <div className="form-group">
                <label>Court:</label>
                <select name="court" value={formData.court} onChange={handleChange} className="form-input" required>
                    <option value="Court 1">Court 1</option>
                    <option value="Court 2">Court 2</option>
                    <option value="Court 3">Court 3</option>
                </select>
            </div>
            <div className="form-group">
                <label>Player Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="Enter name" required />
            </div>
            <div className="form-group">
                <label>Timing (Session):</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select name="timing" value={formData.timing} onChange={handleChange} className="form-input" required>
                        <option value="6-7am">6:00-7:00am</option>
                        <option value="7-8am">7:00-8:00am</option>
                        <option value="5:40 - 7:30 pm">5:40 - 7:30 pm</option>
                        <option value="6:00 - 7:00 pm">6:00 - 7:00 pm</option>
                        <option value="7:00 - 8:00 pm">7:00 - 8:00 pm</option>
                        <option value="8:00-9:00 pm">8:00-9:00 pm</option>
                        <option value="Manual">Other (Manual)</option>
                    </select>
                    {formData.timing === "Manual" && (
                        <input
                            type="text"
                            name="customTiming"
                            value={formData.customTiming}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Enter custom timing (e.g. 9-10am)"
                            required
                        />
                    )}
                </div>
            </div>
            <div className="form-group">
                <label>Date:</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
                <label>Player Type:</label>
                <select name="type" value={formData.type} onChange={handleChange} className="form-input" required>
                    <option value="Member">Membership</option>
                    <option value="Coaching">Coaching</option>
                    <option value="Guest">Guest</option>
                </select>
            </div>
            <div className="form-group">
                <label>Fee Amount (₹):</label>
                <input type="number" name="fee" value={formData.fee} onChange={handleChange} className="form-input" placeholder="e.g. 500" required />
            </div>
            <button type="submit" className="submit-btn" disabled={!formData.name || !formData.fee || (formData.timing === "Manual" && !formData.customTiming) || isSubmitting}>
                Submit Entry
            </button>
        </form>
    );
}

// ----- Grouped Fee View -----
function FeeView() {
    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());

    // Hardcoded years 2026 to 2030
    const yearOptions = [2026, 2027, 2028, 2029, 2030];

    useEffect(() => {
        const load = async () => {
            try {
                const rows = await fetchFeeData();
                setAllData(rows);
            } catch (err) {
                console.error(err);
                alert("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return <p className="loading-text">Loading data from Google Sheets...</p>;
    }

    // Filter by Month and Year
    const filteredData = allData.filter((row) => {
        if (!row.date) return false;
        const rowDate = new Date(row.date);
        if (isNaN(rowDate.getTime())) return false;

        return rowDate.getMonth() === parseInt(selectedMonth) &&
            rowDate.getFullYear() === parseInt(selectedYear);
    });

    // Grouping Process: Sessions / Types & Totals
    const groupedData = {
        Morning: { items: {}, total: 0 },
        Evening: { items: {}, total: 0 },
        Coaching: { items: [], total: 0 },
        Guests: { items: [], total: 0 },
        GrandTotal: 0
    };

    filteredData.forEach(row => {
        const court = row.court || "Unknown Court";
        const timing = row.timing || "Unknown Timing";
        const type = row.type || "Other";
        const feeAmount = parseFloat(row.fee) || 0;

        groupedData.GrandTotal += feeAmount;

        // Separate out Guests entirely
        if (type.toLowerCase() === "guest") {
            groupedData.Guests.items.push(row);
            groupedData.Guests.total += feeAmount;
            return;
        }

        // Separate out Coaching entirely
        if (type.toLowerCase() === "coaching") {
            groupedData.Coaching.items.push(row);
            groupedData.Coaching.total += feeAmount;
            return;
        }

        // Determine Morning or Evening Session
        let session = "Morning";
        if (timing.toLowerCase().includes("pm") || timing.toLowerCase().includes("evening") || timing.includes("5:") || timing.includes("8:")) {
            session = "Evening";
        }

        if (!groupedData[session].items[court]) groupedData[session].items[court] = {};
        if (!groupedData[session].items[court][timing]) groupedData[session].items[court][timing] = [];

        groupedData[session].items[court][timing].push(row);
        groupedData[session].total += feeAmount;
    });

    // Helper to render a session block (Morning or Evening)
    const renderSession = (sessionName, sessionData) => {
        const courts = Object.keys(sessionData.items).sort();
        if (courts.length === 0) return null;

        return (
            <div className="session-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="session-title">
                    <h3 style={{ margin: 0 }}>{sessionName}</h3>
                    <span>Total: ₹{sessionData.total}</span>
                </div>
                {courts.map(courtName => {
                    const timings = Object.keys(sessionData.items[courtName]).sort();
                    return timings.map(timing => (
                        <div key={`${courtName}-${timing}`} className="court-timing-group">
                            <h4 className="court-timing-title">{courtName} ({timing})</h4>
                            <table className="simple-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessionData.items[courtName][timing].map((p, idx) => (
                                        <tr key={idx}>
                                            <td>{p.name}</td>
                                            <td>{p.date ? new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}</td>
                                            <td>₹{p.fee}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ));
                })}
            </div>
        );
    };

    // Helper to render simple flats lists (Guests/Coaching)
    const renderFlatList = (titleName, dataGroup, bgTheme) => {
        if (dataGroup.items.length === 0) return null;
        return (
            <div className="session-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgTheme }} className="session-title">
                    <h3 style={{ margin: 0 }}>{titleName}</h3>
                    <span>Total: ₹{dataGroup.total}</span>
                </div>
                <div className="court-timing-group">
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Date</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataGroup.items.map((p, idx) => (
                                <tr key={idx}>
                                    <td>{p.name}</td>
                                    <td>{p.date ? new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}</td>
                                    <td>₹{p.fee}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div>
            <h3 className="form-header">NBA Collections</h3>

            <div className="filters-bar">
                <div className="filter-group">
                    <label>Month:</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="form-input">
                        {MONTH_NAMES.map((m, idx) => (
                            <option key={idx} value={idx}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Year:</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="form-input">
                        {yearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {filteredData.length === 0 ? (
                <p className="no-data-text">No records found for this period.</p>
            ) : (
                <div className="collections-content">
                    {/* Main Sections */}
                    {renderSession("Morning", groupedData.Morning)}
                    {renderSession("Evening", groupedData.Evening)}

                    {/* Separated Sections */}
                    {renderFlatList("Coaching", groupedData.Coaching, "#16a34a")}
                    {renderFlatList("Guest", groupedData.Guests, "#ea580c")}

                    {/* Grand Total */}
                    <div className="grand-total-card" style={{ padding: '1.5rem', background: '#1e293b', color: '#fff', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', fontWeight: 'bold', fontSize: '1.3rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <span>Grand Total</span>
                        <span style={{ color: '#10b981' }}>₹{groupedData.GrandTotal}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ----- Main Component -----
export default function FeeTracker() {
    const [activeTab, setActiveTab] = useState("form");

    const refreshView = () => {
        if (activeTab === "view") {
            setActiveTab("form");
            setTimeout(() => setActiveTab("view"), 0);
        } else {
            setActiveTab("view");
        }
    };

    return (
        <>
            <header className="site-header">
                <div className="site-title">NBA Tracker</div>
                <div className="nav-actions">
                    <button
                        onClick={() => setActiveTab(activeTab === "form" ? "view" : "form")}
                        className="toggle-btn"
                    >
                        {activeTab === "form" ? "NBA FEES" : "Back to Form"}
                    </button>
                </div>
            </header>

            <main className="main-content">
                <div className="tracker-container">
                    {activeTab === "form" ? <FeeForm onSuccess={refreshView} /> : <FeeView />}
                </div>
            </main>
            <footer className="site-footer">
                <p>&copy; {new Date().getFullYear()} NBA Tracker App. All rights reserved.</p>
            </footer>
        </>
    );
}
