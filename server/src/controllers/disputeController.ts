import { Request, Response } from 'express';
import { createDispute, getDisputes } from '../models/disputeModel.js';
import { getDatabase } from '../config/database.js';

export async function createDisputeHandler(req: Request, res: Response): Promise<void> {
  try {
    const complainantId = req.user!.id;
    const auctionId = req.params.id || req.body.auctionId;
    const { reason, reasonCategory, details, role, respondentId } = req.body;

    if (!auctionId) {
      res.status(400).json({ success: false, error: 'Илан ID (auctionId) көрсөтүлүшү керек' });
      return;
    }

    const db = getDatabase();
    const auction = db.prepare('SELECT id, title, seller_id, winner_id FROM auctions WHERE id = ?').get(auctionId) as any;
    if (!auction) {
      res.status(404).json({ success: false, error: 'Илан табылган жок (Auction not found)' });
      return;
    }

    // Determine clean reason text
    const categoryTag = reasonCategory ? `[${reasonCategory}] ` : '';
    const mainText = details?.trim() || reason?.trim() || 'Арыз / Талаш билдирүүсү';
    const finalReason = `${categoryTag}${mainText}`;

    // Determine target respondent
    let targetRespondentId = respondentId;
    if (!targetRespondentId) {
      if (complainantId === auction.seller_id) {
        // Seller is complaining about the winning buyer or highest bidder
        targetRespondentId = auction.winner_id;
        if (!targetRespondentId) {
          const topBidder = db.prepare('SELECT bidder_id FROM bids WHERE auction_id = ? ORDER BY amount_minor DESC LIMIT 1').get(auctionId) as any;
          targetRespondentId = topBidder?.bidder_id;
        }
      } else {
        // Buyer or bidder is complaining about the seller
        targetRespondentId = auction.seller_id;
      }
    }

    const dispute = createDispute({
      auctionId,
      complainantId,
      respondentId: targetRespondentId,
      reason: finalReason,
    });

    res.status(201).json({
      success: true,
      data: dispute,
      message: 'Шикаят / талаш-тартыш ийгиликтүү кабыл алынды жана модераторлорго жөнөтүлдү',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUserDisputesHandler(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const disputes = getDisputes(status ? String(status) : undefined, req.user!.id);
    res.json({
      success: true,
      data: disputes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
