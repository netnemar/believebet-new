'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronsLeft } from 'lucide-react';

/**
 * Левый сайдбар — только виджет Airdrop (чат временно убрали).
 */
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 0 : 320 }}
      className="h-full bg-bg-panel flex flex-col overflow-hidden border-r border-white/5 relative"
    >
      {/* Кнопка сворачивания */}
      <button
        type="button"
        onClick={() => setCollapsed((p) => !p)}
        className="absolute -right-4 top-4 w-8 h-8 rounded-full bg-bg-panel flex items-center justify-center border border-white/5 shadow-mint"
      >
        <ChevronsLeft size={16} className={collapsed ? 'rotate-180' : ''} />
      </button>

      <div className="p-4 space-y-4">
        {/* Airdrop */}
        <div className="glass p-4 text-center">
          <p className="text-xs text-txt-dim mb-1">LIVE Airdrop</p>
          <p className="text-2xl font-semibold">0.255 SOL</p>
        </div>
      </div>
    </motion.aside>
  );
} 