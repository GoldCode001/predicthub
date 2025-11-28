'use client';

import { useState } from 'react';

export default function PremiumBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-ph-primary/10 via-ph-secondary/10 to-ph-primary/10 border border-ph-primary/20 rounded-xl p-5 mb-6 overflow-hidden animate-fadeIn">
      {/* Background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ph-primary/10 via-transparent to-transparent" />
      
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1.5 text-ph-text-muted hover:text-ph-text hover:bg-ph-hover rounded-lg transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-premium flex items-center justify-center shrink-0 shadow-glow-purple">
            <span className="text-2xl">✨</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-ph-text">Coming Soon: Premium Features</h3>
            <p className="text-sm text-ph-text-secondary mt-0.5">
              Email & SMS alerts • Portfolio sync • API access • Advanced analytics
            </p>
          </div>
        </div>

        <button className="sm:ml-auto px-5 py-2.5 btn-premium text-white text-sm font-semibold rounded-lg shadow-glow-blue">
          Join Waitlist
        </button>
      </div>
    </div>
  );
}
