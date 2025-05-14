import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { useCallback } from 'react';
import { useSolanaWallet } from './SolanaWalletProvider';
import toast from 'react-hot-toast';

// Список резервных RPC-эндпоинтов с приоритетным использованием QuikNode
const RPC_ENDPOINTS = [
  'https://wild-dawn-sailboat.solana-mainnet.quiknode.pro/2111150f8023a81be6ea152cde877d25402aeaf4/',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

// WebSocket URL для подписок на события
const WS_ENDPOINT = 'wss://wild-dawn-sailboat.solana-mainnet.quiknode.pro/2111150f8023a81be6ea152cde877d25402aeaf4/';

export const useSolanaTransaction = () => {
  const { publicKey, wallet, signTransaction } = useSolanaWallet();

  // Функция для получения рабочего RPC-соединения
  const getConnection = useCallback(async () => {
    // По умолчанию используем QuikNode
    try {
      const connection = new Connection(RPC_ENDPOINTS[0], {
        wsEndpoint: WS_ENDPOINT,
        commitment: 'confirmed'
      });
      // Проверка соединения
      await connection.getLatestBlockhash();
      return connection;
    } catch (error) {
      console.warn(`QuikNode connection failed, trying fallbacks`, error);
      
      // Попробуем резервные эндпоинты
      for (let i = 1; i < RPC_ENDPOINTS.length; i++) {
        try {
          const connection = new Connection(RPC_ENDPOINTS[i]);
          await connection.getLatestBlockhash();
          return connection;
        } catch (error) {
          console.warn(`Connection failed for ${RPC_ENDPOINTS[i]}`, error);
        }
      }
      
      // Если все не сработали, используем последний в списке
      return new Connection(RPC_ENDPOINTS[RPC_ENDPOINTS.length - 1]);
    }
  }, []);

  // Функция для получения баланса
  const getBalance = useCallback(async () => {
    if (!publicKey) return 0;
    try {
      const connection = await getConnection();
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance', error);
      return 0;
    }
  }, [publicKey, getConnection]);

  // Функция для отправки SOL
  const sendSol = useCallback(
    async (amount: number, destinationAddress: string) => {
      if (!publicKey || !signTransaction) {
        toast.error('Wallet not connected!');
        return false;
      }
      
      try {
        // Получаем рабочее соединение
        const connection = await getConnection();
        
        // Создаем транзакцию
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(destinationAddress),
            lamports: amount * LAMPORTS_PER_SOL,
          })
        );
        
        // Получаем последний блокхеш
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        
        // Подписываем и отправляем транзакцию
        const signed = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
        
        // Показываем пользователю ссылку на Explorer для отслеживания транзакции
        const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`;
        console.info('Transaction sent:', explorerUrl);
        
        // Ждем подтверждения
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          toast.error('Transaction failed on chain');
          return false;
        }
        
        toast.success('Transaction successful!');
        return true;
      } catch (error: any) {
        console.error('Error sending SOL:', error);
        toast.error(error.message || 'Failed to send SOL');
        return false;
      }
    },
    [publicKey, signTransaction, getConnection]
  );

  return {
    getBalance,
    sendSol,
    getConnection,
  };
};

export default useSolanaTransaction; 