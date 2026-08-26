/**
 * Malaysian Licensed Alternative Lender Database
 * Sources: BNM Financial Consumer Alert, SC Malaysia P2P Register,
 * individual lender official websites and published rate sheets.
 * 
 * IMPORTANT: Rates shown are indicative based on publicly advertised ranges.
 * Final rates are subject to individual lender credit assessment.
 * Last updated: July 2026. Verify current terms at each lender's official website.
 */

export type LenderType =
  | 'Digital Bank'
  | 'Commercial Bank'
  | 'Islamic Bank'
  | 'Finance Company'
  | 'P2P Platform'
  | 'Cooperative Bank'
  | 'Development Bank';

export type AssetType = 'car' | 'bike' | 'van' | 'equipment' | 'personal_cash' | 'working_capital' | 'invoice_financing' | 'education' | 'vehicle';

export type ProductType =
  | 'hire_purchase'
  | 'personal_financing'
  | 'sme_loan'
  | 'p2p_lending'
  | 'micro_credit'
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
  /** % per annum — multiply by tenure years for flat, use amortisation for reducing */
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
  /** Gig platform IDs this lender specifically integrates with or caters for */
  acceptedPlatforms: string[];
  minIncomeRM: number;
  minGigHistoryMonths: number;
  website: string;
  hotline: string;
  applicationUrl: string;
  /** Minimum FRI score we recommend before applying */
  minFRIScore: number;
  highlight: string;
  notes: string;
}

export const LENDERS: Lender[] = [
  /* ─────────────────────────────────────────────────────────────────── */
  /* 1. GX BANK — Malaysia's first digital bank, Grab ecosystem           */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'gxbank',
    name: 'GX Bank Berhad',
    shortName: 'GX Bank',
    emoji: '🏦',
    type: 'Digital Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['grab', 'grabpay', 'grabfood'],
    minIncomeRM: 1500,
    minGigHistoryMonths: 3,
    website: 'gxbank.my',
    hotline: '+603-2787 7000',
    applicationUrl: 'https://www.gxbank.my/flexicredit',
    minFRIScore: 460,
    highlight:
      "Malaysia's first licensed digital bank. Grab earnings accepted as primary income proof — no payslip needed.",
    notes:
      'Part of the Grab Holdings ecosystem. Grab/GrabPay transaction history used directly from the Grab app. 3 months Grab activity is the primary underwriting data source.',
    products: [
      {
        id: 'gxbank_flexicredit',
        name: 'GX FlexiCredit',
        productType: 'personal_financing',
        minAmountRM: 1000,
        maxAmountRM: 70000,
        tenureMinMonths: 6,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 16.56,
        rateToPercent: 30.24,
        payslipRequired: false,
        compatibleAssets: ['car', 'bike', 'van', 'equipment'],
        requiredDocs: ['MyKad / NRIC', 'Grab app — 3 months earnings (in-app screenshot or CSV)', 'GrabPay transaction history'],
        notes:
          'Primary product for Grab drivers and delivery riders. Grab ecosystem data used directly — fastest approval among all listed lenders.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 2. AEON CREDIT — Largest HP finance company, very gig-friendly       */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'aeon_credit',
    name: 'AEON Credit Service (M) Berhad',
    shortName: 'AEON Credit',
    emoji: '🏪',
    type: 'Finance Company',
    regulatedBy: 'BNM / Ministry of Finance (Licensed Moneylender)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['grab', 'grabfood', 'foodpanda', 'lalamove', 'shopee', 'lazada', 'all'],
    minIncomeRM: 1000,
    minGigHistoryMonths: 6,
    website: 'aeoncredit.com.my',
    hotline: '1800-88-2366',
    applicationUrl: 'https://apply.aeoncredit.com.my',
    minFRIScore: 440,
    highlight:
      'Largest HP finance company in Malaysia. Over 50 service centres nationwide. Self-employed accepted with bank statements.',
    notes:
      'Operates under Hire Purchase Act 1967. Very flexible with self-employed and gig workers. Guarantor may be required if monthly income is below RM 2,500.',
    products: [
      {
        id: 'aeon_vehicle_hp',
        name: 'AEON Vehicle Hire Purchase',
        productType: 'hire_purchase',
        minAmountRM: 5000,
        maxAmountRM: 80000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 5.5,
        rateToPercent: 8.5,
        payslipRequired: false,
        compatibleAssets: ['car', 'bike', 'van'],
        requiredDocs: [
          'MyKad / NRIC',
          '3–6 months bank statement (PDF, not screenshot)',
          'Vehicle quotation from dealer',
          'Platform earnings screenshot (6 months)',
          'LHDN receipt (if available)',
        ],
        notes: 'Accepts e-hailing drivers and delivery riders. Proton, Perodua, and used vehicles accepted.',
      },
      {
        id: 'aeon_personal',
        name: 'AEON Personal Cash Advance',
        productType: 'personal_financing',
        minAmountRM: 1000,
        maxAmountRM: 20000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'flat_pa',
        rateFromPercent: 16.0,
        rateToPercent: 21.0,
        payslipRequired: false,
        compatibleAssets: ['car', 'bike', 'van', 'equipment'],
        requiredDocs: ['MyKad / NRIC', '3 months bank statement'],
        notes: 'Quick turnaround cash financing. Higher rate but very low documentation barrier.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 3. HONG LEONG FINANCE — HP specialist, self-employed accepted        */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'hong_leong_finance',
    name: 'Hong Leong Finance Berhad',
    shortName: 'HL Finance',
    emoji: '🚗',
    type: 'Finance Company',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['grab', 'grabfood', 'foodpanda', 'lalamove', 'all'],
    minIncomeRM: 1500,
    minGigHistoryMonths: 6,
    website: 'hlfinance.com.my',
    hotline: '+603-2080 5000',
    applicationUrl: 'https://www.hlfinance.com.my/hire-purchase',
    minFRIScore: 490,
    highlight: 'HP specialist subsidiary of Hong Leong Bank. Competitive rates for new and used vehicles. Self-employed accepted.',
    notes:
      'Strong HP track record. Used car financing including Proton, Perodua, Honda, Toyota. Self-employed require LHDN or EPF as supplementary income proof.',
    products: [
      {
        id: 'hlf_vehicle_hp',
        name: 'HL Finance Vehicle Hire Purchase',
        productType: 'hire_purchase',
        minAmountRM: 10000,
        maxAmountRM: 150000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'flat_pa',
        rateFromPercent: 2.8,
        rateToPercent: 4.5,
        payslipRequired: false,
        compatibleAssets: ['car', 'van'],
        requiredDocs: [
          'MyKad / NRIC',
          '6 months bank statement (PDF)',
          'Vehicle Sales Agreement / Quotation',
          'LHDN Form B (latest year)',
          'Self-Employment Income Declaration Letter',
          'EPF / KWSP statement (optional, strengthens)',
        ],
        notes:
          'One of the most competitive HP rates for self-employed. Used vehicles accepted. LHDN strongly recommended.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 4. BANK RAKYAT — Islamic cooperative, strong B40 / M40 focus         */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bank_rakyat',
    name: 'Bank Kerjasama Rakyat Malaysia Berhad',
    shortName: 'Bank Rakyat',
    emoji: '🕌',
    type: 'Cooperative Bank',
    regulatedBy: 'BNM / Ministry of Finance (Cooperative Bank)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['grab', 'grabfood', 'foodpanda', 'shopee', 'all'],
    minIncomeRM: 1500,
    minGigHistoryMonths: 6,
    website: 'bankrakyat.com.my',
    hotline: '1300-80-5454',
    applicationUrl: 'https://www.bankrakyat.com.my/p/pinjaman-peribadi-rakyat',
    minFRIScore: 490,
    highlight:
      'Fully Shariah-compliant cooperative bank. Competitive profit rates for B40/M40 self-employed Malaysians.',
    notes:
      'Cooperative structure means more lenient income assessment for lower-income brackets. EPF contributions accepted as income proxy. Widely available across peninsular Malaysia.',
    products: [
      {
        id: 'br_peribadi',
        name: 'Pinjaman Peribadi Rakyat',
        productType: 'personal_financing',
        minAmountRM: 5000,
        maxAmountRM: 150000,
        tenureMinMonths: 12,
        tenureMaxMonths: 120,
        rateType: 'profit_rate_pa',
        rateFromPercent: 4.35,
        rateToPercent: 5.35,
        payslipRequired: false,
        compatibleAssets: ['car', 'bike', 'van', 'equipment'],
        requiredDocs: [
          'MyKad / NRIC',
          '6 months bank statement',
          'EPF / KWSP statement (latest)',
          'SSM certificate (if business owner)',
          'LHDN Form B / Form BE',
        ],
        notes: 'Tawarruq structure. Available to self-employed with EPF contribution evidence as income proxy.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 5. BSN — Government development bank, lowest income bar              */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bsn',
    name: 'Bank Simpanan Nasional (BSN)',
    shortName: 'BSN',
    emoji: '🏛️',
    type: 'Development Bank',
    regulatedBy: 'BNM / Ministry of Finance (Government-Owned)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['all'],
    minIncomeRM: 500,
    minGigHistoryMonths: 3,
    website: 'bsn.com.my',
    hotline: '1300-88-1900',
    applicationUrl: 'https://www.bsn.com.my/microkredit',
    minFRIScore: 390,
    highlight:
      'Government development bank. Very accessible for B40 hawkers and micro-entrepreneurs. Lowest income threshold of all listed lenders.',
    notes:
      'MicroKredit BSN specifically designed for micro-entrepreneurs and hawkers. No collateral needed for loans up to RM 20,000. Wide branch network across Malaysia.',
    products: [
      {
        id: 'bsn_microkredit',
        name: 'MicroKredit BSN',
        productType: 'micro_credit',
        minAmountRM: 1000,
        maxAmountRM: 50000,
        tenureMinMonths: 6,
        tenureMaxMonths: 60,
        rateType: 'flat_pa',
        rateFromPercent: 4.0,
        rateToPercent: 7.0,
        payslipRequired: false,
        compatibleAssets: ['car', 'bike', 'van', 'equipment'],
        requiredDocs: [
          'MyKad / NRIC',
          '3 months bank statement',
          'SSM certificate (or statutory declaration)',
          'Business premise photo proof',
        ],
        notes:
          'Designed for micro-entrepreneurs and hawkers. Application can be done at any BSN branch. No collateral for loans up to RM 20,000.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 6. AMBANK HP — Competitive HP rates, e-hailing accepted              */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'ambank_hp',
    name: 'AmBank (M) Berhad — Hire Purchase Division',
    shortName: 'AmBank HP',
    emoji: '🏎️',
    type: 'Commercial Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['grab', 'lalamove', 'all'],
    minIncomeRM: 2000,
    minGigHistoryMonths: 6,
    website: 'ambank.com.my',
    hotline: '1300-88-8888',
    applicationUrl: 'https://www.ambank.com.my/personal/loans/hire-purchase',
    minFRIScore: 510,
    highlight: 'Major commercial bank with competitive HP rates. Self-employed accepted with LHDN Form B documentation.',
    notes:
      'Strong HP division. Self-employed applicants require LHDN Form B (2 years) and 6 months bank statement. Guarantor improves borderline cases significantly.',
    products: [
      {
        id: 'ambank_car_hp',
        name: 'AmBank Vehicle Hire Purchase',
        productType: 'hire_purchase',
        minAmountRM: 15000,
        maxAmountRM: 500000,
        tenureMinMonths: 12,
        tenureMaxMonths: 108,
        rateType: 'flat_pa',
        rateFromPercent: 2.5,
        rateToPercent: 4.0,
        payslipRequired: false,
        compatibleAssets: ['car', 'van'],
        requiredDocs: [
          'MyKad / NRIC',
          '6 months bank statement',
          'Vehicle Sales Agreement',
          'LHDN Form B (2 years)',
          'EPF / KWSP statement',
        ],
        notes:
          'Competitive rates for new and reconditioned vehicles. E-hailing drivers accepted with Grab earnings proof + LHDN.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 7. AL RAJHI BANK — Fully Shariah-compliant Islamic bank              */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'al_rajhi',
    name: 'Al Rajhi Bank Malaysia Berhad',
    shortName: 'Al Rajhi',
    emoji: '🏛️',
    type: 'Islamic Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM) — Islamic Banking',
    shariah: true,
    gigFriendly: false,
    acceptedPlatforms: ['all'],
    minIncomeRM: 2000,
    minGigHistoryMonths: 12,
    website: 'alrajhibank.com.my',
    hotline: '+603-2382 3333',
    applicationUrl: 'https://www.alrajhibank.com.my/personal-banking/financing',
    minFRIScore: 530,
    highlight:
      "World's largest Islamic bank. Shariah-compliant Al-Tawarruq personal financing with competitive profit rates.",
    notes:
      'Fully Halal financing via Tawarruq commodity structure. Ideal for Muslim gig workers preferring Shariah-compliant products. LHDN Form B strongly recommended for self-employed.',
    products: [
      {
        id: 'alrajhi_peribadi',
        name: 'Personal Financing-i (Al-Tawarruq)',
        productType: 'personal_financing',
        minAmountRM: 5000,
        maxAmountRM: 150000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'profit_rate_pa',
        rateFromPercent: 3.99,
        rateToPercent: 6.5,
        payslipRequired: false,
        compatibleAssets: ['car', 'bike', 'van', 'equipment'],
        requiredDocs: [
          'MyKad / NRIC',
          '6 months bank statement',
          'EPF / KWSP statement',
          'LHDN Form B (latest year)',
          'SSM certificate (if business)',
        ],
        notes: 'Competitive Shariah-compliant profit rates. LHDN Form B is critical for self-employed approval.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 8. FUNDING SOCIETIES — SC-licensed P2P, SME equipment financing      */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'funding_societies',
    name: 'Funding Societies Malaysia (Modalku Group)',
    shortName: 'Funding Societies',
    emoji: '🤝',
    type: 'P2P Platform',
    regulatedBy: 'Securities Commission Malaysia (SC) — P2P License',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['shopee', 'lazada', 'all'],
    minIncomeRM: 3000,
    minGigHistoryMonths: 12,
    website: 'fundingsocieties.com.my',
    hotline: '+603-2110 0021',
    applicationUrl: 'https://fundingsocieties.com.my/borrower',
    minFRIScore: 510,
    highlight:
      'SC-licensed P2P leader. SME equipment and working capital financing. Strong for Shopee/Lazada merchants needing growth capital.',
    notes:
      'Requires minimum 1 year SSM-registered business history. Platform GMV data accepted as supplementary income evidence. Competitive rates for established online sellers.',
    products: [
      {
        id: 'fs_sme_term',
        name: 'SME Term Financing',
        productType: 'sme_loan',
        minAmountRM: 20000,
        maxAmountRM: 500000,
        tenureMinMonths: 3,
        tenureMaxMonths: 24,
        rateType: 'reducing_pa',
        rateFromPercent: 10.0,
        rateToPercent: 18.0,
        payslipRequired: false,
        compatibleAssets: ['equipment', 'van'],
        requiredDocs: [
          'SSM Registration (min 1 year)',
          '6 months bank statement',
          'Latest management accounts or audited financials',
          'Shopee / Lazada Seller Center export (GMV 6 months)',
          'Invoice or purchase order (if applicable)',
        ],
        notes:
          'Strong match for established online sellers needing equipment capital. Platform GMV accepted alongside bank statements.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 9. CAPBAY — SC-licensed P2P, Shopee/Lazada specialist                */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'capbay',
    name: 'CapBay (Peoplender Sdn Bhd)',
    shortName: 'CapBay',
    emoji: '🛒',
    type: 'P2P Platform',
    regulatedBy: 'Securities Commission Malaysia (SC) — P2P License',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['shopee', 'lazada', 'grab'],
    minIncomeRM: 3000,
    minGigHistoryMonths: 12,
    website: 'capbay.com',
    hotline: '+603-2779 3050',
    applicationUrl: 'https://capbay.com/borrow',
    minFRIScore: 510,
    highlight:
      'Specialist in Shopee/Lazada seller supply chain financing. GMV data from your seller dashboard accepted directly.',
    notes:
      'Directly integrates with Shopee Seller Center and Lazada Seller Center for income verification. Fastest approval for active e-commerce sellers. Invoice financing for supplier invoices.',
    products: [
      {
        id: 'capbay_supply_chain',
        name: 'Supply Chain & Invoice Financing',
        productType: 'invoice_financing',
        minAmountRM: 10000,
        maxAmountRM: 300000,
        tenureMinMonths: 1,
        tenureMaxMonths: 12,
        rateType: 'flat_pa',
        rateFromPercent: 8.0,
        rateToPercent: 15.0,
        payslipRequired: false,
        compatibleAssets: ['equipment'],
        requiredDocs: [
          'SSM Registration',
          'Shopee / Lazada Seller Center export (GMV 6 months)',
          '3 months bank statement',
          'Supplier invoices or purchase orders',
        ],
        notes:
          'Outstanding match for active Shopee or Lazada sellers. GMV platform data is the primary income evidence — no LHDN required.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 10. MODALKU — SC-licensed P2P, broad SME and merchant coverage       */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'modalku',
    name: 'Modalku Malaysia (Funding Pte Ltd)',
    shortName: 'Modalku',
    emoji: '💼',
    type: 'P2P Platform',
    regulatedBy: 'Securities Commission Malaysia (SC) — P2P License',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['shopee', 'lazada', 'foodpanda', 'all'],
    minIncomeRM: 2000,
    minGigHistoryMonths: 6,
    website: 'modalku.com.my',
    hotline: '+603-2282 8881',
    applicationUrl: 'https://modalku.com.my/borrower',
    minFRIScore: 470,
    highlight:
      'Flexible SME and micro-business cash advance. Merchant-friendly with e-commerce and F&B income accepted.',
    notes:
      'Broad acceptance of merchant income data. Particularly suited for food vendors, online sellers, and freelancers with 6+ months business history. SSM sole proprietors considered.',
    products: [
      {
        id: 'modalku_business',
        name: 'Business Term Loan',
        productType: 'sme_loan',
        minAmountRM: 5000,
        maxAmountRM: 200000,
        tenureMinMonths: 3,
        tenureMaxMonths: 24,
        rateType: 'reducing_pa',
        rateFromPercent: 10.0,
        rateToPercent: 20.0,
        payslipRequired: false,
        compatibleAssets: ['equipment', 'van'],
        requiredDocs: [
          'MyKad / NRIC',
          'SSM Registration (sole proprietor / partnership)',
          '6 months bank statement',
          'E-commerce platform GMV export',
        ],
        notes:
          'Accepting sole proprietors and hawkers. SSM registration preferred but not always mandatory for small amounts.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 11. RHB SME — Established SME financing for larger businesses        */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'rhb_sme',
    name: 'RHB Bank Berhad — SME Banking',
    shortName: 'RHB SME',
    emoji: '🏗️',
    type: 'Commercial Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: false,
    acceptedPlatforms: ['shopee', 'lazada', 'all'],
    minIncomeRM: 4000,
    minGigHistoryMonths: 24,
    website: 'rhb.com.my/sme',
    hotline: '03-9206 8118',
    applicationUrl: 'https://www.rhb.com.my/personal/loans-and-financing/sme',
    minFRIScore: 570,
    highlight:
      'SME business financing for established businesses. Best for online merchants with 2+ years track record seeking equipment capital.',
    notes:
      'Requires 2 years business operation and full financials. High documentation bar but competitive rates and large loan quantum for qualified applicants.',
    products: [
      {
        id: 'rhb_sme_term',
        name: 'RHB SME Term Financing',
        productType: 'sme_loan',
        minAmountRM: 50000,
        maxAmountRM: 3000000,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        rateType: 'reducing_pa',
        rateFromPercent: 6.5,
        rateToPercent: 10.0,
        payslipRequired: false,
        compatibleAssets: ['van', 'equipment'],
        requiredDocs: [
          'SSM Registration (2+ years)',
          '12 months bank statement',
          'Audited accounts / management accounts',
          'Tax returns (2 years)',
          'Business profile / company background',
        ],
        notes: 'Suitable for businesses with RM 500K+ annual revenue seeking significant equipment or vehicle capital.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 12. CIMB BIMB — Largest commercial bank, established SME financing   */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'cimb_biz',
    name: 'CIMB Bank Berhad — Business Banking',
    shortName: 'CIMB BizReady',
    emoji: '💳',
    type: 'Commercial Bank',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: false,
    acceptedPlatforms: ['shopee', 'lazada', 'grab', 'all'],
    minIncomeRM: 5000,
    minGigHistoryMonths: 24,
    website: 'cimb.com.my/sme',
    hotline: '1300-880-900',
    applicationUrl: 'https://www.cimb.com.my/en/business/financing.html',
    minFRIScore: 590,
    highlight:
      'Established SME working capital and equipment financing. Best rates in market for qualified applicants with full documentation.',
    notes:
      'CIMB BizReady targets established SMEs. Very high documentation bar but most competitive rates for qualified applicants with strong financials.',
    products: [
      {
        id: 'cimb_bizready',
        name: 'CIMB BizReady Business Financing',
        productType: 'sme_loan',
        minAmountRM: 50000,
        maxAmountRM: 2000000,
        tenureMinMonths: 12,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 5.5,
        rateToPercent: 8.5,
        payslipRequired: false,
        compatibleAssets: ['van', 'equipment'],
        requiredDocs: [
          'SSM Registration (2+ years)',
          '12 months bank statement',
          'Audited accounts (2 years)',
          'Corporate tax returns',
          'Company profile',
          "Directors' NRIC",
        ],
        notes: 'Best rates in the market for fully-documented established SMEs.',
      },
    ],
  },
];
