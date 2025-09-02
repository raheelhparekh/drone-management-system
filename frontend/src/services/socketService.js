import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io('http://localhost:8000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user-specific room
      this.socket.emit('join_user_room', userId);
    });

    this.socket.on('connection_confirmed', (data) => {
      console.log('Real-time connection confirmed:', data);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnected = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Event listeners
  onMissionUpdate(callback) {
    if (this.socket) {
      this.socket.on('missionUpdate', callback);
    }
  }

  onDroneUpdate(callback) {
    if (this.socket) {
      this.socket.on('droneUpdate', callback);
    }
  }

  offMissionUpdate(callback) {
    if (this.socket) {
      this.socket.off('missionUpdate', callback);
    }
  }

  offDroneUpdate(callback) {
    if (this.socket) {
      this.socket.off('droneUpdate', callback);
    }
  }

  // Health check
  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
      return new Promise((resolve) => {
        this.socket.once('pong', (data) => {
          resolve(data);
        });
      });
    }
    return Promise.reject('Socket not connected');
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Export singleton instance
export default new SocketService();
