// LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/LoginPage.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleLogin = async () => {
    setError('');
    const { email, password } = formData;

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // ✅ UPDATED BACKEND URL HERE
      const backendUrl = 'https://my-career-point-updated.onrender.com';
      // const backendUrl = 'http://localhost:5000';
      
      const loginPayload = { email, password };
      console.log('🔐 Attempting login with email:', email);
      
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Role not sent — backend will determine it based on existing user
        body: JSON.stringify(loginPayload)
      });


      const data = await response.json();
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data:', data);
      
      if (!response.ok) {
        // More detailed error logging
        console.error('❌ Login failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          message: data.message,
          details: data.details || data
        });
        setError(data.error || data.message || data.details || `Login failed (${response.status}): ${response.statusText}`);
      } else {
        // ✅ Backend returns user details including role
        const { token, user } = data;
        console.log('Login successful. User details:', user);

        if (!user || !user.role) {
          setError('Invalid user data received from server.');
          return;
        }

        // --- START NEW LOGIC FOR SESSION MANAGEMENT ---
        // 1. Always store the token, user role, and user data in sessionStorage (for current session)
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('userRole', user.role);
        sessionStorage.setItem('userData', JSON.stringify(user)); // Store complete user object

        // 2. Only use localStorage if 'Remember me' is checked (for persistent storage)
        if (formData.rememberMe) {
          localStorage.setItem('authToken', token);
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('userData', JSON.stringify(user)); // Store complete user object
        }
        // --- END NEW LOGIC FOR SESSION MANAGEMENT ---

        console.log(`Logged in as ${user.role}`);

        // ✅ Pass full user object and role to dashboard
        // Note: The role in state will be used for the initial render,
        // but the token/role in storage will handle refreshes.
        navigate('/dashboard', { state: { role: user.role, user } });
      }
    } catch (err) {
      console.error('❌ Network or parsing error:', err);
      setError(`Network error: ${err.message}. Please check your connection and backend availability.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Navbar */}
      <nav className="login-navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <div className="navbar-logo-wrapper">
              <img
                src="/logo/logo.jpg"
                alt="My Career Point Logo"
                className="navbar-logo"
                onError={(e) => {
                  e.target.src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="%23E91E63"/></svg>';
                }}
              />
            </div>
            <span className="navbar-title">My Career Point</span>
          </div>
          <div className="navbar-actions">
            <span className="navbar-text">Don't have an account?</span>
            <button className="btn btn-outline btn-sm">Sign Up</button>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <main className="login-main">
        <div className="login-container">
          {/* Left Section */}
          <div className="login-branding">
            <div className="branding-content">
              <div className="branding-logo">
                <img
                  src="/logo/logo.jpg"
                  alt="My Career Point"
                  className="branding-logo-img"
                  onError={(e) => {
                    e.target.src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><circle cx="60" cy="60" r="50" fill="%23E91E63"/></svg>';
                  }}
                />
              </div>
              <h1 className="branding-title">
                Welcome to <span className="gradient-text">My Career Point</span>
              </h1>
              <p className="branding-subtitle">
                Professional Learning Management System for your educational journey
              </p>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="login-form-section">
            <div className="login-card">
              <div className="login-card-header">
                <h2 className="login-title">Sign In</h2>
                <p className="login-subtitle">Enter your credentials to access your account</p>
              </div>

              {error && (
                <div className="alert alert-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form className="login-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="form-input"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="checkbox-input"
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#forgot" className="forgot-password">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '15px' }}
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="login-footer">
                <p>
                  Don’t have an account?{' '}
                  <a href="#signup" className="signup-link">Create one now</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;