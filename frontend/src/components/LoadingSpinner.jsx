// loading spinner component
const LoadingSpinner = ({ size = 'medium', message }) => {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60,
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.spinner,
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          borderWidth: `${spinnerSize / 10}px`,
        }}
      ></div>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '20px',
  },
  spinner: {
    border: '4px solid #e1e8ed',
    borderTop: '4px solid #1da1f2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  message: {
    fontSize: '14px',
    color: '#657786',
    textAlign: 'center',
  },
};

// add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default LoadingSpinner;
