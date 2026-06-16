import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService, registrationService, authService } from '../services/api';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Team Form
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    membersString: ''
  });
  const [regMsg, setRegMsg] = useState({ type: '', text: '' });

  const getErrMsg = (err, fallback = 'An error occurred.') => {
    const data = err?.response?.data;
    if (!data) return err?.message || fallback;
    if (typeof data === 'string') return data;
    return data.message || data.error || fallback;
  };

  const fetchEventDetails = async () => {
    try {
      const data = await eventService.getById(id);
      setEvent(data);

      const user = authService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        // check if registered
        const myRegs = await registrationService.getByUser(user.id);
        const registered = myRegs.some(r => r.event.id === data.id);
        setIsRegistered(registered);
      }
    } catch (err) {
      setError("Event details not found or failed to load.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleRegisterIndividual = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      await registrationService.registerIndividual(event.id);
      alert("Registration successful! Confirmation email sent.");
      fetchEventDetails();
    } catch (err) {
      alert("Failed to register: " + getErrMsg(err, err.message));
    }
  };

  const handleRegisterTeamSubmit = async (e) => {
    e.preventDefault();
    setRegMsg({ type: '', text: '' });
    try {
      const usernames = teamForm.membersString
        .split(',')
        .map(u => u.trim())
        .filter(u => u.length > 0);

      await registrationService.registerTeam(event.id, {
        teamName: teamForm.teamName,
        memberUsernames: usernames
      });

      alert("Team registered successfully!");
      setShowTeamModal(false);
      fetchEventDetails();
    } catch (err) {
      setRegMsg({ type: 'danger', text: getErrMsg(err, 'Failed to register team.') });
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Retrieving symposium details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger max-width-600 mx-auto">{error || "Event not found"}</div>
        <Link to="/" className="btn btn-primary-custom mt-3">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="container py-5 fade-in-up">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{event.eventName}</li>
        </ol>
      </nav>

      <div className="row g-4">
        {/* Left Column: Image and Details */}
        <div className="col-lg-8">
          <div className="card custom-card border-0 mb-4">
            <img 
              src={event.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop"} 
              alt={event.eventName} 
              className="card-img-top"
              style={{ maxHeight: '380px', objectFit: 'cover' }}
            />
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold">{event.category}</span>
                <span className={`badge ${event.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'} px-3 py-2`}>
                  {event.status}
                </span>
              </div>
              <h2 className="fw-bold mb-3">{event.eventName}</h2>
              
              <h5 className="fw-bold text-dark mt-4 mb-3">Description & General Rules</h5>
              <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                {event.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar metadata card */}
        <div className="col-lg-4">
          <div className="card custom-card border-0 p-4 sticky-top" style={{ top: '90px' }}>
            <h5 className="fw-bold mb-4 text-dark pb-2 border-bottom">Event Details</h5>
            
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex gap-3">
                <div className="text-primary bg-primary-subtle d-flex align-items-center justify-content-center rounded" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                  <i className="fa-regular fa-calendar-days fs-5"></i>
                </div>
                <div>
                  <span className="text-muted small d-block">Date</span>
                  <strong className="text-dark">{event.eventDate}</strong>
                </div>
              </div>

              <div className="d-flex gap-3">
                <div className="text-primary bg-primary-subtle d-flex align-items-center justify-content-center rounded" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                  <i className="fa-regular fa-clock fs-5"></i>
                </div>
                <div>
                  <span className="text-muted small d-block">Time</span>
                  <strong className="text-dark">{event.eventTime}</strong>
                </div>
              </div>

              <div className="d-flex gap-3">
                <div className="text-primary bg-primary-subtle d-flex align-items-center justify-content-center rounded" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                  <i className="fa-solid fa-map-pin fs-5"></i>
                </div>
                <div>
                  <span className="text-muted small d-block">Venue</span>
                  <strong className="text-dark">{event.venue}</strong>
                </div>
              </div>

              <div className="d-flex gap-3">
                <div className="text-primary bg-primary-subtle d-flex align-items-center justify-content-center rounded" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                  <i className="fa-solid fa-indian-rupee-sign fs-5"></i>
                </div>
                <div>
                  <span className="text-muted small d-block">Entry Fee</span>
                  <strong className="text-primary">{event.entryFee > 0 ? `₹${event.entryFee}` : 'Free Registration'}</strong>
                </div>
              </div>

              <div className="d-flex gap-3">
                <div className="text-primary bg-primary-subtle d-flex align-items-center justify-content-center rounded" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                  <i className="fa-solid fa-users fs-5"></i>
                </div>
                <div>
                  <span className="text-muted small d-block">Event Type</span>
                  <strong className="text-dark">{event.teamLimit > 1 ? `Team Event (Max: ${event.teamLimit})` : 'Individual Event'}</strong>
                </div>
              </div>

              <div className="d-flex gap-3">
                <div className="text-primary bg-primary-subtle d-flex align-items-center justify-content-center rounded" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                  <i className="fa-solid fa-hourglass-end fs-5"></i>
                </div>
                <div>
                  <span className="text-muted small d-block">Registration Deadline</span>
                  <strong className="text-danger">{event.registrationDeadline}</strong>
                </div>
              </div>
            </div>

            <div className="border-top pt-4 mb-4">
              <span className="text-muted small d-block mb-1">Convener / Organizer</span>
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle fw-bold" style={{ width: '40px', height: '40px' }}>
                  {event.organizer.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark small">{event.organizer.fullName}</h6>
                  <span className="text-muted small">{event.organizer.email}</span>
                </div>
              </div>
            </div>

            {/* Registration Actions */}
            {event.status === 'CANCELLED' ? (
              <button className="btn btn-secondary w-100 py-2.5" disabled>Event Cancelled</button>
            ) : isRegistered ? (
              <button className="btn btn-success w-100 py-2.5" disabled>
                <i className="fa-solid fa-circle-check me-2"></i> Registered
              </button>
            ) : currentUser && currentUser.role !== 'PARTICIPANT' ? (
              <button className="btn btn-secondary w-100 py-2.5" disabled>Participant Role Required</button>
            ) : event.teamLimit > 1 ? (
              <button className="btn btn-primary-custom w-100 py-2.5" onClick={() => setShowTeamModal(true)}>
                Register Team
              </button>
            ) : (
              <button className="btn btn-primary-custom w-100 py-2.5" onClick={handleRegisterIndividual}>
                Register Individually
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Team Registration Modal */}
      {showTeamModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="fw-bold modal-title">Register Team for {event.eventName}</h5>
                <button type="button" className="btn-close" onClick={() => setShowTeamModal(false)}></button>
              </div>
              <form onSubmit={handleRegisterTeamSubmit}>
                <div className="modal-body">
                  {regMsg.text && (
                    <div className={`alert alert-${regMsg.type} small py-2`} role="alert">
                      {regMsg.text}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Team Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. ApexPredators" 
                      value={teamForm.teamName} 
                      onChange={(e) => setTeamForm({...teamForm, teamName: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="mb-1">
                    <label className="form-label small fw-semibold text-muted">Member Usernames (comma-separated)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. haris, john_doe" 
                      value={teamForm.membersString} 
                      onChange={(e) => setTeamForm({...teamForm, membersString: e.target.value})} 
                      required 
                    />
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Add up to {event.teamLimit - 1} registered student usernames. Exclude your own username.
                  </small>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button type="button" className="btn btn-light border btn-sm" onClick={() => setShowTeamModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-custom btn-sm">Register Team</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
