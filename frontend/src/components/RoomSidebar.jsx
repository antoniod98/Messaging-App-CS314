import RoomListItem from './RoomListItem';

// left sidebar containing room list and create room button
const RoomSidebar = ({ rooms, activeRoomId, onRoomSelect, onCreateRoom, onNewDM }) => {
  return (
    <div style={styles.container}>
      {/* header with title and create button */}
      <div style={styles.header}>
        <h2 style={styles.title}>Chat Rooms</h2>
        <button style={styles.createButton} onClick={onCreateRoom} title="Create new room">
          <span style={styles.plusIcon}>+</span>
        </button>
      </div>

      {/* room list */}
      <div style={styles.roomList}>
        {rooms.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No chat rooms yet</p>
            <p style={styles.emptySubtext}>Create your first room to get started</p>
          </div>
        ) : (
          rooms.map((room) => (
            <RoomListItem
              key={room.id}
              room={room}
              isActive={room.id === activeRoomId}
              onClick={() => onRoomSelect(room.id)}
            />
          ))
        )}
      </div>

      {/* New DM button at bottom */}
      <div style={styles.footer}>
        <button style={styles.dmButton} onClick={onNewDM} title="Start new direct message">
          <span style={styles.dmIcon}>💬</span>
          <span>New Direct Message</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  createButton: {
    width: '28px',
    height: '28px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
    padding: 0,
  },
  plusIcon: {
    lineHeight: '1',
    fontWeight: '400',
  },
  roomList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '6px',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  footer: {
    padding: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  dmButton: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
    background: 'linear-gradient(135deg, rgba(72, 125, 255, 0.88) 0%, rgba(36, 128, 70, 0.88) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 14px 30px rgba(20, 40, 90, 0.22)',
  },
  dmIcon: {
    fontSize: '16px',
  },
};

export default RoomSidebar;
