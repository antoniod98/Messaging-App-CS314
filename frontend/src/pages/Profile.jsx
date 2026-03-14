import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// API base URL from environment variables
const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8747';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // validation: check required fields
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.put(
        `${API_URL}/api/users/profile`,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        // update local storage with new token
        localStorage.setItem('token', response.data.token);

        // update auth context with new user data
        updateUser(response.data.user);

        setSuccess(true);

        // redirect to chat after 1.5 seconds
        setTimeout(() => {
          navigate('/chat');
        }, 1500);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // handle cancel button
  const handleCancel = () => {
    navigate('/chat');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Edit Profile</h1>
        <p style={styles.subtitle}>Update your first and last name</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* current email (read-only) */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email (cannot be changed)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{ ...styles.input, ...styles.inputDisabled }}
            />
          </div>

          {/* first name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              First Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              disabled={isSubmitting}
              style={styles.input}
              maxLength={50}
              required
            />
          </div>

          {/* last name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Last Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              disabled={isSubmitting}
              style={styles.input}
              maxLength={50}
              required
            />
          </div>

          {/* error message */}
          {error && <div style={styles.error}>{error}</div>}

          {/* success message */}
          {success && (
            <div style={styles.success}>
              Profile updated successfully! Redirecting...
            </div>
          )}

          {/* buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{ ...styles.button, ...styles.buttonSecondary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isSubmitting ? styles.buttonDisabled : {}),
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '40px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  required: {
    color: '#ed4245',
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: 'none',
    borderRadius: '6px',
    outline: 'none',
    transition: 'background-color 0.2s',
    backgroundColor: '#0a0a0a',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inputDisabled: {
    backgroundColor: '#2a2a2a',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'not-allowed',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px',
  },
  button: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonPrimary: {
    color: '#ffffff',
    backgroundColor: '#5865f2',
  },
  buttonSecondary: {
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'transparent',
    border: 'none',
  },
  buttonDisabled: {
    backgroundColor: '#4e5058',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  error: {
    padding: '12px 14px',
    backgroundColor: 'rgba(237, 66, 69, 0.1)',
    color: '#ed4245',
    borderRadius: '6px',
    fontSize: '14px',
    border: '1px solid #ed4245',
  },
  success: {
    padding: '12px 14px',
    backgroundColor: 'rgba(35, 165, 89, 0.1)',
    color: '#23a559',
    borderRadius: '6px',
    fontSize: '14px',
    border: '1px solid #23a559',
  },
};

export default Profile;
