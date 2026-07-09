/**
 * Encrypts a text using a key derived from a secret (e.g. UID).
 * Returns a hex string containing the IV followed by the ciphertext.
 */
export async function encryptText(text: string, secret: string): Promise<string> {
  if (!text) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Derive a key from the secret using SHA-256
    const secretBuffer = encoder.encode(secret);
    const hash = await crypto.subtle.digest('SHA-256', secretBuffer);
    const key = await crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Generate a 12-byte IV for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine IV and Ciphertext into one array
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to hex string
    return Array.from(result)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    console.error('Encryption failed:', e);
    throw new Error('Could not encrypt the API key.');
  }
}

/**
 * Decrypts a hex string using a key derived from a secret (e.g. UID).
 * Returns the decrypted plaintext string.
 */
export async function decryptText(encryptedHex: string, secret: string): Promise<string> {
  if (!encryptedHex) return '';
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Derive key
    const secretBuffer = encoder.encode(secret);
    const hash = await crypto.subtle.digest('SHA-256', secretBuffer);
    const key = await crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Convert hex back to bytes
    const matches = encryptedHex.match(/.{1,2}/g);
    if (!matches) {
      throw new Error('Invalid encrypted format.');
    }
    const encryptedBytes = new Uint8Array(
      matches.map(byte => parseInt(byte, 16))
    );
    
    const iv = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    
    return decoder.decode(decrypted);
  } catch (e) {
    console.error('Decryption failed:', e);
    throw new Error('Could not decrypt the API key.');
  }
}
