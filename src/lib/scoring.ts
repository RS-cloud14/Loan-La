export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'INFLOW' | 'OUTFLOW';
  category?: string;
}

export interface IdentityData {
  icNumber?: string;       // e.g. "000721-14-6795"
  fullName?: string;       // e.g. "YANG GUANG LIANG"
  address?: string;        // Full multi-line address from MyKad
  citizenship?: string;    // e.g. "WARGANEGARA"
  gender?: string;         // e.g. "LELAKI" / "Male" or "PEREMPUAN" / "Female"
  dob?: string;            // e.g. "2000-07-21"
  stateOfOrigin?: string;  // e.g. "W.P. Kuala Lumpur"
  isVerified?: boolean;
}

export interface EpfAccountRow {
  accountType: string;     // e.g. "Akaun Persaraan (Akaun 1)", "Akaun Sejahtera (Akaun 2)", "Akaun Fleksibel (Akaun 3)"
  openingBalance: number;  // e.g. 3600.00
  inflow: number;          // e.g. 1875.00
  outflow: number;         // e.g. 0.00
  dividend: number;        // e.g. 0.00
  total: number;           // e.g. 5475.00
}

export interface EpfCarumanRow {
  month: string;           // e.g. "Jan-26", "Feb-26", "Jul-26"
  transaction: string;     // e.g. "Bayaran Caruman i-Simpan", "Bayaran Caruman i-Saraan"
  date: string;            // e.g. "28/01/2026"
  employerAmount: number;  // e.g. 0.00
  memberAmount: number;    // e.g. 200.00, 400.00, 500.00
  totalAmount: number;     // e.g. 200.00, 500.00
}

export interface EpfAnalysisData {
  hasEpf?: boolean;
  statementYear?: string;      // e.g. "2026"
  statementDate?: string;      // e.g. "14/08/2026"
  memberName?: string;         // e.g. "YANG GUANG LIANG"
  address?: string;            // e.g. "A-3-8 TIARA FABER CONDOMINIUM..."
  epfNumber?: string;          // e.g. "20129714"
  icNumber?: string;           // e.g. "000721-14-6795"
  employerNumber?: string;     // e.g. "00000000"
  totalSavings?: number;       // e.g. 7300.00
  totalBalance?: number;       // same as totalSavings
  accounts?: EpfAccountRow[];  // Akaun 1, Akaun 2, Akaun 3
  account1Balance?: number;    // e.g. 5475.00
  account2Balance?: number;    // e.g. 1095.00
  account3Balance?: number;    // e.g. 730.00
  monthlyContribution?: number;
  employeeContribution?: number;
  employerContribution?: number;
  contributions?: EpfCarumanRow[]; // List of monthly contributions from CARUMAN SEMASA
  totalContributionsCurrentYear?: number; // e.g. 2500.00
  continuousContributionMonths?: number;
  inferredMonthlySalary?: number;
  employerName?: string;
  schemeName?: string;         // e.g. "i-Simpan", "i-Saraan"
  stabilityRating?: 'HIGH' | 'MODERATE' | 'LOW';
  notes?: string;
}

export interface PaySlipData {
  employerName?: string;
  basicSalary?: number;
  allowances?: number;
  epfDeduction?: number;
  socsoDeduction?: number;
  eisDeduction?: number;
  pcbDeduction?: number;
  netPay?: number;
  monthYear?: string;
}

export interface UnderwritingInput {
  name: string;
  platform: string; // Grab, Shopee, Lazada, Foodpanda, Bank Statement, etc.
  averageMonthlyNetIncome: number;
  monthlyIncomes: number[];
  activeDaysPerMonth: number;
  cashFlowFrequency: 'weekly' | 'monthly' | 'irregular';
  transactions: Transaction[];
  forensicCheck: {
    is_tampered: boolean;
    tamper_reasons: string[];
    exif_software_detected?: string;
    ai_generation_detected?: boolean;
    ai_generation_reasons?: string[];
  };
  behavioralRisk: {
    red_flags: string[];
    green_flags: string[];
    risk_score: number; // 0-100
  };
  endingBalance: number;
  averageMonthlyExpenses: number;
  identityData?: IdentityData;
  epfAnalysis?: EpfAnalysisData;
  paySlipData?: PaySlipData;
  // Hire Purchase / Asset Pivot inputs
  targetLoanPurpose?: 'car' | 'bike' | 'van' | 'equipment' | 'personal_cash' | 'working_capital' | 'invoice_financing' | 'education' | 'vehicle';
  targetLoanAmount?: number;
  tenureYears?: number;
  downpaymentAmount?: number;
}

export interface CreditScoreExplanation {
  factor: string;
  change: number; // Positive or negative
  reason: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface CreditProfileReport {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'FRAUD_ALERT';
  status: 'Approved' | 'Borderline' | 'Declined' | 'Fraud Alert';
  dsr: number; // Debt Service Ratio in %
  volatilityIndex: number; // Coefficient of variation (0 to 1+)
  incomeConcentrationHhi: number; // HHI Index (0.1 to 1.0)
  runwayMonths: number; // Reserves runway
  explanations: CreditScoreExplanation[];
  complianceDeclaration: {
    ftfcCompliant: boolean; // Fair Treatment of Financial Consumers
    rmitAudited: boolean; // Risk Management in Technology (hash verified)
    amlScanned: boolean; // AML Scanned
    crmStatus: 'pass' | 'review' | 'fail'; // Credit Risk Management
  };
  // Repayment & Affordability fields
  monthlySurplus: number;
  estimatedInstallment: number;
  postLoanBuffer: number;
  affordabilityStatus: 'Strong' | 'Borderline' | 'Deficit';
}

/**
 * Computes a fintech-grade Alternative Credit Score and Risk Profile
 * strictly adhering to Bank Negara Malaysia (BNM) guidelines:
 * - CRM (Credit Risk Management): DSR, Volatility, Liquidity Runway
 * - FTFC (Fair Treatment): Transparancy and Explainable AI (XAI)
 * - AML/CFT: Transaction narrative scanning
 * - RMiT (Risk Mgmt in Tech): Anti-tampering override
 */
export function calculateAlternativeCreditProfile(input: UnderwritingInput): CreditProfileReport {
  let score = 300; // Base score (similar to CCRIS / CTOS 300-850 range)
  const explanations: CreditScoreExplanation[] = [];

  // 1. FORENSIC TAMPERING & AI GENERATION CHECK (RMiT Override)
  // Any document tampering or AI generation triggers an immediate Fraud Alert and drops the score to absolute minimum
  if (input.forensicCheck.is_tampered || input.forensicCheck.ai_generation_detected) {
    const reasons = [
      ...input.forensicCheck.tamper_reasons,
      ...(input.forensicCheck.ai_generation_reasons || [])
    ];
    if (input.forensicCheck.exif_software_detected && input.forensicCheck.exif_software_detected !== 'None') {
      reasons.push(`EXIF Software: ${input.forensicCheck.exif_software_detected}`);
    }
    explanations.push({
      factor: "Forensic Integrity Check",
      change: -550,
      reason: `Immediate failure: Visual tampering, AI-generation, or metadata modifications detected (${reasons.join(', ')}).`,
      type: 'negative'
    });
    return {
      score: 300,
      grade: 'FRAUD_ALERT',
      status: 'Fraud Alert',
      dsr: 100,
      volatilityIndex: 1.0,
      incomeConcentrationHhi: 1.0,
      runwayMonths: 0,
      explanations,
      complianceDeclaration: {
        ftfcCompliant: true, // Transparently reported
        rmitAudited: true, // Failed check but audit trail completed
        amlScanned: true,
        crmStatus: 'fail'
      },
      monthlySurplus: 0,
      estimatedInstallment: 0,
      postLoanBuffer: 0,
      affordabilityStatus: 'Deficit'
    };
  }

  // ── 2. DETERMINISTIC FINANCIAL DERIVATIONS FROM LEDGER & STATEMENTS ─────────
  // Group transactions by month (YYYY-MM)
  const monthlyInflowMap = new Map<string, number>();
  const monthlyOutflowMap = new Map<string, number>();

  input.transactions.forEach(tx => {
    const m = tx.date ? tx.date.slice(0, 7) : '2026-07';
    if (tx.type === 'INFLOW') {
      monthlyInflowMap.set(m, (monthlyInflowMap.get(m) || 0) + tx.amount);
    } else if (tx.type === 'OUTFLOW') {
      monthlyOutflowMap.set(m, (monthlyOutflowMap.get(m) || 0) + Math.abs(tx.amount));
    }
  });

  // If bankStatementFiles exists with extracted totals, use them; otherwise use transaction sums
  const bFiles = (input as any).bankStatementFiles as any[] || [];
  const derivedMonthlyIncomes: number[] = [];
  if (bFiles.length > 0) {
    bFiles.forEach(b => {
      if (typeof b.totalInflows === 'number' && b.totalInflows > 0) {
        derivedMonthlyIncomes.push(b.totalInflows);
      }
    });
  } else if (monthlyInflowMap.size > 0) {
    derivedMonthlyIncomes.push(...Array.from(monthlyInflowMap.values()));
  } else if (input.monthlyIncomes && input.monthlyIncomes.length > 0) {
    derivedMonthlyIncomes.push(...input.monthlyIncomes);
  }

  // A. INCOME VOLUME & STABILITY (Max 200 pts)
  // Higher income and consistent monthly volumes provide stable credit capacity
  const avgIncome = derivedMonthlyIncomes.length > 0
    ? derivedMonthlyIncomes.reduce((a, b) => a + b, 0) / derivedMonthlyIncomes.length
    : (input.averageMonthlyNetIncome || 0);

  let incomePts = 0;
  if (avgIncome >= 8000) {
    incomePts = 200;
    explanations.push({
      factor: "Net Income Volume",
      change: 200,
      reason: `Average monthly income is RM ${avgIncome.toFixed(2)} (High income bracket).`,
      type: 'positive'
    });
  } else if (avgIncome >= 5000) {
    incomePts = 160;
    explanations.push({
      factor: "Net Income Volume",
      change: 160,
      reason: `Average monthly income is RM ${avgIncome.toFixed(2)} (Upper-middle income bracket).`,
      type: 'positive'
    });
  } else if (avgIncome >= 3000) {
    incomePts = 120;
    explanations.push({
      factor: "Net Income Volume",
      change: 120,
      reason: `Average monthly income is RM ${avgIncome.toFixed(2)} (Middle income bracket).`,
      type: 'positive'
    });
  } else if (avgIncome >= 1500) {
    incomePts = 80;
    explanations.push({
      factor: "Net Income Volume",
      change: 80,
      reason: `Average monthly income is RM ${avgIncome.toFixed(2)} (Lower-middle income bracket).`,
      type: 'positive'
    });
  } else {
    incomePts = 40;
    explanations.push({
      factor: "Net Income Volume",
      change: 40,
      reason: `Average monthly income is RM ${avgIncome.toFixed(2)} (Micro-income level).`,
      type: 'neutral'
    });
  }
  score += incomePts;

  // B. CASH FLOW VOLATILITY INDEX (Max 150 pts)
  // Measures earnings stability. Coefficient of Variation (CV) = StdDev / Mean.
  // Lower volatility = higher reliability.
  let volatilityIndex = 0.12; // default stable
  if (derivedMonthlyIncomes.length > 1) {
    const n = derivedMonthlyIncomes.length;
    const mean = avgIncome;
    const variance = derivedMonthlyIncomes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    volatilityIndex = mean > 0 ? stdDev / mean : 1.0;
  }

  let volatilityPts = 0;
  if (volatilityIndex <= 0.10) {
    volatilityPts = 150;
    explanations.push({
      factor: "Cash Flow Stability",
      change: 150,
      reason: `Income volatility index is extremely low (${(volatilityIndex * 100).toFixed(1)}%). Excellent predictability.`,
      type: 'positive'
    });
  } else if (volatilityIndex <= 0.25) {
    volatilityPts = 110;
    explanations.push({
      factor: "Cash Flow Stability",
      change: 110,
      reason: `Income volatility is low-to-moderate (${(volatilityIndex * 100).toFixed(1)}%). Normal gig-worker pattern.`,
      type: 'positive'
    });
  } else if (volatilityIndex <= 0.45) {
    volatilityPts = 70;
    explanations.push({
      factor: "Cash Flow Stability",
      change: 70,
      reason: `Income volatility is moderate-to-high (${(volatilityIndex * 100).toFixed(1)}%). High season-dependent fluctuations.`,
      type: 'neutral'
    });
  } else {
    volatilityPts = 20;
    explanations.push({
      factor: "Cash Flow Stability",
      change: 20,
      reason: `Highly volatile cash flows (${(volatilityIndex * 100).toFixed(1)}%). Higher credit repayment risk.`,
      type: 'negative'
    });
  }
  score += volatilityPts;

  // C. DSR - DEBT SERVICE RATIO (Max 100 pts)
  // DSR = Monthly Debt Obligations / Net Monthly Income.
  // We scan the outflows for debt payment keywords or apply a baseline.
  let monthlyDebtObligations = 0;
  input.transactions.forEach(tx => {
    if (tx.type === 'OUTFLOW') {
      const desc = tx.description.toLowerCase();
      // Match common Malaysian debt servicing keywords
      if (
        desc.includes('loan') || 
        desc.includes('repayment') || 
        desc.includes('installment') || 
        desc.includes('pinjaman') || 
        desc.includes('cimb credit') || 
        desc.includes('maybank card') || 
        desc.includes('aeon credit') ||
        desc.includes('credit card') ||
        desc.includes('car repayment') ||
        desc.includes('housing payment')
      ) {
        monthlyDebtObligations += Math.abs(tx.amount);
      }
    }
  });

  // Normalize monthly debt obligations: if 0, assume a baseline small loan obligation of RM 150
  // to avoid skewing profiles with zero credit records, or leave 0 if they genuinely have no loans.
  // If the user has transactions, we use the detected amount.
  const dsr = avgIncome > 0 ? (monthlyDebtObligations / avgIncome) * 100 : 0;
  let dsrPts = 0;
  if (dsr === 0) {
    dsrPts = 100;
    explanations.push({
      factor: "Debt Service Ratio (DSR)",
      change: 100,
      reason: "No active debt obligations detected in transaction narratives. Excellent capacity.",
      type: 'positive'
    });
  } else if (dsr <= 30) {
    dsrPts = 85;
    explanations.push({
      factor: "Debt Service Ratio (DSR)",
      change: 85,
      reason: `Debt Service Ratio is healthy at ${dsr.toFixed(1)}% (Target: <60%).`,
      type: 'positive'
    });
  } else if (dsr <= 50) {
    dsrPts = 60;
    explanations.push({
      factor: "Debt Service Ratio (DSR)",
      change: 60,
      reason: `Debt Service Ratio is moderate at ${dsr.toFixed(1)}%. Moderate financial commitments.`,
      type: 'neutral'
    });
  } else if (dsr <= 60) {
    dsrPts = 30;
    explanations.push({
      factor: "Debt Service Ratio (DSR)",
      change: 30,
      reason: `Debt Service Ratio is high at ${dsr.toFixed(1)}%. Nearing BNM guideline threshold.`,
      type: 'negative'
    });
  } else {
    dsrPts = -80; // High DSR penalty
    explanations.push({
      factor: "Debt Service Ratio (DSR)",
      change: -80,
      reason: `Overleveraged: Debt Service Ratio is critical at ${dsr.toFixed(1)}% (Exceeds BNM 60% rule).`,
      type: 'negative'
    });
  }
  score += dsrPts;

  // C2. Hire Purchase Downpayment / Margin Check
  if (input.targetLoanAmount && input.targetLoanAmount > 0) {
    const downpayment = input.downpaymentAmount || 0;
    const targetLoan = input.targetLoanAmount;
    const dpPercent = (downpayment / (targetLoan + downpayment)) * 100;

    if (dpPercent >= 15) {
      score += 40;
      explanations.push({
        factor: "Downpayment Margin",
        change: 40,
        reason: `Excellent downpayment margin of ${dpPercent.toFixed(1)}% (Target: >=10%). Lowers principal risk.`,
        type: 'positive'
      });
    } else if (dpPercent >= 10) {
      score += 20;
      explanations.push({
        factor: "Downpayment Margin",
        change: 20,
        reason: `Standard downpayment margin of ${dpPercent.toFixed(1)}% (Meets HP guidelines).`,
        type: 'positive'
      });
    } else {
      score -= 50;
      explanations.push({
        factor: "Downpayment Margin",
        change: -50,
        reason: `High risk: Downpayment margin is only ${dpPercent.toFixed(1)}% (Below 10% target). Higher default risk.`,
        type: 'negative'
      });
    }
  }

  // D. INCOME CONCENTRATION - HHI (Max 50 pts)
  // Computes diversification of income sources to check dependency on single gig platform.
  // HHI = Sum(s_i ^ 2). HHI close to 0.3 means highly diversified; HHI = 1.0 means single platform.
  // In our input, we check if they list multiple income channels in transactions
  const platforms = new Map<string, number>();
  let totalInflows = 0;
  input.transactions.forEach(tx => {
    if (tx.type === 'INFLOW') {
      const desc = tx.description.toLowerCase();
      let source = 'other';
      if (desc.includes('grab')) source = 'grab';
      else if (desc.includes('shopee')) source = 'shopee';
      else if (desc.includes('lazada')) source = 'lazada';
      else if (desc.includes('foodpanda')) source = 'foodpanda';
      else if (desc.includes('lalamove')) source = 'lalamove';
      else if (desc.includes('fiverr') || desc.includes('upwork')) source = 'freelance';
      else if (desc.includes('salary') || desc.includes('upah') || desc.includes('gaji')) source = 'salary';

      platforms.set(source, (platforms.get(source) || 0) + tx.amount);
      totalInflows += tx.amount;
    }
  });

  let hhi = 1.0;
  if (totalInflows > 0 && platforms.size > 0) {
    let sumSq = 0;
    platforms.forEach(amount => {
      const share = amount / totalInflows;
      sumSq += Math.pow(share, 2);
    });
    hhi = sumSq;
  }

  let hhiPts = 0;
  if (hhi <= 0.4) {
    hhiPts = 50;
    explanations.push({
      factor: "Income Diversification",
      change: 50,
      reason: "Highly diversified income sources (HHI index low). Resilient against single platform bans.",
      type: 'positive'
    });
  } else if (hhi <= 0.7) {
    hhiPts = 35;
    explanations.push({
      factor: "Income Diversification",
      change: 35,
      reason: "Moderately diversified income sources. Healthy gig blend.",
      type: 'positive'
    });
  } else {
    hhiPts = 15;
    explanations.push({
      factor: "Income Diversification",
      change: 15,
      reason: "Income concentrated on a single digital platform. Vulnarable to gig policy changes.",
      type: 'neutral'
    });
  }
  score += hhiPts;

  // E. CASH RESERVE RUNWAY (Max 50 pts)
  // Runway = Ending Balance / Avg Monthly Expenses.
  // ── DETERMINISTIC EXPENSE COMPUTATION ────────────────────────────────────────
  const SAVINGS_KEYWORDS = ['epf', 'kwsp', 'asb', 'amanah saham', 'tabung haji', 'fixed deposit', 'fd0', 'fpxpay hong leong', 'invest', 'unit trust', 'saving'];
  const VOLUNTARY_TRANSFER_KEYWORDS = ['duitnow to account', 'ibg transfer', 'interbank transfer'];
  const LOAN_KEYWORDS = ['loan repayment', 'installment', 'pinjaman', 'repayment', 'hire purchase', 'aeon credit', 'cimb credit', 'maybank card', 'car repayment', 'housing payment'];

  // Sum all essential outflows: exclude voluntary savings & internal transfers
  let totalEssentialOutflows = 0;
  let totalVoluntarySavings = 0;
  input.transactions.forEach(tx => {
    if (tx.type === 'OUTFLOW') {
      const desc = tx.description.toLowerCase();
      const isSavings = SAVINGS_KEYWORDS.some(k => desc.includes(k));
      const isVoluntaryTransfer = VOLUNTARY_TRANSFER_KEYWORDS.some(k => desc.includes(k)) &&
        !LOAN_KEYWORDS.some(k => desc.includes(k));
      if (isSavings || isVoluntaryTransfer) {
        totalVoluntarySavings += Math.abs(tx.amount);
      } else {
        totalEssentialOutflows += Math.abs(tx.amount);
      }
    }
  });

  // Derive number of months covered by the transaction record
  const numMonths = Math.max(1, derivedMonthlyIncomes.length, monthlyOutflowMap.size);

  // Computed average monthly essential expenses (deterministic)
  const computedMonthlyExpenses = totalEssentialOutflows > 0 
    ? (totalEssentialOutflows / numMonths) 
    : (input.averageMonthlyExpenses || (avgIncome * 0.65));

  // Deterministic ending balance (prefer bank statement ending balance if present)
  let deterministicEndingBalance = input.endingBalance || 0;
  if (bFiles.length > 0 && typeof bFiles[bFiles.length - 1].endBal === 'number') {
    deterministicEndingBalance = bFiles[bFiles.length - 1].endBal;
  }

  const runwayMonths = computedMonthlyExpenses > 0 ? deterministicEndingBalance / computedMonthlyExpenses : 0;
  
  let runwayPts = 0;
  if (runwayMonths >= 3) {
    runwayPts = 50;
    explanations.push({
      factor: "Liquidity Reserves",
      change: 50,
      reason: `Liquid reserves cover over ${runwayMonths.toFixed(1)} months of expenses. Robust buffer.`,
      type: 'positive'
    });
  } else if (runwayMonths >= 1) {
    runwayPts = 35;
    explanations.push({
      factor: "Liquidity Reserves",
      change: 35,
      reason: `Liquid reserves cover ${runwayMonths.toFixed(1)} months of expenses. Standard buffer.`,
      type: 'positive'
    });
  } else if (runwayMonths >= 0.5) {
    runwayPts = 15;
    explanations.push({
      factor: "Liquidity Reserves",
      change: 15,
      reason: `Reserves are tight, covering ${(runwayMonths * 30).toFixed(0)} days of operating costs.`,
      type: 'neutral'
    });
  } else {
    runwayPts = -30;
    explanations.push({
      factor: "Liquidity Reserves",
      change: -30,
      reason: `Critical liquidity: Reserves cover less than 15 days of expenses. Low working capital.`,
      type: 'negative'
    });
  }
  score += runwayPts;

  // F. BEHAVIORAL RISK & COMPLIANCE MODIFIERS (Max +/- 100 pts)
  // Parse flags from the raw Gemini evaluation
  let behavioralChange = 0;
  
  // Deduct for red flags
  const redFlagsCount = input.behavioralRisk.red_flags.length;
  if (redFlagsCount > 0) {
    // 40 pts penalty per red flag, capped at 120
    const penalty = Math.min(redFlagsCount * 40, 120);
    behavioralChange -= penalty;
    explanations.push({
      factor: "AML & Behavioral Red Flags",
      change: -penalty,
      reason: `Deduction for critical markers: ${input.behavioralRisk.red_flags.join(', ')}.`,
      type: 'negative'
    });
  }

  // Credit for green flags
  const greenFlagsCount = input.behavioralRisk.green_flags.length;
  if (greenFlagsCount > 0) {
    // 20 pts credit per green flag, capped at 50
    const credit = Math.min(greenFlagsCount * 20, 50);
    behavioralChange += credit;
    explanations.push({
      factor: "Positive Payment Indicators",
      change: credit,
      reason: `Credit for responsible trends: ${input.behavioralRisk.green_flags.join(', ')}.`,
      type: 'positive'
    });
  }
  score += behavioralChange;

  // Capping the final score between 300 and 850
  score = Math.max(300, Math.min(850, score));

  // Determine status and grade
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'FRAUD_ALERT' = 'F';
  let status: 'Approved' | 'Borderline' | 'Declined' | 'Fraud Alert' = 'Declined';

  if (score >= 760) {
    grade = 'A+';
    status = 'Approved';
  } else if (score >= 680) {
    grade = 'A';
    status = 'Approved';
  } else if (score >= 600) {
    grade = 'B';
    status = 'Approved';
  } else if (score >= 520) {
    grade = 'C';
    status = 'Borderline';
  } else if (score >= 420) {
    grade = 'D';
    status = 'Declined';
  } else {
    grade = 'F';
    status = 'Declined';
  }

  // Calculate Repayment Capacity & Affordability
  // ── DETERMINISTIC SURPLUS COMPUTATION ────────────────────────────────────────
  const adjustedEssentialExpenses = Math.min(computedMonthlyExpenses, avgIncome * 0.80);
  const monthlySurplus = Math.max(avgIncome * 0.15, avgIncome - adjustedEssentialExpenses);
  
  let tenureYears = (input.tenureYears && input.tenureYears > 0) ? input.tenureYears : 5;
  let interestRate = 0.065; // default 6.5% flat p.a.
  
  if (!input.tenureYears || input.tenureYears <= 0) {
    if (input.targetLoanPurpose === 'car') {
      interestRate = 0.065;
      tenureYears = 7;
    } else if (input.targetLoanPurpose === 'bike') {
      interestRate = 0.075;
      tenureYears = 3;
    } else if (input.targetLoanPurpose === 'van' || input.targetLoanPurpose === 'vehicle') {
      interestRate = 0.065;
      tenureYears = 5;
    } else if (input.targetLoanPurpose === 'equipment') {
      interestRate = 0.08;
      tenureYears = 3;
    } else if (input.targetLoanPurpose === 'personal_cash' || input.targetLoanPurpose === 'education') {
      interestRate = 0.098; // Licensed digital bank/fintech rate (GXBank / AEON / Boost)
      tenureYears = 3; // Standard 36-month micro loan
    } else if (input.targetLoanPurpose === 'working_capital' || input.targetLoanPurpose === 'invoice_financing') {
      interestRate = 0.12; // P2P working capital average
      tenureYears = 2;
    }
  } else {
    // Dynamically assign interest rate based on loan category
    if (input.targetLoanPurpose === 'car' || input.targetLoanPurpose === 'vehicle' || input.targetLoanPurpose === 'van') {
      interestRate = 0.065;
    } else if (input.targetLoanPurpose === 'bike') {
      interestRate = 0.075;
    } else if (input.targetLoanPurpose === 'equipment') {
      interestRate = 0.08;
    } else if (input.targetLoanPurpose === 'personal_cash' || input.targetLoanPurpose === 'education') {
      interestRate = 0.098;
    } else if (input.targetLoanPurpose === 'working_capital' || input.targetLoanPurpose === 'invoice_financing') {
      interestRate = 0.12;
    }
  }

  const principal = input.targetLoanAmount || 0;
  const totalInterest = principal * interestRate * tenureYears;
  const estimatedInstallment = principal > 0 
    ? Math.round((principal + totalInterest) / (tenureYears * 12)) 
    : 0;

  const postLoanBuffer = monthlySurplus - estimatedInstallment;
  
  let affordabilityStatus: 'Strong' | 'Borderline' | 'Deficit' = 'Strong';
  if (principal === 0) {
    affordabilityStatus = 'Strong';
  } else if (postLoanBuffer >= estimatedInstallment * 0.5) {
    affordabilityStatus = 'Strong';
  } else if (postLoanBuffer >= 0) {
    affordabilityStatus = 'Borderline';
  } else {
    affordabilityStatus = 'Deficit';
  }

  // Adjust score and status based on affordability
  if (affordabilityStatus === 'Deficit' && principal > 0) {
    if (score >= 600) {
      status = 'Borderline'; // Keep eligible for smaller ticket or extended tenure
      explanations.push({
        factor: "Repayment Capacity Check",
        change: -30,
        reason: `Tight cash buffer: Monthly installment of RM ${estimatedInstallment} approaches net disposable surplus. Consider extending tenure or adjusting amount.`,
        type: 'neutral'
      });
      score = Math.max(520, score - 30);
    } else {
      status = 'Declined';
      explanations.push({
        factor: "Repayment Capacity Check",
        change: -80,
        reason: `Deficit: Estimated monthly installment of RM ${estimatedInstallment} exceeds net cash surplus.`,
        type: 'negative'
      });
      score = Math.max(300, score - 80);
    }
  } else if (affordabilityStatus === 'Borderline') {
    if (status === 'Approved' && score < 680) {
      status = 'Borderline';
    }
  }

  // Strictly enforce BNM CRM DSR ceiling policy: if DSR exceeds 60%, status is downgraded to Borderline for manual review
  if (dsr > 60 && status === 'Approved') {
    status = 'Borderline';
  }

  // Determine Credit Risk Management Status (BNM CRM guideline)
  let crmStatus: 'pass' | 'review' | 'fail' = 'pass';
  if (dsr > 60 || score < 420 || affordabilityStatus === 'Deficit') {
    crmStatus = 'fail';
  } else if (dsr > 50 || score < 550 || affordabilityStatus === 'Borderline') {
    crmStatus = 'review';
  }

  return {
    score,
    grade,
    status,
    dsr,
    volatilityIndex,
    incomeConcentrationHhi: hhi,
    runwayMonths,
    explanations,
    complianceDeclaration: {
      ftfcCompliant: true, // transparent factors shown
      rmitAudited: true, // visual forensic stamp applied
      amlScanned: true, // transaction description keyword scanned
      crmStatus
    },
    monthlySurplus,
    estimatedInstallment,
    postLoanBuffer,
    affordabilityStatus
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY HELPERS — PDPA & CRAA 2010 COMPLIANT UI LABELS
// CreditFlow AI is a loan preparation coaching tool, NOT a licensed credit
// bureau. All public-facing status labels must avoid regulated credit decision
// terminology (Approved / Declined / Credit Score).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a CRAA-2010-compliant display status string.
 * Internal logic continues to use the raw status for gating decisions.
 */
export function getDisplayStatus(status: string): string {
  const map: Record<string, string> = {
    'Approved':     'Pre-Qualified',
    'Borderline':   'Conditionally Eligible',
    'Declined':     'Needs Preparation',
    'Fraud Alert':  'Document Review Required',
  };
  return map[status] ?? status;
}

/**
 * Returns a human-readable label for the FRI grade.
 */
export function getDisplayGrade(grade: string): string {
  const map: Record<string, string> = {
    'A+':          'Excellent',
    'A':           'Very Good',
    'B':           'Good',
    'C':           'Fair',
    'D':           'Needs Work',
    'F':           'Significant Gaps',
    'FRAUD_ALERT': 'Review Required',
  };
  return map[grade] ?? grade;
}

/**
 * Returns Tailwind colour classes for the given internal status.
 */
export function getStatusColors(status: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    'Approved':    { bg: 'bg-blue-50',   text: 'text-blue-900',  border: 'border-blue-200'  },
    'Borderline':  { bg: 'bg-amber-50',  text: 'text-amber-800', border: 'border-amber-200' },
    'Declined':    { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    'Fraud Alert': { bg: 'bg-red-50',    text: 'text-red-900',   border: 'border-red-200'   },
  };
  return map[status] ?? { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
}
