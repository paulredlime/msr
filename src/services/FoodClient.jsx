// components/services/FoodClient.js

// This is a mock client to simulate interactions with a food delivery aggregation service.
// In a real application, this would make API calls to a backend.

export default class FoodClient {
  static _getAccounts() {
    try {
      const stored = localStorage.getItem('food_account_statuses');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  static _saveAccounts(accounts) {
    localStorage.setItem('food_account_statuses', JSON.stringify(accounts));
  }

  static async getPlatformStatus() {
    // Simulate API call delay
    await new Promise(res => setTimeout(res, 500));
    const accounts = this._getAccounts();
    return { accounts: Object.values(accounts) };
  }

  static async connectPlatform(platform, credentials) {
    // Simulate initiating a connection.
    await new Promise(res => setTimeout(res, 1000));
    
    const accounts = this._getAccounts();
    
    // In a real scenario, the backend would handle this.
    // For this mock, we'll simulate a 2FA requirement for one user
    // and an error for another to showcase the UI.
    if (credentials.email.includes('2fa')) {
      accounts[platform] = {
        platform,
        status: '2fa_required',
        last_error: null,
      };
    } else if (credentials.email.includes('error')) {
       accounts[platform] = {
        platform,
        status: 'error',
        last_error: 'Invalid username or password.',
      };
    } else {
      // Simulate a pending connection that will resolve later
      accounts[platform] = {
        platform,
        status: 'pending',
        last_error: null,
      };
      
      // Simulate successful connection after a few seconds
      setTimeout(() => {
        const currentAccounts = this._getAccounts();
        if (currentAccounts[platform]?.status === 'pending') {
          currentAccounts[platform] = {
            platform,
            status: 'connected',
            last_error: null,
          };
          this._saveAccounts(currentAccounts);
        }
      }, 5000);
    }
    
    this._saveAccounts(accounts);
    return { success: true };
  }

  static async disconnectPlatform(platform) {
    await new Promise(res => setTimeout(res, 500));
    const accounts = this._getAccounts();
    delete accounts[platform];
    this._saveAccounts(accounts);
    return { success: true };
  }
  
  static async submit2FA(platform, code) {
    await new Promise(res => setTimeout(res, 1000));
    const accounts = this._getAccounts();
    
    if (accounts[platform] && code) {
      accounts[platform] = {
        platform,
        status: 'connected',
        last_error: null,
      };
      this._saveAccounts(accounts);
      return { success: true };
    } else {
      accounts[platform].last_error = 'Invalid 2FA code.';
      this._saveAccounts(accounts);
      throw new Error('Invalid 2FA code.');
    }
  }
}