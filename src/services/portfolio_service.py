# -*- coding: utf-8 -*-
"""
Portfolio Service - Business logic for holdings and watchlist management
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from data_provider import DataFetcherManager, get_asset_type
from src.storage import get_db, PortfolioHolding, PortfolioWatchlist
from src.data.stock_mapping import STOCK_NAME_MAP
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)


class PortfolioService:
    """
    Portfolio management service

    Handles holdings and watchlist operations with:
    - Automatic asset type detection
    - Real-time price fetching
    - P&L calculation
    - Stock name resolution
    """

    def __init__(self):
        self.db = get_db()
        self.data_manager = DataFetcherManager()

    def _resolve_stock_name(self, code: str) -> Optional[str]:
        """
        Resolve stock/fund name from code

        Priority:
        1. STOCK_NAME_MAP (static mapping)
        2. Real-time quote name
        3. None (will be resolved later)
        """
        # Try static mapping first
        if code in STOCK_NAME_MAP:
            return STOCK_NAME_MAP[code]

        # Try fetching from real-time quote
        try:
            quote = self.data_manager.get_realtime_quote(code)
            if quote and hasattr(quote, 'name') and quote.name:
                return quote.name
        except Exception as e:
            logger.debug(f"Failed to fetch name for {code}: {e}")

        return None

    def add_holding(
        self,
        code: str,
        shares: float,
        cost_basis: float
    ) -> Dict[str, Any]:
        """
        Add or update a holding with automatic asset type detection

        Args:
            code: Stock/fund code
            shares: Number of shares/units
            cost_basis: Average cost per share

        Returns:
            Dict with holding details

        Raises:
            ValueError: If shares or cost_basis is invalid
        """
        if shares <= 0:
            raise ValueError("Shares must be positive")
        if cost_basis <= 0:
            raise ValueError("Cost basis must be positive")

        # Detect asset type
        asset_type = get_asset_type(code)
        logger.info(f"Detected asset type for {code}: {asset_type}")

        # Resolve name
        name = self._resolve_stock_name(code)

        try:
            # Try to create new holding
            holding = self.db.create_portfolio_holding(
                code=code,
                name=name,
                asset_type=asset_type,
                shares=shares,
                cost_basis=cost_basis
            )
            logger.info(f"Created new holding: {code}")
        except IntegrityError:
            # Already exists, update instead
            holding = self.db.update_portfolio_holding(
                code=code,
                shares=shares,
                cost_basis=cost_basis
            )
            logger.info(f"Updated existing holding: {code}")

        return self._holding_to_dict(holding)

    def update_holding(
        self,
        code: str,
        shares: float,
        cost_basis: float
    ) -> Dict[str, Any]:
        """
        Update an existing holding

        Args:
            code: Stock/fund code
            shares: New number of shares/units
            cost_basis: New average cost per share

        Returns:
            Dict with updated holding details

        Raises:
            ValueError: If holding not found or invalid values
        """
        if shares <= 0:
            raise ValueError("Shares must be positive")
        if cost_basis <= 0:
            raise ValueError("Cost basis must be positive")

        holding = self.db.update_portfolio_holding(code, shares, cost_basis)
        if not holding:
            raise ValueError(f"Holding not found: {code}")

        return self._holding_to_dict(holding)

    def delete_holding(self, code: str) -> bool:
        """
        Remove a holding

        Args:
            code: Stock/fund code

        Returns:
            True if deleted, False if not found
        """
        result = self.db.delete_portfolio_holding(code)
        if result:
            logger.info(f"Deleted holding: {code}")
        return result

    def get_holdings(
        self,
        asset_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get all holdings with current prices and P&L calculation

        Args:
            asset_type: Filter by asset type (optional)

        Returns:
            Dict with holdings grouped by asset type and summary stats
        """
        holdings = self.db.get_portfolio_holdings(asset_type)

        # Enrich with current prices and calculate P&L
        enriched_holdings = []
        total_cost = 0.0
        total_market_value = 0.0

        for holding in holdings:
            holding_dict = self._holding_to_dict(holding)

            # Fetch current price
            try:
                quote = self.data_manager.get_realtime_quote(holding.code)
                if quote and hasattr(quote, 'price') and quote.price:
                    current_price = float(quote.price)
                    holding_dict['current_price'] = current_price

                    # Calculate market value and P&L
                    market_value = current_price * holding.shares
                    cost = holding.cost_basis * holding.shares
                    pnl = market_value - cost
                    pnl_pct = (pnl / cost * 100) if cost > 0 else 0

                    holding_dict['market_value'] = round(market_value, 2)
                    holding_dict['unrealized_pnl'] = round(pnl, 2)
                    holding_dict['unrealized_pnl_pct'] = round(pnl_pct, 2)

                    total_cost += cost
                    total_market_value += market_value

                    # Update name if available from quote
                    if hasattr(quote, 'name') and quote.name and not holding.name:
                        holding_dict['name'] = quote.name
            except Exception as e:
                logger.warning(f"Failed to fetch price for {holding.code}: {e}")

            enriched_holdings.append(holding_dict)

        # Group by asset type
        stocks = [h for h in enriched_holdings if h['asset_type'] in ('stock', 'hk_stock', 'us_stock')]
        funds = [h for h in enriched_holdings if h['asset_type'] == 'fund']
        etfs = [h for h in enriched_holdings if h['asset_type'] == 'etf']

        # Calculate total P&L
        total_pnl = total_market_value - total_cost
        total_pnl_pct = (total_pnl / total_cost * 100) if total_cost > 0 else 0

        return {
            'total': len(enriched_holdings),
            'stocks': stocks,
            'funds': funds,
            'etfs': etfs,
            'total_cost': round(total_cost, 2),
            'total_market_value': round(total_market_value, 2),
            'total_pnl': round(total_pnl, 2),
            'total_pnl_pct': round(total_pnl_pct, 2),
        }

    def add_to_watchlist(self, code: str) -> Dict[str, Any]:
        """
        Add stock/fund to watchlist with asset type detection

        Args:
            code: Stock/fund code

        Returns:
            Dict with watchlist item details

        Raises:
            IntegrityError: If code already exists in watchlist
        """
        # Detect asset type
        asset_type = get_asset_type(code)
        logger.info(f"Detected asset type for {code}: {asset_type}")

        # Resolve name
        name = self._resolve_stock_name(code)

        item = self.db.create_watchlist_item(
            code=code,
            name=name,
            asset_type=asset_type
        )
        logger.info(f"Added to watchlist: {code}")

        return self._watchlist_to_dict(item)

    def remove_from_watchlist(self, code: str) -> bool:
        """
        Remove stock/fund from watchlist

        Args:
            code: Stock/fund code

        Returns:
            True if deleted, False if not found
        """
        result = self.db.delete_watchlist_item(code)
        if result:
            logger.info(f"Removed from watchlist: {code}")
        return result

    def get_watchlist(
        self,
        asset_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get all watchlist items with current prices

        Args:
            asset_type: Filter by asset type (optional)

        Returns:
            Dict with watchlist items grouped by asset type
        """
        items = self.db.get_watchlist_items(asset_type)

        # Enrich with current prices
        enriched_items = []

        for item in items:
            item_dict = self._watchlist_to_dict(item)

            # Fetch current price
            try:
                quote = self.data_manager.get_realtime_quote(item.code)
                if quote:
                    if hasattr(quote, 'price') and quote.price:
                        item_dict['current_price'] = float(quote.price)
                    if hasattr(quote, 'change_pct') and quote.change_pct is not None:
                        item_dict['change_percent'] = float(quote.change_pct)

                    # Update name if available from quote
                    if hasattr(quote, 'name') and quote.name and not item.name:
                        item_dict['name'] = quote.name
            except Exception as e:
                logger.warning(f"Failed to fetch price for {item.code}: {e}")

            enriched_items.append(item_dict)

        # Group by asset type
        stocks = [i for i in enriched_items if i['asset_type'] in ('stock', 'hk_stock', 'us_stock')]
        funds = [i for i in enriched_items if i['asset_type'] == 'fund']
        etfs = [i for i in enriched_items if i['asset_type'] == 'etf']

        return {
            'total': len(enriched_items),
            'stocks': stocks,
            'funds': funds,
            'etfs': etfs,
        }

    def _holding_to_dict(self, holding: PortfolioHolding) -> Dict[str, Any]:
        """Convert PortfolioHolding ORM object to dict"""
        return {
            'code': holding.code,
            'name': holding.name,
            'asset_type': holding.asset_type,
            'shares': holding.shares,
            'cost_basis': holding.cost_basis,
            'created_at': holding.created_at.isoformat() if holding.created_at else None,
            'updated_at': holding.updated_at.isoformat() if holding.updated_at else None,
        }

    def _watchlist_to_dict(self, item: PortfolioWatchlist) -> Dict[str, Any]:
        """Convert PortfolioWatchlist ORM object to dict"""
        return {
            'code': item.code,
            'name': item.name,
            'asset_type': item.asset_type,
            'created_at': item.created_at.isoformat() if item.created_at else None,
        }
