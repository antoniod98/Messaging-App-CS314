import { getUserInitials } from '../utils/dateFormat';

// right sidebar showing room details and participants
const RoomInfo = ({ room, currentUserId, onDeleteRoom }) => {
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
        <h3 style={styles.sectionTitle}>
          Participants ({room.participants.length})
        </h3>

        <div style={styles.participantsList}>
          {room.participants.map((participant) => {
            const initials = getUserInitials(participant.firstName, participant.lastName);
            const isCurrentUser = participant.id === currentUserId;

            return (
              <div key={participant.id} style={styles.participantItem}>
                <div style={styles.participantAvatar}>
                  <span style={styles.participantAvatarText}>{initials}</span>
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
    fontSize: '14px',
    color: '#657786',
  },
  section: {
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e1e8ed',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#14171a',
    marginBottom: '16px',
  },
  detailItem: {
    marginBottom: '12px',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#657786',
    display: 'block',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '15px',
    color: '#14171a',
    fontWeight: '500',
  },
  youLabel: {
    color: '#1da1f2',
    fontSize: '14px',
  },
  participantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  participantItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  participantAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#657786',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  participantAvatarText: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  participantInfo: {
    flex: 1,
    minWidth: 0,
  },
  participantName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#14171a',
    marginBottom: '2px',
  },
  participantEmail: {
    fontSize: '13px',
    color: '#657786',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteButton: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#e0245e',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  deleteWarning: {
    fontSize: '13px',
    color: '#657786',
    marginTop: '8px',
    textAlign: 'center',
  },
};

export default RoomInfo;
