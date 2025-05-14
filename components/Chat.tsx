'use client';
import { useEffect, useRef } from 'react';
import { faker } from '@faker-js/faker';
import { motion } from 'framer-motion';

const messages = Array.from({ length: 20 }).map(() => ({
  id: faker.string.uuid(),
  user: faker.internet.userName(),
  text: faker.word.words({ count: { min: 3, max: 10 } }),
}));

export default function Chat() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Автопрокрутка вниз
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
      {messages.map((m) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex gap-2"
        >
          <span className="text-mint-soft">{m.user}</span>
          <span className="text-txt-dim">: {m.text}</span>
        </motion.div>
      ))}
      <p className="text-center text-xs text-txt-dim mt-4">Chat Rules</p>
    </div>
  );
} 