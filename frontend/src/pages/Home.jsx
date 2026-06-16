import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/api';

const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Statistics
  const [stats, setStats] = useState({
    eventsCount: 15,
    studentsCount: 350,
    facultyCount: 28,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getUpcoming();
        setUpcomingEvents(data);
        setFilteredEvents(data);
        
        // Fetch real stats from API
        try {
          const apiStats = await eventService.getStats();
          setStats({
            eventsCount: apiStats.totalEvents || 15,
            studentsCount: apiStats.totalRegistrations || 350,
            facultyCount: 18,
          });
        } catch (e) {
          // fallback to defaults if stats endpoint fails
        }
      } catch (err) {
        console.error("Error loading home page events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterEvents(query, selectedCategory);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    filterEvents(searchQuery, category);
  };

  const filterEvents = (query, category) => {
    let filtered = upcomingEvents;
    
    if (query) {
      filtered = filtered.filter(e => 
        e.eventName.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase()) ||
        e.venue.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (category && category !== 'All') {
      filtered = filtered.filter(e => e.category === category);
    }
    
    setFilteredEvents(filtered);
  };

  const categories = ['All', 'Technical', 'Non-Technical', 'Sports', 'Cultural'];

  return (
    <div className="fade-in-up">
      {/* Hero Banner */}
      <section className="hero-section text-center text-lg-start">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <span className="badge bg-primary-subtle text-primary mb-3 px-3 py-2 rounded-pill fw-semibold">
                Excel in Collaboration
              </span>
              <h1 className="display-4 fw-extrabold text-dark mb-3" style={{ fontWeight: 800 }}>
                Connect, Compete & Elevate with <span className="text-primary">Event Bridge</span>
              </h1>
              <p className="lead text-muted mb-4">
                The ultimate college portal for managing technical symposiums, cultural nights, sports tournaments, and real-time announcements.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                <Link to="/register" className="btn btn-primary-custom px-4 py-3">Get Started Now</Link>
                <a href="#events-section" className="btn btn-secondary-custom px-4 py-3">Explore Events</a>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="p-2 bg-white rounded-4 shadow-lg position-relative" style={{ maxWidth: '90%', margin: '0 auto' }}>
                <img 
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop" 
                  alt="College Event Management" 
                  className="img-fluid rounded-4" 
                  style={{ width: '100%', height: '350px', objectFit: 'cover' }}
                />
                <div className="position-absolute bottom-0 start-0 bg-white p-3 shadow rounded-3 m-3 d-none d-md-flex align-items-center gap-2">
                  <i className="fa-solid fa-circle-check text-success fs-4"></i>
                  <div className="text-start">
                    <h6 className="mb-0 fw-bold">Live Status</h6>
                    <small className="text-muted">Instant OD approvals</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories & Search Bar */}
      <section id="events-section" className="py-5">
        <div className="container">
          <div className="row justify-content-between align-items-center mb-4 g-3">
            <div className="col-md-6">
              <h2 className="fw-bold mb-0">Upcoming Events</h2>
              <p className="text-muted mb-0">Discover activities happening inside the campus</p>
            </div>
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="fa-solid fa-magnifying-glass text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  placeholder="Search by event, description, venue..." 
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>

          {/* Category Badges */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn rounded-pill px-4 ${selectedCategory === cat ? 'btn-primary-custom' : 'btn-light border text-dark'}`}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Event Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-4 shadow-sm">
              <i className="fa-solid fa-calendar-xmark text-muted fs-1 mb-3"></i>
              <h5 className="fw-bold">No Events Found</h5>
              <p className="text-muted">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {filteredEvents.map(event => (
                <div key={event.id} className="col">
                  <div className="card h-100 custom-card">
                    <img 
                      src={event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop"} 
                      alt={event.eventName} 
                      className="card-img-top" 
                      style={{ height: '180px', objectFit: 'cover' }}
                    />
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-primary-subtle text-primary">{event.category}</span>
                        <span className="text-muted small fw-semibold">
                          <i className="fa-regular fa-clock me-1"></i> {event.eventTime}
                        </span>
                      </div>
                      <h5 className="card-title fw-bold text-dark">{event.eventName}</h5>
                      <p className="card-text text-muted text-truncate-2" style={{ height: '48px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {event.description}
                      </p>
                      
                      <div className="border-top pt-3 mt-3">
                        <div className="d-flex justify-content-between text-muted small mb-2">
                          <span><i className="fa-solid fa-map-pin me-1"></i> {event.venue}</span>
                          <span><i className="fa-regular fa-calendar-days me-1"></i> {event.eventDate}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-primary">
                            {event.entryFee > 0 ? `₹${event.entryFee}` : 'Free Entry'}
                          </span>
                          <span className="text-muted small">
                            Max Team: <strong>{event.teamLimit}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-white border-0 px-4 pb-4 pt-0">
                      <Link to={`/event/${event.id}`} className="btn btn-primary-custom w-100 py-2">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="p-4">
                <i className="fa-solid fa-calendar-check text-primary fs-1 mb-3"></i>
                <h2 className="fw-extrabold mb-1" style={{ fontWeight: 800 }}>{stats.eventsCount}+</h2>
                <p className="text-muted mb-0">Total Active Events</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4">
                <i className="fa-solid fa-users text-primary fs-1 mb-3"></i>
                <h2 className="fw-extrabold mb-1" style={{ fontWeight: 800 }}>{stats.studentsCount}+</h2>
                <p className="text-muted mb-0">Student Registrations</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4">
                <i className="fa-solid fa-chalkboard-user text-primary fs-1 mb-3"></i>
                <h2 className="fw-extrabold mb-1" style={{ fontWeight: 800 }}>{stats.facultyCount}+</h2>
                <p className="text-muted mb-0">Faculty Advisors</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="fa-solid fa-bridge-water"></i> Event Bridge
              </h5>
              <p className="text-muted small">
                Connecting students, faculty, and organizers on a single, real-time college hub.
              </p>
            </div>
            <div className="col-md-4 col-lg-3 offset-lg-1">
              <h6 className="fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2">
                <li><Link to="/" className="text-muted text-decoration-none">Home</Link></li>
                <li><a href="#events-section" className="text-muted text-decoration-none">Symposiums</a></li>
                <li><Link to="/register" className="text-muted text-decoration-none">Join as Student</Link></li>
                <li><Link to="/login" className="text-muted text-decoration-none">Faculty Login</Link></li>
              </ul>
            </div>
            <div className="col-md-4 col-lg-3">
              <h6 className="fw-bold mb-3">Contact Support</h6>
              <p className="text-muted small mb-1">Email: support@eventbridge.edu</p>
              <p className="text-muted small">Phone: +91 98765 43210</p>
            </div>
          </div>
          <div className="border-top border-secondary pt-4 mt-4 text-center small text-muted">
            <p className="mb-0">© {new Date().getFullYear()} Event Bridge Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
