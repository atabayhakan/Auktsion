// Test to verify composable and formatter contract mismatches
import { useFormatters } from '../frontend/src/composables/useFormatters.ts';

console.log('Testing useFormatters contract...');
try {
  const formatters = useFormatters();
  console.log('useFormatters keys:', Object.keys(formatters));
  console.log('status object keys:', Object.keys(formatters.status));

  console.log('\nTesting BidRow call: formatters.status.bid("active")');
  try {
    const res = (formatters.status as any).bid('active');
    console.log('Success:', res);
  } catch (e: any) {
    console.error('CRASH in BidRow:', e.message);
  }

  console.log('\nTesting ListingRow call: formatters.status.auction("active")');
  try {
    const res = (formatters.status as any).auction('active');
    console.log('Success:', res);
  } catch (e: any) {
    console.error('CRASH in ListingRow:', e.message);
  }

  console.log('\nTesting PayoutRow call: formatters.status.payout("completed")');
  try {
    const res = (formatters.status as any).payout('completed');
    console.log('Success:', res);
  } catch (e: any) {
    console.error('CRASH in PayoutRow:', e.message);
  }

  console.log('\nTesting DashboardPage call: formatters.status.kyc("verified")');
  try {
    const res = (formatters.status as any).kyc('verified');
    console.log('Success:', res);
  } catch (e: any) {
    console.error('CRASH in DashboardPage:', e.message);
  }
} catch (err) {
  console.error('Top-level crash:', err);
}
