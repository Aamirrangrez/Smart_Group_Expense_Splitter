import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = connectSocket();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [user?._id, loading]);

  const joinGroup = useCallback((groupId) => {
    getSocket()?.emit('join:group', groupId);
  }, []);

  const leaveGroup = useCallback((groupId) => {
    getSocket()?.emit('leave:group', groupId);
  }, []);

  const onEvent = useCallback((event, cb) => {
    const socket = getSocket();
    socket?.on(event, cb);
    return () => socket?.off(event, cb);
  }, []);

  const emitEvent = useCallback((event, data) => {
    getSocket()?.emit(event, data);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: getSocket(),
        connected,
        joinGroup,
        leaveGroup,
        onEvent,
        emitEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};