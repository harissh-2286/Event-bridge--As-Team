import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { authService } from './services/api';

// Lazy-load pages so a broken module only breaks that route, not the whole app
const Home               = lazy(() => import('./pages/Home'));
const Login              = lazy(() => import('./pages/Login'));
const Register           = lazy(() => import('./pages/Register'));
const EventDetails       = lazy(() => import('./pages/EventDetails'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const ParticipantDashboard = lazy(() => import('./pages/ParticipantDashboard'));
const FacultyDashboard   = lazy(() => import('./pages/FacultyDashboard'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));
const ChatRoom           = lazy(() => import('./pages/ChatRoom'));

// ── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center px-3">
          <div className="mb-4">
            <i className="fa-solid fa-triangle-exclamation text-warning" style={{ fontSize: '4rem' }}></i>
          </div>
          <h2 className="fw-bold text-dark mb-2">Something went wrong</h2>
          <p className="text-muted mb-4" style={{ maxWidth: 480 }}>
            {this.state.error?.message || 'An unexpected error occurred. Please refresh the page.'}
          </p>
          <button
            className="btn btn-primary-custom px-4 py-2"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
          >
            Go back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Page loading spinner ────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// ── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);

  const syncUserSession = () => {
    setCurrentUser(authService.getCurrentUser());
    setSessionKey(prev => prev + 1);
  };

  useEffect(() => {
    syncUserSession();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="d-flex flex-column min-vh-100 bg-light">
          <Navbar key={sessionKey} onLogout={syncUserSession} />

          <div className="flex-grow-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login onLogin={syncUserSession} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/event/:id" element={<EventDetails />} />

                {/* Protected Role-Based Dashboards */}
                <Route
                  path="/organizer"
                  element={
                    <PrivateRoute allowedRoles={['ORGANIZER']}>
                      <OrganizerDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/participant"
                  element={
                    <PrivateRoute allowedRoles={['PARTICIPANT']}>
                      <ParticipantDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/faculty"
                  element={
                    <PrivateRoute allowedRoles={['FACULTY']}>
                      <FacultyDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />

                {/* Protected Chat Route */}
                <Route
                  path="/chat"
                  element={
                    <PrivateRoute>
                      <ChatRoom />
                    </PrivateRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
