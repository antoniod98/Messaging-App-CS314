import { getUserInitials } from '../utils/dateFormat';
import { useSocket } from '../context/SocketContext';

// right sidebar showing room details and participants
const RoomInfo = ({ room, currentUserId, onDeleteRoom, onInviteUser }) => {
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

  return (
    <div style={styles.container}>
      {/* room details section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Room Details</h3>

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
