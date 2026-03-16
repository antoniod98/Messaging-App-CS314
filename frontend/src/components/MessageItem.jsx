import {
  formatMessageTime,
  formatFullTimestamp,
  getUserInitials,
} from '../utils/dateFormat';

// Generate avatar background color based on user name
const getAvatarColor = (firstName, lastName) => {
  const colors = [
    '#5865f2', // Discord blurple
    '#eb459e', // Pink
    '#ed4245', // Red
    '#f26522', // Orange
    '#f2c94c', // Yellow
    '#57f287', // Green
    '#00aff4', // Cyan
    '#9b84ee', // Purple
  ];
  const index = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;
  return colors[index];
};

const MessageItem = ({ message, isOwnMessage }) => {
  const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
  const initials = getUserInitials(message.sender.firstName, message.sender.lastName);
  const fullTimestamp = formatFullTimestamp(message.timestamp);
  const avatarBg = getAvatarColor(message.sender.firstName, message.sender.lastName);

  return (
    <div style={styles.container}>
      {message.sender.profileImageUrl ? (
        <img
          src={message.sender.profileImageUrl}
          alt={senderName}
          style={styles.avatarImage}
        />
      ) : (
        <div style={{...styles.avatar, backgroundColor: avatarBg}}>
          <span style={styles.avatarText}>{initials}</span>
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.senderName}>{senderName}</span>
          <span style={styles.timestamp} title={fullTimestamp}>
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
        <div style={styles.messageText}>{message.content}</div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    padding: '4px 16px 4px 16px',
    gap: '16px',
    transition: 'background-color 0.15s',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '4px',
  },
  avatarImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
    flexShrink: 0,
    marginTop: '4px',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingTop: '2px',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: '4px',
    gap: '8px',
  },
  senderName: {
    fontSize: '15px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timestamp: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'help',
    fontWeight: '400',
  },
  messageText: {
    fontSize: '15px',
    lineHeight: '1.375',
    color: 'rgba(255, 255, 255, 0.85)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export default MessageItem;
