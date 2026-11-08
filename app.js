/* ==========================================================================
   AdSpot Tashkent — Full-Stack Interactive Controller (Connected to server.py)
   Fixes all 7 UX & Functional Workflows:
   1. Working OpenStreetMap (No API Key) + Street-Level Visual Billboard Preview
   2. User Sign-Up / Registration & Instant Booking Modal (#auth-modal)
   3. Multi-Conversation Chat Folder Inbox (AI + 4 Space Owners + Design Studio)
   4. Interactive Video Guide & 84K Commuters ROI Calculator Modal (#guide-modal)
   5. Live Banner Slogan Compliance & Readability Scanner (#live-slogan-input)
   6. Context-Aware Smart AI Assistant & Owner Chat Engine (UZ / RU / EN)
   7. Fully Interactive Business Owner, Space Owner & Admin Portals
   ========================================================================== */

let currentLang = 'en';
let selectedSpotId = 'YUN-01';
let currentAdvisoryPreset = 'school_conflict';
let currentChatThreadId = 'ai';
let currentPortalTab = 'business';
let selectedPaymentGateway = 'Payme';
let isTunnelPlaying = true;
let isBackendConnected = false;
let currentMapMode = 'gps';
let leafletMap = null;
let leafletMarkersGroup = null;
let streetPreviewNightMode = false;

/* Registered User State */
let currentUser = {
  registered: false,
  name: '',
  company: '',
  phone: '',
  role: 'business'
};

/* Interactive Video Guide State */
let currentGuideTab = 0;
let currentVideoStep = 0;
let videoInterval = null;

/* Custom Animated Vector SVG Icon Library (Zero Emojis) */
const SVG_ICONS = {
  checkCircle: `<svg class="w-3.5 h-3.5 text-[#284B63] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9" stroke-opacity="0.25"/><path d="M8.5 12.5l2.3 2.3 4.7-4.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warnTriangle: `<svg class="w-3.5 h-3.5 text-[#8C7355] shrink-0 anim-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3L2 20h20L12 3z" stroke-linejoin="round"/><path d="M12 10v4" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>`,
  eyePulse: `<svg class="w-3.5 h-3.5 text-[#284B63] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3" class="anim-radar-ring"/></svg>`,
  pinRadar: `<svg class="w-3.5 h-3.5 text-[#284B63] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s-7-5.8-7-11a7 7 0 1 1 14 0c0 5.2-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  shieldCheck: `<svg class="w-3.5 h-3.5 text-[#284B63] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3l8 3.5v5.5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6.5L12 3z"/><path d="M8.8 12.2l2.1 2.1 4.5-4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sparklePen: `<svg class="w-3.5 h-3.5 text-[#8C7355] shrink-0 anim-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3z" stroke-linejoin="round"/></svg>`,
  pauseBars: `<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>`,
  playTriangle: `<polygon points="7,5 19,12 7,19"/>`
};

/* ==========================================================================
   CHAT FOLDER THREADS (6 Distinct Conversations)
   ========================================================================== */
const CHAT_THREADS = [
  {
    id: 'ai',
    type: 'ai',
    spotIds: [],
    name: {
      uz: 'AdSpot 24/7 Smart AI Yordamchi',
      ru: 'Умный AI-Ассистент AdSpot 24/7',
      en: 'AdSpot 24/7 Smart AI Assistant'
    },
    subtitle: {
      uz: 'Narxlar, tumanlar, o‘lchamlar va qonuniy tekshiruv',
      ru: 'Цены, районы, размеры и проверка по закону',
      en: 'Prices, districts, dimensions & legal pre-check'
    },
    badge: 'AI 24/7',
    unread: 0,
    messages: {
      uz: [
        { from: 'partner', name: 'AdSpot 24/7 AI', text: 'Assalomu alaykum! Menga istalgan savolingizni yozing: masalan, "Eng arzon bilbord qancha?", "Chilonzorda qanday joylar bor?", "O‘lchamlar qanday?" yoki "Maktab yonida qanday qoida bor?".' }
      ],
      ru: [
        { from: 'partner', name: 'AdSpot 24/7 AI', text: 'Здравствуйте! Задайте любой вопрос: например, «Какая самая низкая цена?», «Что есть в Чиланзаре?», «Какие размеры баннеров?» или «Правила у школ и мечетей».' }
      ],
      en: [
        { from: 'partner', name: 'AdSpot 24/7 AI', text: 'Hello! Ask me anything: e.g., "What is the cheapest spot?", "Which billboards are in Chilanzar?", "What banner sizes do I need?", or "What are the school zone rules?".' }
      ]
    }
  },
  {
    id: 'YUN-01',
    type: 'owner',
    spotIds: ['YUN-01', 'MIR-01'],
    name: {
      uz: 'Poytaxt Bilbord Servis',
      ru: 'Poytaxt Bilbord Servis',
      en: 'Poytaxt Bilbord Servis'
    },
    subtitle: {
      uz: 'Amir Temur Xiyoboni (YUN-01) va Mirzo Ulug‘bek (MIR-01)',
      ru: 'Сквер Амира Темура (YUN-01) и Мирзо-Улугбек (MIR-01)',
      en: 'Amir Temur Square (YUN-01) & Mirzo Ulugbek (MIR-01)'
    },
    badge: 'Owner',
    unread: 1,
    messages: {
      uz: [
        { from: 'partner', name: 'Poytaxt Bilbord Servis', text: 'Salom! Biz Amir Temur Xiyoboni (YUN-01, 5.2M UZS) va Buyuk Ipak Yo‘li (MIR-01, 6.1M UZS) bilbordlari egasimiz. Bo‘sh sanalar va chop etish bo‘yicha so‘rashingiz mumkin.' }
      ],
      ru: [
        { from: 'partner', name: 'Poytaxt Bilbord Servis', text: 'Здравствуйте! Мы владельцы щитов у Сквера Амира Темура (YUN-01, 5.2M UZS) и Буюк Ипак Йули (MIR-01, 6.1M UZS). Спрашивайте по датам и монтажу.' }
      ],
      en: [
        { from: 'partner', name: 'Poytaxt Bilbord Servis', text: 'Hello! We own the Amir Temur Square (YUN-01, 5.2M UZS) and Buyuk Ipak Yuli (MIR-01, 6.1M UZS) billboards. Ask us about dates, vinyl printing, or discounts!' }
      ]
    }
  },
  {
    id: 'CHIL-01',
    type: 'owner',
    spotIds: ['CHIL-01'],
    name: {
      uz: 'Toshkent Tashqi Media',
      ru: 'Toshkent Tashqi Media',
      en: 'Toshkent Tashqi Media'
    },
    subtitle: {
      uz: 'Chilonzor Savdo Markazi (CHIL-01 · 6m × 3m)',
      ru: 'Торговый Центр Чиланзар (CHIL-01 · 6м × 3м)',
      en: 'Chilanzar Trade Center (CHIL-01 · 6m × 3m)'
    },
    badge: 'Owner',
    unread: 0,
    messages: {
      uz: [
        { from: 'partner', name: 'Toshkent Tashqi Media', text: 'Assalomu alaykum! Chilonzor-10 (Qatortol, CHIL-01) bilbordimiz oilaviy va savdo brendlari uchun ayni muddao. Oylik narxi 4,800,000 UZS.' }
      ],
      ru: [
        { from: 'partner', name: 'Toshkent Tashqi Media', text: 'Добрый день! Наш щит на Катартале (CHIL-01) отлично подходит для семейных брендов и ритейла. Стоимость — 4,800,000 UZS/мес.' }
      ],
      en: [
        { from: 'partner', name: 'Toshkent Tashqi Media', text: 'Welcome! Our Chilanzar Trade Hub billboard (CHIL-01 on Qatortol St) gets 78,000 daily views for 4,800,000 UZS/mo. How can we help?' }
      ]
    }
  },
  {
    id: 'CHIL-02',
    type: 'owner',
    spotIds: ['CHIL-02', 'MIR-02'],
    name: {
      uz: 'OchiqShahar Digital (4K LED)',
      ru: 'OchiqShahar Digital (4K LED)',
      en: 'OchiqShahar Digital (4K LED)'
    },
    subtitle: {
      uz: 'Bunyodkor (CHIL-02) va Darxon 4K LED (MIR-02)',
      ru: 'Бунёдкор (CHIL-02) и Дархан 4K LED (MIR-02)',
      en: 'Bunyodkor (CHIL-02) & Darxon 4K LED (MIR-02)'
    },
    badge: 'LED 4K',
    unread: 0,
    messages: {
      uz: [
        { from: 'partner', name: 'OchiqShahar Digital', text: 'Salom! Bizning 4K LED ekranlarimizda (Bunyodkor CHIL-02 va Darxon MIR-02) 10 soniyalik video roliklar har 60 soniyada aylanadi. Video yuklash 15 daqiqada!' }
      ],
      ru: [
        { from: 'partner', name: 'OchiqShahar Digital', text: 'Приветствуем! На наших 4K LED экранах (Бунёдкор CHIL-02 и Дархан MIR-02) ваш 10-секундный ролик выходит каждые 60 секунд. Запуск за 15 минут!' }
      ],
      en: [
        { from: 'partner', name: 'OchiqShahar Digital', text: 'Hi! On our 4K LED screens (Bunyodkor CHIL-02 & Darxon MIR-02), your 10-second video spot plays every 60 seconds. Go live within 15 minutes of approval!' }
      ]
    }
  },
  {
    id: 'YUN-02',
    type: 'owner',
    spotIds: ['YUN-02', 'YAK-01'],
    name: {
      uz: 'AvtoBekat Media & CityLight',
      ru: 'AvtoBekat Media & CityLight',
      en: 'AvtoBekat Media & CityLight'
    },
    subtitle: {
      uz: 'Mega Planet (YUN-02) va Shota Rustaveli (YAK-01)',
      ru: 'Mega Planet (YUN-02) и Шота Руставели (YAK-01)',
      en: 'Mega Planet (YUN-02) & Shota Rustaveli (YAK-01)'
    },
    badge: 'Shelters',
    unread: 0,
    messages: {
      uz: [
        { from: 'partner', name: 'AvtoBekat Media', text: 'Salom! Avtobus bekatlarimiz (YUN-02 2.9M UZS va YAK-01 2.4M UZS) piyodalar va talabalar uchun eng hamyonbop format hisoblanadi.' }
      ],
      ru: [
        { from: 'partner', name: 'AvtoBekat Media', text: 'Здравствуйте! Сити-форматы на остановках (YUN-02 2.9M UZS и YAK-01 2.4M UZS) — лучший бюджетный старт для кафе и учебных центров.' }
      ],
      en: [
        { from: 'partner', name: 'AvtoBekat Media', text: 'Hello! Our backlit bus shelters (YUN-02 at 2.9M UZS and YAK-01 at 2.4M UZS) are the most affordable way to reach pedestrians and students.' }
      ]
    }
  },
  {
    id: 'design',
    type: 'design',
    spotIds: [],
    name: {
      uz: 'AdSpot Dizayn Studiyasi',
      ru: 'Дизайн-Студия AdSpot',
      en: 'AdSpot Design Studio'
    },
    subtitle: {
      uz: 'Maket tayyorlash va O‘zbek tili qonunchilik tekshiruvi',
      ru: 'Разработка макета и проверка языковых норм РУз',
      en: 'Banner layout & Uzbek ad law compliance studio'
    },
    badge: 'Studio',
    unread: 0,
    messages: {
      uz: [
        { from: 'partner', name: 'AdSpot Design Studio', text: 'Salom! Logotipingiz va aksiyangizni yuboring — 2 soat ichida 6m×3m va 4K LED formatda qonunga 100% mos maket tayyorlab beramiz.' }
      ],
      ru: [
        { from: 'partner', name: 'AdSpot Design Studio', text: 'Здравствуйте! Пришлите логотип и текст акции — за 2 часа подготовим макет 6м×3м или 4K LED по всем нормам закона о рекламе РУз.' }
      ],
      en: [
        { from: 'partner', name: 'AdSpot Design Studio', text: 'Hi! Send us your brand logo and offer—we will craft a high-contrast 6m×3m or 4K LED banner compliant with Uzbekistan ad laws within 2 hours.' }
      ]
    }
  }
];

/* Active Campaigns State (Interactive in Business Owner Portal) */
let activeCampaigns = [
  {
    id: 'CMP-101',
    spotId: 'CHIL-02',
    status: 'live',
    daysElapsed: 18,
    daysTotal: 30,
    title: {
      uz: 'Bunyodkor 4K LED Ekran',
      ru: 'Панорамный 4K LED Экран Бунёдкор',
      en: 'Bunyodkor 4K LED Screen'
    },
    views: 1665000,
    lift: '+24%'
  },
  {
    id: 'CMP-102',
    spotId: 'YAK-01',
    status: 'live',
    daysElapsed: 9,
    daysTotal: 14,
    title: {
      uz: 'Shota Rustaveli BRT Bekati',
      ru: 'Остановка Шота Руставели BRT',
      en: 'Shota Rustaveli BRT Shelter'
    },
    views: 432000,
    lift: '+19%'
  }
];

/* Admin Moderation Queue State (Interactive in Admin Portal) */
let adminModerationQueue = [
  {
    id: 'MOD-401',
    type: 'Banner Pre-Check',
    spotId: 'YUN-01',
    company: 'Coffee Roasters Tashkent',
    issue: {
      uz: 'Amir Temur Xiyoboni (YUN-01) uchun "Morning Coffee -30%" maketi · O‘zbek tilidagi tarjima tekshirildi (Smart Score: 96/100)',
      ru: 'Макет «Morning Coffee -30%» для Сквера Амира Темура (YUN-01) · Узбекский текст проверен (Smart Score: 96/100)',
      en: 'Banner "Morning Coffee -30%" for Amir Temur Square (YUN-01) · Uzbek state language verified (Smart Score: 96/100)'
    },
    status: 'pending'
  },
  {
    id: 'MOD-402',
    type: 'New Billboard Passport',
    spotId: 'SERG-01',
    company: 'Sergeli Media Group',
    issue: {
      uz: 'Yangi 6m×3m LED Ekran: Sergeli Yangi Hayot metro bekati · Kadastr va Toshkent shahar ruxsatnomasi biriktirilgan',
      ru: 'Новый 6м×3м LED экран: метро Янги Хаёт (Сергели) · Кадастр и разрешение хокимията прикреплены',
      en: 'New 6m×3m LED Screen: Sergeli Yangi Hayot Metro · Cadastre & Municipality permit attached'
    },
    status: 'pending'
  },
  {
    id: 'MOD-403',
    type: 'Sensitive Zone Alert',
    spotId: 'YUN-01',
    company: 'Turbo Energy Drink',
    issue: {
      uz: '5-maktabdan 180m masofada energetik ichimlik reklamasi · Avtomatik CHIL-02 (Bunyodkor) nuqtasiga yo‘naltirish tavsiya etildi',
      ru: 'Реклама энергетика в 180м от школы №5 · Рекомендован перенос на CHIL-02 (Бунёдкор)',
      en: 'Energy drink creative 180m from School #5 · Recommended reroute to CHIL-02 (Bunyodkor Highway)'
    },
    status: 'pending'
  }
];

function getNested(obj, path) {
  return path.split('.').reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : null), obj);
}

function formatNum(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* ==========================================================================
   0. PYTHON + SQLITE BACKEND SYNC (server.py)
   ========================================================================== */
async function syncWithPythonBackend() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return;
    const health = await res.json();
    isBackendConnected = true;

    const pill = document.getElementById('backend-status-pill');
    if (pill) {
      pill.textContent = `● Python + SQLite Connected (${health.stats.verified_spots} Spots)`;
      pill.className = 'px-3 py-1 rounded-full bg-[#284B63] text-[#D4B895] font-bold';
    }

    const spotsRes = await fetch('/api/spots');
    if (spotsRes.ok) {
      const data = await spotsRes.json();
      if (data.spots && data.spots.length > 0) {
        window.ADSPOT_SPOTS = data.spots;
      }
    }

    applyMapFilters();
    renderPortalView();
  } catch (err) {
    isBackendConnected = false;
  }
}

/* ==========================================================================
   1. USER REGISTRATION & INSTANT BOOKING MODAL (#auth-modal)
   ========================================================================== */
function loadSavedUser() {
  try {
    const saved = localStorage.getItem('adspot_user');
    if (saved) {
      currentUser = JSON.parse(saved);
      updateNavAuthBadge();
    }
  } catch (e) {}
}

function updateNavAuthBadge() {
  const lbl = document.getElementById('nav-auth-label');
  if (!lbl) return;
  if (currentUser && currentUser.registered && currentUser.name) {
    lbl.removeAttribute('data-i18n');
    lbl.textContent = `✓ ${currentUser.name} (${currentUser.company || 'Verified'})`;
  }
}

function openAuthModal(defaultRole) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  const s = window.ADSPOT_SPOTS.find(x => x.id === selectedSpotId) || window.ADSPOT_SPOTS[0];
  const summaryEl = document.getElementById('auth-selected-spot-summary');
  if (summaryEl && s) {
    const perMo = window.ADSPOT_I18N[currentLang].mapSection.perMonth;
    summaryEl.textContent = `${s.id} · ${s.title[currentLang]} (${formatNum(s.monthlyPriceUZS)} ${perMo})`;
  }

  const roleSel = document.getElementById('auth-role');
  if (roleSel && defaultRole === 'owner') {
    roleSel.value = 'owner';
  } else if (roleSel && defaultRole === 'business') {
    roleSel.value = 'business';
  }

  modal.classList.remove('hidden');
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

function submitAuthForm(e) {
  e.preventDefault();
  const name = document.getElementById('auth-name').value.trim();
  const company = document.getElementById('auth-company').value.trim();
  const phone = document.getElementById('auth-phone').value.trim();
  const roleEl = document.getElementById('auth-role');
  const role = (roleEl && roleEl.value) || 'business';

  currentUser = {
    registered: true,
    name,
    company,
    phone,
    role
  };

  try {
    localStorage.setItem('adspot_user', JSON.stringify(currentUser));
  } catch (err) {}

  updateNavAuthBadge();
  applyMapFilters();

  const feedback = document.getElementById('auth-feedback-banner');
  if (feedback) {
    const msgByLang = {
      uz: `✓ Xush kelibsiz, ${name} (${company})! Hisobingiz tasdiqlandi. ${selectedSpotId} nuqtasiga yo‘naltirilmoqda...`,
      ru: `✓ Добро пожаловать, ${name} (${company})! Аккаунт подтвержден. Переходим к точке ${selectedSpotId}...`,
      en: `✓ Welcome, ${name} (${company})! Your account is verified. Redirecting to spot ${selectedSpotId}...`
    };
    feedback.textContent = msgByLang[currentLang] || msgByLang.en;
    feedback.classList.remove('hidden');
  }

  setTimeout(() => {
    closeAuthModal();
    if (feedback) feedback.classList.add('hidden');
    if (role === 'owner') {
      switchPortalTab('owner');
      document.getElementById('portals-section').scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
    }
  }, 850);
}

/* ==========================================================================
   2. INTERACTIVE VIDEO GUIDE & 84K COMMUTERS CALCULATOR MODAL (#guide-modal)
   ========================================================================== */
const VIDEO_GUIDE_STEPS = [
  {
    step: '01 / 05',
    title: {
      uz: '1-Qadam: Toshkent Xaritasidan Tasdiqlangan Joyni Tanlang',
      ru: 'Шаг 1: Выберите проверенную точку на карте Ташкента',
      en: 'Step 1: Pick a Verified Tashkent Spot on the Live Map'
    },
    desc: {
      uz: 'Tuman (Yunusobod, Chilonzor, Mirzo Ulug‘bek, Yakkasaroy) va formatni (Bilbord, 4K LED, Bekat) filtrlang. Har bir nuqtaning kunlik oqimi va ko‘cha ko‘rinishi darhol chiqadi.',
      ru: 'Фильтруйте по району и формату (Щит 6×3м, 4K LED экран, Остановка). Для каждой точки виден суточный трафик и превью конструкции на улице.',
      en: 'Filter by district and format (6×3m Billboard, 4K LED Screen, Bus Shelter). Every pin shows real daily commuter traffic, monthly UZS price, and a live street-level preview.'
    },
    visualMetric: {
      uz: '6 ta tasdiqlangan nuqta · Kuniga 39,500 dan 96,200 gacha ko‘rish',
      ru: '6 проверенных точек · От 39 500 до 96 200 показов в сутки',
      en: '6 Verified High-Traffic Pins · 39,500 to 96,200 Daily Views'
    },
    actionLabel: {
      uz: 'Jonli Xaritada sinab ko‘rish →',
      ru: 'Попробовать на живой карте →',
      en: 'Try It on the Live Map →'
    },
    actionSection: 'map-section'
  },
  {
    step: '02 / 05',
    title: {
      uz: '2-Qadam: Aqlli AI Tekshiruv (Maktab hududi va Davlat tili)',
      ru: 'Шаг 2: Умная AI-премодерация (Школьные зоны и Госязык)',
      en: 'Step 2: Instant Smart Pre-Check (School Zones & State Language)'
    },
    desc: {
      uz: 'Banner matningizni yozing yoki rasm yuklang. Tizim 2 soniyada maktab/masjid (200m) cheklovini, O‘zbek tili imlosini va 60 km/s tezlikda o‘qilishini tekshiradi.',
      ru: 'Введите слоган или загрузите макет. Система за 2 секунды проверит 200м зону у школ/мечетей, узбекскую орфографию и читаемость на скорости 60 км/ч.',
      en: 'Type your slogan or upload your banner. In 2 seconds, AdSpot checks 200m school/mosque zones, Uzbek state language spelling, and 60 km/h highway readability.'
    },
    visualMetric: {
      uz: 'Smart Reyting 98/100 · Rad etilish xavfi 0%',
      ru: 'Smart Рейтинг 98/100 · Нулевой риск отказа',
      en: 'Smart Score 98/100 · Zero Municipality Rejection Risk'
    },
    actionLabel: {
      uz: 'Banner tekshiruvini sinash →',
      ru: 'Проверить баннер сейчас →',
      en: 'Test Banner Pre-Check Now →'
    },
    actionSection: 'booking-section'
  },
  {
    step: '03 / 05',
    title: {
      uz: '3-Qadam: Kuniga 84,000 Yo‘lovchi Oqimi va Mijozlar Hisobi',
      ru: 'Шаг 3: Охват 84,000 человек в день и расчёт новых клиентов',
      en: 'Step 3: 84,000 Daily Commuters & Real Customer Conversion'
    },
    desc: {
      uz: 'Tasdiqlangan 1 ta bilbord kuniga o‘rtacha 84,000 haydovchi va piyodaga ko‘rinadi (oyiga 2.52 million ko‘rish). Kalkulyator orqali byudjetingiz qancha yangi mijoz olib kelishini hisoblang.',
      ru: 'Один проверенный щит даёт в среднем 84,000 контактов в сутки (2.52 млн в месяц). Рассчитайте точный возврат инвестиций в нашем калькуляторе трафика.',
      en: 'A single verified billboard reaches an average of 84,000 commuters daily (2.52M monthly impressions). Use the interactive calculator tab to forecast your store visits.'
    },
    visualMetric: {
      uz: 'Kuniga 84,000 qamrov = Oyiga 2,520,000 ko‘rish',
      ru: '84 000 в сутки = 2 520 000 показов в месяц',
      en: '84,000 Daily Reach = 2,520,000 Monthly Views'
    },
    actionLabel: {
      uz: '84K Oqim Kalkulyatorini ochish →',
      ru: 'Открыть калькулятор 84K трафика →',
      en: 'Open 84K Traffic Calculator →'
    },
    actionTab: 2
  },
  {
    step: '04 / 05',
    title: {
      uz: '4-Qadam: Chat Papkasida Joy Egasi Bilan To‘g‘ridan-To‘g‘ri Aloqa',
      ru: 'Шаг 4: Прямой чат с владельцем конструкции в папке чатов',
      en: 'Step 4: Direct Chat with Space Owners in the Chat Folder'
    },
    desc: {
      uz: 'Vositachilarsiz! Chat papkasida har bir bilbord egasi (Poytaxt Bilbord, OchiqShahar Digital, Toshkent Tashqi Media) yoki 24/7 AI yordamchi bilan savdolashing.',
      ru: 'Без посредников! В папке чатов общайтесь напрямую с владельцем выбранного щита, студией дизайна или умным AI-ассистентом 24/7.',
      en: 'No agency middlemen! Use the multi-thread Chat Folder to message the exact billboard owner, request a custom banner from Design Studio, or ask our 24/7 AI.'
    },
    visualMetric: {
      uz: '6 ta maxsus chat kanali · Vositachilarsiz narxlar',
      ru: '6 выделенных чатов · Прямые цены владельцев',
      en: '6 Dedicated Chat Channels · Direct Owner Pricing'
    },
    actionLabel: {
      uz: 'Chat Papkasini ochish →',
      ru: 'Открыть Папку Чатов →',
      en: 'Open Chat Folder →'
    },
    actionSection: 'chat-section'
  },
  {
    step: '05 / 05',
    title: {
      uz: '5-Qadam: Payme, Click Up yoki Didox Orqali 1-Klikda Band Qilish',
      ru: 'Шаг 5: Бронирование в 1 клик через Payme, Click Up или Didox ЭДО',
      en: 'Step 5: One-Click Booking via Payme, Click Up, or Didox E-Contract'
    },
    desc: {
      uz: 'Sanani tanlang va to‘lovni amalga oshiring. Sizga darhol fotohisobot va jonli statistika kabineti ochiladi.',
      ru: 'Выберите даты и оплатите онлайн. Вы сразу получаете фотоотчёт монтажа и доступ к живой аналитике показов в личном кабинете.',
      en: 'Select your campaign duration and pay securely via Payme, Click Up, or Didox B2B invoice. Track live daily impressions in your Business Owner Portal.'
    },
    visualMetric: {
      uz: '100% Xavfsiz To‘lov · Rasmiy Didox E-Shartnoma',
      ru: '100% Защита сделки · Официальный ЭДО Didox',
      en: '100% Escrow Protected · Instant Didox Tax Invoice'
    },
    actionLabel: {
      uz: 'To‘g‘ridan-to‘g‘ri bronlashga o‘tish →',
      ru: 'Перейти к прямому бронированию →',
      en: 'Go to Direct Checkout →'
    },
    actionSection: 'booking-section'
  }
];

function openGuideModal(tabIdx = 0) {
  const modal = document.getElementById('guide-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  switchGuideTab(tabIdx);
}

function closeGuideModal() {
  const modal = document.getElementById('guide-modal');
  if (modal) modal.classList.add('hidden');
  if (videoInterval) {
    clearInterval(videoInterval);
    videoInterval = null;
  }
}

function switchGuideTab(tabIdx) {
  currentGuideTab = tabIdx;
  [0, 1, 2, 3].forEach(i => {
    const btn = document.getElementById('gtab-' + i);
    if (!btn) return;
    btn.className = i === tabIdx
      ? 'px-3.5 py-2 rounded-full text-xs font-bold bg-[#284B63] text-[#FBF9F5] transition-all'
      : 'px-3.5 py-2 rounded-full text-xs font-semibold bg-[#F3EDE2] text-[#1B3249] hover:bg-[#EBE2D3] transition-all';
  });

  renderGuideModalContent();
}

function renderGuideModalContent() {
  const body = document.getElementById('guide-modal-body');
  if (!body) return;

  const uiText = {
    uz: {
      videoBadge: '▶ INTERAKTIV VIDEO YO‘RIQNOMA · QADAM',
      prevBtn: '← Oldingi qadam',
      nextBtn: 'Keyingi qadam →',
      stepHint: 'Yuqoridagi 1–5 raqamlarni yoki Keyingi tugmasini bosing',
      t1Kicker: '01 · TANLASH VA OLDINDAN TEKSHIRISH TIZIMI',
      t1Title: 'Nima uchun Pre-Check biznesingiz vaqti va pulini tejaydi?',
      t1Desc: 'Toshkentda maktab/masjid yaqinidagi (200m) yoki O‘zbek davlat tili imlosi xato bo‘lgan bannerlar chop etilgandan keyin rad etiladi. Bizning tizim to‘lovdan oldin 2 soniyada barchasini tekshiradi.',
      t1c1Title: '✓ 200m Masofa Radari',
      t1c1Desc: 'Har bir bilbord atrofidagi maktab, bog‘cha va masjidlarni avtomatik aniqlaydi.',
      t1c2Title: '✓ "Reklama to‘g‘risida"gi Qonun',
      t1c2Desc: 'O‘RQ-776 talabi bo‘yicha O‘zbek lotin imlosi (O‘, G‘) va til nisbatini tekshiradi.',
      t1c3Title: '✓ 3 Soniyalik Magistral Qoidasi',
      t1c3Desc: '60 km/s tezlikdagi haydovchilar 2.5 soniyada o‘qishi uchun ≤7 so‘z me’yorini tekshiradi.',
      t1Btn: 'Jonli Banner Skanerini Ochish →',
      t2Kicker: '02 · INTERAKTIV OQIM VA DAROMAD (ROI) KALKULYATORI',
      t2Title: 'Tasdiqlangan Bilbord Kuniga 84,000 Yo‘lovchini Qamrab Oladi',
      t2Desc: 'Quyidagi slayderlarni surib, kampaniya kunlari va ko‘cha oqimiga qarab jami ko‘rishlar va yangi mijozlar sonini hisoblang.',
      t2Slider1: 'Kunlik ko‘cha oqimi:',
      t2Slider2: 'Kampaniya muddati:',
      t2DayUnit: 'kun',
      t2Out1: 'Jami Tasdiqlangan Ko‘rishlar',
      t2Out2: 'Eslab Qolish (38%)',
      t2Out3: 'Tahminiy Mijozlar / Tashriflar',
      t2Out4: '1,000 Ko‘rish Narxi (CPM)',
      t3Kicker: '03 · JONLI KO‘RISHLAR TELEMETRIYASI',
      t3Title: 'Toshkent Bo‘ylab Soatbay Yo‘lovchi Oqimi Tahlili',
      t3Desc: 'Har bir AdSpot konstruksiyasi yo‘l datchiklari ma’lumotlarini birlashtirib, reklamangiz qaysi soatda eng ko‘p ko‘rilishini ko‘rsatadi.',
      t3c1Title: 'Ertalabki Tig‘iz Vaqt (07:30 – 10:00)',
      t3c1Sub: 'Amir Temur va Buyuk Ipak Yo‘lida maksimal oqim',
      t3c2Title: 'Kunduzgi Savdo Oqimi (12:00 – 16:00)',
      t3c2Sub: 'Chilonzor Qatortol va Shota Rustavelida yuqori faollik',
      t3c3Title: 'Kechki LED Cho‘qqisi (17:30 – 22:30)',
      t3c3Sub: 'Bunyodkor va Darxon 4K LED ekranlarida yorqin qamrov'
    },
    ru: {
      videoBadge: '▶ ИНТЕРАКТИВНЫЙ ВИДЕО-ГИД · ШАГ',
      prevBtn: '← Предыдущий шаг',
      nextBtn: 'Следующий шаг →',
      stepHint: 'Нажимайте шаги 1–5 выше или кнопку Далее',
      t1Kicker: '01 · СИСТЕМА ПОДБОРА И ПРЕМОДЕРАЦИИ PRE-CHECK',
      t1Title: 'Почему Pre-Check экономит время и бюджет вашего бизнеса',
      t1Desc: 'В Ташкенте баннеры вблизи школ/мечетей (200м) или с ошибками в узбекском тексте отклоняются после печати. Наша система проверяет макет за 2 секунды до оплаты.',
      t1c1Title: '✓ Радар 200м зон',
      t1c1Desc: 'Автоматически определяет школы, детсады и мечети вокруг каждой точки.',
      t1c2Title: '✓ Закон «О рекламе» РУз',
      t1c2Desc: 'Проверяет узбекскую орфографию (O‘, G‘) и языковые пропорции по ЗРУ-776.',
      t1c3Title: '✓ Правило 3 секунд на трассе',
      t1c3Desc: 'Контролирует длину слогана (до 7 слов) для чтения на скорости 60 км/ч.',
      t1Btn: 'Запустить Живой Сканер Баннера →',
      t2Kicker: '02 · ИНТЕРАКТИВНЫЙ КАЛЬКУЛЯТОР ТРАФИКА И ROI',
      t2Title: 'Проверенный Билборд Охватывает 84,000 Человек Ежедневно',
      t2Desc: 'Двигайте ползунки трафика и длительности кампании ниже, чтобы рассчитать показы и новых клиентов.',
      t2Slider1: 'Суточный поток улицы:',
      t2Slider2: 'Длительность кампании:',
      t2DayUnit: 'дней',
      t2Out1: 'Всего Проверенных Показов',
      t2Out2: 'Запоминаемость (38%)',
      t2Out3: 'Ожидаемые Визиты / Лиды',
      t2Out4: 'Цена за 1,000 показов (CPM)',
      t3Kicker: '03 · ЖИВАЯ ТЕЛЕМЕТРИЯ ПОКАЗОВ',
      t3Title: 'Почасовая Разбивка Трафика По Улицам Ташкента',
      t3Desc: 'Каждая конструкция AdSpot объединяет данные дорожных датчиков, показывая часы пикового контакта с вашей рекламой.',
      t3c1Title: 'Утренний час пик (07:30 – 10:00)',
      t3c1Sub: 'Максимум на пр. Амира Темура и Буюк Ипак Йули',
      t3c2Title: 'Дневной ритейл-поток (12:00 – 16:00)',
      t3c2Sub: 'Пик активности на Чиланзаре и Шота Руставели',
      t3c3Title: 'Вечерний LED-пик (17:30 – 22:30)',
      t3c3Sub: 'Максимальный охват на 4K LED экранах Бунёдкор и Дархан'
    },
    en: {
      videoBadge: '▶ INTERACTIVE VIDEO WALKTHROUGH · STEP',
      prevBtn: '← Previous Step',
      nextBtn: 'Next Step →',
      stepHint: 'Click steps 1–5 above or Next to explore',
      t1Kicker: '01 · SELECT & PRE-CHECK ENGINE',
      t1Title: 'Why Pre-Check Saves Your Business Time & Money',
      t1Desc: 'In Tashkent, outdoor banners near schools or mosques (within 200m) or with incorrect Uzbek state language spelling get rejected after printing. Our Pre-Check engine verifies your creative before you pay a single UZS.',
      t1c1Title: '✓ 200m Proximity Radar',
      t1c1Desc: 'Automatically detects schools, kindergartens, mosques, and hospitals around every pin.',
      t1c2Title: '✓ Law "On Advertising" Check',
      t1c2Desc: 'Validates Uzbek Latin apostrophes (O‘, G‘) and bilingual text ratios required by ZRU-776.',
      t1c3Title: '✓ 3-Second Highway Rule',
      t1c3Desc: 'Ensures drivers at 60 km/h can read your headline in under 2.5 seconds (max 7 words).',
      t1Btn: 'Launch Live Banner Scanner Now →',
      t2Kicker: '02 · INTERACTIVE COMMUTER & ROI CALCULATOR',
      t2Title: 'A Verified Billboard Reaches 84,000 Commuters Daily',
      t2Desc: 'Slide the campaign days and daily street traffic below to calculate your exact impressions and new customers.',
      t2Slider1: 'Daily Street Commuters:',
      t2Slider2: 'Campaign Duration:',
      t2DayUnit: 'Days',
      t2Out1: 'Total Verified Views',
      t2Out2: 'Ad Recall (38%)',
      t2Out3: 'Est. Store Visits / Leads',
      t2Out4: 'Cost per 1,000 Views',
      t3Kicker: '03 · LIVE IMPRESSION TELEMETRY',
      t3Title: 'Real-Time Hourly Traffic Breakdown Across Tashkent',
      t3Desc: 'Every AdSpot structure combines Tashkent road sensor counts with municipal corridor data so you see exactly when commuters view your ad.',
      t3c1Title: 'Morning Rush (07:30 – 10:00)',
      t3c1Sub: 'Peak on Amir Temur & Buyuk Ipak Yuli',
      t3c2Title: 'Midday Retail (12:00 – 16:00)',
      t3c2Sub: 'Peak on Chilanzar Qatortol & Shota Rustaveli',
      t3c3Title: 'Evening LED Peak (17:30 – 22:30)',
      t3c3Sub: 'Peak on Bunyodkor & Darxon 4K LED Screens'
    }
  }[currentLang];

  if (currentGuideTab === 0) {
    const s = VIDEO_GUIDE_STEPS[currentVideoStep];
    const pct = ((currentVideoStep + 1) / VIDEO_GUIDE_STEPS.length) * 100;
    body.innerHTML = `
      <div class="rounded-2xl bg-[#1B3249] text-[#FBF9F5] p-6 border border-[#D4B895]/30 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="px-3 py-1 rounded-full bg-[#284B63] text-[#D4B895] text-xs font-extrabold tracking-wider">
            ${uiText.videoBadge} ${s.step}
          </span>
          <div class="flex items-center gap-1.5">
            ${VIDEO_GUIDE_STEPS.map((_, idx) => `
              <button onclick="jumpVideoStep(${idx})" class="w-7 h-7 rounded-full text-xs font-bold ${idx === currentVideoStep ? 'bg-[#D4B895] text-[#1B3249]' : 'bg-[#284B63] text-[#EBE2D3]'}">
                ${idx + 1}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="rounded-xl bg-[#284B63]/65 border border-[#D4B895]/30 p-6 min-h-[175px] flex flex-col justify-between">
          <div class="space-y-2">
            <div class="text-xl md:text-2xl font-extrabold text-[#FBF9F5]">${s.title[currentLang]}</div>
            <p class="text-sm text-[#EBE2D3]/90 leading-relaxed">${s.desc[currentLang]}</p>
          </div>
          <div class="mt-4 pt-3 border-t border-[#D4B895]/25 flex flex-wrap items-center justify-between gap-3">
            <span class="inline-flex items-center gap-2 text-xs font-bold text-[#D4B895]">
              <span class="w-2.5 h-2.5 rounded-full bg-[#D4B895] animate-ping"></span>
              ${s.visualMetric[currentLang]}
            </span>
            <button onclick="${s.actionTab !== undefined ? `switchGuideTab(${s.actionTab})` : `closeGuideModal(); document.getElementById('${s.actionSection}').scrollIntoView({behavior:'smooth'})`}" class="px-4 py-2 rounded-full bg-[#D4B895] text-[#1B3249] text-xs font-extrabold hover:bg-[#EBE2D3] transition-all">
              ${s.actionLabel[currentLang]}
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <div class="w-full h-2 rounded-full bg-[#284B63] overflow-hidden">
            <div class="h-full bg-[#D4B895] transition-all duration-300" style="width:${pct}%"></div>
          </div>
          <div class="flex items-center justify-between">
            <button onclick="prevVideoStep()" class="px-4 py-2 rounded-full bg-[#284B63] text-[#FBF9F5] text-xs font-bold hover:bg-[#3A6585]">
              ${uiText.prevBtn}
            </button>
            <span class="text-xs text-[#D4B895] font-semibold">${uiText.stepHint}</span>
            <button onclick="nextVideoStep()" class="px-5 py-2 rounded-full bg-[#D4B895] text-[#1B3249] text-xs font-extrabold hover:bg-[#EBE2D3]">
              ${uiText.nextBtn}
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (currentGuideTab === 1) {
    body.innerHTML = `
      <div class="space-y-4">
        <div class="p-5 rounded-2xl bg-[#EBE2D3]/70 border border-[#C8AD8D]/60 space-y-2">
          <span class="text-xs font-extrabold uppercase tracking-wider text-[#284B63]">${uiText.t1Kicker}</span>
          <h4 class="text-lg font-extrabold text-[#1B3249]">${uiText.t1Title}</h4>
          <p class="text-xs text-[#5A6B7C] leading-relaxed">${uiText.t1Desc}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div class="p-4 rounded-xl bg-[#FBF9F5] border border-[#C8AD8D]/50 space-y-1.5">
            <div class="font-extrabold text-[#284B63]">${uiText.t1c1Title}</div>
            <p class="text-[#5A6B7C]">${uiText.t1c1Desc}</p>
          </div>
          <div class="p-4 rounded-xl bg-[#FBF9F5] border border-[#C8AD8D]/50 space-y-1.5">
            <div class="font-extrabold text-[#284B63]">${uiText.t1c2Title}</div>
            <p class="text-[#5A6B7C]">${uiText.t1c2Desc}</p>
          </div>
          <div class="p-4 rounded-xl bg-[#FBF9F5] border border-[#C8AD8D]/50 space-y-1.5">
            <div class="font-extrabold text-[#284B63]">${uiText.t1c3Title}</div>
            <p class="text-[#5A6B7C]">${uiText.t1c3Desc}</p>
          </div>
        </div>
        <div class="flex justify-end">
          <button onclick="closeGuideModal(); document.getElementById('booking-section').scrollIntoView({behavior:'smooth'});" class="btn-cobalt-pill px-5 py-2.5 text-xs">
            ${uiText.t1Btn}
          </button>
        </div>
      </div>
    `;
  } else if (currentGuideTab === 2) {
    body.innerHTML = `
      <div class="space-y-5">
        <div class="p-5 rounded-2xl bg-[#1B3249] text-[#FBF9F5] border border-[#D4B895]/30 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#D4B895]">${uiText.t2Kicker}</span>
            <h4 class="text-xl font-extrabold mt-0.5">${uiText.t2Title}</h4>
            <p class="text-xs text-[#EBE2D3]/80 mt-1">${uiText.t2Desc}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-[#F3EDE2] border border-[#C8AD8D]/55 space-y-2">
            <div class="flex justify-between text-xs font-bold text-[#1B3249]">
              <span>${uiText.t2Slider1}</span>
              <span id="calc-traffic-lbl" class="text-[#284B63] font-extrabold">84,000</span>
            </div>
            <input id="calc-traffic-slider" type="range" min="45000" max="115000" step="1000" value="84000" oninput="updateTrafficCalculator()" class="w-full accent-[#284B63] cursor-pointer" />
          </div>

          <div class="p-4 rounded-xl bg-[#F3EDE2] border border-[#C8AD8D]/55 space-y-2">
            <div class="flex justify-between text-xs font-bold text-[#1B3249]">
              <span>${uiText.t2Slider2}</span>
              <span id="calc-days-lbl" class="text-[#284B63] font-extrabold">30 ${uiText.t2DayUnit}</span>
            </div>
            <input id="calc-days-slider" type="range" min="7" max="90" step="1" value="30" oninput="updateTrafficCalculator()" class="w-full accent-[#284B63] cursor-pointer" />
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div class="p-4 rounded-xl bg-[#FBF9F5] border border-[#C8AD8D]/50">
            <div class="text-[11px] font-semibold text-[#5A6B7C]">${uiText.t2Out1}</div>
            <div id="calc-out-views" class="text-xl font-extrabold text-[#284B63] mt-1">2,520,000</div>
          </div>
          <div class="p-4 rounded-xl bg-[#FBF9F5] border border-[#C8AD8D]/50">
            <div class="text-[11px] font-semibold text-[#5A6B7C]">${uiText.t2Out2}</div>
            <div id="calc-out-recall" class="text-xl font-extrabold text-[#1B3249] mt-1">957,600</div>
          </div>
          <div class="p-4 rounded-xl bg-[#FBF9F5] border border-[#C8AD8D]/50">
            <div class="text-[11px] font-semibold text-[#5A6B7C]">${uiText.t2Out3}</div>
            <div id="calc-out-leads" class="text-xl font-extrabold text-[#284B63] mt-1">3,780</div>
          </div>
          <div class="p-4 rounded-xl bg-[#EBE2D3] border border-[#C8AD8D]">
            <div class="text-[11px] font-semibold text-[#1B3249]">${uiText.t2Out4}</div>
            <div id="calc-out-cpm" class="text-xl font-extrabold text-[#284B63] mt-1">2,060 UZS</div>
          </div>
        </div>
      </div>
    `;
  } else {
    body.innerHTML = `
      <div class="space-y-4">
        <div class="p-5 rounded-2xl bg-[#EBE2D3]/70 border border-[#C8AD8D]/60">
          <span class="text-xs font-extrabold uppercase tracking-wider text-[#284B63]">${uiText.t3Kicker}</span>
          <h4 class="text-lg font-extrabold text-[#1B3249] mt-0.5">${uiText.t3Title}</h4>
          <p class="text-xs text-[#5A6B7C] mt-1">${uiText.t3Desc}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div class="p-4 rounded-xl bg-[#FBF9F5] border border-[#C8AD8D]/50 space-y-1">
            <div class="text-[#5A6B7C] font-semibold">${uiText.t3c1Title}</div>
            <div class="text-lg font-extrabold text-[#284B63]">31,400</div>
            <div class="text-[11px] text-[#1B3249]">${uiText.t3c1Sub}</div>
          </div>
          <div class="p-4 rounded-xl bg-[#FBF9F5] border border-[#C8AD8D]/50 space-y-1">
            <div class="text-[#5A6B7C] font-semibold">${uiText.t3c2Title}</div>
            <div class="text-lg font-extrabold text-[#284B63]">22,800</div>
            <div class="text-[11px] text-[#1B3249]">${uiText.t3c2Sub}</div>
          </div>
          <div class="p-4 rounded-xl bg-[#FBF9F5] border border-[#C8AD8D]/50 space-y-1">
            <div class="text-[#5A6B7C] font-semibold">${uiText.t3c3Title}</div>
            <div class="text-lg font-extrabold text-[#284B63]">44,900</div>
            <div class="text-[11px] text-[#1B3249]">${uiText.t3c3Sub}</div>
          </div>
        </div>
      </div>
    `;
  }
}

function jumpVideoStep(idx) {
  currentVideoStep = idx;
  renderGuideModalContent();
}

function nextVideoStep() {
  currentVideoStep = (currentVideoStep + 1) % VIDEO_GUIDE_STEPS.length;
  renderGuideModalContent();
}

function prevVideoStep() {
  currentVideoStep = (currentVideoStep - 1 + VIDEO_GUIDE_STEPS.length) % VIDEO_GUIDE_STEPS.length;
  renderGuideModalContent();
}

function updateTrafficCalculator() {
  const traffic = parseInt(document.getElementById('calc-traffic-slider').value, 10) || 84000;
  const days = parseInt(document.getElementById('calc-days-slider').value, 10) || 30;
  const dayUnit = currentLang === 'uz' ? 'kun' : (currentLang === 'ru' ? 'дней' : 'Days');

  const totalViews = traffic * days;
  const recall = Math.round(totalViews * 0.38);
  const leads = Math.round(totalViews * 0.0015);
  const cpm = Math.round((5200000 * (days / 30)) / (totalViews / 1000));

  document.getElementById('calc-traffic-lbl').textContent = formatNum(traffic);
  document.getElementById('calc-days-lbl').textContent = `${days} ${dayUnit}`;
  document.getElementById('calc-out-views').textContent = formatNum(totalViews);
  document.getElementById('calc-out-recall').textContent = formatNum(recall);
  document.getElementById('calc-out-leads').textContent = formatNum(leads);
  document.getElementById('calc-out-cpm').textContent = formatNum(cpm) + ' UZS';
}

/* ==========================================================================
   3. HERO FEATURE PILLS & 3D SPATIAL ROOM
   ========================================================================== */
function renderHeroPills() {
  const row = document.getElementById('hero-pills-row');
  if (!row) return;
  const pills = (window.ADSPOT_I18N[currentLang].hero && window.ADSPOT_I18N[currentLang].hero.pills) || [];
  row.innerHTML = pills.map(label => `
    <span class="guarrent-feature-pill">
      <span class="w-4 h-4 rounded-full bg-[#284B63] text-[#EBE2D3] inline-flex items-center justify-center">
        <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      ${label}
    </span>
  `).join('');
}

function handleTunnelMouseMove(e) {
  const wrapper = document.getElementById('tunnel-wrapper');
  const room = document.getElementById('tunnel-room');
  if (!wrapper || !room) return;

  const rect = wrapper.getBoundingClientRect();
  const relX = (e.clientX - rect.left) / rect.width - 0.5;
  const relY = (e.clientY - rect.top) / rect.height - 0.5;

  const rotY = relX * 18;
  const rotX = -relY * 14;
  room.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
}

function resetTunnelTilt() {
  const room = document.getElementById('tunnel-room');
  if (room) room.style.transform = 'rotateX(0deg) rotateY(0deg)';
}

function toggleTunnelAnimation() {
  const wrapper = document.getElementById('tunnel-wrapper');
  const room = document.getElementById('tunnel-room');
  const svgIcon = document.getElementById('tunnel-play-svg');
  if (!wrapper || !room) return;

  room.classList.remove('tunnel-boost');
  void room.offsetWidth;
  room.classList.add('tunnel-boost');

  isTunnelPlaying = !isTunnelPlaying;
  wrapper.classList.toggle('tunnel-paused', !isTunnelPlaying);
  if (svgIcon) {
    svgIcon.innerHTML = isTunnelPlaying ? SVG_ICONS.pauseBars : SVG_ICONS.playTriangle;
  }
}

function selectTunnelSpot(spotId) {
  selectedSpotId = spotId;
  applyMapFilters();
  document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   4. 3-LANGUAGE SWITCHER (UZ / RU / EN)
   ========================================================================== */
function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  ['uz', 'ru', 'en'].forEach(l => {
    const btn = document.getElementById('lang-btn-' + l);
    if (!btn) return;
    btn.className = l === lang
      ? 'px-3 py-1 rounded-full bg-[#284B63] text-[#FBF9F5] shadow-sm transition-all'
      : 'px-3 py-1 rounded-full text-[#5A6B7C] hover:text-[#1B3249] transition-all';
  });

  const dict = window.ADSPOT_I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = getNested(dict, el.getAttribute('data-i18n'));
    if (val) el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = getNested(dict, el.getAttribute('data-i18n-placeholder'));
    if (val) el.setAttribute('placeholder', val);
  });

  renderHeroPills();
  applyMapFilters();
  runAdvisoryScenario(currentAdvisoryPreset);
  renderGuideModalContent();
  renderChatFolderList();
  renderChatMessages();
  renderPortalView();
}

/* ==========================================================================
   5. WORKING MAP (100% Free OpenStreetMap + Vector Map + Visual Street Preview)
   ========================================================================== */
function setMapMode(mode) {
  // If Leaflet is unavailable (e.g. offline sandbox), gracefully use vector mode
  if (mode === 'gps' && typeof window.L === 'undefined') {
    mode = 'vector';
  }
  currentMapMode = mode;
  const svgMap = document.getElementById('tashkent-svg-map');
  const gpsMap = document.getElementById('tashkent-leaflet-map');
  const btnVec = document.getElementById('map-mode-vector');
  const btnGps = document.getElementById('map-mode-gps');

  if (btnVec && btnGps) {
    btnVec.className = mode === 'vector'
      ? 'px-3 py-1 rounded-full text-[11px] font-bold bg-[#284B63] text-[#FBF9F5] transition-all'
      : 'px-3 py-1 rounded-full text-[11px] font-bold text-[#1B3249] hover:text-[#284B63] transition-all';
    btnGps.className = mode === 'gps'
      ? 'px-3 py-1 rounded-full text-[11px] font-bold bg-[#284B63] text-[#FBF9F5] transition-all'
      : 'px-3 py-1 rounded-full text-[11px] font-bold text-[#1B3249] hover:text-[#284B63] transition-all';
  }

  if (mode === 'gps' && typeof window.L !== 'undefined') {
    if (svgMap) svgMap.classList.add('hidden');
    if (gpsMap) gpsMap.classList.remove('hidden');
    initOrUpdateLeafletMap();
  } else {
    if (gpsMap) gpsMap.classList.add('hidden');
    if (svgMap) svgMap.classList.remove('hidden');
  }
}

function initOrUpdateLeafletMap() {
  if (typeof window.L === 'undefined') return;
  const container = document.getElementById('tashkent-leaflet-map');
  if (!container) return;

  if (!leafletMap) {
    leafletMap = L.map('tashkent-leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([41.3085, 69.2690], 12);

    // 100% Free OpenStreetMap Standard Tiles (NEVER requires an API key!)
    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors · AdSpot Tashkent',
      maxZoom: 19
    });

    // Automatic fallback to Esri World Street Map if OSM is blocked on a network
    osmLayer.on('tileerror', function () {
      if (!leafletMap._esriFallbackAdded) {
        leafletMap._esriFallbackAdded = true;
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri & OpenStreetMap · AdSpot Tashkent',
          maxZoom: 19
        }).addTo(leafletMap);
      }
    });

    osmLayer.addTo(leafletMap);
    leafletMarkersGroup = L.layerGroup().addTo(leafletMap);
  }

  setTimeout(() => {
    leafletMap.invalidateSize();
  }, 150);

  renderLeafletMarkers();
}

function renderLeafletMarkers() {
  if (!leafletMap || !leafletMarkersGroup) return;
  leafletMarkersGroup.clearLayers();

  const dist = document.getElementById('filter-district').value;
  const fmt = document.getElementById('filter-format').value;
  const filtered = window.ADSPOT_SPOTS.filter(s => {
    return (dist === 'all' || s.district === dist) && (fmt === 'all' || s.format === fmt);
  });

  filtered.forEach(s => {
    if (!s.lat || !s.lng) return;
    const isSel = s.id === selectedSpotId;
    const priceTag = (s.monthlyPriceUZS / 1000000).toFixed(1) + 'M UZS';

    if (s.sensitiveZone) {
      L.circle([s.lat, s.lng], {
        radius: 200,
        color: '#8C7355',
        fillColor: '#D4B895',
        fillOpacity: 0.28,
        weight: 1.8,
        dashArray: '4 4'
      }).addTo(leafletMarkersGroup);
    }

    const bg = isSel ? '#284B63' : '#1B3249';
    const border = isSel ? '#D4B895' : '#C8AD8D';
    const icon = L.divIcon({
      className: 'custom-gps-pin',
      html: `<div style="background:${bg};color:#FBF9F5;border:2.5px solid ${border};border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 8px 18px rgba(27,50,73,0.38);transform:${isSel ? 'scale(1.16)' : 'scale(1)'};cursor:pointer;">${s.id} · ${priceTag}</div>`,
      iconSize: [110, 28],
      iconAnchor: [55, 14]
    });

    const marker = L.marker([s.lat, s.lng], { icon }).addTo(leafletMarkersGroup);
    marker.on('click', () => {
      selectSpotFromMap(s.id);
    });
  });
}

function selectSpotFromMap(spotId) {
  selectedSpotId = spotId;
  applyMapFilters();
  const s = window.ADSPOT_SPOTS.find(x => x.id === spotId);
  if (s && leafletMap && currentMapMode === 'gps' && s.lat && s.lng) {
    leafletMap.flyTo([s.lat, s.lng], 14, { duration: 0.6 });
  }
}

function applyMapFilters() {
  const distEl = document.getElementById('filter-district');
  const fmtEl = document.getElementById('filter-format');
  const dist = distEl ? distEl.value : 'all';
  const fmt = fmtEl ? fmtEl.value : 'all';

  const filtered = window.ADSPOT_SPOTS.filter(s => {
    return (dist === 'all' || s.district === dist) && (fmt === 'all' || s.format === fmt);
  });

  if (filtered.length > 0 && !filtered.some(s => s.id === selectedSpotId)) {
    selectedSpotId = filtered[0].id;
  }

  renderMapPins(filtered);
  renderQuickSpotButtons(filtered);
  if (currentMapMode === 'gps') {
    renderLeafletMarkers();
  }
  renderInspectorCard();
  updateCheckoutTotal();
}

function renderQuickSpotButtons(spots) {
  const bar = document.getElementById('map-quick-spot-buttons');
  if (!bar) return;
  bar.innerHTML = spots.map(s => {
    const isSel = s.id === selectedSpotId;
    const priceM = (s.monthlyPriceUZS / 1000000).toFixed(1) + 'M';
    return `
      <button onclick="selectSpotFromMap('${s.id}')" class="px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
        isSel
          ? 'bg-[#284B63] text-[#FBF9F5] shadow-sm ring-2 ring-[#D4B895]'
          : 'bg-[#FBF9F5] border border-[#C8AD8D]/60 text-[#1B3249] hover:border-[#284B63]'
      }">
        ${s.id} · ${s.districtLabel[currentLang]} (${priceM})
      </button>
    `;
  }).join('');
}

function renderMapPins(spots) {
  const layer = document.getElementById('map-pins-layer');
  if (!layer) return;
  layer.innerHTML = '';

  spots.forEach(s => {
    const isSel = s.id === selectedSpotId;
    const priceTag = (s.monthlyPriceUZS / 1000000).toFixed(1) + 'M';
    const fill = isSel ? '#284B63' : '#1B3249';
    const strokeFill = isSel ? '#D4B895' : '#C8AD8D';
    const textFill = isSel ? '#FBF9F5' : '#EBE2D3';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'map-pin-node');
    g.onclick = () => {
      selectSpotFromMap(s.id);
    };

    g.innerHTML = `
      ${isSel ? `<circle cx="${s.mapX}" cy="${s.mapY}" r="24" fill="rgba(40,75,99,0.26)" class="pulse-halo"/>` : ''}
      <rect x="${s.mapX - 30}" y="${s.mapY - 14}" width="60" height="25" rx="12.5" fill="${fill}" stroke="${strokeFill}" stroke-width="1.8"/>
      <text x="${s.mapX}" y="${s.mapY + 2}" text-anchor="middle" fill="${textFill}" font-size="10.5" font-weight="800">
        ${priceTag}
      </text>
    `;
    layer.appendChild(g);
  });
}

function toggleStreetPreviewTime() {
  streetPreviewNightMode = !streetPreviewNightMode;
  renderInspectorCard();
}

function renderInspectorCard() {
  const s = window.ADSPOT_SPOTS.find(x => x.id === selectedSpotId) || window.ADSPOT_SPOTS[0];
  const dict = window.ADSPOT_I18N[currentLang].mapSection;

  document.getElementById('insp-badge').textContent = `${s.id} · ${s.formatLabel[currentLang]}`;
  document.getElementById('insp-traffic-pill').innerHTML = `${SVG_ICONS.eyePulse}<span>${formatNum(s.dailyTraffic)} ${dict.trafficBadge}</span>`;
  document.getElementById('insp-title').textContent = s.title[currentLang];
  document.getElementById('insp-street').innerHTML = `${SVG_ICONS.pinRadar}<span>${s.street[currentLang]}</span>`;
  document.getElementById('insp-price').textContent = formatNum(s.monthlyPriceUZS);
  document.getElementById('insp-dimensions').textContent = s.dimensions;
  document.getElementById('insp-owner').textContent = s.owner;
  document.getElementById('insp-note').innerHTML = `${s.sensitiveZone ? SVG_ICONS.warnTriangle : SVG_ICONS.checkCircle}<span>${s.sensitiveNote[currentLang]}</span>`;

  // Render Realistic Street-Level Visual Billboard Preview (#insp-visual-preview)
  const previewBox = document.getElementById('insp-visual-preview');
  if (previewBox) {
    const skyBg = streetPreviewNightMode
      ? 'linear-gradient(180deg, #0F1E2E 0%, #1B3249 70%, #243B53 100%)'
      : 'linear-gradient(180deg, #284B63 0%, #3E6B89 65%, #D4B895 100%)';
    const boardGlow = s.format === 'led'
      ? '0 0 22px rgba(212,184,149,0.65)'
      : '0 8px 18px rgba(15,30,46,0.45)';
    const formatTag = s.formatLabel[currentLang].toUpperCase();

    previewBox.style.background = skyBg;
    previewBox.innerHTML = `
      <div class="p-3.5 space-y-2.5">
        <div class="flex items-center justify-between text-[10px] font-bold">
          <span class="px-2 py-0.5 rounded-full bg-[#1B3249]/85 text-[#D4B895] border border-[#D4B895]/40">
            ${dict.streetViewBadge || 'STREET VIEW'} · ${formatTag}
          </span>
          <button onclick="toggleStreetPreviewTime()" class="px-2.5 py-0.5 rounded-full bg-[#FBF9F5]/90 text-[#1B3249] hover:bg-[#FBF9F5] transition-all">
            ${streetPreviewNightMode ? (dict.dayModeBtn || '☀ Switch to Day View') : (dict.nightModeBtn || '☾ Switch to Night LED View')}
          </button>
        </div>

        <!-- Realistic Billboard Structure Mockup on the Street -->
        <div class="flex flex-col items-center pt-1">
          <div class="w-full max-w-[290px] rounded-lg bg-[#FBF9F5] text-[#1B3249] p-2.5 border-4 border-[#1B3249]" style="box-shadow:${boardGlow};">
            <div class="flex items-center justify-between text-[9px] font-extrabold text-[#284B63] uppercase tracking-wider">
              <span>${s.districtLabel[currentLang]} · ${s.dimensions}</span>
              <span>GPS: ${s.lat ? s.lat.toFixed(3) : '41.311'}°N</span>
            </div>
            <div class="text-xs font-extrabold text-[#1B3249] truncate mt-0.5">${s.title[currentLang]}</div>
            <div class="mt-1 flex items-center justify-between text-[10px] bg-[#EBE2D3] px-2 py-1 rounded font-bold text-[#284B63]">
              <span>${dict.yourAdHere || 'YOUR BRAND AD HERE'}</span>
              <span>${formatNum(s.dailyTraffic)} ${dict.viewsDayShort || 'views/day'}</span>
            </div>
          </div>
          <!-- Steel Pillar & Roadway -->
          <div class="w-3 h-5 bg-[#8C7355] border-x border-[#1B3249]"></div>
          <div class="w-full h-3 rounded-full bg-[#1B3249]/90 border-t border-[#D4B895]/40 flex items-center justify-around px-6">
            <span class="w-4 h-0.5 bg-[#D4B895]"></span>
            <span class="w-4 h-0.5 bg-[#D4B895]"></span>
            <span class="w-4 h-0.5 bg-[#D4B895]"></span>
          </div>
        </div>
      </div>
    `;
  }

  const checkoutName = document.getElementById('checkout-spot-name');
  if (checkoutName) checkoutName.textContent = `${s.id} · ${s.title[currentLang]}`;
}

/* ==========================================================================
   6. SMART ADVISORY + LIVE SLOGAN SCANNER & DIRECT CHECKOUT
   ========================================================================== */
function runAdvisoryScenario(key) {
  currentAdvisoryPreset = key;
  const preset = window.ADSPOT_ADVISORY_PRESETS[key];
  if (!preset) return;

  ['school_conflict', 'grammar_clutter', 'family_optimal'].forEach(k => {
    const btn = document.getElementById('scen-' + k);
    if (!btn) return;
    btn.className = k === key
      ? 'px-3.5 py-2 rounded-full text-xs font-bold bg-[#284B63] text-[#FBF9F5] shadow-sm transition-all'
      : 'px-3.5 py-2 rounded-full text-xs font-semibold bg-[#FBF9F5] border border-[#C8AD8D]/55 text-[#1B3249] hover:border-[#284B63] transition-all';
  });

  const scoreLbl = window.ADSPOT_I18N[currentLang].bookingSection.smartScoreLbl || 'Smart Score';
  document.getElementById('adv-score').textContent = `${scoreLbl}: ${preset.score} / 100`;
  document.getElementById('adv-headline').textContent = preset.headline[currentLang];
  document.getElementById('adv-quote').textContent = preset.quote[currentLang];

  document.getElementById('adv-checks').innerHTML = preset.checks[currentLang]
    .map(item => {
      const isOk = typeof item === 'object' ? item.ok : true;
      const text = typeof item === 'object' ? item.text : item;
      const icon = isOk ? SVG_ICONS.checkCircle : SVG_ICONS.warnTriangle;
      const pillStyle = isOk
        ? 'bg-[#FBF9F5] border-[#284B63]/25 text-[#1B3249]'
        : 'bg-[#EBE2D3] border-[#8C7355]/40 text-[#1B3249]';
      return `<span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border font-semibold ${pillStyle}">${icon}<span>${text}</span></span>`;
    })
    .join('');
}

/* Live Custom Slogan Scanner (#live-slogan-input) */
function evaluateLiveSloganText() {
  const input = document.getElementById('live-slogan-input');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) {
    runAdvisoryScenario(currentAdvisoryPreset);
    return;
  }

  const words = raw.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = raw.toLowerCase();
  const s = window.ADSPOT_SPOTS.find(x => x.id === selectedSpotId) || window.ADSPOT_SPOTS[0];

  const hasRestrictedWords = /(energy|energetik|энергетик|casino|kazino|bet|stavka|alkogol|alcohol|beer|pivo|fast food|burger)/i.test(lower);
  const hasStraightApostrophe = /\b[ogOG]'/.test(raw);

  let score = 96;
  const checks = [];

  if (wordCount <= 7) {
    const okMsg = {
      uz: `Tezkor o‘qilish: ${wordCount} ta so‘z (60 km/s uchun ideal ≤ 7 so‘z)`,
      ru: `Читаемость на 60 км/ч: ${wordCount} слов (Норма ≤ 7 слов)`,
      en: `Highway Readability: ${wordCount} words (Optimal ≤ 7 words for 60 km/h)`
    };
    checks.push({ ok: true, text: okMsg[currentLang] });
  } else {
    score -= 26;
    const warnMsg = {
      uz: `Matn uzun: ${wordCount} ta so‘z (60 km/s tezlikda ≤ 7 so‘z o‘qiladi)`,
      ru: `Слишком длинно: ${wordCount} слов (Рекомендуется ≤ 7 слов)`,
      en: `Too Long: ${wordCount} words (Drivers at 60 km/h only read ≤ 7 words)`
    };
    checks.push({ ok: false, text: warnMsg[currentLang] });
  }

  if (hasRestrictedWords && s.sensitiveZone) {
    score -= 40;
    const zWarn = {
      uz: `200m Maktab/Masjid cheklovi (${s.id}): CHIL-02 ga o‘tkazing`,
      ru: `Конфликт зоны 200м (${s.id}): Перенесите на CHIL-02`,
      en: `200m Sensitive Zone Conflict on ${s.id}: Reroute to CHIL-02`
    };
    checks.push({ ok: false, text: zWarn[currentLang] });
  } else {
    const zOk = {
      uz: `Hududga moslik tasdiqlandi: ${s.id} (${s.districtLabel.uz})`,
      ru: `Локация проверена: ${s.id} (${s.districtLabel.ru})`,
      en: `Zone Fit Verified for ${s.id} (${s.districtLabel.en})`
    };
    checks.push({ ok: true, text: zOk[currentLang] });
  }

  if (hasStraightApostrophe) {
    score -= 14;
    const tWarn = {
      uz: `O‘zbek imlosi: to‘g‘ri O‘ / G‘ apostrofini qo‘llang`,
      ru: `Узбекская орфография: используйте правильный апостроф O‘ / G‘`,
      en: `Uzbek Typography Tip: Replace straight apostrophe (') with O‘ / G‘`
    };
    checks.push({ ok: false, text: tWarn[currentLang] });
  } else {
    const tOk = {
      uz: `O‘RQ-776 "Reklama to‘g‘risida"gi Qonun imlosiga mos`,
      ru: `Соответствует нормам Закона «О рекламе» (ЗРУ-776)`,
      en: `Uzbek Law "On Advertising" (ZRU-776) Typography Ready`
    };
    checks.push({ ok: true, text: tOk[currentLang] });
  }

  score = Math.max(25, score);
  const scoreLbl = window.ADSPOT_I18N[currentLang].bookingSection.smartScoreLbl || 'Smart Score';
  document.getElementById('adv-score').textContent = `${scoreLbl}: ${score} / 100`;

  const headByLang = {
    uz: `Jonli shior tahlili: "${raw}"`,
    ru: `Живой анализ слогана: «${raw}»`,
    en: `Live Slogan Scan: "${raw}"`
  };
  document.getElementById('adv-headline').textContent = headByLang[currentLang];

  const quoteOk = {
    uz: `✓ Ajoyib shior! "${raw}" (${wordCount} so‘z) 60 km/s tezlikda aniq o‘qiladi va ${s.id} (${s.title.uz}) nuqtasiga 100% mos.`,
    ru: `✓ Отличный слоган! «${raw}» (${wordCount} слов) легко читается на скорости 60 км/ч и готов к размещению на ${s.id} (${s.title.ru}).`,
    en: `✓ Great slogan! "${raw}" (${wordCount} words) is clear, readable at 60 km/h, and ready for ${s.id} (${s.title.en}).`
  };
  const quoteWarn = {
    uz: `⚠ Tavsiya: Matnni ≤ 7 so‘zgacha qisqartiring yoki CHIL-02 (Bunyodkor LED) ekraniga o‘tkazing.`,
    ru: `⚠ Рекомендация: Сократите текст до ≤ 7 слов или переключитесь на экран CHIL-02 (Бунёдкор).`,
    en: `⚠ Optimization needed: Please shorten to ≤ 7 words or switch to CHIL-02 (Bunyodkor Highway) for maximum approval speed.`
  };
  document.getElementById('adv-quote').textContent = score >= 80 ? quoteOk[currentLang] : quoteWarn[currentLang];

  document.getElementById('adv-checks').innerHTML = checks.map(item => {
    const icon = item.ok ? SVG_ICONS.checkCircle : SVG_ICONS.warnTriangle;
    const pillStyle = item.ok
      ? 'bg-[#FBF9F5] border-[#284B63]/25 text-[#1B3249]'
      : 'bg-[#EBE2D3] border-[#8C7355]/40 text-[#1B3249]';
    return `<span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border font-semibold ${pillStyle}">${icon}<span>${item.text}</span></span>`;
  }).join('');
}

function handleCustomBannerUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = document.getElementById('custom-uploaded-img');
    img.src = ev.target.result;
    img.classList.remove('hidden');
    runAdvisoryScenario('family_optimal');
  };
  reader.readAsDataURL(file);
}

function switchSpotToAlternative() {
  const s = window.ADSPOT_SPOTS.find(x => x.id === selectedSpotId);
  selectedSpotId = (s && s.alternativeSpotId) ? s.alternativeSpotId : 'CHIL-02';
  applyMapFilters();
  runAdvisoryScenario('family_optimal');
}

function selectPaymentGateway(gateway) {
  selectedPaymentGateway = gateway;
  ['Payme', 'Click Up', 'Didox'].forEach(g => {
    const btn = document.getElementById('pay-btn-' + g);
    if (!btn) return;
    btn.className = g === gateway
      ? 'py-2.5 rounded-xl bg-[#1B3249] text-[#FBF9F5] transition-all'
      : 'py-2.5 rounded-xl bg-[#F3EDE2] border border-[#C8AD8D]/50 text-[#1B3249] transition-all';
  });
}

function updateCheckoutTotal() {
  const s = window.ADSPOT_SPOTS.find(x => x.id === selectedSpotId) || window.ADSPOT_SPOTS[0];
  const durEl = document.getElementById('booking-duration');
  const factor = parseFloat((durEl && durEl.value) || '1');
  const total = Math.round((s.monthlyPriceUZS * factor) / 10000) * 10000;
  const el = document.getElementById('checkout-total-price');
  if (el) el.textContent = formatNum(total) + ' UZS';
}

async function confirmDirectBooking() {
  const s = window.ADSPOT_SPOTS.find(x => x.id === selectedSpotId) || window.ADSPOT_SPOTS[0];
  const startDate = document.getElementById('booking-start-date').value || '2026-11-08';
  const durationFactor = parseFloat(document.getElementById('booking-duration').value || '1');
  const daysTotal = durationFactor === 1 ? 30 : (durationFactor < 1 ? 14 : (durationFactor < 2 ? 60 : 90));

  const newCampaign = {
    id: 'CMP-' + Math.floor(200 + Math.random() * 700),
    spotId: s.id,
    status: 'live',
    daysElapsed: 1,
    daysTotal,
    title: {
      uz: s.title.uz,
      ru: s.title.ru,
      en: s.title.en
    },
    views: s.dailyTraffic,
    lift: '+28%'
  };

  if (isBackendConnected) {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId: s.id,
          startDate,
          durationFactor,
          paymentMethod: selectedPaymentGateway
        })
      });
      if (res.ok) {
        const created = await res.json();
        newCampaign.id = created.campaignId || newCampaign.id;
      }
    } catch (e) {}
  }

  activeCampaigns.unshift(newCampaign);

  const toast = document.getElementById('booking-toast-banner');
  const toastTxt = document.getElementById('booking-toast-text');
  if (toast && toastTxt) {
    toastTxt.textContent = `✓ ${newCampaign.id} (${s.id}) booked for ${daysTotal} days via ${selectedPaymentGateway}!`;
    toast.classList.remove('hidden');
  }

  switchPortalTab('business');
  setTimeout(() => {
    document.getElementById('portals-section').scrollIntoView({ behavior: 'smooth' });
  }, 400);
}

/* ==========================================================================
   7. SPACE OWNER MODAL: ADD NEW BILLBOARD TO SQLITE DB & MAP
   ========================================================================== */
function openAddSpotModal() {
  const modal = document.getElementById('add-spot-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAddSpotModal() {
  const modal = document.getElementById('add-spot-modal');
  if (modal) modal.classList.add('hidden');
}

async function submitNewSpotForm(e) {
  e.preventDefault();
  const title = document.getElementById('new-spot-title').value.trim();
  const district = document.getElementById('new-spot-district').value;
  const format = document.getElementById('new-spot-format').value;
  const street = document.getElementById('new-spot-street').value.trim();
  const monthlyPriceUZS = parseInt(document.getElementById('new-spot-price').value, 10) || 6400000;
  const dailyTraffic = parseInt(document.getElementById('new-spot-traffic').value, 10) || 76000;

  let addedSpot = null;
  if (isBackendConnected) {
    try {
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, district, format, street, monthlyPriceUZS, dailyTraffic })
      });
      if (res.ok) {
        const data = await res.json();
        addedSpot = data.spot;
      }
    } catch (err) {}
  }

  if (!addedSpot) {
    const newId = 'TAS-0' + (window.ADSPOT_SPOTS.length + 1);
    addedSpot = {
      id: newId,
      district,
      districtLabel: { uz: district, ru: district, en: district },
      title: { uz: title, ru: title, en: title },
      street: { uz: street, ru: street, en: street },
      format,
      formatLabel: { uz: 'LED Ekran', ru: 'LED Экран', en: 'LED Screen' },
      dimensions: '6.0m × 3.0m',
      dailyTraffic,
      monthlyPriceUZS,
      owner: currentUser.company || 'Poytaxt Bilbord Servis',
      sensitiveZone: false,
      sensitiveNote: {
        uz: 'Tasdiqlangan yangi reklama nuqtasi.',
        ru: 'Проверенная новая рекламная конструкция.',
        en: 'Newly verified outdoor ad structure.'
      },
      alternativeSpotId: 'CHIL-02',
      lat: 41.3180,
      lng: 69.2680,
      mapX: 340,
      mapY: 195
    };
  }

  window.ADSPOT_SPOTS.push(addedSpot);
  selectedSpotId = addedSpot.id;
  closeAddSpotModal();
  applyMapFilters();
  renderPortalView();
  document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   8. CHAT FOLDER INBOX & SMART QUESTION-ANSWERING AI / OWNER ENGINE
   ========================================================================== */
function renderChatFolderList() {
  const folderEl = document.getElementById('chat-folder-list');
  if (!folderEl) return;

  folderEl.innerHTML = CHAT_THREADS.map(t => {
    const isSel = t.id === currentChatThreadId;
    const msgs = t.messages[currentLang] || [];
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].text : '';
    return `
      <button onclick="selectChatThread('${t.id}')" class="w-full text-left p-3 rounded-xl transition-all border ${
        isSel
          ? 'bg-[#284B63] text-[#FBF9F5] border-[#284B63] shadow-sm'
          : 'bg-[#FBF9F5] text-[#1B3249] border-[#C8AD8D]/45 hover:border-[#284B63]'
      }">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-extrabold truncate">${t.name[currentLang]}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
            isSel ? 'bg-[#D4B895] text-[#1B3249]' : 'bg-[#EBE2D3] text-[#284B63]'
          }">${t.badge}</span>
        </div>
        <div class="text-[11px] mt-0.5 truncate ${isSel ? 'text-[#EBE2D3]/90' : 'text-[#5A6B7C]'}">${t.subtitle[currentLang]}</div>
        <div class="text-[10px] mt-1 truncate ${isSel ? 'text-[#D4B895]' : 'text-[#8C7355]'}">${lastMsg}</div>
      </button>
    `;
  }).join('');
}

function selectChatThread(threadId) {
  currentChatThreadId = threadId;
  const thread = CHAT_THREADS.find(t => t.id === threadId) || CHAT_THREADS[0];
  thread.unread = 0;

  const tabOwner = document.getElementById('chat-tab-owner');
  const tabAi = document.getElementById('chat-tab-ai');
  if (tabOwner && tabAi) {
    tabAi.className = thread.type === 'ai' ? 'btn-cobalt-pill px-4 py-2 text-xs' : 'btn-white-pill px-4 py-2 text-xs';
    tabOwner.className = thread.type !== 'ai' ? 'btn-cobalt-pill px-4 py-2 text-xs' : 'btn-white-pill px-4 py-2 text-xs';
  }

  renderChatFolderList();
  renderChatMessages();
}

function switchChatTab(tab) {
  if (tab === 'ai') {
    selectChatThread('ai');
  } else {
    // Find thread matching currently selected map spot
    const matching = CHAT_THREADS.find(t => t.spotIds && t.spotIds.includes(selectedSpotId));
    selectChatThread(matching ? matching.id : 'YUN-01');
  }
}

function openOwnerChatForCurrentSpot() {
  const s = window.ADSPOT_SPOTS.find(x => x.id === selectedSpotId) || window.ADSPOT_SPOTS[0];
  const matching = CHAT_THREADS.find(t => t.spotIds && t.spotIds.includes(s.id)) || CHAT_THREADS[1];
  currentChatThreadId = matching.id;

  const list = matching.messages[currentLang];
  const priceStr = formatNum(s.monthlyPriceUZS) + ' UZS';
  const introByLang = {
    uz: `Assalomu alaykum! Siz xaritada ${s.id} (${s.title.uz}, ${priceStr}/oy) nuqtasini tanladingiz. Ushbu joy bo‘yicha qanday savolingiz bor?`,
    ru: `Здравствуйте! Вы выбрали на карте точку ${s.id} (${s.title.ru}, ${priceStr}/мес). Какой вопрос у вас по этой конструкции?`,
    en: `Hello! You selected spot ${s.id} (${s.title.en}, ${priceStr}/mo) on the map. What would you like to know about availability, printing, or discounts?`
  };

  list.push({
    from: 'partner',
    name: matching.name[currentLang],
    text: introByLang[currentLang]
  });

  renderChatFolderList();
  renderChatMessages();
  document.getElementById('chat-section').scrollIntoView({ behavior: 'smooth' });
}

function renderChatMessages() {
  const thread = CHAT_THREADS.find(t => t.id === currentChatThreadId) || CHAT_THREADS[0];
  const onlineNowTxt = (window.ADSPOT_I18N[currentLang].chatSection && window.ADSPOT_I18N[currentLang].chatSection.onlineNow) || '● Online Now';
  const headerEl = document.getElementById('chat-active-header');
  if (headerEl) {
    headerEl.innerHTML = `
      <div>
        <div class="text-xs font-extrabold text-[#1B3249] flex items-center gap-1.5">
          ${SVG_ICONS.shieldCheck}
          <span>${thread.name[currentLang]}</span>
        </div>
        <div class="text-[11px] text-[#5A6B7C]">${thread.subtitle[currentLang]}</div>
      </div>
      <span class="px-2.5 py-1 rounded-full bg-[#EBE2D3] text-[#284B63] text-[10px] font-bold">${onlineNowTxt}</span>
    `;
  }

  // Render quick question chips so users can test different questions with 1 click
  const chipsEl = document.getElementById('chat-quick-chips');
  if (chipsEl) {
    const chipsByLang = {
      uz: [
        'Eng arzon joy qancha?',
        'Chilonzorda qanday ekranlar bor?',
        'Banner o‘lchami va chop etish narxi?',
        'Maktab yonida qanday qoida bor?',
        'Chegirma va Payme/Didox to‘lov?'
      ],
      ru: [
        'Какая самая низкая цена?',
        'Что есть в Чиланзаре?',
        'Какие размеры и печать баннера?',
        'Правила у школ и госязык?',
        'Есть ли скидки и оплата Didox?'
      ],
      en: [
        'What is the cheapest spot?',
        'Which spots are in Chilanzar?',
        'What banner dimensions & printing?',
        'What are the school zone & language rules?',
        'Do you offer discounts or Didox invoice?'
      ]
    };
    const chips = chipsByLang[currentLang] || chipsByLang.en;
    chipsEl.innerHTML = chips.map(q => `
      <button type="button" onclick="sendQuickChatQuestion('${q.replace(/'/g, "\\'")}')" class="px-3 py-1 rounded-full bg-[#FBF9F5] border border-[#C8AD8D]/60 text-[11px] font-semibold text-[#1B3249] hover:bg-[#284B63] hover:text-[#FBF9F5] transition-all">
        ${q}
      </button>
    `).join('');
  }

  const box = document.getElementById('chat-messages-box');
  if (!box) return;
  const list = thread.messages[currentLang] || [];
  box.innerHTML = list.map(m => {
    if (m.from === 'user') {
      return `<div class="flex justify-end"><div class="px-4 py-2.5 rounded-2xl bg-[#284B63] text-[#FBF9F5] font-semibold text-xs max-w-md shadow-sm">${m.text}</div></div>`;
    }
    return `<div class="flex justify-start"><div class="px-4 py-2.5 rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D]/45 text-xs max-w-md shadow-xs"><div class="font-bold text-[#284B63] mb-0.5 flex items-center gap-1.5">${SVG_ICONS.shieldCheck}<span>${m.name}</span></div><div class="text-[#1B3249]/90 leading-relaxed">${m.text}</div></div></div>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
}

function sendQuickChatQuestion(qText) {
  const input = document.getElementById('chat-input-field');
  if (input) {
    input.value = qText;
    handleChatSubmit(new Event('submit'));
  }
}

/* Context-Aware Smart Question Answering Engine (UZ / RU / EN) */
function generateSmartChatReply(userText, threadId, lang) {
  const q = userText.toLowerCase();
  const thread = CHAT_THREADS.find(t => t.id === threadId) || CHAT_THREADS[0];
  const s = window.ADSPOT_SPOTS.find(x => x.id === selectedSpotId) || window.ADSPOT_SPOTS[0];

  // 1. Price / Cost / Cheapest / Budget
  if (/(price|cost|how much|cheap|budget|expensive|uzs|million|narx|qancha|arzon|byudjet|pul|цена|сколько|стоит|дешев|бюджет)/i.test(q)) {
    const replies = {
      uz: `Narxlarimiz formatga qarab farqlanadi:
• Eng hamyonbop: YAK-01 (Shota Rustaveli bekati) — 2,400,000 UZS/oy (52K oqim) va YUN-02 (Mega Planet bekati) — 2,900,000 UZS/oy (64K oqim).
• Standart 6m×3m Bilbordlar: CHIL-01 (Chilonzor) — 4,800,000 UZS/oy, YUN-01 (Amir Temur) — 5,200,000 UZS/oy, MIR-01 — 6,100,000 UZS/oy.
• Premium 4K LED Ekranlar: CHIL-02 (Bunyodkor) — 7,500,000 UZS/oy (112K oqim).
Hozir tanlangan ${s.id} nuqtasi narxi: ${formatNum(s.monthlyPriceUZS)} UZS/oy.`,
      ru: `Актуальные цены по Ташкенту:
• Самые бюджетные (Остановки): YAK-01 (Шота Руставели) — 2,400,000 UZS/мес (52К поток) и YUN-02 (Mega Planet) — 2,900,000 UZS/мес.
• Билборды 6м×3м: CHIL-01 (Чиланзар) — 4,800,000 UZS/мес, YUN-01 (Амир Темур) — 5,200,000 UZS/мес, MIR-01 — 6,100,000 UZS/мес.
• 4K LED Экраны: CHIL-02 (Бунёдкор) — 7,500,000 UZS/мес (112К поток в сутки).
Выбранная сейчас точка ${s.id} стоит ${formatNum(s.monthlyPriceUZS)} UZS/мес.`,
      en: `Here is our exact Tashkent pricing breakdown:
• Most Affordable (Bus Shelters): YAK-01 (Shota Rustaveli) at 2,400,000 UZS/mo (52K daily views) & YUN-02 (Mega Planet) at 2,900,000 UZS/mo (64K views).
• Standard 6m×3m Billboards: CHIL-01 (Chilanzar) at 4,800,000 UZS/mo, YUN-01 (Amir Temur) at 5,200,000 UZS/mo, MIR-01 at 6,100,000 UZS/mo.
• Premium 4K LED Screens: CHIL-02 (Bunyodkor Highway) at 7,500,000 UZS/mo (112,000 daily views).
Your currently selected spot (${s.id}) is ${formatNum(s.monthlyPriceUZS)} UZS/month.`
    };
    return replies[lang] || replies.en;
  }

  // 2. Districts / Locations (Chilanzar, Yunusabad, Mirzo Ulugbek, Yakkasaray, etc.)
  if (/(chilanzar|chilonzor|чиланзар|yunusabad|yunusobod|юнусабад|mirzo|мирзо|yakkasar|яккасар|district|where|location|street|tuman|qayer|ko‘cha|район|где|улиц)/i.test(q)) {
    const replies = {
      uz: `Tumanlar bo‘yicha tasdiqlangan nuqtalarimiz:
• Chilonzor: CHIL-01 (Qatortol Savdo Markazi, 4.8M UZS, 78K oqim) va CHIL-02 (Bunyodkor 4K LED, 7.5M UZS, 112K oqim).
• Yunusobod: YUN-01 (Amir Temur Xiyoboni, 5.2M UZS, 84K oqim) va YUN-02 (Mega Planet bekati, 2.9M UZS, 64K oqim).
• Mirzo Ulug‘bek: MIR-01 (Buyuk Ipak Yo‘li metro, 6.1M UZS, 91K oqim).
• Yakkasaroy: YAK-01 (Shota Rustaveli BRT bekati, 2.4M UZS, 52K oqim).`,
      ru: `Проверенные точки по районам Ташкента:
• Чиланзар: CHIL-01 (ТЦ Катартал, 4.8M UZS, 78К поток) и CHIL-02 (Бунёдкор 4K LED, 7.5M UZS, 112К поток).
• Юнусабад: YUN-01 (Сквер Амира Темура, 5.2M UZS, 84К поток) и YUN-02 (Mega Planet, 2.9M UZS, 64К поток).
• Мирзо-Улугбек: MIR-01 (метро Буюк Ипак Йули, 6.1M UZS, 91К поток).
• Яккасарай: YAK-01 (Шота Руставели BRT, 2.4M UZS, 52К поток).`,
      en: `Here are our verified spots by Tashkent district:
• Chilanzar: CHIL-01 (Qatortol Trade Center, 4.8M UZS, 78K daily views) & CHIL-02 (Bunyodkor 4K LED, 7.5M UZS, 112K daily views).
• Yunusabad: YUN-01 (Amir Temur Square, 5.2M UZS, 84K views) & YUN-02 (Mega Planet Shelter, 2.9M UZS, 64K views).
• Mirzo Ulugbek: MIR-01 (Buyuk Ipak Yuli Metro, 6.1M UZS, 91K views).
• Yakkasaray: YAK-01 (Shota Rustaveli BRT Shelter, 2.4M UZS, 52K views).`
    };
    return replies[lang] || replies.en;
  }

  // 3. Dimensions / Size / Printing / Format / LED Video Specs
  if (/(size|dimension|print|banner|format|led|video|pixel|resolution|vinyl|o‘lcham|razmer|chop|pechat|размер|печать|формат|видео|монтаж)/i.test(q)) {
    const replies = {
      uz: `Texnik o‘lchamlar va chop etish shartlari:
• Standart Bilbordlar (YUN-01, CHIL-01, MIR-01): 6.0m × 3.0m (Vinil banner 510g, 300 DPI). Chop etish va o‘rnatish 24 soat ichida.
• 4K LED Ekranlar (CHIL-02): 8.0m × 4.0m (1920×1080 px, MP4 yoki PNG, 10 soniyalik rolik har 60 soniyada chiqadi). Efirga chiqish 15 daqiqada!
• Avtobus bekatlari (YUN-02, YAK-01): 1.2m × 1.8m (CityLight ichki yoritish bilan).`,
      ru: `Технические размеры и условия печати:
• Билборды (YUN-01, CHIL-01, MIR-01): 6.0м × 3.0м (винил 510г, 300 DPI). Печать и монтаж за 24 часа.
• 4K LED Экраны (CHIL-02): 8.0м × 4.0м (1920×1080 px, MP4 или PNG, ролик 10 сек каждые 60 сек). Запуск в эфир за 15 минут!
• Остановки CityLight (YUN-02, YAK-01): 1.2м × 1.8м с внутренней подсветкой.`,
      en: `Technical dimensions & production specs:
• Standard Billboards (YUN-01, CHIL-01, MIR-01): 6.0m × 3.0m (weatherproof 510g vinyl, 300 DPI). Printing + mounting takes 24 hours.
• 4K LED Screens (CHIL-02): 8.0m × 4.0m (1920×1080 px, MP4/PNG, 10-second slot playing every 60 seconds). Goes live in 15 minutes!
• Bus Shelters (YUN-02, YAK-01): 1.2m × 1.8m backlit CityLight poster.`
    };
    return replies[lang] || replies.en;
  }

  // 4. Law / School Zones / Mosque Zones / Uzbek Language Compliance
  if (/(school|mosque|law|legal|rule|language|uzbek|fine|reject|maktab|masjid|qonun|til|imlo|школа|мечеть|закон|язык|штраф)/i.test(q)) {
    const replies = {
      uz: `O‘zbekiston Respublikasi "Reklama to‘g‘risida"gi Qonuni (O‘RQ-776) bo‘yicha 3 ta asosiy qoida:
1. Davlat tili: Reklama matni davlat tilida (O‘zbek lotin alifbosida, to‘g‘ri O‘ va G‘ harflari bilan) bo‘lishi shart.
2. 200m Maktab va Masjid hududi: YUN-01 va MIR-01 maktab/masjidga yaqin bo‘lgani uchun energetik ichimlik va zararli mahsulotlar taqiqlanadi (ularni CHIL-02 Bunyodkor LED ekraniga joylashtiramiz).
3. Tezkor o‘qilish: Haydovchilar uchun 7 tadan ko‘p bo‘lmagan so‘z tavsiya etiladi.`,
      ru: `По Закону РУз «О рекламе» (ЗРУ-776) действуют 3 ключевых правила:
1. Государственный язык: Текст на узбекском языке обязателен (с правильными апострофами O‘ и G‘).
2. Зона 200м у школ и мечетей: На точках YUN-01 и MIR-01 запрещены энергетики и фастфуд (для них идеально подходит CHIL-02 на Бунёдкоре).
3. Читаемость: Не более 7 слов для скорости потока 60 км/ч.`,
      en: `Under Uzbekistan's Law "On Advertising" (ZRU-776), our Pre-Check verifies 3 rules:
1. State Language: Advertisements must include accurate Uzbek Latin text (proper O‘ and G‘ apostrophes).
2. 200m School & Mosque Buffer: Spots YUN-01 and MIR-01 are near schools/mosques, so energy drinks or restricted categories are automatically rerouted to CHIL-02 (Bunyodkor Highway).
3. Highway Readability: Maximum 7 words so drivers at 60 km/h read your message in 2.5 seconds.`
    };
    return replies[lang] || replies.en;
  }

  // 5. Discounts / Payment / Payme / Click / Didox / Contract
  if (/(discount|pay|payme|click|didox|contract|invoice|escrow|chegirma|to‘lov|shartnoma|скидк|оплат|договор|счет)/i.test(q)) {
    const replies = {
      uz: `To‘lov va chegirmalar:
• 14 kunlik Sprint: oylik narxning 55% qismi.
• 60 kun (2 oy): -10% rasmiy chegirma.
• 90 kun (Choraklik): -18% maksimal chegirma!
To‘lovlar Payme, Click Up yoki korporativ mijozlar uchun Didox E-Shartnoma (ЭДО) orqali 100% xavfsiz amalga oshiriladi.`,
      ru: `Условия оплаты и скидки:
• Спринт 14 дней: 55% от месячного тарифа.
• 60 дней (2 месяца): скидка -10%.
• 90 дней (квартал): максимальная скидка -18%!
Оплата через Payme, Click Up или официальный электронный договор Didox (ЭДО) с НДС.`,
      en: `Payment options & multi-month discounts:
• 14-Day Sprint: 55% of the monthly rate.
• 60 Days (2 Months): 10% automatic discount.
• 90 Days (Quarterly): 18% automatic discount!
You can pay securely via Payme, Click Up, or official B2B Didox E-Invoice with escrow protection.`
    };
    return replies[lang] || replies.en;
  }

  // 6. Tailored contextual fallback referencing the user's exact question & selected spot
  const fallbacks = {
    uz: `Savolingiz uchun rahmat ("${userText}")! Hozir xaritada ${s.id} · ${s.title.uz} (${s.street.uz}) nuqtasi tanlangan:
• Kunlik oqim: ${formatNum(s.dailyTraffic)} yo‘lovchi/kun
• Oylik narx: ${formatNum(s.monthlyPriceUZS)} UZS (${s.dimensions})
• Egasi: ${s.owner}
Ushbu joyni band qilish uchun yuqoridagi "To‘g‘ridan-to‘g‘ri band qilish" tugmasini bosing yoki aniq byudjetingizni yozing!`,
    ru: `Спасибо за ваш вопрос («${userText}»)! Сейчас выбрана точка ${s.id} · ${s.title.ru} (${s.street.ru}):
• Суточный поток: ${formatNum(s.dailyTraffic)} авто и пешеходов
• Цена: ${formatNum(s.monthlyPriceUZS)} UZS/мес (${s.dimensions})
• Владелец: ${s.owner}
Мы можем забронировать эту конструкцию прямо сейчас или подобрать вариант под ваш бюджет!`,
    en: `Great question about "${userText}"! Based on your currently selected spot ${s.id} · ${s.title.en} (${s.street.en}):
• Verified Daily Traffic: ${formatNum(s.dailyTraffic)} commuters/day
• Monthly Rate: ${formatNum(s.monthlyPriceUZS)} UZS (${s.dimensions})
• Space Owner: ${s.owner}
Would you like to reserve ${s.id} now, or should I compare it with another district for your budget?`
  };
  return fallbacks[lang] || fallbacks.en;
}

async function handleChatSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('chat-input-field');
  if (!input) return;
  const txt = input.value.trim();
  if (!txt) return;
  input.value = '';

  const thread = CHAT_THREADS.find(t => t.id === currentChatThreadId) || CHAT_THREADS[0];
  const list = thread.messages[currentLang];
  list.push({ from: 'user', text: txt });
  renderChatMessages();

  const smartReply = generateSmartChatReply(txt, currentChatThreadId, currentLang);
  setTimeout(() => {
    list.push({
      from: 'partner',
      name: thread.name[currentLang],
      text: smartReply
    });
    renderChatFolderList();
    renderChatMessages();
  }, 220);
}

function requestDesignerInChat() {
  selectChatThread('design');
  const thread = CHAT_THREADS.find(t => t.id === 'design');
  const s = window.ADSPOT_SPOTS.find(x => x.id === selectedSpotId) || window.ADSPOT_SPOTS[0];
  if (thread) {
    thread.messages[currentLang].push({
      from: 'partner',
      name: thread.name[currentLang],
      text: `✓ Design request opened for ${s.id} (${s.title[currentLang]}, ${s.dimensions}). Tell us your brand name and offer text below!`
    });
    renderChatMessages();
  }
  document.getElementById('chat-section').scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   9. INTERACTIVE ROLE PORTALS (Business Owner, Space Owner, Admin)
   ========================================================================== */
function switchPortalTab(tab) {
  currentPortalTab = tab;
  ['business', 'owner', 'admin'].forEach(t => {
    const btn = document.getElementById('ptab-' + t);
    if (!btn) return;
    btn.className = t === tab
      ? 'btn-cobalt-pill px-4 py-2.5 text-xs'
      : 'btn-white-pill px-4 py-2.5 text-xs';
  });
  renderPortalView();
}

function toggleCampaignStatus(idx) {
  const c = activeCampaigns[idx];
  if (!c) return;
  c.status = c.status === 'paused' ? 'live' : 'paused';
  renderPortalView();
}

function extendCampaignDays(idx) {
  const c = activeCampaigns[idx];
  if (!c) return;
  c.daysTotal = (c.daysTotal || 30) + 7;
  const numViews = typeof c.views === 'number' ? c.views : parseInt(String(c.views).replace(/,/g, ''), 10) || 450000;
  c.views = numViews + 185000;
  renderPortalView();
}

function adjustOwnerSpotPrice(spotId, deltaUZS) {
  const s = window.ADSPOT_SPOTS.find(x => x.id === spotId);
  if (!s) return;
  s.monthlyPriceUZS = Math.max(1200000, s.monthlyPriceUZS + deltaUZS);
  applyMapFilters();
  renderPortalView();
}

function toggleOwnerSpotAvailability(spotId) {
  const s = window.ADSPOT_SPOTS.find(x => x.id === spotId);
  if (!s) return;
  s.ownerStatus = s.ownerStatus === 'maintenance' ? 'available' : 'maintenance';
  renderPortalView();
}

function requestOwnerPayout() {
  const banner = document.getElementById('owner-payout-toast');
  if (banner) {
    const txId = Math.floor(10000 + Math.random() * 90000);
    const msgByLang = {
      uz: `✓ Didox E-Hisobvaraq to‘lovi #DDX-${txId} yuborildi! Mablag‘ (38,400,000 UZS) 2 bank soati ichida hisob raqamingizga tushadi.`,
      ru: `✓ Выплата по ЭДО Didox #DDX-${txId} отправлена! Средства (38,400,000 UZS) поступят на ваш расчетный счет в течение 2 банковских часов.`,
      en: `✓ Didox E-Invoice Payout #DDX-${txId} initiated! Funds (38,400,000 UZS) will arrive on your corporate settlement account within 2 banking hours.`
    };
    banner.textContent = msgByLang[currentLang] || msgByLang.en;
    banner.classList.remove('hidden');
  }
}

function handleAdminModeration(itemId, decision) {
  const item = adminModerationQueue.find(x => x.id === itemId);
  if (!item) return;
  item.status = decision;
  renderPortalView();
}

function renderPortalView() {
  const box = document.getElementById('portal-view-container');
  if (!box) return;
  const p = window.ADSPOT_I18N[currentLang].portalsSection;
  const mapDict = window.ADSPOT_I18N[currentLang].mapSection;
  const dayWord = currentLang === 'uz' ? 'kun' : (currentLang === 'ru' ? 'дней' : 'days');

  if (currentPortalTab === 'business') {
    box.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#C8AD8D]/35">
          <div class="text-xs font-bold text-[#1B3249]">
            ${p.bizHeaderInfo || 'Active Outdoor Campaigns'} (${activeCampaigns.length})
          </div>
          <button onclick="document.getElementById('map-section').scrollIntoView({behavior:'smooth'})" class="px-3.5 py-1.5 rounded-full bg-[#284B63] text-[#FBF9F5] text-xs font-bold hover:bg-[#1B3249] transition-all">
            ${p.bizAddAnotherBtn || '+ Book Another Tashkent Spot'}
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${activeCampaigns.map((c, idx) => {
            const titleTxt = typeof c.title === 'object' ? c.title[currentLang] : c.title;
            const isPaused = c.status === 'paused';
            const viewsFormatted = typeof c.views === 'number' ? formatNum(c.views) : c.views;
            const daysLabel = c.daysTotal ? `${c.daysElapsed || 1} / ${c.daysTotal} ${dayWord}` : (typeof c.days === 'object' ? c.days[currentLang] : c.days);

            return `
              <div class="p-5 rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D]/55 space-y-3 shadow-xs">
                <div class="flex items-center justify-between text-xs">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold ${isPaused ? 'bg-[#EBE2D3] text-[#8C7355]' : 'bg-[#284B63] text-[#FBF9F5]'}">
                    <span>${c.spotId} · ${isPaused ? '⏸ ' + (p.pausedLbl || 'Paused') : '● ' + p.liveLbl}</span>
                  </span>
                  <span class="text-[#5A6B7C] font-bold">${daysLabel}</span>
                </div>
                <div class="text-lg font-extrabold text-[#1B3249]">${titleTxt}</div>
                <div class="flex items-center justify-between text-xs pt-2 border-t border-[#C8AD8D]/35">
                  <span class="inline-flex items-center gap-1.5 text-[#1B3249]">${SVG_ICONS.eyePulse}<strong>${viewsFormatted}</strong> ${p.impressionsLbl}</span>
                  <span class="font-bold text-[#284B63]">${c.lift} ${p.footTrafficLbl}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2 pt-2">
                  <button onclick="toggleCampaignStatus(${idx})" class="px-3 py-1.5 rounded-lg bg-[#EBE2D3] text-[#1B3249] text-[11px] font-bold hover:bg-[#D4B895] transition-all">
                    ${isPaused ? (p.btnResumeAd || '▶ Resume Campaign') : (p.btnPauseAd || '⏸ Pause Ad')}
                  </button>
                  <button onclick="extendCampaignDays(${idx})" class="px-3 py-1.5 rounded-lg bg-[#284B63] text-[#FBF9F5] text-[11px] font-bold hover:bg-[#1B3249] transition-all">
                    ${p.btnExtend7d || '+ Extend 7 Days'}
                  </button>
                  <button onclick="selectSpotFromMap('${c.spotId}'); document.getElementById('map-section').scrollIntoView({behavior:'smooth'});" class="px-3 py-1.5 rounded-lg border border-[#C8AD8D] text-[#1B3249] text-[11px] font-semibold hover:border-[#284B63]">
                    ${p.btnInspectMap || 'Inspect on Map →'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (currentPortalTab === 'owner') {
    box.innerHTML = `
      <div class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-5 rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D]/45 shadow-xs">
            <div class="text-xs text-[#5A6B7C] font-semibold">${p.ownerEarningsLbl}</div>
            <div class="text-2xl font-extrabold text-[#284B63] mt-1">38,400,000 UZS</div>
            <button onclick="requestOwnerPayout()" class="mt-2.5 px-3.5 py-1.5 rounded-lg bg-[#284B63] text-[#FBF9F5] text-xs font-bold hover:bg-[#1B3249] transition-all">
              ${p.ownerWithdrawBtn || 'Withdraw via Didox E-Invoice →'}
            </button>
          </div>
          <div class="p-5 rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D]/45 shadow-xs">
            <div class="text-xs text-[#5A6B7C] font-semibold">${p.activeBookingsLbl}</div>
            <div class="text-2xl font-extrabold text-[#1B3249] mt-1">${activeCampaigns.length + 12} ${p.campaignsCount}</div>
            <div class="text-xs text-[#5A6B7C] mt-1.5">${p.nextPayoutLbl}</div>
          </div>
          <div class="p-5 rounded-2xl bg-[#1B3249] text-[#FBF9F5] flex flex-col justify-between border border-[#D4B895]/30">
            <div class="text-sm font-bold">${p.listNewTitle}</div>
            <button onclick="openAddSpotModal()" class="btn-cobalt-pill mt-3 py-2.5 px-4 text-xs justify-center">
              ${p.listNewBtn}
            </button>
          </div>
        </div>

        <div id="owner-payout-toast" class="hidden p-3.5 rounded-xl bg-[#284B63] text-[#FBF9F5] text-xs font-bold"></div>

        <!-- Interactive Inventory Control Table for Space Owners -->
        <div class="rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D]/55 p-4 space-y-3">
          <div class="text-xs font-extrabold text-[#1B3249] uppercase tracking-wider">
            ${p.ownerTableHeader || 'Your Listed Structures'} (${window.ADSPOT_SPOTS.length})
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${window.ADSPOT_SPOTS.map(s => {
              const isMaint = s.ownerStatus === 'maintenance';
              return `
                <div class="p-3.5 rounded-xl bg-[#F3EDE2] border border-[#C8AD8D]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <div class="font-extrabold text-[#1B3249]">${s.id} · ${s.title[currentLang]}</div>
                    <div class="text-[#5A6B7C] text-[11px]">${formatNum(s.monthlyPriceUZS)} ${mapDict.perMonth} · ${formatNum(s.dailyTraffic)} ${mapDict.viewsDayShort || 'views/day'}</div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button onclick="adjustOwnerSpotPrice('${s.id}', -200000)" class="px-2 py-1 rounded bg-[#FBF9F5] border border-[#C8AD8D] font-bold text-[#1B3249] hover:bg-[#EBE2D3]">-200K</button>
                    <button onclick="adjustOwnerSpotPrice('${s.id}', 200000)" class="px-2 py-1 rounded bg-[#FBF9F5] border border-[#C8AD8D] font-bold text-[#284B63] hover:bg-[#EBE2D3]">+200K</button>
                    <button onclick="toggleOwnerSpotAvailability('${s.id}')" class="px-2.5 py-1 rounded font-bold ${isMaint ? 'bg-[#8C7355] text-[#FBF9F5]' : 'bg-[#284B63] text-[#FBF9F5]'}">
                      ${isMaint ? (p.statusMaint || 'Maintenance') : (p.statusAvailable || 'Available')}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  } else {
    // Admin Moderation Queue with working Approve / Reject buttons
    box.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="p-4 rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D]/45 space-y-1">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-[#EBE2D3] text-[#284B63]">${SVG_ICONS.checkCircle}<span>${p.adminQueueBadge}</span></span>
            <div class="text-base font-extrabold text-[#1B3249]">${p.adminQueueTitle}</div>
            <p class="text-[#5A6B7C]">${p.adminQueueDesc}</p>
          </div>
          <div class="p-4 rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D]/45 space-y-1">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-[#EBE2D3] text-[#284B63]">${SVG_ICONS.shieldCheck}<span>${p.adminModBadge}</span></span>
            <div class="text-base font-extrabold text-[#1B3249]">${p.adminModTitle}</div>
            <p class="text-[#5A6B7C]">${p.adminModDesc}</p>
          </div>
          <div class="p-4 rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D]/45 space-y-1">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-[#EBE2D3] text-[#8C7355]">${SVG_ICONS.sparklePen}<span>${p.adminSlaBadge}</span></span>
            <div class="text-base font-extrabold text-[#284B63]">${p.adminSlaTitle}</div>
            <p class="text-[#5A6B7C]">${p.adminSlaDesc}</p>
          </div>
        </div>

        <div class="rounded-2xl bg-[#FBF9F5] border border-[#C8AD8D]/55 p-4 space-y-3">
          <div class="text-xs font-extrabold text-[#1B3249] uppercase tracking-wider">
            ${p.adminTableHeader || 'Live Admin Moderation & Verification Queue'}
          </div>
          <div class="space-y-2.5">
            ${adminModerationQueue.map(item => {
              const statusBadge = item.status === 'approved'
                ? `<span class="px-3 py-1 rounded-full bg-[#284B63] text-[#FBF9F5] text-xs font-bold">${p.badgeApproved || '✓ Approved & Live'}</span>`
                : (item.status === 'rejected'
                  ? `<span class="px-3 py-1 rounded-full bg-[#8C7355] text-[#FBF9F5] text-xs font-bold">${p.badgeRejected || '✕ Revision Requested'}</span>`
                  : `
                    <div class="flex items-center gap-2">
                      <button onclick="handleAdminModeration('${item.id}', 'approved')" class="px-3.5 py-1.5 rounded-lg bg-[#284B63] text-[#FBF9F5] text-xs font-bold hover:bg-[#1B3249] transition-all">
                        ${p.btnApprove || '✓ Approve & Verify'}
                      </button>
                      <button onclick="handleAdminModeration('${item.id}', 'rejected')" class="px-3.5 py-1.5 rounded-lg bg-[#EBE2D3] text-[#1B3249] text-xs font-bold hover:bg-[#D4B895] transition-all">
                        ${p.btnReject || '✕ Request Fix'}
                      </button>
                    </div>
                  `);
              return `
                <div class="p-3.5 rounded-xl bg-[#F3EDE2] border border-[#C8AD8D]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div class="space-y-0.5 max-w-2xl">
                    <div class="font-extrabold text-[#1B3249]">${item.id} · ${item.type} — ${item.company} (${item.spotId})</div>
                    <div class="text-[#5A6B7C]">${item.issue[currentLang]}</div>
                  </div>
                  ${statusBadge}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadSavedUser();
  setLanguage('en');
  // Automatically start in Live OpenStreetMap GPS mode if Leaflet is loaded, otherwise Vector mode
  if (typeof window.L !== 'undefined') {
    setMapMode('gps');
  } else {
    setMapMode('vector');
  }
  syncWithPythonBackend();
});
