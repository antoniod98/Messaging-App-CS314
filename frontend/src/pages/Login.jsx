import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/chat');
    } else {
      setServerError(result.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMessage('Please enter your email address');
      return;
    }

    // Simulated password reset (you'll need to implement this on backend)
    setResetMessage('If an account exists with this email, you will receive password reset instructions.');
    setTimeout(() => {
      setShowForgotPassword(false);
      setResetEmail('');
      setResetMessage('');
    }, 3000);
  };

  return (
    <div style={styles.container}>
      {/* Background Grid */}
      <div style={styles.gridOverlay}>
        <div style={styles.gridLine}></div>
        <div style={{...styles.gridLine, left: '33%'}}></div>
        <div style={{...styles.gridLine, left: '66%'}}></div>
      </div>

      {/* Back to Home */}
      <button style={styles.homeBtn} onClick={() => navigate('/')}>
        ← Back to Home
      </button>

      {/* Login Card */}
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>RELAY</div>
        </div>

        {!showForgotPassword ? (
          <>
            <h1 style={styles.title}>Welcome Back</h1>
            <p style={styles.subtitle}>Sign in to continue to your account</p>

            {serverError && <div style={styles.errorBanner}>{serverError}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label htmlFor="email" style={styles.label}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(errors.email ? styles.inputError : {}),
                  }}
                  disabled={loading}
                  autoComplete="email"
                  placeholder="name@company.com"
                />
                {errors.email && <span style={styles.errorText}>{errors.email}</span>}
              </div>

              <div style={styles.inputGroup}>
                <div style={styles.labelRow}>
                  <label htmlFor="password" style={styles.label}>
                    Password
                  </label>
                  <button
                    type="button"
                    style={styles.forgotLink}
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(errors.password ? styles.inputError : {}),
                  }}
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <span style={styles.errorText}>{errors.password}</span>
                )}
              </div>

              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerText}>or</span>
            </div>

            <p style={styles.footer}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.link}>
                Create account
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Reset Password</h1>
            <p style={styles.subtitle}>Enter your email to receive reset instructions</p>

            {resetMessage && <div style={styles.successBanner}>{resetMessage}</div>}

            <form onSubmit={handleForgotPassword} style={styles.form}>
              <div style={styles.inputGroup}>
                <label htmlFor="resetEmail" style={styles.label}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={styles.input}
                  placeholder="name@company.com"
                />
              </div>

              <button type="submit" style={styles.submitButton}>
                Send Reset Link
              </button>
            </form>

            <button
              style={styles.backButton}
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetMessage('');
              }}
            >
              ← Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, rgba(110, 168, 254, 0.16) 0%, transparent 34%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08) 0%, transparent 30%), linear-gradient(180deg, #06070b 0%, #0b1020 48%, #090a0d 100%)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },

  // Background Grid
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    pointerEvents: 'none',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '1px',
    background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
    left: '0',
  },

  // Home Button
  homeBtn: {
    position: 'absolute',
    top: '40px',
    left: '40px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(16px)',
  },

  // Card
  card: {
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.03) 100%)',
    padding: '48px',
    borderRadius: '28px',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    width: '100%',
    maxWidth: '440px',
    position: 'relative',
    zIndex: 10,
    animation: 'fadeIn 0.5s ease-out',
    backdropFilter: 'blur(26px)',
    WebkitBackdropFilter: 'blur(26px)',
    boxShadow: '0 30px 90px rgba(0, 0, 0, 0.32)',
  },

  logoContainer: {
    textAlign: 'center',
    marginBottom: '32px',
  },

  logo: {
    display: 'inline-block',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '3px',
    color: '#ffffff',
    padding: '12px 24px',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: '999px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  title: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#ffffff',
    textAlign: 'center',
  },

  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: '32px',
    fontSize: '15px',
  },

  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '14px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    fontSize: '14px',
  },

  successBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    padding: '14px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    fontSize: '14px',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },

  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },

  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
  },

  forgotLink: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '13px',
    fontWeight: '500',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.2s ease',
  },

  input: {
    padding: '14px 16px',
    fontSize: '15px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(10, 14, 24, 0.72)',
    color: '#ffffff',
    backdropFilter: 'blur(12px)',
  },

  inputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },

  errorText: {
    color: '#ef4444',
    fontSize: '13px',
    marginTop: '6px',
    fontWeight: '500',
  },

  submitButton: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    background: 'linear-gradient(135deg, rgba(129, 193, 255, 0.95) 0%, rgba(72, 125, 255, 0.88) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '999px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 18px 40px rgba(72, 125, 255, 0.26)',
  },

  buttonDisabled: {
    backgroundColor: '#444444',
    color: '#888888',
    cursor: 'not-allowed',
  },

  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '24px 0',
  },

  dividerText: {
    position: 'relative',
    display: 'inline-block',
    padding: '0 16px',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '13px',
    backgroundColor: 'rgba(20, 24, 36, 0.86)',
    zIndex: 1,
  },

  footer: {
    textAlign: 'center',
    marginTop: '24px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },

  link: {
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'opacity 0.2s',
  },

  backButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '999px',
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(12px)',
  },
};

export default Login;
