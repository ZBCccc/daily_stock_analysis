# -*- coding: utf-8 -*-
"""
Portfolio API Schemas - Pydantic models for request/response validation
"""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

from data_provider.base import canonical_stock_code


class CreateHoldingRequest(BaseModel):
    """Request to create a new holding"""
    stock_code: str = Field(..., min_length=1, max_length=10, description="Stock/fund code")
    shares: float = Field(..., gt=0, description="Number of shares/units")
    cost_basis: float = Field(..., gt=0, description="Average cost per share")

    @field_validator('stock_code')
    @classmethod
    def validate_code(cls, v: str) -> str:
        return canonical_stock_code(v)


class UpdateHoldingRequest(BaseModel):
    """Request to update an existing holding"""
    shares: float = Field(..., gt=0, description="Number of shares/units")
    cost_basis: float = Field(..., gt=0, description="Average cost per share")


class HoldingItem(BaseModel):
    """Individual holding item with P&L calculation"""
    code: str
    name: Optional[str] = None
    asset_type: str
    shares: float
    cost_basis: float
    current_price: Optional[float] = None
    market_value: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    unrealized_pnl_pct: Optional[float] = None
    created_at: str
    updated_at: str


class HoldingsListResponse(BaseModel):
    """Response with all holdings grouped by asset type"""
    total: int
    stocks: List[HoldingItem]
    funds: List[HoldingItem]
    etfs: List[HoldingItem]
    total_cost: float
    total_market_value: float
    total_pnl: float
    total_pnl_pct: float


class AddWatchlistRequest(BaseModel):
    """Request to add item to watchlist"""
    stock_code: str = Field(..., min_length=1, max_length=10, description="Stock/fund code")

    @field_validator('stock_code')
    @classmethod
    def validate_code(cls, v: str) -> str:
        return canonical_stock_code(v)


class WatchlistItem(BaseModel):
    """Individual watchlist item"""
    code: str
    name: Optional[str] = None
    asset_type: str
    current_price: Optional[float] = None
    change_percent: Optional[float] = None
    created_at: str


class WatchlistResponse(BaseModel):
    """Response with all watchlist items grouped by asset type"""
    total: int
    stocks: List[WatchlistItem]
    funds: List[WatchlistItem]
    etfs: List[WatchlistItem]
