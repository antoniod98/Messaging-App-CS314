import { useState } from 'react';

// modal dialog for creating a new chat room
const CreateRoomModal = ({ isOpen, onClose, onCreateRoom, isCreating }) => {
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');

  const minLength = 3;
  const maxLength = 50;

  // handle room name input change
  const handleChange = (e) => {
    const value = e.target.value;
    setRoomName(value);

    // clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  // validate room name
  const validate = () => {
    const trimmed = roomName.trim();

    if (trimmed.length === 0) {
      setError('Room name is required');
      return false;
    }

    if (trimmed.length < minLength) {
      setError(`Room name must be at least ${minLength} characters`);
      return false;
    }

    if (trimmed.length > maxLength) {
      setError(`Room name cannot exceed ${maxLength} characters`);
      return false;
    }

    return true;
  };

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const success = await onCreateRoom(roomName.trim());

    // close modal and reset form on success
    if (success) {
      setRoomName('');
      setError('');
      onClose();
    }
  };

  // handle modal close
  const handleClose = () => {
    setRoomName('');
    setError('');
    onClose();
  };

  // don't render if not open
  if (!isOpen) {
    return null;
  }

  const characterCount = roomName.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* modal header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Create New Room</h2>
          <button style={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="roomName" style={styles.label}>
              Room Name
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(error ? styles.inputError : {}),
              }}
              placeholder="Enter room name"
              disabled={isCreating}
              autoFocus
              maxLength={maxLength}
            />

            {/* character counter */}
            {isNearLimit && (
              <div style={styles.counterContainer}>
                <span
                  style={{
                    ...styles.counter,
                    ...(characterCount === maxLength ? styles.counterMax : {}),
                  }}
                >
                  {characterCount} / {maxLength}
                </span>
              </div>
            )}

            {/* error message */}
            {error && <span style={styles.errorText}>{error}</span>}
          </div>

          {/* buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.createButton,
                ...(isCreating ? styles.createButtonDisabled : {}),
              }}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
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
  form: {
    padding: '24px',
  },
  inputGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: 'none',
    borderRadius: '6px',
    outline: 'none',
    transition: 'background-color 0.2s',
    boxSizing: 'border-box',
    backgroundColor: '#0a0a0a',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inputError: {
    backgroundColor: 'rgba(237, 66, 69, 0.1)',
    border: '1px solid #ed4245',
  },
  counterContainer: {
    marginTop: '6px',
    textAlign: 'right',
  },
  counter: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  counterMax: {
    color: '#ed4245',
    fontWeight: '600',
  },
  errorText: {
    display: 'block',
    fontSize: '12px',
    color: '#ed4245',
    marginTop: '6px',
    fontWeight: '500',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  createButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#5865f2',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  createButtonDisabled: {
    backgroundColor: '#4e5058',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};

export default CreateRoomModal;
