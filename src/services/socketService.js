import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
  }

  connect(token, userRole) {
    // Prevent multiple connection attempts
    if (this.socket?.connected || this.isConnecting) return;

    this.isConnecting = true;
    
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    
    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        query: { token },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        
        // Join appropriate room based on user role
        if (userRole && this.socket) {
          this.socket.emit('joinRoom', userRole);
          console.log(`📡 Joined ${userRole} room`);
        }
        
        // Re-register all listeners after reconnect
        this.reRegisterListeners();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.reconnectAttempts++;
        this.isConnecting = false;
      });

      // Set up event listeners after socket is created
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      this.isConnecting = false;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Customer events
    this.socket.on('admin-brief-response', (data) => {
      this.notifyListeners('admin-brief-response', data);
    });

    this.socket.on('feedback-response', (data) => {
      this.notifyListeners('feedback-response', data);
    });

    this.socket.on('order-status-updated', (data) => {
      this.notifyListeners('order-status-updated', data);
    });

    // Admin events
    this.socket.on('new-order', (data) => {
      console.log('📦 New order received via socket:', data);
      this.notifyListeners('new-order', data);
    });

    this.socket.on('new-customer-brief', (data) => {
      console.log('📝 New brief received via socket:', data);
      this.notifyListeners('new-customer-brief', data);
    });

    this.socket.on('new-feedback', (data) => {
      this.notifyListeners('new-feedback', data);
    });

    this.socket.on('designUploaded', (data) => {
      console.log('🎨 Design uploaded via socket:', data);
      this.notifyListeners('designUploaded', data);
    });

    this.socket.on('order-ready-for-shipping', (data) => {
      this.notifyListeners('order-ready-for-shipping', data);
    });

    // Super Admin events
    this.socket.on('payment-verified', (data) => {
      this.notifyListeners('payment-verified', data);
    });

    this.socket.on('invoice-generated', (data) => {
      this.notifyListeners('invoice-generated', data);
    });
  }

  // Re-register all listeners after reconnection
  reRegisterListeners() {
    if (!this.socket) return;
    
    // Re-attach all custom event listeners
    this.listeners.forEach((callbacks, event) => {
      this.socket?.off(event); // Remove existing listeners
      callbacks.forEach(callback => {
        this.socket?.on(event, callback);
      });
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Also set up socket listener if socket exists
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
      this.listeners.set(event, callbacks);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit event, socket not connected:', event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.isConnecting = false;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();