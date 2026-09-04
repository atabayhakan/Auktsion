// src/data/categories.ts

export interface CategoryItem {
  id: string
  slug: string
  name: {
    ky: string
    ru: string
    tr: string
  }
  description: {
    ky: string
    ru: string
    tr: string
  }
  icon: string
  iconName: string
  coverImage: string
  count: string
  popularTags: {
    ky: string[]
    ru: string[]
    tr: string[]
  }
  subCategories: Array<{
    id: string
    slug: string
    name: {
      ky: string
      ru: string
      tr: string
    }
  }>
}

export const platformCategories: CategoryItem[] = [
  {
    id: 'electronics',
    slug: 'electronics',
    name: {
      ky: 'Электроника жана Гаджеттер',
      ru: 'Электроника и Гаджеты',
      tr: 'Elektronik ve Cihazlar'
    },
    description: {
      ky: 'Смартфондор, ноутбуктар, тиричилик техникасы жана аудио аппаратура',
      ru: 'Смартфоны, ноутбуки, бытовая техника и ТВ',
      tr: 'Akıllı telefonlar, dizüstü bilgisayarlar ve elektronik eşyalar'
    },
    icon: 'Smartphone',
    iconName: 'Smartphone',
    coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85',
    count: '4.8k',
    popularTags: {
      ky: ['iPhone 17', 'MacBook Pro', 'IMEI катталган', 'Samsung S24', 'Sony PlayStation'],
      ru: ['iPhone 17', 'MacBook Pro', 'IMEI зарегистрирован', 'Samsung S24', 'Sony PlayStation'],
      tr: ['iPhone 17', 'MacBook Pro', 'IMEI Kayıtlı', 'Samsung S24', 'Sony PlayStation']
    },
    subCategories: [
      { id: 'phones', slug: 'phones', name: { ky: 'Смартфондор жана Планшеттер', ru: 'Смартфоны и Планшеты', tr: 'Telefon ve Tablet' } },
      { id: 'laptops', slug: 'laptops', name: { ky: 'Ноутбуктар жана Компьютерлер', ru: 'Ноутбуки и ПК', tr: 'Bilgisayar ve Donanım' } },
      { id: 'appliances', slug: 'appliances', name: { ky: 'Тиричилик техникасы', ru: 'Бытовая техника', tr: 'Ev Aletleri ve TV' } },
    ]
  },
  {
    id: 'vehicles',
    slug: 'vehicles',
    name: {
      ky: 'Автоунаалар жана Транспорт',
      ru: 'Автомобили и Транспорт',
      tr: 'Otomotiv ve Araçlar'
    },
    description: {
      ky: 'Жеңил автолор, жолтандабастар, коммерциялык унаалар жана мототехника',
      ru: 'Легковые авто, внедорожники, коммерческий транспорт и мотоциклы',
      tr: 'Binek araçlar, SUV, ticari araçlar ve motosikletler'
    },
    icon: 'Car',
    iconName: 'Car',
    coverImage: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=85',
    count: '5.2k',
    popularTags: {
      ky: ['Toyota Camry', 'Lexus GX', 'Оң руль', 'Бажы төлөнгөн', 'Электромобиль'],
      ru: ['Toyota Camry', 'Lexus GX', 'Правый руль', 'Растаможен', 'Электромобиль'],
      tr: ['Toyota Camry', 'Lexus GX', 'Sağ Direksiyon', 'Gümrük Ödendi', 'Elektrikli Araç']
    },
    subCategories: [
      { id: 'sedans', slug: 'sedans', name: { ky: 'Седандар жана Хэтчбектер', ru: 'Седаны и Хэтчбеки', tr: 'Sedan ve Hatchback' } },
      { id: 'suvs', slug: 'suvs', name: { ky: 'Жолтандабастар жана Кроссоверлер', ru: 'Внедорожники и Кроссоверы', tr: 'SUV ve Crossover' } },
      { id: 'commercial_transport', slug: 'commercial_transport', name: { ky: 'Микроавтобустар жана Жүк ташуучулар', ru: 'Бусы и Грузовики', tr: 'Ticari ve Kamyonet' } },
      { id: 'moto', slug: 'moto', name: { ky: 'Мотоциклдер жана Скутерлер', ru: 'Мотоциклы и Скутеры', tr: 'Motosiklet ve ATV' } },
    ]
  },
  {
    id: 'real-estate',
    slug: 'real-estate',
    name: {
      ky: 'Кыймылсыз мүлк & Соода түйүндөрү (Дордой)',
      ru: 'Недвижимость и Торговые точки (Дордой)',
      tr: 'Emlak & Ticari Dükkanlar (Dordoy)'
    },
    description: {
      ky: 'Дордой/Кара-Суу контейнерлери, батирлер, жер тилкелери жана коттедждер',
      ru: 'Контейнеры на Дордое, квартиры, участки и коттеджи на Иссык-Куле',
      tr: 'Dordoy konteynerleri, daireler, arsalar ve İssık-Göl yazlıkları'
    },
    icon: 'Building2',
    iconName: 'Building2',
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85',
    count: '1.8k',
    popularTags: {
      ky: ['Дордой', 'Кызыл китеп', 'Жаңы конуш', 'Ысык-Көл коттедж', 'Элитка'],
      ru: ['Дордой', 'Красная книга', 'Новостройка', 'Иссык-Куль коттедж', 'Элитка'],
      tr: ['Dordoy Pazarı', 'Kırmızı Tapu', 'Yeni Konut', 'İssık-Göl Yazlık', 'Lüks Rezidans']
    },
    subCategories: [
      { id: 'commercial', slug: 'commercial', name: { ky: 'Дордой/Орто-Сай соода түйүндөрү', ru: 'Торговые точки и Контейнеры', tr: 'Pazar Konteyner ve Dükkan' } },
      { id: 'apartments', slug: 'apartments', name: { ky: 'Батирлер (Элитка жана Эски)', ru: 'Квартиры (Новостройки и Вторичка)', tr: 'Daireler ve Rezidanslar' } },
      { id: 'houses', slug: 'houses', name: { ky: 'Жеке үйлөр жана Коттедждер', ru: 'Дома и Коттеджи', tr: 'Müstakil Ev ve Villalar' } },
      { id: 'lands', slug: 'lands', name: { ky: 'Жер тилкелери жана Фермалар', ru: 'Земельные участки и Фермы', tr: 'Arsa ve Tarım Arazileri' } },
    ]
  },
  {
    id: 'livestock',
    slug: 'livestock',
    name: {
      ky: 'Мал чарбасы & Айыл чарба (Мал базары)',
      ru: 'Скотный рынок и Сельское хозяйство',
      tr: 'Hayvancılık & Köy Mal Pazarı'
    },
    description: {
      ky: 'Саан уйлар, асыл тукум букалар, күлүк жылкылар, Арашан/Гиссар кочкорлору жана тоют чөптөр',
      ru: 'Дойные коровы, племенные быки, скаковые лошади, породистые бараны и корма',
      tr: 'Sağmal inekler, damızlık boğalar, atlar, koçlar, yem ve köy ürünleri'
    },
    icon: 'Wheat',
    iconName: 'Wheat',
    coverImage: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=85',
    count: '3.4k',
    popularTags: {
      ky: ['Саан уй', 'Күлүк жылкы', 'Арашан кочкор', 'Бука', 'Тоют чөп'],
      ru: ['Дойная корова', 'Скаковая лошадь', 'Арашан баран', 'Племенной бык', 'Сено и корма'],
      tr: ['Sağmal İnek', 'Yarış Atı', 'Araşan Koç', 'Damızlık Boğa', 'Yem ve Saman']
    },
    subCategories: [
      { id: 'cows', slug: 'cows', name: { ky: 'Саан уйлар жана Букалар', ru: 'Коровы и Быки', tr: 'İnek ve Damızlık Boğalar' } },
      { id: 'horses', slug: 'horses', name: { ky: 'Күлүк жылкылар жана Тайлар', ru: 'Лошади и Жеребята', tr: 'Atlar ve Yarış Tayları' } },
      { id: 'sheep', slug: 'sheep', name: { ky: 'Койлор жана Кочкорлор (Арашан)', ru: 'Бараны и Овцы (Арашан)', tr: 'Koyun ve Koçlar (Araşan)' } },
      { id: 'poultry', slug: 'poultry', name: { ky: 'Үй канаттуулары (Тоок, Каз)', ru: 'Домашняя птица', tr: 'Kümes Hayvanları' } },
      { id: 'feed', slug: 'feed', name: { ky: 'Тоют, Чөп жана Жем', ru: 'Корма, Сено и Зерно', tr: 'Yem, Saman ve Tahıl' } },
    ]
  },
  {
    id: 'jewelry',
    slug: 'jewelry',
    name: {
      ky: 'Зергерлик буюмдар & Сааттар',
      ru: 'Ювелирные изделия и Часы',
      tr: 'Mücevher ve Saatler'
    },
    description: {
      ky: 'Алтын, күмүш, улуттук кыргыз зер буюмдары жана швейцариялык сааттар',
      ru: 'Золото, серебро, национальные украшения и швейцарские часы',
      tr: 'Altın, gümüş, geleneksel takılar ve lüks saatler'
    },
    icon: 'Gem',
    iconName: 'Gem',
    coverImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85',
    count: '1.1k',
    popularTags: {
      ky: ['585 Алтын', 'Улуттук билерик', 'Rolex', 'Бриллиант шакек'],
      ru: ['585 Золото', 'Национальный браслет', 'Rolex', 'Бриллиант'],
      tr: ['585 Altın', 'Geleneksel Bilezik', 'Rolex', 'Pırlanta Yüzük']
    },
    subCategories: [
      { id: 'gold', slug: 'gold', name: { ky: 'Алтын жана Бриллианттар', ru: 'Золото и Бриллианты', tr: 'Altın ve Pırlanta' } },
      { id: 'watches', slug: 'watches', name: { ky: 'Эркектер жана Аялдар сааттары', ru: 'Наручные часы', tr: 'Lüks Kol Saatleri' } },
      { id: 'national', slug: 'national', name: { ky: 'Улуттук кыргыз зер буюмдары', ru: 'Национальные украшения', tr: 'Geleneksel Takılar' } },
    ]
  },
  {
    id: 'art',
    slug: 'art',
    name: {
      ky: 'Өнөр, Антиквариат & Салттуу буюмдар',
      ru: 'Искусство, Антиквариат и Традиции',
      tr: 'Sanat, Antika & Koleksiyon'
    },
    description: {
      ky: 'Кыргыз шырдактары, колуктунун себи, тарыхый тыйындар жана сүрөттөр',
      ru: 'Кыргызские шырдаки, национальный быт, монеты и картины',
      tr: 'Geleneksel Kırgız keçe halıları (şırdak), antika paralar ve sanat eserleri'
    },
    icon: 'Palette',
    iconName: 'Palette',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    count: '640',
    popularTags: {
      ky: ['Шырдак', 'Боз үй жабдыктары', 'Антиквариат', 'Кол өнөрчүлүк'],
      ru: ['Шырдак', 'Юрта', 'Антиквариат', 'Ручная работа'],
      tr: ['Şırdak Halısı', 'Kırgız Çadırı', 'Antika Para', 'El Sanatları']
    },
    subCategories: [
      { id: 'shyrdak', slug: 'shyrdak', name: { ky: 'Шырдактар жана Кийиз буюмдары', ru: 'Шырдаки и Войлок', tr: 'Şırdak ve Keçe Halılar' } },
      { id: 'coins', slug: 'coins', name: { ky: 'Нумизматика жана Тыйындар', ru: 'Монеты и Банкноты', tr: 'Madeni Paralar ve Pullar' } },
      { id: 'paintings', slug: 'paintings', name: { ky: 'Картиналар жана Сүрөттөр', ru: 'Картины', tr: 'Tablolar ve Çizimler' } },
    ]
  },
  {
    id: 'machinery',
    slug: 'machinery',
    name: {
      ky: 'Атайын жана Айыл чарба техникасы',
      ru: 'Спецтехника и Сельхозтехника',
      tr: 'İş ve Tarım Makineleri'
    },
    description: {
      ky: 'Тракторлор, комбайндар, экскаваторлор жана айыл чарба агрегаттары',
      ru: 'Тракторы, комбайны, экскаваторы и навесное оборудование',
      tr: 'Traktörler, biçerdöverler, kazıcılar ve tarım ekipmanları'
    },
    icon: 'Tractor',
    iconName: 'Tractor',
    coverImage: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&w=1200&q=85',
    count: '890',
    popularTags: {
      ky: ['МТЗ-82', 'Экскаватор', 'Соко', 'Комбайн Клаас'],
      ru: ['МТЗ-82', 'Экскаватор', 'Плуг', 'Комбайн Claas'],
      tr: ['MTZ-82 Traktör', 'Ekskavatör', 'Saban ve Pulluk', 'Claas Biçerdöver']
    },
    subCategories: [
      { id: 'tractors', slug: 'tractors', name: { ky: 'Тракторлор (Беларус, ЮМЗ)', ru: 'Тракторы (МТЗ, ЮМЗ)', tr: 'Traktörler (Belarus, MTZ)' } },
      { id: 'construction', slug: 'construction', name: { ky: 'Курулуш техникасы', ru: 'Строительная техника', tr: 'İnşaat ve İş Makineleri' } },
      { id: 'attachments', slug: 'attachments', name: { ky: 'Агрегаттар (Соко, Пресс)', ru: 'Навесное оборудование', tr: 'Tarım Aletleri ve Ekipman' } },
    ]
  }
]
