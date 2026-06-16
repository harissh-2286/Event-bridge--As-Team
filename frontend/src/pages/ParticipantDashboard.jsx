import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { eventService, registrationService, odService, authService } from '../services/api';

const ParticipantDashboard = () => {
  const [activeTab, setActiveTab] = useState('available-events');
  const [events, setEvents] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [myODs, setMyODs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Team Registration Form
  const [teamForm, setTeamForm] = useState({
    eventId: null,
    teamName: '',
    membersString: '', // comma-separated usernames
  });

  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Payment integration states
  const [activePayment, setActivePayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'card'
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleInitiatePayment = (reg) => {
    setActivePayment(reg);
    setPaymentMethod('upi');
    setCardForm({ number: '', expiry: '', cvv: '', name: '' });
    setPaymentLoading(false);
    setPaymentSuccess(false);
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'card') {
      if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
        alert("Please fill in all card details.");
        return;
      }
    }
    
    setPaymentLoading(true);
    setTimeout(async () => {
      try {
        await registrationService.updatePaymentStatus(activePayment.id, 'PAID');
        setPaymentLoading(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          fetchData();
          setActivePayment(null);
        }, 1200);
      } catch (err) {
        setPaymentLoading(false);
        alert(getErrMsg(err, 'Payment failed. Please try again.'));
      }
    }, 1800);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      if (user) {
        setProfile(user);
        
        const eventsData = await eventService.getUpcoming();
        setEvents(eventsData);

        const regsData = await registrationService.getByUser(user.id);
        setMyRegs(regsData);

        const odData = await odService.getStudentRequests();
        setMyODs(odData);
      }
    } catch (err) {
      console.error("Error loading participant dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getErrMsg = (err, fallback = 'An error occurred.') => {
    const data = err?.response?.data;
    if (!data) return err?.message || fallback;
    if (typeof data === 'string') return data;
    return data.message || data.error || fallback;
  };

  const handleRegisterIndividual = async (eventId) => {
    setMsg({ type: '', text: '' });
    try {
      await registrationService.registerIndividual(eventId);
      setMsg({ type: 'success', text: 'Registered successfully! Check your inbox for confirmation.' });
      fetchData();
      setActiveTab('my-registrations');
    } catch (err) {
      alert(getErrMsg(err, 'Failed to register'));
    }
  };

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const usernames = teamForm.membersString
        .split(',')
        .map(u => u.trim())
        .filter(u => u.length > 0);

      await registrationService.registerTeam(teamForm.eventId, {
        teamName: teamForm.teamName,
        memberUsernames: usernames
      });

      setMsg({ type: 'success', text: `Team '${teamForm.teamName}' registered successfully!` });
      setRegisteringEvent(null);
      setTeamForm({ eventId: null, teamName: '', membersString: '' });
      fetchData();
      setActiveTab('my-registrations');
    } catch (err) {
      setMsg({ type: 'danger', text: getErrMsg(err, 'Failed to register team. Check member usernames.') });
    }
  };

  const handleCancelReg = async (regId) => {
    if (window.confirm("Are you sure you want to cancel this registration?")) {
      try {
        await registrationService.cancel(regId);
        fetchData();
      } catch (err) {
        alert(getErrMsg(err, 'Failed to cancel'));
      }
    }
  };

  const handleDownloadOD = async (odId) => {
    try {
      const pdfBlob = await odService.downloadPdf(odId);
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OD_Letter_${odId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Failed to download PDF. Ensure the OD request is approved by faculty first.");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const updated = await authService.updateProfile(profile);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      // Update local storage user details
      const user = authService.getCurrentUser();
      user.fullName = updated.fullName;
      user.email = updated.email;
      localStorage.setItem('user', JSON.stringify(user));
      fetchData();
    } catch (err) {
      setMsg({ type: 'danger', text: getErrMsg(err, 'Failed to update profile.') });
    }
  };

  return (
    <div className="container-fluid fade-in-up">
      <div className="row">
        <div className="col-md-3 col-lg-2 p-0 bg-white shadow-sm">
          <Sidebar role="PARTICIPANT" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="col-md-9 col-lg-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Participant Dashboard</h3>
              <p className="text-muted small">Register for events, request OD approvals, and view notices</p>
            </div>
            <button className="btn btn-primary-custom" onClick={fetchData}>
              <i className="fa-solid fa-rotate me-2"></i> Sync Portal
            </button>
          </div>

          {msg.text && (
            <div className={`alert alert-${msg.type} small py-2 alert-dismissible fade show`} role="alert">
              {msg.text}
              <button type="button" className="btn-close py-2" onClick={() => setMsg({ type: '', text: '' })}></button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Loading registrations & schedules...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Available Events */}
              {activeTab === 'available-events' && (
                <div>
                  <h4 className="fw-bold text-dark mb-3">Available Symposium Events</h4>
                  {events.length === 0 ? (
                    <p className="text-muted text-center py-5">No upcoming events listed at this time.</p>
                  ) : (
                    <div className="row g-4">
                      {events.map(ev => {
                        const isRegistered = myRegs.some(r => r.event.id === ev.id);
                        return (
                          <div key={ev.id} className="col-md-6 col-lg-4">
                            <div className="card h-100 custom-card">
                              <img 
                                src={ev.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop"} 
                                alt={ev.eventName} 
                                className="card-img-top" 
                                style={{ height: '130px', objectFit: 'cover' }}
                              />
                              <div className="card-body p-3">
                                <span className="badge bg-primary-subtle text-primary mb-2">{ev.category}</span>
                                <h6 className="card-title fw-bold mb-1">{ev.eventName}</h6>
                                <p className="text-muted small text-truncate mb-2">{ev.description}</p>
                                <div className="small text-muted mb-1"><i className="fa-solid fa-map-pin me-2"></i>{ev.venue}</div>
                                <div className="small text-muted mb-1"><i className="fa-regular fa-calendar me-2"></i>{ev.eventDate}</div>
                                <div className="small text-muted"><i className="fa-solid fa-indian-rupee-sign me-2"></i>{ev.entryFee > 0 ? `₹${ev.entryFee}` : 'Free'}</div>
                              </div>
                              <div className="card-footer bg-white border-0 p-3">
                                {isRegistered ? (
                                  <button className="btn btn-secondary w-100 btn-sm" disabled>Already Registered</button>
                                ) : ev.teamLimit > 1 ? (
                                  <button className="btn btn-primary-custom w-100 btn-sm" onClick={() => {
                                    setRegisteringEvent(ev);
                                    setTeamForm({ ...teamForm, eventId: ev.id });
                                  }}>
                                    Register Team (Max: {ev.teamLimit})
                                  </button>
                                ) : (
                                  <button className="btn btn-primary-custom w-100 btn-sm" onClick={() => handleRegisterIndividual(ev.id)}>
                                    Register Individually
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Team Registration Modal Inline */}
                  {registeringEvent && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
                          <div className="modal-header border-bottom-0 pb-0">
                            <h5 className="fw-bold modal-title">Team Registration for {registeringEvent.eventName}</h5>
                            <button type="button" className="btn-close" onClick={() => setRegisteringEvent(null)}></button>
                          </div>
                          <form onSubmit={handleRegisterTeam}>
                            <div className="modal-body py-3">
                              <div className="mb-3">
                                <label className="form-label small fw-semibold text-muted">Team Name</label>
                                <input type="text" className="form-control" placeholder="e.g. CyberKnights" value={teamForm.teamName} onChange={(e) => setTeamForm({...teamForm, teamName: e.target.value})} required />
                              </div>
                              <div className="mb-1">
                                <label className="form-label small fw-semibold text-muted">Member Usernames (comma-separated)</label>
                                <input type="text" className="form-control" placeholder="e.g. student2, student3" value={teamForm.membersString} onChange={(e) => setTeamForm({...teamForm, membersString: e.target.value})} required />
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                Add up to {registeringEvent.teamLimit - 1} member usernames. They must be registered accounts on Event Bridge.
                              </small>
                            </div>
                            <div className="modal-footer border-top-0 pt-0">
                              <button type="button" className="btn btn-light border btn-sm" onClick={() => setRegisteringEvent(null)}>Cancel</button>
                              <button type="submit" className="btn btn-primary-custom btn-sm">Submit Team Registration</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Premium Sandbox Payment Modal */}
                  {activePayment && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1050 }}>
                      <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                          
                          {/* Modal Header with Gradient */}
                          <div className="text-white p-4 text-center position-relative" style={{ background: 'var(--primary-gradient)' }}>
                            <h5 className="fw-bold mb-1"><i className="fa-solid fa-shield-halved me-2"></i>Secure Checkout</h5>
                            <p className="small mb-0 opacity-75">{activePayment.event.eventName}</p>
                            <button 
                              type="button" 
                              className="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
                              onClick={() => !paymentLoading && setActivePayment(null)}
                              disabled={paymentLoading}
                            ></button>
                            
                            {/* Total Amount Badge */}
                            <div className="mt-3 bg-white text-dark d-inline-block px-4 py-2 rounded-pill fw-bold shadow-sm" style={{ fontSize: '1.1rem' }}>
                              Amount Due: ₹{activePayment.event.entryFee}
                            </div>
                          </div>

                          {/* Loading Overlay */}
                          {paymentLoading && (
                            <div className="modal-body text-center py-5 d-flex flex-column align-items-center justify-content-center">
                              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem', color: 'var(--primary-color)' }}></div>
                              <h6 className="fw-bold text-dark">Contacting Payment Gateway...</h6>
                              <p className="text-muted small">Please do not refresh or close this window.</p>
                            </div>
                          )}

                          {/* Success Overlay */}
                          {!paymentLoading && paymentSuccess && (
                            <div className="modal-body text-center py-5 d-flex flex-column align-items-center justify-content-center">
                              <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: '70px', height: '70px', fontSize: '2.5rem' }}>
                                <i className="fa-solid fa-check"></i>
                              </div>
                              <h5 className="fw-bold text-success">Payment Success!</h5>
                              <p className="text-muted small mb-0">Your registration is now fully completed.</p>
                            </div>
                          )}

                          {/* Checkout Form */}
                          {!paymentLoading && !paymentSuccess && (
                            <div className="modal-body p-4">
                              {/* Payment Method Select Tabs */}
                              <div className="row g-2 mb-4">
                                <div className="col-6">
                                  <button 
                                    className={`btn w-100 py-2 fw-semibold d-flex flex-column align-items-center justify-content-center border-2 ${paymentMethod === 'upi' ? 'btn-primary-custom border-transparent text-white' : 'btn-light border-light text-muted'}`}
                                    onClick={() => setPaymentMethod('upi')}
                                    style={{ borderRadius: '12px' }}
                                  >
                                    <i className="fa-solid fa-mobile-screen-button mb-1 fs-5"></i>
                                    UPI Scan & Pay
                                  </button>
                                </div>
                                <div className="col-6">
                                  <button 
                                    className={`btn w-100 py-2 fw-semibold d-flex flex-column align-items-center justify-content-center border-2 ${paymentMethod === 'card' ? 'btn-primary-custom border-transparent text-white' : 'btn-light border-light text-muted'}`}
                                    onClick={() => setPaymentMethod('card')}
                                    style={{ borderRadius: '12px' }}
                                  >
                                    <i className="fa-solid fa-credit-card mb-1 fs-5"></i>
                                    Debit/Credit Card
                                  </button>
                                </div>
                              </div>

                              {paymentMethod === 'upi' ? (
                                <div className="text-center">
                                  {/* Dynamic UPI QR Code */}
                                  <div className="bg-white p-3 rounded-4 d-inline-block border shadow-sm mb-3">
                                    <img 
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=8220452286@fam%26pn=EventBridge%26cu=INR%26am=${activePayment.event.entryFee}`}
                                      alt="UPI Payment QR Code"
                                      className="img-fluid"
                                      style={{ width: '180px', height: '180px' }}
                                    />
                                  </div>
                                  
                                  <div className="mb-3">
                                    <span className="small text-muted d-block mb-1">Payable UPI ID:</span>
                                    <span className="fw-bold px-3 py-2 bg-primary-subtle text-primary rounded-3 d-inline-block select-all" style={{ letterSpacing: '0.5px' }}>
                                      8220452286@fam
                                    </span>
                                  </div>

                                  <div className="alert alert-warning py-2 small mb-4 text-start" style={{ borderRadius: '10px' }}>
                                    <i className="fa-solid fa-circle-info me-2 text-warning"></i>
                                    Scan the QR code with GPay/PhonePe/Paytm or copy the UPI ID, make the transfer, and then click the button below.
                                  </div>

                                  <button 
                                    className="btn btn-primary-custom w-100 py-2 mb-2"
                                    onClick={handleConfirmPayment}
                                    style={{ borderRadius: '30px' }}
                                  >
                                    <i className="fa-solid fa-square-check me-2"></i> Confirm UPI Payment
                                  </button>
                                  <button 
                                    className="btn btn-light w-100 btn-sm text-muted"
                                    onClick={() => setActivePayment(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  {/* Premium Card Simulator Form */}
                                  <div className="card text-white p-3 mb-4 shadow" style={{ background: 'linear-gradient(135deg, #320054 0%, #6A0DAD 100%)', borderRadius: '14px', border: 'none' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                      <i className="fa-solid fa-microchip fs-3 text-warning"></i>
                                      <span className="small fw-semibold opacity-75 font-monospace">SANDBOX SIMULATOR</span>
                                    </div>
                                    <div className="fs-5 fw-bold mb-3 font-monospace" style={{ letterSpacing: '2px' }}>
                                      {cardForm.number ? cardForm.number.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <div className="opacity-50" style={{ fontSize: '0.65rem' }}>CARD HOLDER</div>
                                        <div className="small fw-bold text-uppercase">{cardForm.name || 'YOUR NAME'}</div>
                                      </div>
                                      <div>
                                        <div className="opacity-50" style={{ fontSize: '0.65rem' }}>EXPIRES</div>
                                        <div className="small fw-bold font-monospace">{cardForm.expiry || 'MM/YY'}</div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="row g-2">
                                    <div className="col-12 mb-2">
                                      <label className="form-label small fw-semibold text-muted mb-1">Card Holder Name</label>
                                      <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="e.g. ALICE SMITH" 
                                        value={cardForm.name} 
                                        onChange={(e) => setCardForm({ ...cardForm, name: e.target.value.toUpperCase() })} 
                                        required 
                                      />
                                    </div>
                                    <div className="col-12 mb-2">
                                      <label className="form-label small fw-semibold text-muted mb-1">Card Number</label>
                                      <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="16-digit card number" 
                                        maxLength="16"
                                        value={cardForm.number} 
                                        onChange={(e) => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, '') })} 
                                        required 
                                      />
                                    </div>
                                    <div className="col-6 mb-3">
                                      <label className="form-label small fw-semibold text-muted mb-1">Expiry (MM/YY)</label>
                                      <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="MM/YY" 
                                        maxLength="5"
                                        value={cardForm.expiry} 
                                        onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })} 
                                        required 
                                      />
                                    </div>
                                    <div className="col-6 mb-3">
                                      <label className="form-label small fw-semibold text-muted mb-1">CVV</label>
                                      <input 
                                        type="password" 
                                        className="form-control" 
                                        placeholder="•••" 
                                        maxLength="3"
                                        value={cardForm.cvv} 
                                        onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })} 
                                        required 
                                      />
                                    </div>
                                  </div>

                                  <button 
                                    className="btn btn-primary-custom w-100 py-2 mb-2"
                                    onClick={handleConfirmPayment}
                                    style={{ borderRadius: '30px' }}
                                  >
                                    <i className="fa-solid fa-lock me-2"></i> Pay ₹{activePayment.event.entryFee} via Sandbox
                                  </button>
                                  <button 
                                    className="btn btn-light w-100 btn-sm text-muted"
                                    onClick={() => setActivePayment(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: My Registrations */}
              {activeTab === 'my-registrations' && (
                <div className="card custom-card p-4 border-0">
                  <h4 className="fw-bold text-dark mb-3">My Event Signups</h4>
                  {myRegs.length === 0 ? (
                    <p className="text-muted text-center py-4">You have not registered for any events yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Event Name</th>
                            <th>Date / Venue</th>
                            <th>Entry Type</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myRegs.map(reg => (
                            <tr key={reg.id}>
                              <td className="fw-bold">{reg.event.eventName}</td>
                              <td>
                                <div className="small text-dark">{reg.event.eventDate}</div>
                                <span className="text-muted small">{reg.event.venue}</span>
                              </td>
                              <td>{reg.team ? `Team: ${reg.team.teamName}` : 'Individual'}</td>
                              <td>
                                <span className={`badge ${reg.status === 'APPROVED' ? 'bg-success' : reg.status === 'REJECTED' ? 'bg-danger' : 'bg-warning'}`}>
                                  {reg.status}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex flex-column align-items-start gap-1">
                                  <span className={`badge bg-light border ${reg.paymentStatus === 'PAID' ? 'text-success border-success' : 'text-danger border-danger'}`}>
                                    {reg.paymentStatus}
                                  </span>
                                  {reg.paymentStatus === 'PENDING' && reg.event.entryFee > 0 && (
                                    <button 
                                      className="btn btn-primary-custom btn-xs py-1 px-2 mt-1" 
                                      style={{ fontSize: '0.72rem', borderRadius: '6px', padding: '2px 8px' }}
                                      onClick={() => handleInitiatePayment(reg)}
                                    >
                                      <i className="fa-solid fa-credit-card me-1"></i> Pay ₹{reg.event.entryFee}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td>
                                <button className="btn btn-light btn-sm text-danger border" onClick={() => handleCancelReg(reg.id)}>
                                  Cancel
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

              {/* Tab 3: My OD Letters */}
              {activeTab === 'my-od' && (
                <div className="card custom-card p-4 border-0">
                  <h4 className="fw-bold text-dark mb-3">On-Duty letters</h4>
                  <p className="text-muted small mb-4">Approved registrations generate OD letters automatically. Faculty members review and approve letters.</p>
                  {myODs.length === 0 ? (
                    <p className="text-muted text-center py-4">No OD letters requested or generated yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>OD ID</th>
                            <th>Event Name</th>
                            <th>Requested Date</th>
                            <th>Faculty Advisor</th>
                            <th>OD Status</th>
                            <th>Download</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myODs.map(od => (
                            <tr key={od.id}>
                              <td className="fw-bold">OD-{od.id}</td>
                              <td>{od.event.eventName}</td>
                              <td>{new Date(od.dateRequested).toLocaleDateString()}</td>
                              <td>{od.faculty ? od.faculty.fullName : 'Pending assignment'}</td>
                              <td>
                                <span className={`badge ${od.approvalStatus === 'APPROVED' ? 'bg-success' : od.approvalStatus === 'REJECTED' ? 'bg-danger' : 'bg-warning'}`}>
                                  {od.approvalStatus}
                                </span>
                              </td>
                              <td>
                                <button 
                                  className="btn btn-primary-custom btn-sm px-3"
                                  disabled={od.approvalStatus !== 'APPROVED'}
                                  onClick={() => handleDownloadOD(od.id)}
                                >
                                  <i className="fa-solid fa-file-pdf me-2"></i> PDF
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

              {/* Tab 4: Profile */}
              {activeTab === 'profile' && profile && (
                <div className="card custom-card p-4 border-0 max-width-600">
                  <h4 className="fw-bold mb-4 text-dark">Profile Settings</h4>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Full Name</label>
                      <input type="text" className="form-control" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Email Address</label>
                      <input type="email" className="form-control" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Register Number</label>
                      <input type="text" className="form-control" value={profile.registerNumber || ''} disabled />
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-semibold text-muted">Department</label>
                      <input type="text" className="form-control" value={profile.department || ''} disabled />
                    </div>
                    <button type="submit" className="btn btn-primary-custom px-4">Update Profile</button>
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

export default ParticipantDashboard;
