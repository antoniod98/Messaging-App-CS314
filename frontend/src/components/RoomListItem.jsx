// individual room item in the sidebar list
const RoomListItem = ({ room, isActive, onClick }) => {
  return (
    <div
      style={{
        ...styles.container,
        ...(isActive ? styles.active : {}),
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = styles.hover.backgroundColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = styles.container.backgroundColor;
        }
      }}
    >
      {/* room avatar circle */}
      <div style={styles.avatar}>
        <span style={styles.avatarText}>{room.name.charAt(0).toUpperCase()}</span>
      </div>

      {/* room details */}
      <div style={styles.details}>
        <div style={styles.roomName}>{room.name}</div>
        <div style={styles.participantCount}>
          {room.participantCount} {room.participantCount === 1 ? 'participant' : 'participants'}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #e1e8ed',
    backgroundColor: '#ffffff',
    transition: 'background-color 0.2s',
  },
  hover: {
    backgroundColor: '#f7f9fa',
  },
  active: {
    backgroundColor: '#e8f5fe',
    borderLeft: '3px solid #1da1f2',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#1da1f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  roomName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#14171a',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  participantCount: {
    fontSize: '14px',
    color: '#657786',
  },
};

export default RoomListItem;
