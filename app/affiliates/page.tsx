'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Users, DollarSign, Link, ArrowRight, Award } from 'lucide-react';
import { useSolanaWallet } from '../../lib/SolanaWalletProvider';
import { useInternalWallet } from '../../lib/InternalWalletProvider';
import toast from 'react-hot-toast';
import ReferralLinkCard from '../../components/ReferralLinkCard';

const TIERS = [
  { name: 'Bronze', commission: '20%', requirements: '5 referrals', icon: '🥉' },
  { name: 'Silver', commission: '25%', requirements: '15 referrals', icon: '🥈' },
  { name: 'Gold', commission: '30%', requirements: '30 referrals', icon: '🥇' },
  { name: 'Diamond', commission: '40%', requirements: '50 referrals', icon: '💎' },
];

export default function AffiliatesPage() {
  const { connected, publicKey } = useSolanaWallet();
  const { internalWalletConnected, internalPublicKey } = useInternalWallet();
  const [ownReferrer, setOwnReferrer] = useState<string | null>(null);
  
  // Set base URL on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if user was referred
      const referrer = localStorage.getItem('pokets_referral');
      setOwnReferrer(referrer);
    }
  }, []);
  
  // Get the current active wallet for referral
  const currentWalletAddress = internalWalletConnected && internalPublicKey
    ? internalPublicKey.toString()
    : (connected && publicKey ? publicKey.toString() : null);
  
  // Stats that would normally be fetched from an API
  const stats = {
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0,
    availableToClaim: 0,
    tier: 'Bronze',
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-sora font-semibold mb-4 text-mint-soft">Affiliate Program</h1>
          <p className="text-txt-dim max-w-2xl mx-auto">
            Earn passive income by referring users to Pokets. Receive up to 40% commission on house fees 
            from every game your referrals play.
          </p>
        </div>
        
        {ownReferrer && (
          <div className="mb-8 p-4 border border-mint/20 rounded-lg bg-mint/5">
            <h3 className="font-medium text-mint mb-2 flex items-center gap-2">
              <Award size={18} className="text-mint" />
              You were referred by
            </h3>
            <p className="text-sm font-mono">{ownReferrer}</p>
          </div>
        )}
        
        {currentWalletAddress ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <ReferralLinkCard />
              
              <div className="glass p-4 border border-white/5">
                <h3 className="font-sora text-lg mb-2">Your Tier</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center text-2xl bg-bg-panel rounded-full">
                    {TIERS.find(t => t.name === stats.tier)?.icon || '🥉'}
                  </div>
                  <div>
                    <h4 className="font-medium text-mint-soft">{stats.tier}</h4>
                    <p className="text-xs text-txt-dim">
                      Commission rate: {TIERS.find(t => t.name === stats.tier)?.commission || '20%'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass p-4 text-center border border-white/5">
                <Users size={24} className="mx-auto mb-2 text-mint-soft" />
                <p className="text-xs text-txt-dim">Total Referrals</p>
                <p className="text-xl font-sora font-medium mt-1">{stats.totalReferrals}</p>
              </div>
              
              <div className="glass p-4 text-center border border-white/5">
                <Users size={24} className="mx-auto mb-2 text-mint-soft" />
                <p className="text-xs text-txt-dim">Active Referrals</p>
                <p className="text-xl font-sora font-medium mt-1">{stats.activeReferrals}</p>
              </div>
              
              <div className="glass p-4 text-center border border-white/5">
                <DollarSign size={24} className="mx-auto mb-2 text-mint-soft" />
                <p className="text-xs text-txt-dim">Total Earned</p>
                <p className="text-xl font-sora font-medium mt-1">{stats.totalEarned} SOL</p>
              </div>
              
              <div className="glass p-4 text-center border border-white/5">
                <DollarSign size={24} className="mx-auto mb-2 text-mint-soft" />
                <p className="text-xs text-txt-dim">Available to Claim</p>
                <p className="text-xl font-sora font-medium mt-1">{stats.availableToClaim} SOL</p>
              </div>
            </div>
            
            {stats.availableToClaim > 0 && (
              <div className="flex justify-center mb-8">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary px-8 py-2"
                  onClick={() => toast.success('This feature is coming soon!')}
                >
                  Claim {stats.availableToClaim} SOL
                </motion.button>
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="font-sora text-lg mb-4">Recent Referrals</h3>
              {stats.totalReferrals > 0 ? (
                <div className="glass p-4 border border-white/5">
                  <table className="w-full">
                    <thead>
                      <tr className="text-txt-dim text-sm border-b border-white/5">
                        <th className="pb-2 text-left">User</th>
                        <th className="pb-2 text-right">Games Played</th>
                        <th className="pb-2 text-right">Commission Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-txt-dim">No referrals yet</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass p-8 text-center border border-white/10">
                  <p className="text-txt-dim mb-4">You haven't referred anyone yet.</p>
                  <p className="text-sm">Share your referral link to start earning!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="glass p-8 text-center mb-8">
            <Link size={48} className="mx-auto mb-4 text-mint opacity-50" />
            <h3 className="text-xl font-sora mb-2">Connect Your Wallet</h3>
            <p className="text-txt-dim mb-6">
              Connect your Solana wallet to get your unique referral link and start earning rewards.
            </p>
            <button 
              className="btn-primary px-6 py-2"
              onClick={() => toast.error('Please connect your wallet using the button in the header')}
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
      
      <div className="glass p-8">
        <h2 className="text-2xl font-sora font-semibold mb-6 text-mint-soft">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-mint/10 flex items-center justify-center mb-4">
              <Link size={24} className="text-mint" />
            </div>
            <h3 className="font-medium mb-2">Get Your Link</h3>
            <p className="text-sm text-txt-dim">
              Connect your wallet and get your unique referral link to share with others.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-mint/10 flex items-center justify-center mb-4">
              <Users size={24} className="text-mint" />
            </div>
            <h3 className="font-medium mb-2">Invite Friends</h3>
            <p className="text-sm text-txt-dim">
              Share your link on social media, with friends, or in crypto communities.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-mint/10 flex items-center justify-center mb-4">
              <DollarSign size={24} className="text-mint" />
            </div>
            <h3 className="font-medium mb-2">Earn Rewards</h3>
            <p className="text-sm text-txt-dim">
              Earn a percentage of the house fees from every game your referrals play, forever!
            </p>
          </div>
        </div>
        
        <h2 className="text-xl font-sora font-semibold mb-4 text-mint-soft">Commission Tiers</h2>
        <p className="text-txt-dim mb-6">
          Increase your commission rate by referring more active users to Pokets.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {TIERS.map((tier) => (
            <div key={tier.name} className="glass p-4 border border-white/5 text-center">
              <div className="text-3xl mb-2">{tier.icon}</div>
              <h3 className="font-medium mb-1">{tier.name}</h3>
              <p className="text-mint font-bold mb-1">{tier.commission}</p>
              <p className="text-xs text-txt-dim">{tier.requirements}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 border border-mint/20 rounded bg-mint/5">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Award size={18} className="text-mint" />
            Affiliate Bonus
          </h3>
          <p className="text-sm text-txt-dim">
            Top affiliates are eligible for additional bonuses and early access to new features.
            Contact our support team for more information.
          </p>
        </div>
      </div>
    </div>
  );
} 