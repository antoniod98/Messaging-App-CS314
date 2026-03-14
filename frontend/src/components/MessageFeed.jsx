import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { formatDayDivider, isSameDay } from '../utils/dateFormat';

// message feed displaying conversation history
const MessageFeed = ({ messages, currentUserId, roomName }) => {
  const messagesEndRef = useRef(null);

  // auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // determine if day divider should be shown between messages
  const shouldShowDayDivider = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    return !isSameDay(currentMessage.timestamp, previousMessage.timestamp);
  };

  return (
    <div style={styles.container}>
      {/* room name header */}
      <div style={styles.header}>
        <h2 style={styles.roomName}>{roomName}</h2>
      </div>

      {/* messages area */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No messages yet</p>
            <p style={styles.emptySubtext}>Start the conversation by sending a message</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={message.id}>
                {/* day divider if needed */}
                {shouldShowDayDivider(message, messages[index - 1]) && (
                  <div style={styles.dayDivider}>
                    <span style={styles.dayDividerText}>
                      {formatDayDivider(message.timestamp)}
                    </span>
                  </div>
                )}

                {/* message */}
                <MessageItem
                  message={message}
                  isOwnMessage={message.sender.id === currentUserId}
                />
              </div>
            ))}

            {/* invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </>
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
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0a0a0a',
    boxShadow: '0 1px 0 rgba(0, 0, 0, 0.2)',
  },
  roomName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#0a0a0a',
    padding: '16px 0',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px 20px',
  },
  emptyText: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '8px',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  dayDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    position: 'relative',
    margin: '8px 0',
  },
  dayDividerText: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'transparent',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
};

export default MessageFeed;
