'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { useSolanaWallet } from '../lib/SolanaWalletProvider';
import { useInternalWallet } from '../lib/InternalWalletProvider';
import toast from 'react-hot-toast';

export default function ReferralLinkCard() {
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);
  
  // Get wallet connection states
  const { connected, publicKey } = useSolanaWallet();
  const { internalWalletConnected, internalPublicKey } = useInternalWallet();
  
  // Check if any wallet is connected
  const isAnyWalletConnected = connected || internalWalletConnected;
  
  // Get the current active wallet for referral
  const currentWalletAddress = internalWalletConnected && internalPublicKey
    ? internalPublicKey.toString()
    : (connected && publicKey ? publicKey.toString() : null);
  
  // Generate referral link when requested
  const generateReferralLink = () => {
    if (!currentWalletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    // Use poket.fi domain instead of localhost
    const referralUrl = `https://poket.fi/?ref=${currentWalletAddress}`;
    setReferralLink(referralUrl);
    setShowLink(true);
  };
  
  // Copy referral link
  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div className="glass p-4 w-full border border-mint/5 rounded-xl shadow-lg">
      <p className="text-xs font-medium text-mint-soft mb-3">Your Referral Link</p>
      
      {!isAnyWalletConnected ? (
        <div className="text-center py-3">
          <p className="text-sm text-txt-dim mb-2">Connect your wallet to get your referral link</p>
        </div>
      ) : !showLink ? (
        <div className="text-center py-2">
          <button 
            onClick={generateReferralLink}
            className="py-2 px-4 bg-mint/20 hover:bg-mint/30 text-mint rounded-lg transition-colors"
          >
            Generate Referral Link
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 bg-bg-deep p-3 rounded-lg overflow-hidden">
            <div className="truncate flex-1 text-sm font-mono">{referralLink}</div>
            <button 
              onClick={copyReferralLink}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              {copied ? <Check size={16} className="text-mint" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-xs text-txt-dim mt-2">
            Share this link with others. You'll earn commission when they play on Pokets.
          </p>
        </>
      )}
    </div>
  );
} 