import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(username, password);
      if (onLogin) onLogin();
      
      // Navigate to respective dashboard
      switch (data.role) {
        case 'ADMIN': navigate('/admin'); break;
        case 'ORGANIZER': navigate('/organizer'); break;
        case 'FACULTY': navigate('/faculty'); break;
        case 'PARTICIPANT': navigate('/participant'); break;
        default: navigate('/');
      }
    } catch (err) {
      setError(err.response?.data || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 mt-5 fade-in-up">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card custom-card p-4 p-md-5">
            <div className="text-center mb-4">
              <i className="fa-solid fa-bridge-water text-primary fs-1 mb-2"></i>
              <h3 className="fw-bold">Sign In</h3>
              <p className="text-muted small">Access your Event Bridge dashboard</p>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <div className="small">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-muted">Username</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="fa-regular fa-user text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control bg-light border-start-0" 
                    placeholder="Enter username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small text-muted">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="fa-solid fa-lock text-muted"></i>
                  </span>
                  <input 
                    type="password" 
                    className="form-control bg-light border-start-0" 
                    placeholder="Enter password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary-custom w-100 py-2.5 d-flex justify-content-center align-items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="text-muted small">Don't have an account? </span>
              <Link to="/register" className="small fw-semibold text-primary text-decoration-none">
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
