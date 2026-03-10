import type React from 'react';

interface AssetTypeBadgeProps {
  assetType: 'stock' | 'fund' | 'etf' | 'hk_stock' | 'us_stock';
}

const ASSET_TYPE_CONFIG = {
  stock: { label: '股票', color: 'bg-blue-500/20 text-blue-300' },
  fund: { label: '基金', color: 'bg-green-500/20 text-green-300' },
  etf: { label: 'ETF', color: 'bg-purple-500/20 text-purple-300' },
  hk_stock: { label: '港股', color: 'bg-yellow-500/20 text-yellow-300' },
  us_stock: { label: '美股', color: 'bg-red-500/20 text-red-300' },
};

export const AssetTypeBadge: React.FC<AssetTypeBadgeProps> = ({ assetType }) => {
  const config = ASSET_TYPE_CONFIG[assetType] || ASSET_TYPE_CONFIG.stock;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};
