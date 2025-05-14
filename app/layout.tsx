'use client';

import '../styles/globals.css';
import Header from '../components/Header';
// Sidebar временно убран по дизайну
import { Sora, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { cn, getAssetUrl } from '../lib/utils';
import { ReactNode, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import toast from 'react-hot-toast';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Dynamically import the SolanaWalletProvider to avoid SSR issues
const SolanaWalletProviderNoSSR = dynamic(
  () => import('../lib/SolanaWalletProvider'),
  { ssr: false }
);

// Dynamically import the InternalWalletProvider to avoid SSR issues
const InternalWalletProviderNoSSR = dynamic(
  () => import('../lib/InternalWalletProvider').then(mod => mod.InternalWalletProvider),
  { ssr: false }
);

// Dynamically import the TelegramNotifier to avoid SSR issues
const TelegramNotifierNoSSR = dynamic(
  () => import('../components/TelegramNotifier'),
  { ssr: false }
);

const metadata = {
  title: 'BelieveBet – Coin Flip dApp',
  description: 'Современный бело-фиолетовый CoinFlip dApp на Solana',
  icons: {
    icon: '/believebet.png',
    shortcut: '/believebet.png',
    apple: '/believebet.png',
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Check for referral code on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Parse URL for referral code
    const queryParams = new URLSearchParams(window.location.search);
    const referralCode = queryParams.get('ref');
    
    if (referralCode) {
      // Check if this is first time user (no existing referral)
      const existingReferral = localStorage.getItem('believebet_referral');
      
      if (!existingReferral) {
        // Store the referral
        localStorage.setItem('believebet_referral', referralCode);
        
        // Show welcome notification
        setTimeout(() => {
          toast.success(
            `Welcome! You were referred by ${referralCode.slice(0, 6)}...${referralCode.slice(-4)}`,
            { duration: 5000 }
          );
        }, 1500);
        
        // Show modal with welcome and referral info
        setTimeout(() => {
          // Check if user has accepted terms
          const hasAcceptedTerms = localStorage.getItem('believebet_accepted_terms');
          
          if (!hasAcceptedTerms) {
            if (confirm(
              `Добро пожаловать в BelieveBet!\n\nВас пригласил: ${referralCode}\n\nВы принимаете наши условия?`
            )) {
              localStorage.setItem('believebet_accepted_terms', 'true');
            }
          }
        }, 2500);
      }
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link 
          rel="icon" 
          href="/believebet.png" 
          type="image/png"
        />
        <link 
          rel="apple-touch-icon" 
          href="/believebet.png" 
        />
        <link 
          rel="manifest" 
          href="/manifest.json" 
        />
        <meta name="theme-color" content="#7C3AED" />
      </head>
      <body className={cn(sora.variable, inter.variable, 'font-inter')}>
        <SolanaWalletProviderNoSSR>
          <InternalWalletProviderNoSSR>
            <Header />
            <main className="min-h-screen p-6 overflow-x-hidden overflow-y-auto">{children}</main>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: { background: '#020804', color: '#E7FDF4' },
                success: { style: { background: '#020804', color: '#1EFFA6' } },
                error: { style: { background: '#020804', color: '#FF006E' } },
              }}
            />
            <TelegramNotifierNoSSR />
          </InternalWalletProviderNoSSR>
        </SolanaWalletProviderNoSSR>
      </body>
    </html>
  );
} 