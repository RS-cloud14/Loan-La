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
