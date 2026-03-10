import type React from 'react';
import type { WatchlistItem } from '../../api/portfolio';
import { AssetTypeBadge } from './AssetTypeBadge';
import { formatNumber, formatPercent, getChangeColor } from '../../utils/formatters';

interface WatchlistCardProps {
  item: WatchlistItem;
  onRemove: () => void;
  onAnalyze: () => void;
}

export const WatchlistCard: React.FC<WatchlistCardProps> = ({
  item,
  onRemove,
  onAnalyze,
}) => {

  return (
    <div className="glass-card p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-primary">{item.code}</span>
            <AssetTypeBadge assetType={item.assetType} />
          </div>
          {item.name && (
            <div className="text-sm text-secondary">{item.name}</div>
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
            onClick={onRemove}
            className="btn-secondary !px-3 !py-1 text-xs text-red-400 hover:text-red-300"
            title="删除"
          >
            删除
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <div className="text-secondary mb-1">当前价</div>
          <div className="text-primary font-medium">
            {item.currentPrice ? `¥${formatNumber(item.currentPrice)}` : 'N/A'}
          </div>
        </div>
        {item.changePercent !== undefined && (
          <div className="text-right">
            <div className="text-secondary mb-1">涨跌幅</div>
            <div className={`font-semibold ${getChangeColor(item.changePercent)}`}>
              {formatPercent(item.changePercent)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
