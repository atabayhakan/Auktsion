/**
 * Contract Validators & Schemas for Auktsion v2.0
 */

import { assertContractValid } from './assertions.mjs';

export const Schemas = {
  User: {
    id: 'string',
    email: 'string',
    full_name: 'string',
    role: 'string',
    status: 'string',
    kyc_status: 'string',
    city: 'string?',
    phone: 'string?',
    balance_minor: 'number?'
  },
  Auction: {
    id: 'string',
    title: 'string',
    category: 'string',
    starting_price_minor: 'number',
    current_price_minor: 'number',
    bid_increment_minor: 'number',
    currency: 'string',
    status: 'string',
    seller_id: 'string',
    city: 'string',
    region_id: 'string',
    bid_count: 'number',
    images: 'array'
  },
  Bid: {
    id: 'string',
    auction_id: 'string',
    bidder_id: 'string',
    amount_minor: 'number',
    currency: 'string',
    is_winning: 'boolean',
    is_cancelled: 'boolean',
    sequence_num: 'number',
    created_at: 'string'
  },
  KycRecord: {
    id: 'string',
    user_id: 'string',
    inn: 'string',
    document_type: 'string',
    status: 'string',
    created_at: 'string'
  },
  PayoutMethod: {
    id: 'string',
    user_id: 'string',
    provider: 'string',
    bank_name: 'string',
    account_number: 'string',
    account_holder_name: 'string',
    is_default: 'boolean'
  },
  PayoutRequest: {
    id: 'string',
    user_id: 'string',
    amount_minor: 'number',
    currency: 'string',
    provider: 'string',
    status: 'string',
    created_at: 'string'
  },
  Dispute: {
    id: 'string',
    auction_id: 'string',
    complainant_id: 'string',
    respondent_id: 'string',
    status: 'string',
    created_at: 'string'
  },
  AdminOverview: {
    gmv_minor: 'number',
    commission_revenue_minor: 'number',
    active_auctions: 'number',
    total_users: 'number',
    pending_kyc: 'number',
    pending_payouts: 'number'
  }
};

export function validateUserContract(data, context = 'User') {
  assertContractValid(data, Schemas.User, context);
}

export function validateAuctionContract(data, context = 'Auction') {
  assertContractValid(data, Schemas.Auction, context);
}

export function validateBidContract(data, context = 'Bid') {
  assertContractValid(data, Schemas.Bid, context);
}

export function validateKycContract(data, context = 'KycRecord') {
  assertContractValid(data, Schemas.KycRecord, context);
}

export function validatePayoutMethodContract(data, context = 'PayoutMethod') {
  assertContractValid(data, Schemas.PayoutMethod, context);
}

export function validatePayoutRequestContract(data, context = 'PayoutRequest') {
  assertContractValid(data, Schemas.PayoutRequest, context);
}

export function validateDisputeContract(data, context = 'Dispute') {
  assertContractValid(data, Schemas.Dispute, context);
}

export function validateAdminOverviewContract(data, context = 'AdminOverview') {
  assertContractValid(data, Schemas.AdminOverview, context);
}
