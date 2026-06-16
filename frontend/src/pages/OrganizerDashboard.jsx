import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { eventService, registrationService, announcementService } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const OrganizerDashboard = () => {
  const [activeTab, setActiveTab] = useState('my-events');
  const [myEvents, setMyEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Event Form State
  const [eventForm, setEventForm] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    description: '',
    teamLimit: 1,
    entryFee: 0,
    category: 'Technical',
    bannerUrl: '',
    registrationDeadline: ''
  });

  // New Announcement Form State
  const [annForm, setAnnForm] = useState({
    eventId: '',
    title: '',
    content: ''
  });

  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        const eventsData = await eventService.getByOrganizer(user.id);
        setMyEvents(eventsData);

        // Load all registrations for organizer's events
        const allRegs = [];
        for (const ev of eventsData) {
          const regs = await registrationService.getByEvent(ev.id);
          allRegs.push(...regs);
        }
        setRegistrations(allRegs);

        const annData = await announcementService.getAll();
        // filter announcements sent by organizer
        setAnnouncements(annData.filter(a => a.sender.id === user.id));

        const statsData = await eventService.getStats();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error loading organizer dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    try {
      await eventService.create(eventForm);
      setFormMsg({ type: 'success', text: 'Event created successfully!' });
      setEventForm({
        eventName: '',
        eventDate: '',
        eventTime: '',
        venue: '',
        description: '',
        teamLimit: 1,
        entryFee: 0,
        category: 'Technical',
        bannerUrl: '',
        registrationDeadline: ''
      });
      fetchData();
      setActiveTab('my-events');
    } catch (err) {
      setFormMsg({ type: 'danger', text: err.response?.data || 'Failed to create event.' });
    }
  };

  const handleCancelEvent = async (id) => {
    if (window.confirm("Are you sure you want to cancel this event? This will notify all registered participants.")) {
      try {
        await eventService.cancel(id);
        fetchData();
      } catch (err) {
        alert(err.response?.data || "Failed to cancel event");
      }
    }
  };

  const handleRegStatus = async (regId, status) => {
    try {
      await registrationService.updateStatus(regId, status);
      fetchData();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data || err.message));
    }
  };

  const handlePaymentStatus = async (regId, currentStatus) => {
    const nextStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await registrationService.updatePaymentStatus(regId, nextStatus);
      fetchData();
    } catch (err) {
      alert("Failed to update payment status: " + (err.response?.data || err.message));
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    try {
      await announcementService.create({
        ...annForm,
        eventId: annForm.eventId ? Number(annForm.eventId) : null
      });
      setFormMsg({ type: 'success', text: 'Announcement published and emails sent!' });
      setAnnForm({ eventId: '', title: '', content: '' });
      fetchData();
    } catch (err) {
      setFormMsg({ type: 'danger', text: err.response?.data || 'Failed to publish announcement.' });
    }
  };

  // Chart data setup
  const barChartData = stats ? {
    labels: Object.keys(stats.eventParticipation || {}),
    datasets: [
      {
        label: 'Registrations',
        data: Object.values(stats.eventParticipation || {}),
        backgroundColor: '#6A0DAD',
        borderRadius: 8
      }
    ]
  } : null;

  const pieChartData = stats ? {
    labels: ['Approved', 'Pending'],
    datasets: [
      {
        data: [stats.approvedRegistrations || 0, stats.pendingRegistrations || 0],
        backgroundColor: ['#28a745', '#ffc107'],
      }
    ]
  } : null;

  return (
    <div className="container-fluid fade-in-up">
      <div className="row">
        <div className="col-md-3 col-lg-2 p-0 bg-white shadow-sm">
          <Sidebar role="ORGANIZER" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        
        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Organizer Dashboard</h3>
              <p className="text-muted small">Manage symposiums, workshops, and registrations</p>
            </div>
            <button className="btn btn-primary-custom" onClick={fetchData}>
              <i className="fa-solid fa-rotate me-2"></i> Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Synchronizing data...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: My Events */}
              {activeTab === 'my-events' && (
                <div>
                  <h4 className="fw-bold text-dark mb-3">Managed Campus Events</h4>
                  {myEvents.length === 0 ? (
                    <div className="text-center bg-white p-5 rounded-4 shadow-sm border">
                      <i className="fa-regular fa-calendar-minus text-muted fs-1 mb-3"></i>
                      <h5>No Events Created</h5>
                      <p className="text-muted small">Start by creating your first event using the "Add Event" form.</p>
                      <button className="btn btn-primary-custom btn-sm mt-2" onClick={() => setActiveTab('add-event')}>Create Event</button>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {myEvents.map(event => (
                        <div key={event.id} className="col-md-6 col-lg-4">
                          <div className="card h-100 custom-card">
                            <div className="position-relative">
                              <img 
                                src={event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop"} 
                                alt={event.eventName} 
                                className="card-img-top" 
                                style={{ height: '140px', objectFit: 'cover' }}
                              />
                              <span className={`position-absolute top-0 end-0 badge m-3 ${event.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                                {event.status}
                              </span>
                            </div>
                            <div className="card-body p-3">
                              <h6 className="card-title fw-bold">{event.eventName}</h6>
                              <p className="text-muted small mb-2 text-truncate">{event.description}</p>
                              <div className="small text-muted mb-1">
                                <i className="fa-solid fa-map-pin me-1"></i> {event.venue}
                              </div>
                              <div className="small text-muted">
                                <i className="fa-regular fa-calendar me-1"></i> {event.eventDate}
                              </div>
                            </div>
                            <div className="card-footer bg-white border-0 d-flex gap-2 p-3">
                              {event.status === 'ACTIVE' && (
                                <button className="btn btn-outline-danger btn-sm w-100" onClick={() => handleCancelEvent(event.id)}>
                                  Cancel Event
                                </button>
                              )}
                              <button className="btn btn-light btn-sm border w-100" onClick={() => {
                                alert("Event ID: " + event.id + "\nUse admin panel or database console to permanently delete records.");
                              }}>
                                Info
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Add Event */}
              {activeTab === 'add-event' && (
                <div className="card custom-card p-4 shadow-sm border-0 max-width-800">
                  <h4 className="fw-bold mb-4 text-dark">Add New Event</h4>
                  
                  {formMsg.text && (
                    <div className={`alert alert-${formMsg.type} small py-2`} role="alert">
                      {formMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleCreateEvent}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Event Name</label>
                        <input type="text" className="form-control" placeholder="e.g. HackCSE 2026" value={eventForm.eventName} onChange={(e) => setEventForm({...eventForm, eventName: e.target.value})} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Category</label>
                        <select className="form-select" value={eventForm.category} onChange={(e) => setEventForm({...eventForm, category: e.target.value})}>
                          <option value="Technical">Technical Symposium</option>
                          <option value="Non-Technical">Non-Technical Workshop</option>
                          <option value="Sports">Sports Meet</option>
                          <option value="Cultural">Cultural Night</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Event Date</label>
                        <input type="date" className="form-control" value={eventForm.eventDate} onChange={(e) => setEventForm({...eventForm, eventDate: e.target.value})} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Event Time</label>
                        <input type="time" className="form-control" value={eventForm.eventTime} onChange={(e) => setEventForm({...eventForm, eventTime: e.target.value})} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Venue</label>
                        <input type="text" className="form-control" placeholder="e.g. CSE Seminar Hall" value={eventForm.venue} onChange={(e) => setEventForm({...eventForm, venue: e.target.value})} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Registration Deadline</label>
                        <input type="date" className="form-control" value={eventForm.registrationDeadline} onChange={(e) => setEventForm({...eventForm, registrationDeadline: e.target.value})} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-muted">Entry Fee (₹)</label>
                        <input type="number" className="form-control" placeholder="0 for Free" value={eventForm.entryFee} onChange={(e) => setEventForm({...eventForm, entryFee: Number(e.target.value)})} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-muted">Max Team Size</label>
                        <input type="number" className="form-control" placeholder="1 for Individual" value={eventForm.teamLimit} onChange={(e) => setEventForm({...eventForm, teamLimit: Number(e.target.value)})} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-muted">Banner Image URL</label>
                        <input type="text" className="form-control" placeholder="Optional URL path" value={eventForm.bannerUrl} onChange={(e) => setEventForm({...eventForm, bannerUrl: e.target.value})} />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">Description</label>
                        <textarea className="form-control" rows="3" placeholder="Provide event rules, guidelines, eligibility criteria..." value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})} required></textarea>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary-custom mt-4 px-5">Publish Event</button>
                  </form>
                </div>
              )}

              {/* Tab 3: Participants (Approve Registrations) */}
              {activeTab === 'participants' && (
                <div className="card custom-card p-4 shadow-sm border-0">
                  <h4 className="fw-bold mb-3 text-dark">Participant Registrations</h4>
                  {registrations.length === 0 ? (
                    <p className="text-muted text-center py-4">No registrations yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Reg No</th>
                            <th>Event</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registrations.map(reg => (
                            <tr key={reg.id}>
                              <td>
                                <div className="fw-bold text-dark">{reg.participant.fullName}</div>
                                <span className="text-muted small">{reg.participant.email}</span>
                              </td>
                              <td>{reg.participant.registerNumber || "N/A"}</td>
                              <td><span className="badge bg-light text-dark border">{reg.event.eventName}</span></td>
                              <td>{reg.team ? `Team: ${reg.team.teamName}` : 'Individual'}</td>
                              <td>
                                <span className={`badge ${reg.status === 'APPROVED' ? 'bg-success' : reg.status === 'REJECTED' ? 'bg-danger' : 'bg-warning'}`}>
                                  {reg.status}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`badge bg-light border ${reg.paymentStatus === 'PAID' ? 'text-success border-success' : 'text-danger border-danger'}`}>
                                    {reg.paymentStatus}
                                  </span>
                                  {reg.event.entryFee > 0 && (
                                    <button 
                                      className={`btn btn-xs border ${reg.paymentStatus === 'PAID' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                      style={{ padding: '2px 6px', fontSize: '0.72rem', borderRadius: '4px' }}
                                      onClick={() => handlePaymentStatus(reg.id, reg.paymentStatus)}
                                      title={reg.paymentStatus === 'PAID' ? "Mark Pending" : "Mark Paid"}
                                    >
                                      <i className={`fa-solid ${reg.paymentStatus === 'PAID' ? 'fa-xmark' : 'fa-check'}`}></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex gap-1 align-items-center">
                                  {reg.status === 'PENDING' && (
                                    <>
                                      <button className="btn btn-success btn-sm px-2" onClick={() => handleRegStatus(reg.id, 'APPROVED')} title="Approve Registration">
                                        <i className="fa-solid fa-check"></i>
                                      </button>
                                      <button className="btn btn-danger btn-sm px-2" onClick={() => handleRegStatus(reg.id, 'REJECTED')} title="Reject Registration">
                                        <i className="fa-solid fa-xmark"></i>
                                      </button>
                                    </>
                                  )}
                                  {reg.status !== 'PENDING' && (
                                    <span className="text-muted small">Resolved</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Announcements */}
              {activeTab === 'announcements' && (
                <div className="row g-4">
                  <div className="col-lg-5">
                    <div className="card custom-card p-4 border-0">
                      <h5 className="fw-bold mb-3">Post Announcement</h5>
                      {formMsg.text && (
                        <div className={`alert alert-${formMsg.type} small py-2`} role="alert">
                          {formMsg.text}
                        </div>
                      )}
                      <form onSubmit={handleCreateAnnouncement}>
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-muted">Link to Event</label>
                          <select className="form-select" value={annForm.eventId} onChange={(e) => setAnnForm({...annForm, eventId: e.target.value})}>
                            <option value="">General College (All Users)</option>
                            {myEvents.map(e => (
                              <option key={e.id} value={e.id}>{e.eventName}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-muted">Announcement Title</label>
                          <input type="text" className="form-control" placeholder="e.g. Schedule Update, Venue Shift" value={annForm.title} onChange={(e) => setAnnForm({...annForm, title: e.target.value})} required />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-muted">Content</label>
                          <textarea className="form-control" rows="4" placeholder="Type notification details here. This sends direct email alerts..." value={annForm.content} onChange={(e) => setAnnForm({...annForm, content: e.target.value})} required></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary-custom w-100">Broadcast Announcement</button>
                      </form>
                    </div>
                  </div>
                  <div className="col-lg-7">
                    <div className="card custom-card p-4 border-0">
                      <h5 className="fw-bold mb-3">Published Announcements</h5>
                      {announcements.length === 0 ? (
                        <p className="text-muted text-center py-4">No announcements published yet.</p>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {announcements.map(ann => (
                            <div key={ann.id} className="p-3 bg-light rounded-3 border-start border-primary border-4">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <h6 className="fw-bold mb-0 text-dark">{ann.title}</h6>
                                <span className="badge bg-secondary-subtle text-secondary small">
                                  {ann.event ? ann.event.eventName : 'General'}
                                </span>
                              </div>
                              <p className="mb-1 text-muted small">{ann.content}</p>
                              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {new Date(ann.timestamp).toLocaleString()}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Reports */}
              {activeTab === 'reports' && (
                <div className="row g-4">
                  <div className="col-lg-8">
                    <div className="card custom-card p-4 border-0">
                      <h5 className="fw-bold mb-4">Event Participation Analytics</h5>
                      {barChartData ? (
                        <Bar 
                          data={barChartData} 
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { display: false },
                              title: { display: true, text: 'Total Registered Students per Event' }
                            }
                          }}
                        />
                      ) : (
                        <p className="text-muted">Loading chart data...</p>
                      )}
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="card custom-card p-4 border-0 h-100">
                      <h5 className="fw-bold mb-4">Approval Status Ratio</h5>
                      {pieChartData ? (
                        <div style={{ maxHeight: '250px', position: 'relative' }}>
                          <Pie 
                            data={pieChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-muted">Loading ratio...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
