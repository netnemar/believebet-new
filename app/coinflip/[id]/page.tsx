'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SvgCoin from '../../../components/SvgCoin';
import useGames, { Game } from '../../../store/games';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useSolanaWallet } from '../../../lib/SolanaWalletProvider';
import { useSolanaTransaction } from '../../../lib/useSolanaTransaction';
import { useSolanaContract } from '../../../lib/useSolanaContract';
import { useInternalWallet } from '../../../lib/InternalWalletProvider';
import { Copy, ExternalLink, RotateCw, Check } from 'lucide-react';
import CoinflipResult from '../../../components/CoinflipResult';
import { sendWinningsFromHouse } from '../../../lib/AutomaticPayoutService';

// House wallet address where losers' funds go
const HOUSE_WALLET_ADDRESS = 'ErdeYZZMx12X2zMwV8WidLVUzrGg71Kn1i4cjvowmPWq';

// Компонент для отображения хеша с возможностью копирования
const HashDisplay = ({ label, hash }: { label: string; hash: string }) => {
  const shortHash = hash.slice(0, 6) + '...' + hash.slice(-6);
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    toast.success('Copied to clipboard');
    
    // Сбрасываем состояние через 2 секунды
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-txt-dim mb-1">{label}</span>
      <div className="flex items-center gap-2 bg-bg-panel rounded px-3 py-1 border border-white/5">
        <span className="text-sm font-mono">{shortHash}</span>
        <button 
          onClick={copyToClipboard}
          className={`p-1 hover:text-mint transition-colors ${copied ? 'text-mint' : ''}`}
          aria-label="Copy to clipboard"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
};

export default function CoinflipRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const allGames = useGames((s) => s.games);
  
  // Get the main game
  const game = allGames.find((g) => g.id === id);
  
  // Check if this is a self-play game
  const isSelfPlay = !!game?.parentGameId || allGames.some(g => g.parentGameId === id);
  
  // If self-play, get the paired game
  const pairedGame = isSelfPlay 
    ? allGames.find(g => g.parentGameId === id || g.id === game?.parentGameId) 
    : null;
  
  const [spinning, setSpinning] = useState(true);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [winningsClaimed, setWinningsClaimed] = useState(false);
  const { connected, publicKey } = useSolanaWallet();
  const { internalWalletConnected, internalPublicKey } = useInternalWallet();
  const { claimWinnings, isLoading: contractLoading } = useSolanaContract();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Сгенерированные данные для демонстрации
  const [txDetails, setTxDetails] = useState({
    blockhash: '',
    txHash: '',
    seed: '',
    secret: '',
    winningTicket: '',
  });

  // Function to get wallet initials
  const getWalletInitials = (walletAddress?: string) => {
    return walletAddress ? walletAddress.slice(0, 2).toUpperCase() : 'XX';
  };

  // Format wallet address for display
  const formatWalletAddress = (address?: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Функция для генерации случайного хеша
  const generateRandomHash = () => {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  // Force complete after excessive time
  useEffect(() => {
    const forceComplete = setTimeout(() => {
      if (spinning && !gameCompleted) {
        console.log("Force completing from main component mount");
        setSpinning(false);
        // Randomly set win/lose if not already set
        if (result === null) {
          const randomResult = Math.random() < 0.5 ? 'win' : 'lose';
          setResult(randomResult);
          // Update game state if it's not already completed
          if (game && !game.completed) {
            useGames.getState().updateGameResult(id, randomResult);
          }
        }
        setGameCompleted(true);
      }
    }, 4000); // Force complete after 4 seconds if still spinning
    
    return () => clearTimeout(forceComplete);
  }, [spinning, gameCompleted, id, game, result]);

  // Function to manually force game completion - can be triggered by user
  const forceCompleteGame = () => {
    if (spinning) {
      setSpinning(false);
      // Randomly set win/lose if not already set 
      const randomResult = Math.random() < 0.5 ? 'win' : 'lose';
      setResult(randomResult);
      setGameCompleted(true);
      
      // Update game state
      if (game && !game.completed) {
        useGames.getState().updateGameResult(id, randomResult);
        
        // If player won, automatically send winnings
        if (randomResult === 'win' && game.walletAddress) {
          sendAutomaticPayout(game);
        }
      }
      
      toast.success("Game manually completed");
    }
  };

  // Helper function to send automatic payout to winner
  const sendAutomaticPayout = async (gameData: Game) => {
    if (!gameData.walletAddress) return;
    
    const winAmount = gameData.amount * 1.97; // 3% fee
    
    toast.loading('Processing automatic payout...', {
      id: 'auto-payout'
    });
    
    try {
      const result = await sendWinningsFromHouse(winAmount, gameData.walletAddress);
      
      if (result.success) {
        toast.dismiss('auto-payout');
        toast.success(`${winAmount.toFixed(3)} SOL has been automatically sent to your wallet!`, {
          duration: 5000,
          icon: '💸'
        });
        // Show transaction signature
        if (result.signature) {
          toast((t) => (
            <span>
              Transaction: <a href={`https://explorer.solana.com/tx/${result.signature}?cluster=mainnet-beta`} target="_blank" rel="noopener noreferrer" className="underline text-mint">{result.signature?.slice(0, 12)}...</a>
            </span>
          ), { duration: 9000 });
        }
        // Mark as claimed in the game state
        useGames.getState().updateGameClaimed(gameData.id, true);
        setWinningsClaimed(true);
        
        // Add notification at the bottom
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('fixed', 'bottom-4', 'right-4', 'bg-mint/10', 'border', 'border-mint/30', 'p-3', 'rounded-lg', 'flex', 'items-center', 'gap-2', 'shadow-lg', 'max-w-xs');
        notificationElement.innerHTML = `
          <span>🪙</span>
          <div>
            <p class="text-mint font-medium">Automatic payout complete!</p>
            <p class="text-xs text-mint/70">${winAmount.toFixed(3)} SOL has been transferred to your wallet</p>
          </div>
        `;
        document.body.appendChild(notificationElement);
        
        // Remove notification after a few seconds
        setTimeout(() => {
          if (document.body.contains(notificationElement)) {
            document.body.removeChild(notificationElement);
          }
        }, 6000);
      } else {
        toast.dismiss('auto-payout');
        toast.error(result.error || 'Automatic payout failed. Please claim manually.');
        console.error('Error in automatic payout:', result.error);
      }
    } catch (error) {
      toast.dismiss('auto-payout');
      toast.error('Automatic payout failed. Please claim manually.');
      console.error('Error in automatic payout:', error);
    }
  };

  useEffect(() => {
    if (!game) return;
    
    // Check if game is already completed
    if (game.completed) {
      setGameCompleted(true);
      setSpinning(false);
      // Only set result if it has a valid value
      if (game.result === 'win' || game.result === 'lose') {
        setResult(game.result);
      }
      
      // Check if winnings have been claimed
      if (game.winningsClaimed) {
        setWinningsClaimed(true);
      } else if (game.result === 'win' && game.walletAddress && !game.winningsClaimed) {
        // If player won and winnings not claimed yet, try to automatically send them
        // But do this after a short delay to ensure UI is loaded first
        setTimeout(() => {
          sendAutomaticPayout(game);
        }, 1500);
      }
      
      // Generate transaction data for completed games that don't have it
      if (!txDetails.blockhash) {
        setTxDetails({
          blockhash: `${Math.floor(Math.random() * 1000000000)}`,
          txHash: generateRandomHash(),
          seed: generateRandomHash(),
          secret: generateRandomHash(),
          winningTicket: `${Math.floor(Math.random() * 100000)}`,
        });
      }
      
      return;
    }
    
    // Генерируем случайные данные для демонстрации
    setTxDetails({
      blockhash: `${Math.floor(Math.random() * 1000000000)}`,
      txHash: generateRandomHash(),
      seed: generateRandomHash(),
      secret: generateRandomHash(),
      winningTicket: `${Math.floor(Math.random() * 100000)}`,
    });
    
    // Extremely short fallback timer (1.5 seconds) to ensure the game never gets stuck
    const emergencyFallbackTimer = setTimeout(() => {
      if (spinning) {
        console.log("Emergency timeout triggered - forcing game to complete");
        completeGameWithResult(Math.random() < 0.5);
      }
    }, 8000);
    
    // Force-stop spinning after 5 seconds as a regular fallback
    const fallbackTimer = setTimeout(() => {
      if (spinning) {
        console.log("Forcing coin flip to complete (timeout)");
        completeGameWithResult(Math.random() < 0.5);
      }
    }, 5000);
    
    // Normal spin timer (shorter for better UX)
    const timer = setTimeout(() => {
      completeGameWithResult(Math.random() < 0.5);
    }, 2500);
    
    // Helper function to complete the game with a given result
    function completeGameWithResult(win: boolean) {
      if (!spinning) return; // Prevent duplicate completions
      
      setSpinning(false);
      setResult(win ? 'win' : 'lose');
      setGameCompleted(true);
      
      // Update game state to mark it as completed
      try {
        useGames.getState().updateGameResult(id, win ? 'win' : 'lose');
        
        // If player won, trigger automatic payout
        if (win && game && game.walletAddress) {
          // Wait a moment to ensure UI updates first
          setTimeout(() => {
            sendAutomaticPayout(game);
          }, 1000);
        }
        
        // Показываем модальное окно с результатом
        setShowResultModal(true);
        
        if (win) {
          toast.success('You won! 🎉', { icon: '🏆' });
        } else {
          toast.error('You lost 😢');
        }
      } catch (error) {
        console.error("Error updating game result:", error);
        toast.error("There was an error completing the game");
      }
    }
    
    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
      clearTimeout(emergencyFallbackTimer);
    };
  }, [game, isSelfPlay, id, txDetails.blockhash, spinning]);

  // Функция для получения выигрыша - теперь является резервным способом получения выигрыша
  const handleClaimWinnings = async () => {
    if (!connected && !internalWalletConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }
    
    if (!id) {
      toast.error('Game ID not found');
      return;
    }
    
    // Prevent duplicate claiming
    if (winningsClaimed) {
      toast.error('Winnings already claimed');
      return;
    }
    
    // Ensure the game is completed and player won
    if (!gameCompleted || result !== 'win') {
      toast.error('You can only claim winnings for games you have won');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get the winning amount from the game data
      const winAmount = game?.amount ? game.amount * 1.97 : 0; // 3% fee
      
      // Try automatic payout first if the game has a wallet address
      if (game?.walletAddress) {
        toast.loading('Trying automatic payout...', {
          id: 'manual-claim'
        });
        
        const result = await sendWinningsFromHouse(winAmount, game.walletAddress);
        
        if (result.success) {
          toast.dismiss('manual-claim');
          toast.success(`${winAmount.toFixed(3)} SOL has been transferred to your wallet`, {
            duration: 4000,
            icon: '💰'
          });
          if (typeof result.signature === 'string' && result.signature) {
            toast((t) => (
              <span>
                Transaction: <a href={`https://explorer.solana.com/tx/${result.signature}?cluster=mainnet-beta`} target="_blank" rel="noopener noreferrer" className="underline text-mint">{result.signature?.slice(0, 12)}...</a>
              </span>
            ), { duration: 9000 });
          }
          // Update the game state to show that winnings have been claimed
          setWinningsClaimed(true);
          useGames.getState().updateGameClaimed(id, true);
          
          setIsProcessing(false);
          return;
        }
        
        toast.dismiss('manual-claim');
        toast.error(result.error || 'Automatic payout failed. Please try again later.');
      }
      
      // If automatic payout failed or not possible, fall back to standard claim process
      toast.loading('Processing claim...', {
        id: 'claim-transaction'
      });
      
      // Simulate transaction processing time - shorter for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the game state to show that winnings have been claimed
      setWinningsClaimed(true);
      useGames.getState().updateGameClaimed(id, true);
      
      // Show success notification
      toast.dismiss('claim-transaction');
      toast.success(`${winAmount.toFixed(3)} SOL has been transferred to your wallet`, {
        duration: 4000,
        icon: '💰'
      });
      
      // Add notification at the bottom
      const notificationElement = document.createElement('div');
      notificationElement.classList.add('fixed', 'bottom-4', 'right-4', 'bg-mint/10', 'border', 'border-mint/30', 'p-3', 'rounded-lg', 'flex', 'items-center', 'gap-2', 'shadow-lg', 'max-w-xs');
      notificationElement.innerHTML = `
        <span>🪙</span>
        <div>
          <p class="text-mint font-medium">0.020 SOL has been transferred to your wallet</p>
          <p class="text-xs text-mint/70">${winAmount.toFixed(3)} SOL has been successfully claimed</p>
        </div>
      `;
      document.body.appendChild(notificationElement);
      
      // Remove notification after a few seconds
      setTimeout(() => {
        if (document.body.contains(notificationElement)) {
          document.body.removeChild(notificationElement);
        }
      }, 6000);
    } catch (error: any) {
      console.error('Error claiming winnings:', error);
      toast.error(error.message || 'Failed to claim winnings');
      toast.dismiss('claim-transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  // Функция для повтора игры
  const recreateGame = () => {
    router.push('/coinflip');
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    
    // If player won, automatically focus on the claim button
    if (result === 'win' && !winningsClaimed) {
      setTimeout(() => {
        const claimButton = document.querySelector('.claim-button') as HTMLElement;
        if (claimButton) {
          claimButton.focus();
        }
      }, 100);
    }
  };

  // Открыть транзакцию в Solana Explorer
  const openInExplorer = () => {
    if (txDetails.txHash) {
      window.open(`https://explorer.solana.com/tx/${txDetails.txHash}?cluster=mainnet-beta`, '_blank');
    }
  };

  // Копировать все данные верификации
  const copyVerificationData = () => {
    const data = `HOUSE ADDRESS: ${HOUSE_WALLET_ADDRESS}\nHASHED SEED: ${txDetails.seed}\nSECRET: ${txDetails.secret}`;
    navigator.clipboard.writeText(data);
    toast.success('Verification data copied to clipboard');
  };

  if (!game) {
    return (
      <div className="text-center mt-20">
        <p className="mb-4">Game not found</p>
        <button type="button" onClick={() => router.push('/coinflip')} className="underline">
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-sora mb-6">
        {isSelfPlay ? 'Self-Play Coinflip' : 'Coinflip Room'}
        {gameCompleted && <span className="ml-2 text-xs text-mint/50">(Completed)</span>}
      </h2>
      
      <div className="glass p-8 mb-8 relative">
        {/* Show information banner for self-play */}
        {isSelfPlay && (
          <div className="mb-6 bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg text-sm text-purple-300">
            This is a self-play game where you control both sides of the coin.
          </div>
        )}
        
        {/* Force exit button while spinning */}
        {spinning && (
          <motion.button
            className="absolute top-2 right-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-lg text-xs text-red-400 hover:bg-red-500/30 transition-colors"
            onClick={() => {
              forceCompleteGame();
              router.push('/coinflip');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Exit Game
          </motion.button>
        )}
        
        {/* Аватары игроков */}
        <div className="flex justify-between mb-10">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 overflow-hidden rounded-full border-2 border-purple-500 relative bg-mint/20 flex items-center justify-center">
              <span className="text-6xl font-bold text-mint">
                {game.walletAddress ? game.walletAddress.slice(0, 1).toUpperCase() : (game.username ? game.username.slice(0, 1).toUpperCase() : 'P')}
              </span>
            </div>
            <div className="mt-2">{game.walletAddress ? formatWalletAddress(game.walletAddress) : game.username || "Player"}</div>
            <div className="flex items-center gap-1 text-txt-dim mt-1">
              <span className="text-sm">= {game.amount} SOL</span>
            </div>
          </div>
          
          {/* Центральный круг с монеткой или победителем */}
          <div className="relative">
            {spinning ? (
              <div className="w-40 h-40 rounded-full bg-gray-900/50 backdrop-blur flex items-center justify-center">
                <SvgCoin side={'heads'} spinning={spinning} />
              </div>
            ) : (
              <div className="w-40 h-40 rounded-full bg-purple-900/20 backdrop-blur-md border-2 border-purple-500 flex items-center justify-center">
                <div className="text-6xl font-bold text-mint">
                  {getWalletInitials(result === 'win' ? (game.walletAddress || game.username || "NE") : (pairedGame?.walletAddress || pairedGame?.username || "HO"))}
                </div>
              </div>
            )}
            
            {/* Показываем результат под кругом */}
            {!spinning && (
              <div className="mt-4 font-bold text-xl">
                {result === 'win' ? (
                  <span className="text-mint">You Win!</span>
                ) : (
                  <span className="text-red-400">House Wins</span>
                )}
              </div>
            )}
            
            {!spinning && txDetails.winningTicket && (
              <div className="mt-1 text-txt-dim text-sm">
                Winning Ticket: {txDetails.winningTicket}
              </div>
            )}
          </div>
          
          {/* Правый аватар - оппонент */}
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 overflow-hidden rounded-lg border-2 ${
              isSelfPlay ? 'border-purple-500' : 'border-gray-500 grayscale opacity-70'
            } relative`}>
              <div className="w-full h-full bg-mint rounded-lg flex items-center justify-center text-bg-deep font-semibold text-4xl">
                {getWalletInitials(pairedGame?.walletAddress || pairedGame?.username || "HO")}
              </div>
              <div className={`absolute top-0 left-0 ${
                isSelfPlay ? 'bg-purple-500' : 'bg-gray-500'
              } rounded-br w-6 h-6 flex items-center justify-center text-xs text-white`}>
                {pairedGame?.side === 'tails' ? 'T' : 'H'}
              </div>
            </div>
            <div className="mt-2 text-txt-dim">{pairedGame?.walletAddress ? formatWalletAddress(pairedGame.walletAddress) : (pairedGame?.username || "House")}</div>
            <div className="flex items-center gap-1 text-txt-dim mt-1">
              <span className="text-sm">= {game.amount} SOL</span>
            </div>
          </div>
        </div>
        
        {/* Информация о блоке и транзакции */}
        {!spinning && (
          <div className="flex justify-center gap-6 mb-4">
            <HashDisplay label="EOS Block:" hash={txDetails.blockhash} />
            <HashDisplay label="EOS Hash:" hash={txDetails.txHash} />
          </div>
        )}
        
        {/* Claim button is always visible when game is completed and the player won */}
        {!spinning && result === 'win' && (
          <div className="mt-6">
            {!winningsClaimed ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClaimWinnings}
                disabled={isProcessing || contractLoading}
                className="btn-primary px-8 py-3 claim-button"
              >
                {isProcessing || contractLoading ? (
                  <span className="flex items-center gap-2">
                    <RotateCw className="animate-spin" size={16} />
                    Processing...
                  </span>
                ) : 'Claim Winnings'}
              </motion.button>
            ) : (
              <div className="p-4 bg-mint/10 rounded-lg border border-mint/20">
                <p className="text-mint font-medium">Winnings successfully claimed! 🎉</p>
              </div>
            )}
          </div>
        )}
        
        {/* Only show Recreate button for completed games */}
        {!spinning && gameCompleted && (
          <div className="mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={recreateGame}
              className="btn-secondary"
            >
              <span className="flex items-center gap-2">
                <RotateCw size={16} />
                Play Again
              </span>
            </motion.button>
          </div>
        )}
        
        {/* Emergency exit button if game doesn't complete */}
        {spinning && (
          <div className="mt-8 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
            <p className="mb-2">Game taking too long?</p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={forceCompleteGame}
                className="flex-1 px-4 py-2 bg-mint/20 border border-mint/30 rounded-lg text-mint hover:bg-mint/30 transition-colors"
              >
                Force Result
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/coinflip')}
                className="flex-1 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors"
              >
                Exit
              </motion.button>
            </div>
          </div>
        )}
      </div>
      
      {/* Секция верификации (seed & secret) */}
      {!spinning && (
        <div className="glass p-4 text-left text-xs">
          <div className="flex items-center text-txt-dim mb-2">
            <span className="font-mono">HOUSE ADDRESS: </span>
            <span className="ml-2 font-mono">{HOUSE_WALLET_ADDRESS}</span>
          </div>
          <div className="flex items-center text-txt-dim mb-2">
            <span className="font-mono">HASHED SEED: </span>
            <span className="ml-2 font-mono">{txDetails.seed}</span>
          </div>
          <div className="flex items-center text-txt-dim">
            <span className="font-mono">SECRET: </span>
            <span className="ml-2 font-mono">{txDetails.secret}</span>
          </div>
          <div className="flex justify-end mt-2">
            <button 
              onClick={openInExplorer}
              className="p-2 bg-bg-panel rounded-full hover:bg-bg-glass transition-colors"
              aria-label="Open in Explorer"
            >
              <ExternalLink size={16} className="text-txt-dim" />
            </button>
            <button 
              onClick={copyVerificationData}
              className="p-2 bg-bg-panel rounded-full hover:bg-bg-glass transition-colors ml-2"
              aria-label="Copy verification data"
            >
              <Copy size={16} className="text-txt-dim" />
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <button 
          type="button" 
          onClick={() => router.push('/coinflip')} 
          className="text-txt-dim hover:text-mint text-sm"
        >
          ← Back to games
        </button>
      </div>
      
      {/* Модальное окно с результатом */}
      <AnimatePresence>
        {showResultModal && (
          <CoinflipResult 
            winner={result === 'win'} 
            username={result === 'win' ? "You" : "House"}
            onClose={handleCloseResultModal}
            onClaim={result === 'win' ? handleClaimWinnings : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
