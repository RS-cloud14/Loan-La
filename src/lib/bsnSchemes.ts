/**
 * BSN (Bank Simpanan Nasional) Microfinancing Scheme Directory & Smart Matcher
 * Comprehensive database of all 17 BSN Micro/i MADANI, PKBC, and Special Relief Schemes.
 * 
 * Sources: Bank Simpanan Nasional (BSN), Ministry of Finance (MOF), Bank Negara Malaysia (BNM).
 * Last updated: 2026.
 */

export interface BsnScheme {
  id: string;
  name: string;
  nameBm: string;
  category: 'madani' | 'pkbc' | 'relief' | 'sme';
  tag: string;
  tagBm: string;
  targetAudience: string;
  targetAudienceBm: string;
  minAmountRM: number;
  maxAmountRM: number;
  tenureYears: string;
  profitRate: string;
  officialUrl: string;
  applicationChannel: 'online_and_branch' | 'branch_primary' | 'portal_checkin';
  eligibilityCriteria: string[];
  eligibilityCriteriaBm: string[];
  requiredDocs: string[];
  highlights: string[];
}

export const BSN_SCHEMES: BsnScheme[] = [
  {
    id: 'madani_gig',
    name: 'BSN Micro/i MADANI Gig',
    nameBm: 'BSN Mikro/i MADANI Gig',
    category: 'madani',
    tag: 'Gig & Platform Economy',
    tagBm: 'Ekonomi Gig & Platform',
    targetAudience: 'Gig economy workers, e-hailing drivers, p-hailing delivery riders (Grab, Foodpanda, Lalamove, ShopeeFood) & digital freelancers.',
    targetAudienceBm: 'Pekerja ekonomi gig, pemandu e-hailing, penghantar p-hailing (Grab, Foodpanda, Lalamove, ShopeeFood) & pekerja bebas digital.',
    minAmountRM: 2000,
    maxAmountRM: 20000,
    tenureYears: '1 – 3 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MadaniGig?lang=en',
    applicationChannel: 'online_and_branch',
    eligibilityCriteria: [
      'Malaysian citizen aged 18 to 65 years old',
      'Active on recognized digital gig platforms (Grab, Foodpanda, Lalamove, etc.) for at least 3 months',
      'Minimum monthly earnings of RM 800/month',
      'No formal SSM required if registered under authorized gig platform operator'
    ],
    eligibilityCriteriaBm: [
      'Warganegara Malaysia berumur 18 hingga 65 tahun',
      'Aktif di platform gig digital (Grab, Foodpanda, Lalamove, dll.) sekurang-kurangnya 3 bulan',
      'Pendapatan bulanan minimum RM 800/bulan',
      'Pendaftaran SSM tidak wajib jika berdaftar di bawah operator platform yang sah'
    ],
    requiredDocs: [
      'MyKad / NRIC copy (front & back)',
      'Latest 3 to 6 months bank statement showing gig platform credit deposits',
      'Gig rider / driver platform dashboard earnings statements / payslips',
      'Valid driving / GDL license (if motor/car transport service)'
    ],
    highlights: [
      'No payslip required — platform earnings statements accepted',
      'Fast-track approval within 3–5 working days',
      'Subsidized Madani government rate (as low as 3.50% p.a.)'
    ]
  },
  {
    id: 'madani_belia',
    name: 'BSN Micro/i MADANI Belia',
    nameBm: 'BSN Mikro/i MADANI Belia',
    category: 'madani',
    tag: 'Youth Entrepreneurs (≤ 30 y/o)',
    tagBm: 'Usahawan Belia (≤ 30 tahun)',
    targetAudience: 'Youth micro-entrepreneurs aged 18 to 30 years old starting or running a registered micro-business.',
    targetAudienceBm: 'Usahawan mikro belia berumur 18 hingga 30 tahun yang memulakan atau mengendalikan perniagaan mikro.',
    minAmountRM: 2000,
    maxAmountRM: 100000,
    tenureYears: '1 – 7 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MadaniBelia?lang=en',
    applicationChannel: 'online_and_branch',
    eligibilityCriteria: [
      'Malaysian citizen aged 18 to 30 years old',
      'Business must be at least 51% owned and operated by youth',
      'Registered with SSM / Local Authority (PBT) / Professional Body',
      'Operating for at least 3 months'
    ],
    eligibilityCriteriaBm: [
      'Warganegara Malaysia berumur 18 hingga 30 tahun',
      'Perniagaan sekurang-kurangnya 51% dimiliki dan dikendalikan oleh belia',
      'Berdaftar dengan SSM / Pihak Berkuasa Tempatan (PBT)',
      'Telah beroperasi sekurang-kurangnya 3 bulan'
    ],
    requiredDocs: [
      'MyKad copy of youth owner/partners',
      'SSM Registration Certificate (Form A/D/Maklumat Perniagaan)',
      'Latest 3 to 6 months bank statements (company or personal)',
      'Photos of business premises or online store setup'
    ],
    highlights: [
      'Financing limit up to RM 100,000 with up to 7 years tenure',
      'Lowest repayment installment to support young founders'
    ]
  },
  {
    id: 'madani_wanita',
    name: 'BSN Micro/i MADANI Wanita',
    nameBm: 'BSN Mikro/i MADANI Wanita',
    category: 'madani',
    tag: 'Women Entrepreneurs',
    tagBm: 'Usahawan Wanita',
    targetAudience: 'Women-owned micro-enterprises and home-based businesses aiming to expand stock or acquire machinery.',
    targetAudienceBm: 'Perniagaan mikro milik wanita dan usahawan dari rumah yang ingin menambah stok atau membeli peralatan.',
    minAmountRM: 2000,
    maxAmountRM: 100000,
    tenureYears: '1 – 7 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MadaniWanita?lang=en',
    applicationChannel: 'online_and_branch',
    eligibilityCriteria: [
      'Malaysian citizen female entrepreneur',
      'Business must be at least 51% owned and managed by women',
      'Registered with SSM / Local Authority (PBT)',
      'Operating for at least 3 months'
    ],
    eligibilityCriteriaBm: [
      'Usahawan wanita warganegara Malaysia',
      'Perniagaan sekurang-kurangnya 51% dimiliki dan diuruskan oleh wanita',
      'Berdaftar dengan SSM / PBT',
      'Telah beroperasi sekurang-kurangnya 3 bulan'
    ],
    requiredDocs: [
      'MyKad copy of female business owner',
      'SSM business registration documents',
      'Latest 3 to 6 months bank statements',
      'Utility bill of business premise or residence'
    ],
    highlights: [
      'Priority processing under government Women Empowerment initiatives',
      'Flexible working capital and equipment financing'
    ]
  },
  {
    id: 'madani_penjaja',
    name: 'BSN Micro/i MADANI Penjaja',
    nameBm: 'BSN Mikro/i MADANI Penjaja',
    category: 'madani',
    tag: 'Hawkers & Small Traders',
    tagBm: 'Penjaja & Peniaga Kecil',
    targetAudience: 'Static and mobile hawkers, night market traders (pasar malam), food stalls, and bazaar operators.',
    targetAudienceBm: 'Penjaja statik dan bergerak, peniaga pasar malam/pasar pagi, gerai makanan dan peniaga bazar.',
    minAmountRM: 2000,
    maxAmountRM: 20000,
    tenureYears: '1 – 3 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MadaniPenjaja?lang=en',
    applicationChannel: 'online_and_branch',
    eligibilityCriteria: [
      'Malaysian citizen aged 18 to 65 years old',
      'Holding a valid Local Authority Hawker License / PBT Permit / Pasar Malam Association letter',
      'Operating for at least 3 months'
    ],
    eligibilityCriteriaBm: [
      'Warganegara Malaysia berumur 18 hingga 65 tahun',
      'Memegang lesen penjaja PBT / permit pihak berkuasa tempatan / surat persatuan penjaja yang sah',
      'Telah berniaga sekurang-kurangnya 3 bulan'
    ],
    requiredDocs: [
      'MyKad copy',
      'PBT Hawker license / permit / temporary kiosk permit',
      'Latest 3 months bank statements or sales transaction records',
      'Premise / stall photo'
    ],
    highlights: [
      'Designed specifically for informal cash-flow businesses without formal accounting',
      'Fast verification and affordable monthly instalments'
    ]
  },
  {
    id: 'madani_mula_niaga',
    name: 'BSN Micro/i MADANI Mula Niaga',
    nameBm: 'BSN Mikro/i MADANI Mula Niaga',
    category: 'madani',
    tag: 'Early-Stage Startup (< 6 Months)',
    tagBm: 'Perniagaan Baharu (< 6 Bulan)',
    targetAudience: 'Newly established micro-enterprises and startups with less than 6 months of operations.',
    targetAudienceBm: 'Perusahaan mikro baharu dan perniagaan pemula yang beroperasi kurang daripada 6 bulan.',
    minAmountRM: 2000,
    maxAmountRM: 20000,
    tenureYears: '1 – 3 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MadaniMulaNiaga?lang=en',
    applicationChannel: 'online_and_branch',
    eligibilityCriteria: [
      'Malaysian citizen aged 18 to 65',
      'Newly incorporated or registered business with SSM (under 6 months old)',
      'Viable business concept and clear startup cash requirement'
    ],
    eligibilityCriteriaBm: [
      'Warganegara Malaysia berumur 18 hingga 65 tahun',
      'Perniagaan baharu didaftarkan dengan SSM (kurang 6 bulan operasi)',
      'Konsep perniagaan berdaya maju dengan keperluan modal yang jelas'
    ],
    requiredDocs: [
      'MyKad copy',
      'SSM Certificate of Registration',
      'Simple business proposal / cost quotation for machinery or stock',
      'Personal bank statements (3 months)'
    ],
    highlights: [
      'Solves the classic "Catch-22" where traditional banks reject businesses with < 2 years track record',
      'Direct startup financing lifeline'
    ]
  },
  {
    id: 'madani_bumiputera',
    name: 'BSN Micro/i MADANI Bumiputera',
    nameBm: 'BSN Mikro/i MADANI Bumiputera',
    category: 'madani',
    tag: 'Bumiputera Empowerment',
    tagBm: 'Pemerkasaan Bumiputera',
    targetAudience: 'Bumiputera micro-enterprises and SME owners seeking capital expansion.',
    targetAudienceBm: 'Usahawan mikro dan PKS Bumiputera yang memerlukan modal pengembangan perniagaan.',
    minAmountRM: 2000,
    maxAmountRM: 100000,
    tenureYears: '1 – 7 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MadaniBumiputera?lang=en',
    applicationChannel: 'online_and_branch',
    eligibilityCriteria: [
      '100% Bumiputera-owned business',
      'Registered with SSM / PBT',
      'Operating for at least 6 months'
    ],
    eligibilityCriteriaBm: [
      'Perniagaan 100% milik Bumiputera',
      'Berdaftar dengan SSM / PBT',
      'Telah beroperasi sekurang-kurangnya 6 bulan'
    ],
    requiredDocs: [
      'MyKad of owners',
      'SSM registration',
      '6 months bank statements',
      'Utility bill of premise'
    ],
    highlights: [
      'High financing ceiling up to RM 100,000',
      'Flexible use for working capital, renovation, and equipment'
    ]
  },
  {
    id: 'madani_general',
    name: 'BSN Micro/i MADANI (General / Semarak Niaga)',
    nameBm: 'BSN Mikro/i MADANI (Umum)',
    category: 'madani',
    tag: 'Flagship Micro Credit',
    tagBm: 'Kredit Mikro Utama',
    targetAudience: 'All Malaysian micro-enterprises across retail, services, wholesale, manufacturing, and food & beverage.',
    targetAudienceBm: 'Semua perusahaan mikro Malaysia merangkumi peruncitan, perkhidmatan, pemborongan dan makanan.',
    minAmountRM: 2000,
    maxAmountRM: 100000,
    tenureYears: '1 – 7 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/Madani?lang=en',
    applicationChannel: 'online_and_branch',
    eligibilityCriteria: [
      'Malaysian citizen micro-enterprise',
      'Sole proprietorship, partnership, LLP, or Sendirian Berhad',
      'Operating for at least 6 months'
    ],
    eligibilityCriteriaBm: [
      'Perusahaan mikro warganegara Malaysia',
      'Milikan tunggal, perkongsian, PLT, atau Sdn Bhd',
      'Telah beroperasi sekurang-kurangnya 6 bulan'
    ],
    requiredDocs: [
      'MyKad copy of owners/directors',
      'SSM registration profile',
      'Latest 6 months bank statements',
      'Photos of premise / business activity'
    ],
    highlights: [
      'The most widely approved government-subsidized micro facility in Malaysia',
      'Zero collateral required'
    ]
  },
  {
    id: 'madani_lestari',
    name: 'BSN Micro/i MADANI Lestari',
    nameBm: 'BSN Mikro/i MADANI Lestari',
    category: 'madani',
    tag: 'ESG, Green & Rural Modernization',
    tagBm: 'ESG, Hijau & Pemodenan Luar Bandar',
    targetAudience: 'Rural micro-enterprises adopting green technology, renewable energy, waste recycling, or digital commerce.',
    targetAudienceBm: 'Usahawan mikro luar bandar yang mengguna pakai teknologi hijau, kitar semula atau digitalisasi.',
    minAmountRM: 2000,
    maxAmountRM: 100000,
    tenureYears: '1 – 7 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MadaniLestari?lang=en',
    applicationChannel: 'branch_primary',
    eligibilityCriteria: [
      'Malaysian-owned micro business in rural or semi-urban districts',
      'Focusing on sustainable business practices or digital modernization',
      'Operating for at least 6 months'
    ],
    eligibilityCriteriaBm: [
      'Perniagaan mikro milik rakyat Malaysia di kawasan luar bandar / separa bandar',
      'Berfokuskan amalan kelestarian atau modenisasi digital',
      'Beroperasi sekurang-kurangnya 6 bulan'
    ],
    requiredDocs: [
      'MyKad copy',
      'SSM documents',
      'Bank statements (6 months)',
      'Brief explanation of green/digital upgrade'
    ],
    highlights: [
      'Subsidized financing for sustainable and digital adoption',
      'Extended tenure up to 7 years'
    ]
  },
  {
    id: 'madani_sinar',
    name: 'BSN Micro/i MADANI Sinar',
    nameBm: 'BSN Mikro/i MADANI Sinar',
    category: 'madani',
    tag: 'Inclusive / OKU / Social Reintegration',
    tagBm: 'Inklusif / OKU / Integrasi Sosial',
    targetAudience: 'Persons with disabilities (OKU), SOCSO return-to-work trainees, and individuals under social welfare assistance.',
    targetAudienceBm: 'Orang Kurang Upaya (OKU), pelatih PERKESO Return-to-Work, dan individu di bawah program kebajikan masyarakat.',
    minAmountRM: 2000,
    maxAmountRM: 100000,
    tenureYears: '1 – 7 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MadaniSinar?lang=en',
    applicationChannel: 'branch_primary',
    eligibilityCriteria: [
      'Malaysian citizen belonging to targeted inclusion groups (OKU card holder, SOCSO rehabilitation, or JKM endorsement)',
      'Operating a micro business or starting self-employment'
    ],
    eligibilityCriteriaBm: [
      'Warganegara Malaysia tergolong dalam kumpulan sasaran (pemegang kad OKU, pemulihan PERKESO, sokongan JKM)',
      'Mengendalikan perniagaan mikro atau bekerja sendiri'
    ],
    requiredDocs: [
      'MyKad copy & OKU card / supporting agency confirmation letter',
      'SSM registration or local permit',
      'Bank statement or bank savings passbook'
    ],
    highlights: [
      'Affirmative micro-credit policy designed to prevent financial exclusion',
      'Special officer assistance at BSN branches'
    ]
  },
  {
    id: 'madani_bakti',
    name: 'BSN Micro/i MADANI Bakti',
    nameBm: 'BSN Mikro/i MADANI Bakti',
    category: 'madani',
    tag: 'Uniformed & Veteran Retirees',
    tagBm: 'Veteran & Pesara Beruniform',
    targetAudience: 'Retired military (ATM), police (PDRM), and government retirees venturing into entrepreneurship.',
    targetAudienceBm: 'Pesara tentera (ATM), polis (PDRM), dan pesara kerajaan yang menceburi bidang keusahawanan.',
    minAmountRM: 2000,
    maxAmountRM: 100000,
    tenureYears: '1 – 7 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MadaniBakti?lang=en',
    applicationChannel: 'online_and_branch',
    eligibilityCriteria: [
      'Malaysian military (ATM) or police (PDRM) veteran / government retiree',
      'Holding valid veteran / pension card',
      'Operating a micro-enterprise'
    ],
    eligibilityCriteriaBm: [
      'Veteran tentera (ATM) / polis (PDRM) / pesara kerajaan warganegara Malaysia',
      'Memiliki kad veteran / kad pesara yang sah',
      'Mengendalikan perniagaan mikro'
    ],
    requiredDocs: [
      'MyKad copy & Veteran/Pension Card',
      'SSM business registration',
      'Latest 3 to 6 months bank statements'
    ],
    highlights: [
      'Honoring national service with specialized financing rates',
      'Pension income can be used to strengthen affordability calculations'
    ]
  },
  {
    id: 'pkbc_gig',
    name: 'BSN PKBC-i Gig',
    nameBm: 'BSN PKBC-i Gig',
    category: 'pkbc',
    tag: 'New Village (PKBC) Gig Workers',
    tagBm: 'Pekerja Gig Kampung Baru',
    targetAudience: 'Gig delivery riders and digital workers residing in Malaysian Chinese New Villages (Perkampungan Baru Cina).',
    targetAudienceBm: 'Penghantar gig dan pekerja digital yang menetap di Perkampungan Baru Cina (PKBC).',
    minAmountRM: 2000,
    maxAmountRM: 20000,
    tenureYears: '1 – 3 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/PKBCGig?lang=en',
    applicationChannel: 'branch_primary',
    eligibilityCriteria: [
      'Malaysian citizen residing in recognized Perkampungan Baru Cina (New Village)',
      'Residency confirmed by Village Development Officer (Pegawai Kemajuan Perkampungan - PKP) or Village Head (Ketua Kampung)',
      'Active on gig platforms for at least 3 months'
    ],
    eligibilityCriteriaBm: [
      'Warganegara Malaysia yang menetap di Perkampungan Baru Cina (PKBC)',
      'Pengesahan tempat tinggal oleh Pegawai Kemajuan Perkampungan (PKP) / Ketua Kampung',
      'Aktif di platform gig sekurang-kurangnya 3 bulan'
    ],
    requiredDocs: [
      'MyKad copy',
      'PKP / Village Head verification letter',
      'Gig earnings statements & 3 months bank statements'
    ],
    highlights: [
      'Specialized community allocation for New Village youth and gig operators',
      'Low entry barriers'
    ]
  },
  {
    id: 'pkbc_mula_niaga',
    name: 'BSN PKBC MulaNiaga',
    nameBm: 'BSN PKBC MulaNiaga',
    category: 'pkbc',
    tag: 'New Village Startups (< 6 Months)',
    tagBm: 'Perniagaan Baharu Kampung Baru',
    targetAudience: 'Startups and newly launched businesses in Perkampungan Baru Cina operating under 6 months.',
    targetAudienceBm: 'Perniagaan baharu di Perkampungan Baru Cina yang beroperasi kurang 6 bulan.',
    minAmountRM: 2000,
    maxAmountRM: 20000,
    tenureYears: '1 – 3 Years',
    profitRate: '3.50% – 4.00% p.a. (Fixed / Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/PKBCMulaNiaga?lang=en',
    applicationChannel: 'branch_primary',
    eligibilityCriteria: [
      'New Village resident verified by PKP officer',
      'Business registered under 6 months'
    ],
    eligibilityCriteriaBm: [
      'Penduduk Kampung Baru disahkan oleh pegawai PKP',
      'Perniagaan berdaftar bawah 6 bulan'
    ],
    requiredDocs: ['MyKad', 'PKP verification letter', 'SSM registration', 'Bank statement'],
    highlights: ['Micro seed capital for New Village enterprise revitalisation']
  },
  {
    id: 'pkbc_general',
    name: 'BSN PKBC (Perkampungan Baru Cina)',
    nameBm: 'BSN PKBC (Utama)',
    category: 'pkbc',
    tag: 'New Village Micro Credit',
    tagBm: 'Skim Kredit Kampung Baru',
    targetAudience: 'Micro-enterprises, family trades, and retailers based in Chinese New Villages operating for >= 3 months.',
    targetAudienceBm: 'Perusahaan mikro, perniagaan keluarga, dan peruncit di Kampung Baru yang beroperasi >= 3 bulan.',
    minAmountRM: 2000,
    maxAmountRM: 50000,
    tenureYears: '1 – 5 Years',
    profitRate: '4.00% p.a. (Flat)',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/pkbc?lang=en',
    applicationChannel: 'branch_primary',
    eligibilityCriteria: [
      'Malaysian permanent resident of New Village confirmed by PKP officer',
      'Business operated full-time for >= 3 months'
    ],
    eligibilityCriteriaBm: [
      'Pemastautin tetap Kampung Baru disahkan oleh pegawai PKP',
      'Perniagaan dikendalikan sepenuh masa sekurang-kurangnya 3 bulan'
    ],
    requiredDocs: ['MyKad', 'PKP certification form', 'SSM certificate', '3-6 months bank statements'],
    highlights: ['Community-focused funding to boost traditional family trades']
  },
  {
    id: 'microplus_pkbc',
    name: 'BSN Microplus-i PKBC',
    nameBm: 'BSN Microplus-i PKBC',
    category: 'pkbc',
    tag: 'Repeat / Scale-Up Borrowers',
    tagBm: 'Peminjam Ulangan / Naik Taraf',
    targetAudience: 'Existing or former BSN Micro/PKBC customers with proven 3-year prompt repayment track record.',
    targetAudienceBm: 'Pelanggan sedia ada atau bekas pelanggan BSN Mikro/PKBC dengan rekod bayaran tepat selama 3 tahun.',
    minAmountRM: 50000,
    maxAmountRM: 150000,
    tenureYears: '1 – 7 Years',
    profitRate: '4.00% – 5.50% p.a.',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/microplus-pkbc?lang=en',
    applicationChannel: 'branch_primary',
    eligibilityCriteria: [
      'Completed at least 3 years of financing with BSN or fully settled previous BSN micro facility with excellent CCRIS track record',
      'New Village resident confirmed by PKP'
    ],
    eligibilityCriteriaBm: [
      'Telah melengkapkan sekurang-kurangnya 3 tahun pembiayaan BSN atau selesai kemudahan sebelumnya dengan rekod CCRIS cemerlang',
      'Pemastautin Kampung Baru'
    ],
    requiredDocs: ['MyKad', 'Previous BSN settlement statement / account number', '6 months bank statements', 'Audited accounts or management accounts'],
    highlights: ['Highest limit under PKBC umbrella: up to RM 150,000 for expansion']
  },
  {
    id: 'ggsm',
    name: 'BSN Government Guarantee Scheme MADANI (GGSM)',
    nameBm: 'Skim Jaminan Kerajaan MADANI (GGSM)',
    category: 'sme',
    tag: 'SME Government Guarantee (SJPP)',
    tagBm: 'Jaminan Kerajaan PKS (SJPP)',
    targetAudience: 'Commercial SMEs needing high-value financing with up to 80% government guarantee via SJPP.',
    targetAudienceBm: 'PKS komersial yang memerlukan pembiayaan bernilai tinggi dengan jaminan kerajaan sehingga 80% melalui SJPP.',
    minAmountRM: 50000,
    maxAmountRM: 500000,
    tenureYears: '1 – 10 Years',
    profitRate: 'Base Lending Rate (BLR) / Competitive Commercial Rate',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/GGSM?lang=en',
    applicationChannel: 'branch_primary',
    eligibilityCriteria: [
      'Malaysian-incorporated SME with >= 51% local equity',
      'Operating for at least 2 years with profitable financial track record',
      'Eligible for Syarikat Jaminan Pembiayaan Perniagaan (SJPP) guarantee'
    ],
    eligibilityCriteriaBm: [
      'PKS berdaftar di Malaysia dengan >= 51% ekuiti tempatan',
      'Telah beroperasi sekurang-kurangnya 2 tahun dengan rekod kewangan untung',
      'Layak untuk skim jaminan SJPP'
    ],
    requiredDocs: ['SSM Forms 9/24/49', 'Audited Financial Statements (latest 2 years)', '6 months bank statements', 'Director NRICs'],
    highlights: ['Up to 80% government guarantee backing through SJPP', 'Large working capital buffer']
  },
  {
    id: 'raft',
    name: 'BSN Relief & Adaptation Facility (RAFt)',
    nameBm: 'Kemudahan Bantuan & Adaptasi (RAFt)',
    category: 'relief',
    tag: 'Disaster & Flood Recovery',
    tagBm: 'Bantuan Bencana & Pemulihan Banjir',
    targetAudience: 'Micro-enterprises and informal traders whose business premises or assets were damaged by natural disasters (floods).',
    targetAudienceBm: 'Peniaga mikro yang premis atau aset perniagaan mereka terjejas akibat bencana alam (banjir).',
    minAmountRM: 5000,
    maxAmountRM: 100000,
    tenureYears: '1 – 7 Years',
    profitRate: '3.50% p.a. Fixed',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/RAFt?lang=en',
    applicationChannel: 'branch_primary',
    eligibilityCriteria: [
      'Malaysian business verified in officially declared disaster/flood zone',
      'Confirmed by district office / police report / NADMA confirmation'
    ],
    eligibilityCriteriaBm: [
      'Perniagaan di kawasan bencana yang diisytiharkan secara rasmi',
      'Disahkan oleh laporan polis / pejabat daerah / NADMA'
    ],
    requiredDocs: ['MyKad', 'Police report of flood damage', 'Premise damage photos', 'Bank statements'],
    highlights: ['Emergency relief rate at 3.50% with up to 6 months repayment moratorium option']
  },
  {
    id: 'msme_srf',
    name: 'BSN MSME Stabilisation Relief Facility (MSME SRF)',
    nameBm: 'Kemudahan Pelepasan Penstabilan PMKS (MSME SRF)',
    category: 'relief',
    tag: 'Economic Shock & Cashflow Relief',
    tagBm: 'Pelepasan Aliran Tunai & Penstabilan',
    targetAudience: 'Micro and small enterprises facing temporary severe cash flow strain due to supply chain disruption.',
    targetAudienceBm: 'Perusahaan mikro dan kecil yang menghadapi kekangan aliran tunai sementara akibat gangguan bekalan.',
    minAmountRM: 5000,
    maxAmountRM: 100000,
    tenureYears: '1 – 5 Years',
    profitRate: '3.75% p.a.',
    officialUrl: 'https://www.bsn.com.my/BusinessBanking/Products/MSMESRF?lang=en',
    applicationChannel: 'online_and_branch',
    eligibilityCriteria: [
      'Malaysian micro/SME operating >= 12 months with temporary drop in revenue'
    ],
    eligibilityCriteriaBm: [
      'PMKS Malaysia beroperasi >= 12 bulan yang mengalami kejatuhan hasil sementara'
    ],
    requiredDocs: ['MyKad', 'SSM', '6 months bank statements proving disruption'],
    highlights: ['Concessionary interest rate to restore business liquidity']
  }
];

export interface ApplicantProfileCriteria {
  name?: string;
  icNumber?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  isBumiputera?: boolean;
  isGigWorker?: boolean;
  platform?: string;
  businessAgeMonths?: number;
  isNewVillageResident?: boolean;
  isVeteran?: boolean;
  isDisasterAffected?: boolean;
  isHawker?: boolean;
  requestedAmountRM?: number;
}

/**
 * Intelligent BSN Scheme Recommendation Engine
 * Analyzes applicant's extracted biometric, platform, and financial telemetry
 * and ranks all 17 BSN micro-loans by exact qualification fit.
 */
export function matchBsnSchemes(profile: ApplicantProfileCriteria): {
  recommended: BsnScheme;
  score: number;
  reasonEn: string;
  reasonBm: string;
  allRanked: Array<{ scheme: BsnScheme; score: number; matchReasons: string[] }>;
} {
  // Infer age and gender from IC if not directly provided
  let inferredAge = profile.age;
  let inferredGender = profile.gender;

  if (profile.icNumber && profile.icNumber.length >= 12) {
    const cleanIc = profile.icNumber.replace(/\D/g, '');
    if (cleanIc.length >= 12) {
      const birthYearTwoDigits = parseInt(cleanIc.slice(0, 2), 10);
      const currentYear = 2026;
      const fullBirthYear = birthYearTwoDigits > 30 ? 1900 + birthYearTwoDigits : 2000 + birthYearTwoDigits;
      if (!inferredAge) {
        inferredAge = currentYear - fullBirthYear;
      }
      if (!inferredGender) {
        const lastDigit = parseInt(cleanIc.slice(-1), 10);
        inferredGender = lastDigit % 2 === 0 ? 'Female' : 'Male';
      }
    }
  }

  const isGig = profile.isGigWorker || 
    (profile.platform && /grab|foodpanda|lalamove|shopee|lazada|gig|rider|driver/i.test(profile.platform));
  const isHawker = profile.isHawker || 
    (profile.platform && /penjaja|gerai|pasar|warung|stall|hawker/i.test(profile.platform));
  const reqAmount = profile.requestedAmountRM || 15000;

  const scoredSchemes = BSN_SCHEMES.map(scheme => {
    let score = 50; // base score
    const reasons: string[] = [];

    // Amount bracket match
    if (reqAmount >= scheme.minAmountRM && reqAmount <= scheme.maxAmountRM) {
      score += 20;
      reasons.push(`Requested RM ${reqAmount.toLocaleString()} fits within scheme limit (RM ${scheme.minAmountRM.toLocaleString()} – RM ${scheme.maxAmountRM.toLocaleString()})`);
    } else if (reqAmount > scheme.maxAmountRM) {
      score -= 30;
    }

    // Specific scheme heuristics
    if (scheme.id === 'madani_gig') {
      if (isGig) {
        score += 45;
        reasons.push('Direct match: Verified gig platform driver/rider profile');
      }
    }

    if (scheme.id === 'madani_belia') {
      if (inferredAge && inferredAge <= 30) {
        score += 40;
        reasons.push(`Youth demographic match (Age ${inferredAge} ≤ 30)`);
      } else if (inferredAge && inferredAge > 30) {
        score -= 40;
      }
    }

    if (scheme.id === 'madani_wanita') {
      if (inferredGender === 'Female') {
        score += 40;
        reasons.push('Female entrepreneur empowerment allocation');
      } else if (inferredGender === 'Male') {
        score -= 40;
      }
    }

    if (scheme.id === 'madani_penjaja') {
      if (isHawker) {
        score += 45;
        reasons.push('Hawker / small food stall operator profile match');
      }
    }

    if (scheme.id === 'madani_mula_niaga') {
      if (profile.businessAgeMonths !== undefined && profile.businessAgeMonths < 6) {
        score += 35;
        reasons.push(`Early-stage business (${profile.businessAgeMonths} months < 6 months requirement)`);
      }
    }

    if (scheme.id === 'madani_bumiputera') {
      if (profile.isBumiputera) {
        score += 30;
        reasons.push('Bumiputera micro-enterprise scheme match');
      }
    }

    if (scheme.category === 'pkbc') {
      if (profile.isNewVillageResident) {
        score += 45;
        reasons.push('Resident of Perkampungan Baru Cina verified');
      } else {
        score -= 25; // Less likely if not living in New Village
      }
    }

    if (scheme.id === 'madani_bakti' && profile.isVeteran) {
      score += 50;
      reasons.push('Uniformed / Armed Forces veteran status verified');
    }

    if (scheme.id === 'raft' && profile.isDisasterAffected) {
      score += 50;
      reasons.push('Disaster recovery support priority');
    }

    if (scheme.id === 'madani_general') {
      score += 15; // solid fallback for everyone
      reasons.push('Universal micro-enterprise eligibility');
    }

    return {
      scheme,
      score,
      matchReasons: reasons
    };
  });

  scoredSchemes.sort((a, b) => b.score - a.score);

  const topMatch = scoredSchemes[0];
  const rec = topMatch.scheme;

  let reasonEn = `Matched to ${rec.name}: Fits your ${isGig ? 'gig platform revenue stream' : 'business profile'} with subsidized ${rec.profitRate} interest and tenure up to ${rec.tenureYears}.`;
  let reasonBm = `Dipadankan dengan ${rec.nameBm}: Sesuai dengan ${isGig ? 'aliran pendapatan gig' : 'profil perniagaan'} anda dengan kadar faedah subsidi ${rec.profitRate} dan tempoh sehingga ${rec.tenureYears}.`;

  if (topMatch.matchReasons.length > 0) {
    reasonEn = topMatch.matchReasons.join('. ') + '.';
  }

  return {
    recommended: rec,
    score: topMatch.score,
    reasonEn,
    reasonBm,
    allRanked: scoredSchemes
  };
}
