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
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151515',
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
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    border: 'none',
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
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    backgroundColor: '#151515',
  },
  dmButton: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#248046',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  dmIcon: {
    fontSize: '16px',
  },
};

export default RoomSidebar;
