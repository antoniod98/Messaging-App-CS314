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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #e1e8ed',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#14171a',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '28px',
    color: '#657786',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background-color 0.2s',
  },
  form: {
    padding: '24px',
  },
  inputGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#14171a',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#e0245e',
  },
  counterContainer: {
    marginTop: '4px',
    textAlign: 'right',
  },
  counter: {
    fontSize: '13px',
    color: '#657786',
  },
  counterMax: {
    color: '#e0245e',
    fontWeight: '600',
  },
  errorText: {
    display: 'block',
    fontSize: '13px',
    color: '#e0245e',
    marginTop: '4px',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#14171a',
    backgroundColor: 'transparent',
    border: '1px solid #e1e8ed',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  createButton: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#1da1f2',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  createButtonDisabled: {
    backgroundColor: '#aab8c2',
    cursor: 'not-allowed',
  },
};

export default CreateRoomModal;
