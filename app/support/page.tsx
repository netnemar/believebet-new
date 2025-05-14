'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Mail, Twitter, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !subject || !message) {
      toast.error('Please fill out all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate sending the form
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Your message has been sent!');
      
      // Reset form after submission
      setEmail('');
      setSubject('');
      setMessage('');
      
      // Reset success state after a delay
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    }, 1500);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass p-8 mb-8">
        <h1 className="text-3xl font-sora font-semibold mb-6 text-mint-soft">Support Center</h1>
        
        <div className="mb-8">
          <p className="mb-4">
            We're here to help! If you have any questions or issues, please reach out using the method below.
          </p>
          
          <div className="grid grid-cols-1 gap-4 mt-6">
            <div className="glass p-4 flex flex-col items-center text-center">
              <Twitter size={24} className="mb-2 text-mint" />
              <h3 className="font-sora font-medium mb-1">Twitter</h3>
              <p className="text-sm text-txt-dim">Follow for updates</p>
              <a href="https://twitter.com/believebet" target="_blank" rel="noopener noreferrer" className="text-mint mt-2 text-sm hover:underline">@believebet</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 mt-8">
          <h2 className="text-xl font-sora font-semibold mb-4">Contact Us</h2>
          
          {isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-mint/10 border border-mint/30 rounded-lg flex items-center justify-center"
            >
              <div className="text-center">
                <CheckCircle size={48} className="text-mint mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Thank You!</h3>
                <p className="text-txt-dim">
                  Your message has been received. We'll get back to you as soon as possible.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block mb-2 text-sm">Your Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full input-field"
                  placeholder="name@example.com"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="subject" className="block mb-2 text-sm">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full input-field"
                  placeholder="What is your inquiry about?"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block mb-2 text-sm">Message</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full input-field min-h-[120px]"
                  placeholder="How can we help you?"
                  required
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-6 py-3 flex items-center justify-center gap-2 w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          )}
        </div>
      </div>
      
      <div className="glass p-8 mb-8">
        <h2 className="text-xl font-sora font-semibold mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-sora font-medium mb-2 text-mint-soft">How do I deposit SOL to play games?</h3>
            <p className="text-txt-dim">
              You can connect your Solana wallet using the wallet button in the top right corner. 
              Alternatively, you can create an internal site wallet and transfer SOL to it.
              Once connected, you can use your SOL balance to participate in games.
            </p>
          </div>
          
          <div>
            <h3 className="font-sora font-medium mb-2 text-mint-soft">What is the minimum bet amount?</h3>
            <p className="text-txt-dim">
              The minimum bet amount is 0.01 SOL for CoinFlip and 0.05 SOL for Jackpot games.
            </p>
          </div>
          
          <div>
            <h3 className="font-sora font-medium mb-2 text-mint-soft">How do I withdraw my winnings?</h3>
            <p className="text-txt-dim">
              Winnings are automatically sent to your connected wallet address after a successful game.
              For site wallet users, winnings are added to your site wallet balance, which you can withdraw
              to your external wallet at any time.
            </p>
          </div>
          
          <div>
            <h3 className="font-sora font-medium mb-2 text-mint-soft">How do I know the games are fair?</h3>
            <p className="text-txt-dim">
              BelieveBet uses a provably fair system based on Solana blockchain data. You can verify all game outcomes
              by checking the block hash and transaction details provided after each game. Visit our
              <a href="/provably" className="text-mint mx-1 hover:underline">Provably Fair</a> 
              page to learn more.
            </p>
          </div>
          
          <div>
            <h3 className="font-sora font-medium mb-2 text-mint-soft">What fees does BelieveBet charge?</h3>
            <p className="text-txt-dim">
              BelieveBet takes a small 3% fee from each game to maintain the platform. The remaining 97% goes directly
              to the winner's pool. There are no hidden fees or charges.
            </p>
          </div>
          
          <div>
            <h3 className="font-sora font-medium mb-2 text-mint-soft">Is there a mobile app?</h3>
            <p className="text-txt-dim">
              Currently, BelieveBet is available as a web application optimized for both desktop and mobile browsers.
              A dedicated mobile app is in development and will be released soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 