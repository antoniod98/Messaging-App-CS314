// typing indicator component showing who is currently typing
const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  // format typing message based on number of users
  const getTypingMessage = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].firstName} ${typingUsers[0].lastName} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].firstName} and ${typingUsers[1].firstName} are typing...`;
    } else {
      return `${typingUsers[0].firstName} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.dotsContainer}>
        <span style={styles.dot}></span>
        <span style={styles.dot}></span>
        <span style={styles.dot}></span>
      </div>
      <span style={styles.text}>{getTypingMessage()}</span>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    color: '#657786',
    height: '32px',
  },
  dotsContainer: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#1da1f2',
    animation: 'typing 1.4s infinite',
    animationFillMode: 'both',
  },
  text: {
    fontStyle: 'italic',
  },
};

// add animation keyframes via style tag
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }

    .typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
  `;
  document.head.appendChild(styleSheet);
}

export default TypingIndicator;
