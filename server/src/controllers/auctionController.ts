import { Request, Response } from 'express';
import {
  getAuctions,
  getAuctionById,
  createAuction as createAuctionModel,
  updateAuction as updateAuctionModel,
  deleteAuction as deleteAuctionModel,
  buyNowAuction,
} from '../models/auctionModel.js';
import { placeBidAtomic, getBidsByAuctionId } from '../models/bidModel.js';
import { broadcastEvent } from '../services/websocketService.js';

export async function listAuctions(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      category,
      subCategory,
      city,
      regionId,
      status,
      minPrice,
      maxPrice,
      sellerId,
      isFeatured,
      sortBy,
      page,
      perPage,
    } = req.query;

    const result = getAuctions({
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      subCategory: subCategory ? String(subCategory) : undefined,
      city: city ? String(city) : undefined,
      regionId: regionId ? String(regionId) : undefined,
      status: status ? String(status) : undefined,
      minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
      maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
      sellerId: sellerId ? String(sellerId) : undefined,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' || isFeatured === '1' : undefined,
      sortBy: sortBy as any,
      page: page ? parseInt(String(page), 10) : 1,
      perPage: perPage ? parseInt(String(perPage), 10) : 20,
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
      links: {
        first: `?page=1`,
        last: `?page=${result.meta.lastPage}`,
        prev: result.meta.currentPage > 1 ? `?page=${result.meta.currentPage - 1}` : null,
        next: result.meta.currentPage < result.meta.lastPage ? `?page=${result.meta.currentPage + 1}` : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAuction(req: Request, res: Response): Promise<void> {
  try {
    const auction = getAuctionById(req.params.id);
    if (!auction) {
      res.status(404).json({
        success: false,
        error: 'Аукцион лоту табылган жок (Auction not found)',
      });
      return;
    }

    res.json({
      success: true,
      data: auction,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createAuction(req: Request, res: Response): Promise<void> {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      images,
      startingPrice,
      reservePrice,
      buyNowPrice,
      bidIncrement,
      city,
      regionId,
      district,
      isBlitz,
      isFeatured,
      durationHours,
      durationDays,
      attributes,
    } = req.body;

    const parsePriceMinor = (val: any): number | undefined => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'object') {
        if (val.minorUnits !== undefined && !isNaN(Number(val.minorUnits))) return Math.round(Number(val.minorUnits));
        if (val.amount !== undefined && !isNaN(Number(val.amount))) return Math.round(Number(val.amount) * 100);
      }
      const num = Number(val);
      return isNaN(num) ? undefined : Math.round(num * 100);
    };

    const startingPriceMinor = parsePriceMinor(startingPrice);
    const reservePriceMinor = parsePriceMinor(reservePrice);
    const buyNowPriceMinor = parsePriceMinor(buyNowPrice);
    const bidIncrementMinor = parsePriceMinor(bidIncrement);

    if (!title || !description || !category || startingPriceMinor === undefined || bidIncrementMinor === undefined || !city || !regionId) {
      res.status(400).json({
        success: false,
        error: 'Бардык милдеттүү талааларды толтуруңуз (title, description, category, startingPrice, bidIncrement, city, regionId required)',
      });
      return;
    }

    const calculatedHours = durationHours ? Number(durationHours) : (durationDays ? Number(durationDays) * 24 : 48);

    const id = `lot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newAuction = createAuctionModel({
      id,
      title,
      description,
      category,
      subCategory,
      images: Array.isArray(images) ? images : [],
      startingPriceMinor,
      reservePriceMinor,
      buyNowPriceMinor,
      bidIncrementMinor,
      sellerId: req.user!.id,
      city,
      regionId,
      district,
      isBlitz: Boolean(isBlitz),
      isFeatured: Boolean(isFeatured),
      durationHours: calculatedHours,
      attributes: attributes || {},
    });

    // Broadcast new auction
    broadcastEvent('auction.created', newAuction);

    res.status(201).json({
      success: true,
      data: newAuction,
      message: 'Аукцион лоту ийгиликтүү жарыяланды (Auction created successfully)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateAuction(req: Request, res: Response): Promise<void> {
  try {
    const updated = updateAuctionModel(req.params.id, req.user!.id, req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Аукцион жаңыртылды (Auction updated)',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteAuction(req: Request, res: Response): Promise<void> {
  try {
    deleteAuctionModel(req.params.id, req.user!.id);
    res.json({
      success: true,
      message: 'Аукцион өчүрүлдү (Auction deleted)',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function placeBid(req: Request, res: Response): Promise<void> {
  try {
    const auctionId = req.params.id;
    const { amount, amount_minor } = req.body;

    let amountMinor: number;
    if (amount_minor !== undefined && amount_minor !== null && amount_minor !== '') {
      amountMinor = Number(amount_minor);
      if (!Number.isFinite(amountMinor) || !Number.isInteger(amountMinor) || amountMinor <= 0) {
        res.status(400).json({ success: false, error: 'Туура коюм суммасын жазыңыз (Valid bid amount required)' });
        return;
      }
    } else if (amount !== undefined && amount !== null && amount !== '') {
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        res.status(400).json({ success: false, error: 'Туура коюм суммасын жазыңыз (Valid bid amount required)' });
        return;
      }
      amountMinor = Math.round(amt * 100);
    } else {
      res.status(400).json({ success: false, error: 'Туура коюм суммасын жазыңыз (Valid bid amount required)' });
      return;
    }
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const result = placeBidAtomic(auctionId, req.user!.id, amountMinor, ipAddress);

    // Broadcast real-time bid event via WebSocket
    broadcastEvent('bid.placed', {
      auctionId,
      bid: result.bid,
      bidSequence: result.bid.sequence,
      auctionState: {
        currentPrice: result.auction.currentPrice,
        bidCount: result.auction.bidCount,
        endsAt: result.auction.endsAt,
      },
      timeExtended: result.timeExtended,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: result.bid,
      auction: result.auction,
      timeExtended: result.timeExtended,
      message: 'Коюмуңуз ийгиликтүү кабыл алынды (Bid placed successfully)',
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
}

export async function getAuctionBids(req: Request, res: Response): Promise<void> {
  try {
    const bids = getBidsByAuctionId(req.params.id);
    res.json({
      success: true,
      data: bids,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function buyNow(req: Request, res: Response): Promise<void> {
  try {
    const result = buyNowAuction(req.params.id, req.user!.id);
    broadcastEvent('auction.status_changed', { auctionId: req.params.id, status: 'ended_sold' });
    res.json({
      success: true,
      data: result.auction,
      paymentId: result.paymentId,
      message: 'Лот ийгиликтүү сатылды — эскроу эсебинде сакталды (Buy Now successful — held in escrow)',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}
