import { useState } from 'react';

const MAX_ROOM_IMAGE_BYTES = 2 * 1024 * 1024;

// modal dialog for creating a new chat room
const CreateRoomModal = ({ isOpen, onClose, onCreateRoom, isCreating }) => {
  const [roomName, setRoomName] = useState('');
  const [roomImage, setRoomImage] = useState(null);
  const [roomImagePreview, setRoomImagePreview] = useState(null);
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

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read the selected image'));
      reader.readAsDataURL(file);
    });

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for the room');
      return;
    }

    if (file.size > MAX_ROOM_IMAGE_BYTES) {
      setError('Room image must be 2MB or smaller');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setRoomImage(dataUrl);
      setRoomImagePreview(dataUrl);
      setError('');
    } catch (fileError) {
      setError(fileError.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setRoomImage(null);
    setRoomImagePreview(null);
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

    const success = await onCreateRoom(roomName.trim(), roomImage);

    // close modal and reset form on success
    if (success) {
      setRoomName('');
      setRoomImage(null);
      setRoomImagePreview(null);
      setError('');
      onClose();
    }
  };

  // handle modal close
  const handleClose = () => {
    setRoomName('');
    setRoomImage(null);
    setRoomImagePreview(null);
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
          <div style={styles.imageSection}>
            <div style={styles.imagePreview}>
              {roomImagePreview ? (
                <img src={roomImagePreview} alt="Room preview" style={styles.imagePreviewImg} />
              ) : (
                <div style={styles.imageFallback}>
                  {(roomName.trim().charAt(0) || '#').toUpperCase()}
                </div>
              )}
            </div>

            <div style={styles.imageActions}>
              <label style={styles.uploadButton}>
                Upload Room Image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={isCreating}
                  style={styles.hiddenInput}
                />
              </label>
              <button
                type="button"
                style={{
                  ...styles.removeImageButton,
                  ...(!roomImagePreview ? styles.removeImageButtonDisabled : {}),
                }}
                onClick={handleRemoveImage}
                disabled={!roomImagePreview || isCreating}
              >
                Remove Image
              </button>
              <span style={styles.imageHelper}>Optional. PNG, JPG, WEBP, or GIF up to 2MB.</span>
            </div>
          </div>

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
  imageSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#111111',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  imagePreview: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#2a2a2a',
  },
  imagePreviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #3b3b3b 0%, #1f1f1f 100%)',
  },
  imageActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  uploadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    padding: '9px 12px',
    borderRadius: '6px',
    backgroundColor: '#5865f2',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  hiddenInput: {
    display: 'none',
  },
  removeImageButton: {
    width: 'fit-content',
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  removeImageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  imageHelper: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.45)',
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
