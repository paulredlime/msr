/**
 * SecureVault - Zero-Knowledge Credential Storage
 * Private keys never leave the device, backend only stores public keys + encrypted data
 */

class SecureVault {
  constructor() {
    this.keyPairCache = new Map();
  }

  // Generate or retrieve user's keypair (X25519 or RSA-OAEP 4096)
  async getUserKeyPair(userId) {
    if (this.keyPairCache.has(userId)) {
      return this.keyPairCache.get(userId);
    }

    // Try to load from localStorage first
    const storedPrivateKey = localStorage.getItem(`vault_private_key_${userId}`);
    if (storedPrivateKey) {
      try {
        const privateKey = await crypto.subtle.importKey(
          'jwk',
          JSON.parse(storedPrivateKey),
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          false,
          ['decrypt']
        );
        
        const storedPublicKey = localStorage.getItem(`vault_public_key_${userId}`);
        const publicKey = await crypto.subtle.importKey(
          'jwk',
          JSON.parse(storedPublicKey),
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          true,
          ['encrypt']
        );

        const keyPair = { privateKey, publicKey };
        this.keyPairCache.set(userId, keyPair);
        return keyPair;
      } catch (error) {
        console.warn('Failed to load stored keypair, generating new one:', error);
      }
    }

    // Generate new keypair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Store private key locally only
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    
    localStorage.setItem(`vault_private_key_${userId}`, JSON.stringify(privateKeyJwk));
    localStorage.setItem(`vault_public_key_${userId}`, JSON.stringify(publicKeyJwk));

    // Send public key to backend for storage
    await this.registerPublicKey(userId, publicKeyJwk);

    this.keyPairCache.set(userId, keyPair);
    return keyPair;
  }

  // Register public key with backend (one-time)
  async registerPublicKey(userId, publicKeyJwk) {
    try {
      const response = await fetch('/api/vault/public-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Base44-App/1.0'
        },
        body: JSON.stringify({
          userId,
          publicKey: publicKeyJwk,
          keyType: 'RSA-OAEP-4096'
        })
      });

      if (!response.ok) {
        throw new Error(`Public key registration failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to register public key:', error);
      throw error;
    }
  }

  // Encrypt credentials on device
  async encryptCredentials(userId, storeSlug, credentials) {
    const keyPair = await this.getUserKeyPair(userId);
    
    const credentialData = JSON.stringify({
      username: credentials.username,
      password: credentials.password,
      timestamp: Date.now()
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(credentialData);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      keyPair.publicKey,
      data
    );

    return {
      ciphertext: Array.from(new Uint8Array(ciphertext)),
      version: 'v1'
    };
  }

  // Decrypt credentials on device
  async decryptCredentials(userId, encryptedData) {
    const keyPair = await this.getUserKeyPair(userId);
    
    const ciphertext = new Uint8Array(encryptedData.ciphertext);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      keyPair.privateKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    const credentialData = decoder.decode(decrypted);
    
    return JSON.parse(credentialData);
  }

  // Store encrypted credentials via backend
  async storeCredentials(userId, storeSlug, credentials) {
    const encrypted = await this.encryptCredentials(userId, storeSlug, credentials);
    
    const response = await fetch('/api/vault/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Base44-App/1.0'
      },
      body: JSON.stringify({
        store: storeSlug,
        ciphertext: encrypted.ciphertext,
        version: encrypted.version
      })
    });

    if (!response.ok) {
      throw new Error(`Credential storage failed: ${response.status}`);
    }

    return await response.json();
  }

  // Delete credentials from backend
  async deleteCredentials(userId, storeSlug) {
    const response = await fetch(`/api/vault/credentials/${storeSlug}`, {
      method: 'DELETE',
      headers: {
        'User-Agent': 'Base44-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Credential deletion failed: ${response.status}`);
    }
  }

  // Clear all local keys (logout/reset)
  clearLocalKeys(userId) {
    localStorage.removeItem(`vault_private_key_${userId}`);
    localStorage.removeItem(`vault_public_key_${userId}`);
    this.keyPairCache.delete(userId);
  }
}

export default new SecureVault();