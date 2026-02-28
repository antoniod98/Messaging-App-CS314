import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatLayout from '../components/ChatLayout';
import RoomSidebar from '../components/RoomSidebar';
import MessageFeed from '../components/MessageFeed';
import MessageInput from '../components/MessageInput';
import RoomInfo from '../components/RoomInfo';
import CreateRoomModal from '../components/CreateRoomModal';

// API base URL from environment variables
const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8747';

const Chat = () => {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // state management
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  // get current room details
  const activeRoom = rooms.find((room) => room.id === activeRoomId);

  // configure axios to send authentication token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // fetch all chat rooms user participates in
  const fetchRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true);
      setError(null);

      const response = await axios.get(`${API_URL}/api/rooms`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        setRooms(response.data.rooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load chat rooms');
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  // fetch message history for a specific room
  const fetchMessages = useCallback(async (roomId) => {
    try {
      setIsLoadingMessages(true);
      setError(null);

      const response = await axios.get(`${API_URL}/api/messages/${roomId}/messages`, {
        headers: getAuthHeaders(),
        params: {
          limit: 50, // get last 50 messages
        },
      });

      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // create new chat room
  const handleCreateRoom = async (roomName) => {
    try {
      setIsCreatingRoom(true);
      setError(null);

      const response = await axios.post(
        `${API_URL}/api/rooms`,
        { name: roomName },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // add new room to list
        setRooms((prevRooms) => [response.data.room, ...prevRooms]);

        // automatically select new room
        setActiveRoomId(response.data.room.id);

        return true; // success
      }

      return false;
    } catch (error) {
      console.error('Error creating room:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create room';
      setError(errorMessage);
      alert(errorMessage); // show error to user
      return false;
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // delete chat room
  const handleDeleteRoom = async () => {
    if (!activeRoom) return;

    // confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${activeRoom.name}"? This will permanently delete the room and all messages.`
    );

    if (!confirmDelete) return;

    try {
      setError(null);

      const response = await axios.delete(`${API_URL}/api/rooms/${activeRoomId}`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        // remove room from list
        setRooms((prevRooms) => prevRooms.filter((room) => room.id !== activeRoomId));

        // clear active room and messages
        setActiveRoomId(null);
        setMessages([]);

        // notify via socket if available
        if (socket && isConnected) {
          socket.emit('roomDeleted', activeRoomId);
        }
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete room';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  // handle room selection
  const handleRoomSelect = (roomId) => {
    if (roomId === activeRoomId) return; // already selected

    // leave current room socket namespace
    if (socket && isConnected && activeRoomId) {
      socket.emit('leaveRoom', activeRoomId);
    }

    // set new active room
    setActiveRoomId(roomId);
    setMessages([]); // clear messages while loading

    // fetch messages for new room
    fetchMessages(roomId);

    // join new room socket namespace
    if (socket && isConnected) {
      socket.emit('joinRoom', roomId);
    }
  };

  // send message
  const handleSendMessage = (content) => {
    if (!activeRoomId || !socket || !isConnected) {
      alert('Cannot send message: not connected');
      return;
    }

    // emit message via Socket.IO for real-time delivery
    socket.emit('sendMessage', {
      roomId: activeRoomId,
      content: content,
    });

    // message will be added to state when socket receives confirmation
  };

  // handle user logout
  const handleLogout = async () => {
    // leave all room socket namespaces
    if (socket && isConnected && activeRoomId) {
      socket.emit('leaveRoom', activeRoomId);
    }

    await logout();
    navigate('/login');
  };

  // fetch rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // setup socket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // handle incoming message
    const handleNewMessage = (message) => {
      // only add message if it's for the active room
      if (message.chatRoom === activeRoomId) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    // handle room joined confirmation
    const handleRoomJoined = (data) => {
      console.log(`Joined room: ${data.roomName}`);
    };

    // handle room deleted notification
    const handleRoomDeleted = (data) => {
      if (data.roomId === activeRoomId) {
        alert('This room has been deleted by its creator');
        setRooms((prevRooms) => prevRooms.filter((room) => room.id !== data.roomId));
        setActiveRoomId(null);
        setMessages([]);
      }
    };

    // handle socket errors
    const handleError = (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    };

    // register event listeners
    socket.on('newMessage', handleNewMessage);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('roomDeleted', handleRoomDeleted);
    socket.on('error', handleError);

    // cleanup: remove event listeners on unmount or when socket changes
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('roomDeleted', handleRoomDeleted);
      socket.off('error', handleError);
    };
  }, [socket, isConnected, activeRoomId]);

  // join active room socket namespace when room changes
  useEffect(() => {
    if (!socket || !isConnected || !activeRoomId) return;

    socket.emit('joinRoom', activeRoomId);

    // cleanup: leave room when component unmounts or room changes
    return () => {
      if (socket && isConnected) {
        socket.emit('leaveRoom', activeRoomId);
      }
    };
  }, [socket, isConnected, activeRoomId]);

  // render header component
  const renderHeader = () => (
    <div style={styles.headerContainer}>
      <div style={styles.headerLeft}>
        <h1 style={styles.logo}>RELAY</h1>
        {!isConnected && (
          <span style={styles.connectionStatus}>Connecting to server...</span>
        )}
      </div>
      <div style={styles.headerRight}>
        <span style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </span>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    </div>
  );

  // render left sidebar
  const renderLeftSidebar = () => (
    <RoomSidebar
      rooms={rooms}
      activeRoomId={activeRoomId}
      onRoomSelect={handleRoomSelect}
      onCreateRoom={() => setIsCreateModalOpen(true)}
    />
  );

  // render main content (message feed + input)
  const renderMainContent = () => {
    if (!activeRoomId) {
      return (
        <div style={styles.noRoomSelected}>
          <h2 style={styles.noRoomTitle}>No Room Selected</h2>
          <p style={styles.noRoomText}>
            Select a room from the sidebar or create a new one to start chatting
          </p>
        </div>
      );
    }

    return (
      <>
        <MessageFeed
          messages={messages}
          currentUserId={user?.id}
          roomName={activeRoom?.name || 'Chat Room'}
        />
        <MessageInput onSendMessage={handleSendMessage} disabled={!isConnected} />
      </>
    );
  };

  // render right sidebar
  const renderRightSidebar = () => (
    <RoomInfo
      room={activeRoom}
      currentUserId={user?.id}
      onDeleteRoom={handleDeleteRoom}
    />
  );

  return (
    <>
      <ChatLayout
        header={renderHeader()}
        leftSidebar={renderLeftSidebar()}
        mainContent={renderMainContent()}
        rightSidebar={renderRightSidebar()}
      />

      {/* create room modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        isCreating={isCreatingRoom}
      />

      {/* error notification (temporary display) */}
      {error && (
        <div style={styles.errorNotification}>
          {error}
          <button style={styles.errorClose} onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
    </>
  );
};

const styles = {
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#1da1f2',
  },
  connectionStatus: {
    fontSize: '13px',
    color: '#657786',
    fontStyle: 'italic',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: '#14171a',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#e0245e',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  noRoomSelected: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
    textAlign: 'center',
  },
  noRoomTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#14171a',
    marginBottom: '12px',
  },
  noRoomText: {
    fontSize: '16px',
    color: '#657786',
    maxWidth: '400px',
  },
  errorNotification: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#e0245e',
    color: '#ffffff',
    padding: '16px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 3000,
    maxWidth: '400px',
  },
  errorClose: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    marginLeft: 'auto',
  },
};

export default Chat;
