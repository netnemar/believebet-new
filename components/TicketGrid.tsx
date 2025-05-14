'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useJackpot } from '../store/jackpot';

export default function TicketGrid() {
  const tickets = useJackpot((s) => s.tickets);

  // отображаем только 4 последних
  const visible = tickets.slice(-4).reverse();

  return (
    <div className="mb-6 overflow-hidden">
      <AnimatePresence initial={false}>
        {visible.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="glass p-3 mb-2 flex items-center gap-3"
          >
            <Image
              src={t.avatar}
              alt={t.username}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="flex-1 text-sm text-ellipsis overflow-hidden whitespace-nowrap">
              {t.username}
            </span>
            <span className="text-sm">{t.amount} SOL</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 