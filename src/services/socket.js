import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Attach to window to survive Vite HMR module resets
if (!window.__socketInstance) {
  window.__socketInstance = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}

const socket = window.__socketInstance;

export const getSocket = () => window.__socketInstance;

export const connectSocket = () => {
  if (!window.__socketInstance.connected) {
    window.__socketInstance.connect();
  }
  return window.__socketInstance;
};

export const disconnectSocket = () => {
  if (window.__socketInstance?.connected) {
    window.__socketInstance.disconnect();
  }
};

export const joinGroup = (groupId) => {
  if (window.__socketInstance?.connected) {
    window.__socketInstance.emit('join:group', groupId);
  }
};

export const leaveGroup = (groupId) => {
  if (window.__socketInstance?.connected) {
    window.__socketInstance.emit('leave:group', groupId);
  }
};

export default socket;