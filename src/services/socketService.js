import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
    this.userId = null;
    this.userRole = null;
  }

  connect(token, userRole, userId) {
    // Prevent multiple connection attempts
    if (this.socket?.connected || this.isConnecting) {
      console.log('Socket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.userRole = userRole;
    this.userId = userId;
    
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    console.log('Connecting to socket at:', SOCKET_URL);
    console.log('With userId:', userId);
    
    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        query: { token },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        forceNew: true,
        timeout: 20000
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully with ID:', this.socket.id);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        
        // Join appropriate rooms
        this.joinRooms();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        this.reconnectAttempts++;
        this.isConnecting = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Set up event listeners AFTER connection is established
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      this.isConnecting = false;
    }
  }

  joinRooms() {
    if (!this.socket) {
      console.log('Cannot join rooms - socket not connected');
      return;
    }

    // Join role-based room
    if (this.userRole) {
      this.socket.emit('joinRoom', this.userRole);
      console.log(`📡 Joined ${this.userRole} room`);
    }

    // Join user-specific room for direct messages
    if (this.userId) {
      this.socket.emit('joinRoom', `user-${this.userId}`);
      console.log(`📡 Joined user-${this.userId} room`);
    }
  }

  // In socketService.js, update the setupEventListeners method:

setupEventListeners() {
  if (!this.socket) {
    console.log('Cannot setup listeners - socket not connected');
    return;
  }

  console.log('Setting up socket event listeners for user:', this.userId);

  // Listen to user-specific room events with a named listener
  const userRoomName = `user-${this.userId}`;
  this.socket.on(userRoomName, (data) => {
    console.log(`📨 Message received in room ${userRoomName}:`, data);
    this.notifyListeners('user-message', data);
    
    // Also notify specific event types based on data
    if (data.type) {
      this.notifyListeners(data.type, data);
    }
    
    // Check for brief response
    if (data.briefId || (data.message && data.message.includes('brief'))) {
      console.log('📝 Detected brief response, notifying listeners');
      this.notifyListeners('admin-brief-response', data);
    }
    
    // Check for design upload
    if (data.designId || data.designUrl) {
      console.log('🎨 Detected design upload, notifying listeners');
      this.notifyListeners('designUploaded', data);
    }
    
    // Check for order status update
    if (data.status) {
      console.log('🔄 Detected status update, notifying listeners');
      this.notifyListeners('order-status-updated', data);
    }
    
    // Check for invoice events
    if (data.invoiceId) {
      console.log('💰 Detected invoice event:', data);
      if (data.message && data.message.includes('created')) {
        this.notifyListeners('invoice-created', data);
      } else if (data.message && data.message.includes('updated')) {
        this.notifyListeners('invoice-updated', data);
      } else if (data.message && data.message.includes('deleted')) {
        this.notifyListeners('invoice-deleted', data);
      } else if (data.message && data.message.includes('sent')) {
        this.notifyListeners('invoice-sent', data);
      } else if (data.message && data.message.includes('payment')) {
        this.notifyListeners('invoice-payment-updated', data);
      }
    }
  });

  // Invoice-related event listeners
  this.socket.on('new-invoice', (data) => {
    console.log('💰 New invoice event:', data);
    this.notifyListeners('new-invoice', data);
  });

  this.socket.on('invoice-created', (data) => {
    console.log('💰 Invoice created event:', data);
    this.notifyListeners('invoice-created', data);
  });

  this.socket.on('invoice-updated', (data) => {
    console.log('💰 Invoice updated event:', data);
    this.notifyListeners('invoice-updated', data);
  });

  this.socket.on('invoice-deleted', (data) => {
    console.log('💰 Invoice deleted event:', data);
    this.notifyListeners('invoice-deleted', data);
  });

  this.socket.on('invoice-sent', (data) => {
    console.log('💰 Invoice sent event:', data);
    this.notifyListeners('invoice-sent', data);
  });

  this.socket.on('invoice-payment-updated', (data) => {
    console.log('💰 Invoice payment updated event:', data);
    this.notifyListeners('invoice-payment-updated', data);
  });

  // Keep the existing event listeners
  this.socket.on('order-status-updated', (data) => {
    console.log('📨 Order status updated event:', data);
    this.notifyListeners('order-status-updated', data);
  });

  this.socket.on('designUploaded', (data) => {
    console.log('🎨 Design uploaded event:', data);
    this.notifyListeners('designUploaded', data);
  });

  this.socket.on('admin-brief-response', (data) => {
    console.log('📝 Admin brief response event:', data);
    this.notifyListeners('admin-brief-response', data);
  });

  this.socket.on('feedback-response', (data) => {
    console.log('💬 Feedback response event:', data);
    this.notifyListeners('feedback-response', data);
  });

  this.socket.on('brief-deleted', (data) => {
    console.log('🗑️ Brief deleted event:', data);
    this.notifyListeners('brief-deleted', data);
  });

  this.socket.on('order-ready-for-invoice', (data) => {
    console.log('💰 Order ready for invoice event:', data);
    this.notifyListeners('order-ready-for-invoice', data);
  });

  this.socket.on('new-order', (data) => {
    console.log('📦 New order event:', data);
    this.notifyListeners('new-order', data);
  });

  this.socket.on('new-customer-brief', (data) => {
    console.log('📝 New customer brief event:', data);
    this.notifyListeners('new-customer-brief', data);
  });
}

  on(event, callback) {
    console.log(`Registering listener for event: ${event}`);
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // If socket exists, set up the listener immediately
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    console.log(`Removing listener for event: ${event}`);
    
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
      if (callbacks.length > 0) {
        this.listeners.set(event, callbacks);
      } else {
        this.listeners.delete(event);
      }
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  notifyListeners(event, data) {
    console.log(`Notifying ${this.listeners.get(event)?.length || 0} listeners for ${event}`, data);
    
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
      console.log(`Emitting event: ${event}`, data);
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit event, socket not connected:', event);
    }
  }

  disconnect() {
    console.log('Disconnecting socket');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.isConnecting = false;
      this.userId = null;
      this.userRole = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();