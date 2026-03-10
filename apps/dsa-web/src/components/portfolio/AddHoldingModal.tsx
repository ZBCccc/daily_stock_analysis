import type React from 'react';
import { useState } from 'react';
import { validateStockCode } from '../../utils/validation';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { stockCode: string; shares: number; costBasis: number }) => Promise<void>;
  initialData?: {
    code: string;
    shares: number;
    costBasis: number;
  };
}

export const AddHoldingModal: React.FC<AddHoldingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [stockCode, setStockCode] = useState(initialData?.code || '');
  const [shares, setShares] = useState(initialData?.shares?.toString() || '');
  const [costBasis, setCostBasis] = useState(initialData?.costBasis?.toString() || '');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    // Validate stock code
    if (!isEditMode) {
      const validation = validateStockCode(stockCode);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
    }

    // Validate shares
    const sharesNum = parseFloat(shares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      setError('持有份额必须大于0');
      return;
    }

    // Validate cost basis
    const costBasisNum = parseFloat(costBasis);
    if (isNaN(costBasisNum) || costBasisNum <= 0) {
      setError('成本价必须大于0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        stockCode: isEditMode ? initialData.code : stockCode.trim().toUpperCase(),
        shares: sharesNum,
        costBasis: costBasisNum,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">
          {isEditMode ? '编辑持仓' : '添加持仓'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditMode && (
            <div>
              <label htmlFor="stockCode" className="block text-sm text-secondary mb-2">
                股票/基金代码
              </label>
              <input
                id="stockCode"
                type="text"
                className="input-terminal w-full"
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
                placeholder="例如: 600519, 110022, AAPL"
                required
                autoFocus
              />
            </div>
          )}

          {isEditMode && (
            <div>
              <label className="block text-sm text-secondary mb-2">代码</label>
              <div className="text-primary font-medium">{initialData.code}</div>
            </div>
          )}

          <div>
            <label htmlFor="shares" className="block text-sm text-secondary mb-2">
              持有份额
            </label>
            <input
              id="shares"
              type="number"
              step="0.01"
              min="0"
              className="input-terminal w-full"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="例如: 100"
              required
            />
          </div>

          <div>
            <label htmlFor="costBasis" className="block text-sm text-secondary mb-2">
              成本价（元）
            </label>
            <input
              id="costBasis"
              type="number"
              step="0.01"
              min="0"
              className="input-terminal w-full"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              placeholder="例如: 1800.50"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : isEditMode ? '更新' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
