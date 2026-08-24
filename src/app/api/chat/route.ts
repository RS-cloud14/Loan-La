import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import { callGeminiWithRotation } from '@/lib/geminiRotator';

interface UserContextPayload {
  isLoggedIn?: boolean;
  name?: string;
  platform?: string;
  assessedInflow?: number;
  latestScore?: number;
  latestGrade?: string;
  currentDsr?: number;
  emergencyRunway?: number;
  maxSafeLoan?: number;
  maxSafeMonthlyPay?: number;
  targetLoanAmount?: number;
  targetLoanPurpose?: string;
}

// Read latest assessment from stored JSON file on disk
async function getLatestStoredAssessment(): Promise<any | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'latest_assessment.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Helper to detect if user input is primarily Malay
function isMalayText(text: string): boolean {
  const lower = text.toLowerCase();
  
  // Strong English indicators
  const englishWords = ['how', 'download', 'statement', 'satement', 'statment', 'what', 'where', 'can', 'please', 'hi', 'hello', 'my', 'is', 'the', 'from', 'with', 'for', 'about', 'check', 'latest', 'score', 'explain', 'tell', 'need', 'want', 'app', 'loan'];
  const englishMatchCount = englishWords.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(lower)).length;
  
  // Strong Malay indicators
  const malayKeywords = ['saya', 'nak', 'pinjam', 'mohon', 'berapa', 'semak', 'laporan', 'tolong', 'macam', 'mana', 'boleh', 'tukar bahasa', 'cakap melayu', 'bayar', 'setahun', 'kadar faedah', 'permohonan', 'tetapan', 'muat turun', 'penyata', 'bagaimana', 'apa itu', 'bantu saya', 'buka'];
  const malayMatchCount = malayKeywords.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(lower)).length;

  if (englishMatchCount > 0 && englishMatchCount >= malayMatchCount) {
    return false;
  }

  return malayMatchCount > 0;
}

// Normalize Malay and English spoken decimals (e.g. "Five Point six four" -> "5.64", "lima perpuluhan lima" -> "5.5")
function normalizeSpokenMalayDecimals(text: string): string {
  const digitWords: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
    'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20',
    'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90',
    'kosong': '0', 'sifar': '0', 'satu': '1', 'dua': '2', 'tiga': '3', 'empat': '4', 'lima': '5',
    'enam': '6', 'tujuh': '7', 'lapan': '8', 'sembilan': '9', 'sepuluh': '10'
  };

  let res = text.toLowerCase();

  // Pattern: (word/digit) + (point|dot|perpuluhan) + (word/digit) + optional (word/digit)
  const spokenDecimalRegex = /\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|satu|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|sepuluh)\s*(?:point|dot|perpuluhan|\.)\s*(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|kosong|sifar|satu|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|sepuluh)(?:\s*(zero|one|two|three|four|five|six|seven|eight|nine|kosong|sifar|satu|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|\d+))?\b/gi;

  res = res.replace(spokenDecimalRegex, (match, whole, dec1, dec2) => {
    const w = digitWords[whole.toLowerCase()] || whole;
    const d1 = digitWords[dec1.toLowerCase()] || dec1;
    const d2 = dec2 ? (digitWords[dec2.toLowerCase()] || dec2) : '';
    return `${w}.${d1}${d2}`;
  });

  // Standard numeric decimal point normalization
  res = res.replace(/(\d+)\s*(?:perpuluhan|point|dot|\.)\s*(\d+)/gi, '$1.$2');

  return res;
}

// Advanced Spoken Words to Number Converter
function parseWordsToNumber(text: string): number | undefined {
  const clean = text.toLowerCase()
    .replace(/thousands/g, 'thousand')
    .replace(/hundreds/g, 'hundred')
    .replace(/puluh-puluh/g, 'puluh')
    .replace(/ratus-ratus/g, 'ratus')
    .replace(/ribu-ribu/g, 'ribu');

  const numberWords: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    satu: 1, se: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, lapan: 8, sembilan: 9,
    sepuluh: 10, sebelas: 11, belas: 10, seratus: 100, seribu: 1000,
    'dua puluh': 20, 'tiga puluh': 30, 'empat puluh': 40, 'lima puluh': 50,
    'enam puluh': 60, 'tujuh puluh': 70, 'lapan puluh': 80, 'sembilan puluh': 90
  };

  const tokens = clean.split(/[\s-]+/);
  let total = 0;
  let current = 0;
  let foundAny = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'and') continue;

    if (t === 'thousand' || t === 'ribu' || t === 'k') {
      if (current === 0) current = 1;
      total += current * 1000;
      current = 0;
      foundAny = true;
    } else if (t === 'hundred' || t === 'ratus') {
      if (current === 0) current = 1;
      current = current * 100;
      foundAny = true;
    } else if (t === 'puluh') {
      if (current > 0 && current < 10) {
        current = current * 10;
      } else {
        current = 10;
      }
      foundAny = true;
    } else if (t === 'belas') {
      if (current > 0 && current < 10) {
        current = 10 + current;
      } else {
        current = 10;
      }
      foundAny = true;
    } else if (numberWords[t] !== undefined) {
      current += numberWords[t];
      foundAny = true;
    } else if (foundAny) {
      break;
    }
  }

  const result = total + current;
  if (foundAny && result >= 500 && result <= 1000000) {
    return result;
  }
  return undefined;
}

// Robust Spoken Amount Parser
function parseSpokenAmount(text: string): number | undefined {
  const clean = text.toLowerCase();
  
  // 1. Currency prefix or suffix: RM / Ringgit / MYR (e.g. "RM 57,000", "57,000 ringgit", "57,000 ringgit malaysia", "57k myr")
  const currencyMatch = clean.match(/(?:rm|myr)\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|ribu|thousand)?/i) ||
                        clean.match(/(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|ribu|thousand)?\s*(?:ringgit(?:\s*malaysia)?|myr|rm)/i);
  if (currencyMatch && currencyMatch[1]) {
    let val = parseFloat(currencyMatch[1].replace(/,/g, ''));
    const unit = currencyMatch[2]?.toLowerCase();
    if (unit === 'k' || unit === 'ribu' || unit === 'thousand' || (val < 100 && (clean.includes('k') || clean.includes('ribu') || clean.includes('thousand')))) {
      val *= 1000;
    }
    if (val >= 500 && val <= 5000000) return val;
  }

  // 2. Action verbs + Amount (e.g. "apply 57,000", "apply for 57000", "pinjam 57,000", "borrow 57,000", "need 57,000", "loan of 57,000")
  const actionMatch = clean.match(/(?:apply(?:ing)?(?:\s*for)?|pinjam(?:\s*sebanyak)?|borrow|need|want|mohon|buat\s*pinjaman|loan\s*of|amount\s*of)\s*(?:rm|myr)?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|ribu|thousand)?/i);
  if (actionMatch && actionMatch[1]) {
    let val = parseFloat(actionMatch[1].replace(/,/g, ''));
    const unit = actionMatch[2]?.toLowerCase();
    if (unit === 'k' || unit === 'ribu' || unit === 'thousand' || (val < 100 && (clean.includes('k') || clean.includes('ribu') || clean.includes('thousand')))) {
      val *= 1000;
    }
    if (val >= 500 && val <= 5000000) return val;
  }

  // 3. Formatted numbers with commas (e.g. "57,000", "150,000", "7,500")
  const commaNumberMatch = clean.match(/\b(\d{1,3}(?:,\d{3})+)\b/);
  if (commaNumberMatch && commaNumberMatch[1]) {
    const val = parseFloat(commaNumberMatch[1].replace(/,/g, ''));
    if (val >= 500 && val <= 5000000) return val;
  }

  // 4. Word numbers (e.g. "seven thousand five hundred", "fifty seven thousand", "tujuh ribu lima ratus")
  const wordAmount = parseWordsToNumber(clean);
  if (wordAmount && wordAmount >= 500 && wordAmount <= 5000000) {
    return wordAmount;
  }

  // 5. Match numeric amounts with 'k', 'ribu', 'thousand' (e.g. "57k", "57 k", "57 ribu")
  const kMatch = clean.match(/(\d+(?:\.\d+)?)\s*(k|ribu|thousand)\b/i);
  if (kMatch && kMatch[1]) {
    const val = parseFloat(kMatch[1]) * 1000;
    if (val >= 500 && val <= 5000000) return val;
  }

  // 6. Standalone 4-7 digit numeric amounts (e.g. 57000, 7500), avoiding 4-digit years (2020-2035)
  const numberMatches = clean.matchAll(/\b(\d{4,7})\b/g);
  for (const m of numberMatches) {
    const val = parseInt(m[1], 10);
    if (val >= 500 && val <= 5000000 && !(val >= 2020 && val <= 2035)) {
      return val;
    }
  }

  return undefined;
}

// Robust Spoken Tenure Parser
function parseSpokenTenure(text: string): number | undefined {
  const clean = text.toLowerCase();
  
  const tenureMatch = clean.match(/(\d+(?:\.\d+)?)\s*(year|years|yr|yrs|tahun|thn|month|months|mth|mths|bulan|bln)/i);
  if (tenureMatch) {
    const val = parseFloat(tenureMatch[1]);
    const unit = tenureMatch[2].toLowerCase();
    if (unit.startsWith('m') || unit.startsWith('b')) {
      return Math.max(0.5, Math.round((val / 12) * 10) / 10);
    }
    return Math.min(10, Math.max(0.5, val));
  }

  const wordTenure: Record<string, number> = {
    'half': 0.5, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'setengah': 0.5, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5, 'enam': 6, 'tujuh': 7, 'lapan': 8, 'sembilan': 9, 'sepuluh': 10
  };

  for (const [w, yrs] of Object.entries(wordTenure)) {
    if (clean.includes(w + ' year') || clean.includes(w + ' yr') || clean.includes(w + ' tahun') || clean.includes(w + ' thn')) {
      return yrs;
    }
  }

  return undefined;
}

// Robust Spoken Interest Rate Parser
function parseSpokenRate(text: string): number | undefined {
  const normalized = normalizeSpokenMalayDecimals(text.toLowerCase());
  
  // 1. Suffix pattern (e.g. "5.64% rate", "5.64 percent", "5.64 peratus", "5.64 p.a.")
  const suffixMatch = normalized.match(/(\d{1,2}(?:\.\d{1,4})?)\s*(?:%|percent|peratus)\s*(?:rate|interest|kadar|faedah|p\.a\.|pa|setahun)?/i) ||
                      normalized.match(/(\d{1,2}(?:\.\d{1,4})?)\s*(?:interest\s*rate|interest|kadar\s*faedah|kadar|faedah|rate|p\.a\.|pa|setahun)/i);
  if (suffixMatch && suffixMatch[1]) {
    const rateVal = parseFloat(suffixMatch[1]);
    if (rateValInRange(rateVal)) return rateVal;
  }

  // 2. Prefix pattern (e.g. "interest rate I think is 5.64", "kadar faedah adalah 5.64", "rate of 5.64")
  const prefixMatch = normalized.match(/(?:interest\s*rate|interest|kadar\s*faedah|kadar|faedah|rate)\s*(?:[a-z\s]{0,25}?)\s*(\d{1,2}(?:\.\d{1,4})?)/i);
  if (prefixMatch && prefixMatch[1]) {
    const rateVal = parseFloat(prefixMatch[1]);
    if (rateValInRange(rateVal)) return rateVal;
  }

  // 3. Standalone decimal in the sentence (e.g. "5.64", "7.69", "4.65")
  const decimalMatch = normalized.match(/\b(\d{1,2}\.\d{1,4})\b/);
  if (decimalMatch && decimalMatch[1]) {
    const val = parseFloat(decimalMatch[1]);
    if (rateValInRange(val)) return val;
  }

  // 4. Word-based single rates (e.g. "five percent", "enam peratus")
  const wordRates: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5, 'enam': 6, 'tujuh': 7, 'lapan': 8, 'sembilan': 9, 'sepuluh': 10
  };
  for (const [w, val] of Object.entries(wordRates)) {
    if (normalized.includes(w + ' percent') || normalized.includes(w + ' peratus') || normalized.includes(w + ' %') || normalized.includes('rate of ' + w) || normalized.includes('kadar ' + w) || normalized.includes('kadar faedah ' + w) || normalized.includes(w + ' interest rate')) {
      return val;
    }
  }

  return undefined;
}

function rateValInRange(val: number): boolean {
  return val >= 0.5 && val <= 30;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, language = 'en', userContext = {} } = body as {
      messages: any[];
      language: 'en' | 'bm';
      userContext?: UserContextPayload;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: "Invalid payload: messages array required." }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const lastMsgLower = lastUserMessage.toLowerCase();

    // Strictly respect the user's explicit language setting
    let isMalay = language === 'bm';
    if (language === 'en') {
      if (lastMsgLower.includes('cakap melayu') || lastMsgLower.includes('tukar bahasa melayu') || lastMsgLower.includes('switch to malay') || lastMsgLower.includes('dalam bahasa melayu')) {
        isMalay = true;
      }
    } else if (language === 'bm') {
      if (lastMsgLower.includes('speak english') || lastMsgLower.includes('switch to english') || lastMsgLower.includes('in english')) {
        isMalay = false;
      }
    }

    const isUserLoggedIn = userContext.isLoggedIn === true;

    // Read live stored assessment JSON from disk ONLY if the user is authenticated
    const stored = isUserLoggedIn ? await getLatestStoredAssessment() : null;
    const storedInput = stored?.inputData;
    const storedReport = stored?.report;

    const dynamicName = isUserLoggedIn ? (userContext.name || storedInput?.identityData?.fullName || storedInput?.name || 'Borrower') : 'Guest';
    const dynamicScore = isUserLoggedIn ? (userContext.latestScore || storedReport?.score || 710) : 0;
    const dynamicGrade = isUserLoggedIn ? (userContext.latestGrade || storedReport?.grade || 'A') : 'N/A';
    const dynamicIncome = isUserLoggedIn ? (userContext.assessedInflow || storedInput?.averageMonthlyNetIncome || 5000) : 0;
    const dynamicPlatform = isUserLoggedIn ? (userContext.platform || storedInput?.platform || 'Gig / Freelance') : 'Guest';
    const dynamicDsr = isUserLoggedIn ? (userContext.currentDsr !== undefined ? userContext.currentDsr : (storedReport?.dsr !== undefined ? storedReport.dsr : 0.0)) : 0;
    const dynamicRunway = isUserLoggedIn ? (userContext.emergencyRunway !== undefined ? userContext.emergencyRunway : (storedReport?.runwayMonths !== undefined ? storedReport.runwayMonths : 1.9)) : 0;
    const dynamicMaxLoan = isUserLoggedIn ? (userContext.maxSafeLoan || (dynamicIncome ? Math.round(dynamicIncome * 0.35 * 30.6) : 53550)) : 0;
    const dynamicMaxMonthly = isUserLoggedIn ? (userContext.maxSafeMonthlyPay || (dynamicIncome ? Math.round(dynamicIncome * 0.35) : 1750)) : 0;

    // 1. Language Switching
    if (lastMsgLower.includes('language') || lastMsgLower.includes('bahasa') || lastMsgLower.includes('tukar bahasa') || lastMsgLower.includes('switch to malay') || lastMsgLower.includes('switch to english') || lastMsgLower.includes('cakap melayu') || lastMsgLower.includes('speak english')) {
      const targetLang = (lastMsgLower.includes('malay') || lastMsgLower.includes('melayu') || lastMsgLower.includes('bm') || lastMsgLower.includes('cakap melayu')) ? 'bm' : 'en';
      const reply = targetLang === 'bm'
        ? "Bahasa ditukar kepada Bahasa Melayu."
        : "Language switched to English.";
      return NextResponse.json({
        success: true,
        reply,
        action: { type: 'CHANGE_LANGUAGE', payload: { language: targetLang } },
        suggestions: targetLang === 'bm' 
          ? ["Kalkulator", "Keperluan Pinjaman", "Direktori Bank"]
          : ["Calculator", "Loan Need Setup", "Bank Directory"]
      });
    }

    // Multi-turn context inspection
    const previousMessages = messages.slice(0, -1);
    const lastAssistantMessage = previousMessages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
    const lastUserPreviousMessage = previousMessages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
    const prevContext = (lastAssistantMessage + ' ' + lastUserPreviousMessage).toLowerCase();

    const isPrevStatementContext = prevContext.includes('statement') || 
                                   prevContext.includes('penyata') || 
                                   prevContext.includes('download') || 
                                   prevContext.includes('satement') ||
                                   prevContext.includes('statment') ||
                                   prevContext.includes('muat turun');

    // 2. Bank & Alternative Document Guides (Maybank, CIMB, Bank Islam, EPF/KWSP, Grab, Shopee, Foodpanda, etc.)
    const hasStatementWord = lastMsgLower.includes('statement') || 
                            lastMsgLower.includes('satement') || 
                            lastMsgLower.includes('statment') || 
                            lastMsgLower.includes('penyata') || 
                            lastMsgLower.includes('document') || 
                            lastMsgLower.includes('dokumen') || 
                            lastMsgLower.includes('slip') || 
                            lastMsgLower.includes('pdf');

    const hasDownloadAction = lastMsgLower.includes('download') || 
                              lastMsgLower.includes('dowload') || 
                              lastMsgLower.includes('get') || 
                              lastMsgLower.includes('dapatkan') || 
                              lastMsgLower.includes('muat turun') || 
                              lastMsgLower.includes('cara') || 
                              lastMsgLower.includes('how to') || 
                              lastMsgLower.includes('how do i') || 
                              lastMsgLower.includes('how can i') ||
                              lastMsgLower.includes('where can i') ||
                              lastMsgLower.includes('dimana') ||
                              lastMsgLower.includes('mana boleh');

    const isEpf = lastMsgLower.includes('epf') || lastMsgLower.includes('kwsp');
    const isGrab = lastMsgLower.includes('grab');
    const isShopee = lastMsgLower.includes('shopee');
    const isFoodpanda = lastMsgLower.includes('foodpanda') || lastMsgLower.includes('panda');
    const isLalamove = lastMsgLower.includes('lalamove');
    const isTng = lastMsgLower.includes('touch') || lastMsgLower.includes('tng') || lastMsgLower.includes('ewallet') || lastMsgLower.includes('e-wallet');

    const isStatementQuery = (hasDownloadAction && (hasStatementWord || isEpf || isGrab || isShopee || isFoodpanda || isLalamove || isTng)) || 
                             (hasStatementWord && (isEpf || isGrab || isShopee || isFoodpanda || isLalamove || isTng || lastMsgLower.includes('bank islam') || lastMsgLower.includes('maybank') || lastMsgLower.includes('cimb') || lastMsgLower.includes('public') || lastMsgLower.includes('rhb') || lastMsgLower.includes('hong leong') || lastMsgLower.includes('ambank') || lastMsgLower.includes('bsn'))) ||
                             (isPrevStatementContext && (
                               lastMsgLower.includes('how about') || 
                               lastMsgLower.includes('what about') || 
                               lastMsgLower.includes('bagaimana') || 
                               lastMsgLower.includes('macam mana') || 
                               lastMsgLower.includes('kalau') || 
                               lastMsgLower.includes('epf') ||
                               lastMsgLower.includes('kwsp') ||
                               lastMsgLower.includes('shopee') ||
                               lastMsgLower.includes('grab') ||
                               lastMsgLower.includes('foodpanda') ||
                               lastMsgLower.includes('lalamove') ||
                               lastMsgLower.includes('tng') ||
                               lastMsgLower.includes('bank islam') || 
                               lastMsgLower.includes('cimb') || 
                               lastMsgLower.includes('maybank') || 
                               lastMsgLower.includes('rhb') || 
                               lastMsgLower.includes('public bank') || 
                               lastMsgLower.includes('ambank') || 
                               lastMsgLower.includes('hong leong') || 
                               lastMsgLower.includes('affin') || 
                               lastMsgLower.includes('bsn') ||
                               lastMsgLower.includes('alliance')
                             ));

    if (isStatementQuery) {
      const isBankIslam = lastMsgLower.includes('islam');
      const isMaybank = lastMsgLower.includes('maybank') || lastMsgLower.includes('mae') || lastMsgLower.includes('m2u');
      const isCimb = lastMsgLower.includes('cimb') || lastMsgLower.includes('octo');
      const isPublic = lastMsgLower.includes('public') || lastMsgLower.includes('pbe');
      const isRhb = lastMsgLower.includes('rhb');
      const isHlb = lastMsgLower.includes('hong leong') || lastMsgLower.includes('hlb');
      const isAmbank = lastMsgLower.includes('ambank') || lastMsgLower.includes('amonline');
      const isBsn = lastMsgLower.includes('bsn') || lastMsgLower.includes('mybsn');
      const isAffin = lastMsgLower.includes('affin');
      const isAlliance = lastMsgLower.includes('alliance');

      let reply = '';

      if (isShopee) {
        reply = isMalay
          ? `Cara Dapatkan Penyata / Slip Pendapatan Shopee (ShopeeFood / Shopee Seller):\n\n1. Untuk Penghantar ShopeeFood (Aplikasi ShopeeFood Driver):\n• Buka Aplikasi Rider → Pergi ke menu "Pendapatan" / "Dompet".\n• Pilih tempoh mingguan/bulanan dan eksport penyata pendapatan (PDF/CSV).\n\n2. Untuk Peniaga Shopee (Shopee Seller Centre):\n• Log masuk ke seller.shopee.com.my melalui pelayar web.\n• Pergi ke menu "Kewangan" → "Buku Akaun / Penyata Pendapatan".\n• Muat turun penyata transaksi bulanan (PDF/Excel).\n\nMuat naik penyata ini ke Loan - La untuk pengesahan pendapatan segera!`
          : `How to Download Shopee Statements / Income Slips (ShopeeFood & Sellers):\n\n1. For ShopeeFood Riders (ShopeeFood Driver App):\n• Open ShopeeFood Driver App → Go to "Earnings" / "Wallet" section.\n• Select the required monthly/weekly period and download/export your statement (PDF/CSV).\n\n2. For Shopee Sellers (Shopee Seller Centre):\n• Log in to seller.shopee.com.my on your web browser.\n• Navigate to "Finance" → "My Income" / "Statement of Account".\n• Download your monthly transaction and payout statements in PDF or Excel.\n\nUpload this to Loan - La for instant alternative income verification!`;
      } else if (isFoodpanda) {
        reply = isMalay
          ? `Cara Dapatkan Penyata Pendapatan Foodpanda (Rooster App):\n• Log masuk ke Aplikasi Foodpanda Rider (Rooster).\n• Pergi ke "Dompet & Sejarah Pesanan".\n• Muat turun atau eksport slip bayaran mingguan/bulanan (PDF).`
          : `How to Download Foodpanda Rider Income Statements:\n• Log in to your Foodpanda Rider App (Rooster).\n• Navigate to "Wallet & Order History".\n• Export or download your weekly/monthly payment invoices (PDF).`;
      } else if (isLalamove) {
        reply = isMalay
          ? `Cara Dapatkan Penyata Pendapatan Lalamove Driver:\n• Buka Aplikasi Lalamove Driver → Pergi ke "Dompet".\n• Tekan pada "Sejarah Transaksi" → Eksport laporan pendapatan 3-6 bulan terkini.`
          : `How to Download Lalamove Driver Earnings Summary:\n• Open the Lalamove Driver App → Go to "Wallet".\n• Tap "Transaction History" → Export your last 3-6 months' earnings summary.`;
      } else if (isTng) {
        reply = isMalay
          ? `Cara Muat Turun Penyata Touch 'n Go eWallet (PDF):\n• Buka Aplikasi TNG eWallet → Pergi ke "Profil".\n• Pilih "Penyata Transaksi" → Pilih tempoh 3-6 bulan.\n• Tekan "Hantar ke Emel" untuk menerima fail PDF rasmi.`
          : `How to Download Touch 'n Go eWallet Statements (PDF):\n• Open TNG eWallet App → Go to "Profile".\n• Select "Transaction Statements" → Choose 3-6 months range.\n• Tap "Send to Email" to receive the official PDF document.`;
      } else if (isEpf) {
        reply = isMalay
          ? `Cara Muat Turun Penyata KWSP (EPF) (PDF):\n\n1. Melalui Portal i-Akaun KWSP (kwsp.gov.my):\n• Log masuk ke i-Akaun Ahli di www.kwsp.gov.my.\n• Pergi ke menu "e-Penyata" / "Penyata Akaun".\n• Pilih tahun penyata terkini (Akaun 1 & 2 atau caruman sukarela i-Saraan).\n• Klik "Muat Turun / Cetak PDF" untuk menyimpan salinan rasmi.\n\n2. Melalui Aplikasi KWSP i-Akaun:\n• Buka Aplikasi i-Akaun di telefon anda.\n• Pergi ke bahagian "Penyata" dan muat turun dokumen PDF.\n\nMuat naik penyata ini ke Loan - La untuk mengesahkan rekod caruman dan meningkatkan skor kredit anda!`
          : `How to Download EPF / KWSP Statement (PDF):\n\n1. Via KWSP i-Akaun Web Portal (kwsp.gov.my):\n• Log in to Member i-Akaun at www.kwsp.gov.my.\n• Navigate to "e-Statement" or "My Account Statement".\n• Select your statement year (Account 1 & 2 or i-Saraan voluntary contributions).\n• Click "Download / Print as PDF" to save the official document.\n\n2. Via KWSP i-Akaun Mobile App:\n• Open the i-Akaun App on your smartphone.\n• Go to "Statements" and export/save the PDF.\n\nUpload this to Loan - La to verify alternative retirement savings and boost your credit scoring!`;
      } else if (isGrab) {
        reply = isMalay
          ? `Cara Dapatkan Penyata / Slip Pendapatan Grab Driver:\n\n1. Melalui Aplikasi Grab Driver:\n• Buka Aplikasi Grab Driver → Pergi ke menu "Akaun" / "Dompet".\n• Pilih "Penyata Mingguan" / "Sejarah Pendapatan".\n• Eksport atau ambil tangkapan skrin (screenshot) PDF pendapatan 3 bulan terkini.\n\n2. Melalui Portal Pemandu Grab (driver.grab.com):\n• Log masuk ke portal pemandu melalui pelayar web.\n• Pergi ke "Penyata Cukai & Pendapatan" → Muat turun laporan bulanan rasmi (PDF).`
          : `How to Download Grab Driver Income Statement / Gig Slip:\n\n1. Via Grab Driver App:\n• Open Grab Driver App → Go to "Account" / "Wallet".\n• Select "Weekly Statements" or "Earnings History".\n• Export or take clear screenshots of your last 3-6 months' earnings.\n\n2. Via Grab Driver Portal (driver.grab.com):\n• Log in to driver.grab.com on your browser.\n• Navigate to "Tax & Statements" → Download the official monthly earnings PDF summary.`;
      } else if (isBankIslam) {
        reply = isMalay
          ? `Cara Muat Turun Penyata Bank Islam (PDF):\n\n1. Melalui Perbankan Internet Bank Islam (bankislam.biz):\n• Log masuk ke bankislam.biz.\n• Pergi ke menu "My Accounts" → Pilih "E-Statement" → "Download E-Statement".\n• Pilih akaun Simpanan/Semasa dan bulan penyata terkini (3-6 bulan).\n• Klik "Download" untuk menyimpan fail PDF rasmi.\n\n2. Melalui Aplikasi GO by Bank Islam:\n• Buka Aplikasi GO → Tekan pada kad akaun anda.\n• Pilih "Statement" / "Transaction History" dan muat turun salinan PDF rasmi.`
          : `How to Download Bank Islam Statements (PDF):\n\n1. Via Bank Islam Internet Banking (bankislam.biz):\n• Log in to bankislam.biz.\n• Go to "My Accounts" → Select "E-Statement" → "Download E-Statement".\n• Choose your Savings/Current Account and the statement month (last 3-6 months).\n• Click "Download" to save the official PDF.\n\n2. Via GO by Bank Islam App:\n• Open GO by Bank Islam App → Tap your account card.\n• Select "Statement" / "Transaction History" and download the PDF for your required cycle.`;
      } else if (isMaybank) {
        reply = isMalay
          ? `Cara Muat Turun Penyata Maybank (PDF):\n\n1. Melalui Maybank2u Web:\n• Log masuk ke maybank2u.com.my di pelayar web.\n• Klik pada akaun Simpanan/Semasa anda.\n• Pilih "View Statements" / "e-Statement".\n• Pilih 3 hingga 6 bulan terkini dan klik "Download PDF".\n\n2. Melalui Aplikasi MAE:\n• Buka Aplikasi MAE → Pergi ke "Accounts".\n• Pilih Akaun Simpanan → Tekan ikon tiga titik (...) di bucu atas kanan.\n• Pilih "View Statement" → Pilih bulan yang diperlukan dan simpan/kongsi PDF ke peranti anda.`
          : `How to Download Maybank Statements (PDF):\n\n1. Via Maybank2u Web:\n• Log in to maybank2u.com.my on your browser.\n• Click on your Savings/Current Account.\n• Select "View Statements" or "e-Statement".\n• Select the last 3 to 6 months and click "Download PDF".\n\n2. Via MAE App:\n• Open MAE App → Go to "Accounts".\n• Select your Savings Account → Tap the three dots (...) at the top right.\n• Select "View Statement" → Choose the required months and Save/Share the PDF to your device.`;
      } else if (isCimb) {
        reply = isMalay
          ? `Cara Muat Turun Penyata CIMB (PDF):\n• Log masuk ke CIMB Clicks (cimbclicks.com.my).\n• Pergi ke "My Accounts" → Pilih "e-Statement".\n• Pilih akaun dan tempoh 3-6 bulan terkini.\n• Klik "Download" untuk menyimpan fail PDF rasmi.`
          : `How to Download CIMB Statements (PDF):\n• Log in to CIMB Clicks (cimbclicks.com.my).\n• Navigate to "My Accounts" → Select "e-Statement".\n• Select your account and the last 3-6 months.\n• Click "Download" to save the official PDF.`;
      } else if (isPublic) {
        reply = isMalay
          ? `Cara Muat Turun Penyata Public Bank (PDF):\n• Log masuk ke PBe Online Banking (pbebank.com).\n• Pergi ke "Account" → Pilih "Statement".\n• Pilih akaun dan tarikh penyata terkini.\n• Klik "Print/Save as PDF" untuk memuat turun.`
          : `How to Download Public Bank Statements (PDF):\n• Log in to PBe Online Banking (pbebank.com).\n• Go to "Account" → Select "Statement".\n• Choose your account and the required statement cycle.\n• Click "Save as PDF" to download.`;
      } else if (isRhb) {
        reply = isMalay
          ? `Cara Muat Turun Penyata RHB (PDF):\n• Log masuk ke RHB Online Banking.\n• Pergi ke "My Accounts" → Pilih "e-Statement".\n• Pilih bulan penyata dan muat turun fail PDF.`
          : `How to Download RHB Statements (PDF):\n• Log in to RHB Online Banking.\n• Go to "My Accounts" → Select "e-Statement".\n• Choose the statement months and download the official PDF.`;
      } else if (isHlb) {
        reply = isMalay
          ? `Cara Muat Turun Penyata Hong Leong Bank (PDF):\n• Log masuk ke HLB Connect.\n• Pergi ke "Statement Management" di menu akaun.\n• Pilih tempoh 3-6 bulan dan muat turun salinan PDF.`
          : `How to Download Hong Leong Bank Statements (PDF):\n• Log in to HLB Connect.\n• Navigate to "Statement Management" under account services.\n• Select the last 3-6 months and download the PDF copy.`;
      } else if (isAmbank) {
        reply = isMalay
          ? `Cara Muat Turun Penyata AmBank (PDF):\n• Log masuk ke AmOnline (ambank.amonline.com.my).\n• Pilih akaun anda → Tekan "View Statement" / "e-Statement".\n• Pilih bulan yang dikehendaki dan muat turun PDF.`
          : `How to Download AmBank Statements (PDF):\n• Log in to AmOnline (ambank.amonline.com.my).\n• Select your account → Click "View Statement" / "e-Statement".\n• Choose the required statement month and download PDF.`;
      } else if (isBsn) {
        reply = isMalay
          ? `Cara Muat Turun Penyata BSN (PDF):\n• Log masuk ke portal myBSN.\n• Pergi ke "Account Overview" → Pilih "e-Statement".\n• Muat turun penyata bulanan dalam format PDF.`
          : `How to Download BSN Statements (PDF):\n• Log in to myBSN portal.\n• Go to "Account Overview" → Select "e-Statement".\n• Download your monthly statement in PDF format.`;
      } else if (isAffin) {
        reply = isMalay
          ? `Cara Muat Turun Penyata Affin Bank (PDF):\n• Log masuk ke AffinAlways.\n• Pergi ke "My Accounts" → "Statement" → Muat turun fail PDF.`
          : `How to Download Affin Bank Statements (PDF):\n• Log in to AffinAlways.\n• Go to "My Accounts" → "Statement" → Download PDF file.`;
      } else if (isAlliance) {
        reply = isMalay
          ? `Cara Muat Turun Penyata Alliance Bank (PDF):\n• Log masuk ke allianceonline.\n• Pergi ke "Account Summary" → Pilih "e-Statement" → Muat turun fail PDF.`
          : `How to Download Alliance Bank Statements (PDF):\n• Log in to allianceonline.\n• Go to "Account Summary" → Select "e-Statement" → Download PDF file.`;
      }

      if (reply) {
        return NextResponse.json({
          success: true,
          reply,
          suggestions: isMalay 
            ? ["Muat Naik Penyata", "Kalkulator Ansuran", "Direktori Bank"]
            : ["Upload Statement", "Loan Calculator", "Bank Directory"]
        });
      }
    }

    // 3. Download Credit Passport Report (PDF Auto-Trigger)
    const isDownloadReportIntent = (
      lastMsgLower.includes('download') || 
      lastMsgLower.includes('muat turun') || 
      lastMsgLower.includes('save pdf') || 
      lastMsgLower.includes('get pdf') ||
      lastMsgLower.includes('export') ||
      lastMsgLower.includes('cetak')
    ) && (
      lastMsgLower.includes('report') || 
      lastMsgLower.includes('laporan') || 
      lastMsgLower.includes('passport') || 
      lastMsgLower.includes('pasport') || 
      lastMsgLower.includes('pdf') ||
      lastMsgLower.includes('certificate') ||
      lastMsgLower.includes('sijil')
    );

    if (isDownloadReportIntent) {
      if (!isUserLoggedIn) {
        const reply = isMalay
          ? "Anda sedang melayari sebagai Tetamu. Pasport Kredit Rasmi mengandungi maklumat kewangan peribadi yang dilindungi. Sila log masuk atau lengkapkan penilaian kredit anda untuk memuat turun laporan PDF."
          : "You are currently browsing as a Guest. Official Credit Passports contain protected personal financial data. Please log in or complete your credit assessment to download your PDF report.";

        return NextResponse.json({
          success: true,
          reply,
          suggestions: isMalay 
            ? ["Mula Penilaian", "Direktori Bank", "Kalkulator Ansuran"]
            : ["Start Assessment", "Bank Directory", "Loan Calculator"]
        });
      }

      const name = dynamicName;
      const score = dynamicScore;
      const grade = dynamicGrade;
      const income = `RM ${dynamicIncome.toLocaleString()}`;

      const reply = isMalay
        ? `Menjana dan memuat turun PDF Pasport Kredit Rasmi anda sekarang (${name} - Skor ${score}/1000, Gred ${grade}, Pendapatan Disahkan ${income}/bulan).`
        : `Generating and downloading your official Certified Credit Passport PDF now (${name} - Score ${score}/1000, Grade ${grade}, Verified Inflow ${income}/mo).`;

      return NextResponse.json({
        success: true,
        reply,
        action: { type: 'DOWNLOAD_REPORT' },
        suggestions: isMalay 
          ? ["Kalkulator Ansuran", "Direktori Bank", "Tetapan Profil"]
          : ["Loan Calculator", "Bank Directory", "Profile Settings"]
      });
    }

    // 4. Bank Details & Licensed Directory Intent (Matched Lenders)
    const isBankDetailsIntent = (
      lastMsgLower.includes('bank detail') ||
      lastMsgLower.includes('bank details') ||
      lastMsgLower.includes('see the bank') ||
      lastMsgLower.includes('see bank') ||
      lastMsgLower.includes('show bank') ||
      lastMsgLower.includes('view bank') ||
      lastMsgLower.includes('bank info') ||
      lastMsgLower.includes('bank directory') ||
      lastMsgLower.includes('directory') ||
      lastMsgLower.includes('lender list') ||
      lastMsgLower.includes('lenders') ||
      lastMsgLower.includes('matched bank') ||
      lastMsgLower.includes('which bank') ||
      lastMsgLower.includes('what bank') ||
      lastMsgLower.includes('available bank') ||
      lastMsgLower.includes('licensed bank') ||
      lastMsgLower.includes('licensed lender') ||
      lastMsgLower.includes('senarai bank') ||
      lastMsgLower.includes('maklumat bank') ||
      lastMsgLower.includes('tengok bank') ||
      lastMsgLower.includes('lihat bank') ||
      lastMsgLower.includes('direktori bank') ||
      lastMsgLower.includes('pemberi pinjaman') ||
      lastMsgLower.includes('padanan bank') ||
      (lastMsgLower.includes('bank') && (lastMsgLower.includes('list') || lastMsgLower.includes('detail') || lastMsgLower.includes('info') || lastMsgLower.includes('available') || lastMsgLower.includes('show') || lastMsgLower.includes('see') || lastMsgLower.includes('options')))
    );

    if (isBankDetailsIntent) {
      const reply = isMalay
        ? `🏛️ Maklumat & Direktori Bank Berlesen di CreditFlow AI:\n\n1. Bank Digital Berlesen (Pantas & Mesra Gig):\n• GXBank: Kadar faedah 4.50% - 6.50% p.a. (Had sehingga RM 50,000, kelulusan segera)\n• Boost Bank / Boost Credit: 4.99% - 7.50% p.a. (Had sehingga RM 100,000)\n• AEON Credit Service: 5.50% - 8.25% p.a. (Penerimaan tinggi untuk pekerja gig & PKS)\n• Touch 'n Go GOpinjam / CIMB: 6.00% - 9.50% p.a. (Pengeluaran eWallet sehingga RM 10,000)\n\n2. Bank Komersial & Institusi Kewangan Rakan Kongsi:\n• Maybank (Personal Financing-i, dari 4.80% p.a.)\n• CIMB Bank (Cash Plus Financing, dari 5.20% p.a.)\n• RHB Bank, Public Bank, AmBank, Alliance Bank & BSN\n\nMembuka Direktori Bank untuk anda semak syarat dan padanan bank sekarang.`
        : `🏛️ Licensed Banks & Digital Lenders on CreditFlow AI:\n\n1. Instant Digital Banks (Fast & Gig-Friendly):\n• GXBank: 4.50% - 6.50% p.a. (Financing up to RM 50,000, instant digital payout)\n• Boost Bank / Boost Credit: 4.99% - 7.50% p.a. (Up to RM 100,000)\n• AEON Credit Service: 5.50% - 8.25% p.a. (Top acceptance for gig workers & MSMEs)\n• Touch 'n Go GOpinjam / CIMB: 6.00% - 9.50% p.a. (Fast eWallet disbursement up to RM 10,000)\n\n2. Commercial & SME Partner Banks:\n• Maybank (Personal Financing-i, from 4.80% p.a.)\n• CIMB Bank (Cash Plus Financing, from 5.20% p.a.)\n• RHB Bank, Public Bank, AmBank, Alliance Bank & BSN\n\nOpening the Bank Directory for you to explore all options and eligibility.`;

      return NextResponse.json({
        success: true,
        reply,
        action: { type: 'NAVIGATE_DIRECTORY' },
        suggestions: isMalay 
          ? ["Kalkulator Ansuran", "Keperluan Pinjaman", "Muat Naik Penyata"]
          : ["Loan Calculator", "Set Loan Purpose", "Upload Statements"]
      });
    }

    // 4B. Pricing, Fees & Business Model Intent
    const isPricingIntent = (
      lastMsgLower.includes('price') ||
      lastMsgLower.includes('pricing') ||
      lastMsgLower.includes('cost') ||
      lastMsgLower.includes('fee') ||
      lastMsgLower.includes('fees') ||
      lastMsgLower.includes('charge') ||
      lastMsgLower.includes('how much') ||
      lastMsgLower.includes('harga') ||
      lastMsgLower.includes('yuran') ||
      lastMsgLower.includes('kos') ||
      lastMsgLower.includes('bayaran') ||
      lastMsgLower.includes('pelan') ||
      lastMsgLower.includes('plan') ||
      lastMsgLower.includes('business model') ||
      lastMsgLower.includes('model perniagaan')
    );

    if (isPricingIntent) {
      const reply = isMalay
        ? `💎 Model Harga & Pelan Pasport Kredit Loan - La:\n\n1. 🆓 Pratonton Percuma (Free Tier):\n• Percuma untuk muat naik dokumen pertama, semakan skor awal & senarai padanan bank.\n\n2. 📄 Pas 1 Laporan Rasmi (RM 9.90 - Sekali Bayar):\n• Penyata penuh 12-bulan disatukan\n• Sijil Pasport Kredit PDF rasmi dengan Kod Pengesahan QR\n• Penghantaran permohonan 1-klik ke 11 bank berlesen\n\n3. ⚡ Pas Pro 1 Bulan (RM 19.90 / bulan - 30 Hari Akses):\n• Penilaian tanpa had selama 30 hari\n• Penjejak permohonan masa nyata dengan penyegerakan status bank\n• Laluan pantas pengunderaitan bank keutamaan\n\nSemua transaksi disokong oleh DuitNow QR, FPX Online Banking, TNG eWallet, GrabPay, dan Kad Kredit/Debit.`
        : `💎 Loan - La Pricing & Business Model Plans:\n\n1. 🆓 Free Preview Tier:\n• Free initial Document 1 analysis, preliminary score dial, and matched lenders preview.\n\n2. 📄 Single Report Pass (RM 9.90 - One-Time):\n• Full multi-month consolidated cashflow & DSR\n• Official Certified Credit Passport PDF with QR Verification\n• 1-Click Direct Application Submissions to 11 matched banks\n\n3. ⚡ Pro Monthly Pass (RM 19.90 / month - 30-Day Access):\n• Unlimited statement re-assessments for 30 days\n• Live Application Tracker with real-time bank status sync\n• Priority bank underwriting routing\n\nSupported payment methods include DuitNow QR, FPX Online Banking (Maybank2u, CIMB, etc.), TNG eWallet, GrabPay, and Credit/Debit Cards.`;

      return NextResponse.json({
        success: true,
        reply,
        suggestions: isMalay 
          ? ["Buka Pasport (RM 9.90)", "Direktori Bank", "Kalkulator Pinjaman"]
          : ["Unlock Passport (RM 9.90)", "Bank Directory", "Loan Calculator"]
      });
    }

    // 5. Detailed Report Explanation & Underwriting Insights (Dynamic JSON sourced)
    if (
      lastMsgLower.includes('report') || 
      lastMsgLower.includes('laporan') || 
      lastMsgLower.includes('score') || 
      lastMsgLower.includes('skor') || 
      lastMsgLower.includes('explain') || 
      lastMsgLower.includes('terangkan') || 
      lastMsgLower.includes('what that does it mean') ||
      lastMsgLower.includes('what does it mean') ||
      lastMsgLower.includes('maksud laporan') ||
      lastMsgLower.includes('terangkan laporan')
    ) {
      if (!isUserLoggedIn) {
        const reply = isMalay
          ? "Anda sedang melayari sebagai Tetamu. Untuk melindungi privasi anda, data Skor Kredit, Gred, DSR, dan had pinjaman peribadi hanya dipaparkan selepas anda log masuk atau melengkapkan penilaian kredit penyata bank."
          : "You are currently browsing as a Guest. To protect your privacy, personalized Credit Score, Grade, DSR, and safe borrowing capacity are only available after you log in or complete a bank statement assessment.";

        return NextResponse.json({
          success: true,
          reply,
          action: { type: 'NAVIGATE_LOAN_NEED' },
          suggestions: isMalay 
            ? ["Mula Penilaian", "Direktori Bank", "Kalkulator Ansuran"]
            : ["Start Assessment", "Bank Directory", "Loan Calculator"]
        });
      }

      const name = dynamicName;
      const score = dynamicScore;
      const grade = dynamicGrade;
      const income = `RM ${dynamicIncome.toLocaleString()}`;
      const platform = dynamicPlatform;
      const dsr = `${dynamicDsr.toFixed(1)}%`;
      const maxLoan = `RM ${dynamicMaxLoan.toLocaleString()}`;
      const maxMonthly = `RM ${dynamicMaxMonthly.toLocaleString()}/mo`;
      const runway = `${dynamicRunway.toFixed(1)} bulan`;
      const runwayEn = `${dynamicRunway.toFixed(1)} Months`;

      const reply = isMalay
        ? `Penjelasan Terperinci Pasport Kredit (${name}):\n\n1. Skor Kredit (${score}/1000 - Gred ${grade}): Menunjukkan profil peminjam utama berisiko rendah dengan rekod aliran tunai yang stabil.\n2. Aliran Pendapatan Disahkan (${income}/bulan): Dijana daripada aktiviti ${platform}.\n3. Nisbah Khidmat Hutang (DSR ${dsr}): Anda tidak mempunyai komitmen hutang sedia ada, memberikan kapasiti pembiayaan maksimum.\n4. Had Pinjaman Selamat: Anda mampu meminjam sehingga ${maxLoan} dengan bayaran ansuran selamat maksima ${maxMonthly} (di bawah had 35% BNM).\n5. Simpanan Kecemasan: Rezab tunai ${runway} melindungi aliran tunai anda daripada sebarang gangguan pendapatan.\n6. Padanan Bank: 92%+ kebarangkalian kelulusan pantas dengan GXBank, Boost Bank, dan AEON Credit.`
        : `Detailed Credit Passport Breakdown (${name}):\n\n1. Credit Score (${score}/1000 - Grade ${grade}): Prime borrower status with very low default risk, supported by verified banking inflow.\n2. Monthly Inflow (${income}/month): Assessed directly from your ${platform} earnings.\n3. Debt Affordability (Current DSR ${dsr}): Zero active debt commitments, giving you maximum financing headroom under Bank Negara Malaysia's 35% cap.\n4. Safe Borrowing Capacity: Max safe loan limit of ${maxLoan} (without financial strain) with an optimal installment cap of ${maxMonthly}.\n5. Emergency Runway: ${runwayEn} of liquid buffer reserves protecting your cashflow.\n6. Lender Pre-Match: 92%+ approval odds with GXBank, Boost Bank, and AEON Credit.`;

      return NextResponse.json({
        success: true,
        reply,
        action: { type: 'NAVIGATE_REPORT' },
        suggestions: isMalay 
          ? ["Kalkulator Ansuran", "Direktori Bank", "Tetapan Profil"]
          : ["Loan Calculator", "Bank Directory", "Profile Settings"]
      });
    }

    // 4. Application Tracker & Status Check
    if (
      (lastMsgLower.includes('check') && (lastMsgLower.includes('application') || lastMsgLower.includes('status') || lastMsgLower.includes('progress'))) ||
      lastMsgLower.includes('track') ||
      lastMsgLower.includes('my application') ||
      lastMsgLower.includes('latest application') ||
      lastMsgLower.includes('application status') ||
      lastMsgLower.includes('status permohonan') ||
      lastMsgLower.includes('semak permohonan') ||
      lastMsgLower.includes('semak status') ||
      lastMsgLower.includes('jejak')
    ) {
      const reply = isMalay
        ? "Membuka Penjejak Permohonan anda sekarang."
        : "Opening your Application Tracker now.";
      return NextResponse.json({
        success: true,
        reply,
        action: { type: 'NAVIGATE_TRACKER' },
        suggestions: isMalay ? ["Direktori Bank", "Keperluan Pinjaman"] : ["Bank Directory", "Set Loan Purpose"]
      });
    }

    // 5. What is this App / Capabilities & Purpose Explanation
    if (
      lastMsgLower.includes('this app is for what') ||
      lastMsgLower.includes('what is this app') ||
      lastMsgLower.includes('what can you do') ||
      lastMsgLower.includes('what this app do') ||
      lastMsgLower.includes('what does this app') ||
      lastMsgLower.includes('app for what') ||
      lastMsgLower.includes('tell me about this app') ||
      lastMsgLower.includes('explain this app') ||
      lastMsgLower.includes('app ini untuk apa') ||
      lastMsgLower.includes('apa fungsi app ini') ||
      lastMsgLower.includes('apa kegunaan') ||
      lastMsgLower.includes('tentang app ini')
    ) {
      const reply = isMalay
        ? "Loan - La ialah platform penajajaminan kredit AI untuk pekerja gig, pekerja bebas dan PKS. Kami menganalisis aliran tunai penyata bank untuk menjana Pasport Kredit, memadankan bank digital berlesen (GXBank, Boost Bank, AEON Credit, BSN), mengira ansuran pinjaman, dan menjejak permohonan secara langsung."
        : "Loan - La is an AI alternative credit underwriting platform for gig workers, freelancers, and MSMEs. We analyze bank cashflow statements to generate a Certified Credit Passport, match you with licensed digital lenders (GXBank, Boost Bank, AEON Credit, BSN), calculate repayments, and track applications in real time.";

      return NextResponse.json({
        success: true,
        reply,
        suggestions: isMalay 
          ? ["Mula Permohonan", "Kalkulator Ansuran", "Direktori Bank"] 
          : ["Start Application", "Loan Calculator", "Bank Directory"]
      });
    }

    // 6. Start New Loan Application / Assessment Intent
    if (
      lastMsgLower.includes('start a new loan application') ||
      lastMsgLower.includes('start a new loan') ||
      lastMsgLower.includes('start new application') ||
      lastMsgLower.includes('start application') ||
      lastMsgLower.includes('new loan application') ||
      lastMsgLower.includes('new application') ||
      lastMsgLower.includes('apply for a loan') ||
      lastMsgLower.includes('apply loan') ||
      lastMsgLower.includes('start loan') ||
      lastMsgLower.includes('mula permohonan') ||
      lastMsgLower.includes('mohon pinjaman') ||
      lastMsgLower.includes('buat pinjaman') ||
      lastMsgLower.includes('permohonan baru')
    ) {
      const reply = isMalay
        ? "Membuka Langkah 1: Penetapan Keperluan & Tujuan Pinjaman."
        : "Opening Step 1: Set Your Loan Need & Purpose.";

      return NextResponse.json({
        success: true,
        reply,
        action: { type: 'NAVIGATE_LOAN_NEED' },
        suggestions: isMalay ? ["Keperluan Pinjaman", "Kalkulator"] : ["Loan Purpose Setup", "Calculator"]
      });
    }

    // 7. Loan Calculation & Setup (Direct Proactive Execution)
    const parsedAmount = parseSpokenAmount(lastMsgLower);
    const parsedTenure = parseSpokenTenure(lastMsgLower);
    const parsedRate = parseSpokenRate(lastMsgLower);

    const hasCalcIntent = lastMsgLower.includes('calc') || 
                          lastMsgLower.includes('kira') || 
                          lastMsgLower.includes('calculator') || 
                          lastMsgLower.includes('kalkulator') || 
                          lastMsgLower.includes('set') || 
                          lastMsgLower.includes('tetap') || 
                          lastMsgLower.includes('monthly') || 
                          lastMsgLower.includes('ansuran') || 
                          lastMsgLower.includes('installment') || 
                          lastMsgLower.includes('rate') || 
                          lastMsgLower.includes('kadar') || 
                          lastMsgLower.includes('interest') || 
                          lastMsgLower.includes('faedah') || 
                          lastMsgLower.includes('%') || 
                          lastMsgLower.includes('peratus') || 
                          lastMsgLower.includes('year') || 
                          lastMsgLower.includes('tahun') || 
                          lastMsgLower.includes('apply') || 
                          lastMsgLower.includes('loan') || 
                          lastMsgLower.includes('pinjam') || 
                          lastMsgLower.includes('nak') ||
                          parsedAmount !== undefined ||
                          parsedTenure !== undefined ||
                          parsedRate !== undefined;

    if (hasCalcIntent && (parsedAmount !== undefined || parsedTenure !== undefined || parsedRate !== undefined || lastMsgLower.includes('calc') || lastMsgLower.includes('kalkulator'))) {
      const amt = parsedAmount || userContext.targetLoanAmount || 5000;
      const yrs = parsedTenure || 1;
      const rate = parsedRate || 6.0;

      const totalMonths = Math.round(yrs * 12);
      const totalInterest = Math.round(amt * (rate / 100) * yrs * 100) / 100;
      const totalRepay = Math.round((amt + totalInterest) * 100) / 100;
      const monthlyInstallment = Math.round((totalRepay / totalMonths) * 100) / 100;

      const reply = isMalay
        ? `📊 **Ringkasan Pengiraan Pembiayaan:**\n\n• **Jumlah Pinjaman:** RM ${amt.toLocaleString()}\n• **Tempoh Bayaran:** ${yrs} Tahun (${totalMonths} Bulan)\n• **Kadar Faedah:** ${rate}% p.a. (Kadar Rata)\n• **Jumlah Faedah:** RM ${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n• **Jumlah Bayaran Balik:** RM ${totalRepay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n• **Anggaran Ansuran Bulanan:** **RM ${monthlyInstallment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / bulan**\n\nMembuka kalkulator interaktif yang dikonfigurasikan dengan maklumat ini untuk anda.`
        : `📊 **Loan Payment Calculation Summary:**\n\n• **Financing Amount:** RM ${amt.toLocaleString()}\n• **Tenure:** ${yrs} ${yrs === 1 ? 'Year' : 'Years'} (${totalMonths} Months)\n• **Interest Rate:** ${rate}% flat p.a.\n• **Total Interest:** RM ${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n• **Total Repayment:** RM ${totalRepay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n• **Est. Monthly Installment:** **RM ${monthlyInstallment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month**\n\nOpening the calculator pre-configured with your exact parameters.`;

      return NextResponse.json({
        success: true,
        reply,
        suggestions: isMalay ? ["Direktori Bank", "Mula Permohonan", "Ubah Jumlah"] : ["Bank Directory", "Start Application", "Adjust Amount"],
        action: { 
          type: 'SET_CALCULATOR', 
          payload: { 
            loanAmount: amt, 
            tenureYears: yrs, 
            interestRate: rate 
          } 
        }
      });
    }

    // 8. Settings / Profile Navigation (Explicit commands only)
    if (
      (lastMsgLower.includes('open setting') || lastMsgLower.includes('open profile') || lastMsgLower.includes('buka tetapan') || lastMsgLower.includes('buka profil') || lastMsgLower.includes('go to settings')) &&
      !lastMsgLower.includes('how') && !lastMsgLower.includes('what') && !lastMsgLower.includes('bagaimana')
    ) {
      const reply = isMalay
        ? "Membuka Tetapan Profil anda sekarang."
        : "Opening your Profile Settings now.";

      return NextResponse.json({
        success: true,
        reply,
        action: { type: 'NAVIGATE_SETTINGS' },
        suggestions: isMalay ? ["Keperluan Pinjaman", "Kalkulator"] : ["Loan Need Setup", "Calculator"]
      });
    }

    // 9. Lenders Directory Navigation (Explicit user commands only, NOT questions or comparisons)
    const isExplicitDirectoryCommand = (
      lastMsgLower === 'open directory' ||
      lastMsgLower === 'bank directory' ||
      lastMsgLower === 'direktori bank' ||
      lastMsgLower === 'buka direktori' ||
      lastMsgLower === 'show directory' ||
      lastMsgLower === 'go to directory' ||
      lastMsgLower === 'senarai bank' ||
      lastMsgLower.includes('open bank directory') ||
      lastMsgLower.includes('buka direktori bank') ||
      lastMsgLower.includes('show lender directory')
    ) && !lastMsgLower.includes('compare') &&
       !lastMsgLower.includes('difference') &&
       !lastMsgLower.includes('benefit') &&
       !lastMsgLower.includes('recommend') &&
       !lastMsgLower.includes('suitable') &&
       !lastMsgLower.includes('which') &&
       !lastMsgLower.includes('what') &&
       !lastMsgLower.includes('gx') &&
       !lastMsgLower.includes('boost') &&
       !lastMsgLower.includes('aeon') &&
       !lastMsgLower.includes('beza') &&
       !lastMsgLower.includes('faedah') &&
       !lastMsgLower.includes('kelebihan');

    if (isExplicitDirectoryCommand) {
      const reply = isMalay
        ? "Membuka Direktori Bank Berlesen sekarang."
        : "Opening the Licensed Lenders Directory now.";

      return NextResponse.json({
        success: true,
        reply,
        action: { type: 'NAVIGATE_DIRECTORY' },
        suggestions: isMalay ? ["Direktori Bank", "Keperluan Pinjaman"] : ["Bank Directory", "Set Loan Purpose"]
      });
    }

    // 10. Intelligent Gemini 2.5 Flash Conversational Reasoning (Full Context & Knowledge)
    try {
      const targetLanguageName = isMalay ? 'Bahasa Melayu' : 'English';
      const systemInstruction = `You are the intelligent, highly knowledgeable AI Concierge for Loan - La.
About Loan - La: Malaysia's premier AI alternative credit underwriting and financing intelligence platform built for Gig Workers, Freelancers, and MSMEs.

CRITICAL LANGUAGE REQUIREMENT:
The user interface language is currently set to ${targetLanguageName} (${isMalay ? 'BM' : 'EN'}).
You MUST formulate and write 100% of your answer in ${targetLanguageName}.
DO NOT respond in ${isMalay ? 'English' : 'Bahasa Melayu'}, even if previous messages in the conversation history were in that language.
Always write in ${targetLanguageName}.

Active Applicant Context:
- Authentication Status: ${isUserLoggedIn ? 'Logged In Borrower' : 'Guest (Unauthenticated)'}
${isUserLoggedIn ? `
- Name: ${dynamicName}
- Credit Score: ${dynamicScore} / 1000 (Grade ${dynamicGrade})
- Verified Inflow: RM ${dynamicIncome.toLocaleString()} / month (${dynamicPlatform})
- Debt-Service Ratio (DSR): ${dynamicDsr.toFixed(1)}%
- Safe Borrowing Limit: RM ${dynamicMaxLoan.toLocaleString()}
- Safe Monthly Repayment: RM ${dynamicMaxMonthly.toLocaleString()} / month
- Emergency Runway: ${dynamicRunway.toFixed(1)} months
` : `
- The user is currently browsing as a Guest.
- CRITICAL PRIVACY RULE: DO NOT reveal, invent, or discuss personal credit scores, personal DSR, or private income for unauthenticated guests.
- If the guest asks about their personal credit report or score, politely explain that they must log in or complete a credit assessment first to generate their personalized Credit Passport.
`}

Licensed Digital Banks & Lenders Knowledge Base (Malaysia):
1. GXBank (GX Bank Berhad - Grab + Singtel + Kuok Group consortium):
   - Key Benefits: Instant micro-disbursement directly into GX Account, daily interest payout on savings, 100% paperless digital onboarding, tight integration with Grab Driver app.
   - Ideal For: Grab drivers, e-hailing & food delivery riders, gig workers wanting instant turnaround without payslips.
   - Required Documents to Attach: MyKad + 3-6 months bank statement OR Grab Driver earnings statement / Loan-La Credit Passport.
2. Boost Bank / Boost Credit (Axiata Group & RHB Banking Group):
   - Key Benefits: Backed by RHB infrastructure, higher financing limits for micro-enterprises & online sellers, flexible tenure up to 36-60 months, Boost Stars ecosystem rewards, merchant working capital lines.
   - Ideal For: Shopee/Lazada e-commerce sellers, micro-SMEs, freelancers with higher working capital needs.
   - Required Documents to Attach: MyKad + 3-6 months bank statements + SSM business registration (if registered enterprise) OR e-wallet settlement statements.
3. AEON Credit Service / AEON Bank:
   - Key Benefits: High approval rates for moderate/entry credit scores, physical branch support nationwide, vehicle/motorcycle financing & consumer durable loans.
   - Required Documents: MyKad + 3 months bank statements / EPF statement.
4. BSN (Bank Simpanan Nasional):
   - Key Benefits: Government-subsidized micro-financing schemes with very low interest rates, longer tenures.
   - Drawback: Longer manual processing time compared to instant digital banks.

Pricing & Monetization Model Knowledge:
1. Free Preview Tier: Free initial document analysis, preliminary score dial, and matched lenders preview.
2. Single Report Pass: RM 9.90 (One-time payment) - unlocks full multi-document consolidation, official bank-ready PDF with QR verification, and 1-click bank application submissions.
3. Pro Monthly Pass: RM 19.90 / month (30-day access) - unlimited statement re-assessments, live tracker sync, priority underwriting routing.
Supported Payment Methods: DuitNow QR, FPX Online Banking, TNG eWallet, GrabPay, Visa/Mastercard.

When the user asks for bank comparisons, differences, benefits, required documents, or recommendations:
- Break down the comparison clearly:
  1. GXBank: Pros/Benefits + Required Documents.
  2. Boost Bank / Boost Credit: Pros/Benefits + Required Documents.
  3. Tailored Recommendation: Give a clear, reasoned recommendation based on their active profile (${dynamicPlatform}, RM ${dynamicIncome.toLocaleString()}/mo). E.g., if they drive Grab / do gig delivery, GXBank offers the fastest automated approval with driver earnings; if they do online business/merchant sales, Boost Credit provides higher capital limits.

Actions:
- If user explicitly wants to calculate or change loan parameters (e.g. RM 60,000, 7 years, 5.39%), confirm and append [ACTION:SET_CALCULATOR:{"loanAmount":60000,"tenureYears":7,"interestRate":5.39}].
- If user explicitly asks to open or go to a tool (e.g. "open tracker", "open directory", "open report"), append the corresponding action token: [ACTION:NAVIGATE_DIRECTORY], [ACTION:NAVIGATE_TRACKER], [ACTION:NAVIGATE_REPORT], [ACTION:NAVIGATE_SETTINGS].
- If user asks to download, export, or save the credit passport report / PDF, append [ACTION:DOWNLOAD_REPORT].
- If the user is asking questions, comparing, or seeking advice, DO NOT force an action token; instead, provide the full thorough answer directly.

Guidelines:
- Provide clear, direct, articulate, and truly helpful answers with numbered steps or bullet points.
- DO NOT use markdown heading hashes (like '###' or '##').
- DO NOT output horizontal line dividers (like '---', '___', or '***').
- Use clear section titles ending with a colon (e.g. "GXBank Overview:", "Required Documents:") followed by numbered points (1., 2.) or bullets (•).
- Never output robotic placeholders. Give real instructions and expert financial insights.
- Never mention CreditFlow. Rebrand is Loan - La.
- Respond STRICTLY in ${targetLanguageName}.`;

      // Build conversation history for Gemini
      const contentsHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // Ensure system instruction is passed
      const aiResponse = await callGeminiWithRotation(async (ai: GoogleGenAI) => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contentsHistory,
          config: {
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }
        });
        return response.text;
      });

      if (aiResponse) {
        let cleanReply = aiResponse.trim();
        let extractedAction: any = undefined;

        const actionMatch = cleanReply.match(/\[ACTION:(SET_CALCULATOR|NAVIGATE_TRACKER|NAVIGATE_LOAN_NEED|NAVIGATE_DIRECTORY|NAVIGATE_SETTINGS|NAVIGATE_REPORT|DOWNLOAD_REPORT):?([^\]]*)\]/);
        if (actionMatch) {
          const actionType = actionMatch[1];
          let payload = undefined;
          if (actionMatch[2]) {
            try { payload = JSON.parse(actionMatch[2]); } catch (e) {}
          }
          extractedAction = { type: actionType, payload };
          cleanReply = cleanReply.replace(actionMatch[0], '').trim();
        }

        // Clean out raw markdown heading hashes and divider artifact lines
        cleanReply = cleanReply
          .replace(/^#{1,6}\s*/gm, '')
          .replace(/^[\s•\-\*_]{2,}$/gm, '')
          .replace(/\*\*/g, '')
          .trim();

        return NextResponse.json({
          success: true,
          reply: cleanReply,
          action: extractedAction,
          suggestions: isMalay 
            ? ["Kalkulator Ansuran", "Direktori Bank", "Mula Permohonan"]
            : ["Loan Calculator", "Bank Directory", "Start Application"]
        });
      }
    } catch (e) {
      console.warn("Gemini chat reasoning error:", e);
    }

    // Default Fallback
    let reply = isMalay
      ? "Bagaimanakah saya boleh membantu permohonan pembiayaan anda?"
      : "How may I assist you with your financing today?";

    return NextResponse.json({
      success: true,
      reply,
      suggestions: isMalay ? ["Kalkulator", "Keperluan Pinjaman"] : ["Calculator", "Loan Need Setup"]
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      reply: "How can I assist you today?",
      suggestions: ["Calculator", "Loan Need Setup"]
    }, { status: 200 });
  }
}
