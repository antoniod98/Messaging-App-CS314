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
import UserSearchModal from '../components/UserSearchModal';
import TypingIndicator from '../components/TypingIndicator';
import LoadingSpinner from '../components/LoadingSpinner';
import { getUserInitials } from '../utils/dateFormat';

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
  const [typingUsers, setTypingUsers] = useState([]);
  const [isDMModalOpen, setIsDMModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isUpdatingRoomImage, setIsUpdatingRoomImage] = useState(false);

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
  const handleCreateRoom = async (roomName, roomImage = null) => {
    try {
      setIsCreatingRoom(true);
      setError(null);

      const response = await axios.post(
        `${API_URL}/api/rooms`,
        { name: roomName, roomImage },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // add new room to list
        setRooms((prevRooms) => [response.data.room, ...prevRooms]);

        // automatically select new room
        setActiveRoomId(response.data.room.id);
        await fetchRooms();

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

  const handleUpdateRoomImage = async ({ roomId, roomImage = null, removeRoomImage = false }) => {
    try {
      setIsUpdatingRoomImage(true);
      setError(null);

      const response = await axios.put(
        `${API_URL}/api/rooms/${roomId}/image`,
        { roomImage, removeRoomImage },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setRooms((prevRooms) =>
          prevRooms.map((room) => (room.id === roomId ? response.data.room : room))
        );
        await fetchRooms();
        return { success: true };
      }

      return { success: false, message: 'Failed to update room image' };
    } catch (error) {
      console.error('Error updating room image:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update room image';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsUpdatingRoomImage(false);
    }
  };

  // create or open direct message with a user
  const handleCreateDM = async (selectedUser) => {
    try {
      setError(null);

      const response = await axios.post(
        `${API_URL}/api/rooms/dm`,
        { userId: selectedUser.id },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        const dmRoom = response.data.room;

        // check if DM already exists in rooms list
        const existingRoom = rooms.find((r) => r.id === dmRoom.id);
        if (!existingRoom) {
          setRooms((prevRooms) => [dmRoom, ...prevRooms]);
        }

        // automatically select the DM
        setActiveRoomId(dmRoom.id);
      }
    } catch (error) {
      console.error('Error creating DM:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create direct message';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  // invite user to current room
  const handleInviteUser = async (selectedUser) => {
    if (!activeRoomId) return;

    try {
      setError(null);

      const response = await axios.post(
        `${API_URL}/api/rooms/${activeRoomId}/participants`,
        { userId: selectedUser.id },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // update room participants in state
        setRooms((prevRooms) =>
          prevRooms.map((room) => {
            if (room.id === activeRoomId) {
              return {
                ...room,
                participants: [...room.participants, response.data.participant],
                participantCount: room.participantCount + 1,
              };
            }
            return room;
          })
        );

        alert(`${selectedUser.firstName} ${selectedUser.lastName} has been invited to the room!`);
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to invite user';
      setError(errorMessage);
      alert(errorMessage);
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

  // handle typing event
  const handleTyping = (isTyping) => {
    if (!activeRoomId || !socket || !isConnected) return;

    socket.emit('typing', {
      roomId: activeRoomId,
      isTyping: isTyping,
    });
  };

  // send message
  const handleSendMessage = (content) => {
    if (!activeRoomId || !socket || !isConnected) {
      alert('Cannot send message: not connected');
      return;
    }

    // stop typing indicator when message is sent
    handleTyping(false);

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

    // handle user typing indicator
    const handleUserTyping = (data) => {
      const { userId, isTyping } = data;

      // only show typing for active room
      if (data.roomId !== activeRoomId) return;

      setTypingUsers((prev) => {
        if (isTyping) {
          // add user to typing list if not already there
          const existingUser = prev.find((u) => u.id === userId);
          if (existingUser) return prev;

          // fetch user details from room participants
          const participant = activeRoom?.participants.find((p) => p.id === userId);
          if (participant) {
            return [...prev, participant];
          }
          return prev;
        } else {
          // remove user from typing list
          return prev.filter((u) => u.id !== userId);
        }
      });

      // auto-remove typing indicator after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.id !== userId));
        }, 3000);
      }
    };

    // register event listeners
    socket.on('newMessage', handleNewMessage);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('roomDeleted', handleRoomDeleted);
    socket.on('userTyping', handleUserTyping);
    socket.on('error', handleError);

    // cleanup: remove event listeners on unmount or when socket changes
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('roomDeleted', handleRoomDeleted);
      socket.off('userTyping', handleUserTyping);
      socket.off('error', handleError);
    };
  }, [socket, isConnected, activeRoomId, activeRoom]);

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
        <div style={styles.currentUser}>
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={`${user.firstName} ${user.lastName}`}
              style={styles.currentUserAvatar}
            />
          ) : (
            <div style={styles.currentUserAvatarFallback}>
              {getUserInitials(user?.firstName, user?.lastName) || '?'}
            </div>
          )}
        </div>
        <span style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </span>
        <button
          onClick={() => navigate('/profile')}
          style={styles.profileButton}
        >
          Profile
        </button>
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
      onNewDM={() => setIsDMModalOpen(true)}
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

    // show loading spinner while fetching messages
    if (isLoadingMessages) {
      return <LoadingSpinner size="large" message="Loading messages..." />;
    }

    return (
      <>
        <MessageFeed
          messages={messages}
          currentUserId={user?.id}
          roomName={activeRoom?.name || 'Chat Room'}
        />
        <TypingIndicator typingUsers={typingUsers} />
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!isConnected}
        />
      </>
    );
  };

  // render right sidebar
  const renderRightSidebar = () => (
    <RoomInfo
      room={activeRoom}
      currentUserId={user?.id}
      onDeleteRoom={handleDeleteRoom}
      onInviteUser={() => setIsInviteModalOpen(true)}
      onUpdateRoomImage={handleUpdateRoomImage}
      isUpdatingRoomImage={isUpdatingRoomImage}
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

      {/* direct message modal */}
      <UserSearchModal
        isOpen={isDMModalOpen}
        onClose={() => setIsDMModalOpen(false)}
        onSelectUser={handleCreateDM}
        mode="dm"
      />

      {/* invite user to room modal */}
      <UserSearchModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSelectUser={handleInviteUser}
        mode="invite"
        currentRoomParticipants={activeRoom?.participants || []}
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
  // Discord-like Dark Theme
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    height: '48px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '1px',
  },
  connectionStatus: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  currentUser: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
  },
  currentUserAvatarFallback: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #5865f2 0%, #3b82f6 100%)',
  },
  userName: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  profileButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    backdropFilter: 'blur(12px)',
  },
  logoutButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#ffffff',
    background: 'linear-gradient(135deg, rgba(218, 55, 60, 0.9) 0%, rgba(170, 40, 55, 0.92) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    boxShadow: '0 10px 22px rgba(120, 20, 28, 0.22)',
  },
  noRoomSelected: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '60px 40px',
    textAlign: 'center',
    backgroundColor: '#0a0a0a',
  },
  noRoomTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '12px',
  },
  noRoomText: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.5)',
    maxWidth: '400px',
    lineHeight: '1.6',
  },
  errorNotification: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#da373c',
    color: '#ffffff',
    padding: '16px 20px',
    borderRadius: '6px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 3000,
    maxWidth: '400px',
    animation: 'slideUp 0.3s ease-out',
  },
  errorClose: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: '#ffffff',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '2px 8px',
    marginLeft: 'auto',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    fontWeight: '600',
  },
};

export default Chat;
