// src/services/aiService.ts

export interface GenerateListingParams {
  keywords: string
  category: string
  city?: string
  district?: string
  targetLanguage: 'ky' | 'ru' | 'tr'
  attributes?: Record<string, any>
}

export interface GeneratedListingResult {
  title: string
  description: string
  suggestedStartingPrice: number
  suggestedBidIncrement: number
  category: string
  highlights: string[]
  success: boolean
  error?: string
}

// Credentials come from Vite env vars (frontend/.env.local). Never commit
// real keys — anything bundled into the client is effectively public.
const NINE_ROUTER_BASE_URL = import.meta.env.VITE_AI_ROUTER_BASE_URL || ''
const NINE_ROUTER_API_KEY = import.meta.env.VITE_AI_ROUTER_API_KEY || ''
const MODEL_NAME = import.meta.env.VITE_AI_ROUTER_MODEL || 'atabayhakan'

/**
 * Generates an auction listing using 9Router / NVIDIA NIM Nemotron model
 */
export async function generateListingWithAI(params: GenerateListingParams): Promise<GeneratedListingResult> {
  const langPrompts = {
    ky: 'Жоопту таза КЫРГЫЗ тилинде (Кыргызстандын соода терминдери: KGS сом, саан уй, бука, жылкы, кой, бажы төлөнгөн, кызыл китеп) бер.',
    ru: 'Ответь на чистом РУССКОМ языке с учетом кыргызстанской специфики (сом, растаможка, красная книга, мал базар).',
    tr: 'Cevabı akıcı ve profesyonel TÜRKÇE olarak ver (Kırgızistan KGS para birimi ve yerel pazar terimlerine uygun).'
  }

  const systemPrompt = `Сен Кыргызстандагы iTorgo платформасынын профессионал аукцион экспертисиң.
Колдонуучу берген кыска маалыматтан толук жана ишенимдүү аукцион лотун түзүп беришиң керек.
${langPrompts[params.targetLanguage] || langPrompts.ky}

Сенден ЖАҢЫ гана төмөнкү JSON форматында жооп күтүлөт, башка эч кандай түшүндүрмө текст кошпо:
{
  "title": "Кыска жана таасирдүү аталыш (макс 60 символ)",
  "description": "Толук, таасирдүү жана сатууга үндөгөн сыпаттама (абалы, артыкчылыктары, бүтүм кепилдиги)",
  "suggestedStartingPrice": 50000,
  "suggestedBidIncrement": 2000,
  "category": "${params.category}",
  "highlights": ["Артыкчылык 1", "Артыкчылык 2", "Артыкчылык 3"]
}`

  const userContent = `Лот боюнча маалымат:
- Ачкыч сөздөр / Сүрөттөмө: ${params.keywords}
- Категория: ${params.category}
- Аймак / Шаар: ${params.city || 'Бишкек'}, ${params.district || ''}
- Кошумча параметрлер: ${JSON.stringify(params.attributes || {})}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${NINE_ROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NINE_ROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`9Router HTTP Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content || ''

    // Parse JSON from codeblock or raw response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        title: parsed.title || params.keywords,
        description: parsed.description || 'Жаңы аукцион лоту',
        suggestedStartingPrice: Number(parsed.suggestedStartingPrice) || 10000,
        suggestedBidIncrement: Number(parsed.suggestedBidIncrement) || 500,
        category: parsed.category || params.category,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        success: true
      }
    }

    return {
      title: params.keywords,
      description: content,
      suggestedStartingPrice: 20000,
      suggestedBidIncrement: 1000,
      category: params.category,
      highlights: [],
      success: true
    }

  } catch (error: any) {
    console.warn('9Router AI API Error, using fallback local generator:', error)
    return fallbackLocalGenerator(params)
  }
}

/**
 * Fallback generator when local 9Router is offline or timeout occurs
 * Fully multilingual: Russian (ru), Kyrgyz (ky), Turkish (tr)
 */
function fallbackLocalGenerator(params: GenerateListingParams): GeneratedListingResult {
  const isLivestock = params.category === 'livestock'
  const isVehicle = params.category === 'vehicles'
  const isRealEstate = params.category === 'real-estate'
  const lang = params.targetLanguage || 'ru'
  const city = params.city || (lang === 'tr' ? 'Bişkek' : 'Бишкек')

  let title = params.keywords
  let desc = ''
  let price = 50000
  let step = 1000
  let highlights: string[] = []

  if (lang === 'ru') {
    if (isLivestock) {
      title = `${params.keywords || 'Племенной скот ала-тооской породы'} (${city})`
      desc = `Здоровый скот, прошел все ветеринарные проверки и вакцинацию. Отличный аппетит, упитанный. Возможен осмотр на месте либо доставка по договоренности. Оплата через безопасный эскроу-счет MBank / Optima.`
      price = 85000
      step = 2000
      highlights = ['100% Ветеринарный паспорт', 'Проверенный заводчик', 'Быстрая передача']
    } else if (isVehicle) {
      title = `${params.keywords || 'Toyota Camry 2.5 SE'} (${city})`
      desc = `Отличное техническое и эстетическое состояние. Двигатель, КПП и ходовая часть работают идеально. Полностью растаможен, без залогов и штрафов. Не работал в такси. Готов к любой компьютерной диагностике.`
      price = 1200000
      step = 20000
      highlights = ['Растаможен в КР', 'Юридически чист', 'Оригинальный пробег']
    } else if (isRealEstate) {
      title = `${params.keywords || 'Рынок Дордой / Коммерческое помещение'} (${city})`
      desc = `Двухэтажный торговый контейнер / объект на проходной линии рынка Дордой. Полный пакет документов на руках (Красная книга, техпаспорт). Удобный подъезд, охрана, высокий пешеходный трафик.`
      price = 2500000
      step = 50000
      highlights = ['Красная книга', 'Высокая проходимость', 'Готовый бизнес']
    } else {
      title = `${params.keywords} (${city})`
      desc = `Качественный товар в отличном состоянии. Полная комплектация, гарантированная работоспособность. Безопасная сделка через банковский эскроу iTorgo (MBank / Optima).`
      price = 35000
      step = 1000
      highlights = ['100% Гарантия', 'Проверенный продавец', 'Оплата при получении']
    }
  } else if (lang === 'tr') {
    if (isLivestock) {
      title = `${params.keywords || 'Safkan Damızlık Büyükbaş'} (${city})`
      desc = `Tüm veteriner aşıları ve sağlık kontrolleri eksiksiz yapılmıştır. Yem seçmez, besi durumu mükemmeldir. Yerinde kontrol edilebilir veya güvenli nakliye ayarlanabilir. Ödeme banka emanetindedir.`
      price = 85000
      step = 2000
      highlights = ['Veteriner Onaylı', 'Doğrudan Yetiştiriciden', 'Hızlı Teslimat']
    } else if (isVehicle) {
      title = `${params.keywords || 'Toyota Camry 2.5'} (${city})`
      desc = `Aracın motoru, şanzımanı ve yürüyen aksamı kusursuz durumdadır. Gümrük vergileri tam ödenmiş, yasal olarak temizdir. Ticari geçmişi yoktur, ekspertize açıktır.`
      price = 1200000
      step = 20000
      highlights = ['Gümrük Vergisi Ödendi', 'Ekspertize Açık', 'Masrafsız']
    } else if (isRealEstate) {
      title = `${params.keywords || 'Dordoy Pazarı Ticari Dükkan / Konteyner'} (${city})`
      desc = `Dordoy pazarının işlek lokasyonunda çift katlı konteyner / ticari mülk. Kırmızı kitap ve teknik pasaport dahil tüm evraklar hazırdır. Yüksek kira getirisi potansiyeli vardır.`
      price = 2500000
      step = 50000
      highlights = ['Kırmızı Kitap Ruhsatlı', 'Yüksek Yaya Trafiği', 'Yatırımlık']
    } else {
      title = `${params.keywords} (${city})`
      desc = `Yeni model kaliteli ürün. Kutusu ve aksesuarları eksiksiz olup çalışmasına %100 kefil olunur. MBank / Optima güvencesiyle iTorgo banka emanetiyle güvenle alabilirsiniz.`
      price = 35000
      step = 1000
      highlights = ['%100 Garanti', 'Doğrulanmış Satıcı', 'Banka Emaneti']
    }
  } else {
    // Kyrgyz (ky)
    if (isLivestock) {
      title = `Ала-Тоо тукумундагы саан уй / бука (${city})`
      desc = `Саламатсыздарбы! Малдын ден соолугу чың, бардык ветеринардык текшерүүлөрдөн жана эмдөөлөрдөн өткөн. Жем-чөпкө талабы жок, семиз. Жеринен келип көрсөңүздөр болот же жеткирүү боюнча сүйлөшөбүз.`
      price = 85000
      step = 2000
      highlights = ['100% Ветеринардык текшерүү', 'Ишенимдүү малчы', 'Ыкчам өткөрүп берүү']
    } else if (isVehicle) {
      title = `Toyota Camry 2.5 SE (${city})`
      desc = `Абалы идеалдуу, мотор, коробка, ходовой 100% сонун. Бажы алымдары (растаможка) толук төлөнгөн, юридикалык жактан таза. Каршерингде же таксиде иштеген эмес. Компьютердик диагностикага даяр.`
      price = 1200000
      step = 20000
      highlights = ['Бажы төлөнгөн', 'Юридикалык таза', 'Оригинал пробег']
    } else if (isRealEstate) {
      title = `Дордой базары / Коммерциялык соода түйүнү (${city})`
      desc = `Дордой базарындагы өтүмдүү катардагы соода түйүнү / контейнер. Бардык документтери (Кызыл китеп / Техпаспорт) колунда. Электр, күзөт жана транспорттук логистика абдан ыңгайлуу.`
      price = 2500000
      step = 50000
      highlights = ['Кызыл китеп', 'Өтүмдүү орун', 'Даяр бизнес']
    } else {
      title = `${params.keywords} (${city})`
      desc = `Жаңы үлгүдөгү сапаттуу товар. Комплекти толук, иштөөсүнө 100% кепилдик берилет. MBank / Optima аркылуу эскроу кепилдиги менен коопсуз сатып алсаңыз болот.`
      price = 35000
      step = 1000
      highlights = ['100% Кепилдик', 'Текшерилген сатуучу', 'Ыкчам өткөрүп берүү']
    }
  }

  return {
    title,
    description: desc,
    suggestedStartingPrice: price,
    suggestedBidIncrement: step,
    category: params.category,
    highlights,
    success: true
  }
}
