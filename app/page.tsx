'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { DollarSign, Users, Dice1, Award } from 'lucide-react';
import { getAssetUrl } from '../lib/utils';
import ReferralLinkCard from '../components/ReferralLinkCard';

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass p-8 md:p-12 mb-8 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-sora font-bold mb-4 text-mint-soft">
          Welcome to <span className="text-mint">BelieveBet</span>
        </h1>
        <p className="text-txt-dim max-w-2xl mx-auto mb-8 text-lg">
          Play secure, fair, and exciting blockchain games with Solana. Win big and have fun!
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <Link href="/jackpot">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary px-8 py-3 text-lg font-medium flex items-center gap-2"
            >
              <DollarSign size={20} />
              Play Now
            </motion.div>
          </Link>
          
          <Link href="/affiliates">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary px-8 py-3 text-lg font-medium flex items-center gap-2"
            >
              <Users size={20} />
              Refer & Earn
            </motion.div>
          </Link>
        </div>
        
        <div className="flex justify-center">
          {/* Removed GitHub icon and link */}
        </div>
      </motion.div>
      
      {/* Game options */}
      <div className="mb-12">
        <h2 className="text-2xl font-sora font-semibold mb-6 text-center">Choose Your Game</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/jackpot">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass p-6 border border-white/5 hover:border-mint/20 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-mint/10 rounded-2xl flex items-center justify-center">
                  <Award size={32} className="text-mint" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold">Jackpot</h3>
                  <p className="text-txt-dim">Winner takes all!</p>
                </div>
              </div>
              <p className="text-sm text-txt-dim mb-4">
                Join the pot and compete for the entire prize pool. The more you bet, the higher your chance to win.
              </p>
              <div className="bg-bg-panel rounded-lg p-3 text-sm">
                <p className="text-mint-soft">Current pot: Checking...</p>
              </div>
            </motion.div>
          </Link>
          
          <Link href="/coinflip">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass p-6 border border-white/5 hover:border-mint/20 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-mint/10 rounded-2xl flex items-center justify-center">
                  <Dice1 size={32} className="text-mint" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold">Coin Flip</h3>
                  <p className="text-txt-dim">50/50 chance to double your bet</p>
                </div>
              </div>
              <p className="text-sm text-txt-dim mb-4">
                Simple, classic gameplay. Choose heads or tails and flip the coin. Win to double your wager!
              </p>
              <div className="bg-bg-panel rounded-lg p-3 text-sm">
                <p className="text-mint-soft">Quick games, instant results</p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
      
      {/* Features section */}
      <div className="glass p-8 mb-8">
        <h2 className="text-2xl font-sora font-semibold mb-6 text-center">Why Choose BelieveBet</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-mint/10 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mint">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Secure & Fair</h3>
            <p className="text-sm text-txt-dim">
              All games are provably fair and transactions are secured by Solana blockchain.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-mint/10 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mint">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Lightning Fast</h3>
            <p className="text-sm text-txt-dim">
              Experience near-instant deposits and withdrawals with Solana's ultra-fast blockchain.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-mint/10 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mint">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Low Fees</h3>
            <p className="text-sm text-txt-dim">
              Enjoy minimal house fees and take advantage of Solana's low transaction costs.
            </p>
          </div>
        </div>
      </div>
      
      {/* Referral program */}
      <div className="glass p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-sora font-semibold">Refer Friends & Earn</h2>
          <Link href="/affiliates">
            <span className="text-mint hover:underline">View Details</span>
          </Link>
        </div>
        
        <p className="text-txt-dim mb-6">
          Share your unique referral link and earn up to 40% commission on house fees from every game your referrals play.
        </p>
        
        <ReferralLinkCard />
        
        <div className="mt-4 text-center">
          <Link href="/affiliates">
            <button className="btn-secondary px-6 py-2 mt-2">View Affiliate Program</button>
          </Link>
        </div>
      </div>
      
      <footer className="text-center text-txt-dim text-sm mb-8">
        <p>© 2025 BelieveBet. All rights reserved.</p>
        <p className="mt-2">
          {/* Removed GitHub: netnemar link */}
        </p>
      </footer>
    </div>
  );
} 