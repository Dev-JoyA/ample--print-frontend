import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token, userRole) {
    if (this.socket?.connected) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      query: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.reconnectAttempts = 0;
      
      // Join appropriate room based on user role
      if (userRole) {
        this.socket.emit('joinRoom', userRole);
        console.log(`📡 Joined ${userRole} room`);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Customer events
    this.on('admin-brief-response', (data) => {
      this.notifyListeners('admin-brief-response', data);
    });

    this.on('feedback-response', (data) => {
      this.notifyListeners('feedback-response', data);
    });

    this.on('order-status-updated', (data) => {
      this.notifyListeners('order-status-updated', data);
    });

    // Admin events
    this.on('new-order', (data) => {
      this.notifyListeners('new-order', data);
    });

    this.on('new-customer-brief', (data) => {
      this.notifyListeners('new-customer-brief', data);
    });

    this.on('new-feedback', (data) => {
      this.notifyListeners('new-feedback', data);
    });

    this.on('designUploaded', (data) => {
      this.notifyListeners('designUploaded', data);
    });

    this.on('order-ready-for-shipping', (data) => {
      this.notifyListeners('order-ready-for-shipping', data);
    });

    // Super Admin events
    this.on('payment-verified', (data) => {
      this.notifyListeners('payment-verified', data);
    });

    this.on('invoice-generated', (data) => {
      this.notifyListeners('invoice-generated', data);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Also set up socket listener
    this.socket?.on(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
      this.listeners.set(event, callbacks);
    }
    this.socket?.off(event, callback);
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }
}

export const socketService = new SocketService();