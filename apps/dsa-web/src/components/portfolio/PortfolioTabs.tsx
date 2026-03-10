import type React from 'react';
import { useState } from 'react';
import { HoldingsView } from './HoldingsView';
import { WatchlistView } from './WatchlistView';

interface PortfolioTabsProps {
  onAnalyze?: (code: string) => void;
}

export const PortfolioTabs: React.FC<PortfolioTabsProps> = ({ onAnalyze }) => {
  const [activeTab, setActiveTab] = useState<'holdings' | 'watchlist'>('holdings');

  return (
    <div className="glass-card rounded-xl p-3 flex flex-col gap-3 overflow-hidden min-h-0">
      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'holdings'
              ? 'bg-cyan/10 text-cyan border border-cyan/20'
              : 'text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          持仓
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'watchlist'
              ? 'bg-cyan/10 text-cyan border border-cyan/20'
              : 'text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          自选
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {activeTab === 'holdings' ? (
          <HoldingsView onAnalyze={onAnalyze} />
        ) : (
          <WatchlistView onAnalyze={onAnalyze} />
        )}
      </div>
    </div>
  );
};
