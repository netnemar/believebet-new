'use client';

import { useState, useEffect } from 'react';
import { useJackpot, AdminSettings, WalletLog } from '../../store/jackpot';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Settings, Save, Percent, BarChart, Users, ArrowDown, 
  Trash, Copy, ExternalLink, Lock, Unlock, Check, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function JackpotAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [favoredWalletInput, setFavoredWalletInput] = useState('');
  const [forcedWinnerAddress, setForcedWinnerAddress] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Get jackpot store methods
  const {
    adminSettings: storeAdminSettings,
    updateAdminSettings,
    setForcedWinner,
    disableForcedWin,
    addToFavoredWallets,
    removeFromFavoredWallets,
    clearWalletLogs,
    walletLogs
  } = useJackpot();
  
  // Check admin password and load settings
  useEffect(() => {
    // Admin is authenticated when password is 'admin123'
    if (isAdmin) {
      setAdminSettings(storeAdminSettings);
    }
  }, [isAdmin, storeAdminSettings]);
  
  // Handle login
  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAdmin(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid password');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    setIsAdmin(false);
    setPassword('');
    toast.success('Logged out');
  };
  
  // Handle saving settings
  const handleSaveSettings = () => {
    if (!adminSettings) return;
    
    updateAdminSettings(adminSettings);
    toast.success('Settings saved successfully');
  };
  
  // Handle adding a favored wallet
  const handleAddFavoredWallet = () => {
    if (!favoredWalletInput) {
      toast.error('Please enter a wallet address');
      return;
    }
    
    addToFavoredWallets(favoredWalletInput);
    setFavoredWalletInput('');
    toast.success('Wallet added to favored list');
  };
  
  // Handle removing a favored wallet
  const handleRemoveFavoredWallet = (wallet: string) => {
    removeFromFavoredWallets(wallet);
    toast.success('Wallet removed from favored list');
  };
  
  // Handle setting forced winner
  const handleSetForcedWinner = () => {
    if (!forcedWinnerAddress) {
      toast.error('Please enter a wallet address');
      return;
    }
    
    setForcedWinner(forcedWinnerAddress);
    setForcedWinnerAddress('');
    toast.success('Forced winner set for next round');
  };
  
  // Handle disabling forced winner
  const handleDisableForcedWin = () => {
    disableForcedWin();
    toast.success('Forced winner disabled');
  };
  
  // Handle clearing logs
  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all wallet logs? This cannot be undone.')) {
      clearWalletLogs();
      toast.success('Wallet logs cleared');
    }
  };
  
  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Login form
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 max-w-md w-full"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Lock size={24} className="text-mint" />
            <h1 className="text-2xl font-sora font-semibold text-mint">Admin Access</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-txt-dim mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input-field"
                placeholder="Enter admin password"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <button 
              onClick={handleLogin}
              className="w-full btn-primary"
            >
              Login
            </button>
            
            <Link href="/jackpot" className="block text-center text-sm text-mint-soft hover:text-mint">
              Return to Jackpot
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings size={24} className="text-mint" />
          <h1 className="text-2xl font-sora font-semibold text-mint-soft">Jackpot Admin Panel</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/jackpot"
            className="px-4 py-2 bg-bg-panel rounded hover:bg-mint/20 transition-colors"
          >
            View Jackpot
          </Link>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 px-4 py-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
          >
            <Unlock size={16} />
            Logout
          </button>
        </div>
      </div>
      
      {/* Admin Tabs */}
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'settings' 
              ? 'text-mint border-b-2 border-mint' 
              : 'text-txt-dim hover:text-mint-soft'
          }`}
        >
          Game Settings
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'wallets' 
              ? 'text-mint border-b-2 border-mint' 
              : 'text-txt-dim hover:text-mint-soft'
          }`}
        >
          Wallet Logs
        </button>
      </div>
      
      {/* Game Settings Tab */}
      {activeTab === 'settings' && adminSettings && (
        <div className="space-y-6">
          <div className="glass p-6">
            <h2 className="text-xl font-sora font-semibold mb-4 flex items-center gap-2">
              <BarChart size={18} className="text-mint" />
              Game Odds Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-txt-dim mb-1">House Edge (%)</label>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={adminSettings.houseEdge}
                    onChange={(e) => setAdminSettings({
                      ...adminSettings,
                      houseEdge: parseFloat(e.target.value) || 0
                    })}
                    className="w-full input-field"
                  />
                  <Percent size={16} className="text-mint-soft -ml-8" />
                </div>
                <p className="text-xs text-txt-dim mt-1">
                  Percentage of pot that goes to the house (0-100)
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-txt-dim mb-1">Minimum Win Chance (%)</label>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={adminSettings.minWinChance}
                    onChange={(e) => setAdminSettings({
                      ...adminSettings,
                      minWinChance: parseFloat(e.target.value) || 0
                    })}
                    className="w-full input-field"
                  />
                  <Percent size={16} className="text-mint-soft -ml-8" />
                </div>
                <p className="text-xs text-txt-dim mt-1">
                  Minimum chance to win regardless of bet size (0-100)
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-txt-dim mb-1">Favor Factor</label>
                <input 
                  type="number" 
                  min="1"
                  step="0.1"
                  value={adminSettings.favorFactor}
                  onChange={(e) => setAdminSettings({
                    ...adminSettings,
                    favorFactor: parseFloat(e.target.value) || 1
                  })}
                  className="w-full input-field"
                />
                <p className="text-xs text-txt-dim mt-1">
                  Multiplier for favored wallets (e.g., 2 = double chance)
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="logging"
                  checked={adminSettings.logging}
                  onChange={(e) => setAdminSettings({
                    ...adminSettings,
                    logging: e.target.checked
                  })}
                  className="w-5 h-5 rounded bg-bg-panel border border-white/10"
                />
                <label htmlFor="logging" className="text-sm">
                  Enable wallet logging
                </label>
              </div>
              
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 btn-primary"
              >
                <Save size={16} />
                Save Settings
              </button>
            </div>
          </div>
          
          <div className="glass p-6">
            <h2 className="text-xl font-sora font-semibold mb-4 flex items-center gap-2">
              <Users size={18} className="text-mint" />
              Favored Wallets
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={favoredWalletInput}
                  onChange={(e) => setFavoredWalletInput(e.target.value)}
                  placeholder="Enter wallet address"
                  className="flex-1 input-field"
                />
                <button
                  onClick={handleAddFavoredWallet}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-txt-dim">Current favored wallets:</p>
                
                {adminSettings.favoredWallets.length === 0 ? (
                  <p className="text-xs text-txt-dim">No favored wallets added</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {adminSettings.favoredWallets.map((wallet, index) => (
                      <div key={index} className="flex items-center justify-between bg-bg-panel p-2 rounded">
                        <span className="text-xs font-mono truncate max-w-[calc(100%-40px)]">
                          {wallet}
                        </span>
                        <button
                          onClick={() => handleRemoveFavoredWallet(wallet)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="glass p-6">
            <h2 className="text-xl font-sora font-semibold mb-4 flex items-center gap-2">
              <span className="text-yellow-500">★</span>
              Force Win Next Round
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={forcedWinnerAddress}
                  onChange={(e) => setForcedWinnerAddress(e.target.value)}
                  placeholder="Enter wallet address to force win"
                  className="flex-1 input-field"
                />
                <button
                  onClick={handleSetForcedWinner}
                  className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded hover:bg-yellow-500/30 transition-colors"
                >
                  Force Win
                </button>
              </div>
              
              {adminSettings.forceWinOnNextRound && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-400 text-sm font-medium mb-1">
                        Forced win active for next round
                      </p>
                      <p className="text-xs text-yellow-400/70 font-mono">
                        {adminSettings.forcedWinnerAddress}
                      </p>
                    </div>
                    <button
                      onClick={handleDisableForcedWin}
                      className="bg-bg-panel/50 hover:bg-bg-panel text-yellow-400 px-2 py-1 rounded text-xs"
                    >
                      Disable
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Wallet Logs Tab */}
      {activeTab === 'wallets' && (
        <div className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-sora font-semibold flex items-center gap-2">
              <Users size={18} className="text-mint" />
              Wallet Logs
            </h2>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-txt-dim">
                {walletLogs.length} logs
              </span>
              
              <button
                onClick={handleClearLogs}
                className="text-red-400 hover:text-red-300 p-1"
                title="Clear all logs"
              >
                <Trash size={16} />
              </button>
            </div>
          </div>
          
          {walletLogs.length === 0 ? (
            <p className="text-txt-dim py-6 text-center">No wallet logs available</p>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="text-left text-txt-dim text-xs uppercase">
                  <tr className="border-b border-white/10">
                    <th className="p-2">Time</th>
                    <th className="p-2">Wallet</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Action</th>
                    <th className="p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {walletLogs.map((log, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-2 text-xs">{formatDate(log.timestamp)}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono truncate max-w-[120px]">
                            {log.walletAddress.slice(0, 6)}...{log.walletAddress.slice(-4)}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(log.walletAddress);
                              toast.success('Wallet address copied');
                            }}
                            className="text-txt-dim hover:text-mint p-1"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          log.isInternal 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {log.isInternal ? 'Internal' : 'External'}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          log.action.includes('win') 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        {log.amount ? `${log.amount.toFixed(3)} SOL` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 