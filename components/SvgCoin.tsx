'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getAssetUrl } from '../lib/utils';

interface SvgCoinProps {
  side: 'heads' | 'tails';
  spinning: boolean;
}

export default function SvgCoin({ side, spinning }: SvgCoinProps) {
  const [spinSpeed, setSpinSpeed] = useState(2);
  
  // Randomize spin speed slightly for more realistic effect
  useEffect(() => {
    if (spinning) {
      // Random speed between 1.8 and 2.5 seconds per rotation
      setSpinSpeed(1.8 + Math.random() * 0.7);
    }
  }, [spinning]);

  return (
    <motion.div
      className="relative w-16 h-16 md:w-24 md:h-24 select-none"
      animate={spinning ? { rotateY: 360 * 5 } : { rotateY: side === 'heads' ? 0 : 180 }}
      transition={{ duration: spinning ? 2 : 0.5, ease: 'easeInOut' }}
    >
      <Image
        src={getAssetUrl(side === 'heads' ? '/heads.png' : '/tails.png')}
        alt={side === 'heads' ? 'Heads' : 'Tails'}
        fill
        priority
        className="object-contain"
      />
    </motion.div>
  );
} 