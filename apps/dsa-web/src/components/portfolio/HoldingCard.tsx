import type React from 'react';
import type { HoldingItem } from '../../api/portfolio';
import { AssetTypeBadge } from './AssetTypeBadge';
import { formatNumber, formatPercent, getChangeColor } from '../../utils/formatters';

interface HoldingCardProps {
  holding: HoldingItem;
  onEdit: () => void;
  onDelete: () => void;
  onAnalyze: () => void;
}

export const HoldingCard: React.FC<HoldingCardProps> = ({
  holding,
  onEdit,
  onDelete,
  onAnalyze,
}) => {

  return (
    <div className="glass-card p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-primary">{holding.code}</span>
            <AssetTypeBadge assetType={holding.assetType} />
          </div>
          {holding.name && (
            <div className="text-sm text-secondary">{holding.name}</div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAnalyze}
            className="btn-secondary !px-3 !py-1 text-xs"
            title="分析"
          >
            分析
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="btn-secondary !px-3 !py-1 text-xs"
            title="编辑"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="btn-secondary !px-3 !py-1 text-xs text-red-400 hover:text-red-300"
            title="删除"
          >
            删除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-secondary mb-1">持有份额</div>
          <div className="text-primary font-medium">{formatNumber(holding.shares)}</div>
        </div>
        <div>
          <div className="text-secondary mb-1">成本价</div>
          <div className="text-primary font-medium">¥{formatNumber(holding.costBasis)}</div>
        </div>
        <div>
          <div className="text-secondary mb-1">当前价</div>
          <div className="text-primary font-medium">
            {holding.currentPrice ? `¥${formatNumber(holding.currentPrice)}` : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-secondary mb-1">市值</div>
          <div className="text-primary font-medium">
            {holding.marketValue ? `¥${formatNumber(holding.marketValue)}` : 'N/A'}
          </div>
        </div>
      </div>

      {holding.unrealizedPnl !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">盈亏</span>
            <div className="text-right">
              <div className={`font-semibold ${getChangeColor(holding.unrealizedPnl)}`}>
                ¥{formatNumber(holding.unrealizedPnl)}
              </div>
              <div className={`text-sm ${getChangeColor(holding.unrealizedPnl)}`}>
                {formatPercent(holding.unrealizedPnlPct)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
