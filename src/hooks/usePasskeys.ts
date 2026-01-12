import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PasskeyCredential {
  id: string;
  credential_id: string;
  device_type: string | null;
  device_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

// Helper functions for base64url encoding/decoding
const base64urlEncode = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const base64urlDecode = (str: string): ArrayBuffer => {
  // Add padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Generate a random challenge
const generateChallenge = (): ArrayBuffer => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array.buffer;
};

// Detect device type based on authenticator
const getDeviceInfo = (): { type: string; name: string } => {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('iphone') || ua.includes('ipad')) {
    return { type: 'apple', name: 'Apple Face ID / Touch ID' };
  } else if (ua.includes('android')) {
    return { type: 'android', name: 'Android Biometric' };
  } else if (ua.includes('windows')) {
    return { type: 'windows', name: 'Windows Hello' };
  } else if (ua.includes('mac')) {
    return { type: 'apple', name: 'Mac Touch ID' };
  }
  return { type: 'security_key', name: 'Security Key' };
};

export const usePasskeys = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Check if WebAuthn is supported
  useEffect(() => {
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  // Fetch user's passkeys
  const fetchCredentials = useCallback(async () => {
    if (!user) {
      setCredentials([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select('id, credential_id, device_type, device_name, created_at, last_used_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch {
      // Silent fail - credentials will be empty
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Register a new passkey
  const registerPasskey = async (): Promise<boolean> => {
    if (!user || !isSupported) return false;

    setIsRegistering(true);

    try {
      const challenge = generateChallenge();
      const deviceInfo = getDeviceInfo();

      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Plataforma de Cursos',
          id: window.location.hostname
        },
        user: {
          id: new TextEncoder().encode(user.id),
          name: user.email || 'user',
          displayName: user.email || 'Usuário'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'none'
      };

      // Create the credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Extract the public key from attestation
      const credentialId = base64urlEncode(credential.rawId);
      const publicKey = base64urlEncode(response.getPublicKey() || new ArrayBuffer(0));
      const transports = response.getTransports ? response.getTransports() : [];

      // Store in database
      const { error } = await supabase
        .from('webauthn_credentials')
        .insert({
          user_id: user.id,
          credential_id: credentialId,
          public_key: publicKey,
          device_type: deviceInfo.type,
          device_name: deviceInfo.name,
          transports: transports,
          counter: 0
        });

      if (error) throw error;

      await fetchCredentials();
      return true;
    } catch {
      return false;
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  // Remove a passkey
  const removePasskey = async (credentialId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('webauthn_credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCredentials(prev => prev.filter(c => c.id !== credentialId));
      return true;
    } catch {
      return false;
      return false;
    }
  };

  // Authenticate with passkey (for re-authentication scenarios)
  const authenticateWithPasskey = async (): Promise<boolean> => {
    if (!user || credentials.length === 0) return false;

    try {
      const challenge = generateChallenge();

      const allowCredentials = credentials.map(cred => ({
        type: 'public-key' as const,
        id: base64urlDecode(cred.credential_id)
      }));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
        rpId: window.location.hostname
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error('Failed to get credential');
      }

      // Update last used timestamp
      const usedCredentialId = base64urlEncode(assertion.rawId);
      await supabase
        .from('webauthn_credentials')
        .update({ last_used_at: new Date().toISOString() })
        .eq('credential_id', usedCredentialId);

      return true;
    } catch {
      return false;
      return false;
    }
  };

  return {
    credentials,
    loading,
    isSupported,
    isRegistering,
    hasPasskeys: credentials.length > 0,
    registerPasskey,
    removePasskey,
    authenticateWithPasskey,
    refetch: fetchCredentials
  };
};
