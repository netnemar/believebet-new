'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useJackpot } from '../store/jackpot';
import toast from 'react-hot-toast';
import Image from 'next/image';

const ITEM_WIDTH = 64; // px including gap
const VISIBLE_COUNT = 8;
const WHEEL_WIDTH = ITEM_WIDTH * VISIBLE_COUNT;
const MAX_SRC = 20;
const MIN_DUPLICATE = 10; // Minimum number of duplications to ensure smooth animation

export default function TicketWheel() {
  const { tickets, spinning, winnerTicket, lastWinners } = useJackpot((s) => ({
    tickets: s.tickets,
    spinning: s.spinning,
    winnerTicket: s.winnerTicket,
    lastWinners: s.lastWinners,
  }));

  const lastWinner = lastWinners.length > 0 ? lastWinners[0] : null;
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const hasTickets = tickets.length > 0;

  // Format wallet address for display
  const formatWalletAddress = (address: string | undefined) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Create an array with duplicated tickets for infinite scroll
  const looped = useMemo(() => {
    // Use a placeholder if there are no tickets
    if (!hasTickets) {
      const placeholder = {
        id: 'placeholder',
        username: 'placeholder',
        avatar: '',
        amount: 0,
        walletAddress: undefined
      };
      return Array.from({ length: 20 }).map(() => placeholder);
    }
    
    // Handle the case when there's only one ticket - duplicate it many times
    if (tickets.length === 1) {
      return Array.from({ length: 20 }).map(() => tickets[0]);
    }
    
    // For multiple tickets, limit the source array to prevent huge arrays
    const source = tickets.slice(-MAX_SRC);
    
    // Determine how many duplications we need based on tickets count
    const duplicateCount = Math.max(MIN_DUPLICATE, Math.floor(40 / source.length));
    
    // Duplicate the source array multiple times for smooth scrolling
    return Array.from({ length: duplicateCount }).flatMap(() => [...source]);
  }, [tickets, hasTickets]);

  // Update the animation when the wheel state changes
  useEffect(() => {
    if (!hasTickets) {
      // Slow, infinite shifting if there are no tickets
      controls.start({ 
        x: ['0%', '-50%'], 
        transition: { 
          duration: 20, 
          ease: 'linear', 
          repeat: Infinity,
          repeatType: "loop" // Changed to loop for better animation
        } 
      });
      return;
    }

    // If the wheel is spinning and there's a winner
    if (spinning && winnerTicket) {
      setHasAnimated(false);
      
      // Handle single player case specially
      if (tickets.length === 1) {
        // Simulate a simple spin animation
        controls.start({
          x: [0, -100, -50, -20, -80, 0],
          transition: {
            duration: 3,
            ease: [0.2, 0.9, 0.8, 1.0], // Custom easing for realistic deceleration
          }
        }).then(() => {
          setHasAnimated(true);
          
          // Show winner notification
          if (lastWinner && !hasAnimated) {
            toast.success(
              `🎉 ${formatWalletAddress(lastWinner.walletAddress)} won ${lastWinner.amount.toFixed(3)} SOL!`, 
              {
                duration: 5000,
                icon: '🏆'
              }
            );
          }
        });
        return;
      }
      
      // Find the index of the winner in the array
      const ticketIndex = looped.findIndex(t => t.id === winnerTicket.id);
      if (ticketIndex !== -1) {
        // Calculate position to place the winner in the center
        const centerOffset = Math.floor(VISIBLE_COUNT / 2);
        const targetIndex = ticketIndex + centerOffset;
        const targetPosition = -(targetIndex * ITEM_WIDTH);
        
        // Animate the wheel rotation with deceleration effect
        controls.start({
          x: targetPosition,
          transition: {
            duration: 5,
            ease: [0.2, 0.9, 0.8, 1.0], // Custom easing for realistic deceleration
          }
        }).then(() => {
          setHasAnimated(true);
          
          // Show winner notification only once
          if (lastWinner && !hasAnimated) {
            toast.success(
              `🎉 ${formatWalletAddress(lastWinner.walletAddress)} won ${lastWinner.amount.toFixed(3)} SOL!`, 
              {
                duration: 5000,
                icon: '🏆'
              }
            );
          }
        });
      }
    } else if (!spinning) {
      // Reset position when stopped
      controls.start({ 
        x: 0, 
        transition: { 
          duration: 0.5 
        } 
      });
      setHasAnimated(false);
    }
  }, [spinning, winnerTicket, looped, controls, hasTickets, lastWinner, hasAnimated, tickets.length]);

  return (
    <div className="flex justify-center mb-6 glass p-4 border border-mint/5 rounded-xl shadow-lg">
      <div
        className="relative overflow-hidden border border-white/10 rounded-xl h-24 shadow-inner bg-bg-deep/50"
        style={{ width: WHEEL_WIDTH }}
      >
        {/* Indicator to show the winner */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-mint/40 z-10"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 w-10 h-3 bg-gradient-to-b from-mint/40 to-transparent"></div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-mint z-10 drop-shadow-glow">▼</div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 w-10 h-3 bg-gradient-to-t from-mint/40 to-transparent"></div>
        
        {/* Glow effects on the sides */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg-deep/50 to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg-deep/50 to-transparent z-10"></div>
        
        {/* Wheel with tickets */}
        <motion.div
          ref={containerRef}
          className="flex gap-2 py-6 w-max px-4"
          animate={controls}
        >
          {looped.map((t, index) => (
            <div
              key={`${t.id}-${index}`}
              className={`w-14 h-14 shrink-0 rounded-full overflow-hidden flex items-center justify-center drop-shadow-md transition-all duration-300 ${
                spinning && winnerTicket && t.id === winnerTicket.id
                  ? 'ring-2 ring-mint shadow-[0_0_15px_rgba(0,255,170,0.5)] scale-110 z-20'
                  : 'hover:scale-105'
              }`}
            >
              <Image
                src="/tails.png"
                alt="Coin"
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
} 