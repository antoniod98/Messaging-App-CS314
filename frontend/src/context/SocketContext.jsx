import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// API base URL from environment variables
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8747';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // only initialize socket if user is authenticated
    if (!isAuthenticated || !user) {
      // disconnect existing socket if user logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // prevent creating multiple socket connections
    if (socketRef.current) {
      return;
    }

    // get JWT token from localStorage for socket authentication
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No authentication token found for socket connection');
      return;
    }

    setIsConnecting(true);

    // initialize socket connection with JWT authentication
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'], // try websocket first, fallback to polling
      reconnection: true, // enable automatic reconnection
      reconnectionAttempts: 5, // try to reconnect 5 times
      reconnectionDelay: 1000, // wait 1 second before attempting reconnect
      reconnectionDelayMax: 5000, // maximum reconnection delay of 5 seconds
      timeout: 20000, // connection timeout of 20 seconds
    });

    // handle successful connection
    newSocket.on('connect', () => {
      console.log('Socket.IO connected successfully');
      setIsConnected(true);
      setIsConnecting(false);
    });

    // handle disconnection
    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setIsConnected(false);

      // automatic reconnection happens unless disconnect was manual
      if (reason === 'io server disconnect') {
        // server disconnected the client, manually reconnect
        newSocket.connect();
      }
    });

    // handle connection errors
    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      setIsConnecting(false);
      setIsConnected(false);
    });

    // handle reconnection attempt
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket.IO reconnection attempt ${attemptNumber}`);
      setIsConnecting(true);
    });

    // handle successful reconnection
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Socket.IO reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setIsConnecting(false);
    });

    // handle reconnection failure
    newSocket.on('reconnect_failed', () => {
      console.error('Socket.IO failed to reconnect after maximum attempts');
      setIsConnecting(false);
      setIsConnected(false);
    });

    // handle general socket errors
    newSocket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // cleanup function: disconnect socket when component unmounts or user logs out
    return () => {
      if (newSocket) {
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  const value = {
    socket,
    isConnected,
    isConnecting,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// custom hook to access socket context
// usage: const { socket, isConnected, isConnecting } = useSocket();
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
