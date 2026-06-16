import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'PARTICIPANT',
    fullName: '',
    registerNumber: '',
    department: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess(false);

    if (
      formData.role === 'PARTICIPANT' &&
      !formData.registerNumber.trim()
    ) {
      setError('Register number is required for students.');
      setLoading(false);
      return;
    }

    try {
      await authService.register(formData);

      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.log(err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string'
          ? err.response.data
          : null) ||
        'Registration failed. Please try again.';

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 mt-4 fade-in-up">
      <div className="row justify-content-center">

        <div className="col-md-6 col-lg-5">

          <div className="card custom-card p-4 p-md-5">

            <div className="text-center mb-4">
              <h3>Create Account</h3>
              <p className="text-muted">
                Join Event Bridge
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                Registration successful! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="mb-3">
                <label>Full Name</label>

                <input
                  type="text"
                  name="fullName"
                  className="form-control"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Username</label>

                <input
                  type="text"
                  name="username"
                  className="form-control"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Role</label>

                <select
                  name="role"
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="PARTICIPANT">
                    Student Participant
                  </option>

                  <option value="ORGANIZER">
                    Organizer
                  </option>

                  <option value="FACULTY">
                    Faculty
                  </option>
                </select>
              </div>

              {formData.role === 'PARTICIPANT' && (
                <div className="mb-3">
                  <label>Register Number</label>

                  <input
                    type="text"
                    name="registerNumber"
                    className="form-control"
                    value={formData.registerNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label>Department</label>

                <input
                  type="text"
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading
                  ? 'Creating Account...'
                  : 'Register'}
              </button>

            </form>

            <div className="text-center mt-3">
              Already have an account?

              <Link
                to="/login"
                className="ms-2"
              >
                Login
              </Link>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Register;