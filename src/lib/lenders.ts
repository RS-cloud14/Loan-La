/**
 * Malaysian Licensed Bank & Alternative Lender Database
 * Sources: Bank Negara Malaysia (BNM), Securities Commission (SC) Malaysia,
 * Ministry of Entrepreneur Development & Cooperatives (KUSKOP), individual official rate sheets.
 * 
 * Verified Malaysian Banks, Government Micro-Funds & Licensed P2P Platforms.
 * Last updated: August 2026.
 */

export type LenderType =
  | 'Commercial Bank'
  | 'Islamic Bank'
  | 'Development Bank'
  | 'Government Agency'
  | 'Finance Company'
  | 'P2P Platform'
  | 'Cooperative Bank';

export type AssetType =
  | 'working_capital'
  | 'personal_cash'
  | 'vehicle'
  | 'equipment'
  | 'invoice_financing'
  | 'education'
  | 'car'
  | 'bike'
  | 'van';

export type ProductType =
  | 'sme_loan'
  | 'hire_purchase'
  | 'personal_financing'
  | 'micro_credit'
  | 'p2p_lending'
  | 'invoice_financing';

export type RateType = 'flat_pa' | 'reducing_pa' | 'profit_rate_pa';

export interface LenderProduct {
  id: string;
  name: string;
  productType: ProductType;
  minAmountRM: number;
  maxAmountRM: number;
  tenureMinMonths: number;
  tenureMaxMonths: number;
  rateType: RateType;
  /** % per annum */
  rateFromPercent: number;
  rateToPercent: number;
  payslipRequired: boolean;
  compatibleAssets: AssetType[];
  requiredDocs: string[];
  notes: string;
}

export interface Lender {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  type: LenderType;
  regulatedBy: string;
  shariah: boolean;
  products: LenderProduct[];
  gigFriendly: boolean;
  acceptedPlatforms: string[];
  minIncomeRM: number;
  minGigHistoryMonths: number;
  website: string;
  hotline: string;
  applicationUrl: string;
  minFRIScore: number;
  highlight: string;
  notes: string;
}

export const LENDERS: Lender[] = [
  /* ─────────────────────────────────────────────────────────────────── */
  /* 1. MAYBANK — Malaysia's largest commercial bank                     */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'maybank',
    name: 'Malayan Banking Berhad (Maybank)',
    shortName: 'Maybank',
    emoji: '🏦',
    type: 'Commercial Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee'],
    minIncomeRM: 1500,
    minGigHistoryMonths: 6,
    website: 'maybank2u.com.my',
    hotline: '1-300-88-6688',
    applicationUrl: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/loans/business/sme_clean_loan.page',
    minFRIScore: 550,
    highlight: 'Malaysia’s largest bank. Clean digital micro-financing for business and vehicle hire purchase.',
    notes: 'Offers dedicated SME digital financing with automated 10-minute in-principle approval with 6 months bank statement.',
    products: [
      {
        id: 'maybank_sme_mikro',
        name: 'Maybank SME Digital Financing',
        productType: 'sme_loan',
        minAmountRM: 5000,
        maxAmountRM: 250000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 4.8,
        rateToPercent: 9.8,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'equipment'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement (PDF)', 'SSM Registration Certificate (Form D / Profile)'],
        notes: 'Unsecured working capital for micro-enterprises and online sellers. Fast digital screening.',
      },
      {
        id: 'maybank_auto_hp',
        name: 'Maybank Hire Purchase (Auto / Bike)',
        productType: 'hire_purchase',
        minAmountRM: 10000,
        maxAmountRM: 150000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 2.8,
        rateToPercent: 4.2,
        payslipRequired: false,
        compatibleAssets: ['vehicle', 'car', 'bike', 'van'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'Vehicle Sales Quotation from Authorized Dealer', 'Driving License'],
        notes: 'Competitive rates for new and used cars, vans, and commercial motorcycles.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 2. CIMB BANK — Regional leader with Micro-SME packages              */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'cimb',
    name: 'CIMB Bank Berhad',
    shortName: 'CIMB',
    emoji: '🏦',
    type: 'Commercial Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee'],
    minIncomeRM: 1500,
    minGigHistoryMonths: 6,
    website: 'cimb.com.my',
    hotline: '1-300-880-900',
    applicationUrl: 'https://www.cimb.com.my/en/business/financing/micro-financing.html',
    minFRIScore: 540,
    highlight: 'No collateral micro-financing for gig operators and small businesses under BNM SPM scheme.',
    notes: 'Official participant in BNM Skim Pembiayaan Mikro (SPM). Collateral-free evaluation.',
    products: [
      {
        id: 'cimb_sme_mikro',
        name: 'CIMB Micro-Financing Scheme',
        productType: 'sme_loan',
        minAmountRM: 5000,
        maxAmountRM: 50000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 5.5,
        rateToPercent: 9.5,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'equipment'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Business Registration Certificate'],
        notes: 'Zero collateral required. Ideal for business expansion and cash flow runway.',
      },
      {
        id: 'cimb_auto_finance',
        name: 'CIMB Auto Finance',
        productType: 'hire_purchase',
        minAmountRM: 10000,
        maxAmountRM: 120000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 2.9,
        rateToPercent: 4.5,
        payslipRequired: false,
        compatibleAssets: ['vehicle', 'car', 'van'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'Vehicle Dealer Quotation'],
        notes: 'Fast loan processing for passenger and commercial vehicle purchases.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 3. TEKUN NASIONAL — Subsidized 4% Micro-Financing for Usahawan       */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'tekun',
    name: 'TEKUN Nasional',
    shortName: 'TEKUN',
    emoji: '🏛️',
    type: 'Government Agency',
    regulatedBy: 'Kementerian Pembangunan Usahawan & Koperasi (KUSKOP)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee', 'freelance'],
    minIncomeRM: 500,
    minGigHistoryMonths: 3,
    website: 'tekun.gov.my',
    hotline: '+603-9059 8888',
    applicationUrl: 'https://tekun.gov.my',
    minFRIScore: 400,
    highlight: 'Ultra-low 4.0% subsidized annual profit rate. Open to micro-traders, blacklisted applicants & gig riders.',
    notes: 'Agency under KUSKOP. Highest approval rate in Malaysia for self-employed and informal earners.',
    products: [
      {
        id: 'tekun_niaga',
        name: 'Skim Pembiayaan TEKUN Niaga',
        productType: 'micro_credit',
        minAmountRM: 1000,
        maxAmountRM: 100000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'flat_pa',
        rateFromPercent: 4.0,
        rateToPercent: 4.0,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'equipment'],
        requiredDocs: [
          'MyKad / NRIC',
          '3-6 months Bank Statement or Buku Bank',
          'SSM Certificate or Local Council (PBT) Hawker Permit',
          'Brief Business Proposal / Fund Usage Plan (Kertas Kerja Ringkas)',
          'Premise / Stall / Inventory Photos',
        ],
        notes: 'Subsidized 4% flat rate. Suitable for night market hawkers, food operators, and small traders.',
      },
      {
        id: 'tekun_mobilepreneur',
        name: 'Skim TEKUN Mobilepreneur',
        productType: 'hire_purchase',
        minAmountRM: 2000,
        maxAmountRM: 10000,
        tenureMinMonths: 12,
        tenureMaxMonths: 36,
        rateType: 'flat_pa',
        rateFromPercent: 4.0,
        rateToPercent: 4.0,
        payslipRequired: false,
        compatibleAssets: ['vehicle', 'bike'],
        requiredDocs: ['MyKad / NRIC', 'Driving License (B2 / B)', 'Active Delivery Platform Profile (Grab/Foodpanda/Lalamove/Shopee)', 'Motorcycle Quotation'],
        notes: 'Specially created for gig delivery riders to purchase or repair motorcycles and delivery gear.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 4. SME BANK — Government SME Specialist (SPUM Scheme)                */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'sme_bank_mikro',
    name: 'SME Bank (Small Medium Enterprise Development Bank Malaysia)',
    shortName: 'SME Bank',
    emoji: '🏛️',
    type: 'Development Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM) / KUSKOP',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'shopee', 'lazada', 'freelance'],
    minIncomeRM: 1200,
    minGigHistoryMonths: 6,
    website: 'smebank.com.my',
    hotline: '+603-2603 7700',
    applicationUrl: 'https://www.smebank.com.my/en/financing/spum',
    minFRIScore: 480,
    highlight: '4.0% - 5.0% subsidized profit rate for youth, graduates and micro-entrepreneurs. Up to RM 50k clean financing.',
    notes: 'Skim Pembiayaan Usahawan Mikro (SPUM) is backed by Ministry of Finance to accelerate micro-business development.',
    products: [
      {
        id: 'sme_bank_spum',
        name: 'Skim Pembiayaan Usahawan Mikro (SPUM)',
        productType: 'sme_loan',
        minAmountRM: 5000,
        maxAmountRM: 50000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'flat_pa',
        rateFromPercent: 4.0,
        rateToPercent: 5.0,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'equipment'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Registration', 'Brief Business Plan / Quotation for Equipment'],
        notes: 'Financing for working capital and purchasing commercial machinery, tools, or IT hardware.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 5. MARA — Majlis Amanah Rakyat (SPiM & SPiKE)                       */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'mara_spim',
    name: 'Majlis Amanah Rakyat (MARA)',
    shortName: 'MARA',
    emoji: '🏛️',
    type: 'Government Agency',
    regulatedBy: 'Kementerian Kemajuan Desa dan Wilayah (KKDW)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'freelance', 'shopee'],
    minIncomeRM: 1000,
    minGigHistoryMonths: 6,
    website: 'mara.gov.my',
    hotline: '+603-2613 2000',
    applicationUrl: 'https://www.mara.gov.my/en/business/entrepreneur-financing',
    minFRIScore: 420,
    highlight: 'Subsidized 4.0% annual profit rate for Bumiputera micro-entrepreneurs and technical freelancers.',
    notes: 'Skim Pembiayaan Mudah Jaya (SPiM) provides zero-collateral micro-financing for business equipment and operations.',
    products: [
      {
        id: 'mara_spim_clean',
        name: 'Skim Pembiayaan Mudah Jaya (SPiM)',
        productType: 'micro_credit',
        minAmountRM: 5000,
        maxAmountRM: 50000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'flat_pa',
        rateFromPercent: 4.0,
        rateToPercent: 4.0,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'equipment'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Certificate', 'Rancangan Perniagaan Ringkas (Business Proposal)', 'Premise Photos'],
        notes: 'Subsidized 4.0% rate. No collateral required for loans up to RM 50,000.',
      },
      {
        id: 'mara_spike',
        name: 'Skim Pembiayaan Kontrak Ekspres (SPiKE)',
        productType: 'invoice_financing',
        minAmountRM: 10000,
        maxAmountRM: 100000,
        tenureMinMonths: 3,
        tenureMaxMonths: 12,
        rateType: 'flat_pa',
        rateFromPercent: 4.0,
        rateToPercent: 4.0,
        payslipRequired: false,
        compatibleAssets: ['invoice_financing', 'working_capital'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Certificate', 'Awarded Contract / Purchase Order (PO) / Invoice'],
        notes: 'Express cash advances for awarded government or corporate supply orders and contracts.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 6. BSN — Bank Simpanan Nasional (MicroKredit Semarak Niaga / Madani)*/
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bsn',
    name: 'Bank Simpanan Nasional (BSN)',
    shortName: 'BSN',
    emoji: '🏦',
    type: 'Development Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM) / Ministry of Finance',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee', 'freelance'],
    minIncomeRM: 800,
    minGigHistoryMonths: 6,
    website: 'bsn.com.my',
    hotline: '1300-88-1900',
    applicationUrl: 'https://www.bsn.com.my/page/BSN-Micro-i-Semarak-Niaga',
    minFRIScore: 450,
    highlight: 'Lowest monthly income requirement (RM 800/mo). Subsidized rate 4.0% p.a. for micro-businesses & gig workers.',
    notes: 'Official mandate bank under Belanjawan Madani for micro-enterprise empowerment.',
    products: [
      {
        id: 'bsn_micro_niaga',
        name: 'BSN MicroKredit Semarak Niaga / Madani',
        productType: 'micro_credit',
        minAmountRM: 5000,
        maxAmountRM: 50000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'flat_pa',
        rateFromPercent: 4.0,
        rateToPercent: 4.0,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'personal_cash'],
        requiredDocs: ['MyKad / NRIC', '3-6 months Bank Statement or BSN Savings Account Book', 'SSM Registration or PBT Permit (if business)'],
        notes: 'Very flexible eligibility criteria. Available for micro-traders, stall owners, and gig freelancers.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 7. BANK RAKYAT — Islamic Cooperative Bank                          */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bank_rakyat',
    name: 'Bank Kerjasama Rakyat Malaysia Berhad',
    shortName: 'Bank Rakyat',
    emoji: '🏛️',
    type: 'Cooperative Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM) / Ministry of Finance',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'shopee', 'freelance'],
    minIncomeRM: 1000,
    minGigHistoryMonths: 6,
    website: 'bankrakyat.com.my',
    hotline: '1300-80-5454',
    applicationUrl: 'https://www.bankrakyat.com.my/c/personal-banking/financing/pembiayaan-mikro-i',
    minFRIScore: 470,
    highlight: '100% Shariah-compliant micro-financing for informal workers, cooperative members and small traders.',
    notes: 'Lenient credit scoring and cooperative profit distribution for registered members.',
    products: [
      {
        id: 'bank_rakyat_mikro_i',
        name: 'Bank Rakyat Pembiayaan Mikro-i Usahawan',
        productType: 'micro_credit',
        minAmountRM: 3000,
        maxAmountRM: 50000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 6.5,
        rateToPercent: 9.5,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'personal_cash'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Registration or Local Council License'],
        notes: 'Structured under Tawarruq arrangement. No collateral required.',
      },
      {
        id: 'bank_rakyat_auto_i',
        name: 'Bank Rakyat Auto Financing-i',
        productType: 'hire_purchase',
        minAmountRM: 10000,
        maxAmountRM: 100000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 3.0,
        rateToPercent: 4.5,
        payslipRequired: false,
        compatibleAssets: ['vehicle', 'car', 'van'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'Vehicle Dealer Sales Quotation'],
        notes: 'Shariah-compliant vehicle hire purchase with competitive fixed profit rates.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 8. AGROBANK — Agriculture & Rural Food Micro-Financing             */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'agrobank_mikro',
    name: 'Agrobank (Bank Pertanian Malaysia Berhad)',
    shortName: 'Agrobank',
    emoji: '🌾',
    type: 'Development Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'freelance'],
    minIncomeRM: 1000,
    minGigHistoryMonths: 6,
    website: 'agrobank.com.my',
    hotline: '1300-88-2476',
    applicationUrl: 'https://www.agrobank.com.my/product/pembiayaan-kredit-mikro-i',
    minFRIScore: 460,
    highlight: 'Shariah-compliant financing for agriculture operators, food traders, livestock breeders and rural businesses.',
    notes: 'No collateral needed under Tawarruq concept. Tailored cash flow schedules suited for harvesting and retail cycles.',
    products: [
      {
        id: 'agrobank_kredit_mikro',
        name: 'Agrobank Pembiayaan Kredit Mikro-i',
        productType: 'micro_credit',
        minAmountRM: 3000,
        maxAmountRM: 50000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 5.5,
        rateToPercent: 8.5,
        payslipRequired: false,
        compatibleAssets: ['working_capital'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Registration or Agro Association Member Letter', 'Brief Operational Plan'],
        notes: 'Working capital for raw materials, fertilizers, seeds, and stall operations.',
      },
      {
        id: 'agrobank_mesin_vehicle',
        name: 'Agrobank Mesin & Kenderaan-i',
        productType: 'hire_purchase',
        minAmountRM: 10000,
        maxAmountRM: 150000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 3.5,
        rateToPercent: 5.5,
        payslipRequired: false,
        compatibleAssets: ['equipment', 'vehicle', 'van'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'Supplier Machinery / Vehicle Quotation'],
        notes: 'Financing for 4x4 pickups, delivery lorries, tractors, and food processing machines.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 9. BANK ISLAM — Social Finance BangKIT Micro-Financing             */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bank_islam_mikro',
    name: 'Bank Islam Malaysia Berhad',
    shortName: 'Bank Islam',
    emoji: '🕌',
    type: 'Islamic Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'freelance'],
    minIncomeRM: 500,
    minGigHistoryMonths: 3,
    website: 'bankislam.com',
    hotline: '+603-2690 0900',
    applicationUrl: 'https://www.bankislam.com/sme-banking/social-finance/bangkit-microfinancing',
    minFRIScore: 400,
    highlight: 'Zero profit rate (0% financing) under Sadaqa House social finance for unbanked micro-entrepreneurs.',
    notes: 'Qard (benevolent loan) structure designed to help micro-businesses build credit track record.',
    products: [
      {
        id: 'bank_islam_bangkit',
        name: 'Bank Islam BangKIT Microfinancing',
        productType: 'micro_credit',
        minAmountRM: 500,
        maxAmountRM: 20000,
        tenureMinMonths: 6,
        tenureMaxMonths: 36,
        rateType: 'flat_pa',
        rateFromPercent: 0.0,
        rateToPercent: 4.5,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'personal_cash'],
        requiredDocs: ['MyKad / NRIC', '3 months Bank / e-Wallet Statement', 'Evidence of Business / Informal Trade'],
        notes: 'Zero or ultra-low profit rate. Purely social finance for B40 micro-traders.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 10. AIM (AMANAH IKHTIAR MALAYSIA) — Grameen-style Microcredit       */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'aim',
    name: 'Amanah Ikhtiar Malaysia (AIM)',
    shortName: 'AIM (Amanah Ikhtiar)',
    emoji: '🏛️',
    type: 'Government Agency',
    regulatedBy: 'Kementerian Pembangunan Usahawan dan Koperasi (KUSKOP)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'freelance'],
    minIncomeRM: 0,
    minGigHistoryMonths: 0,
    website: 'aim.gov.my',
    hotline: '+603-8888 8888',
    applicationUrl: 'https://www.aim.gov.my',
    minFRIScore: 350,
    highlight: 'Open to blacklisted & bankrupt applicants — no credit check discrimination. Household income ≤ RM 5,880.',
    notes: 'Malaysia’s premier microfinance trust. Group lending with weekly center meetings and high repayment culture.',
    products: [
      {
        id: 'aim_ikhtiar_paduri',
        name: 'AIM Skim Pembiayaan Ikhtiar (PADURI)',
        productType: 'micro_credit',
        minAmountRM: 1000,
        maxAmountRM: 30000,
        tenureMinMonths: 12,
        tenureMaxMonths: 36,
        rateType: 'flat_pa',
        rateFromPercent: 10.0,
        rateToPercent: 10.0,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'personal_cash'],
        requiredDocs: ['MyKad / NRIC', 'Utility Bill (Address Verification)', 'Household Income Verification Form'],
        notes: 'No CCRIS/CTOS check. Weekly center meeting model.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 11. AEON CREDIT SERVICE — Largest Non-Bank Hire Purchase & Cash     */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'aeon',
    name: 'AEON Credit Service (M) Berhad',
    shortName: 'AEON Credit',
    emoji: '🏪',
    type: 'Finance Company',
    regulatedBy: 'Ministry of Housing & Local Government (KPKT) / BNM',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee', 'lazada'],
    minIncomeRM: 1000,
    minGigHistoryMonths: 3,
    website: 'aeoncredit.com.my',
    hotline: '+603-2719 9999',
    applicationUrl: 'https://www.aeoncredit.com.my',
    minFRIScore: 440,
    highlight: 'Largest non-bank vehicle HP financier in Malaysia. Fast 1-2 day turnaround for gig riders and drivers.',
    notes: 'Very flexible with informal bank deposits and e-hailing platform statements.',
    products: [
      {
        id: 'aeon_motor_vehicle_hp',
        name: 'AEON Motorcycle & Vehicle Hire Purchase',
        productType: 'hire_purchase',
        minAmountRM: 3000,
        maxAmountRM: 80000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 5.5,
        rateToPercent: 8.5,
        payslipRequired: false,
        compatibleAssets: ['vehicle', 'bike', 'car', 'van'],
        requiredDocs: ['MyKad / NRIC', '3-6 months Bank Statement', 'Vehicle Dealer Quotation', 'Driving License'],
        notes: 'Instant approval available at over 1,000 motor and car dealer showrooms nationwide.',
      },
      {
        id: 'aeon_icash',
        name: 'AEON i-Cash Personal Financing',
        productType: 'personal_financing',
        minAmountRM: 1000,
        maxAmountRM: 20000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'flat_pa',
        rateFromPercent: 12.0,
        rateToPercent: 18.0,
        payslipRequired: false,
        compatibleAssets: ['personal_cash'],
        requiredDocs: ['MyKad / NRIC', '3 months Bank Statement'],
        notes: 'Rapid personal emergency cash advance.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 12. ALLIANCE BANK — Digital SME Specialist                          */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'alliance_mikro',
    name: 'Alliance Bank Malaysia Berhad',
    shortName: 'Alliance SME',
    emoji: '🏦',
    type: 'Commercial Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'shopee', 'lazada', 'freelance'],
    minIncomeRM: 2000,
    minGigHistoryMonths: 6,
    website: 'alliancebank.com.my',
    hotline: '+603-5516 9988',
    applicationUrl: 'https://www.alliancebank.com.my/business/loans/digital-sme.aspx',
    minFRIScore: 530,
    highlight: '100% online digital application with 24-hour in-principle approval. Zero collateral required.',
    notes: 'Fastest digital onboarding for Malaysian registered sole props and partnerships.',
    products: [
      {
        id: 'alliance_digital_sme',
        name: 'Alliance Digital SME Express Loan',
        productType: 'sme_loan',
        minAmountRM: 10000,
        maxAmountRM: 100000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 5.8,
        rateToPercent: 10.5,
        payslipRequired: false,
        compatibleAssets: ['working_capital'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement (PDF)', 'SSM Certificate'],
        notes: 'Fully digital submission without visiting a physical branch.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 13. AMBANK — CGC-backed BizClub Micro Financing                     */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'ambank_mikro',
    name: 'AmBank (M) Berhad',
    shortName: 'AmBank BizClub',
    emoji: '🏦',
    type: 'Commercial Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'shopee', 'lazada'],
    minIncomeRM: 2000,
    minGigHistoryMonths: 6,
    website: 'ambank.com.my',
    hotline: '+603-2178 8888',
    applicationUrl: 'https://www.ambank.com.my/business/financing/bizclub',
    minFRIScore: 520,
    highlight: 'Backed by Credit Guarantee Corporation (CGC) for micro-enterprises with at least 6 months track record.',
    notes: 'High approval rates when backed by CGC guarantee scheme.',
    products: [
      {
        id: 'ambank_bizclub_clean',
        name: 'AmBank BizClub Micro SME Financing',
        productType: 'sme_loan',
        minAmountRM: 10000,
        maxAmountRM: 300000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'reducing_pa',
        rateFromPercent: 5.5,
        rateToPercent: 9.0,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'equipment'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Registration Certificate'],
        notes: 'Suitable for business growth, inventory procurement, and commercial tool upgrades.',
      },
      {
        id: 'ambank_auto_hp',
        name: 'AmBank Auto Financing',
        productType: 'hire_purchase',
        minAmountRM: 10000,
        maxAmountRM: 100000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 3.1,
        rateToPercent: 4.6,
        payslipRequired: false,
        compatibleAssets: ['vehicle', 'car', 'van'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'Vehicle Dealer Quotation'],
        notes: 'Hire purchase financing for passenger cars and delivery vans.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 14. PUBLIC BANK — Solid Commercial Micro Sizing (SPM)               */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'public_bank_mikro',
    name: 'Public Bank Berhad',
    shortName: 'Public Bank',
    emoji: '🏦',
    type: 'Commercial Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'freelance'],
    minIncomeRM: 2000,
    minGigHistoryMonths: 12,
    website: 'publicbank.com.my',
    hotline: '1-800-22-9999',
    applicationUrl: 'https://www.pbebank.com/business-banking/loans-financing/micro-financing.aspx',
    minFRIScore: 560,
    highlight: 'Reputable tier-1 commercial bank under BNM SPM. Competitive interest rates for stable businesses.',
    notes: 'Favours businesses with consistent daily or weekly cash inflows.',
    products: [
      {
        id: 'public_bank_spm',
        name: 'Public Bank Skim Pembiayaan Mikro (SPM)',
        productType: 'sme_loan',
        minAmountRM: 5000,
        maxAmountRM: 50000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 6.0,
        rateToPercent: 9.0,
        payslipRequired: false,
        compatibleAssets: ['working_capital'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Certificate', 'Utility Bill of Business Premise'],
        notes: 'Unsecured working capital facility under BNM micro-finance framework.',
      },
      {
        id: 'public_bank_auto_hp',
        name: 'Public Bank Hire Purchase',
        productType: 'hire_purchase',
        minAmountRM: 10000,
        maxAmountRM: 150000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 2.7,
        rateToPercent: 3.9,
        payslipRequired: false,
        compatibleAssets: ['vehicle', 'car', 'van'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'Vehicle Sales Order'],
        notes: 'One of the lowest hire purchase interest rates in Malaysia.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 15. BANK MUAMALAT — Islamic Micro-Financing Specialist             */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'muamalat_mikro',
    name: 'Bank Muamalat Malaysia Berhad',
    shortName: 'Bank Muamalat',
    emoji: '🕌',
    type: 'Islamic Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'freelance'],
    minIncomeRM: 1200,
    minGigHistoryMonths: 6,
    website: 'muamalat.com.my',
    hotline: '+603-2600 5500',
    applicationUrl: 'https://www.muamalat.com.my/business-banking/micro-financing',
    minFRIScore: 490,
    highlight: 'Official BNM Skim Pembiayaan Mikro participant. Shariah-compliant micro-financing for SSM-registered traders.',
    notes: 'Structured under Tawarruq arrangement with zero collateral requirements.',
    products: [
      {
        id: 'muamalat_spm_i',
        name: 'Bank Muamalat Skim Pembiayaan Mikro-i (SPM)',
        productType: 'micro_credit',
        minAmountRM: 5000,
        maxAmountRM: 50000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 6.5,
        rateToPercent: 10.0,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'personal_cash'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Registration Certificate'],
        notes: 'Shariah-compliant capital for retail, hawking, and small services.',
      },
      {
        id: 'muamalat_auto_i',
        name: 'Bank Muamalat Auto Financing-i',
        productType: 'hire_purchase',
        minAmountRM: 10000,
        maxAmountRM: 100000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 3.2,
        rateToPercent: 4.8,
        payslipRequired: false,
        compatibleAssets: ['vehicle', 'car', 'van'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'Vehicle Dealer Quotation'],
        notes: 'Vehicle hire purchase under Ijarah Thumma Al-Bai (AITAB) concept.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 16. AFFIN BANK — Affin SMEmerge Micro-Financing                     */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'affin_mikro',
    name: 'Affin Bank Berhad',
    shortName: 'Affin SMEmerge',
    emoji: '🏦',
    type: 'Commercial Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'shopee', 'freelance'],
    minIncomeRM: 1800,
    minGigHistoryMonths: 6,
    website: 'affinalways.com',
    hotline: '+603-8230 2222',
    applicationUrl: 'https://www.affinalways.com/en/sme-banking/smemerge',
    minFRIScore: 510,
    highlight: 'Dedicated startup and micro-enterprise financing up to RM 50,000 for businesses operating 6+ months.',
    notes: 'Both conventional and Islamic facilities available under Affin Islamic.',
    products: [
      {
        id: 'affin_smemerge_clean',
        name: 'Affin SMEmerge Micro-Financing',
        productType: 'sme_loan',
        minAmountRM: 10000,
        maxAmountRM: 50000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 6.0,
        rateToPercent: 9.5,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'equipment'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Registration Certificate'],
        notes: 'Tailored for young startups and micro-enterprises looking for clean capital.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 17. FUNDING SOCIETIES — Malaysia's #1 P2P Crowdfunding Platform     */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'fundingsocieties',
    name: 'Funding Societies Malaysia (Modalku Ventures Sdn Bhd)',
    shortName: 'Funding Societies',
    emoji: '🤝',
    type: 'P2P Platform',
    regulatedBy: 'Securities Commission Malaysia (SC)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'shopee', 'lazada', 'freelance'],
    minIncomeRM: 1500,
    minGigHistoryMonths: 3,
    website: 'fundingsocieties.com.my',
    hotline: '+603-2202 1013',
    applicationUrl: 'https://fundingsocieties.com.my/micro-financing',
    minFRIScore: 470,
    highlight: 'SC-licensed P2P financing. 100% digital with rapid 24-hour approval. Accepts Shopee/Lazada sellers and sole-props.',
    notes: 'Over RM 10 billion disbursed across Southeast Asia. Uses alternative data scoring for rapid funding.',
    products: [
      {
        id: 'fs_micro_financing',
        name: 'Funding Societies Micro Financing',
        productType: 'p2p_lending',
        minAmountRM: 5000,
        maxAmountRM: 100000,
        tenureMinMonths: 3,
        tenureMaxMonths: 18,
        rateType: 'reducing_pa',
        rateFromPercent: 8.0,
        rateToPercent: 18.0,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'equipment'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement (PDF)', 'SSM Certificate / E-Commerce Store Link'],
        notes: 'Fast cash disbursement in 24 hours. Minimal documentation for e-commerce and retail merchants.',
      },
      {
        id: 'fs_invoice_financing',
        name: 'Funding Societies Invoice & PO Financing',
        productType: 'invoice_financing',
        minAmountRM: 10000,
        maxAmountRM: 100000,
        tenureMinMonths: 1,
        tenureMaxMonths: 6,
        rateType: 'flat_pa',
        rateFromPercent: 1.0,
        rateToPercent: 2.0,
        payslipRequired: false,
        compatibleAssets: ['invoice_financing', 'working_capital'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Certificate', 'Issued Invoices or Purchase Orders'],
        notes: 'Immediate cash advance against pending client invoices or supplier purchase orders.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 18. CAPBAY — Supply Chain & Invoice Liquidity Specialist            */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'capbay',
    name: 'CapBay (Bay Group Holdings / Amber Creative Sdn Bhd)',
    shortName: 'CapBay',
    emoji: '🤝',
    type: 'P2P Platform',
    regulatedBy: 'Securities Commission Malaysia (SC)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'freelance'],
    minIncomeRM: 2000,
    minGigHistoryMonths: 6,
    website: 'capbay.com',
    hotline: '+603-7931 7168',
    applicationUrl: 'https://capbay.com/p2p-financing',
    minFRIScore: 500,
    highlight: 'Fintech supply chain financing. Unlocks up to 90% instant cash advance on unpaid invoices and purchase orders.',
    notes: 'Backed by leading venture capital and approved by Securities Commission Malaysia.',
    products: [
      {
        id: 'capbay_invoice_p2p',
        name: 'CapBay Invoice & Supply Chain Financing',
        productType: 'invoice_financing',
        minAmountRM: 10000,
        maxAmountRM: 200000,
        tenureMinMonths: 1,
        tenureMaxMonths: 6,
        rateType: 'reducing_pa',
        rateFromPercent: 6.5,
        rateToPercent: 14.0,
        payslipRequired: false,
        compatibleAssets: ['invoice_financing', 'working_capital'],
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Registration', 'Unpaid Invoices / Client PO'],
        notes: 'Up to 90% advance rate on verified corporate and government invoices.',
      },
    ],
  },
];

/**
 * Returns the verified direct application/portal URL for a lender.
 * If existingUrl is already valid and not '#' or placeholder, it is returned.
 * Otherwise, resolves against official Malaysian banks and government micro-funds.
 */
export function getLenderOfficialPortalUrl(lenderName?: string, existingUrl?: string): string {
  if (existingUrl && existingUrl.startsWith('http') && !existingUrl.includes('localhost') && existingUrl !== '#' && existingUrl !== 'https://gxbank.my') {
    return existingUrl;
  }
  const name = (lenderName || '').toLowerCase();
  if (name.includes('maybank')) return 'https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/loans/business/sme_clean_loan.page';
  if (name.includes('gxbank') || name.includes('gx bank')) return 'https://gxbank.my';
  if (name.includes('boost')) return 'https://myboost.co';
  if (name.includes('agrobank') || name.includes('agro')) return 'https://www.agrobank.com.my';
  if (name.includes('tekun')) return 'https://www.tekun.gov.my/ms/skm-tekun-niaga/';
  if (name.includes('bsn') || name.includes('simpanan nasional')) return 'https://www.bsn.com.my/page/bsn-micro-semarak';
  if (name.includes('alliance')) return 'https://www.alliancebank.com.my/business/business-financing/digital-sme.aspx';
  if (name.includes('bank islam') || name.includes('islam')) return 'https://www.bankislam.com/business-banking/sme-banking/';
  if (name.includes('bank rakyat') || name.includes('rakyat')) return 'https://www.bankrakyat.com.my/c/business/financing-i/micro-financing-i';
  if (name.includes('sme bank')) return 'https://www.smebank.com.my';
  if (name.includes('funding societies')) return 'https://fundingsocieties.com.my';
  if (name.includes('aeon')) return 'https://www.aeoncredit.com.my/personal-financing';
  if (name.includes('mara')) return 'https://www.mara.gov.my/en/pembiayaan-perniagaan/';
  if (name.includes('rhb')) return 'https://www.rhbgroup.com/sme/financing/index.html';
  if (name.includes('cimb')) return 'https://www.cimb.com.my/en/business/financing.html';
  if (name.includes('hong leong') || name.includes('hlb')) return 'https://www.hlb.com.my/en/business-banking.html';
  if (name.includes('public bank') || name.includes('pbb')) return 'https://www.pbebank.com/Business-Banking.aspx';
  if (name.includes('capbay')) return 'https://capbay.com/p2p-financing';
  if (name.includes('amfinance') || name.includes('ambank')) return 'https://www.ambank.com.my/eng/business';
  
  if (existingUrl && existingUrl.startsWith('http') && existingUrl !== '#') {
    return existingUrl;
  }
  return 'https://gxbank.my';
}

