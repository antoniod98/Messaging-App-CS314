import { formatMessageTime } from '../utils/dateFormat';
import { getUserInitials } from '../utils/dateFormat';

// individual message display component
const MessageItem = ({ message, isOwnMessage }) => {
  const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
  const initials = getUserInitials(message.sender.firstName, message.sender.lastName);

  return (
    <div
      style={{
        ...styles.container,
        ...(isOwnMessage ? styles.ownMessage : {}),
      }}
    >
      {/* sender avatar */}
      <div style={styles.avatar}>
        <span style={styles.avatarText}>{initials}</span>
      </div>

      {/* message content */}
      <div style={styles.content}>
        {/* sender name and timestamp */}
        <div style={styles.header}>
          <span style={styles.senderName}>{senderName}</span>
          <span style={styles.timestamp}>{formatMessageTime(message.timestamp)}</span>
        </div>

        {/* message text */}
        <div style={styles.messageText}>{message.content}</div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    padding: '12px 16px',
    borderBottom: '1px solid #f7f9fa',
    transition: 'background-color 0.2s',
  },
  ownMessage: {
    backgroundColor: '#f7f9fa',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#657786',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '4px',
  },
  senderName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#14171a',
    marginRight: '8px',
  },
  timestamp: {
    fontSize: '13px',
    color: '#657786',
  },
  messageText: {
    fontSize: '15px',
    color: '#14171a',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export default MessageItem;
