import { Component } from 'react';

// error boundary component to catch React errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  // update state when error is caught
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // log error details
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.state = {
      hasError: true,
      error: error,
      errorInfo: errorInfo,
    };
  }

  // reset error state
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              The application encountered an unexpected error. Please try refreshing the page.
            </p>

            {this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.errorText}>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre style={styles.stackTrace}>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <button onClick={this.handleReset} style={styles.button}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f8fa',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e1e8ed',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#e0245e',
    marginBottom: '16px',
  },
  message: {
    fontSize: '15px',
    color: '#14171a',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  details: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f7f9fa',
    borderRadius: '8px',
    border: '1px solid #e1e8ed',
  },
  summary: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#14171a',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  errorText: {
    fontSize: '13px',
    color: '#e0245e',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    marginTop: '12px',
  },
  stackTrace: {
    fontSize: '12px',
    color: '#657786',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    marginTop: '12px',
    maxHeight: '200px',
    overflow: 'auto',
  },
  button: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#1da1f2',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default ErrorBoundary;
