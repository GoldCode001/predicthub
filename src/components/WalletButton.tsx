'use client';

import { useState, useEffect, useCallback } from 'react';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

// Store wallet state globally so Portfolio can access it
let globalWalletState: WalletState = {
  address: null,
  chainId: null,
  isConnecting: false,
  error: null,
};

let walletListeners: ((state: WalletState) => void)[] = [];

export function subscribeToWallet(listener: (state: WalletState) => void) {
  walletListeners.push(listener);
  listener(globalWalletState);
  return () => {
    walletListeners = walletListeners.filter(l => l !== listener);
  };
}

function notifyListeners() {
  walletListeners.forEach(l => l(globalWalletState));
}

export function getWalletAddress(): string | null {
  return globalWalletState.address;
}

const CHAIN_INFO: Record<number, { name: string; color: string }> = {
  1: { name: 'ETH', color: '#627eea' },
  137: { name: 'Polygon', color: '#8247e5' },
  10: { name: 'OP', color: '#ff0420' },
  42161: { name: 'Arb', color: '#28a0f0' },
};

export default function WalletButton() {
  const [wallet, setWallet] = useState<WalletState>(globalWalletState);
  const [showMenu, setShowMenu] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  // Check for MetaMask on mount
  useEffect(() => {
    const checkMetaMask = () => {
      const ethereum = (window as any).ethereum;
      setHasMetaMask(!!ethereum);
      
      // Check if already connected
      if (ethereum) {
        ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
          if (accounts.length > 0) {
            ethereum.request({ method: 'eth_chainId' }).then((chainId: string) => {
              globalWalletState = {
                address: accounts[0],
                chainId: parseInt(chainId, 16),
                isConnecting: false,
                error: null,
              };
              setWallet(globalWalletState);
              notifyListeners();
            });
          }
        });

        // Listen for account changes
        ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            globalWalletState = { address: null, chainId: null, isConnecting: false, error: null };
          } else {
            globalWalletState = { ...globalWalletState, address: accounts[0] };
          }
          setWallet(globalWalletState);
          notifyListeners();
        });

        // Listen for chain changes
        ethereum.on('chainChanged', (chainId: string) => {
          globalWalletState = { ...globalWalletState, chainId: parseInt(chainId, 16) };
          setWallet(globalWalletState);
          notifyListeners();
        });
      }
    };

    checkMetaMask();
  }, []);

  const connect = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      globalWalletState = { ...globalWalletState, error: 'Please install a wallet' };
      setWallet(globalWalletState);
      return;
    }

    try {
      globalWalletState = { ...globalWalletState, isConnecting: true, error: null };
      setWallet(globalWalletState);
      notifyListeners();

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await ethereum.request({ method: 'eth_chainId' });

      globalWalletState = {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnecting: false,
        error: null,
      };
      setWallet(globalWalletState);
      notifyListeners();
      setShowMenu(false);
    } catch (err: any) {
      globalWalletState = {
        ...globalWalletState,
        isConnecting: false,
        error: err.message || 'Failed to connect',
      };
      setWallet(globalWalletState);
      notifyListeners();
    }
  }, []);

  const disconnect = useCallback(() => {
    globalWalletState = { address: null, chainId: null, isConnecting: false, error: null };
    setWallet(globalWalletState);
    notifyListeners();
    setShowMenu(false);
  }, []);

  const switchToPolygon = useCallback(async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: ['https://polygon-rpc.com'],
              blockExplorerUrls: ['https://polygonscan.com'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Polygon network:', addError);
        }
      }
    }
    setShowMenu(false);
  }, []);

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const chainInfo = wallet.chainId ? CHAIN_INFO[wallet.chainId] : null;

  // Not connected state
  if (!wallet.address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={wallet.isConnecting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 btn-premium
                     text-white text-sm font-semibold rounded-lg transition-all duration-200
                     disabled:opacity-50"
        >
          {wallet.isConnecting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Connect Wallet
            </>
          )}
        </button>

        {showMenu && (
          <div className="absolute left-0 right-0 mt-2 bg-ph-card border border-subtle rounded-xl shadow-card z-50 overflow-hidden">
            {hasMetaMask ? (
              <>
                <button
                  onClick={connect}
                  className="w-full flex items-center gap-3 p-4 hover:bg-ph-hover transition-colors text-left"
                >
                  <span className="text-2xl">🔗</span>
                  <div>
                    <div className="text-sm font-semibold text-ph-text">Browser Wallet</div>
                    <div className="text-xs text-ph-text-muted">MetaMask, Coinbase, Rabby, etc.</div>
                  </div>
                </button>
                {wallet.error && (
                  <div className="px-4 pb-4 text-xs text-ph-loss">{wallet.error}</div>
                )}
              </>
            ) : (
              <div className="p-5 text-center">
                <p className="text-sm text-ph-text-secondary mb-3">No wallet detected</p>
                <a
                  href="https://link.zerion.io/referral?code=19NY21O03"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ph-primary hover:underline font-medium"
                >
                  Install a wallet →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Connected state
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-ph-hover hover:bg-ph-bg 
                   text-ph-text text-sm font-medium rounded-lg transition-all duration-200 border border-subtle"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-premium" />
        <span className="font-mono flex-1 text-left truncate text-ph-text">{shortenAddress(wallet.address)}</span>
        {chainInfo && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-ph-bg font-medium" style={{ color: chainInfo.color }}>
            {chainInfo.name}
          </span>
        )}
      </button>

      {showMenu && (
        <div className="absolute left-0 right-0 mt-2 bg-ph-card border border-subtle rounded-xl shadow-card z-50 overflow-hidden">
          <div className="p-4 border-b border-subtle">
            <div className="text-xs text-ph-text-muted mb-1">Connected</div>
            <div className="font-mono text-sm text-ph-text">{shortenAddress(wallet.address)}</div>
          </div>
          
          {wallet.chainId !== 137 && (
            <button
              onClick={switchToPolygon}
              className="w-full flex items-center gap-2 p-4 hover:bg-ph-hover text-left border-b border-subtle transition-colors"
            >
              <span style={{ color: '#8247e5' }}>⬡</span>
              <span className="text-sm text-ph-text-secondary">Switch to Polygon</span>
              <span className="ml-auto text-xs text-ph-warning font-medium">Recommended</span>
            </button>
          )}
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(wallet.address!);
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2 p-4 hover:bg-ph-hover text-left transition-colors"
          >
            <span>📋</span>
            <span className="text-sm text-ph-text-secondary">Copy Address</span>
          </button>
          
          <button
            onClick={disconnect}
            className="w-full flex items-center gap-2 p-4 hover:bg-ph-hover text-left text-ph-loss transition-colors"
          >
            <span>🚪</span>
            <span className="text-sm">Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
}
