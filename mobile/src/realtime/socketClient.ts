import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket: Socket | null = null;
let activeToken: string | null = null;

export function getSocket(token: string) {
  if (socket && activeToken === token) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  activeToken = token;
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
  });

  return socket;
}

export function closeSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  activeToken = null;
}
