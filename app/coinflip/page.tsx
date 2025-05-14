'use client';

import { useState } from 'react';
import BetBar from '../../components/BetBar';
import GameCard from '../../components/GameCard';
import useGames from '../../store/games';
import { motion } from 'framer-motion';
import { useSolanaWallet } from '../../lib/SolanaWalletProvider';
import { SlidersHorizontal, ChevronDown, Clock, TrendingUp } from 'lucide-react';

const sortOptions = [
  { value: 'high', label: 'High → Low', icon: TrendingUp },
  { value: 'low', label: 'Low → High', icon: TrendingUp },
  { value: 'newest', label: 'Newest', icon: Clock },
] as const;

export default function CoinFlipPage() {
  const games = useGames((s) => s.games);
  const setSort = useGames((s) => s.setSort);
  const sort = useGames((s) => s.sort);
  const [amountFilter, setAmountFilter] = useState<'all' | '<0.1' | '0.1-1' | '>1'>('all');
  const { connected } = useSolanaWallet();

  // сортировка
  const sorted = [...games].sort((a, b) => {
    if (sort === 'high') return b.amount - a.amount;
    if (sort === 'low') return a.amount - b.amount;
    return b.createdAt - a.createdAt; // newest
  });

  // фильтрация по сумме
  const filtered = sorted.filter((g) => {
    if (amountFilter === 'all') return true;
    if (amountFilter === '<0.1') return g.amount < 0.1;
    if (amountFilter === '0.1-1') return g.amount >= 0.1 && g.amount <= 1;
    return g.amount > 1;
  });

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-start md:justify-between gap-8">
      {/* Main content */}
      <div className="flex-1 min-w-0 md:pr-6">
        {/* Заголовок страницы */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-sora font-semibold text-mint-soft">Coin Flip</h1>
          <p className="text-txt-dim text-sm mt-1">
            Select a side and bet amount to create or join a game.
          </p>
        </div>
        
        <BetBar />

        {filtered.length > 0 ? (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {filtered.map((g) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GameCard key={g.id} game={g} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="glass p-8 text-center border border-mint/5 rounded-xl shadow-lg">
            <p className="text-txt-dim mb-3">No active games match your filters</p>
            <button 
              onClick={() => {
                setAmountFilter('all');
                setSort('newest');
              }}
              className="btn-secondary text-sm"
            >
              Reset Filters
            </button>
          </div>
        )}
        
        {!connected && games.length === 0 && (
          <div className="mt-8 glass p-6 text-center border border-mint/5 rounded-xl shadow-lg">
            <h3 className="text-lg font-sora font-semibold mb-3 text-mint-soft">Connect Your Wallet</h3>
            <p className="text-txt-dim mb-3">
              Connect your Solana wallet to create a game or join an existing one.
            </p>
            <p className="text-xs text-txt-dim">
              Solana network fees are extremely low, usually less than $0.001 per transaction.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar widgets */}
      <aside className="w-full md:min-w-[320px] md:max-w-[350px] md:sticky md:top-[90px] flex flex-col gap-6 border-t md:border-t-0 md:border-l border-mint/10 md:pl-6 md:pt-0 pt-8">
        {/* Фильтры */}
        <div className="glass p-4 border border-mint/5 rounded-xl shadow-lg">
          <h3 className="text-sm font-semibold text-mint-soft mb-4">Game Filters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-txt-dim block mb-2">Sort by</label>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="w-full appearance-none bg-bg-panel text-white pl-3 pr-8 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-mint/30 text-sm"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value} className="bg-bg-deep text-white">
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-mint" />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-txt-dim block mb-2">Bet amount</label>
              <div className="relative">
                <select
                  value={amountFilter}
                  onChange={(e) => setAmountFilter(e.target.value as any)}
                  className="w-full appearance-none bg-bg-panel text-white pl-3 pr-8 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-mint/30 text-sm"
                >
                  <option value="all" className="bg-bg-deep text-white">All</option>
                  <option value="<0.1" className="bg-bg-deep text-white">{'<'} 0.1 SOL</option>
                  <option value="0.1-1" className="bg-bg-deep text-white">0.1 – 1 SOL</option>
                  <option value=">1" className="bg-bg-deep text-white">{'>'} 1 SOL</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-mint" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-txt-dim">Active games:</span>
              <span className="text-sm font-medium">{filtered.length}</span>
            </div>
          </div>
        </div>
        
        <div className="glass p-4 border border-mint/5 rounded-xl shadow-lg">
          <h3 className="text-sm font-semibold text-mint-soft mb-3">How to play</h3>
          <p className="text-xs text-txt-dim">
            Choose heads or tails and place your bet. If you win, you get double your bet minus a small fee. Games are provably fair using Solana blockchain.
          </p>
        </div>
      </aside>
    </div>
  );
} 