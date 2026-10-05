import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import { callGeminiWithModelRotation } from '@/lib/geminiRotator';

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
        name: 'configure_loan_parameters',
        description: 'Configure or update the borrower loan need: loan purpose, principal amount in MYR, tenure in years, and working platform.',
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
    const storedAssessment = await getLatestStoredAssessment();

    // Consolidate live financial telemetry
    const applicantName = userContext.userName || userContext.name || storedAssessment?.applicantName || 'Borrower';
    const assessedIncome = userContext.averageMonthlyIncome || userContext.assessedInflow || storedAssessment?.averageMonthlyNetIncome || 3500;
    const friScore = userContext.friScore || userContext.latestScore || storedAssessment?.score || 720;
    const grade = userContext.latestGrade || storedAssessment?.grade || 'A';
    const dsr = userContext.dsrPercentage !== undefined ? userContext.dsrPercentage : (userContext.currentDsr !== undefined ? userContext.currentDsr : 32.5);
    const loanAmount = userContext.targetLoanAmount || storedAssessment?.targetLoanAmount || 10000;
    const loanPurpose = userContext.targetLoanPurpose || storedAssessment?.targetLoanPurpose || 'working_capital';
    const tenureYears = userContext.calcTenureYears || 2;
    const platform = userContext.platform || 'Gig Economy & Micro-SME';
    const currentPage = userContext.currentPage || 'app';
    const activeStep = userContext.activeStep || 1;
    const uploadedFilesCount = userContext.uploadedFilesCount || 0;

    // Build the Autonomous Agent System Prompt
    const systemPrompt = `You are Loan-La's Autonomous AI Credit Agent & Financial Underwriting Copilot.
You are embedded directly in the Loan-La financial platform for Malaysian gig workers (Grab, Foodpanda, Shopee, Lalamove, TikTok) and micro-SMEs.
You do NOT just provide passive content or canned lectures. You are an active, intelligent agent with real tools to inspect, configure, optimize, and dispatch loan applications.

LIVE APPLICANT FINANCIAL CONTEXT:
- Name: ${applicantName}
- Platform / Business: ${platform}
- Assessed Monthly Net Income: RM ${assessedIncome.toLocaleString()}
- Financial Readiness Index (FRI): ${friScore}/850 (Grade ${grade})
- Current Debt Service Ratio (DSR): ${dsr.toFixed(1)}% (BNM Macroprudential Cap is 60%)
- Target Loan Need: RM ${loanAmount.toLocaleString()} (${loanPurpose}) over ${tenureYears} year(s)
- Current Location in App: Page "${currentPage}", Step ${activeStep} of 4
- Uploaded Financial Evidence: ${uploadedFilesCount} file(s) attached

AGENT BEHAVIOR RULES:
1. EMBEDDED & EFFORTLESS:
   - When a user states their financing need, amount, tenure, or income (e.g. "Saya nak pinjam RM15k untuk beli stok raya"), DO NOT write a lecture. Call the \`configure_loan_parameters\` tool to update their application state directly!
   - When a user asks how to qualify or fix a high DSR, analyze their numbers, suggest an optimal tenure or lender, and call \`optimize_affordability\`.
   - When a user wants to submit or apply to a bank (e.g. "Mohon untuk saya di GXBank"), call \`dispatch_lender_application\`.
   - When a user asks to view calculator, directory, tracker, or report, call \`navigate_view\`.
2. NATURAL & MULTILINGUAL:
   - Understand any human speech: Bahasa Melayu, English, Manglish, colloquial slang, or typos.
   - Match the user's language naturally. If they speak Malay, respond in friendly, professional Malay. If English, respond in English.
3. CONCISE & ACTION-ORIENTED:
   - Keep conversational explanations clear, empathetic, and concise (2-4 sentences max).
   - State clearly what action you have executed or recommend.
   - Never output hardcoded disclaimers or raw markdown hashes (#) headers. Talk like an experienced, trusted personal banker.`;

    // Format conversational history for Gemini
    const contents: any[] = [];
    const recentMessages = messages.slice(-8); // Keep last 8 turns for tight latency

    for (const msg of recentMessages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Call Gemini 2.5 with Native Function Calling
    const geminiResult = await callGeminiWithModelRotation(async (ai, model) => {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          tools: agentTools
        }
      });
      return response;
    });

    let reply = geminiResult.text?.trim() || '';
    const functionCalls = geminiResult.functionCalls;
    let extractedAction: any = undefined;

    // Handle tool execution decisions
    if (functionCalls && functionCalls.length > 0) {
      const toolCall = functionCalls[0];
      const toolName = toolCall.name;
      const args: any = toolCall.args || {};

      if (toolName === 'configure_loan_parameters') {
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
        if (!reply) {
          reply = language === 'bm'
            ? `Saya telah tetapkan permohonan pembiayaan anda sebanyak RM ${(args.amount || loanAmount).toLocaleString()} untuk tempoh ${args.tenureYears || tenureYears} tahun pada Langkah 1. Anda boleh terus memuat naik dokumen penyata anda di Langkah 2!`
            : `I've configured your loan application for RM ${(args.amount || loanAmount).toLocaleString()} over ${args.tenureYears || tenureYears} year(s) on Step 1. You can now proceed to upload your statements on Step 2!`;
        }
      } else if (toolName === 'optimize_affordability') {
        extractedAction = {
          type: 'SET_CALCULATOR',
          payload: {
            loanAmount: args.proposedLoanAmount || loanAmount,
            tenureYears: args.proposedTenureYears || (tenureYears + 1),
            interestRate: 5.5
          }
        };
        if (!reply) {
          reply = language === 'bm'
            ? `Berdasarkan analisis kapasiti bayaran balik anda, saya telah melaraskan tempoh kepada ${args.proposedTenureYears || (tenureYears + 1)} tahun dalam kalkulator untuk menurunkan DSR anda ke tahap selamat.`
            : `Based on your cashflow capacity, I've adjusted your repayment tenure to ${args.proposedTenureYears || (tenureYears + 1)} years in the calculator to bring your DSR well within the safe approval zone.`;
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
          reply = language === 'bm'
            ? `Memulakan penghantaran automatik permohonan dan Memorandum Penilaian Kredit (CAM) anda ke pintu masuk ${args.lenderName || 'lender'} sekarang.`
            : `Initiating automated dispatch of your application and Credit Assessment Memorandum (CAM) to ${args.lenderName || 'the lender'} gateway now.`;
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
          reply = language === 'bm'
            ? `Membuka halaman ${page} untuk anda.`
            : `Navigating to ${page} for you now.`;
        }
      }
    }

    if (!reply) {
      reply = language === 'bm'
        ? "Bagaimanakah saya boleh bantu mempercepatkan atau mengoptimumkan permohonan pembiayaan anda hari ini?"
        : "How can I assist you in optimizing or preparing your financing application today?";
    }

    return NextResponse.json({
      success: true,
      reply,
      action: extractedAction,
      suggestions: language === 'bm'
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
