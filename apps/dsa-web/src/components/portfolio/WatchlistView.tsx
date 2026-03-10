import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { portfolioApi, type WatchlistResponse } from '../../api/portfolio';
import { analysisApi } from '../../api/analysis';
import { WatchlistCard } from './WatchlistCard';
import { AddToWatchlistModal } from './AddToWatchlistModal';
import { ApiErrorAlert } from '../common';
import { getParsedApiError, type ParsedApiError } from '../../api/error';

interface WatchlistViewProps {
  onAnalyze?: (code: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({ onAnalyze }) => {
  const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ParsedApiError | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      setError(null);
      const data = await portfolioApi.getWatchlist();
      setWatchlist(data);
    } catch (err) {
      setError(getParsedApiError(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleAddToWatchlist = async (stockCode: string) => {
    await portfolioApi.addToWatchlist({ stock_code: stockCode });
    await fetchWatchlist();
  };

  const handleRemoveFromWatchlist = async (code: string) => {
    if (!confirm(`确定要从自选中删除 ${code} 吗？`)) return;

    try {
      await portfolioApi.removeFromWatchlist(code);
      await fetchWatchlist();
    } catch (err) {
      setError(getParsedApiError(err));
    }
  };

  const handleAnalyze = async (code: string) => {
    if (onAnalyze) {
      onAnalyze(code);
      return;
    }
    try {
      await analysisApi.analyzeAsync({ stockCode: code, reportType: 'simple' });
    } catch (err) {
      setError(getParsedApiError(err));
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWatchlist();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-secondary">加载中...</div>
      </div>
    );
  }

  if (error) {
    return <ApiErrorAlert error={error} />;
  }

  if (!watchlist || watchlist.total === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-secondary mb-4">暂无自选</div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          添加自选
        </button>
        <AddToWatchlistModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddToWatchlist}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-primary">自选 ({watchlist.total})</h3>
          <button
            type="button"
            onClick={handleRefresh}
            className="btn-secondary !px-3 !py-1 text-xs"
            disabled={isRefreshing}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-primary !px-4 !py-2"
        >
          + 添加
        </button>
      </div>

      {/* Stocks section */}
      {watchlist.stocks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-secondary mb-3">📈 股票 ({watchlist.stocks.length})</h4>
          <div className="grid gap-3">
            {watchlist.stocks.map((item) => (
              <WatchlistCard
                key={item.code}
                item={item}
                onRemove={() => handleRemoveFromWatchlist(item.code)}
                onAnalyze={() => handleAnalyze(item.code)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Funds section */}
      {watchlist.funds.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-secondary mb-3">💰 基金 ({watchlist.funds.length})</h4>
          <div className="grid gap-3">
            {watchlist.funds.map((item) => (
              <WatchlistCard
                key={item.code}
                item={item}
                onRemove={() => handleRemoveFromWatchlist(item.code)}
                onAnalyze={() => handleAnalyze(item.code)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ETFs section */}
      {watchlist.etfs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-secondary mb-3">📊 ETF ({watchlist.etfs.length})</h4>
          <div className="grid gap-3">
            {watchlist.etfs.map((item) => (
              <WatchlistCard
                key={item.code}
                item={item}
                onRemove={() => handleRemoveFromWatchlist(item.code)}
                onAnalyze={() => handleAnalyze(item.code)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <AddToWatchlistModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddToWatchlist}
      />
    </div>
  );
};
