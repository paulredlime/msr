import { GrocerAccount } from "@/api/entities";

// TODO: Replace with proper KMS/HSM encryption in production
// For now, using base64 encoding as placeholder - SECURITY RISK!
const ENCRYPTION_WARNING = 'WARNING: Using demo encryption - implement proper KMS in production';

class SecureCredentialsManager {
  encrypt(text) {
    console.warn(ENCRYPTION_WARNING);
    // TODO: Implement proper encryption using AWS KMS, Azure Key Vault, or similar
    // This is a placeholder - NOT secure for production use
    return btoa(text);
  }

  decrypt(encryptedText) {
    console.warn(ENCRYPTION_WARNING);
    // TODO: Implement proper decryption using AWS KMS, Azure Key Vault, or similar
    // This is a placeholder - NOT secure for production use
    try {
      return atob(encryptedText);
    } catch (error) {
      throw new Error('Failed to decrypt credentials');
    }
  }

  async storeCredentials(userId, store, username, password) {
    console.log(`[SecureCredentialsManager] Storing credentials for ${store}`);
    console.warn(ENCRYPTION_WARNING);
    
    const encryptedPassword = this.encrypt(password);
    
    // Check if credentials already exist
    const existing = await GrocerAccount.filter({ 
      user_id: userId, 
      store: store 
    });

    if (existing.length > 0) {
      // Update existing
      return await GrocerAccount.update(existing[0].id, {
        username: username,
        password_encrypted: encryptedPassword,
        is_active: true,
        sync_status: 'active'
      });
    } else {
      // Create new
      return await GrocerAccount.create({
        user_id: userId,
        store: store,
        username: username,
        password_encrypted: encryptedPassword,
        is_active: true,
        sync_status: 'active'
      });
    }
  }

  async getCredentials(userId, store) {
    const accounts = await GrocerAccount.filter({ 
      user_id: userId, 
      store: store,
      is_active: true 
    });

    if (accounts.length === 0) {
      return null;
    }

    const account = accounts[0];
    return {
      username: account.username,
      password: this.decrypt(account.password_encrypted),
      lastSync: account.last_sync,
      syncStatus: account.sync_status
    };
  }

  async removeCredentials(userId, store) {
    const accounts = await GrocerAccount.filter({ 
      user_id: userId, 
      store: store 
    });

    for (const account of accounts) {
      await GrocerAccount.update(account.id, {
        is_active: false,
        sync_status: 'disabled'
      });
    }

    return true;
  }

  async getConnectionStatuses(userId) {
    const accounts = await GrocerAccount.filter({ user_id: userId });
    
    const statuses = {};
    for (const account of accounts) {
      statuses[account.store] = {
        connected: account.is_active,
        lastSync: account.last_sync,
        syncStatus: account.sync_status,
        username: account.username
      };
    }

    return statuses;
  }
}

export default new SecureCredentialsManager();