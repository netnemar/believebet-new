'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn, getAssetUrl } from '../lib/utils';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolanaWallet } from '../lib/SolanaWalletProvider';
import { useEffect, useState } from 'react';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import SolanaLogo from './SolanaLogo';
import { useSolanaTransaction } from '../lib/useSolanaTransaction';
import { useInternalWallet } from '../lib/InternalWalletProvider';
import InternalWalletManager from './InternalWalletManager';
import { Wallet } from 'lucide-react';

/**
 * Компонент верхнего хедера приложения Pokets.
 */
export default function Header() {
  const pathname = usePathname();
  const { connected, publicKey } = useSolanaWallet();
  const { getBalance } = useSolanaTransaction();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  
  const { 
    internalWalletBalance, 
    internalWalletConnected,
    internalPublicKey
  } = useInternalWallet();
  
  const links = [
    { href: '/coinflip', label: 'Coin Flip' },
    { href: '/jackpot', label: 'Jackpot' },
    { href: '/affiliates', label: 'Affiliates', badge: 'New' },
    { href: '/provably', label: 'Provably Fair' },
    { href: '/support', label: 'Support' },
  ];

  useEffect(() => {
    async function fetchBalance() {
      if (!connected || !publicKey) {
        setBalance(null);
        return;
      }
      
      try {
        setIsLoading(true);
        const sol = await getBalance();
        setBalance(sol);
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
    
    if (connected) {
      // Обновляем баланс каждые 30 секунд
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, getBalance]);

  return (
    <>
      <header className="h-[70px] w-full flex items-center justify-between px-6 bg-bg-panel shadow-mint/40 backdrop-blur-md relative z-20">
        {/* Левая часть – логотип */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <motion.div
            className="relative w-8 h-8 overflow-hidden rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ rotate: 10 }}
          >
            <Image src={getAssetUrl('/believebet.png')} alt="BelieveBet" fill priority />
          </motion.div>
          <span className="font-sora font-semibold text-lg">BelieveBet</span>
        </Link>

        {/* Центр – ссылки */}
        <nav className="flex-1 flex justify-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative text-sm hover:text-mint-soft transition"
            >
              {l.label}
              {l.badge && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-mint text-bg-deep">
                  {l.badge}
                </span>
              )}
              {pathname === l.href && (
                <motion.span
                  layoutId="header-underline"
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-mint origin-left"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Правая часть - Wallet + Balance */}
        <div className="flex items-center gap-4">
          {/* Wallet PFP (first symbol of wallet address) */}
          {(connected || internalWalletConnected) && (
            <div className="w-8 h-8 rounded-full bg-mint/20 flex items-center justify-center text-mint font-bold text-base select-none border border-mint/40">
              {connected && publicKey
                ? publicKey.toString().slice(0, 1).toUpperCase()
                : internalPublicKey
                  ? internalPublicKey.toString().slice(0, 1).toUpperCase()
                  : 'P'}
            </div>
          )}
          
          {/* Internal wallet balance */}
          {internalWalletConnected && (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1 rounded-full bg-bg-panel text-xs border border-purple-500/40 flex items-center gap-2"
              onClick={() => setIsWalletManagerOpen(true)}
            >
              <Wallet size={14} className="text-purple-400" />
              <span className="text-purple-400 font-semibold">
                {internalWalletBalance.toFixed(3)} SOL
              </span>
            </motion.button>
          )}
          
          {/* External wallet balance */}
          {connected && balance !== null && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1 rounded-full bg-bg-glass backdrop-blur-md text-xs border border-mint/20 flex items-center gap-2"
            >
              <SolanaLogo width={14} height={14} className="text-mint" />
              <span className="text-mint font-semibold">
                {isLoading ? '...' : balance.toFixed(3)} SOL
              </span>
            </motion.div>
          )}
          
          {/* Internal wallet button (if not connected) */}
          {!internalWalletConnected && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 rounded-full bg-bg-panel border border-purple-500/40 text-xs text-purple-400 hover:bg-purple-500/10 transition-colors"
              onClick={() => setIsWalletManagerOpen(true)}
            >
              Site Wallet
            </motion.button>
          )}
          
          <WalletMultiButton className="wallet-button" />
        </div>
      </header>
      
      {/* Internal Wallet Manager Modal */}
      <InternalWalletManager 
        isOpen={isWalletManagerOpen} 
        onClose={() => setIsWalletManagerOpen(false)} 
      />
    </>
  );
} 