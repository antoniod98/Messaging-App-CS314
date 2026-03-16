import { getUserInitials } from '../utils/dateFormat';
import { useSocket } from '../context/SocketContext';

const MAX_ROOM_IMAGE_BYTES = 2 * 1024 * 1024;

// right sidebar showing room details and participants
const RoomInfo = ({
  room,
  currentUserId,
  onDeleteRoom,
  onInviteUser,
  onUpdateRoomImage,
  isUpdatingRoomImage,
}) => {
  const { onlineUsers } = useSocket();
  if (!room) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Select a room to view details</p>
        </div>
      </div>
    );
  }

  const isCreator = room.creator.id === currentUserId;
  const isDM = room.isDM;
  const roomInitial = room.name?.charAt(0)?.toUpperCase() || '#';

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read the selected image'));
      reader.readAsDataURL(file);
    });

  const handleRoomImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file');
      return;
    }

    if (file.size > MAX_ROOM_IMAGE_BYTES) {
      alert('Room image must be 2MB or smaller');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const result = await onUpdateRoomImage({
        roomId: room.id,
        roomImage: dataUrl,
        removeRoomImage: false,
      });

      if (!result.success) {
        alert(result.message);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveRoomImage = async () => {
    const result = await onUpdateRoomImage({
      roomId: room.id,
      removeRoomImage: true,
    });

    if (!result.success) {
      alert(result.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* room details section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Room Details</h3>

        {!isDM && (
          <div style={styles.roomImageSection}>
            <div style={styles.roomImageFrame}>
              {room.roomImageUrl ? (
                <img src={room.roomImageUrl} alt={room.name} style={styles.roomImage} />
              ) : (
                <div style={styles.roomImageFallback}>{roomInitial}</div>
              )}
            </div>

            {isCreator && (
              <div style={styles.roomImageActions}>
                <label style={styles.roomImageButton}>
                  {room.roomImageUrl ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleRoomImageChange}
                    disabled={isUpdatingRoomImage}
                    style={styles.hiddenInput}
                  />
                </label>
                <button
                  type="button"
                  style={{
                    ...styles.roomImageRemoveButton,
                    ...(!room.roomImageUrl ? styles.roomImageRemoveButtonDisabled : {}),
                  }}
                  onClick={handleRemoveRoomImage}
                  disabled={!room.roomImageUrl || isUpdatingRoomImage}
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>
        )}

        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Room Name:</span>
          <span style={styles.detailValue}>{room.name}</span>
        </div>

        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Created by:</span>
          <span style={styles.detailValue}>
            {room.creator.firstName} {room.creator.lastName}
            {isCreator && <span style={styles.youLabel}> (You)</span>}
          </span>
        </div>

        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Created on:</span>
          <span style={styles.detailValue}>
            {new Date(room.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* participants section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            Participants ({room.participants.length})
          </h3>
          {!isDM && (
            <button
              style={styles.inviteButton}
              onClick={onInviteUser}
              title="Invite user to this room"
            >
              +
            </button>
          )}
        </div>

        <div style={styles.participantsList}>
          {room.participants.map((participant) => {
            const initials = getUserInitials(participant.firstName, participant.lastName);
            const isCurrentUser = participant.id === currentUserId;
            const isOnline = onlineUsers.includes(participant.id);

            return (
              <div key={participant.id} style={styles.participantItem}>
                <div style={{ position: 'relative' }}>
                  <div style={styles.participantAvatar}>
                    <span style={styles.participantAvatarText}>{initials}</span>
                  </div>
                  {/* online status indicator */}
                  {isOnline && (
                    <div style={styles.onlineIndicator} title="Online"></div>
                  )}
                </div>
                <div style={styles.participantInfo}>
                  <div style={styles.participantName}>
                    {participant.firstName} {participant.lastName}
                    {isCurrentUser && <span style={styles.youLabel}> (You)</span>}
                  </div>
                  <div style={styles.participantEmail}>{participant.email}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* delete room button (only for creator) */}
      {isCreator && (
        <div style={styles.section}>
          <button style={styles.deleteButton} onClick={onDeleteRoom}>
            Delete Room
          </button>
          <p style={styles.deleteWarning}>
            This will permanently delete the room and all messages.
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  section: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  roomImageSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#111111',
  },
  roomImageFrame: {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#2a2a2a',
  },
  roomImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  roomImageFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #3b3b3b 0%, #1f1f1f 100%)',
  },
  roomImageActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  roomImageButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#5865f2',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  hiddenInput: {
    display: 'none',
  },
  roomImageRemoveButton: {
    width: 'fit-content',
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  roomImageRemoveButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inviteButton: {
    width: '20px',
    height: '20px',
    padding: 0,
    fontSize: '18px',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'color 0.2s, background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
  },
  detailItem: {
    marginBottom: '10px',
  },
  detailLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    display: 'block',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  youLabel: {
    color: '#5865f2',
    fontSize: '13px',
  },
  participantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  participantItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px',
    borderRadius: '4px',
    transition: 'background-color 0.15s',
  },
  participantAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#5865f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  participantAvatarText: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
  },
  participantInfo: {
    flex: 1,
    minWidth: 0,
  },
  participantName: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '2px',
  },
  participantEmail: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#23a559',
    border: '2px solid #151515',
  },
  deleteButton: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#da373c',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  deleteWarning: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: '8px',
    textAlign: 'center',
  },
};

export default RoomInfo;
