// src/data/mockAdminData.ts
// Comprehensive Standalone Mock Data for the iTorgo Admin Panel

import type {
  AdminUserDetail,
  AdminListing,
  AdminDispute,
  AdminKycApplication,
  AdminPayoutRequest,
  AdminTreasuryOverview,
  AdminLiveAuctionState,
  AdminLiveBidEvent,
  AdminKPIStats,
  AdminAnalyticsData,
  AdminMediaItem
} from '@/types/admin'

import type { Money } from '@/types/domain'

export const formatMoney = (amount: number): Money => {
  return {
    amount: amount.toString(),
    minorUnits: amount * 100,
    currency: 'KGS',
    formatted: `${amount.toLocaleString('ru-RU')} сом`
  }
}

export const mockKPIStats: AdminKPIStats = {
  totalGmv: formatMoney(42850000), // 42.85M KGS
  platformRevenue: formatMoney(3428000), // 8% fee = ~3.42M KGS
  activeAuctionsCount: 148,
  totalUsersCount: 12450,
  pendingKycCount: 14,
  openDisputesCount: 5,
  pendingPayoutsCount: 9
}

export const mockAdminUsers: AdminUserDetail[] = [
  {
    id: 'user-001',
    username: 'ulan_asanov',
    fullName: 'Улан Асанов',
    email: 'ulan@itorgo.kg',
    phone: '+996 700 123456',
    inn: '20101198501234',
    role: 'admin',
    status: 'active',
    kycStatus: 'verified',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    city: 'Бишкек',
    district: 'Чүй проспекти',
    balance: formatMoney(450000),
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2026-08-15T14:20:00Z',
    activeListingsCount: 3,
    activeBidsCount: 5,
    kycDocuments: {
      idFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      selfie: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
      proofOfAddress: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80'
    },
    payoutMethods: [],
    recentBids: [
      { id: 'bid-001', auctionId: 'lot-101', auctionTitle: 'Аргымак (Англис тукуму, 3 жашар)', amount: formatMoney(320000), status: 'winning', placedAt: '2026-08-18T12:00:00Z' }
    ],
    recentListings: [
      { id: 'lot-105', title: 'Toyota Camry 70 (2021, Бажы төлөнгөн)', currentPrice: formatMoney(2150000), status: 'active', endsAt: '2026-08-20T18:00:00Z' }
    ]
  },
  {
    id: 'user-002',
    username: 'bakyt_t',
    fullName: 'Бакыт Токтосунов',
    email: 'bakyt@optima.kg',
    phone: '+996 772 987654',
    inn: '11504199000876',
    role: 'seller',
    status: 'active',
    kycStatus: 'verified',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    city: 'Ош',
    district: 'Курманжан Датка көчөсү',
    balance: formatMoney(780000),
    createdAt: '2024-03-20T08:30:00Z',
    updatedAt: '2026-08-16T09:10:00Z',
    activeListingsCount: 6,
    activeBidsCount: 2,
    kycDocuments: {
      idFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      selfie: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=600&q=80'
    },
    payoutMethods: [],
    recentBids: [],
    recentListings: [
      { id: 'lot-102', title: 'Гиссар породасындагы 10 баш кочкор', currentPrice: formatMoney(480000), status: 'active', endsAt: '2026-08-19T14:00:00Z' }
    ]
  },
  {
    id: 'user-003',
    username: 'aiperi_zh',
    fullName: 'Айпери Жумабекова',
    email: 'aiperi.zh@gmail.com',
    phone: '+996 555 456789',
    inn: '20807199500321',
    role: 'buyer',
    status: 'active',
    kycStatus: 'verified',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    city: 'Бишкек',
    district: '7-кичи район',
    balance: formatMoney(15000),
    createdAt: '2024-05-10T12:15:00Z',
    updatedAt: '2024-05-10T12:15:00Z',
    activeListingsCount: 0,
    activeBidsCount: 4,
    kycDocuments: {
      idFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      selfie: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80'
    },
    payoutMethods: [],
    recentBids: [],
    recentListings: []
  },
  {
    id: 'user-004',
    username: 'kanat_erkinov',
    fullName: 'Канат Эркинов',
    email: 'kanat.kgz@mail.ru',
    phone: '+996 708 777111',
    inn: '12912198801999',
    role: 'seller',
    status: 'suspended',
    kycStatus: 'verified',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    city: 'Токмок',
    district: 'Сарбагыш көчөсү',
    balance: formatMoney(0),
    banReason: 'Жалган ставка коюу жана бүтпөгөн жеткирүү (Dispute #DSP-2026-087)',
    createdAt: '2024-06-01T15:00:00Z',
    updatedAt: '2026-08-16T15:30:00Z',
    activeListingsCount: 0,
    activeBidsCount: 0,
    kycDocuments: {
      idFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      selfie: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
    },
    payoutMethods: [],
    recentBids: [],
    recentListings: []
  },
  {
    id: 'user-005',
    username: 'temir_dordoy',
    fullName: 'Темирлан Байзаков',
    email: 'temir@dordoy.biz',
    phone: '+996 702 334455',
    inn: '10305199200444',
    role: 'seller',
    status: 'active',
    kycStatus: 'verified',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    city: 'Бишкек',
    district: 'Дордой базары',
    balance: formatMoney(590000),
    createdAt: '2024-02-18T09:00:00Z',
    updatedAt: '2026-08-18T05:00:00Z',
    activeListingsCount: 8,
    activeBidsCount: 1,
    kycDocuments: {
      idFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      selfie: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
    },
    payoutMethods: [],
    recentBids: [],
    recentListings: []
  },
  {
    id: 'user-006',
    username: 'nurbek_s',
    fullName: 'Нурбек Султанов',
    email: 'nurbek.s@jalal-abad.kg',
    phone: '+996 770 654321',
    inn: '11209198700555',
    role: 'buyer',
    status: 'active',
    kycStatus: 'pending',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    city: 'Жалал-Абад',
    district: 'Ленин көчөсү',
    balance: formatMoney(0),
    createdAt: '2026-08-10T14:00:00Z',
    updatedAt: '2026-08-10T14:00:00Z',
    activeListingsCount: 0,
    activeBidsCount: 2,
    kycDocuments: {
      idFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      selfie: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80'
    },
    payoutMethods: [],
    recentBids: [],
    recentListings: []
  },
  {
    id: 'user-007',
    username: 'almaz_bot',
    fullName: 'Алмаз Касымов (Bot Suspect)',
    email: 'almaz.bot@proxy.kg',
    phone: '+996 999 888777',
    inn: '10101199999999',
    role: 'buyer',
    status: 'banned',
    kycStatus: 'rejected',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    city: 'Бишкек',
    district: null,
    balance: formatMoney(0),
    banReason: 'Автоматташтырылган спам ставкалар жана жасалма INN',
    createdAt: '2026-08-16T22:00:00Z',
    updatedAt: '2026-08-17T03:00:00Z',
    activeListingsCount: 0,
    activeBidsCount: 0,
    kycDocuments: {
      idFront: '',
      selfie: ''
    },
    payoutMethods: [],
    recentBids: [],
    recentListings: []
  }
]

export const mockAdminListings: AdminListing[] = []

export const mockAdminDisputes: AdminDispute[] = [
  {
    id: 'disp-501',
    auctionId: 'lot-105',
    auctionTitle: 'Швейцариялык кол сааты Rolex Submariner',
    complainantId: 'user-003',
    complainantName: 'Айпери Жумабекова',
    respondentId: 'user-004',
    respondentName: 'Канат Эркинов',
    reason: 'Сатуучу оригинал деп саткан, бирок расмий зергердик борборго экспертизага бергенде сааттын механизми реплика экени аныкталды. Экспертиза актын тиркедим.',
    status: 'under_review',
    refundAmount: formatMoney(0),
    createdAt: '2026-08-17T10:45:00Z',
    updatedAt: '2026-08-17T16:00:00Z'
  },
  {
    id: 'disp-502',
    auctionId: 'lot-108',
    auctionTitle: 'Sony PlayStation 5 Pro (1TB, 2 геймпад)',
    complainantId: 'user-006',
    complainantName: 'Нурбек Султанов',
    respondentId: 'user-005',
    respondentName: 'Темирлан Байзаков',
    reason: 'Почта аркылуу келген кутуча эзилип, ичиндеги приставканын корпусу сынып калган.',
    status: 'open',
    refundAmount: formatMoney(0),
    createdAt: '2026-08-18T09:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z'
  }
]

export const mockAdminKyc: AdminKycApplication[] = [
  {
    id: 'kyc-301',
    userId: 'user-006',
    userName: 'Нурбек Султанов',
    userEmail: 'nurbek.s@jalal-abad.kg',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    userCity: 'Жалал-Абад',
    userPhone: '+996 770 654321',
    inn: '11209198700555',
    idFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
    proofOfAddressUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    amlStatus: 'clean',
    sanctionsStatus: 'clean',
    pepStatus: 'none',
    duplicateInnAccounts: [],
    status: 'pending',
    createdAt: '2026-08-18T10:15:00Z'
  },
  {
    id: 'kyc-302',
    userId: 'user-008',
    userName: 'Гүлзада Мамытова',
    userEmail: 'gulzada.m@gmail.com',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    userCity: 'Каракол / Ысык-Көл',
    userPhone: '+996 703 112233',
    inn: '21503199400888',
    idFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    idBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    amlStatus: 'clean',
    sanctionsStatus: 'clean',
    pepStatus: 'none',
    duplicateInnAccounts: [],
    status: 'pending',
    createdAt: '2026-08-18T11:40:00Z'
  },
  {
    id: 'kyc-303',
    userId: 'user-009',
    userName: 'Рустам Исмаилов (Duplicate INN Alert)',
    userEmail: 'rustam.ismailov@mail.ru',
    userCity: 'Ош',
    userPhone: '+996 550 998877',
    inn: '11504199000876', // Same INN as user-002 (Bakyt)
    idFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    amlStatus: 'review',
    sanctionsStatus: 'clean',
    pepStatus: 'none',
    duplicateInnAccounts: ['user-002'],
    status: 'pending',
    createdAt: '2026-08-18T13:00:00Z'
  }
]

export const mockAdminPayouts: AdminPayoutRequest[] = [
  {
    id: 'pyt-801',
    userId: 'user-002',
    userName: 'Бакыт Токтосунов',
    inn: '11504199000876',
    amount: formatMoney(450000),
    bankCode: 'mbank',
    bankName: 'MBank (КБ Кыргызстан)',
    accountNumber: '996772987654',
    accountHolderName: 'Бакыт Токтосунов',
    status: 'pending',
    requestedAt: '2026-08-18T13:45:00Z'
  },
  {
    id: 'pyt-802',
    userId: 'user-005',
    userName: 'Темирлан Байзаков',
    inn: '10305199200444',
    amount: formatMoney(590000),
    bankCode: 'optima',
    bankName: 'Оптима Банк',
    accountNumber: '1091800012345678',
    accountHolderName: 'Темирлан Байзаков',
    status: 'pending',
    requestedAt: '2026-08-18T14:10:00Z'
  },
  {
    id: 'pyt-803',
    userId: 'user-001',
    userName: 'Улан Асанов',
    inn: '20101198501234',
    amount: formatMoney(250000),
    bankCode: 'demirbank',
    bankName: 'Демир Кыргыз Интернэшнл Банк',
    accountNumber: '1180000098765432',
    accountHolderName: 'Улан Асанов',
    status: 'completed',
    adminNotes: 'DB-TRANSFER-992144',
    processedBy: 'admin',
    processedAt: '2026-08-18T10:00:00Z',
    requestedAt: '2026-08-17T16:00:00Z'
  }
]

export const mockTreasury: AdminTreasuryOverview = {
  gmv: formatMoney(42850000),
  commissionRevenue: formatMoney(3428000),
  pendingPayouts: {
    count: 2,
    amount: '1040000.00',
    formatted: '1,040,000 сом'
  }
}

export const mockLiveAuctions: AdminLiveAuctionState[] = [
  {
    id: 'lot-101',
    title: 'Аргымак (Англис тукуму, 3 жашар)',
    category: 'livestock',
    images: ['https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80'],
    currentPrice: formatMoney(320000),
    startingPrice: formatMoney(250000),
    bidCount: 14,
    endsAt: new Date(Date.now() + 1000 * 2700).toISOString(),
    isBlitz: false,
    city: 'Ош / Кара-Суу'
  },
  {
    id: 'lot-103',
    title: 'Toyota Land Cruiser 300 (2023, GR-Sport)',
    category: 'vehicles',
    images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80'],
    currentPrice: formatMoney(9200000),
    startingPrice: formatMoney(8500000),
    bidCount: 16,
    endsAt: new Date(Date.now() + 1000 * 720).toISOString(),
    isBlitz: true,
    city: 'Бишкек'
  },
  {
    id: 'lot-105',
    title: 'Rolex Submariner Watch',
    category: 'jewelry',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'],
    currentPrice: formatMoney(1250000),
    startingPrice: formatMoney(1100000),
    bidCount: 6,
    endsAt: new Date(Date.now() + 1000 * 15400).toISOString(),
    isBlitz: false,
    city: 'Бишкек'
  }
]

export const mockLiveBids: AdminLiveBidEvent[] = [
  {
    id: 'lb-1',
    auctionId: 'lot-103',
    auctionTitle: 'Toyota Land Cruiser 300',
    bidderId: 'user-001',
    bidderName: 'Улан Асанов',
    bidderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    amount: formatMoney(9200000),
    status: 'winning',
    placedAt: new Date().toISOString()
  },
  {
    id: 'lb-2',
    auctionId: 'lot-101',
    auctionTitle: 'Аргымак (Англис тукуму)',
    bidderId: 'user-003',
    bidderName: 'Айпери Жумабекова',
    bidderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    amount: formatMoney(320000),
    status: 'winning',
    placedAt: new Date(Date.now() - 1000 * 45).toISOString()
  },
  {
    id: 'lb-3',
    auctionId: 'lot-105',
    auctionTitle: 'Rolex Submariner Watch',
    bidderId: 'user-007',
    bidderName: 'Алмаз Касымов',
    amount: formatMoney(1250000),
    status: 'winning',
    placedAt: new Date(Date.now() - 1000 * 120).toISOString()
  },
  {
    id: 'lb-4',
    auctionId: 'lot-102',
    auctionTitle: 'Гиссар 10 баш кочкор',
    bidderId: 'user-002',
    bidderName: 'Бакыт Токтосунов',
    bidderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    amount: formatMoney(480000),
    status: 'winning',
    placedAt: new Date(Date.now() - 1000 * 240).toISOString()
  }
]

export const mockAnalyticsData: AdminAnalyticsData = {
  timeframe: '30d',
  gmvTimeSeries: [
    { date: '08/01', gmv: 850000, revenue: 68000, bidsCount: 140 },
    { date: '08/03', gmv: 1200000, revenue: 96000, bidsCount: 210 },
    { date: '08/05', gmv: 980000, revenue: 78400, bidsCount: 185 },
    { date: '08/07', gmv: 1650000, revenue: 132000, bidsCount: 310 },
    { date: '08/09', gmv: 2100000, revenue: 168000, bidsCount: 420 },
    { date: '08/11', gmv: 1850000, revenue: 148000, bidsCount: 380 },
    { date: '08/13', gmv: 2900000, revenue: 232000, bidsCount: 510 },
    { date: '08/15', gmv: 3400000, revenue: 272000, bidsCount: 620 },
    { date: '08/17', gmv: 4200000, revenue: 336000, bidsCount: 780 },
    { date: '08/18', gmv: 4850000, revenue: 388000, bidsCount: 890 }
  ],
  categoryBreakdown: [
    { category: 'livestock', nameKg: 'Мал чарбасы (Жылкы, Кой, Уй)', gmv: 16500000, lotCount: 68, percentage: 38.5, color: '#10B981' },
    { category: 'vehicles', nameKg: 'Автоунаалар жана техника', gmv: 14200000, lotCount: 32, percentage: 33.1, color: '#3B82F6' },
    { category: 'real_estate', nameKg: 'Кыймылсыз мүлк (Дордой ж.б.)', gmv: 7800000, lotCount: 14, percentage: 18.2, color: '#F59E0B' },
    { category: 'electronics', nameKg: 'Электроника жана гаджеттер', gmv: 2850000, lotCount: 24, percentage: 6.7, color: '#8B5CF6' },
    { category: 'jewelry', nameKg: 'Зер буюмдар жана антиквариат', gmv: 1500000, lotCount: 10, percentage: 3.5, color: '#EC4899' }
  ],
  kycConversionFunnel: [
    { stage: 'registered', labelKg: 'Катталгандар', usersCount: 12450, conversionRate: 100 },
    { stage: 'phone_verified', labelKg: 'Телефон тастыктагандар', usersCount: 10210, conversionRate: 82.0 },
    { stage: 'id_uploaded', labelKg: 'Паспорт жүктөгөндөр', usersCount: 7970, conversionRate: 64.0 },
    { stage: 'verified', labelKg: 'Толук тастыкталгандар', usersCount: 7220, conversionRate: 58.0 },
    { stage: 'first_bid', labelKg: 'Биринчи ставка койгондор', usersCount: 5480, conversionRate: 44.0 }
  ],
  gatewayMarketShare: [
    { gateway: 'mbank', name: 'MBank (КБ Кыргызстан)', volumeKgs: 23567000, sharePct: 55.0, txCount: 1420, color: '#0052CC' },
    { gateway: 'optima', name: 'Оптима Банк (Visa/Mastercard)', volumeKgs: 11998000, sharePct: 28.0, txCount: 680, color: '#E60012' },
    { gateway: 'demirbank', name: 'DemirBank (IBAN/Card)', volumeKgs: 5142000, sharePct: 12.0, txCount: 310, color: '#00A651' },
    { gateway: 'elqr', name: 'ELQR Улуттук системасы', volumeKgs: 2143000, sharePct: 5.0, txCount: 220, color: '#1F2937' }
  ],
  regionalMetrics: [
    { region: 'bishkek', nameKg: 'Бишкек шаары', gmv: 18200000, activeLots: 58, userCount: 5600, sharePct: 42.5 },
    { region: 'osh', nameKg: 'Ош облусу жана Ош ш.', gmv: 11400000, activeLots: 36, userCount: 3100, sharePct: 26.6 },
    { region: 'chuy', nameKg: 'Чүй облусу', gmv: 6200000, activeLots: 24, userCount: 1750, sharePct: 14.5 },
    { region: 'issyk_kul', nameKg: 'Ысык-Көл облусу', gmv: 3400000, activeLots: 14, userCount: 890, sharePct: 7.9 },
    { region: 'jalal_abad', nameKg: 'Жалал-Абад облусу', gmv: 2450000, activeLots: 10, userCount: 710, sharePct: 5.7 },
    { region: 'naryn', nameKg: 'Нарын облусу', gmv: 750000, activeLots: 4, userCount: 240, sharePct: 1.8 },
    { region: 'talas_batken', nameKg: 'Талас жана Баткен облустары', gmv: 450000, activeLots: 2, userCount: 160, sharePct: 1.0 }
  ],
  hourlyBiddingDistribution: [
    { hour: 0, label: '00:00', bidsCount: 45, volume: 180000 },
    { hour: 2, label: '02:00', bidsCount: 15, volume: 45000 },
    { hour: 4, label: '04:00', bidsCount: 8, volume: 20000 },
    { hour: 6, label: '06:00', bidsCount: 25, volume: 90000 },
    { hour: 8, label: '08:00', bidsCount: 110, volume: 450000 },
    { hour: 10, label: '10:00', bidsCount: 280, volume: 1200000 },
    { hour: 12, label: '12:00', bidsCount: 390, volume: 1650000 },
    { hour: 14, label: '14:00', bidsCount: 420, volume: 1800000 },
    { hour: 16, label: '16:00', bidsCount: 510, volume: 2400000 },
    { hour: 18, label: '18:00', bidsCount: 780, volume: 3800000 },
    { hour: 20, label: '20:00', bidsCount: 1150, volume: 6200000 }, // Prime Bishkek bidding peak
    { hour: 22, label: '22:00', bidsCount: 840, volume: 4100000 }
  ]
}

export const mockAdminMedia: AdminMediaItem[] = [
  { id: 'auction-1-0', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', source: 'auction', title: 'Apple MacBook Pro 16" M3 Max', ownerId: 'u1', ownerLabel: 'Улан Асанов', createdAt: '2026-08-20T09:12:00Z' },
  { id: 'auction-2-0', url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80', source: 'auction', title: 'Toyota Camry 70 (2020)', ownerId: 'u2', ownerLabel: 'Айбек Жумабеков', createdAt: '2026-08-19T14:40:00Z' },
  { id: 'auction-3-0', url: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80', source: 'auction', title: 'Ала-Тоо тукумундагы саан уй', ownerId: 'u3', ownerLabel: 'Гүлнара Осмонова', createdAt: '2026-08-19T08:05:00Z' },
  { id: 'avatar-u1', url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80', source: 'avatar', title: 'Улан Асанов', ownerId: 'u1', ownerLabel: 'Улан Асанов', createdAt: '2026-08-15T10:00:00Z' },
]
