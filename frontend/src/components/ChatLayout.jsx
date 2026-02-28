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
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottom: '1px solid #e1e8ed',
    backgroundColor: '#ffffff',
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
    width: '300px',
    borderRight: '1px solid #e1e8ed',
    overflowY: 'auto',
    backgroundColor: '#ffffff',
  },
  centerColumn: {
    flex: 1,
    borderRight: '1px solid #e1e8ed',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  rightSidebar: {
    width: '350px',
    overflowY: 'auto',
    backgroundColor: '#ffffff',
  },
};

export default ChatLayout;
