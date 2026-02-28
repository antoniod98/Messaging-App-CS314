import RoomListItem from './RoomListItem';

// left sidebar containing room list and create room button
const RoomSidebar = ({ rooms, activeRoomId, onRoomSelect, onCreateRoom }) => {
  return (
    <div style={styles.container}>
      {/* header with title and create button */}
      <div style={styles.header}>
        <h2 style={styles.title}>Chat Rooms</h2>
        <button style={styles.createButton} onClick={onCreateRoom}>
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
    borderBottom: '1px solid #e1e8ed',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#14171a',
  },
  createButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1da1f2',
    border: 'none',
    color: '#ffffff',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  plusIcon: {
    lineHeight: '1',
  },
  roomList: {
    flex: 1,
    overflowY: 'auto',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '16px',
    color: '#14171a',
    marginBottom: '8px',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#657786',
  },
};

export default RoomSidebar;
