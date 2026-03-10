import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { portfolioApi, type HoldingsListResponse, type HoldingItem } from '../../api/portfolio';
import { analysisApi } from '../../api/analysis';
import { HoldingCard } from './HoldingCard';
import { AddHoldingModal } from './AddHoldingModal';
import { ApiErrorAlert } from '../common';
import { getParsedApiError, type ParsedApiError } from '../../api/error';

interface HoldingsViewProps {
  onAnalyze?: (code: string) => void;
}

export const HoldingsView: React.FC<HoldingsViewProps> = ({ onAnalyze }) => {
  const [holdings, setHoldings] = useState<HoldingsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ParsedApiError | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState<HoldingItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHoldings = useCallback(async () => {
    try {
      setError(null);
      const data = await portfolioApi.getHoldings();
      setHoldings(data);
    } catch (err) {
      setError(getParsedApiError(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const handleAddHolding = async (data: { stockCode: string; shares: number; costBasis: number }) => {
    await portfolioApi.createHolding({
      stock_code: data.stockCode,
      shares: data.shares,
      cost_basis: data.costBasis,
    });
    await fetchHoldings();
  };

  const handleUpdateHolding = async (data: { stockCode: string; shares: number; costBasis: number }) => {
    await portfolioApi.updateHolding(data.stockCode, {
      shares: data.shares,
      cost_basis: data.costBasis,
    });
    setEditingHolding(null);
    await fetchHoldings();
  };

  const handleDeleteHolding = async (code: string) => {
    if (!confirm(`确定要删除持仓 ${code} 吗？`)) return;

    try {
      await portfolioApi.deleteHolding(code);
      await fetchHoldings();
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
    fetchHoldings();
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

  if (!holdings || holdings.total === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-secondary mb-4">暂无持仓</div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          添加持仓
        </button>
        <AddHoldingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddHolding}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-primary">持仓 ({holdings.total})</h3>
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

      {/* Portfolio summary */}
      <div className="glass-card p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-secondary mb-1">总成本</div>
          <div className="text-lg font-semibold text-primary">
            ¥{holdings.totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-xs text-secondary mb-1">总市值</div>
          <div className="text-lg font-semibold text-primary">
            ¥{holdings.totalMarketValue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-xs text-secondary mb-1">总盈亏</div>
          <div className={`text-lg font-semibold ${holdings.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ¥{holdings.totalPnl.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-xs text-secondary mb-1">收益率</div>
          <div className={`text-lg font-semibold ${holdings.totalPnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {holdings.totalPnlPct >= 0 ? '+' : ''}{holdings.totalPnlPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Stocks section */}
      {holdings.stocks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-secondary mb-3">📈 股票 ({holdings.stocks.length})</h4>
          <div className="grid gap-3">
            {holdings.stocks.map((holding) => (
              <HoldingCard
                key={holding.code}
                holding={holding}
                onEdit={() => setEditingHolding(holding)}
                onDelete={() => handleDeleteHolding(holding.code)}
                onAnalyze={() => handleAnalyze(holding.code)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Funds section */}
      {holdings.funds.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-secondary mb-3">💰 基金 ({holdings.funds.length})</h4>
          <div className="grid gap-3">
            {holdings.funds.map((holding) => (
              <HoldingCard
                key={holding.code}
                holding={holding}
                onEdit={() => setEditingHolding(holding)}
                onDelete={() => handleDeleteHolding(holding.code)}
                onAnalyze={() => handleAnalyze(holding.code)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ETFs section */}
      {holdings.etfs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-secondary mb-3">📊 ETF ({holdings.etfs.length})</h4>
          <div className="grid gap-3">
            {holdings.etfs.map((holding) => (
              <HoldingCard
                key={holding.code}
                holding={holding}
                onEdit={() => setEditingHolding(holding)}
                onDelete={() => handleDeleteHolding(holding.code)}
                onAnalyze={() => handleAnalyze(holding.code)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddHoldingModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddHolding}
      />

      {editingHolding && (
        <AddHoldingModal
          isOpen={true}
          onClose={() => setEditingHolding(null)}
          onSubmit={handleUpdateHolding}
          initialData={{
            code: editingHolding.code,
            shares: editingHolding.shares,
            costBasis: editingHolding.costBasis,
          }}
        />
      )}
    </div>
  );
};
