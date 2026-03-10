/**
 * Portfolio API Client - Holdings and watchlist management
 */

import { apiClient } from './client';

export interface HoldingItem {
  code: string;
  name?: string;
  assetType: 'stock' | 'fund' | 'etf' | 'hk_stock' | 'us_stock';
  shares: number;
  costBasis: number;
  currentPrice?: number;
  marketValue?: number;
  unrealizedPnl?: number;
  unrealizedPnlPct?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingsListResponse {
  total: number;
  stocks: HoldingItem[];
  funds: HoldingItem[];
  etfs: HoldingItem[];
  totalCost: number;
  totalMarketValue: number;
  totalPnl: number;
  totalPnlPct: number;
}

export interface CreateHoldingRequest {
  stock_code: string;
  shares: number;
  cost_basis: number;
}

export interface UpdateHoldingRequest {
  shares: number;
  cost_basis: number;
}

export interface WatchlistItem {
  code: string;
  name?: string;
  assetType: 'stock' | 'fund' | 'etf' | 'hk_stock' | 'us_stock';
  currentPrice?: number;
  changePercent?: number;
  createdAt: string;
}

export interface WatchlistResponse {
  total: number;
  stocks: WatchlistItem[];
  funds: WatchlistItem[];
  etfs: WatchlistItem[];
}

export interface AddWatchlistRequest {
  stock_code: string;
}

export const portfolioApi = {
  /**
   * Get all holdings with current prices and P&L
   */
  async getHoldings(assetType?: string): Promise<HoldingsListResponse> {
    const params = assetType ? { asset_type: assetType } : {};
    const response = await apiClient.get('/portfolio/holdings', { params });
    return response.data;
  },

  /**
   * Create a new holding or update if exists
   */
  async createHolding(data: CreateHoldingRequest): Promise<HoldingItem> {
    const response = await apiClient.post('/portfolio/holdings', data);
    return response.data;
  },

  /**
   * Update an existing holding
   */
  async updateHolding(code: string, data: UpdateHoldingRequest): Promise<HoldingItem> {
    const response = await apiClient.put(`/portfolio/holdings/${code}`, data);
    return response.data;
  },

  /**
   * Delete a holding
   */
  async deleteHolding(code: string): Promise<void> {
    await apiClient.delete(`/portfolio/holdings/${code}`);
  },

  /**
   * Get all watchlist items with current prices
   */
  async getWatchlist(assetType?: string): Promise<WatchlistResponse> {
    const params = assetType ? { asset_type: assetType } : {};
    const response = await apiClient.get('/portfolio/watchlist', { params });
    return response.data;
  },

  /**
   * Add item to watchlist
   */
  async addToWatchlist(data: AddWatchlistRequest): Promise<WatchlistItem> {
    const response = await apiClient.post('/portfolio/watchlist', data);
    return response.data;
  },

  /**
   * Remove item from watchlist
   */
  async removeFromWatchlist(code: string): Promise<void> {
    await apiClient.delete(`/portfolio/watchlist/${code}`);
  },
};
