import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8747';

// Modal for searching and selecting users to invite or DM
const UserSearchModal = ({ isOpen, onClose, onSelectUser, mode = 'dm', currentRoomParticipants = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Search for users
  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setUsers([]);
      return;
    }

    try {
      setIsSearching(true);
      setError('');

      const response = await axios.get(`${API_URL}/api/users/search`, {
        headers: getAuthHeaders(),
        params: { q: query },
      });

      if (response.data.success) {
        // Filter out users already in the room if mode is invite
        let filteredUsers = response.data.users;
        if (mode === 'invite' && currentRoomParticipants.length > 0) {
          const participantIds = currentRoomParticipants.map(p => p.id);
          filteredUsers = filteredUsers.filter(u => !participantIds.includes(u.id));
        }
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search users');
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    onSelectUser(user);
    onClose();
    setSearchQuery('');
    setUsers([]);
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setUsers([]);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {mode === 'dm' ? 'Start Direct Message' : 'Invite User to Room'}
          </h2>
          <button style={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        {/* Search Input */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email..."
            style={styles.searchInput}
            autoFocus
          />
        </div>

        {/* Results */}
        <div style={styles.resultsContainer}>
          {error && <div style={styles.error}>{error}</div>}

          {isSearching && (
            <div style={styles.loading}>Searching...</div>
          )}

          {!isSearching && searchQuery.length >= 2 && users.length === 0 && (
            <div style={styles.noResults}>No users found</div>
          )}

          {!isSearching && searchQuery.length < 2 && (
            <div style={styles.hint}>Type at least 2 characters to search</div>
          )}

          {!isSearching && users.length > 0 && (
            <div style={styles.userList}>
              {users.map((user) => (
                <div
                  key={user.id}
                  style={styles.userItem}
                  onClick={() => handleSelectUser(user)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={styles.userAvatar}>
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={styles.userEmail}>{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.15s ease',
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '440px',
    maxHeight: '600px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    animation: 'slideUp 0.2s ease-out',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '24px',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'color 0.2s, background-color 0.2s',
  },
  searchContainer: {
    padding: '16px 20px',
    backgroundColor: '#1a1a1a',
  },
  searchInput: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: 'none',
    borderRadius: '6px',
    outline: 'none',
    transition: 'background-color 0.2s',
    backgroundColor: '#0a0a0a',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  resultsContainer: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#1a1a1a',
  },
  loading: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },
  noResults: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },
  hint: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '13px',
  },
  error: {
    textAlign: 'center',
    padding: '20px',
    color: '#ed4245',
    fontSize: '14px',
  },
  userList: {
    padding: '8px 0',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    gap: '12px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#5865f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '15px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '2px',
  },
  userEmail: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

export default UserSearchModal;
