import type { Auction, Money } from '@/types'

function makeMoney(amount: number): Money {
  return {
    amount: String(amount),
    minorUnits: amount * 100,
    currency: 'KGS',
    formatted: `${amount.toLocaleString('ru-RU')} сом`
  }
}

// Generate relative timestamps so that timers are always alive and active
const now = Date.now()
const mins = (m: number) => new Date(now + m * 60 * 1000).toISOString()
const hours = (h: number) => new Date(now + h * 3600 * 1000).toISOString()
const days = (d: number) => new Date(now + d * 86400 * 1000).toISOString()
const pastHours = (h: number) => new Date(now - h * 3600 * 1000).toISOString()

export const mockAuctions: Auction[] = [
  {
    id: 'auc-live-01',
    title: 'Apple iPhone 17 Pro Max 512GB Natural Titanium (IMEI ГКНБ)',
    description: 'Новый, запечатанный с официальной гарантией 1 год. Официально зарегистрирован в базе IMEI ГКНБ Кыргызстана. В комплекте оригинальный кабель Type-C и чехол MagSafe.',
    category: 'electronics',
    subCategory: 'phones',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(35000),
    currentPrice: makeMoney(44500),
    reservePrice: makeMoney(46000),
    buyNowPrice: makeMoney(49000),
    bidIncrement: makeMoney(500),
    bidCount: 29,
    status: 'active',
    sellerId: 'user-kyrgyz-tech',
    seller: {
      id: 'user-kyrgyz-tech',
      fullName: 'Bishkek iStore (Официальный магазин)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      city: 'Бишкек',
      rating: 4.95,
      totalSales: 342
    },
    city: 'Бишкек',
    district: 'Первомайский р-н',
    startAt: pastHours(4),
    endsAt: mins(48), // 48 minutes remaining - HIGH URGENCY
    createdAt: pastHours(4),
    updatedAt: mins(-2),
    views: 489,
    isBlitz: true
  },
  {
    id: 'auc-live-02',
    title: 'Toyota Camry 70 (2021) 2.5L Жемчужно-белый, Растаможен',
    description: 'Идеальное состояние, родной пробег 42 000 км. Полностью растаможен в КР, чистая история, обслуживался строго в Toyota Center Bishkek. Комплектация Prestige Safety.',
    category: 'vehicles',
    subCategory: 'sedans',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(1200000),
    currentPrice: makeMoney(1580000),
    buyNowPrice: makeMoney(1750000),
    bidIncrement: makeMoney(10000),
    bidCount: 41,
    status: 'active',
    sellerId: 'user-auto-bishkek',
    seller: {
      id: 'user-auto-bishkek',
      fullName: 'AutoAsia Kyrgyzstan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      city: 'Бишкек',
      rating: 4.9,
      totalSales: 89
    },
    city: 'Бишкек',
    district: 'Октябрьский р-н',
    startAt: pastHours(12),
    endsAt: hours(3), // 3 hours remaining
    createdAt: pastHours(12),
    updatedAt: mins(-5),
    views: 1240,
    vehicle: {
      year: 2021,
      make: 'Toyota',
      model: 'Camry 70',
      mileage: 42000,
      transmission: 'automatic',
      fuelType: 'petrol',
      steering: 'left',
      isCustomsCleared: true
    }
  },
  {
    id: 'auc-live-03',
    title: 'Двухъярусный Торговый Контейнер на Рынке «Дордой» (Проход 12)',
    description: 'Выгодная локация на центральном проходе рынка Дордой. Первый ярус под активную торговлю одеждой/текстилем, второй ярус — оборудованный сухой склад. Высокая проходимость.',
    category: 'real-estate',
    subCategory: 'commercial',
    images: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(850000),
    currentPrice: makeMoney(1120000),
    buyNowPrice: makeMoney(1300000),
    bidIncrement: makeMoney(10000),
    bidCount: 19,
    status: 'active',
    sellerId: 'user-dordoy-trade',
    seller: {
      id: 'user-dordoy-trade',
      fullName: 'Dordoy Business Center',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      city: 'Бишкек',
      rating: 4.88,
      totalSales: 45
    },
    city: 'Бишкек',
    district: 'Рынок Дордой',
    startAt: pastHours(24),
    endsAt: hours(6),
    createdAt: pastHours(24),
    updatedAt: mins(-15),
    views: 890,
    realEstate: {
      type: 'commercial',
      areaSqm: 32,
      rooms: 2,
      floor: 1,
      totalFloors: 2,
      deedType: 'red_book'
    }
  },
  {
    id: 'auc-live-04',
    title: 'Племенной Баран Породы Арашан (Элитная линия, Вес 142 кг)',
    description: 'Элитный чистокровный баран-производитель Арашан. Рост в холке 89 см, идеальный прикус и постановка ушей. Имеются все племенные сертификаты и ветеринарный паспорт КР.',
    category: 'livestock',
    subCategory: 'sheep',
    images: [
      'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(150000),
    currentPrice: makeMoney(230000),
    buyNowPrice: makeMoney(280000),
    bidIncrement: makeMoney(5000),
    bidCount: 22,
    status: 'active',
    sellerId: 'user-chuy-ferma',
    seller: {
      id: 'user-chuy-ferma',
      fullName: 'Племхоз «Чуй-Арашан»',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      city: 'Чуйская область',
      rating: 4.97,
      totalSales: 112
    },
    city: 'Токмок',
    district: 'Чуйский р-н',
    startAt: pastHours(10),
    endsAt: hours(2),
    createdAt: pastHours(10),
    updatedAt: mins(-8),
    views: 730,
    livestock: {
      breed: 'Арашан',
      weightKg: 142,
      ageMonths: 24,
      vaccinated: true
    }
  },
  {
    id: 'auc-live-05',
    title: 'Apple MacBook Pro 16" M3 Max (36GB RAM / 1TB SSD) Space Black',
    description: 'Флагманский ноутбук в идеальном состоянии. 3 цикла зарядки, полный комплект с коробкой и европейской вилкой. Идеален для видеомонтажа, 3D и разработки.',
    category: 'electronics',
    subCategory: 'laptops',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(180000),
    currentPrice: makeMoney(215000),
    buyNowPrice: makeMoney(235000),
    bidIncrement: makeMoney(2500),
    bidCount: 16,
    status: 'active',
    sellerId: 'user-mac-kg',
    seller: {
      id: 'user-mac-kg',
      fullName: 'MacCenter KG',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      city: 'Бишкек',
      rating: 4.92,
      totalSales: 78
    },
    city: 'Бишкек',
    district: 'Свердловский р-н',
    startAt: pastHours(8),
    endsAt: hours(5),
    createdAt: pastHours(8),
    updatedAt: mins(-30),
    views: 610
  },
  {
    id: 'auc-live-06',
    title: 'Скаковой Жеребец «Ак-Кула» Новокиргизской породы (4 года)',
    description: 'Победитель районных скачек Аламан Улак и Жорго Салыш. Высокий, выносливый, отличный ровный шаг. Подкован, полностью здоров, все ветсправки на руках.',
    category: 'livestock',
    subCategory: 'horses',
    images: [
      'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(350000),
    currentPrice: makeMoney(490000),
    buyNowPrice: makeMoney(550000),
    bidIncrement: makeMoney(10000),
    bidCount: 27,
    status: 'active',
    sellerId: 'user-at-bazar',
    seller: {
      id: 'user-at-bazar',
      fullName: 'Конезавод Ысык-Көл',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
      city: 'Чолпон-Ата',
      rating: 4.96,
      totalSales: 63
    },
    city: 'Чолпон-Ата',
    district: 'Иссык-Кульский р-н',
    startAt: pastHours(16),
    endsAt: hours(8),
    createdAt: pastHours(16),
    updatedAt: mins(-10),
    views: 1120,
    livestock: {
      breed: 'Новокиргизская',
      weightKg: 460,
      ageMonths: 48,
      vaccinated: true
    }
  },
  {
    id: 'auc-live-07',
    title: 'Lexus GX 460 Executive Sport (2019) Черный на Черном',
    description: 'Европеец, максимальная комплектация Executive Sport 7 мест. Пневмоподвеска, круговой обзор 360, премиальная аудиосистема Mark Levinson. Полный сервис Lexus Bishkek.',
    category: 'vehicles',
    subCategory: 'suvs',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(3800000),
    currentPrice: makeMoney(4400000),
    buyNowPrice: makeMoney(4700000),
    bidIncrement: makeMoney(20000),
    bidCount: 35,
    status: 'active',
    sellerId: 'user-lexus-bishkek',
    seller: {
      id: 'user-lexus-bishkek',
      fullName: 'Premium Motors Bishkek',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      city: 'Бишкек',
      rating: 4.98,
      totalSales: 94
    },
    city: 'Бишкек',
    district: 'Ленинский р-н',
    startAt: pastHours(30),
    endsAt: hours(18),
    createdAt: pastHours(30),
    updatedAt: mins(-45),
    views: 2150,
    vehicle: {
      year: 2019,
      make: 'Lexus',
      model: 'GX 460',
      mileage: 68000,
      transmission: 'automatic',
      fuelType: 'petrol',
      steering: 'left',
      isCustomsCleared: true
    }
  },
  {
    id: 'auc-live-08',
    title: 'Sony PlayStation 5 Slim 1TB + 2 геймпада DualSense + FC 25',
    description: 'Новая ревизия Slim с дисководом. Комплект включает 2 оригинальных беспроводных геймпада и предустановленную игру EA Sports FC 25. Чек и гарантия 12 месяцев.',
    category: 'electronics',
    subCategory: 'appliances',
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(38000),
    currentPrice: makeMoney(46000),
    buyNowPrice: makeMoney(51000),
    bidIncrement: makeMoney(500),
    bidCount: 24,
    status: 'active',
    sellerId: 'user-play-bishkek',
    seller: {
      id: 'user-play-bishkek',
      fullName: 'GameZone Bishkek',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
      city: 'Бишкек',
      rating: 4.87,
      totalSales: 154
    },
    city: 'Бишкек',
    district: 'ЦУМ Айчүрөк',
    startAt: pastHours(6),
    endsAt: mins(95),
    createdAt: pastHours(6),
    updatedAt: mins(-12),
    views: 420
  },
  {
    id: 'auc-live-09',
    title: 'Национальный Ювелирный Гарнитур (Золото 585 пробы, Изумруды)',
    description: 'Авторская ручная работа бишкекских ювелирных мастеров. Комплект включает колье, браслет и серьги с натуральными изумрудами. Общий вес 38.6 г, клеймо Пробирной палаты КР.',
    category: 'jewelry',
    subCategory: 'national',
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(190000),
    currentPrice: makeMoney(245000),
    buyNowPrice: makeMoney(270000),
    bidIncrement: makeMoney(2000),
    bidCount: 18,
    status: 'active',
    sellerId: 'user-altin-zerger',
    seller: {
      id: 'user-altin-zerger',
      fullName: 'Алтын Зергер Кыргызстан',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      city: 'Бишкек',
      rating: 4.99,
      totalSales: 210
    },
    city: 'Бишкек',
    district: 'Первомайский р-н',
    startAt: pastHours(14),
    endsAt: hours(4),
    createdAt: pastHours(14),
    updatedAt: mins(-18),
    views: 890
  },
  {
    id: 'auc-live-10',
    title: 'Трактор Беларус МТЗ-82.1 (2022 года выпуска, 340 моточасов)',
    description: 'В отличном техническом состоянии. Установлен новый усиленный балочный мост, турбина, гидроусилитель руля. В комплекте плуг и прицеп. Зарегистрирован в Гостехнадзоре Чуйской обл.',
    category: 'machinery',
    subCategory: 'tractors',
    images: [
      'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(950000),
    currentPrice: makeMoney(1220000),
    buyNowPrice: makeMoney(1350000),
    bidIncrement: makeMoney(10000),
    bidCount: 15,
    status: 'active',
    sellerId: 'user-selhoz-sokuluk',
    seller: {
      id: 'user-selhoz-sokuluk',
      fullName: 'Сокулук Агросервис',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      city: 'Сокулук',
      rating: 4.91,
      totalSales: 38
    },
    city: 'Сокулук',
    district: 'Чуйская область',
    startAt: pastHours(20),
    endsAt: hours(7),
    createdAt: pastHours(20),
    updatedAt: mins(-40),
    views: 670
  },
  {
    id: 'auc-live-11',
    title: 'Аутентичный Кыргызский Шырдак из Натурального Войлока (2.8 × 1.6 м)',
    description: 'Шедевр нематериального наследия ЮНЕСКО. Изготовлен вручную мастерицами Нарынской области из чистой овечьей шерсти с использованием натуральных красителей. Традиционные узоры «мүйүз».',
    category: 'art',
    subCategory: 'shyrdak',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(22000),
    currentPrice: makeMoney(34000),
    buyNowPrice: makeMoney(42000),
    bidIncrement: makeMoney(1000),
    bidCount: 14,
    status: 'active',
    sellerId: 'user-naryn-craft',
    seller: {
      id: 'user-naryn-craft',
      fullName: 'Нарын Кол Өнөрчүлөрү',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      city: 'Нарын',
      rating: 4.96,
      totalSales: 82
    },
    city: 'Нарын',
    district: 'Нарынский р-н',
    startAt: pastHours(15),
    endsAt: hours(9),
    createdAt: pastHours(15),
    updatedAt: mins(-25),
    views: 540
  },
  {
    id: 'auc-live-12',
    title: 'Коттедж 140 м² в Клубном Городке на Иссык-Куле (Бостери, Royal Beach)',
    description: 'Круглогодичный коттедж с евроремонтом на первой береговой линии озера Иссык-Куль. Закрытая охраняемая территория, терраса с видом на воду, центральное отопление и Красная книга.',
    category: 'real-estate',
    subCategory: 'houses',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
    ],
    startingPrice: makeMoney(6500000),
    currentPrice: makeMoney(7800000),
    buyNowPrice: makeMoney(8400000),
    bidIncrement: makeMoney(50000),
    bidCount: 21,
    status: 'active',
    sellerId: 'user-issyk-estate',
    seller: {
      id: 'user-issyk-estate',
      fullName: 'Issyk-Kul Real Estate Group',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
      city: 'Бостери',
      rating: 4.94,
      totalSales: 31
    },
    city: 'Бостери',
    district: 'Иссык-Куль',
    startAt: pastHours(48),
    endsAt: days(2),
    createdAt: pastHours(48),
    updatedAt: mins(-50),
    views: 1840,
    realEstate: {
      type: 'residential',
      areaSqm: 140,
      rooms: 4,
      floor: 1,
      totalFloors: 2,
      deedType: 'red_book'
    }
  }
]
