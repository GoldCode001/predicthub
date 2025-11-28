'use client';

import { useState, useEffect } from 'react';
import { UnifiedMarket } from '@/types/market';
import { PlatformBadge, platformColors } from './PlatformLogo';

export interface Alert {
  id: string;
  marketId: string;
  marketQuestion: string;
  platform: string;
  condition: 'above' | 'below';
  threshold: number;
  createdAt: string;
  triggered: boolean;
}

interface AlertModalProps {
  market: UnifiedMarket | null;
  onClose: () => void;
  onSave: (alert: Alert) => void;
}

export default function AlertModal({ market, onClose, onSave }: AlertModalProps) {
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState(50);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (market) {
      // Set threshold based on current price
      setThreshold(Math.round(market.probability + (condition === 'above' ? 10 : -10)));
    }
  }, [market, condition]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const handleSave = () => {
    if (!market) return;

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      marketId: market.id,
      marketQuestion: market.question,
      platform: market.platform,
      condition,
      threshold,
      createdAt: new Date().toISOString(),
      triggered: false,
    };

    onSave(alert);
    onClose();
  };

  if (!market) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-ph-card border border-subtle rounded-2xl shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-ph-warning/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-ph-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-ph-text">Set Price Alert</h2>
              <p className="text-xs text-ph-text-muted">Get notified when price changes</p>
            </div>
          </div>
        </div>

        {/* Market info */}
        <div className="p-6 border-b border-subtle">
          <PlatformBadge platform={market.platform} size="sm" className="mb-2" />
          <p className="text-sm text-ph-text-secondary">{market.question}</p>
          <p className="text-xs text-ph-text-muted mt-2">
            Current price: <span className="text-ph-text font-bold tabular-nums">{market.probability.toFixed(1)}%</span>
          </p>
        </div>

        {/* Alert settings */}
        <div className="p-6 space-y-5">
          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-ph-text-secondary mb-3">Notify me when YES price goes</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCondition('above')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all ${
                  condition === 'above'
                    ? 'bg-ph-profit/20 text-ph-profit border border-ph-profit/30'
                    : 'bg-ph-bg text-ph-text-secondary border border-subtle hover:border-ph-text-muted'
                }`}
              >
                ↑ Above
              </button>
              <button
                onClick={() => setCondition('below')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all ${
                  condition === 'below'
                    ? 'bg-ph-loss/20 text-ph-loss border border-ph-loss/30'
                    : 'bg-ph-bg text-ph-text-secondary border border-subtle hover:border-ph-text-muted'
                }`}
              >
                ↓ Below
              </button>
            </div>
          </div>

          {/* Threshold */}
          <div>
            <label className="block text-sm font-medium text-ph-text-secondary mb-3">
              Price threshold: <span className="text-ph-text font-bold tabular-nums">{threshold}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="99"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-2 bg-ph-bg rounded-full appearance-none cursor-pointer accent-ph-primary"
            />
            <div className="flex justify-between text-xs text-ph-text-muted mt-2">
              <span>1%</span>
              <span>50%</span>
              <span>99%</span>
            </div>
          </div>

          {/* Notification permission */}
          {notificationPermission !== 'granted' && (
            <div className="p-4 bg-ph-warning/10 border border-ph-warning/20 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-ph-warning text-lg">⚠️</span>
                <div>
                  <p className="text-sm text-ph-text font-medium">Enable browser notifications</p>
                  <p className="text-xs text-ph-text-muted mb-3">Required to receive alerts</p>
                  <button
                    onClick={requestNotificationPermission}
                    className="text-xs text-ph-warning hover:text-ph-warning/80 font-semibold"
                  >
                    Enable Notifications →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Browser-only notice */}
          <div className="p-4 bg-ph-bg rounded-xl">
            <p className="text-xs text-ph-text-muted">
              📱 <strong className="text-ph-text-secondary">Browser-only alerts:</strong> Alerts are saved locally and only work while this tab is open.
            </p>
            <p className="text-xs text-ph-secondary mt-2 font-medium">
              ✨ Coming in Premium: Email & SMS alerts, mobile notifications
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-subtle flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-ph-hover hover:bg-ph-bg text-ph-text-secondary rounded-xl font-semibold transition-all border border-subtle"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 btn-premium text-white rounded-xl font-bold transition-all"
          >
            Create Alert
          </button>
        </div>
      </div>
    </div>
  );
}
