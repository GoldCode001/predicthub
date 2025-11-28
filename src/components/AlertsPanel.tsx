'use client';

import { Alert } from './AlertModal';
import { Platform } from '@/types/market';
import { platformColors } from './PlatformLogo';

interface AlertsPanelProps {
  alerts: Alert[];
  onDeleteAlert: (id: string) => void;
}

export default function AlertsPanel({ alerts, onDeleteAlert }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return null;
  }

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <div className="p-4 border-t border-subtle">
      <h3 className="text-xs font-semibold text-ph-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Active Alerts
        <span className="ml-auto px-2 py-0.5 bg-ph-secondary/20 text-ph-secondary text-xs font-bold rounded-full">
          {activeAlerts.length}
        </span>
      </h3>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className="group relative p-3 bg-ph-bg rounded-xl hover:bg-ph-hover transition-colors"
          >
            <div className="flex items-start gap-2">
              <span 
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: platformColors[alert.platform as Platform] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ph-text-secondary line-clamp-1">{alert.marketQuestion}</p>
                <p className="text-xs text-ph-text-muted mt-0.5 font-medium">
                  {alert.condition === 'above' ? '↑' : '↓'} {alert.threshold}%
                </p>
              </div>
              <button
                onClick={() => onDeleteAlert(alert.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-ph-text-muted hover:text-ph-loss rounded-lg hover:bg-ph-bg transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {triggeredAlerts.length > 0 && (
          <>
            <div className="text-xs text-ph-text-muted mt-4 mb-2 font-medium">Triggered</div>
            {triggeredAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-ph-profit/10 border border-ph-profit/20 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="text-ph-profit">✓</span>
                  <p className="text-xs text-ph-text-secondary line-clamp-1 flex-1">{alert.marketQuestion}</p>
                  <button
                    onClick={() => onDeleteAlert(alert.id)}
                    className="p-1.5 text-ph-text-muted hover:text-ph-loss rounded-lg transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
