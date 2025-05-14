'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { getAssetUrl } from '../lib/utils';

interface SvgCoinProps {
  side: 'heads' | 'tails';
  spinning: boolean;
}

export default function SvgCoin({ side, spinning }: SvgCoinProps) {
  return (
    <motion.div
      className="w-16 h-16 mx-auto relative"
      animate={spinning ? { rotateY: 360 * 5 } : { rotateY: side === 'heads' ? 0 : 180 }}
      transition={{ 
        duration: spinning ? 2 : 0.5, 
        ease: spinning ? 'linear' : 'easeInOut',
        repeat: spinning ? Infinity : 0,
        repeatType: "loop"
      }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="absolute inset-0 backface-hidden">
        <Image
          src={getAssetUrl(side === 'heads' ? '/heads.png' : '/tails.png')}
          alt={side === 'heads' ? 'Heads' : 'Tails'}
          fill
          priority
          className="object-contain"
        />
      </div>
      <div 
        className="absolute inset-0 backface-hidden" 
        style={{ transform: 'rotateY(180deg)' }}
      >
        <Image
          src={getAssetUrl(side === 'heads' ? '/heads.png' : '/tails.png')}
          alt={side === 'heads' ? 'Heads' : 'Tails'}
          fill
          priority
          className="object-contain"
        />
      </div>
    </motion.div>
  );
} 