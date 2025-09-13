import { ErrorLog } from "@/api/entities";
import { User } from "@/api/entities";

class ErrorTracker {
  constructor() {
    this.errorCodes = {
      // Network & API Errors (ERR001-ERR099)
      'ERR001': {
        title: 'Connection Problem',
        message: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again in a few minutes.'
      },
      'ERR002': {
        title: 'Service Temporarily Unavailable', 
        message: 'Our service is temporarily unavailable. We\'re working to fix this. Please try again in a few minutes.'
      },
      'ERR003': {
        title: 'Account Sync Issue',
        message: 'We couldn\'t sync your supermarket accounts right now. This might be a temporary connectivity issue. Please try again in a few minutes.'
      },
      'ERR004': {
        title: 'Order History Unavailable',
        message: 'We couldn\'t retrieve your order history at the moment. This might be because the supermarket\'s system is busy or there\'s a temporary connectivity issue. Please try again in a few minutes.'
      },
      
      // Authentication Errors (ERR100-ERR199)
      'ERR101': {
        title: 'Sign-In Required',
        message: 'Please sign in to your account to continue using this feature.'
      },
      'ERR102': {
        title: 'Account Connection Failed',
        message: 'We couldn\'t connect your supermarket account. Please check your login details and try again.'
      },
      'ERR103': {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again to continue.'
      },
      
      // Data Processing Errors (ERR200-ERR299)
      'ERR201': {
        title: 'Shopping List Error',
        message: 'We couldn\'t process your shopping list. Please try creating it again or contact support.'
      },
      'ERR202': {
        title: 'Price Comparison Unavailable',
        message: 'Price comparison is temporarily unavailable. Please try again in a few minutes.'
      },
      'ERR203': {
        title: 'Import Failed',
        message: 'We couldn\'t import your order. Please try selecting a different order or try again later.'
      },
      
      // General System Errors (ERR900-ERR999)
      'ERR901': {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Our team has been notified and we\'re working to fix it.'
      },
      'ERR902': {
        title: 'Feature Temporarily Disabled',
        message: 'This feature is temporarily disabled for maintenance. Please try again later.'
      }
    };
  }

  async logError(errorCode, technicalDetails, page, action, additionalData = {}) {
    try {
      const user = await User.me().catch(() => null);
      const browserInfo = this.getBrowserInfo();
      
      const errorInfo = this.errorCodes[errorCode] || this.errorCodes['ERR901'];
      
      await ErrorLog.create({
        error_code: errorCode,
        error_title: errorInfo.title,
        error_message: errorInfo.message,
        technical_details: technicalDetails,
        page: page,
        action: action,
        user_id: user?.id || 'anonymous',
        browser_info: JSON.stringify(browserInfo), // Convert object to string
        resolved: false,
        ...additionalData
      });
      
      console.error(`[ErrorTracker] ${errorCode}: ${technicalDetails}`);
    } catch (loggingError) {
      console.error('[ErrorTracker] Failed to log error:', loggingError);
    }
  }

  getUserFriendlyError(errorCode) {
    const errorInfo = this.errorCodes[errorCode] || this.errorCodes['ERR901'];
    return {
      code: errorCode,
      title: errorInfo.title,
      message: errorInfo.message,
      supportMessage: `If this problem continues, please contact support and mention error code ${errorCode}.`
    };
  }

  getBrowserInfo() {
    if (typeof window === 'undefined') return 'Server-side';
    
    const nav = window.navigator;
    return {
      userAgent: nav.userAgent,
      platform: nav.platform,
      language: nav.language,
      cookieEnabled: nav.cookieEnabled,
      onLine: nav.onLine,
      screenResolution: `${window.screen?.width}x${window.screen?.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    };
  }
}

export default new ErrorTracker();