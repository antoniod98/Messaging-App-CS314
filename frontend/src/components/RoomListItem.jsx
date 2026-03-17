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
      <div
        style={{
          ...styles.avatar,
          ...(room.isDM && !room.roomImageUrl
            ? {
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              }
            : {}),
        }}
      >
        {room.roomImageUrl ? (
          <img src={room.roomImageUrl} alt={room.name} style={styles.avatarImage} />
        ) : (
          <span style={styles.avatarText}>{room.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* room details */}
      <div style={styles.details}>
        <div style={styles.roomName}>
          {room.isDM && <span style={styles.dmBadge}>💬 </span>}
          {room.name}
        </div>
        <div style={styles.participantCount}>
          {room.isDM ? 'Direct Message' : `${room.participantCount} ${room.participantCount === 1 ? 'participant' : 'participants'}`}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    margin: '0 8px 2px 8px',
    cursor: 'pointer',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    transition: 'background-color 0.15s',
    position: 'relative',
  },
  hover: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  active: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    backgroundColor: '#2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  avatarText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    fontWeight: '600',
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  roomName: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  participantCount: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: '2px',
  },
  dmBadge: {
    fontSize: '12px',
    marginRight: '4px',
  },
};

export default RoomListItem;
