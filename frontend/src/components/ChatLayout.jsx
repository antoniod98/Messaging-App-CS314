// main chat layout component with Twitter/X-inspired 3-column design
const ChatLayout = ({ leftSidebar, mainContent, rightSidebar, header }) => {
  return (
    <div style={styles.container}>
      {/* header bar with logo and user info */}
      {header && <div style={styles.header}>{header}</div>}

      {/* main content area with 3-column layout */}
      <div style={styles.mainArea}>
        {/* left sidebar - room list */}
        <div style={styles.leftSidebar}>{leftSidebar}</div>

        {/* center column - chat messages */}
        <div style={styles.centerColumn}>{mainContent}</div>

        {/* right sidebar - room info and participants */}
        <div style={styles.rightSidebar}>{rightSidebar}</div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0a0a0a',
  },
  header: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    backgroundColor: '#1a1a1a',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  mainArea: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftSidebar: {
    width: '240px',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    overflowY: 'auto',
    backgroundColor: '#151515',
  },
  centerColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
  },
  rightSidebar: {
    width: '240px',
    overflowY: 'auto',
    backgroundColor: '#151515',
    borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
  },
};

export default ChatLayout;
