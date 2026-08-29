import rateLimit from 'express-rate-limit';

const jsonMessage = (ky: string, ru: string) => ({
  success: false,
  error: `${ky} (${ru})`,
});

// Brute-force protection for credential endpoints: 20 attempts / 15 min / IP.
// Tighter than the global limiter on purpose — login/register are the highest-
// value targets and a real user rarely needs more than a handful of tries.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    'Өтө көп аракет. Кийинраак кайра аракет кылыңыз',
    'Too many attempts, please try again later'
  ),
});

// Bidding: 30 bids / minute / IP — comfortably above a fast human bidder but
// caps scripted hammering of the atomic transaction path.
export const bidLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    'Коюм чектен ашты. Бир аз токтотулуңуз',
    'Bid rate limit exceeded, slow down'
  ),
});

// General API budget: 300 requests / minute / IP.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    'Суроо-талап чеги ашылды',
    'API rate limit exceeded'
  ),
});
