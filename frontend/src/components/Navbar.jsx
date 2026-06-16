import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService, notificationService } from '../services/api';

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (currentUser) {
      try {
        const data = await notificationService.getUserNotifications();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 10 seconds for standard live updates (fallback to WS)
    const timer = setInterval(fetchNotifications, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    if (onLogout) onLogout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/';
    switch (currentUser.role) {
      case 'ADMIN': return '/admin';
      case 'ORGANIZER': return '/organizer';
      case 'FACULTY': return '/faculty';
      case 'PARTICIPANT': return '/participant';
      default: return '/';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light custom-navbar sticky-top py-3">
      <div className="container">
        <Link className="navbar-brand navbar-brand-custom d-flex align-items-center gap-2" to="/">
          <i className="fa-solid fa-bridge-water text-primary"></i>
          <span>Event Bridge</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-center">
            <li className="nav-item">
              <Link className={`nav-link fw-semibold px-3 ${location.pathname === '/' ? 'text-primary' : ''}`} to="/">Home</Link>
            </li>
            {currentUser && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link fw-semibold px-3 ${location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/organizer') || location.pathname.startsWith('/participant') || location.pathname.startsWith('/faculty') || location.pathname.startsWith('/admin') ? 'text-primary' : ''}`} to={getDashboardPath()}>Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link fw-semibold px-3 ${location.pathname === '/chat' ? 'text-primary' : ''}`} to="/chat">
                    <i className="fa-regular fa-comments me-1"></i> Messages
                  </Link>
                </li>
              </>
            )}
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            {currentUser ? (
              <>
                {/* Notifications Dropdown */}
                <div className="dropdown position-relative">
                  <button className="btn btn-link nav-link position-relative p-2" type="button" id="notificationDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="fa-regular fa-bell fs-5 text-dark"></i>
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end py-2 shadow border-0" aria-labelledby="notificationDropdown" style={{ width: '320px', maxHeight: '400px', overflowY: 'auto', borderRadius: '12px' }}>
                    <div className="px-3 py-2 d-flex justify-content-between align-items-center border-bottom">
                      <span className="fw-bold text-dark">Notifications</span>
                      {unreadCount > 0 && (
                        <button className="btn btn-sm btn-link p-0 text-primary fw-semibold text-decoration-none" onClick={handleMarkAllRead}>
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <li className="px-3 py-4 text-center text-muted">No notifications yet</li>
                    ) : (
                      notifications.map(n => (
                        <li key={n.id} className={`px-3 py-2 border-bottom position-relative ${!n.isRead ? 'bg-light' : ''}`} style={{ cursor: 'pointer' }} onClick={() => !n.isRead && handleMarkAsRead(n.id)}>
                          <p className="mb-1 small text-dark">{n.message}</p>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!n.isRead && (
                            <span className="position-absolute end-0 top-50 translate-middle-y me-3 badge rounded-pill bg-primary" style={{ width: '8px', height: '8px', padding: 0 }}> </span>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                {/* Profile Badge & Dropdown */}
                <div className="dropdown">
                  <button className="btn btn-light dropdown-toggle d-flex align-items-center gap-2 border px-3 py-2" type="button" id="userMenu" data-bs-toggle="dropdown" style={{ borderRadius: '20px' }}>
                    <div className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle" style={{ width: '28px', height: '28px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '100px' }}>{currentUser.fullName}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" aria-labelledby="userMenu" style={{ borderRadius: '12px' }}>
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-bold">{currentUser.fullName}</div>
                      <div className="text-muted small">Role: <span className="badge bg-secondary">{currentUser.role}</span></div>
                    </div>
                    <li><Link className="dropdown-menu-item dropdown-item py-2" to={getDashboardPath()}>Dashboard</Link></li>
                    <li><button className="dropdown-item py-2 text-danger fw-semibold" onClick={handleLogout}>Logout</button></li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Link className="btn btn-link text-decoration-none fw-semibold text-dark" to="/login">Login</Link>
                <Link className="btn btn-primary-custom" to="/register">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
