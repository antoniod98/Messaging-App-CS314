import { useState } from 'react';

// message input component with character limit and validation
const MessageInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const maxLength = 2000;

  // handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  // handle send button click
  const handleSend = () => {
    const trimmedMessage = message.trim();

    // validation: don't send empty messages
    if (trimmedMessage.length === 0) {
      return;
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
          placeholder="What's happening?"
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
    borderTop: '1px solid #e1e8ed',
    backgroundColor: '#ffffff',
  },
  counterContainer: {
    padding: '8px 16px 0',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  counter: {
    fontSize: '13px',
    color: '#657786',
  },
  counterMax: {
    color: '#e0245e',
    fontWeight: '600',
  },
  inputContainer: {
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
  },
  textarea: {
    flex: 1,
    minHeight: '44px',
    maxHeight: '200px',
    padding: '12px',
    fontSize: '15px',
    border: '1px solid #e1e8ed',
    borderRadius: '20px',
    resize: 'none',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendButton: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#1da1f2',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
  },
  sendButtonDisabled: {
    backgroundColor: '#aab8c2',
    cursor: 'not-allowed',
  },
};

export default MessageInput;
