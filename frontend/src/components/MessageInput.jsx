import { useState, useRef } from 'react';

// message input component with character limit and validation
const MessageInput = ({ onSendMessage, onTyping, disabled }) => {
  const [message, setMessage] = useState('');
  const maxLength = 2000;
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);

      // emit typing event
      if (onTyping && value.trim().length > 0) {
        if (!isTypingRef.current) {
          onTyping(true);
          isTypingRef.current = true;
        }

        // clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // set new timeout to stop typing indicator after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
          isTypingRef.current = false;
        }, 2000);
      }
    }
  };

  // handle send button click
  const handleSend = () => {
    const trimmedMessage = message.trim();

    // validation: don't send empty messages
    if (trimmedMessage.length === 0) {
      return;
    }

    // stop typing indicator
    if (onTyping && isTypingRef.current) {
      onTyping(false);
      isTypingRef.current = false;
    }

    // clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onSendMessage(trimmedMessage);
    setMessage(''); // clear input after sending
  };

  // handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // allow Shift+Enter for new line (default behavior)
  };

  const isMessageEmpty = message.trim().length === 0;
  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.9; // show counter when > 90%

  return (
    <div style={styles.container}>
      {/* character counter (only show when approaching limit) */}
      {isNearLimit && (
        <div style={styles.counterContainer}>
          <span
            style={{
              ...styles.counter,
              ...(characterCount === maxLength ? styles.counterMax : {}),
            }}
          >
            {characterCount} / {maxLength}
          </span>
        </div>
      )}

      {/* input area */}
      <div style={styles.inputContainer}>
        <textarea
          style={styles.textarea}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message"
          disabled={disabled}
          rows={1}
        />

        <button
          style={{
            ...styles.sendButton,
            ...(isMessageEmpty || disabled ? styles.sendButtonDisabled : {}),
          }}
          onClick={handleSend}
          disabled={isMessageEmpty || disabled}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#0a0a0a',
    padding: '0 16px 24px 16px',
  },
  counterContainer: {
    padding: '8px 0 4px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  counter: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  counterMax: {
    color: '#ed4245',
    fontWeight: '600',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
  },
  textarea: {
    flex: 1,
    minHeight: '44px',
    maxHeight: '200px',
    padding: '11px 14px',
    fontSize: '15px',
    border: 'none',
    borderRadius: '8px',
    resize: 'none',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'background-color 0.2s',
    backgroundColor: '#2a2a2a',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sendButton: {
    padding: '11px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#5865f2',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
    height: '44px',
  },
  sendButtonDisabled: {
    backgroundColor: '#4e5058',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};

export default MessageInput;
