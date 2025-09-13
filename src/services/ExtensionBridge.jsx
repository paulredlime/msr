/**
 * ExtensionBridge - Extension detection, WebSocket handling, mobile fallbacks
 */
class ExtensionBridge {
  constructor() {
    this.extensionAvailable = false;
    this.websocketConnections = new Map();
    this.checkExtension();
  }

  // Extension detection via handshake
  checkExtension() {
    const handleExtensionResponse = (event) => {
      if (event.source === window && event.data?.type === 'SHOP_EXTENSION_HELLO') {
        console.log("Extension detected");
        this.extensionAvailable = true;
        this.onExtensionDetected?.();
      }
    };
    
    window.addEventListener('message', handleExtensionResponse);
    
    // Ping extension
    window.postMessage({ type: 'SHOP_APP_HELLO' }, '*');
    
    // Timeout check
    setTimeout(() => {
      if (!this.extensionAvailable) {
        console.log("Extension not detected");
        this.onExtensionMissing?.();
      }
    }, 1000);
  }

  // Device detection
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  isDesktop() {
    return !this.isMobile();
  }

  // WebSocket connection for progress tracking
  connectWebSocket(wsUrl, taskId, callbacks = {}) {
    if (this.websocketConnections.has(taskId)) {
      this.websocketConnections.get(taskId).close();
    }

    const ws = new WebSocket(wsUrl);
    this.websocketConnections.set(taskId, ws);

    ws.onopen = () => {
      console.log(`WebSocket connected for task ${taskId}`);
      callbacks.onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`WebSocket message for task ${taskId}:`, data);
        
        // Handle standard events
        switch (data.status || data.type) {
          case 'OPENED_SITE':
            callbacks.onSiteOpened?.(data);
            break;
          case 'LOGGED_IN':
            callbacks.onLoggedIn?.(data);
            break;
          case 'NEEDS_2FA':
            callbacks.onNeedsTwoFA?.(data);
            break;
          case 'ADDED_ITEM':
            callbacks.onItemAdded?.(data);
            break;
          case 'OUT_OF_STOCK':
            callbacks.onOutOfStock?.(data);
            break;
          case 'SUBSTITUTED':
            callbacks.onSubstituted?.(data);
            break;
          case 'DONE':
            callbacks.onDone?.(data);
            this.websocketConnections.delete(taskId);
            break;
          case 'ERROR':
            callbacks.onError?.(data);
            this.websocketConnections.delete(taskId);
            break;
          default:
            callbacks.onMessage?.(data);
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for task ${taskId}:`, error);
      callbacks.onError?.(error);
    };

    ws.onclose = () => {
      console.log(`WebSocket closed for task ${taskId}`);
      this.websocketConnections.delete(taskId);
      callbacks.onClose?.();
    };

    return ws;
  }

  // Close WebSocket connection
  closeWebSocket(taskId) {
    const ws = this.websocketConnections.get(taskId);
    if (ws) {
      ws.close();
      this.websocketConnections.delete(taskId);
    }
  }

  // Generate QR code for mobile handoff
  generateSessionQR(sessionData) {
    const sessionUrl = `${window.location.origin}/mobile-session?data=${encodeURIComponent(JSON.stringify(sessionData))}`;
    // In production, use a QR code library like qrcode.js
    return sessionUrl;
  }

  // Copy session link for mobile
  copySessionLink(sessionData) {
    const sessionUrl = this.generateSessionQR(sessionData);
    navigator.clipboard.writeText(sessionUrl);
    return sessionUrl;
  }

  // Extension event handlers
  onExtensionDetected = null;
  onExtensionMissing = null;
}

export default new ExtensionBridge();