'use client';

import { useState, useEffect } from 'react';
import JackpotPanel from '../../components/JackpotPanel';
import TicketWheel from '../../components/TicketWheel';
import WinnerCard from '../../components/WinnerCard';
import { useJackpot, HOUSE_WALLET_ADDRESS } from '../../store/jackpot';
import { motion } from 'framer-motion';
import { useSolanaWallet } from '../../lib/SolanaWalletProvider';
import { useInternalWallet } from '../../lib/InternalWalletProvider';
import { useSolanaTransaction } from '../../lib/useSolanaTransaction';
import toast from 'react-hot-toast';
import { getAssetUrl } from '../../lib/utils';
import { sendTelegramNotification } from '../../components/TelegramNotifier';

export default function JackpotPage() {
  const [joinAmount, setJoinAmount] = useState(0.1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useInternalWalletForGame, setUseInternalWalletForGame] = useState(false);
  
  // Jackpot store
  const join = useJackpot((s) => s.join);
  const { lastWinners } = useJackpot();
  
  // External wallet
  const { connected, publicKey, walletAddress } = useSolanaWallet();
  const { sendSol } = useSolanaTransaction();
  
  // Internal wallet
  const { 
    internalWalletConnected,
    internalPublicKey,
    internalWalletBalance,
    transferFromInternal,
  } = useInternalWallet();
  
  // Detect if any wallet is connected
  const anyWalletConnected = connected || internalWalletConnected;
  
  // Get wallet address for current wallet
  const currentWalletAddress = useInternalWalletForGame && internalPublicKey 
    ? internalPublicKey.toString() 
    : (publicKey ? publicKey.toString() : null);
  
  // Get wallet initials for display
  const walletInitials = currentWalletAddress ? currentWalletAddress.slice(0, 2).toUpperCase() : '';
  
  // Handler for joining the jackpot
  const onJoin = async () => {
    if (joinAmount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }
    
    if (!anyWalletConnected) {
      toast.error('Please connect a wallet first');
      return;
    }
    
    // Determine which wallet to use
    const usingInternalWallet = (useInternalWalletForGame && internalWalletConnected) || (!connected && internalWalletConnected);
    
    setIsProcessing(true);
    
    try {
      // Handle bet placement based on wallet type
      if (usingInternalWallet && internalPublicKey) {
        // Check internal wallet balance
        if (internalWalletBalance < joinAmount) {
          toast.error(`Not enough SOL in site wallet. Your balance: ${internalWalletBalance.toFixed(3)} SOL`);
          setIsProcessing(false);
          return;
        }
        
        // Transfer from internal wallet to house address
        const transferSuccess = await transferFromInternal(joinAmount, HOUSE_WALLET_ADDRESS);
        
        if (transferSuccess) {
          // Get username from wallet address
          const username = `int_${internalPublicKey.toString().slice(0, 4)}...${internalPublicKey.toString().slice(-4)}`;
          const avatarUrl = getAssetUrl('/assets/jackpot/coin.png');
          
          // Add ticket to the game
          join(
            joinAmount, 
            username, 
            avatarUrl, 
            internalPublicKey.toString(), 
            true
          );

          // Send notification to Telegram about jackpot participation
          sendTelegramNotification(
            `🎰 <b>Jackpot Participation</b>\n` +
            `💰 Amount: ${joinAmount} SOL\n` +
            `👛 Wallet: ${currentWalletAddress ? 
              currentWalletAddress.slice(0, 8) + '...' + currentWalletAddress.slice(-8) : 'Unknown'}`,
            'action'
          );
        } else {
          toast.error('Transaction failed');
        }
      } else if (connected && publicKey) {
        // External wallet transfer to house address
        const success = await sendSol(joinAmount, HOUSE_WALLET_ADDRESS);
        
        if (success) {
          // Get username from wallet address
          const username = `ext_${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`;
          const avatarUrl = getAssetUrl('/assets/jackpot/coin.png');
          
          // Add ticket to the game
          join(
            joinAmount, 
            username, 
            avatarUrl, 
            publicKey.toString(), 
            false
          );

          // Send notification to Telegram about jackpot participation
          sendTelegramNotification(
            `🎰 <b>Jackpot Participation</b>\n` +
            `💰 Amount: ${joinAmount} SOL\n` +
            `👛 Wallet: ${currentWalletAddress ? 
              currentWalletAddress.slice(0, 8) + '...' + currentWalletAddress.slice(-8) : 'Unknown'}`,
            'action'
          );
        } else {
          toast.error('Transaction failed');
        }
      } else {
        toast.error('No wallet connected');
      }
    } catch (error: any) {
      console.error('Error joining jackpot:', error);
      toast.error(error.message || 'Failed to join jackpot');
    } finally {
      setIsProcessing(false);
    }
  };

  // Predefined bet amounts
  const betAmounts = [0.1, 0.5, 1, 2, 5];

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-start md:justify-between gap-8">
      {/* Main content */}
      <div className="flex-1 min-w-0 md:pr-6">
        {/* Заголовок страницы */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-sora font-semibold text-mint-soft">Jackpot</h1>
          <p className="text-txt-dim text-sm mt-1">
            Enter the pot with any amount. Higher bets have better odds!
          </p>
        </div>
        
        <JackpotPanel />
        <TicketWheel />
        {/* Join form */}
        <div className="glass p-6 mb-6 space-y-4 border border-mint/5 rounded-xl shadow-lg">
          <h2 className="text-xl font-sora font-semibold mb-2 text-mint-soft">Join Jackpot</h2>
          
          {/* Wallet Display */}
          {anyWalletConnected && currentWalletAddress && (
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-mint rounded-full flex items-center justify-center text-bg-deep font-semibold text-xl">
                {walletInitials}
              </div>
              <div className="text-sm">
                <p className="text-txt-dim">Connected with</p>
                <p className="font-medium">{currentWalletAddress.slice(0, 6)}...{currentWalletAddress.slice(-4)}</p>
              </div>
            </div>
          )}
          
          {/* Amount input with quick select buttons */}
          <div>
            <span className="text-sm mb-2 block">Bet amount (SOL)</span>
            <div className="flex gap-2 mb-2">
              {betAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => setJoinAmount(amount)}
                  className={`flex-1 py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                    joinAmount === amount 
                      ? 'bg-mint text-bg-deep' 
                      : 'bg-bg-panel hover:bg-mint/20'
                  }`}
                  disabled={isProcessing}
                >
                  {amount}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={joinAmount}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  setJoinAmount(value);
                }
              }}
              className="w-full input-field"
              disabled={isProcessing}
            />
          </div>
          
          {/* Wallet toggle if both wallets are available */}
          {connected && internalWalletConnected && (
            <div className="p-3 bg-bg-glass rounded-lg border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-txt-dim">Use site wallet balance:</span>
                <button
                  onClick={() => setUseInternalWalletForGame(!useInternalWalletForGame)}
                  className={`relative rounded-full w-12 h-6 transition-colors duration-300 ${
                    useInternalWalletForGame ? 'bg-purple-500' : 'bg-bg-panel'
                  }`}
                  disabled={isProcessing}
                >
                  <span
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform ${
                      useInternalWalletForGame ? 'translate-x-6' : ''
                    }`}
                  ></span>
                </button>
              </div>
              <div className="mt-2 text-xs text-mint/80">
                {useInternalWalletForGame
                  ? `Using site wallet: ${internalWalletBalance.toFixed(3)} SOL available`
                  : `Using external wallet: ${publicKey?.toString().slice(0, 6)}...`
                }
              </div>
            </div>
          )}
          
          {/* Join button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onJoin}
            disabled={isProcessing || !anyWalletConnected}
            className={`w-full py-3 ${anyWalletConnected ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              anyWalletConnected ? 'Join Jackpot' : 'Connect Wallet to Play'
            )}
          </motion.button>
          
          {!anyWalletConnected && (
            <div className="mt-4 p-3 border border-mint/20 rounded bg-mint/5 text-sm">
              Connect your wallet to join the jackpot. Bets are placed in SOL and the winner takes all!
            </div>
          )}
        </div>
      </div>
      {/* Sidebar widgets */}
      <aside className="w-full md:min-w-[320px] md:max-w-[350px] md:sticky md:top-[90px] flex flex-col gap-6 border-t md:border-t-0 md:border-l border-mint/10 md:pl-6 md:pt-0 pt-8">
        <WinnerCard />
      </aside>
    </div>
  );
} 