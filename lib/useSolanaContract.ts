import { useState, useCallback } from 'react';
import { useSolanaWallet } from './SolanaWalletProvider';
import { useSolanaTransaction } from './useSolanaTransaction';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import toast from 'react-hot-toast';

// Константы
const BELIEVEBET_ADDRESS = process.env.NEXT_PUBLIC_BELIEVEBET_CONTRACT_ADDRESS || 'newdxpU2QUBz2VtTJMS2cSKip7Lt6qBuiqhJQ1vWrbS';

// Тип для деталей транзакции
export interface TransactionDetails {
  signature: string;
  blockNumber: number;
  timestamp: number;
  seed?: string;
  secret?: string;
  winningTicket?: string;
}

export const useSolanaContract = () => {
  const { publicKey, connected, signTransaction } = useSolanaWallet();
  const { getConnection } = useSolanaTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);

  // Функция для генерации случайного сида
  const generateRandomSeed = useCallback(() => {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }, []);

  // Функция для создания игры (CoinFlip)
  const createGame = useCallback(
    async (amount: number, side: 'heads' | 'tails'): Promise<TransactionDetails | null> => {
      if (!connected || !publicKey || !signTransaction) {
        toast.error('Wallet not connected');
        return null;
      }

      setIsLoading(true);

      try {
        // Получаем соединение
        const connection = await getConnection();
        
        // Генерируем случайный сид для игры
        const seed = generateRandomSeed();
        
        // Создаем транзакцию для отправки SOL на контракт
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(BELIEVEBET_ADDRESS),
            lamports: amount * LAMPORTS_PER_SOL,
          })
        );
        
        // Получаем последний блокхэш
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        
        // Подписываем и отправляем транзакцию
        const signed = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });
        
        // Ждем подтверждения транзакции
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });
        
        if (confirmation.value.err) {
          throw new Error('Transaction failed on-chain');
        }
        
        // Получаем данные о транзакции
        const transactionInfo = await connection.getTransaction(signature, {
          commitment: 'confirmed',
        });
        
        if (!transactionInfo) {
          throw new Error('Failed to fetch transaction info');
        }
        
        // Создаем объект с деталями транзакции
        const txDetails: TransactionDetails = {
          signature,
          blockNumber: transactionInfo.slot,
          timestamp: transactionInfo.blockTime ? transactionInfo.blockTime * 1000 : Date.now(),
          seed,
          secret: generateRandomSeed(), // Для демо, в реальном контракте будет вычисляться на основе блокхеша
          winningTicket: Math.floor(Math.random() * 100000).toString(), // Для демо
        };
        
        // Сохраняем детали транзакции
        setTransactionDetails(txDetails);
        
        return txDetails;
      } catch (error: any) {
        console.error('Error creating game:', error);
        toast.error(error.message || 'Failed to create game');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [connected, publicKey, signTransaction, getConnection, generateRandomSeed]
  );

  // Функция для получения выигрыша
  const claimWinnings = useCallback(
    async (gameId: string): Promise<boolean> => {
      if (!connected || !publicKey || !signTransaction) {
        toast.error('Wallet not connected');
        return false;
      }

      setIsLoading(true);

      try {
        // Get connection to Solana
        const connection = await getConnection();
        
        // In a real app, this would fetch the game details from the contract
        // to get the winning amount and verify eligibility
        
        // For demo purposes, let's simulate a transfer from house wallet to player wallet
        // In a production app, this would require the contract owner's signature
        
        // Create a simulated transaction
        toast.loading('Creating transaction...', {
          id: 'claim-tx'
        });
        
        // Simulate blockchain latency
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.loading('Awaiting signature...', {
          id: 'claim-tx'
        });
        
        // Simulate transaction signature process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast.loading('Processing on blockchain...', {
          id: 'claim-tx'
        });
        
        // Simulate blockchain confirmation time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Clear loading toast and show success
        toast.dismiss('claim-tx');
        toast.success('Winnings claimed successfully!', {
          duration: 5000,
          icon: '💰'
        });
        
        return true;
      } catch (error: any) {
        console.error('Error claiming winnings:', error);
        toast.dismiss('claim-tx');
        toast.error(error.message || 'Failed to claim winnings');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [connected, publicKey, signTransaction, getConnection]
  );

  return {
    createGame,
    claimWinnings,
    isLoading,
    transactionDetails,
  };
};

export default useSolanaContract; 