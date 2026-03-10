import type React from 'react';
import { useState } from 'react';
import { validateStockCode } from '../../utils/validation';

interface AddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stockCode: string) => Promise<void>;
}

export const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [stockCode, setStockCode] = useState('');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    // Validate stock code
    const validation = validateStockCode(stockCode);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(stockCode.trim().toUpperCase());
      setStockCode('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">添加自选</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="text-xs text-secondary mt-1">
              支持: A股(6位)、基金(6位)、港股(5位)、美股(字母)
            </div>
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
              {isSubmitting ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
