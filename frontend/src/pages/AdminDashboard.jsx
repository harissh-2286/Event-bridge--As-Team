import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { adminService, eventService, announcementService } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await adminService.getUsers();
      setUsers(usersData);

      const eventsData = await eventService.getAll();
      setEvents(eventsData);

      const annsData = await announcementService.getAll();
      setAnnouncements(annsData);

      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to permanently delete this user profile?")) {
      try {
        await adminService.deleteUser(userId);
        fetchData();
      } catch (err) {
        alert(err.response?.data || "Failed to delete user.");
      }
    }
  };

  const handleCancelEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to cancel this event? This sends cancellation alerts to all registrants.")) {
      try {
        await eventService.cancel(eventId);
        fetchData();
      } catch (err) {
        alert(err.response?.data || "Failed to cancel event.");
      }
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await announcementService.delete(annId);
        fetchData();
      } catch (err) {
        alert(err.response?.data || "Failed to delete announcement.");
      }
    }
  };

  // Chart configuration
  const doughnutData = stats ? {
    labels: ['Students', 'Organizers', 'Faculty'],
    datasets: [
      {
        data: [stats.participantsCount || 0, stats.organizersCount || 0, stats.facultyCount || 0],
        backgroundColor: ['#6A0DAD', '#0d6efd', '#20c997'],
      }
    ]
  } : null;

  const barData = stats ? {
    labels: Object.keys(stats.eventParticipation || {}),
    datasets: [
      {
        label: 'Registrations',
        data: Object.values(stats.eventParticipation || {}),
        backgroundColor: '#0d6efd',
        borderRadius: 8
      }
    ]
  } : null;

  return (
    <div className="container-fluid fade-in-up">
      <div className="row">
        <div className="col-md-3 col-lg-2 p-0 bg-white shadow-sm">
          <Sidebar role="ADMIN" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Administrative Terminal</h3>
              <p className="text-muted small">Manage platform users, event approvals, and audits</p>
            </div>
            <button className="btn btn-primary-custom" onClick={fetchData}>
              <i className="fa-solid fa-rotate me-2"></i> Sync Platform
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Synchronizing network metrics...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Platform Analytics */}
              {activeTab === 'analytics' && stats && (
                <div>
                  {/* Top Stats Cards */}
                  <div className="row g-4 mb-4">
                    <div className="col-sm-6 col-lg-3">
                      <div className="card custom-card p-3 d-flex flex-row align-items-center gap-3">
                        <div className="bg-primary-subtle text-primary rounded p-3"><i className="fa-solid fa-users fs-4"></i></div>
                        <div>
                          <h4 className="fw-bold mb-0">{stats.totalUsers}</h4>
                          <span className="text-muted small">Registered Users</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                      <div className="card custom-card p-3 d-flex flex-row align-items-center gap-3">
                        <div className="bg-success-subtle text-success rounded p-3"><i className="fa-solid fa-calendar-check fs-4"></i></div>
                        <div>
                          <h4 className="fw-bold mb-0">{stats.activeEvents}</h4>
                          <span className="text-muted small">Active Events</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                      <div className="card custom-card p-3 d-flex flex-row align-items-center gap-3">
                        <div className="bg-warning-subtle text-warning rounded p-3"><i className="fa-solid fa-ticket fs-4"></i></div>
                        <div>
                          <h4 className="fw-bold mb-0">{stats.totalRegistrations}</h4>
                          <span className="text-muted small">Signups Audit</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6 col-lg-3">
                      <div className="card custom-card p-3 d-flex flex-row align-items-center gap-3">
                        <div className="bg-info-subtle text-info rounded p-3"><i className="fa-solid fa-signal fs-4"></i></div>
                        <div>
                          <h4 className="fw-bold mb-0">{stats.onlineCount}</h4>
                          <span className="text-muted small">Online Now</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="row g-4">
                    <div className="col-lg-7">
                      <div className="card custom-card p-4 border-0">
                        <h5 className="fw-bold mb-4">Event Participation Analytics</h5>
                        {barData ? <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} /> : <p className="text-muted">No data available.</p>}
                      </div>
                    </div>
                    <div className="col-lg-5">
                      <div className="card custom-card p-4 border-0 h-100">
                        <h5 className="fw-bold mb-4">User Roles Distribution</h5>
                        {doughnutData ? (
                          <div style={{ maxHeight: '250px', position: 'relative' }}>
                            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
                          </div>
                        ) : (
                          <p className="text-muted">No data available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Manage Users */}
              {activeTab === 'manage-users' && (
                <div className="card custom-card p-4 border-0 shadow-sm">
                  <h4 className="fw-bold text-dark mb-3">User Profiles Directory</h4>
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>User Details</th>
                          <th>Username</th>
                          <th>Role</th>
                          <th>Department / Reg No</th>
                          <th>Activity Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div className="fw-bold">{u.fullName}</div>
                              <span className="text-muted small">{u.email}</span>
                            </td>
                            <td>{u.username}</td>
                            <td><span className="badge bg-light text-dark border">{u.role}</span></td>
                            <td>{u.department || 'N/A'} {u.registerNumber ? `(Reg: ${u.registerNumber})` : ''}</td>
                            <td>
                              <span className={`badge ${u.onlineStatus ? 'bg-success' : 'bg-secondary'}`}>
                                {u.onlineStatus ? 'Online' : 'Offline'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-outline-danger btn-sm px-2.5" 
                                disabled={u.role === 'ADMIN'}
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Manage Events */}
              {activeTab === 'manage-events' && (
                <div className="card custom-card p-4 border-0 shadow-sm">
                  <h4 className="fw-bold text-dark mb-3">Campus Events Manager</h4>
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Event Name</th>
                          <th>Category</th>
                          <th>Date / Venue</th>
                          <th>Organizer</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map(e => (
                          <tr key={e.id}>
                            <td className="fw-bold">{e.eventName}</td>
                            <td>{e.category}</td>
                            <td>
                              <div>{e.eventDate}</div>
                              <span className="text-muted small">{e.venue}</span>
                            </td>
                            <td>{e.organizer.fullName}</td>
                            <td>
                              <span className={`badge ${e.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                                {e.status}
                              </span>
                            </td>
                            <td>
                              {e.status === 'ACTIVE' ? (
                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancelEvent(e.id)}>
                                  Cancel Event
                                </button>
                              ) : (
                                <span className="text-muted small">Cancelled</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Manage Announcements */}
              {activeTab === 'manage-announcements' && (
                <div className="card custom-card p-4 border-0 shadow-sm">
                  <h4 className="fw-bold text-dark mb-3">Broadcast Archives</h4>
                  {announcements.length === 0 ? (
                    <p className="text-muted text-center py-4">No announcements posted.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Sender</th>
                            <th>Announcement Title</th>
                            <th>Target Scope</th>
                            <th>Date Posted</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {announcements.map(ann => (
                            <tr key={ann.id}>
                              <td className="fw-bold">{ann.sender.fullName} ({ann.sender.role})</td>
                              <td>
                                <div className="fw-bold">{ann.title}</div>
                                <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: '300px' }}>{ann.content}</span>
                              </td>
                              <td><span className="badge bg-light border text-dark">{ann.event ? ann.event.eventName : 'General'}</span></td>
                              <td>{new Date(ann.timestamp).toLocaleDateString()}</td>
                              <td>
                                <button className="btn btn-outline-danger btn-sm px-2.5" onClick={() => handleDeleteAnnouncement(ann.id)}>
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
