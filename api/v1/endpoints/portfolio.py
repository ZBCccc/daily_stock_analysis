# -*- coding: utf-8 -*-
"""
Portfolio API Endpoints - Holdings and watchlist management
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.exc import IntegrityError

from api.v1.schemas.portfolio import (
    CreateHoldingRequest,
    UpdateHoldingRequest,
    HoldingItem,
    HoldingsListResponse,
    AddWatchlistRequest,
    WatchlistItem,
    WatchlistResponse,
)
from src.services.portfolio_service import PortfolioService

logger = logging.getLogger(__name__)

router = APIRouter()


# === Holdings Endpoints ===

@router.get("/holdings", response_model=HoldingsListResponse)
def get_holdings(
    asset_type: Optional[str] = Query(None, description="Filter by asset type (stock/fund/etf)")
):
    """
    Get all portfolio holdings with current prices and P&L

    Returns holdings grouped by asset type with:
    - Current market value
    - Unrealized P&L (amount and percentage)
    - Total portfolio statistics
    """
    try:
        service = PortfolioService()
        result = service.get_holdings(asset_type=asset_type)
        return result
    except Exception as e:
        logger.exception(f"Failed to get holdings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/holdings", response_model=HoldingItem)
def create_holding(request: CreateHoldingRequest):
    """
    Create a new holding or update if already exists

    Automatically detects asset type (stock/fund/etf) and resolves name.
    """
    try:
        service = PortfolioService()
        result = service.add_holding(
            code=request.stock_code,
            shares=request.shares,
            cost_basis=request.cost_basis
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Failed to create holding: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/holdings/{code}", response_model=HoldingItem)
def update_holding(code: str, request: UpdateHoldingRequest):
    """
    Update an existing holding's shares and cost basis
    """
    try:
        service = PortfolioService()
        result = service.update_holding(
            code=code.upper(),
            shares=request.shares,
            cost_basis=request.cost_basis
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception(f"Failed to update holding: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/holdings/{code}")
def delete_holding(code: str):
    """
    Delete a holding from portfolio
    """
    try:
        service = PortfolioService()
        result = service.delete_holding(code.upper())
        if not result:
            raise HTTPException(status_code=404, detail=f"Holding not found: {code}")
        return {"message": f"Holding {code} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to delete holding: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# === Watchlist Endpoints ===

@router.get("/watchlist", response_model=WatchlistResponse)
def get_watchlist(
    asset_type: Optional[str] = Query(None, description="Filter by asset type (stock/fund/etf)")
):
    """
    Get all watchlist items with current prices

    Returns items grouped by asset type with:
    - Current price
    - Change percentage
    """
    try:
        service = PortfolioService()
        result = service.get_watchlist(asset_type=asset_type)
        return result
    except Exception as e:
        logger.exception(f"Failed to get watchlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/watchlist", response_model=WatchlistItem)
def add_to_watchlist(request: AddWatchlistRequest):
    """
    Add a stock/fund to watchlist

    Automatically detects asset type and resolves name.
    """
    try:
        service = PortfolioService()
        result = service.add_to_watchlist(code=request.stock_code)
        return result
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail=f"Code {request.stock_code} already exists in watchlist"
        )
    except Exception as e:
        logger.exception(f"Failed to add to watchlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/watchlist/{code}")
def remove_from_watchlist(code: str):
    """
    Remove a stock/fund from watchlist
    """
    try:
        service = PortfolioService()
        result = service.remove_from_watchlist(code.upper())
        if not result:
            raise HTTPException(status_code=404, detail=f"Watchlist item not found: {code}")
        return {"message": f"Watchlist item {code} removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to remove from watchlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))
