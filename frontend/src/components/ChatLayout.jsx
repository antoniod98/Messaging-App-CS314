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
    background:
      'radial-gradient(circle at top left, rgba(110, 168, 254, 0.1) 0%, transparent 28%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.06) 0%, transparent 24%), linear-gradient(180deg, #06070b 0%, #0b1020 48%, #090a0d 100%)',
  },
  header: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
  },
  mainArea: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftSidebar: {
    width: '240px',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    overflowY: 'auto',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
    backdropFilter: 'blur(20px)',
  },
  centerColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(8, 10, 16, 0.58)',
    overflow: 'hidden',
    backdropFilter: 'blur(14px)',
  },
  rightSidebar: {
    width: '240px',
    overflowY: 'auto',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
  },
};

export default ChatLayout;
