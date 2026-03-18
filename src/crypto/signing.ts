import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

const { encodeBase64, decodeBase64 } = naclUtil;

export interface KeyPair {
  publicKey: string;
  secretKey: Uint8Array;
}

export function generateKeyPair(): KeyPair {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: kp.secretKey,
  };
}

export function sign(message: string, secretKey: Uint8Array): string {
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  return encodeBase64(signature);
}

export function verify(message: string, signature: string, publicKey: string): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = decodeBase64(signature);
    const publicKeyBytes = decodeBase64(publicKey);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}
