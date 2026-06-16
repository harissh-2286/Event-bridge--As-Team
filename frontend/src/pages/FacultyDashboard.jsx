import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { eventService, odService, registrationService, announcementService } from '../services/api';

const FacultyDashboard = () => {
  const [activeTab, setActiveTab] = useState('od-approvals');
  const [events, setEvents] = useState([]);
  const [odRequests, setOdRequests] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventRegs, setEventRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Announcement Form State
  const [annForm, setAnnForm] = useState({
    eventId: '',
    title: '',
    content: ''
  });

  const [annMsg, setAnnMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const evs = await eventService.getAll();
      setEvents(evs);

      const ods = await odService.getFacultyRequests();
      setOdRequests(ods);
    } catch (err) {
      console.error("Error loading faculty dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMonitorEventChange = async (e) => {
    const eventId = e.target.value;
    setSelectedEventId(eventId);
    if (eventId) {
      try {
        const regs = await registrationService.getByEvent(eventId);
        setEventRegs(regs);
      } catch (err) {
        console.error(err);
      }
    } else {
      setEventRegs([]);
    }
  };

  const handleODAction = async (odId, status) => {
    try {
      await odService.updateStatus(odId, status);
      fetchData();
    } catch (err) {
      alert(err.response?.data || "Failed to update OD status");
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setAnnMsg({ type: '', text: '' });
    try {
      await announcementService.create({
        ...annForm,
        eventId: annForm.eventId ? Number(annForm.eventId) : null
      });
      setAnnMsg({ type: 'success', text: 'Announcement published successfully!' });
      setAnnForm({ eventId: '', title: '', content: '' });
      fetchData();
    } catch (err) {
      setAnnMsg({ type: 'danger', text: err.response?.data || 'Failed to post announcement.' });
    }
  };

  return (
    <div className="container-fluid fade-in-up">
      <div className="row">
        <div className="col-md-3 col-lg-2 p-0 bg-white shadow-sm">
          <Sidebar role="FACULTY" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Faculty Advisor Dashboard</h3>
              <p className="text-muted small">Monitor campus participation and manage On-Duty approvals</p>
            </div>
            <button className="btn btn-primary-custom" onClick={fetchData}>
              <i className="fa-solid fa-rotate me-2"></i> Refresh Data
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Loading advisor desk...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: All Events */}
              {activeTab === 'all-events' && (
                <div>
                  <h4 className="fw-bold text-dark mb-3">Campus Events Directory</h4>
                  <div className="row g-4">
                    {events.map(event => (
                      <div key={event.id} className="col-md-6 col-lg-4">
                        <div className="card h-100 custom-card">
                          <img 
                            src={event.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop"} 
                            alt={event.eventName} 
                            className="card-img-top" 
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                          <div className="card-body p-3">
                            <span className="badge bg-primary-subtle text-primary mb-2">{event.category}</span>
                            <h6 className="card-title fw-bold mb-1">{event.eventName}</h6>
                            <p className="text-muted small text-truncate mb-2">{event.description}</p>
                            <div className="small text-muted mb-1"><i className="fa-solid fa-map-pin me-2"></i>{event.venue}</div>
                            <div className="small text-muted"><i className="fa-regular fa-calendar me-2"></i>{event.eventDate}</div>
                          </div>
                          <div className="card-footer bg-white border-0 px-3 pb-3 pt-0">
                            <span className="small text-muted">Organizer: {event.organizer.fullName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Monitor Registrations */}
              {activeTab === 'participants-monitor' && (
                <div className="card custom-card p-4 border-0">
                  <h4 className="fw-bold text-dark mb-3">Event Registration Monitor</h4>
                  <div className="mb-4 col-md-6">
                    <label className="form-label small fw-semibold text-muted">Select Event to Audit</label>
                    <select className="form-select" value={selectedEventId} onChange={handleMonitorEventChange}>
                      <option value="">-- Choose Event --</option>
                      {events.map(e => (
                        <option key={e.id} value={e.id}>{e.eventName}</option>
                      ))}
                    </select>
                  </div>

                  {selectedEventId && (
                    <div>
                      {eventRegs.length === 0 ? (
                        <p className="text-muted py-3">No registrations recorded for this event.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table align-middle">
                            <thead>
                              <tr>
                                <th>Student Name</th>
                                <th>Register No</th>
                                <th>Department</th>
                                <th>Type</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {eventRegs.map(reg => (
                                <tr key={reg.id}>
                                  <td className="fw-bold">{reg.participant.fullName}</td>
                                  <td>{reg.participant.registerNumber || 'N/A'}</td>
                                  <td>{reg.participant.department || 'N/A'}</td>
                                  <td>{reg.team ? `Team: ${reg.team.teamName}` : 'Individual'}</td>
                                  <td>
                                    <span className={`badge ${reg.status === 'APPROVED' ? 'bg-success' : reg.status === 'REJECTED' ? 'bg-danger' : 'bg-warning'}`}>
                                      {reg.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: OD Approvals */}
              {activeTab === 'od-approvals' && (
                <div className="card custom-card p-4 border-0">
                  <h4 className="fw-bold text-dark mb-3">Student OD Request Approvals</h4>
                  {odRequests.length === 0 ? (
                    <p className="text-muted text-center py-4">No OD requests currently pending.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Register No</th>
                            <th>Department</th>
                            <th>Event Name</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {odRequests.map(od => (
                            <tr key={od.id}>
                              <td className="fw-bold">{od.student.fullName}</td>
                              <td>{od.student.registerNumber}</td>
                              <td>{od.student.department}</td>
                              <td><span className="badge bg-light text-dark border">{od.event.eventName}</span></td>
                              <td>
                                <span className={`badge ${od.approvalStatus === 'APPROVED' ? 'bg-success' : od.approvalStatus === 'REJECTED' ? 'bg-danger' : 'bg-warning'}`}>
                                  {od.approvalStatus}
                                </span>
                              </td>
                              <td>
                                {od.approvalStatus === 'PENDING' ? (
                                  <div className="d-flex gap-2">
                                    <button className="btn btn-success btn-sm px-3" onClick={() => handleODAction(od.id, 'APPROVED')}>
                                      Approve
                                    </button>
                                    <button className="btn btn-danger btn-sm px-3" onClick={() => handleODAction(od.id, 'REJECTED')}>
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-muted small">Processed by {od.faculty?.fullName || 'Advisor'}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Send Announcements */}
              {activeTab === 'announcements' && (
                <div className="card custom-card p-4 border-0 max-width-600">
                  <h4 className="fw-bold mb-4 text-dark">Publish Broad Announcement</h4>
                  {annMsg.text && (
                    <div className={`alert alert-${annMsg.type} small py-2`} role="alert">
                      {annMsg.text}
                    </div>
                  )}
                  <form onSubmit={handleCreateAnnouncement}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Event Target (Optional)</label>
                      <select className="form-select bg-light" value={annForm.eventId} onChange={(e) => setAnnForm({...annForm, eventId: e.target.value})}>
                        <option value="">General (All Campus Users)</option>
                        {events.map(e => (
                          <option key={e.id} value={e.id}>{e.eventName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Title</label>
                      <input type="text" className="form-control" placeholder="e.g. End Semester Exams OD Notice" value={annForm.title} onChange={(e) => setAnnForm({...annForm, title: e.target.value})} required />
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-semibold text-muted">Announcement Content</label>
                      <textarea className="form-control" rows="5" placeholder="Specify dates and instructions..." value={annForm.content} onChange={(e) => setAnnForm({...annForm, content: e.target.value})} required></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary-custom px-4">Broadcast Notice</button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
