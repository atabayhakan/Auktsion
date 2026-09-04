// src/data/regions.ts
export interface Region {
  id: string
  name: {
    ky: string
    ru: string
    tr: string
  }
  districts: Array<{
    id: string
    name: {
      ky: string
      ru: string
      tr: string
    }
  }>
}

export const kyrgyzstanRegions: Region[] = [
  {
    id: 'bishkek',
    name: { ky: 'Бишкек шаары', ru: 'г. Бишкек', tr: 'Bişkek Şehri' },
    districts: [
      { id: 'lenin', name: { ky: 'Ленин району', ru: 'Ленинский район', tr: 'Lenin İlçesi' } },
      { id: 'oktyabr', name: { ky: 'Октябрь району', ru: 'Октябрьский район', tr: 'Oktyabr İlçesi' } },
      { id: 'birinchi_may', name: { ky: 'Биринчи Май району', ru: 'Первомайский район', tr: 'Birinçi May İlçesi' } },
      { id: 'sverdlov', name: { ky: 'Свердлов району', ru: 'Свердловский район', tr: 'Sverdlov İlçesi' } },
    ]
  },
  {
    id: 'chuy',
    name: { ky: 'Чүй облусу', ru: 'Чуйская область', tr: 'Çüy Bölgesi' },
    districts: [
      { id: 'tokmok', name: { ky: 'Токмок ш.', ru: 'г. Токмок', tr: 'Tokmok' } },
      { id: 'kara_balta', name: { ky: 'Кара-Балта ш.', ru: 'г. Кара-Балта', tr: 'Kara-Balta' } },
      { id: 'kant', name: { ky: 'Кант ш.', ru: 'г. Кант', tr: 'Kant' } },
      { id: 'sokuluk', name: { ky: 'Сокулук р-ну', ru: 'Сокулукский р-н', tr: 'Sokuluk' } },
      { id: 'alamudun', name: { ky: 'Аламүдүн р-ну', ru: 'Аламудунский р-н', tr: 'Alamüdün' } },
      { id: 'moskva', name: { ky: 'Москва р-ну (Беловодск)', ru: 'Московский р-н', tr: 'Moskova (Belovodsk)' } },
      { id: 'jaiyl', name: { ky: 'Жайыл р-ну', ru: 'Жайылский р-н', tr: 'Jayıl' } },
      { id: 'kemin', name: { ky: 'Кемин р-ну', ru: 'Кеминский р-н', tr: 'Kemin' } },
      { id: 'panfilov', name: { ky: 'Панфилов р-ну', ru: 'Панфиловский р-н', tr: 'Panfilov' } },
    ]
  },
  {
    id: 'osh',
    name: { ky: 'Ош облусу & Ош шаары', ru: 'Ошская область и г. Ош', tr: 'Oş Bölgesi & Oş Şehri' },
    districts: [
      { id: 'osh_city', name: { ky: 'Ош шаары', ru: 'г. Ош', tr: 'Oş Şehri' } },
      { id: 'kara_suu', name: { ky: 'Кара-Суу р-ну (Базар)', ru: 'Кара-Суйский р-н', tr: 'Kara-Suu' } },
      { id: 'ozgon', name: { ky: 'Өзгөн р-ну', ru: 'Узгенский р-н', tr: 'Özgön' } },
      { id: 'nookat', name: { ky: 'Ноокат р-ну', ru: 'Ноокатский р-н', tr: 'Nookat' } },
      { id: 'aravan', name: { ky: 'Араван р-ну', ru: 'Араванский р-н', tr: 'Aravan' } },
      { id: 'alay', name: { ky: 'Алай р-ну (Гүлчө)', ru: 'Алайский р-н', tr: 'Alay (Gülçö)' } },
      { id: 'chong_alay', name: { ky: 'Чоң-Алай р-ну (Дароот-Коргон)', ru: 'Чон-Алайский р-н', tr: 'Çoñ-Alay' } },
      { id: 'kara_kulja', name: { ky: 'Кара-Кулжа р-ну', ru: 'Кара-Кулджинский р-н', tr: 'Kara-Kulca' } },
    ]
  },
  {
    id: 'jalal_abad',
    name: { ky: 'Жалал-Абад облусу', ru: 'Джалал-Абадская область', tr: 'Celal-Abad Bölgesi' },
    districts: [
      { id: 'jalal_abad_city', name: { ky: 'Жалал-Абад ш.', ru: 'г. Джалал-Абад', tr: 'Celal-Abad Şehri' } },
      { id: 'suzak', name: { ky: 'Сузак р-ну', ru: 'Сузакский р-н', tr: 'Suzak' } },
      { id: 'bazar_korgon', name: { ky: 'Базар-Коргон р-ну', ru: 'Базар-Коргонский р-н', tr: 'Bazar-Korgon' } },
      { id: 'nooken', name: { ky: 'Ноокен р-ну (Масы)', ru: 'Ноокенский р-н', tr: 'Nooken' } },
      { id: 'toktogul', name: { ky: 'Токтогул р-ну', ru: 'Токтогульский р-н', tr: 'Toktogul' } },
      { id: 'aksy', name: { ky: 'Аксы р-ну (Кербен)', ru: 'Аксыйский р-н', tr: 'Aksı (Kerben)' } },
      { id: 'ala_buka', name: { ky: 'Ала-Бука р-ну', ru: 'Ала-Букинский р-н', tr: 'Ala-Buka' } },
      { id: 'chatkal', name: { ky: 'Чаткал р-ну (Каныш-Кыя)', ru: 'Чаткальский р-н', tr: 'Çatkal' } },
      { id: 'tash_komur', name: { ky: 'Таш-Көмүр ш.', ru: 'г. Таш-Кумыр', tr: 'Taş-Kömür' } },
    ]
  },
  {
    id: 'issyk_kul',
    name: { ky: 'Ысык-Көл облусу', ru: 'Иссык-Кульская область', tr: 'Isık-Göl Bölgesi' },
    districts: [
      { id: 'karakol', name: { ky: 'Каракол ш.', ru: 'г. Каракол', tr: 'Karakol' } },
      { id: 'cholpon_ata', name: { ky: 'Чолпон-Ата ш.', ru: 'г. Чолпон-Ата', tr: 'Çolpon-Ata' } },
      { id: 'balykchy', name: { ky: 'Балыкчы ш.', ru: 'г. Балыкчы', tr: 'Balykçı' } },
      { id: 'issyk_kul_dist', name: { ky: 'Ысык-Көл р-ну (Ананьево, Бостери)', ru: 'Иссык-Кульский р-н', tr: 'Isık-Göl (Bosteri, Ananyevo)' } },
      { id: 'tup', name: { ky: 'Түп р-ну', ru: 'Тюпский р-н', tr: 'Tüp' } },
      { id: 'jeti_oguz', name: { ky: 'Жети-Өгүз р-ну (Кызыл-Суу)', ru: 'Джети-Огузский р-н', tr: 'Ceti-Ögüz (Kızıl-Suu)' } },
      { id: 'tong', name: { ky: 'Тоң р-ну (Бөкөнбаев)', ru: 'Тонский р-н (Боконбаево)', tr: 'Toñ (Bökönbaev)' } },
      { id: 'ak_suu', name: { ky: 'Ак-Суу р-ну (Теплоключенка)', ru: 'Ак-Суйский р-н', tr: 'Ak-Suu' } },
    ]
  },
  {
    id: 'naryn',
    name: { ky: 'Нарын облусу', ru: 'Нарынская область', tr: 'Naryn Bölgesi' },
    districts: [
      { id: 'naryn_city', name: { ky: 'Нарын ш.', ru: 'г. Нарын', tr: 'Naryn Şehri' } },
      { id: 'kochkor', name: { ky: 'Кочкор р-ну (Мал базары)', ru: 'Кочкорский р-н (Скотный рынок)', tr: 'Koçkor (Mal Pazarı)' } },
      { id: 'at_bashy', name: { ky: 'Ат-Башы р-ну', ru: 'Ат-Башинский р-н', tr: 'At-Başı' } },
      { id: 'jumgal', name: { ky: 'Жумгал р-ну (Чаек)', ru: 'Джумгальский р-н', tr: 'Cumgal (Çayek)' } },
      { id: 'ak_talaa', name: { ky: 'Ак-Талаа р-ну (Баетов)', ru: 'Ак-Талинский р-н', tr: 'Ak-Talaa (Baetov)' } },
    ]
  },
  {
    id: 'talas',
    name: { ky: 'Талас облусу', ru: 'Таласская область', tr: 'Talas Bölgesi' },
    districts: [
      { id: 'talas_city', name: { ky: 'Талас ш.', ru: 'г. Талас', tr: 'Talas Şehri' } },
      { id: 'bakay_ata', name: { ky: 'Бакай-Ата р-ну', ru: 'Бакай-Атинский р-н', tr: 'Bakay-Ata' } },
      { id: 'kara_buura', name: { ky: 'Айтматов / Кара-Буура р-ну', ru: 'Айтматовский р-н (Кызыл-Адыр)', tr: 'Aytmatov / Kara-Buura' } },
      { id: 'manas', name: { ky: 'Манас р-ну (Покровка)', ru: 'Манасский р-н', tr: 'Manas' } },
    ]
  },
  {
    id: 'batken',
    name: { ky: 'Баткен облусу', ru: 'Баткенская область', tr: 'Batken Bölgesi' },
    districts: [
      { id: 'batken_city', name: { ky: 'Баткен ш.', ru: 'г. Баткен', tr: 'Batken Şehri' } },
      { id: 'kyzyl_kiya', name: { ky: 'Кызыл-Кыя ш.', ru: 'г. Кызыл-Кия', tr: 'Kızıl-Kıya' } },
      { id: 'kadamjay', name: { ky: 'Кадамжай р-ну', ru: 'Кадамжайский р-н', tr: 'Kadamcay' } },
      { id: 'leylek', name: { ky: 'Лейлек р-ну (Исфана / Раззаков)', ru: 'Лейлекский р-н (г. Раззаков)', tr: 'Leylek (Razzakov)' } },
      { id: 'suluktu', name: { ky: 'Сүлүктү ш.', ru: 'г. Сулюкта', tr: 'Sülükta' } },
    ]
  },
]
