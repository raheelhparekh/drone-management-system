import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(userId) {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io('http://localhost:8000', {
      reconnection: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket.id);
      this.isConnected = true;
      
      if (userId) {
        this.socket.emit('join_user_room', userId);
      }
    });

    this.socket.on('connection_confirmed', (data) => {
      console.log('Connection confirmed:', data);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Real-time event listeners
  onDroneUpdate(callback) {
    if (this.socket) {
      this.socket.on('droneUpdate', callback);
    }
  }

  onMissionUpdate(callback) {
    if (this.socket) {
      this.socket.on('missionUpdate', callback);
    }
  }

  onFleetUpdate(callback) {
    if (this.socket) {
      this.socket.on('fleetUpdate', callback);
    }
  }

  // Emit events
  emitDroneUpdate(data) {
    if (this.socket) {
      this.socket.emit('droneUpdate', data);
    }
  }

  emitMissionUpdate(data) {
    if (this.socket) {
      this.socket.emit('missionUpdate', data);
    }
  }

  // Connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }
}

export default new SocketService();
