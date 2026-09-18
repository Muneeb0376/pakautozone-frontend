import { io } from 'socket.io-client';

// Proxy ke through same-origin per hi socket connect hoga
const getSocketURL = () => {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
};

const SOCKET_URL = getSocketURL();

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      path: '/socket.io',
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) socket.disconnect();
};