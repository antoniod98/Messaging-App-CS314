import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Chat Application</h1>
        <div style={styles.userInfo}>
          <span style={styles.userName}>
            Welcome, {user?.firstName} {user?.lastName}!
          </span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.placeholder}>
          <h2>Chat Interface Coming Soon</h2>
          <p>Sprint 2 will implement:</p>
          <ul style={styles.featureList}>
            <li>Chat room list</li>
            <li>Real-time messaging with Socket.IO</li>
            <li>Message history</li>
            <li>Room creation and management</li>
          </ul>
          <p style={styles.authSuccess}>
            Authentication is working! You are logged in as:{' '}
            <strong>{user?.email}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#333',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userName: {
    color: '#666',
    fontSize: '14px',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  content: {
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    backgroundColor: 'white',
    padding: '60px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '600px',
  },
  featureList: {
    textAlign: 'left',
    display: 'inline-block',
    marginTop: '20px',
    marginBottom: '30px',
  },
  authSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '15px',
    borderRadius: '4px',
    marginTop: '20px',
  },
};

export default Chat;
