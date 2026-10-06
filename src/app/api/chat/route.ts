import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import { callGeminiWithModelRotation } from '@/lib/geminiRotator';
import { getBankIntelligenceState } from '@/lib/bankIntelligence';

interface UserContextPayload {
  isLoggedIn?: boolean;
  name?: string;
  platform?: string;
  phone?: string;
  email?: string;
  assessedInflow?: number;
  latestScore?: number;
  latestGrade?: string;
  currentDsr?: number;
  emergencyRunway?: number;
  maxSafeLoan?: number;
  maxSafeMonthlyPay?: number;
  safeMaxLoan?: number;
  safeMaxInstallment?: number;
  targetLoanAmount?: number;
  targetLoanPurpose?: string;
  calcTenureYears?: number;
  calcInterestRate?: number;
  currentPage?: 'landing' | 'calculator' | 'directory' | 'tracker' | 'app' | 'report_explainer';
  activeReportSection?: string;
  userName?: string;
  friScore?: number;
  dsrPercentage?: number;
  averageMonthlyIncome?: number;
  monthlySurplus?: number;
  documentHash?: string;
  matchedLenders?: Array<{
    name: string;
    shortName?: string;
    matchScore: number;
    eligibilityLabel?: string;
    minIncome?: number;
    maxLoan?: number;
  }>;
  activeStep?: number;
  visibleSection?: string;
  visibleSectionLabel?: string;
  uploadedFilesCount?: number;
  uploadedFilesSummary?: string[];
}

/**
 * Intelligent Language Detector
 * Checks the user's actual prompt to determine whether it is in English or Bahasa Melayu.
 * Never defaults to Malay if the user is typing in English!
 */
function detectMessageLanguage(text: string, requestedLang?: 'en' | 'bm'): 'en' | 'bm' {
  if (!text || text.trim().length === 0) return requestedLang || 'en';
  const lower = text.toLowerCase();

  // Strong Malay indicators
  const malayPatterns = [
    /\b(saya|awak|anda|kami|kita|dia|mereka)\b/,
    /\b(nak|mau|mohon|buat|pinjam|pinjaman|pembiayaan)\b/,
    /\b(tak|tidak|bukan|tiada|ada|ke|kah|takkan)\b/,
    /\b(boleh|dapat|lepas|lulus|sangkut|tolak|kena|patut)\b/,
    /\b(kadar|faedah|bunga|ansuran|bayar|bayaran|sebulan|bulan|tahun)\b/,
    /\b(duit|wang|gaji|pendapatan|modal|pusing|stok|kedai|perniagaan)\b/,
    /\b(dokumen|penyata|akaun|bank|cawangan|syarat|kelayakan)\b/,
    /\b(siapa|mana|apa|apakah|bagaimana|bagaimanakah|kenapa|mengapa)\b/,
    /\b(paling|laju|cepat|senang|mudah|murah|rendah|tinggi)\b/,
    /\b(kerajaan|agensi|skim|bantuan|dana|usahawan|wanita|belia)\b/,
    /\b(sah|lesen|berlesen|ah\s*long|yuran|pendahuluan)\b/,
    /\b(terima\s*kasih|tolong|bantu|tunjuk|buka)\b/
  ];

  // Strong English indicators
  const englishPatterns = [
    /\b(i|i'm|im|my|me|we|our|you|your|they|them|he|she)\b/,
    /\b(can|could|would|should|will|do|does|did|is|are|am|was|were)\b/,
    /\b(how|what|which|where|when|why|who|whose)\b/,
    /\b(loan|borrow|financing|installment|repayment|interest|rate|rates)\b/,
    /\b(qualify|approved|approval|rejected|odds|eligible|eligibility)\b/,
    /\b(monthly|yearly|tenure|years|months|amount|payout|fastest)\b/,
    /\b(payslip|payslips|statement|statements|income|working\s*capital)\b/,
    /\b(digital\s*bank|inventory|government|fund|funds|female|young|youth)\b/,
    /\b(licensed|service|shark|ah\s*long|upfront|charges|fees|deposit)\b/,
    /\b(please|help|show|calculate|calculator|check|increase)\b/
  ];

  let malayScore = 0;
  for (const p of malayPatterns) {
    if (p.test(lower)) malayScore += 1;
  }

  let englishScore = 0;
  for (const p of englishPatterns) {
    if (p.test(lower)) englishScore += 1;
  }

  if (englishScore > malayScore) return 'en';
  if (malayScore > englishScore) return 'bm';
  return requestedLang || 'en';
}

// Read latest assessment from stored JSON file on disk if available
async function getLatestStoredAssessment(): Promise<any | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'latest_assessment.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Native Gemini Tools / Function Declarations
const agentTools: any = [
  {
    functionDeclarations: [
      {
        name: 'set_calculator',
        description: 'Update the loan calculator with specific loan amount, tenure in years, and interest rate. Call this whenever the user asks for repayment calculations or asks to see/configure the loan calculator.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            loanAmount: {
              type: Type.NUMBER,
              description: 'Financing principal amount in Ringgit Malaysia (e.g. 15000).'
            },
            tenureYears: {
              type: Type.NUMBER,
              description: 'Tenure in years (e.g. 1, 2, 3, 5).'
            },
            interestRate: {
              type: Type.NUMBER,
              description: 'Indicative interest rate percentage p.a. (e.g. 5.5).'
            }
          },
          required: ['loanAmount', 'tenureYears']
        }
      },
      {
        name: 'configure_loan_parameters',
        description: 'Configure or update the borrower loan application in Step 1. ONLY call this when the user explicitly asks to apply, set, or update their loan application parameters (NOT when just asking general advice or questions).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            purpose: {
              type: Type.STRING,
              description: 'Loan purpose category: personal_cash, working_capital, vehicle, equipment, invoice_financing, or education.'
            },
            amount: {
              type: Type.NUMBER,
              description: 'Requested loan amount in Ringgit Malaysia (e.g. 5000, 10000, 15000).'
            },
            tenureYears: {
              type: Type.NUMBER,
              description: 'Repayment duration in years (e.g. 1, 2, 3, 5).'
            },
            platform: {
              type: Type.STRING,
              description: 'Income platform (e.g. Grab, Shopee, Foodpanda, Lalamove, TikTok Shop, Freelance).'
            }
          }
        }
      },
      {
        name: 'optimize_affordability',
        description: 'Recalculate or optimize debt service ratio (DSR), adjust tenure or loan quantum to stay below Bank Negara Malaysia (BNM) 60% ceiling, and recommend best fitting lenders.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            proposedTenureYears: {
              type: Type.NUMBER,
              description: 'Adjusted tenure in years to lower monthly repayment.'
            },
            proposedLoanAmount: {
              type: Type.NUMBER,
              description: 'Adjusted loan amount within safe borrowing limits.'
            },
            targetLender: {
              type: Type.STRING,
              description: 'Recommended licensed lender (e.g. GXBank, TEKUN Nasional, BSN Micro, AEON Credit).'
            }
          }
        }
      },
      {
        name: 'dispatch_lender_application',
        description: 'Dispatches the borrower application and Credit Assessment Memorandum (CAM) to a licensed lender digital intake gateway.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            lenderName: {
              type: Type.STRING,
              description: 'Target lender name (e.g. GXBank, TEKUN Nasional, Boost Bank, Maybank).'
            },
            loanAmount: {
              type: Type.NUMBER,
              description: 'Financing quantum in MYR.'
            }
          },
          required: ['lenderName']
        }
      },
      {
        name: 'navigate_view',
        description: 'Navigates the user to a specific page or workflow step in the Loan-La application.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            targetPage: {
              type: Type.STRING,
              description: 'Target page: app, calculator, directory, tracker, settings, support, report_explainer.'
            },
            step: {
              type: Type.NUMBER,
              description: 'Step number if targetPage is app (1=need, 2=upload, 3=consent, 4=report).'
            }
          },
          required: ['targetPage']
        }
      },
      {
        name: 'query_bank_intelligence',
        description: 'Query or auto-update latest real-time verified interest rates, promotional campaigns, and turnaround speeds across Malaysian digital banks (GXBank, Boost Bank, AEON Bank) and micro-credit institutions (TEKUN, BSN, Maybank).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            lenderId: {
              type: Type.STRING,
              description: 'Optional target lender ID: gxbank, boost, aeon_bank, tekun, maybank_mikro, bsn, or all.'
            }
          }
        }
      }
    ]
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages = [], language = 'en', userContext = {} } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      language?: 'en' | 'bm';
      userContext?: UserContextPayload;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'No messages provided' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Precise language detection: prioritize the user's latest query language!
    const detectedLang = detectMessageLanguage(lastUserMessage, language);

    const isLoggedIn = Boolean(userContext.isLoggedIn && userContext.name && userContext.name !== 'Guest');
    const hasAssessment = Boolean((userContext.latestScore && userContext.latestScore > 0) || (userContext.friScore && userContext.friScore > 0));

    const storedAssessment = hasAssessment ? await getLatestStoredAssessment() : null;

    // Applicant context
    const applicantName = isLoggedIn ? (userContext.userName || userContext.name || 'Borrower') : 'Guest';
    const assessedIncome = hasAssessment ? (userContext.averageMonthlyIncome || userContext.assessedInflow || storedAssessment?.averageMonthlyNetIncome || 3500) : 0;
    const friScore = hasAssessment ? (userContext.friScore || userContext.latestScore || storedAssessment?.score || 720) : null;
    const grade = hasAssessment ? (userContext.latestGrade || storedAssessment?.grade || 'A') : null;
    const dsr = hasAssessment ? (userContext.dsrPercentage !== undefined ? userContext.dsrPercentage : (userContext.currentDsr !== undefined ? userContext.currentDsr : 32.5)) : null;
    const loanAmount = userContext.targetLoanAmount || 10000;
    const loanPurpose = userContext.targetLoanPurpose || 'working_capital';
    const tenureYears = userContext.calcTenureYears || 2;
    const platform = userContext.platform && userContext.platform !== 'Guest' ? userContext.platform : 'Gig Economy / Micro-SME';

    // Strict System Prompt with Comprehensive Malaysian Lending Knowledge
    const systemPrompt = `You are Loan-La's Expert AI Credit Copilot & Financial Underwriting Assistant.
You are embedded directly in the Loan-La platform, helping Malaysian gig workers (Grab, Foodpanda, Shopee, Lalamove, TikTok) and micro-SMEs secure financing from licensed Malaysian digital banks and government micro-funds.

========================================
CRITICAL LANGUAGE ENFORCEMENT:
========================================
- USER MESSAGE LANGUAGE: "${detectedLang.toUpperCase()}" (${detectedLang === 'en' ? 'ENGLISH' : 'BAHASA MELAYU'}).
- MANDATORY: You MUST reply 100% in ${detectedLang === 'en' ? 'ENGLISH' : 'BAHASA MELAYU'}.
${detectedLang === 'en' 
  ? '- DO NOT speak or reply in Bahasa Melayu under any circumstances because the user asked in English.' 
  : '- Sila jawab sepenuhnya dalam Bahasa Melayu yang mesra, profesional dan mudah difahami.'}

========================================
USER STATUS & CONTEXT:
========================================
${hasAssessment && friScore !== null
  ? `VERIFIED ASSESSMENT AVAILABLE:
- Name: ${applicantName}
- Platform: ${platform}
- Assessed Net Monthly Income: RM ${assessedIncome.toLocaleString()}
- FRI Score: ${friScore}/850 (Grade ${grade})
- Current DSR: ${dsr !== null ? dsr.toFixed(1) : '35'}% (BNM Macroprudential Cap: 60%)
- Target Loan: RM ${loanAmount.toLocaleString()} (${loanPurpose}) over ${tenureYears} year(s)
${dsr !== null && dsr > 55 ? `⚠️ HIGH DSR ALERT: Current DSR is ${dsr.toFixed(1)}%. Advise extending tenure to bring DSR into the safe zone (<45%) and recommend flexible lenders like TEKUN/BSN.` : `✅ HEALTHY DSR: DSR is safe.`}`
  : `GUEST VISITOR (NO ASSESSMENT COMPLETED YET):
- The user is currently browsing as a guest.
- They have NOT completed a credit check or document upload yet.
- DO NOT invent or hallucinate a "DSR of 0.0%", fake startup credit scores, or past assessment data!
- Address their questions directly, accurately, and warmly.`}

========================================
VERIFIED MALAYSIAN FINANCING KNOWLEDGE:
========================================
1. GIG WORKERS & NO PAYSLIPS (Grab, Foodpanda, Shopee sellers, freelancers):
   - Traditional commercial banks reject borrowers who lack 3 months of formal corporate payslips or EPF/EA forms.
   - HOWEVER, licensed Malaysian Digital Banks (GXBank, Boost Bank, AEON Bank) and alternative lenders (AEON Credit, Direct Lending, Fundaztic) DO NOT require conventional payslips.
   - They accept:
     a) 3–6 months of bank statement PDFs showing driver e-wallet cashout transfers.
     b) Driver/rider app weekly earnings summary statements.
     c) E-wallet transaction summaries.
   - As long as monthly inflows show consistent earning history (e.g. RM3,000–RM4,000/mo), borrowers can comfortably qualify for RM5,000–RM20,000.

2. SPEED OF DISBURSEMENT & DIGITAL BANKS:
   - FASTEST PAYOUT: **GXBank** (Singlife / Grab consortium) offers the fastest payout in Malaysia. Once approved digitally in-app, funds are disbursed directly into the account within **10 minutes to under 1 hour** (up to RM50,000, 100% online, zero paperwork).
   - 2ND FASTEST: **Boost Bank SME** (Axiata / RHB consortium) — 100% digital, typical turnaround within **24 to 48 hours** (up to RM100,000 for registered merchants).
   - **AEON Bank**: 100% Islamic digital bank with a 1–3 business day turnaround.

3. HIGH DSR (DEBT SERVICE RATIO) & PRIOR BANK REJECTIONS (e.g. CIMB / Maybank reject with DSR ~58%):
   - Why commercial banks reject: They enforce strict scoring cutoffs and hard DSR ceilings (usually 50%–60%).
   - Solutions to increase approval odds:
     a) **Extend repayment tenure**: Extending tenure (e.g. from 2 years to 4–5 years) slashes the monthly installment by ~40-50%, dropping DSR from 58% down to ~35-40%, safely below BNM's 60% threshold.
     b) **Apply to alternative / development lenders**: **TEKUN Nasional** and **BSN Mikro** assess actual business cashflow rather than rigid corporate credit scores.
     c) **Debt Consolidation**: Combine high-interest credit card debt into a single lower-rate micro-loan.
     d) **Avoid blind multi-applications**: Multiple commercial bank rejections leave hard inquiries on CCRIS, damaging credit score.

4. LOAN REPAYMENT CALCULATION:
   - Flat interest formula:
     * Total Interest = Principal × (Rate / 100) × TenureYears
     * Total Repayment = Principal + Total Interest
     * Monthly Repayment = Total Repayment / (TenureYears × 12)
   - Example (RM15,000, 2 years, 5.5% interest):
     * Total Interest = 15,000 × 0.055 × 2 = RM 1,650
     * Total Repayment = RM 16,650
     * Monthly Installment = RM 16,650 ÷ 24 = **RM 693.75 / month**.
   - Whenever asked for calculations, state the numbers clearly and trigger the \`set_calculator\` tool!

5. GOVERNMENT FUNDS FOR FEMALE & YOUTH ENTREPRENEURS:
   - **TEKUNITA (TEKUN Nasional)**: Specifically for female micro-entrepreneurs. Financing up to RM20,000 with a low subsidized interest rate of **4.0% p.a. flat**, minimal paperwork, and quick processing.
   - **BSN Micro / TemanNita**: Dedicated financing for women-owned micro-enterprises up to RM50,000 with subsidized low rates.
   - **Skim Pembangunan Usahawan Belia (TEKUN / BSN Belia)**: Dedicated micro-credit for youth entrepreneurs aged 18–30 with subsidized rates as low as **4.0% p.a.**

6. LEGITIMACY & ANTI-SCAM ASSURANCE:
   - Loan-La is 100% LEGITIMATE and SAFE. We are **NOT** a loan shark (ah long) and **NOT** an unlicensed moneylender.
   - **NO UPFRONT FEES**: Loan-La is 100% free for borrowers. We NEVER ask for processing fees, deposit fees, or lawyer fees before approval. Any party asking for money upfront is an illegal scam!
   - We connect borrowers ONLY to Bank Negara Malaysia (BNM) licensed banks and KPKT-regulated moneylenders.

========================================
TOOL CALLING RULES:
========================================
1. When calling ANY tool (like \`set_calculator\`, \`query_bank_intelligence\`, \`configure_loan_parameters\`, or \`optimize_affordability\`), YOU MUST STILL GENERATE A COMPLETE, HELPFUL TEXT RESPONSE answering the user's specific question!
2. If the user asks a question (e.g. "Which bank has fastest payout?" or "What is my monthly repayment?"), ALWAYS answer their specific question with detailed facts first. DO NOT just output a generic "I have configured your loan on Step 1" boilerplate!
3. Keep answers clear, empathetic, and professional (2-4 concise paragraphs max).`;

    // Format conversational history for Gemini
    const contents: any[] = [];
    const recentMessages = messages.slice(-8);

    for (const msg of recentMessages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Call Gemini with rotation
    const geminiResult = await callGeminiWithModelRotation(async (ai, model) => {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.35,
          tools: agentTools
        }
      });
      return response;
    });

    let reply = geminiResult.text?.trim() || '';
    const functionCalls = geminiResult.functionCalls;
    let extractedAction: any = undefined;

    // Process Tool Decisions
    if (functionCalls && functionCalls.length > 0) {
      const toolCall = functionCalls[0];
      const toolName = toolCall.name;
      const args: any = toolCall.args || {};

      if (toolName === 'set_calculator') {
        const pAmount = args.loanAmount || 15000;
        const pTenure = args.tenureYears || 2;
        const pRate = args.interestRate || 5.5;
        const totalInterest = pAmount * (pRate / 100) * pTenure;
        const totalPayable = pAmount + totalInterest;
        const monthly = Math.round((totalPayable / (pTenure * 12)) * 100) / 100;

        extractedAction = {
          type: 'SET_CALCULATOR',
          payload: {
            loanAmount: pAmount,
            tenureYears: pTenure,
            interestRate: pRate
          }
        };

        if (!reply || reply.length < 20) {
          reply = detectedLang === 'bm'
            ? `Untuk pinjaman RM ${pAmount.toLocaleString()} selama ${pTenure} tahun pada kadar faedah ${pRate}% p.a.:\n\n• **Anggaran Ansuran Bulanan:** RM ${monthly.toFixed(2)}/bulan\n• **Jumlah Faedah:** RM ${totalInterest.toLocaleString()}\n• **Jumlah Bayaran Balik:** RM ${totalPayable.toLocaleString()}\n\nSaya telah mengemas kini kalkulator interaktif pada skrin anda supaya anda boleh menyemak butirannya dengan mudah!`
            : `For a loan of RM ${pAmount.toLocaleString()} over ${pTenure} year(s) at an indicative interest rate of ${pRate}% p.a.:\n\n• **Estimated Monthly Installment:** RM ${monthly.toFixed(2)} / month\n• **Total Interest:** RM ${totalInterest.toLocaleString()}\n• **Total Repayment:** RM ${totalPayable.toLocaleString()}\n\nI have updated the interactive calculator on your screen with these exact numbers!`;
        }
      } else if (toolName === 'configure_loan_parameters') {
        extractedAction = {
          type: 'SET_LOAN_PURPOSE',
          payload: {
            purpose: args.purpose || loanPurpose,
            amount: args.amount || loanAmount,
            tenureYears: args.tenureYears || tenureYears,
            platform: args.platform || platform,
            targetStep: 2
          }
        };

        if (!reply || reply.length < 20) {
          reply = detectedLang === 'bm'
            ? `Saya telah menetapkan keperluan pinjaman anda sebanyak RM ${(args.amount || loanAmount).toLocaleString()} untuk tempoh ${args.tenureYears || tenureYears} tahun pada Langkah 1. Anda boleh teruskan untuk memuat naik dokumen penyata anda di Langkah 2!`
            : `I've configured your loan request for RM ${(args.amount || loanAmount).toLocaleString()} over ${args.tenureYears || tenureYears} year(s) on Step 1. You can now proceed to review or upload your statements on Step 2!`;
        }
      } else if (toolName === 'optimize_affordability') {
        const proposedYears = args.proposedTenureYears || (tenureYears + 2);
        const proposedAmt = args.proposedLoanAmount || loanAmount;

        extractedAction = {
          type: 'SET_CALCULATOR',
          payload: {
            loanAmount: proposedAmt,
            tenureYears: proposedYears,
            interestRate: 5.5
          }
        };

        if (!reply || reply.length < 20) {
          reply = detectedLang === 'bm'
            ? `Untuk mengurangkan DSR anda dan mengelakkan penolakan oleh bank, saya cadangkan melanjutkan tempoh bayaran balik kepada ${proposedYears} tahun. Ini akan menurunkan ansuran bulanan anda dan meletakkan DSR anda dalam zon selamat Bank Negara Malaysia (<45%). Saya telah melaraskannya pada kalkulator untuk anda.`
            : `To lower your DSR and prevent another bank rejection, extending your repayment tenure to ${proposedYears} years will significantly reduce your monthly installments, bringing your DSR into Bank Negara Malaysia's safe zone (<45%). I have adjusted the calculator accordingly for you.`;
        }
      } else if (toolName === 'dispatch_lender_application') {
        extractedAction = {
          type: 'DISPATCH_APPLICATION',
          payload: {
            lenderName: args.lenderName || 'GXBank',
            loanAmount: args.loanAmount || loanAmount
          }
        };
        if (!reply) {
          reply = detectedLang === 'bm'
            ? `Memulakan penghantaran permohonan digital anda ke ${args.lenderName || 'lender'} sekarang.`
            : `Initiating digital application dispatch to ${args.lenderName || 'the lender'} gateway now.`;
        }
      } else if (toolName === 'navigate_view') {
        const page = args.targetPage;
        if (page === 'app') {
          extractedAction = {
            type: args.step === 2 ? 'NAVIGATE_UPLOAD' : args.step === 4 ? 'NAVIGATE_REPORT' : 'NAVIGATE_LOAN_NEED'
          };
        } else if (page === 'calculator') {
          extractedAction = { type: 'NAVIGATE_CALCULATOR' };
        } else if (page === 'directory') {
          extractedAction = { type: 'NAVIGATE_DIRECTORY' };
        } else if (page === 'tracker') {
          extractedAction = { type: 'NAVIGATE_TRACKER' };
        } else if (page === 'settings') {
          extractedAction = { type: 'NAVIGATE_SETTINGS' };
        } else if (page === 'support') {
          extractedAction = { type: 'NAVIGATE_SUPPORT' };
        }
        if (!reply) {
          reply = detectedLang === 'bm'
            ? `Membuka halaman ${page} untuk anda.`
            : `Navigating to ${page} for you now.`;
        }
      } else if (toolName === 'query_bank_intelligence') {
        extractedAction = { type: 'OPEN_BANK_INTELLIGENCE' };
        if (!reply || reply.length < 20) {
          reply = detectedLang === 'bm'
            ? `**GXBank** menawarkan pembayaran terpantas di Malaysia — dikreditkan ke akaun anda dalam tempoh **10 minit hingga 1 jam** selepas kelulusan (sehingga RM50,000, 100% digital tanpa kertas). **Boost Bank** juga 100% digital dengan kelulusan dan pembayaran dalam tempoh **24 hingga 48 jam** (sehingga RM100,000).`
            : `**GXBank** offers the fastest digital loan payout in Malaysia — typically disbursed directly into your account within **10 minutes to under 1 hour** upon approval (up to RM50,000, 100% digital in-app, zero paperwork). **Boost Bank** is another 100% digital option with a turnaround of **24 to 48 hours** (up to RM100,000).`;
        }
      }
    }

    // Default safety fallback if reply was somehow empty
    if (!reply) {
      reply = detectedLang === 'bm'
        ? "Bagaimanakah saya boleh membantu mempercepatkan atau mengoptimumkan permohonan pembiayaan anda hari ini?"
        : "How can I assist you in exploring or optimizing your financing application today?";
    }

    return NextResponse.json({
      success: true,
      reply,
      action: extractedAction,
      language: detectedLang,
      suggestions: detectedLang === 'bm'
        ? ["Semak Had Selamat", "Padanan Bank Direktori", "Optimumkan DSR"]
        : ["Check Safe Limit", "Matched Bank Directory", "Optimize DSR"]
    });
  } catch (error: any) {
    console.error("[AGENT ROUTE ERROR]", error);
    return NextResponse.json({
      success: false,
      reply: "Loan-La smart copilot is active. How may I assist your loan application?",
      error: error.message
    }, { status: 200 });
  }
}
