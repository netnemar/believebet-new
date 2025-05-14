'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/coinflip', label: 'Coin Flip' },
  { href: '/jackpot', label: 'Jackpot' },
  { href: '/affiliates', label: 'Affiliates', badge: 'New' },
];

export default function Tabs() {
  const pathname = usePathname();
  const currentTab = tabs.find((tab) => tab.href === pathname) || tabs[0];

  return (
    <div className="relative mb-8 pb-16 pt-4 w-full">
      {/* Fixed width container for tabs, always centered */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-md">
        <div className="flex justify-center items-center border-b border-white/5 overflow-hidden mx-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link 
                key={tab.href} 
                href={tab.href} 
                aria-current={isActive ? 'page' : undefined}
                className="flex-1 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
              >
                <motion.div
                  className={`relative px-4 py-3 rounded-t-lg text-sm font-medium transition-colors
                    ${isActive ? 'text-mint-soft' : 'text-txt-dim hover:text-txt-main'}
                  `}
                  whileHover={!isActive ? { y: -2 } : {}}
                  whileTap={!isActive ? { y: 0 } : {}}
                >
                  <span className="relative z-10">{tab.label}</span>
                  
                  {tab.badge && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-mint text-bg-deep">
                      {tab.badge}
                    </span>
                  )}
                  
                  {isActive && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute inset-0 bg-bg-panel rounded-t-lg border-t border-l border-r border-mint/20"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 pt-4 w-full text-center">
        <h1 className="text-2xl font-sora font-semibold text-mint-soft">{currentTab.label}</h1>
        <p className="text-txt-dim text-sm mt-1">
          {currentTab.href === '/coinflip' && 'Select a side and bet amount to create or join a game.'}
          {currentTab.href === '/jackpot' && 'Enter the pot with any amount. Higher bets have better odds!'}
          {currentTab.href === '/affiliates' && 'Invite friends and earn 25% of their fees.'}
        </p>
      </div>
    </div>
  );
} 