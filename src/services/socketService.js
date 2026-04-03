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
    if (this.socket?.connected || this.isConnecting) {
      console.log('Socket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.userRole = userRole;
    this.userId = userId;
    
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    console.log('🔌 Connecting to socket at:', SOCKET_URL);
    
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
        this.joinRooms();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        this.reconnectAttempts++;
        this.isConnecting = false;
      });

      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      this.socket.onAny((eventName, ...args) => {
        console.log(`📨 Received event: ${eventName}`, args[0]);
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      this.isConnecting = false;
    }
  }

  joinRooms() {
    if (!this.socket) return;

    if (this.userRole) {
      const roleMap = {
        'super-admin': 'SuperAdmin',
        'admin': 'Admin',
        'customer': 'Customer'
      };
      const role = roleMap[this.userRole] || this.userRole;
      this.socket.emit('joinRoom', role);
      console.log(`📡 Joined room for role: ${role}`);
    }

    if (this.userId) {
      const userRoom = `user-${this.userId}`;
      this.socket.emit('joinRoom', userRoom);
      console.log(`📡 Joined user room: ${userRoom}`);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    console.log('Setting up socket event listeners');

    if (this.userId) {
      const userRoomName = `user-${this.userId}`;
      this.socket.on(userRoomName, (data) => {
        console.log(`📨 Message in user room:`, data);
        if (data.type) {
          this.notifyListeners(data.type, data);
        }
        if (data.invoiceId) {
          if (data.message?.includes('created')) this.notifyListeners('invoice-created', data);
          if (data.message?.includes('updated')) this.notifyListeners('invoice-updated', data);
          if (data.message?.includes('sent')) this.notifyListeners('invoice-sent', data);
          if (data.message?.includes('deleted')) this.notifyListeners('invoice-deleted', data);
          if (data.message?.includes('payment')) this.notifyListeners('invoice-payment-updated', data);
        }
        if (data.orderId) {
          if (data.status) this.notifyListeners('order-status-updated', data);
        }
        if (data.designId) {
          this.notifyListeners('designUploaded', data);
        }
        if (data.briefId) {
          this.notifyListeners('admin-brief-response', data);
        }
        if (data.feedbackId) {
          this.notifyListeners('feedback-response', data);
        }
        if (data.transactionId) {
          if (data.status === 'approved') this.notifyListeners('payment-verified', data);
          if (data.status === 'rejected') this.notifyListeners('payment-rejected', data);
        }
        if (data.shippingId) {
          if (data.trackingNumber) this.notifyListeners('tracking-updated', data);
          else this.notifyListeners('shipping-created', data);
        }
      });
    }

    const roomEvents = [
      'new-order', 'order-ready-for-invoice', 'order-ready-for-shipping',
      'new-invoice', 'invoice-created', 'invoice-updated', 'invoice-sent', 
      'invoice-deleted', 'invoice-payment-updated', 'new-shipping-invoice',
      'designUploaded', 'designUpdated', 'design-approved',
      'new-customer-brief', 'admin-brief-response', 'brief-deleted',
      'new-feedback', 'feedback-response', 'feedback-resolved',
      'feedback-status-updated', 'feedback-deleted', 'pending-feedback-count',
      'payment-received', 'pending-bank-transfer', 'bank-transfer-verified',
      'shipping-created', 'pickup-ready', 'tracking-updated', 'shipping-status-updated'
    ];

    roomEvents.forEach(event => {
      this.socket.on(event, (data) => {
        console.log(`📨 Room event ${event}:`, data);
        this.notifyListeners(event, data);
      });
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
      if (callbacks.length > 0) {
        this.listeners.set(event, callbacks);
      } else {
        this.listeners.delete(event);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
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