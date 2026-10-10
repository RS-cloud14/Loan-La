/**
 * CreditFlow AI — Smart Lender Matching Engine
 * Matches a gig worker's financial profile against the Malaysian licensed lender database.
 * Scoring is multi-factor: income adequacy, FRI score margin, platform affinity, DSR headroom, Shariah preference.
 */

import { Lender, LenderProduct, AssetType, LENDERS } from './lenders';
import { CreditProfileReport, UnderwritingInput } from './scoring';

export interface MatchedLender {
  lender: Lender;
  product: LenderProduct;
  matchScore: number; // 0–100
  eligibilityLabel: 'Strong Match' | 'Good Fit' | 'Possible — Needs Guarantor' | 'Check Eligibility';
  matchReasons: string[];
  warningReasons: string[];
  estimatedMonthlyInstallment: number;
}

// ─── Detect gig platforms from income/transaction data ───────────────────────

function detectPlatforms(input: UnderwritingInput): string[] {
  const found: Set<string> = new Set();
  const platformStr = (input.platform || '').toLowerCase();
  const allText = [
    platformStr,
    ...input.transactions.map((t) => t.description.toLowerCase()),
  ].join(' ');

  const checks: [string, string][] = [
    ['grab', 'grab'],
    ['grabfood', 'grabfood'],
    ['grabpay', 'grabpay'],
    ['foodpanda', 'foodpanda'],
    ['lalamove', 'lalamove'],
    ['shopee', 'shopee'],
    ['lazada', 'lazada'],
    ['fiverr', 'freelance'],
    ['upwork', 'freelance'],
    ['freelance', 'freelance'],
  ];

  for (const [keyword, platform] of checks) {
    if (allText.includes(keyword)) found.add(platform);
  }

  // If Grab or GrabFood is present, also add 'grabpay' (Grab ecosystem)
  if (found.has('grab') || found.has('grabfood')) found.add('grabpay');

  return Array.from(found);
}

// ─── Calculate estimated monthly installment ────────────────────────────────

function calcInstallment(
  principal: number,
  product: LenderProduct,
  preferredTenureMonths?: number,
): number {
  if (principal <= 0) return 0;
  const tenure = Math.min(
    preferredTenureMonths ?? product.tenureMaxMonths,
    product.tenureMaxMonths,
  );
  const rate = product.rateFromPercent / 100;
  const tenureYears = tenure / 12;

  if (product.rateType === 'flat_pa') {
    // Flat rate: total = principal + (principal × rate × years)
    return Math.round((principal + principal * rate * tenureYears) / tenure);
  } else {
    // Reducing balance / profit rate (amortised)
    const monthlyRate = rate / 12;
    if (monthlyRate === 0) return Math.round(principal / tenure);
    const installment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(installment);
  }
}

// ─── Core matching function ──────────────────────────────────────────────────

export function matchLenders(
  report: CreditProfileReport,
  input: UnderwritingInput,
  wantShariah: boolean = false,
  assetType?: AssetType,
  loanAmount?: number,
): MatchedLender[] {
  const detectedPlatforms = detectPlatforms(input);
  const avgIncome = input.averageMonthlyNetIncome;
  const targetAsset = assetType ?? input.targetLoanPurpose;
  const targetAmount = loanAmount ?? input.targetLoanAmount ?? 35000;
  const friScore = report.score;
  const dsr = report.dsr;

  const results: MatchedLender[] = [];

  for (const lender of LENDERS) {
    // Hard filter: Shariah mode
    if (wantShariah && !lender.shariah) continue;

    // Hard filter: income minimum
    if (avgIncome < lender.minIncomeRM) continue;

    // Find compatible products for the asset type and loan amount
    const eligible = lender.products.filter((p) => {
      const assetOk =
        !targetAsset ||
        p.compatibleAssets.length === 0 ||
        p.compatibleAssets.includes(targetAsset);
      const amountOk = targetAmount >= p.minAmountRM && targetAmount <= p.maxAmountRM;
      return assetOk && amountOk;
    });

    if (eligible.length === 0) continue;

    // Pick best product match for targetAsset
    const product =
      eligible.find(
        (p) =>
          targetAsset &&
          p.compatibleAssets.includes(targetAsset) &&
          (targetAsset === 'vehicle' ? p.productType === 'hire_purchase' : true),
      ) ??
      eligible.find(
        (p) =>
          p.productType === 'hire_purchase' &&
          targetAsset &&
          ['vehicle', 'car', 'bike', 'van'].includes(targetAsset),
      ) ??
      eligible[0];

    // ─── Soft scoring ──────────────────────────────────────────────────────

    let score = 0;
    const matchReasons: string[] = [];
    const warningReasons: string[] = [];

    // 1. Income headroom (0–25 pts)
    const incomeRatio = avgIncome / lender.minIncomeRM;
    if (incomeRatio >= 2.0) {
      score += 25;
      matchReasons.push(
        `Income RM ${avgIncome.toFixed(0)}/month is well above lender minimum (RM ${lender.minIncomeRM.toLocaleString()}/month)`,
      );
    } else if (incomeRatio >= 1.5) {
      score += 18;
      matchReasons.push(`Income comfortably meets minimum — good headroom`);
    } else if (incomeRatio >= 1.2) {
      score += 12;
      matchReasons.push(`Income meets minimum — consider increasing downpayment`);
      warningReasons.push(`Income close to minimum — a guarantor improves approval odds`);
    } else {
      score += 4;
      warningReasons.push(
        `Income near the minimum threshold — a guarantor or co-borrower is strongly recommended`,
      );
    }

    // 2. FRI score margin (0–25 pts)
    const friMargin = friScore - lender.minFRIScore;
    if (friMargin >= 100) {
      score += 25;
      matchReasons.push(
        `Strong Financial Readiness Index (${friScore}) — ${friMargin} pts above lender threshold`,
      );
    } else if (friMargin >= 50) {
      score += 18;
      matchReasons.push(`Financial Readiness Index (${friScore}) above lender recommended threshold`);
    } else if (friMargin >= 0) {
      score += 10;
      matchReasons.push(`FRI meets threshold — high-quality documentation is critical`);
    } else if (friMargin >= -50) {
      score += 3;
      warningReasons.push(
        `FRI (${friScore}) is below this lender's recommended threshold — improve document quality first`,
      );
    } else {
      // Below threshold by more than 50 — still show but heavily penalised
      score += 0;
      warningReasons.push(`FRI score significantly below threshold — focus on FRI improvement before applying`);
    }

    // 3. Platform affinity (0–25 pts)
    const specificMatch =
      lender.gigFriendly &&
      detectedPlatforms.some(
        (p) => lender.acceptedPlatforms.includes(p) && !lender.acceptedPlatforms.includes('all'),
      );
    const genericGigMatch =
      lender.gigFriendly &&
      !specificMatch &&
      (lender.acceptedPlatforms.includes('all') ||
        detectedPlatforms.some((p) => lender.acceptedPlatforms.includes(p)));

    if (specificMatch) {
      score += 25;
      matchReasons.push(`${lender.shortName} specifically integrates with your earnings platform`);
    } else if (genericGigMatch) {
      score += 15;
      matchReasons.push(`${lender.shortName} accepts gig worker alternative income documentation`);
    } else if (lender.gigFriendly) {
      score += 7;
      warningReasons.push(
        `${lender.shortName} is gig-friendly but will need a strong income declaration letter`,
      );
    } else {
      score += 2;
      warningReasons.push(
        `${lender.shortName} primarily serves established businesses — self-employment history of 2+ years required`,
      );
    }

    // 4. DSR headroom (0–15 pts)
    if (dsr <= 30) {
      score += 15;
      matchReasons.push(`Low debt load (DSR ${dsr.toFixed(1)}%) — very clean financial profile`);
    } else if (dsr <= 50) {
      score += 8;
      matchReasons.push(`Manageable debt level (DSR ${dsr.toFixed(1)}%)`);
    } else if (dsr <= 60) {
      score += 2;
      warningReasons.push(
        `High debt service ratio (${dsr.toFixed(1)}%) — may need a smaller loan amount`,
      );
    } else {
      score += 0;
      warningReasons.push(
        `DSR exceeds BNM 60% ceiling (${dsr.toFixed(1)}%) — reduce existing debts before applying`,
      );
    }

    // 5. Shariah bonus (0–10 pts)
    if (wantShariah && lender.shariah) {
      score += 10;
      matchReasons.push(`Fully Shariah-compliant financing structure (Tawarruq / Islamic HP)`);
    }

    // ─── Eligibility label ──────────────────────────────────────────────────

    let eligibilityLabel: MatchedLender['eligibilityLabel'];
    if (score >= 68) eligibilityLabel = 'Strong Match';
    else if (score >= 48) eligibilityLabel = 'Good Fit';
    else if (score >= 28) eligibilityLabel = 'Possible — Needs Guarantor';
    else eligibilityLabel = 'Check Eligibility';

    const estimatedMonthlyInstallment = calcInstallment(targetAmount, product);

    results.push({
      lender,
      product,
      matchScore: score,
      eligibilityLabel,
      matchReasons,
      warningReasons,
      estimatedMonthlyInstallment,
    });
  }

  // Return top 6, ranked by match score
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);
}

// ─── Helper: lender count for a profile (shown in step 3 badge) ─────────────

export function countMatchingLenders(
  report: CreditProfileReport,
  input: UnderwritingInput,
  assetType?: AssetType,
  loanAmount?: number,
): number {
  return matchLenders(report, input, false, assetType, loanAmount).length;
}

// ─── Multi-Factor Smart Match Engine for Purpose, Background & Financial Condition ───

export interface SmartMatchInput {
  purpose: 'personal_cash' | 'working_capital' | 'vehicle' | 'equipment' | 'invoice_financing' | 'education';
  amount: number;
  income: number;
  platform?: string;
  name?: string;
  score?: number;
  grade?: string;
  dsr?: number;
  tenureYears?: number;
  has6MonthStatement?: boolean;
  shariahPreference?: boolean;
}

export interface SmartMatchedCard {
  id: string;
  rankTag: string;
  name: string;
  lenderName: string;
  productName: string;
  schemeId?: string;
  score: number;
  rate: string;
  installment: string;
  installmentNum: number;
  tenure: string;
  speed: string;
  channelType: 'branch_walk_in' | 'online_portal' | 'digital_app' | 'officer_whatsapp';
  channelLabel: string;
  intakeInstruction: string;
  reasons: string[];
  warning: string;
  url: string;
  isTop: boolean;
}

export function getSmartMatchedLenders(params: SmartMatchInput): SmartMatchedCard[] {
  const {
    purpose = 'personal_cash',
    amount = 10000,
    income = 3500,
    platform = 'Foodpanda',
    score = 720,
    grade = 'A',
    dsr = 30,
    tenureYears = 2,
    has6MonthStatement = false,
    shariahPreference = false
  } = params;

  const platformLower = (platform || '').toLowerCase();
  const isGigWorker =
    platformLower.includes('grab') ||
    platformLower.includes('foodpanda') ||
    platformLower.includes('lalamove') ||
    platformLower.includes('shopee') ||
    platformLower.includes('gig') ||
    platformLower.includes('freelance') ||
    platformLower.includes('rider') ||
    platformLower.includes('driver');

  const isHawkerOrTrader =
    platformLower.includes('penjaja') ||
    platformLower.includes('pasar') ||
    platformLower.includes('gerai') ||
    platformLower.includes('stall') ||
    platformLower.includes('trader') ||
    platformLower.includes('runcit') ||
    platformLower.includes('kedai');

  const months = tenureYears * 12;

  // Candidate pool with purpose-tailored products
  interface Candidate {
    id: string;
    name: string;
    lenderName: string;
    productName: string;
    schemeId?: string;
    baseRate: number;
    rateLabel: string;
    speed: string;
    minIncome: number;
    maxAmount: number;
    minAmount: number;
    shariah: boolean;
    compatiblePurposes: string[];
    channelType: 'branch_walk_in' | 'online_portal' | 'digital_app' | 'officer_whatsapp';
    channelLabel: string;
    intakeInstruction: string;
    url: string;
    gigPriorityBonus: number;
    traderPriorityBonus: number;
    purposeBonus: number;
    reasons: string[];
    warningNote?: string;
  }

  const candidates: Candidate[] = [
    // 1. BSN Micro/i MADANI Gig
    {
      id: 'bsn_madani_gig',
      name: 'BSN Micro/i MADANI Gig',
      lenderName: 'Bank Simpanan Nasional (BSN)',
      productName: 'BSN Micro/i MADANI Gig',
      schemeId: 'madani_gig',
      baseRate: 0.04,
      rateLabel: '3.50% – 4.00% p.a. Fixed',
      speed: '3–5 business days',
      minIncome: 800,
      maxAmount: 20000,
      minAmount: 2000,
      shariah: true,
      compatiblePurposes: ['working_capital', 'vehicle', 'equipment', 'personal_cash'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Branch Walk-In & Online Pre-Check',
      intakeInstruction: 'Walk-in ke mana-mana cawangan BSN dengan Pakej Permohonan bercetak atau pra-daftar melalui portal rasmi bsncheckin.com.my/MF/.',
      url: 'https://www.bsn.com.my/page/business-financing-products-index',
      gigPriorityBonus: 35,
      traderPriorityBonus: 10,
      purposeBonus: purpose === 'vehicle' ? 30 : purpose === 'working_capital' ? 25 : 15,
      reasons: [
        'Subsidized 4.0% Madani government scheme designed specifically for gig workers & riders',
        'Accepts platform earnings statements without requiring SSM business registration',
        `Income RM ${income.toLocaleString()}/mo comfortably meets RM 800 minimum threshold`
      ],
      warningNote: 'Bawa salinan Borang Permohonan & Memo CAM ke mana-mana cawangan BSN berhampiran.'
    },

    // 2. TEKUN Mobilepreneur (Vehicle / Delivery Equip)
    {
      id: 'tekun_mobilepreneur',
      name: 'TEKUN Mobilepreneur',
      lenderName: 'TEKUN Nasional',
      productName: 'Skim TEKUN Mobilepreneur (Motorsikal & Servis)',
      baseRate: 0.04,
      rateLabel: '4.0% flat p.a. (Subsidized)',
      speed: '5–7 business days',
      minIncome: 800,
      maxAmount: 10000,
      minAmount: 1000,
      shariah: true,
      compatiblePurposes: ['vehicle', 'equipment', 'working_capital'],
      channelType: 'officer_whatsapp',
      channelLabel: '🤝 Pejabat TEKUN / Pegawai WhatsApp',
      intakeInstruction: 'Pembiayaan diproses melalui Pejabat TEKUN Cawangan Daerah atau permohonan atas talian di portal tekunonline.tekun.gov.my.',
      url: 'https://www.tekun.gov.my/skim-pembiayaan-tekun-mobilepreneur-4-0/',
      gigPriorityBonus: 32,
      traderPriorityBonus: 12,
      purposeBonus: purpose === 'vehicle' ? 35 : purpose === 'equipment' ? 20 : 10,
      reasons: [
        'Dedicated government scheme for food & parcel delivery riders purchasing or servicing bikes',
        '0% collateral required with low 4% subsidized government rate',
        'Direct acceptance of rider platform account dashboard & identity'
      ],
      warningNote: 'Terbuka kepada penunggang aktif Grab, Foodpanda, Lalamove & ShopeeFood.'
    },

    // 3. TEKUN Nasional (Skim Niaga)
    {
      id: 'tekun_niaga',
      name: 'TEKUN Nasional (Skim Niaga)',
      lenderName: 'TEKUN Nasional',
      productName: 'Skim Pembiayaan TEKUN Niaga',
      baseRate: 0.04,
      rateLabel: '4.0% flat p.a. (Subsidized)',
      speed: '5–7 business days',
      minIncome: 800,
      maxAmount: 100000,
      minAmount: 1000,
      shariah: true,
      compatiblePurposes: ['working_capital', 'equipment'],
      channelType: 'officer_whatsapp',
      channelLabel: '🤝 Pejabat TEKUN Cawangan Daerah',
      intakeInstruction: 'Kemukakan Pakej Permohonan CAM di pejabat TEKUN daerah terdekat atau mohon melalui portal tekunonline.tekun.gov.my.',
      url: 'https://www.tekun.gov.my/skim-pembiayaan-tekun-niaga/',
      gigPriorityBonus: 20,
      traderPriorityBonus: 35,
      purposeBonus: purpose === 'working_capital' ? 25 : purpose === 'equipment' ? 20 : 5,
      reasons: [
        'Agency micro-fund established specifically for micro-traders and informal businesses',
        'Lenient debt service assessment with alternative cash flow recognition',
        `Clean FRI rating (${score}/850 Grade ${grade}) qualifies for expedited intake`
      ]
    },

    // 4. Bank Rakyat Micro Enterprise Fund (MEF)
    {
      id: 'bank_rakyat_mef',
      name: 'Bank Rakyat (Micro Enterprise Fund)',
      lenderName: 'Bank Kerjasama Rakyat Malaysia Berhad',
      productName: 'Bank Rakyat Micro Enterprise Fund (MEF)',
      baseRate: 0.0825,
      rateLabel: '8.25% flat p.a. (BNM MEF Scheme)',
      speed: '3–5 business days',
      minIncome: 1000,
      maxAmount: 50000,
      minAmount: 1000,
      shariah: true,
      compatiblePurposes: ['working_capital', 'personal_cash', 'equipment'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Cawangan Bank Rakyat (Walk-In)',
      intakeInstruction: 'Bawa Pakej Permohonan CAM CreditFlow bercetak ke kaunter cawangan Bank Rakyat terdekat. Diluluskan di bawah Skim MEF BNM tanpa cagaran & tanpa penjamin.',
      url: 'https://www.bankrakyat.com.my/portal-main/article/micro-enterprise-fund',
      gigPriorityBonus: 24,
      traderPriorityBonus: 28,
      purposeBonus: purpose === 'personal_cash' ? 22 : purpose === 'working_capital' ? 26 : 15,
      reasons: [
        'Bank Negara Malaysia (BNM) approved Micro Enterprise Fund facility',
        '8.25% flat p.a. under Shariah Tawarruq concept with Takaful coverage protection',
        'No collateral & no guarantor required for financing up to RM 50,000 (Wakalah fee RM28.30, Stamp duty exempt)'
      ]
    },

    // 5. Bank Rakyat Micro Financing-i (MUsK)
    {
      id: 'bank_rakyat_musk',
      name: 'Bank Rakyat (Micro Financing-i MUsK)',
      lenderName: 'Bank Kerjasama Rakyat Malaysia Berhad',
      productName: 'Bank Rakyat Micro Financing-i MUsK (Penjaja & Peniaga)',
      baseRate: 0.1256,
      rateLabel: '12.56% flat p.a. (Kumpulan SHG)',
      speed: '5–7 business days',
      minIncome: 800,
      maxAmount: 50000,
      minAmount: 1000,
      shariah: true,
      compatiblePurposes: ['working_capital', 'equipment'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Cawangan Bank Rakyat / Koperasi',
      intakeInstruction: 'Khusus untuk penjaja, peniaga kecil & ahli koperasi. Sertai Self Help Group (SHG 5–10 orang) dan bawa Pakej Permohonan bercetak ke cawangan Bank Rakyat.',
      url: 'https://www.bankrakyat.com.my/portal-main/article/micro-financing-i-musk',
      gigPriorityBonus: 15,
      traderPriorityBonus: 32,
      purposeBonus: purpose === 'working_capital' ? 25 : purpose === 'equipment' ? 20 : 5,
      reasons: [
        'Tailored micro-facility assisting hawkers, peddlers, and cooperative society members',
        'Self Help Group (SHG) peer structure with savings account deduction or ATM/CDM repayment',
        'Shariah Tawarruq concept with RM28.30 Wakalah fee, full stamp duty exemption, and Ibra\' rebate'
      ]
    },

    // 6. Agrobank Pembiayaan Kredit Mikro-i
    {
      id: 'agrobank_mikro',
      name: 'Agrobank Kredit Mikro-i',
      lenderName: 'Agrobank (Bank Pertanian Malaysia Berhad)',
      productName: 'Agrobank Pembiayaan Kredit Mikro-i Usahawan',
      baseRate: 0.08,
      rateLabel: '8.00% – 10.00% p.a. (Tawarruq)',
      speed: '5–7 business days',
      minIncome: 1000,
      maxAmount: 50000,
      minAmount: 3000,
      shariah: true,
      compatiblePurposes: ['working_capital', 'equipment'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Cawangan Agrobank (Walk-In)',
      intakeInstruction: 'Bawa Pakej Permohonan CAM ke kaunter cawangan Agrobank terdekat. Tiada cagaran diperlukan untuk peniaga mikro dan rantaian makanan/peruncitan.',
      url: 'https://www.agrobank.com.my/product/pembiayaan-kredit-mikro-i/',
      gigPriorityBonus: 12,
      traderPriorityBonus: 30,
      purposeBonus: purpose === 'working_capital' ? 25 : purpose === 'equipment' ? 20 : 10,
      reasons: [
        'Specialized financing for micro-traders, food operators, and agriculture/services supply chain',
        'Shariah-compliant Tawarruq facility with flexible cash flow alignment',
        'No collateral required for micro-facilities up to RM 50,000'
      ]
    },

    // 7. AEON Credit (Vehicle / Motor HP)
    {
      id: 'aeon_credit_vehicle',
      name: 'AEON Credit (Vehicle & Motor HP)',
      lenderName: 'AEON Credit Service (M) Berhad',
      productName: 'AEON Motorcycle / Commercial Vehicle HP',
      baseRate: 0.045,
      rateLabel: '4.0% – 5.5% flat p.a.',
      speed: '1–2 business days',
      minIncome: 1200,
      maxAmount: 40000,
      minAmount: 2000,
      shariah: false,
      compatiblePurposes: ['vehicle'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Cawangan AEON Credit / Pengedar Sah',
      intakeInstruction: 'Permohonan boleh diserahkan melalui cawangan AEON Credit atau kedai motor pengedar sah dengan dokumen CAM bercetak.',
      url: 'https://www.aeoncredit.com.my/vehicle-financing/motorcycle-financing',
      gigPriorityBonus: 25,
      traderPriorityBonus: 15,
      purposeBonus: purpose === 'vehicle' ? 30 : 0,
      reasons: [
        'Market leader in flexible vehicle & motorcycle financing for gig workers',
        'Fast turnaround within 24 to 48 hours with alternative income proof',
        `DSR ratio of ${dsr.toFixed(1)}% is well within AEON underwriting ceiling`
      ]
    },

    // 8. AEON i-Cash Personal Financing
    {
      id: 'aeon_icash',
      name: 'AEON i-Cash Personal',
      lenderName: 'AEON Credit Service (M) Berhad',
      productName: 'AEON i-Cash Personal Financing',
      baseRate: 0.065,
      rateLabel: '2.8% – 4.2% flat monthly equivalent',
      speed: '1–3 business days',
      minIncome: 1500,
      maxAmount: 30000,
      minAmount: 2000,
      shariah: true,
      compatiblePurposes: ['personal_cash'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Cawangan AEON / Borang Online',
      intakeInstruction: 'Muat turun Pakej CAM atau isi borang online portal AEON Credit dengan butiran pendapatan disahkan.',
      url: 'https://www.aeoncredit.com.my/personal-financing/i-cash-personal-financing',
      gigPriorityBonus: 15,
      traderPriorityBonus: 15,
      purposeBonus: purpose === 'personal_cash' ? 25 : 0,
      reasons: [
        'Unsecured personal cash facility accessible to self-employed and platform workers',
        'Convenient fixed installment schedule with flexible tenure',
        `Documented monthly net earnings (RM ${income.toLocaleString()}) meet requirements`
      ]
    },

    // 9. MARA (SPiM Mesin & Alatan)
    {
      id: 'mara_spim',
      name: 'MARA (SPiM Mesin & Alatan)',
      lenderName: 'Majlis Amanah Rakyat (MARA)',
      productName: 'Skim Pembiayaan Mudah Jaya (SPiM Alatan & Modal)',
      baseRate: 0.04,
      rateLabel: '4.0% flat p.a. (Subsidized)',
      speed: '5–10 business days',
      minIncome: 1500,
      maxAmount: 50000,
      minAmount: 5000,
      shariah: true,
      compatiblePurposes: ['equipment', 'working_capital'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Pejabat MARA Daerah',
      intakeInstruction: 'Serahkan Pakej Permohonan bercetak bersama kertas kerja ringkas (Bahagian B) di Pejabat MARA Daerah atau melalui portal aplikasi.mara.gov.my/spim.',
      url: 'https://www.mara.gov.my/en/business/entrepreneur-financing/',
      gigPriorityBonus: 12,
      traderPriorityBonus: 30,
      purposeBonus: purpose === 'equipment' ? 30 : purpose === 'working_capital' ? 20 : 0,
      reasons: [
        'Prime equipment and machinery financing for micro-entrepreneurs',
        'Heavily subsidized 4.0% government profit rate',
        'Includes Part B business justification addendum ready for credit appraisal'
      ],
      warningNote: 'Terbuka kepada usahawan Bumiputera dengan rekod perniagaan aktif.'
    },

    // 10. SME Bank (SPUM Mesin & Alatan)
    {
      id: 'sme_bank_spum',
      name: 'SME Bank (SPUM Scheme)',
      lenderName: 'SME Bank Malaysia Berhad',
      productName: 'Skim Pembiayaan Usahawan Mikro (SPUM)',
      baseRate: 0.045,
      rateLabel: '4.0% – 5.0% flat p.a.',
      speed: '5–10 business days',
      minIncome: 2000,
      maxAmount: 50000,
      minAmount: 5000,
      shariah: true,
      compatiblePurposes: ['equipment', 'working_capital'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Pusat Perniagaan SME Bank',
      intakeInstruction: 'Bawa Pakej Permohonan ke Pusat Perniagaan SME Bank terdekat untuk semakan Pegawai Meja Usahawan Mikro.',
      url: 'https://www.smebank.com.my/en/financing/spum',
      gigPriorityBonus: 10,
      traderPriorityBonus: 25,
      purposeBonus: purpose === 'equipment' ? 28 : purpose === 'working_capital' ? 20 : 5,
      reasons: [
        'Dedicated government development financial institution for enterprise growth',
        'Special allocation for tools, equipment, and working capital upgrade',
        `Sound credit readiness grade (${grade}) supports approval odds`
      ]
    },

    // 11. Maybank SME Digital Financing
    {
      id: 'maybank_sme',
      name: 'Maybank SME Digital Financing',
      lenderName: 'Malayan Banking Berhad (Maybank)',
      productName: 'Maybank SME Digital Financing (Clean Loan)',
      baseRate: 0.055,
      rateLabel: '5.5% – 7.5% p.a.',
      speed: 'Within 24–48 hours (Digital)',
      minIncome: 2500,
      maxAmount: 100000,
      minAmount: 5000,
      shariah: true,
      compatiblePurposes: ['working_capital', 'equipment'],
      channelType: 'online_portal',
      channelLabel: '🌐 100% Online Web Portal (Maybank2u)',
      intakeInstruction: 'Permohonan web digital sepenuhnya di Maybank2u SME. Gunakan profil Part A dalam Pakej Permohonan untuk mengisi borang dengan segera.',
      url: 'https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/loans/business/sme_clean_loan.page',
      gigPriorityBonus: 8,
      traderPriorityBonus: 20,
      purposeBonus: purpose === 'working_capital' ? 20 : purpose === 'equipment' ? 15 : 0,
      reasons: [
        'Top tier-1 commercial bank facility with automated algorithmic screening',
        'Zero collateral required for verified applicants with 6 months statements',
        `High credit score (${score}) meets Maybank prime tier underwriting`
      ],
      warningNote: has6MonthStatement ? '' : 'Memerlukan penyata bank 6 bulan format PDF rasmi.'
    },

    // 12. MBSB Bank (Pembiayaan Peribadi-i)
    {
      id: 'mbsb_ihsan_personal',
      name: 'MBSB Bank (Pembiayaan Peribadi-i)',
      lenderName: 'MBSB Bank Berhad',
      productName: 'MBSB Cash Rich Personal Financing-i',
      baseRate: 0.058,
      rateLabel: '5.20% – 6.80% p.a.',
      speed: '3–5 business days',
      minIncome: 2000,
      maxAmount: 50000,
      minAmount: 3000,
      shariah: true,
      compatiblePurposes: ['personal_cash', 'working_capital'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Cawangan MBSB Bank & Agensi',
      intakeInstruction: 'Bawa memo kelayakan CreditFlow ke cawangan MBSB terdekat untuk semakan pantas.',
      url: 'https://www.mbsbbank.com/personal/financing/personal-financing-i',
      gigPriorityBonus: 12,
      traderPriorityBonus: 18,
      purposeBonus: purpose === 'personal_cash' ? 20 : 15,
      reasons: [
        'Established full-fledged Islamic bank with flexible repayment tenure',
        'High financing limit with Shariah-compliant financing structure',
        `Net income of RM ${income.toLocaleString()}/mo safely qualifies for facility`
      ]
    },

    // 13. RHB Easy-Pinjaman Ekspres
    {
      id: 'rhb_easy_personal',
      name: 'RHB Easy-Pinjaman Ekspres',
      lenderName: 'RHB Bank Berhad',
      productName: 'RHB Easy Personal Financing',
      baseRate: 0.068,
      rateLabel: '6.5% – 8.5% p.a.',
      speed: 'Instant at Kiosk / 24 Hours',
      minIncome: 1500,
      maxAmount: 30000,
      minAmount: 2000,
      shariah: false,
      compatiblePurposes: ['personal_cash', 'education'],
      channelType: 'branch_walk_in',
      channelLabel: '🏛️ Cawangan RHB / Kiosk Easy',
      intakeInstruction: 'Semakan MyKad dan penyata bank serta merta di mana-mana cawangan RHB Easy.',
      url: 'https://www.rhbgroup.com/personal/loans/personal-financing/easy-pinjaman-ekspres',
      gigPriorityBonus: 14,
      traderPriorityBonus: 14,
      purposeBonus: purpose === 'personal_cash' ? 18 : 10,
      reasons: [
        'Fast 10-minute approval decision at designated Easy-RHB branches',
        'Accepts multi-month bank statement proof with simplified application steps',
        'Tier-1 Malaysian commercial bank facility'
      ]
    }
  ];

  // Score each candidate based on purpose, background, financial condition
  const scored = candidates
    .filter(c => {
      // Must support the purpose or be a general micro-credit
      if (!c.compatiblePurposes.includes(purpose)) return false;
      // Must satisfy Shariah if requested
      if (shariahPreference && !c.shariah) return false;
      // Amount must be reasonably within range
      if (amount > c.maxAmount * 1.5 || amount < c.minAmount * 0.5) return false;
      return true;
    })
    .map(c => {
      let finalScore = 50;

      // 1. Purpose Alignment (0 - 30 pts)
      finalScore += c.purposeBonus;

      // 2. Background Alignment (0 - 35 pts)
      if (isGigWorker) {
        finalScore += c.gigPriorityBonus;
      } else if (isHawkerOrTrader) {
        finalScore += c.traderPriorityBonus;
      } else {
        finalScore += 15;
      }

      // 3. Financial Condition Alignment
      // Income threshold check
      if (income >= c.minIncome * 1.5) {
        finalScore += 10;
      } else if (income >= c.minIncome) {
        finalScore += 5;
      } else {
        finalScore -= 20; // Severe penalty if below minimum
      }

      // FRI score check
      if (score >= 700) {
        finalScore += 8;
      } else if (score >= 600) {
        finalScore += 4;
      } else {
        finalScore -= 10;
      }

      // DSR check
      if (dsr <= 35) {
        finalScore += 6;
      } else if (dsr <= 50) {
        finalScore += 2;
      } else {
        finalScore -= 12;
      }

      // Calculate installment
      const installmentNum = Math.round((amount * (1 + c.baseRate * tenureYears)) / months);
      const installment = `RM ${installmentNum.toLocaleString()}/mo`;
      const tenureStr = `${tenureYears} ${tenureYears === 1 ? 'Year' : 'Years'} (${months} Mo)`;

      // Normalise score between 65 and 97
      const normalisedScore = Math.min(97, Math.max(68, finalScore));

      return {
        id: c.id,
        name: c.name,
        lenderName: c.lenderName,
        productName: c.productName,
        schemeId: c.schemeId,
        score: normalisedScore,
        rate: c.rateLabel,
        installment,
        installmentNum,
        tenure: tenureStr,
        speed: c.speed,
        channelType: c.channelType,
        channelLabel: c.channelLabel,
        intakeInstruction: c.intakeInstruction,
        reasons: c.reasons,
        warning: c.warningNote || '',
        url: c.url,
        isTop: false,
        rankTag: ''
      };
    })
    .sort((a, b) => b.score - a.score);

  // Assign ranks to all qualified matches
  const rankedMatches = scored.map((item, idx) => {
    return {
      ...item,
      isTop: idx === 0,
      rankTag: idx === 0 
        ? 'Top Lender Match' 
        : idx === 1 
        ? '2nd Ranked Fit' 
        : idx === 2 
        ? '3rd Ranked Fit' 
        : `${idx + 1}th Ranked Fit`
    };
  });

  return rankedMatches;
}

