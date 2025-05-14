'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { faker } from '@faker-js/faker';
import toast from 'react-hot-toast';
import SvgCoin from './SvgCoin';
import useGames from '../store/games';
import { useRouter } from 'next/navigation';
import { useSolanaWallet } from '../lib/SolanaWalletProvider';
import { useSolanaTransaction } from '../lib/useSolanaTransaction';
import { useSolanaContract } from '../lib/useSolanaContract';
import { useInternalWallet } from '../lib/InternalWalletProvider';
import { User, Bot, Users } from 'lucide-react';
import Image from 'next/image';
import { getAssetUrl } from '../lib/utils';
import { sendTelegramNotification } from './TelegramNotifier';

const chips = [0.1, 0.5, 1];
// House wallet address where losers' funds go
const HOUSE_WALLET_ADDRESS = 'ErdeYZZMx12X2zMwV8WidLVUzrGg71Kn1i4cjvowmPWq';

type Side = 'heads' | 'tails';
type GameMode = 'public' | 'self' | 'house';

export default function BetBar() {
  const [amount, setAmount] = useState(0.1);
  const [side, setSide] = useState<Side>('heads');
  const [spinning, setSpinning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useInternalWalletForGame, setUseInternalWalletForGame] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('public');
  
  const addGame = useGames((s) => s.addGame);
  const router = useRouter();
  
  // External wallet
  const { connected, publicKey, wallet } = useSolanaWallet();
  const { getBalance, sendSol } = useSolanaTransaction();
  const { createGame, isLoading } = useSolanaContract();
  
  // Internal wallet
  const { 
    internalWalletConnected, 
    internalPublicKey, 
    internalWalletBalance,
    transferFromInternal
  } = useInternalWallet();

  const onAddChip = (v: number) => {
    setAmount((prev) => Number((prev + v).toFixed(2)));
  };

  const handleCreateGame = async () => {
    // Check which wallet to use
    const usingInternalWallet = useInternalWalletForGame && internalWalletConnected;
    
    if (!usingInternalWallet && !connected) {
      toast.error('Please connect your wallet first!');
      return;
    }
    
    if (usingInternalWallet && !internalWalletConnected) {
      toast.error('Please connect your site wallet first!');
      return;
    }
    
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    if (amount < 0.01) {
      toast.error('Minimum bet is 0.01 SOL');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let txDetails;
      let walletPublicKey = usingInternalWallet ? internalPublicKey : publicKey;
      
      // All games now send funds to the house address
      const destinationAddress = HOUSE_WALLET_ADDRESS;
      
      // If using internal wallet, we need to perform the transaction directly
      if (usingInternalWallet) {
        // Check balance
        if (internalWalletBalance < amount) {
          toast.error(`Not enough SOL in site wallet. Your balance: ${internalWalletBalance.toFixed(3)} SOL`);
          setIsProcessing(false);
          return;
        }
        
        setSpinning(true);
        
        // Transfer SOL from internal wallet to the house address
        const transferSuccess = await transferFromInternal(amount, destinationAddress);
        
        if (transferSuccess) {
          // Since we don't have the real transaction details from contract, 
          // we'll create a simplified version for demo
          txDetails = {
            signature: faker.string.uuid(),
            blockNumber: Math.floor(Math.random() * 100000000),
            timestamp: Date.now(),
            seed: faker.string.hexadecimal({ length: 32 }),
            secret: faker.string.hexadecimal({ length: 32 }),
            winningTicket: Math.floor(Math.random() * 100000).toString(),
          };
        } else {
          throw new Error('Internal wallet transaction failed');
        }
      } else {
        // Use external wallet with contract
        const balance = await getBalance();
        if (balance < amount) {
          toast.error(`Not enough SOL. Your balance: ${balance.toFixed(3)} SOL`);
          setIsProcessing(false);
          return;
        }
        
        setSpinning(true);
        
        // For all game modes, transfer directly to house address
        const success = await sendSol(amount, destinationAddress);
        
        if (success) {
          txDetails = {
            signature: faker.string.uuid(),
            blockNumber: Math.floor(Math.random() * 100000000),
            timestamp: Date.now(),
            seed: faker.string.hexadecimal({ length: 32 }),
            secret: faker.string.hexadecimal({ length: 32 }),
            winningTicket: Math.floor(Math.random() * 100000).toString(),
          };
        } else {
          throw new Error('Transaction failed');
        }
      }
      
      if (txDetails) {
        // Get wallet public key as string
        const walletAddress = walletPublicKey ? walletPublicKey.toString() : undefined;
        
        // Get player username from wallet
        const username = walletPublicKey 
          ? walletPublicKey.toString().slice(0, 4) + '...' + walletPublicKey.toString().slice(-4) 
          : faker.internet.userName();
        
        // Get player avatar
        const userAvatar = faker.image.avatarGitHub();
        
        if (gameMode === 'self') {
          // Self-play: create two games with the same user
          const gameId = addGame({
            username,
            avatar: userAvatar,
            amount,
            side: 'heads',
            isSelfPlay: true,
            walletAddress
          });
          
          // Create opponent for self-play (tails)
          addGame({
            username,
            avatar: userAvatar,
            amount,
            side: 'tails',
            parentGameId: gameId,
            isSelfPlay: true,
            walletAddress
          });
          
          toast.success('Self-play game created! 🎮', {
            icon: '🎮',
            id: 'self-game-created'
          });
          
          // Redirect to the game page
          setTimeout(() => {
            router.push(`/coinflip/${gameId}`);
          }, 1000);
        } else if (gameMode === 'house') {
          // House play: create a game against the house
          const gameId = addGame({
            username,
            avatar: userAvatar,
            amount,
            side,
            isHousePlay: true,
            walletAddress
          });
          
          // Create house player with opposite side
          const houseSide = side === 'heads' ? 'tails' : 'heads';
          addGame({
            username: 'House',
            avatar: getAssetUrl('/believebet.png'), // Use the site logo for the house
            amount,
            side: houseSide,
            parentGameId: gameId,
            isHouse: true,
            walletAddress: HOUSE_WALLET_ADDRESS
          });
          
          toast.success('House game created! 🏛️', {
            icon: '🎮',
            id: 'house-game-created'
          });
          
          // Redirect to the game page
          setTimeout(() => {
            router.push(`/coinflip/${gameId}`);
          }, 1000);
        } else {
          // Regular public game
          const newId = addGame({
            username,
            avatar: userAvatar,
            amount,
            side,
            walletAddress
          });
          
          toast.success('Game created! 🎉', {
            icon: '🎮',
            id: 'game-created'
          });
          
          // Redirect to the game page
          setTimeout(() => {
            router.push(`/coinflip/${newId}`);
          }, 1000);
        }

        // Send notification to Telegram about game creation
        sendTelegramNotification(
          `🎮 <b>New Game Created</b>\n` +
          `💰 Amount: ${amount} SOL\n` +
          `🎲 Side: ${side}\n` +
          `🎯 Mode: ${gameMode}\n` +
          `👛 Wallet: ${walletAddress?.slice(0, 8)}...${walletAddress?.slice(-8) || ''}`,
          'action'
        );
      } else {
        toast.error('Failed to create game');
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error(error.message || 'Transaction failed');
    } finally {
      setSpinning(false);
      setIsProcessing(false);
    }
  };

  // Detect if any wallet is connected
  const anyWalletConnected = connected || internalWalletConnected;

  return (
    <div className="glass p-6 mb-6 space-y-4 border border-mint/5 rounded-xl shadow-lg">
      <h2 className="text-xl font-sora font-semibold mb-4 text-mint-soft">Create a New Game</h2>
      
      {/* Game mode select */}
      <div className="flex gap-3">
        <button
          onClick={() => setGameMode('public')}
          className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-150 ${
            gameMode === 'public' 
              ? 'bg-mint/20 border border-mint/30 text-mint shadow-inner' 
              : 'bg-bg-panel border border-white/10 text-txt-dim hover:bg-bg-glass'
          }`}
        >
          <Users size={14} />
          <span>Public</span>
        </button>
        
        <button
          onClick={() => setGameMode('house')}
          className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-150 ${
            gameMode === 'house' 
              ? 'bg-mint/20 border border-mint/30 text-mint shadow-inner' 
              : 'bg-bg-panel border border-white/10 text-txt-dim hover:bg-bg-glass'
          }`}
        >
          <Bot size={14} />
          <span>vs House</span>
        </button>
        
        <button
          onClick={() => setGameMode('self')}
          className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-150 ${
            gameMode === 'self' 
              ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400 shadow-inner' 
              : 'bg-bg-panel border border-white/10 text-txt-dim hover:bg-bg-glass'
          }`}
        >
          <User size={14} />
          <span>Self Play</span>
        </button>
      </div>
      
      {/* Game mode description */}
      {gameMode === 'self' && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm shadow-inner">
          <p className="text-purple-300">
            In self-play mode, you'll play against yourself with both sides of the coin.
            This is useful for testing or seeing both sides of the game.
          </p>
        </div>
      )}
      
      {gameMode === 'house' && (
        <div className="p-3 bg-mint/10 border border-mint/20 rounded-lg text-sm shadow-inner">
          <p className="text-mint/90">
            Play against the house! Choose your side and bet an amount. The house will take the opposite side.
            If you win, you'll get double your bet minus a small fee.
          </p>
        </div>
      )}
      
      {gameMode === 'public' && (
        <div className="p-3 bg-mint/10 border border-mint/20 rounded-lg text-sm shadow-inner">
          <p className="text-mint/90">
            Create a public game where other players can join and take the opposite side.
            Winner takes all!
          </p>
        </div>
      )}
      
      <div className="flex items-center gap-4 mt-2">
        <span className="text-sm font-medium text-mint-soft">Bet amount (SOL)</span>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={amount}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
              setAmount(value);
            }
          }}
          className="flex-1 input-field border border-white/10 focus:border-mint/30 rounded-lg"
        />
      </div>

      {/* Chips */}
      <div className="flex gap-3">
        {chips.map((c) => (
          <motion.button
            key={c}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddChip(c)}
            className="btn-secondary px-3 py-1 text-sm border border-white/10 shadow-sm hover:shadow rounded-lg"
          >
            +{c}
          </motion.button>
        ))}
      </div>
      
      {/* Wallet Select Toggle (only if both wallets are connected) */}
      {connected && internalWalletConnected && (
        <div className="p-3 bg-bg-glass rounded-lg border border-white/10 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-sm text-txt-dim">Use site wallet balance:</span>
            <button
              onClick={() => setUseInternalWalletForGame(!useInternalWalletForGame)}
              className={`relative rounded-full w-12 h-6 transition-colors duration-300 ${
                useInternalWalletForGame ? 'bg-purple-500' : 'bg-bg-panel'
              } shadow-inner`}
            >
              <span
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform shadow-sm ${
                  useInternalWalletForGame ? 'translate-x-6' : ''
                }`}
              ></span>
            </button>
          </div>
          <div className="mt-2 text-xs text-mint/90">
            {useInternalWalletForGame
              ? `Using site wallet: ${internalWalletBalance.toFixed(3)} SOL available`
              : `Using external wallet: ${publicKey?.toString().slice(0, 6)}...`
            }
          </div>
        </div>
      )}

      {/* Side select - show for both public and house games */}
      {(gameMode === 'public' || gameMode === 'house') && (
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <span className="text-sm mb-2 block font-medium text-mint-soft">Choose side:</span>
            <div className="flex gap-4">
              {(['heads', 'tails'] as Side[]).map((s) => {
                const active = side === s;
                return (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSide(s)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-200 ${
                      active 
                        ? 'ring-2 ring-mint shadow-md shadow-mint/40 scale-110' 
                        : 'opacity-70 grayscale hover:opacity-90 hover:grayscale-[50%]'
                    }`}
                  >
                    <Image 
                      src={s === 'heads' ? '/assets/heads.png' : '/assets/tails.png'}
                      alt={s}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleCreateGame}
        disabled={amount <= 0 || spinning || isProcessing}
        className={`w-full py-3 h-full flex-shrink-0 rounded-lg shadow-md transition-all ${anyWalletConnected ? 'btn-primary glow-effect' : 'btn-secondary'}`}
      >
        {isProcessing || isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          anyWalletConnected 
            ? `Create ${
                gameMode === 'self' 
                  ? 'Self-Play' 
                  : gameMode === 'house'
                    ? 'House Game'
                    : 'Public Game'
              }`
            : 'Connect Wallet'
        )}
      </motion.button>

      {/* Coin animation */}
      {(spinning || isProcessing) && (
        <div className="my-6 flex flex-col items-center bg-bg-deep/50 p-4 rounded-xl border border-mint/5 shadow-lg">
          <p className="text-sm text-mint-soft mb-1">{spinning ? "Flipping coin..." : "Processing transaction..."}</p>
          <p className="text-xs text-txt-dim mb-3">Selected side: <span className="text-mint font-medium">{side === 'heads' ? 'Heads' : 'Tails'}</span></p>
          <SvgCoin side={side} spinning={true} />
        </div>
      )}
      
      {!anyWalletConnected && (
        <div className="mt-4 p-4 border border-mint/20 rounded-lg bg-mint/5 text-sm shadow-inner">
          <p className="text-mint-soft">Connect your wallet to create a game. Your bet amount will be transferred to the game contract.</p>
          <p className="text-xs text-txt-dim mt-2">You can use either your Solana wallet or create a site wallet.</p>
        </div>
      )}
    </div>
  );
} 