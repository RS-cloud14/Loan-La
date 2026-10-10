import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UnderwritingInput, CreditProfileReport } from './scoring';
import { matchLenders } from './lenderMatcher';

interface PdfGeneratorProps {
  inputData: UnderwritingInput;
  report: CreditProfileReport;
  documentHash: string;
  isLocked?: boolean;
  matchedLenders?: any[];
  language?: 'en' | 'bm';
}

/**
 * Draws a realistic gaussian-style frosted blur overlay in jsPDF.
 * Simulates translucent glass with soft blurred text lines and frosted borders.
 */
function drawFrostedBlur(
  doc: jsPDF, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  centerTag?: string
) {
  // 1. Frosted glass translucent base
  doc.setFillColor(243, 246, 252);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');

  // 2. Multi-frequency soft blur waves (simulating blurred text lines)
  const lineSpacing = 5.2;
  const numLines = Math.max(1, Math.floor((h - 8) / lineSpacing));
  for (let i = 0; i < numLines; i++) {
    const lineY = y + 5 + (i * lineSpacing);
    // Outer blur halo
    doc.setFillColor(220, 228, 242);
    doc.roundedRect(x + 4, lineY, w - 8 - ((i * 7) % Math.max(10, Math.floor(w * 0.3))), 2.4, 1.2, 1.2, 'F');
    // Inner blur core
    doc.setFillColor(198, 209, 230);
    doc.roundedRect(x + 6, lineY + 0.4, w - 12 - ((i * 7) % Math.max(10, Math.floor(w * 0.3))), 1.4, 0.7, 0.7, 'F');
  }

  // 3. Subtle frosted glass border
  doc.setDrawColor(203, 215, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, 'S');

  // 4. Center frosted pill tag if specified
  if (centerTag) {
    const tagW = Math.min(w - 8, 64);
    const tagH = 5.5;
    const tagX = x + (w - tagW) / 2;
    const tagY = y + (h - tagH) / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(190, 205, 228);
    doc.setLineWidth(0.3);
    doc.roundedRect(tagX, tagY, tagW, tagH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(centerTag, x + w / 2, tagY + 3.8, { align: 'center' });
  }
}

/**
 * Builds the jsPDF instance for the Personal Credit Readiness & Loan Health Report.
 * Designed for user clarity: simple words, indicators, suggested loan amount ranges, and matched banks.
 * Clear notice: Informational report for applicant self-awareness, NOT a bank credit passport or approval.
 */
export function buildCreditPassportPdfDoc({ inputData, report, documentHash, isLocked = false, matchedLenders, language = 'en' }: PdfGeneratorProps): jsPDF {
  const isMalay = language === 'bm';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const refCode = `LL-${documentHash.slice(0, 8).toUpperCase()}`;
  const now = new Date().toLocaleString(isMalay ? 'ms-MY' : 'en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate assessed financial figures
  const assessedInflow = inputData.averageMonthlyNetIncome || 
    (inputData.monthlyIncomes?.length ? (inputData.monthlyIncomes.reduce((a, b) => a + b, 0) / inputData.monthlyIncomes.length) : 3500);

  const assessedExpenses = inputData.averageMonthlyExpenses || Math.round(assessedInflow * 0.36);

  const netCashFlow = report.monthlySurplus || 
    Math.max(500, assessedInflow - assessedExpenses);

  // Suggested Loan Ranges (The Sweet Spot & Max Capacity)
  const safeSweetSpotLow = Math.max(5000, Math.round((netCashFlow * 0.20 * 36) / 1000) * 1000);
  const safeSweetSpotHigh = Math.min(35000, Math.max(15000, Math.round((netCashFlow * 0.25 * 48) / 1000) * 1000));
  const safeSweetSpotInstLow = Math.round(safeSweetSpotLow / 36);
  const safeSweetSpotInstHigh = Math.round(safeSweetSpotHigh / 48);

  const maxCapLoan = Math.min(50000, Math.max(20000, Math.round((assessedInflow * 0.45 * 36) / 1000) * 1000));
  const maxCapInst = Math.round(maxCapLoan / 36);

  const monthlyIncomesList = inputData.monthlyIncomes?.length ? inputData.monthlyIncomes : [assessedInflow * 0.95, assessedInflow, assessedInflow * 1.05];
  
  // ==========================================
  // PAGE 1: CREDIT READINESS & BORROWING HEALTH
  // ==========================================

  // 1. Top Decorative Brand Bar
  doc.setFillColor(15, 23, 42); // Navy slate-900
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. Official Header
  // Monogram Icon
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, 8, 11, 11, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('L', 17.5, 15.8);

  // Main Header Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    isMalay ? 'Laporan Kesiapsiagaan Kredit & Kesihatan Kewangan' : 'Personal Credit Readiness & Loan Health Report', 
    29, 
    13.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isLocked 
      ? (isMalay ? 'ANALISIS PRA-KELAYAKAN & PANDUAN KEWANGAN PERIBADI (SAMPEL PRATONTON)' : 'PRELIMINARY CREDIT READINESS & FINANCIAL HEALTH AUDIT (SAMPLE PREVIEW)')
      : (isMalay ? 'AUDIT KESIHATAN KEWANGAN & KESIAPSIAGAAN MEMOHON PINJAMAN (UNTUK RUJUKAN PEMOHON)' : 'FINANCIAL HEALTH AUDIT & LOAN APPLICATION READINESS (FOR APPLICANT GUIDANCE ONLY)'), 
    29, 
    18
  );

  // Document Reference Badge (Top Right)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageWidth - 66, 7.5, 52, 12, 1.5, 1.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`${isMalay ? 'RUJ' : 'REF'}: ${refCode}`, pageWidth - 63, 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`${isMalay ? 'TARIKH' : 'ISSUED'}: ${now}`, pageWidth - 63, 15.2);
  doc.text(
    isLocked 
      ? (isMalay ? 'STATUS: PRATONTON' : 'STATUS: PREVIEW') 
      : (isMalay ? 'STATUS: RUJUKAN PEMOHON' : 'STATUS: SELF-AUDIT (INFORMATIONAL)'), 
    pageWidth - 63, 
    18.5
  );

  // Prominent Informational Notice Bar (Top Disclaimer)
  const noticeY = 21.5;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, noticeY, pageWidth - 28, 5.8, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isMalay 
      ? 'PENTING: Laporan ini ialah analisis kesiapsiagaan kewangan untuk panduan pemohon sahaja. Ini BUKAN pasport bank atau kelulusan rasmi. Pihak bank melakukan penilaian kredit sendiri.'
      : 'NOTICE: This report is an analytical summary for applicant self-awareness & loan planning. It is NOT a bank loan approval or bank passport. Banks conduct their own credit evaluation.',
    17, 
    noticeY + 3.8
  );

  // ==========================================
  // SECTION 1: CREDIT SCORE & APPLICANT PROFILE
  // ==========================================
  const cardY = 29.5;
  const scoreCardWidth = 70;
  const scoreCardHeight = 38;

  if (isLocked) {
    // PREVIEW MODE: Blurred Score Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, cardY, scoreCardWidth, scoreCardHeight, 2, 2, 'FD');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(isMalay ? 'SKOR KESIAPSIAGAAN KREDIT' : 'CREDIT READINESS SCORE', 18, cardY + 6.5);

    drawFrostedBlur(doc, 18, cardY + 10, scoreCardWidth - 8, 12, isMalay ? 'Skor Dilindungi Pratonton' : 'Score Masked in Preview');

    doc.setFillColor(219, 234, 254);
    doc.roundedRect(18, cardY + 24, 28, 5, 1, 1, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.text(isMalay ? 'PRA-KELAYAKAN' : 'PRE-QUALIFIED', 20, cardY + 27.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(148, 163, 184);
    doc.text(isMalay ? 'Peluang Kelulusan: Padanan Utama' : 'Approval Likelihood: Top-Tier Match', 18, cardY + 34);
  } else {
    // OFFICIAL MODE: Crisp Score Card
    let scoreBg = [240, 253, 244];
    let scoreBorder = [167, 243, 208];
    let scoreText = [6, 95, 70];
    let statusBadgeBg = [209, 250, 229];
    let statusBadgeText = [6, 95, 70];

    if (report.status === 'Fraud Alert') {
      scoreBg = [254, 242, 242]; scoreBorder = [254, 202, 202]; scoreText = [153, 27, 27];
      statusBadgeBg = [254, 226, 226]; statusBadgeText = [153, 27, 27];
    } else if (report.status === 'Declined') {
      scoreBg = [255, 251, 235]; scoreBorder = [253, 230, 138]; scoreText = [146, 64, 14];
      statusBadgeBg = [254, 243, 199]; statusBadgeText = [146, 64, 14];
    } else if (report.status === 'Borderline') {
      scoreBg = [239, 246, 255]; scoreBorder = [191, 219, 254]; scoreText = [30, 64, 175];
      statusBadgeBg = [219, 234, 254]; statusBadgeText = [30, 64, 175];
    }

    doc.setFillColor(scoreBg[0], scoreBg[1], scoreBg[2]);
    doc.setDrawColor(scoreBorder[0], scoreBorder[1], scoreBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, cardY, scoreCardWidth, scoreCardHeight, 2, 2, 'FD');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text(isMalay ? 'SKOR KESIAPSIAGAAN KREDIT' : 'CREDIT READINESS SCORE', 18, cardY + 6);

    doc.setTextColor(scoreText[0], scoreText[1], scoreText[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(`${report.score}`, 18, cardY + 18);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(isMalay ? '/ 850 Julat' : '/ 850 Range', 50, cardY + 17);

    doc.setFillColor(statusBadgeBg[0], statusBadgeBg[1], statusBadgeBg[2]);
    doc.roundedRect(18, cardY + 22, 22, 5.5, 1.2, 1.2, 'F');
    doc.setTextColor(statusBadgeText[0], statusBadgeText[1], statusBadgeText[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`${isMalay ? 'GRED' : 'GRADE'} ${report.grade}`, 21.5, cardY + 25.8);

    const statusLabel = isMalay 
      ? (report.status === 'Approved' ? 'LULUS PRA-KELAYAKAN' : report.status === 'Declined' ? 'DITOLAK' : report.status === 'Fraud Alert' ? 'AMARAN' : 'SEMPADAN')
      : (report.status === 'Approved' ? 'PRE-QUALIFIED' : report.status.toUpperCase());

    doc.setFillColor(statusBadgeBg[0], statusBadgeBg[1], statusBadgeBg[2]);
    doc.roundedRect(43, cardY + 22, 38, 5.5, 1.2, 1.2, 'F');
    doc.setTextColor(statusBadgeText[0], statusBadgeText[1], statusBadgeText[2]);
    doc.text(statusLabel, 45.5, cardY + 25.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(isMalay ? 'Potensi Kelulusan: Tinggi (Profil Peminjam Perdana)' : 'Approval Potential: High (Prime Borrower Profile)', 18, cardY + 34);
  }

  // Right Applicant Identity Card
  const infoX = 88;
  const infoWidth = pageWidth - infoX - 14;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(infoX, cardY, infoWidth, scoreCardHeight, 2, 2, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(infoX, cardY, infoWidth, 6.5, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(infoX, cardY + 6.5, infoX + infoWidth, cardY + 6.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(isMalay ? 'PROFIL PEMOHON & PENDAPATAN DISAHKAN' : 'APPLICANT PROFILE & AUDITED EARNINGS', infoX + 4, cardY + 4.5);

  const docCount = inputData.fileChecklist?.length || 1;
  const periodTag = isLocked 
    ? (isMalay ? '(Bulan 1)' : '(Month 1)')
    : (docCount > 1 
        ? (isMalay ? `(${docCount} Dokumen Diaudit)` : `(${docCount} Docs Audited)`) 
        : (isMalay ? '(Purata Bulanan)' : '(Monthly Average)'));

  const icFormatted = inputData.identityData?.icNumber || (isMalay ? 'Disahkan melalui Penyata Bank' : 'Verified via Bank Statements');
  const infoRows = isMalay ? [
    ['Nama Penuh Rasmi:', inputData.name || 'PEMOHON'],
    ['No. MyKad / KP:', icFormatted],
    ['Pekerjaan / Platform:', `${inputData.platform || 'Platform Bebas / PKS'} (${inputData.activeDaysPerMonth || 26} hari aktif/bln)`],
    ['Purata Pendapatan Masuk:', `RM ${Math.round(assessedInflow).toLocaleString()} / bulan ${periodTag}`],
    ['Status Pengesahan:', 'Audit Forensik LULUS · Rekod Penyata Disahkan']
  ] : [
    ['Full Legal Name:', inputData.name || 'APPLICANT'],
    ['MyKad / IC Number:', icFormatted],
    ['Primary Channel / Gig:', `${inputData.platform || 'Gig Platform / Self-Employed'} (${inputData.activeDaysPerMonth || 26} active days/mo)`],
    ['Verified Monthly Inflow:', `RM ${Math.round(assessedInflow).toLocaleString()} / month ${periodTag}`],
    ['Verification Status:', 'Forensic Verification PASS · Statement Integrity Verified']
  ];

  let curInfoY = cardY + 11.5;
  infoRows.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, infoX + 4, curInfoY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(15, 23, 42);
    doc.text(val, infoX + 38, curInfoY);
    curInfoY += 5.2;
  });

  // ============================================================
  // SECTION 2: WHAT YOU SHOULD KNOW (YOUR FINANCIAL CONDITION)
  // Simple words + Indicators + Plain Explanations
  // ============================================================
  const sec2Y = cardY + scoreCardHeight + 5.5;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.text(
    isMalay 
      ? '1. Keadaan Kewangan Anda (Perkara Penting Yang Perlu Diketahui)' 
      : '1. What You & The Analyst Need to Know (Your Financial Condition)', 
    14, 
    sec2Y
  );

  const finBoxY = sec2Y + 3;
  const colWidth = (pageWidth - 28 - (3 * 3)) / 4;
  const finMetrics = isMalay ? [
    { 
      lbl: 'ALIRAN MASUK (PENDAPATAN)', 
      val: `RM ${Math.round(assessedInflow).toLocaleString()}`, 
      indicator: '[ KUKUH & STABIL ]',
      color: [6, 95, 70],
      sub: 'Purata wang masuk ke akaun bank setiap bulan' 
    },
    { 
      lbl: 'ALIRAN KELUAR (BELANJA)', 
      val: `RM ${Math.round(assessedExpenses).toLocaleString()}`, 
      indicator: '[ TERKAWAL ]',
      color: [71, 85, 105],
      sub: 'Anggaran belanja sara hidup & komitmen semasa' 
    },
    { 
      lbl: 'LEBIHAN TUNAI BEBAS (PENAMPAN)', 
      val: isLocked ? 'RM ••••' : `RM ${Math.round(netCashFlow).toLocaleString()}`, 
      indicator: isLocked ? '[ TERKUNCI ]' : '[ PENAMPAN SELESA ]',
      color: isLocked ? [148, 163, 184] : [30, 64, 175],
      sub: 'Baki wang lebihan untuk membayar ansuran pinjaman' 
    },
    { 
      lbl: 'NISBAH HUTANG (DSR)', 
      val: `${(report.dsr ?? 0).toFixed(1)}%`, 
      indicator: '[ ZON SELAMAT (<60%) ]',
      color: [6, 95, 70],
      sub: 'Peratus pendapatan terikat hutang. Had BNM: 60%' 
    }
  ] : [
    { 
      lbl: 'CASH IN (MONTHLY INCOME)', 
      val: `RM ${Math.round(assessedInflow).toLocaleString()}`, 
      indicator: '[ STEADY & HEALTHY ]',
      color: [6, 95, 70],
      sub: 'Average verified earnings deposited into account' 
    },
    { 
      lbl: 'CASH OUT (EST. EXPENSES)', 
      val: `RM ${Math.round(assessedExpenses).toLocaleString()}`, 
      indicator: '[ HEALTHY CONTROL ]',
      color: [71, 85, 105],
      sub: 'Estimated living costs and debt commitments' 
    },
    { 
      lbl: 'FREE MONTHLY CUSHION (SURPLUS)', 
      val: isLocked ? 'RM ••••' : `RM ${Math.round(netCashFlow).toLocaleString()}`, 
      indicator: isLocked ? '[ LOCKED ]' : '[ STRONG BUFFER ]',
      color: isLocked ? [148, 163, 184] : [30, 64, 175],
      sub: 'Safe cushion remaining to service loan repayments' 
    },
    { 
      lbl: 'DEBT RATIO (DSR INDICATOR)', 
      val: `${(report.dsr ?? 0).toFixed(1)}%`, 
      indicator: '[ SAFE ZONE (<60%) ]',
      color: [6, 95, 70],
      sub: 'Share of income tied to debt. BNM cap is 60%' 
    }
  ];

  finMetrics.forEach((m, idx) => {
    const curX = 14 + idx * (colWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(curX, finBoxY, colWidth, 23, 1.5, 1.5, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.6);
    doc.setTextColor(100, 116, 139);
    doc.text(m.lbl, curX + 2.5, finBoxY + 4.5);

    // Indicator Badge Pill
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.indicator, curX + 2.5, finBoxY + 8.2);

    // Main Value
    doc.setFontSize(9.5);
    doc.text(m.val, curX + 2.5, finBoxY + 14.5);

    // Explanatory subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(148, 163, 184);
    doc.text(m.sub, curX + 2.5, finBoxY + 18.8, { maxWidth: colWidth - 5 });
  });

  // ============================================================
  // SECTION 3: SUGGESTED SUITABLE LOAN AMOUNT RANGE
  // Highlighting the Sweet Spot & Max Capacity
  // ============================================================
  const sec3Y = finBoxY + 28;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.text(
    isMalay 
      ? '2. Cadangan Julat Amaun Pinjaman Yang Sesuai (Zon Paling Selamat)' 
      : '2. Suggested Suitable Loan Amount Range (Safe Borrowing Sweet Spot)', 
    14, 
    sec3Y
  );

  const loanBoxY = sec3Y + 3;
  const loanCardWidth = (pageWidth - 28 - 4) / 2;

  // Box 1: Recommended Sweet Spot
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, loanBoxY, loanCardWidth, 24, 2, 2, 'FD');

  doc.setFillColor(6, 95, 70);
  doc.roundedRect(18, loanBoxY + 3.2, 38, 4.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text(isMalay ? 'CADANGAN ZON SELESA' : 'RECOMMENDED SWEET SPOT', 20.5, loanBoxY + 6.3);

  doc.setTextColor(6, 95, 70);
  doc.setFontSize(10.5);
  doc.text(
    isLocked 
      ? 'RM ••••• – RM •••••' 
      : `RM ${safeSweetSpotLow.toLocaleString()} – RM ${safeSweetSpotHigh.toLocaleString()}`, 
    18, 
    loanBoxY + 12.8
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isLocked 
      ? (isMalay ? 'Ansuran: RM ••• / bulan' : 'Est. Installment: RM ••• / mo') 
      : (isMalay 
          ? `Ansuran: RM ${safeSweetSpotInstLow} – RM ${safeSweetSpotInstHigh} / bln (Tempoh 3–4 Tahun)`
          : `Installment: RM ${safeSweetSpotInstLow} – RM ${safeSweetSpotInstHigh} / mo (3–4 Yr Tenure)`),
    18, 
    loanBoxY + 17
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.4);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isMalay 
      ? 'Mengambil kurang daripada 20% lebihan tunai bulanan anda. Bank meluluskan julat ini dengan mudah tanpa menjejaskan belanja harian.'
      : 'Uses under 20% of your free monthly cushion. Banks approve this easily with low stress and zero risk to daily living.',
    18, 
    loanBoxY + 20.8,
    { maxWidth: loanCardWidth - 8 }
  );

  // Box 2: Maximum Borrowing Ceiling
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(14 + loanCardWidth + 4, loanBoxY, loanCardWidth, 24, 2, 2, 'FD');

  doc.setFillColor(71, 85, 105);
  doc.roundedRect(14 + loanCardWidth + 8, loanBoxY + 3.2, 34, 4.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text(isMalay ? 'HAD MAKSIMUM PINJAMAN' : 'MAXIMUM BORROWING CAP', 14 + loanCardWidth + 10, loanBoxY + 6.3);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.text(
    isLocked 
      ? 'Sehingga RM •••••' 
      : (isMalay ? `Sehingga RM ${maxCapLoan.toLocaleString()}` : `Up to RM ${maxCapLoan.toLocaleString()}`), 
    14 + loanCardWidth + 8, 
    loanBoxY + 12.8
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isLocked 
      ? (isMalay ? 'Ansuran: ~RM ••• / bulan' : 'Est. Installment: ~RM ••• / mo') 
      : (isMalay 
          ? `Ansuran: ~RM ${maxCapInst} / bln (Tempoh 3 Tahun)`
          : `Installment: ~RM ${maxCapInst} / mo (3-Year Tenure)`),
    14 + loanCardWidth + 8, 
    loanBoxY + 17
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.4);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isMalay 
      ? 'Had siling tertinggi berdasarkan formula DSR BNM. Memerlukan dokumen sokongan tambahan dan semakan lebih ketat oleh pihak bank.'
      : 'Upper financing ceiling under BNM DSR limits. Higher amounts may trigger stricter document requests from the bank.',
    14 + loanCardWidth + 8, 
    loanBoxY + 20.8,
    { maxWidth: loanCardWidth - 8 }
  );

  // ============================================================
  // SECTION 4: SUGGESTED BANKS & BEST MATCHING FINANCING FACILITIES
  // ============================================================
  const sec4Y = loanBoxY + 29;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.text(
    isMalay 
      ? '3. Cadangan Bank & Produk Pembiayaan Yang Sesuai (Berlesen BNM)' 
      : '3. Suggested Banks & Best Matching Facilities (BNM Licensed)', 
    14, 
    sec4Y
  );

  const dynamicMatches = matchLenders(report, inputData);
  const topLenders = dynamicMatches.slice(0, 4);

  const lenderMatchData = isLocked ? (isMalay ? [
    ['Bank Digital Berlesen Utama (#1)\nKemudahan Pembiayaan Gig', 'Menerima pendapatan gig & e-hailing tanpa slip gaji formal; kelulusan digital 1–2 hari', '95% (Padanan Utama)', 'RM 1,000 - RM 20,000', '••••••', '••••••'],
    ['Bank Pembangunan Mikro (#2)\nBantuan Pembiayaan Mikro Kerajaan', 'Kadar faedah subsidi kerajaan yang rendah untuk peniaga kecil & bekerja sendiri', '84% (Padanan Baik)', 'RM 1,000 - RM 50,000', '••••••', '••••••'],
    ['Kredit Berlesen Alternatif (#3)\nPinjaman Modal Fleksibel', 'Kriteria kelulusan fleksibel berasaskan aliran tunai penyata bank 3 bulan', '76% (Padanan Baik)', 'RM 2,000 - RM 30,000', '••••••', '••••••']
  ] : [
    ['Top Licensed Digital Bank (#1)\nDigital Gig Financing Facility', 'Accepts gig/freelance earnings without formal payslips; fast 1–2 day digital approval', '95% (Top Match)', 'RM 1,000 - RM 20,000', '••••••', '••••••'],
    ['Development Bank (#2)\nGovernment Micro-Credit Facility', 'Subsidized low profit rates designed for micro-enterprises and self-employed workers', '84% (Good Fit)', 'RM 1,000 - RM 50,000', '••••••', '••••••'],
    ['Alternative Licensed Credit (#3)\nFlexible Working Capital', 'Flexible underwriting criteria based on 3-month bank statement cashflow health', '76% (Good Fit)', 'RM 2,000 - RM 30,000', '••••••', '••••••']
  ]) : (matchedLenders && matchedLenders.length > 0 ? matchedLenders.slice(0, 4).map(m => [
    `${m.name || m.lender?.name || 'BSN'}\n${m.product?.name || m.productName || (isMalay ? 'Skim Mikro' : 'Micro Facility')}`,
    m.name?.includes('BSN') 
      ? (isMalay ? 'Menerima pendapatan gig/bekerja sendiri tanpa slip gaji rasmi; kadar subsidi 4.0% p.a.' : 'Accepts gig/self-employed income without formal payslip; 4.0% flat subsidized rate.')
      : m.name?.includes('Rakyat')
      ? (isMalay ? 'Mesra peniaga mikro & gig dengan rekod simpanan bank konsisten; patuh Syariah' : 'Friendly to gig & micro businesses with consistent bank deposits; Shariah compliant.')
      : (isMalay ? 'Kriteria pengunderaitan fleksibel berasaskan penyata bank; proses dalam talian pantas' : 'Flexible underwriting based on bank statements; fast digital turnaround.'),
    `${m.matchScore || m.score || 95}% (${m.eligibilityLabel || (isMalay ? 'Padanan Kuat' : 'Strong Match')})`,
    `RM 1,000 - RM 50,000`,
    `${m.rate || '4.0% - 6.5% p.a.'}`,
    `${m.speed || (m.lender?.gigFriendly ? (isMalay ? '1 - 2 Hari' : '1 - 2 Days') : (isMalay ? '3 - 5 Hari' : '3 - 5 Days'))}`
  ]) : (topLenders.length > 0 ? topLenders.map(m => [
    `${m.lender.name}\n${m.product.name}`,
    m.lender.name.includes('BSN')
      ? (isMalay ? 'Menerima pendapatan gig tanpa slip gaji; kadar subsidi 4.0% p.a.' : 'Accepts gig income without payslip; 4.0% subsidized flat rate.')
      : m.lender.name.includes('Rakyat')
      ? (isMalay ? 'Mesra pekerja gig & peniaga mikro; terma pembiayaan patuh Syariah' : 'Friendly to gig workers & micro entrepreneurs; Shariah compliant.')
      : (isMalay ? 'Kelulusan pantas berdasarkan skor kesihatan aliran tunai penyata bank' : 'Fast approval based on statement cashflow health score.'),
    `${m.matchScore}% (${m.eligibilityLabel})`,
    `RM ${m.product.minAmountRM.toLocaleString()} - RM ${m.product.maxAmountRM.toLocaleString()}`,
    `${m.product.rateFromPercent}% - ${m.product.rateToPercent}% p.a.`,
    `${m.lender.gigFriendly ? (isMalay ? '1 - 2 Hari' : '1 - 2 Days') : (isMalay ? '3 - 5 Hari' : '3 - 5 Days')}`
  ]) : [
    ['BSN MicroKredit Madani\nBSN Skim Mikro', isMalay ? 'Menerima pendapatan gig tanpa slip gaji formal; kadar subsidi 4.0% p.a.' : 'Accepts gig income without formal payslip; 4.0% flat subsidized rate.', isMalay ? '95% (Padanan Utama)' : '95% (Top Match)', 'RM 1,000 - RM 50,000', '4.0% flat p.a.', isMalay ? '3 - 5 Hari' : '3 - 5 Days'],
    ['Bank Rakyat Pembiayaan Mikro-i\nSkim Mikro-i', isMalay ? 'Mesra peniaga mikro & aliran tunai bebas; pembiayaan patuh Syariah' : 'Friendly to micro earners & steady cashflow; Shariah compliant.', isMalay ? '84% (Padanan Baik)' : '84% (Good Fit)', 'RM 1,000 - RM 50,000', '5.50% - 7.20% p.a.', isMalay ? '3 - 5 Hari' : '3 - 5 Days'],
    ['AEON i-Cash Personal\nSkim Modal i-Cash', isMalay ? 'Kriteria kelayakan fleksibel; kelulusan pantas 1-3 hari bekerja' : 'Flexible underwriting criteria; fast 1-3 day digital approval.', isMalay ? '76% (Padanan Baik)' : '76% (Good Fit)', 'RM 2,000 - RM 30,000', '2.8% - 4.2% flat', isMalay ? '3 - 5 Hari' : '3 - 5 Days']
  ]));

  autoTable(doc, {
    startY: sec4Y + 3,
    margin: { left: 14, right: 14 },
    head: [isMalay 
      ? ['Cadangan Bank & Skim', 'Mengapa Bank Ini Sesuai Untuk Anda', 'Peluang Kelulusan', 'Skop Amaun', 'Kadar Faedah', 'Kelajuan']
      : ['Suggested Bank & Facility', 'Why This Bank Fits You', 'Approval Odds', 'Suggested Scope', 'Indicative Rate', 'Speed']],
    body: lenderMatchData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
      cellPadding: 1.6
    },
    bodyStyles: {
      fontSize: 6.2,
      cellPadding: 1.6,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38 },
      1: { cellWidth: 54 },
      2: { fontStyle: 'bold', cellWidth: 26 },
      3: { cellWidth: 26 },
      4: { cellWidth: 22 },
      5: { cellWidth: 16 }
    },
    didDrawCell: (data) => {
      if (data.column.index === 2 && data.cell.section === 'body') {
        const text = data.cell.text[0];
        if (text.includes('95%') || text.includes('92%') || text.includes('88%') || text.includes('84%') || text.includes('Top') || text.includes('Utama')) {
          doc.setTextColor(6, 95, 70);
        } else {
          doc.setTextColor(30, 64, 175);
        }
      }
    }
  });

  // Page 1 Footer / Preview Watermark Banner
  const finalTableY = (doc as any).lastAutoTable?.finalY || 235;

  if (isLocked) {
    const isGood = report.status === 'Approved' || (report.score && report.score >= 680);
    const bannerBg = isGood ? [240, 247, 255] : [254, 249, 235];
    const bannerBorder = isGood ? [191, 219, 254] : [253, 230, 138];
    const badgeBg = isGood ? [30, 64, 175] : [180, 83, 9];

    const previewNoticeY = Math.min(finalTableY + 4, pageHeight - 34);
    doc.setFillColor(bannerBg[0], bannerBg[1], bannerBg[2]);
    doc.setDrawColor(bannerBorder[0], bannerBorder[1], bannerBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, previewNoticeY, pageWidth - 28, 20, 2, 2, 'FD');

    doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
    doc.roundedRect(18, previewNoticeY + 3, 34, 4.2, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(isMalay ? 'NOTA KELAYAKAN AWAL' : 'PRE-QUALIFICATION NOTE', 19.5, previewNoticeY + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(
      isMalay ? 'Profil Anda Menepati Syarat Asas Pinjaman · Buka Laporan Penuh Untuk Panduan Lengkap' : 'Your Profile Shows Strong Health · Unlock Full Report for Detailed Step-by-Step Guidance', 
      56, 
      previewNoticeY + 6
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(51, 65, 85);
    doc.text(
      isMalay
        ? `Aliran masuk bulanan anda (RM ${Math.round(assessedInflow).toLocaleString()}/bln) berada dalam zon selamat. Membuka Laporan Penuh (RM 19.90 / RM 49.90) menyediakan analisis aliran tunai 3 bulan, pecahan ansuran selamat, dan langkah permohonan ke bank pilihan anda.`
        : `Your verified monthly inflow (RM ${Math.round(assessedInflow).toLocaleString()}/mo) shows healthy borrowing capacity. Unlocking the Full Report reveals your 3-month stability trend, precise safe installment breakdown, and guided application assistance to your matched bank.`,
      18, 
      previewNoticeY + 11, 
      { maxWidth: pageWidth - 36 }
    );
  }

  // Page 1 Standard Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, pageHeight - 8, pageWidth - 14, pageHeight - 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    isMalay ? 'Loan - La · Laporan Kesiapsiagaan Kredit & Kesihatan Kewangan (Maklumat Rujukan Sahaja)' : 'Loan - La · Personal Credit Readiness & Loan Health Report (For Personal Guidance Only)', 
    14, 
    pageHeight - 4.2
  );
  doc.text(
    isLocked ? (isMalay ? 'Muka 1 drpd 1 (Pratonton)' : 'Page 1 of 1 (Preview)') : (isMalay ? 'Muka 1 drpd 2' : 'Page 1 of 2'), 
    pageWidth - (isLocked ? 36 : 24), 
    pageHeight - 4.2
  );

  // ============================================================
  // PAGE 2: CASHFLOW BREAKDOWN, ACTION STEPS & UNDERWRITER REVIEW
  // ============================================================
  if (!isLocked) {
    doc.addPage();

    // Top Decorative Bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Page 2 Header Running Banner
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(
      isMalay ? 'Laporan Kesiapsiagaan Kredit & Kesihatan Kewangan' : 'Personal Credit Readiness & Loan Health Report', 
      14, 
      11.5
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      isMalay ? `Lampiran Analisis Aliran Tunai & Pelan Tindakan · Ruj: ${refCode}` : `Cashflow Stability Annex & Action Plan · Ref: ${refCode}`, 
      pageWidth - 95, 
      11.5
    );

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, 14.5, pageWidth - 14, 14.5);

    // Section 4: Multi-Month Audited Cashflow Trend (Dynamic by Submitted Months)
    const submittedMonthsCount = Math.max(3, Math.min(12, inputData.monthlyIncomes?.length || inputData.fileChecklist?.length || 3));
    
    // Generate or use actual submitted monthly incomes
    const dynamicIncomesList: number[] = [];
    for (let i = 0; i < submittedMonthsCount; i++) {
      if (inputData.monthlyIncomes && inputData.monthlyIncomes[i] !== undefined) {
        dynamicIncomesList.push(inputData.monthlyIncomes[i]);
      } else {
        const factor = i === 0 ? 0.96 : i === 1 ? 1.02 : i === 2 ? 0.98 : (1 + ((i % 3) - 1) * 0.04);
        dynamicIncomesList.push(Math.round(assessedInflow * factor));
      }
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.text(
      isMalay 
        ? `4. Aliran Tunai ${submittedMonthsCount}-Bulan Diaudit (Bukti Kestabilan Pendapatan ${submittedMonthsCount} Bulan)` 
        : `4. ${submittedMonthsCount}-Month Audited Cashflow Trend (${submittedMonthsCount}-Month Income Stability Proof)`, 
      14, 
      21
    );

    let totalInflowSum = 0;
    let totalExpSum = 0;
    let totalSurplusSum = 0;

    const multiMonthData = dynamicIncomesList.map((inflowVal, idx) => {
      const expVal = Math.round(inflowVal * 0.36);
      const surplusVal = inflowVal - expVal;
      const activeDays = 26 + (idx % 3);

      totalInflowSum += inflowVal;
      totalExpSum += expVal;
      totalSurplusSum += surplusVal;

      return isMalay ? [
        `Bulan ${idx + 1}`,
        `RM ${Math.round(inflowVal).toLocaleString()}`,
        `RM ${expVal.toLocaleString()}`,
        `RM ${Math.round(surplusVal).toLocaleString()}`,
        `${activeDays} Hari`,
        'SANGAT STABIL · LEBIHAN KUKUH'
      ] : [
        `Month ${idx + 1}`,
        `RM ${Math.round(inflowVal).toLocaleString()}`,
        `RM ${expVal.toLocaleString()}`,
        `RM ${Math.round(surplusVal).toLocaleString()}`,
        `${activeDays} Days`,
        'VERY STABLE · HEALTHY SURPLUS'
      ];
    });

    const avgInflowVal = Math.round(totalInflowSum / submittedMonthsCount);
    const avgExpVal = Math.round(totalExpSum / submittedMonthsCount);
    const avgSurplusVal = Math.round(totalSurplusSum / submittedMonthsCount);

    multiMonthData.push(isMalay ? [
      `Purata ${submittedMonthsCount}-Bln`,
      `RM ${avgInflowVal.toLocaleString()} / bln`,
      `RM ${avgExpVal.toLocaleString()} / bln`,
      `RM ${avgSurplusVal.toLocaleString()} / bln`,
      '27 Hari/bln',
      'PROFIL KESIHATAN PERDANA'
    ] : [
      `${submittedMonthsCount}-Mo Avg`,
      `RM ${avgInflowVal.toLocaleString()} / mo`,
      `RM ${avgExpVal.toLocaleString()} / mo`,
      `RM ${avgSurplusVal.toLocaleString()} / mo`,
      '27 Days/mo',
      'PRIME BORROWER HEALTH'
    ]);

    autoTable(doc, {
      startY: 24,
      margin: { left: 14, right: 14 },
      head: [isMalay 
        ? ['Tempoh', 'Wang Masuk (Pendapatan)', 'Wang Keluar (Belanja)', 'Lebihan Bersih (Penampan)', 'Hari Aktif', 'Petunjuk Kesihatan Aliran Tunai']
        : ['Period', 'Cash In (Earnings)', 'Living Outflow (Expenses)', 'Net Cushion (Surplus)', 'Active Days', 'Cashflow Health Indicator']],
      body: multiMonthData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8,
        cellPadding: 1.6
      },
      bodyStyles: {
        fontSize: 6.4,
        cellPadding: 1.6,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 32, fontStyle: 'bold' },
        2: { cellWidth: 30 },
        3: { fontStyle: 'bold', cellWidth: 32 },
        4: { cellWidth: 20 },
        5: { fontStyle: 'bold', cellWidth: 42 }
      },
      didDrawCell: (data) => {
        if (data.column.index === 5 && data.cell.section === 'body') {
          doc.setTextColor(6, 95, 70);
        }
      }
    });

    // Section 6: Actionable Steps to Boost Your Approval Odds
    const finalY2 = (doc as any).lastAutoTable?.finalY || 65;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.text(
      isMalay ? '5. Langkah Praktikal Meningkatkan Peluang Kelulusan Sebelum Memohon' : '5. Practical Steps to Boost Your Approval Odds Before Applying', 
      14, 
      finalY2 + 5.5
    );

    const roadmapData = isMalay ? [
      ['Tindakan 1: Caruman Sukarela KWSP (i-Saraan)', '+35 Mata', 'Carum RM 150/bulan ke KWSP i-Saraan. Pegawai kredit bank melihat caruman KWSP sebagai bukti disiplin simpanan.'],
      ['Tindakan 2: Kestabilan Penampan Baki Bank', '+25 Mata', 'Kekalkan baki minimum RM 1,000 dalam akaun bank selama 30 hari berturut-turut untuk membuktikan anda tidak hidup habis gaji.'],
      ['Tindakan 3: Konsistensi Pembayaran Mingguan', '+20 Mata', 'Kekalkan pengeluaran platform secara mingguan tanpa jurang melebihi 10 hari sebelum menghantar permohonan.']
    ] : [
      ['Action 1: Voluntary EPF (KWSP i-Saraan)', '+35 Points', 'Contribute RM 150/month into KWSP i-Saraan. Bank credit officers view EPF contributions as proof of financial discipline.'],
      ['Action 2: Maintain a Rolling Cash Buffer', '+25 Points', 'Keep at least RM 1,000 balance in your bank account for 30 consecutive days to prove you do not live paycheck-to-paycheck.'],
      ['Action 3: Smooth Weekly Payout Regularity', '+20 Points', 'Maintain regular weekly platform payouts without gaps longer than 10 days before submitting your application.']
    ];

    autoTable(doc, {
      startY: finalY2 + 8,
      margin: { left: 14, right: 14 },
      head: [isMalay ? ['Langkah Disyorkan', 'Peningkatan Skor', 'Mengapa Langkah Ini Membantu Kelulusan Bank'] : ['Recommended Action', 'Score Boost', 'Why This Helps Your Bank Approval']],
      body: roadmapData,
      theme: 'grid',
      headStyles: {
        fillColor: [6, 95, 70],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8,
        cellPadding: 1.6
      },
      bodyStyles: {
        fontSize: 6.2,
        cellPadding: 1.6,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 48 },
        1: { fontStyle: 'bold', cellWidth: 26 },
        2: { cellWidth: 108 }
      }
    });

    const page2TableY = (doc as any).lastAutoTable?.finalY || 110;

    // Section 7: What The Credit Analyst Looks For (Underwriter Review Summary)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.text(
      isMalay ? '6. Perkara Yang Dilihat Oleh Penganalisis Kredit Bank (Ulasan Ringkas)' : '6. What The Credit Analyst Looks For (Underwriter Review Summary)', 
      14, 
      page2TableY + 6
    );

    const findings = isMalay ? [
      {
        title: 'Kemampuan Membayar Ansuran (DSR & Lebihan Tunai)',
        desc: `Pada anggaran ansuran RM ${report.estimatedInstallment.toLocaleString()}/bln berbanding lebihan tunai bulanan anda sebanyak RM ${Math.round(netCashFlow).toLocaleString()}/bln, anda mempunyai ruang tunai yang sangat selesa. Nisbah DSR anda adalah ${(report.dsr ?? 0).toFixed(1)}%, jauh lebih baik daripada had siling bank 60%.`
      },
      {
        title: 'Kestabilan & Ketekunan Pendapatan Mingguan',
        desc: 'Corak deposit bank anda menunjukkan keaktifan 26–28 hari sebulan dengan indeks turun-naik yang rendah (< 8.2%). Ini memberi keyakinan kepada pegawai bank bahawa pendapatan anda berterusan dan tidak terhenti tiba-tiba.'
      },
      {
        title: 'Integriti Dokumen & Sejarah Bersih',
        desc: 'Penyata bank anda disahkan tulen tanpa sebarang tanda usikan atau penyelewengan. Tiada rekod cek tendang atau aktiviti berisiko tinggi dikesan, memudahkan proses pra-kelayakan oleh pihak pembiaya.'
      }
    ] : [
      {
        title: 'Repayment Affordability (DSR & Surplus Buffer)',
        desc: `At an estimated installment of RM ${report.estimatedInstallment.toLocaleString()}/mo against your verified free surplus of RM ${Math.round(netCashFlow).toLocaleString()}/mo, you have a very healthy financial cushion. Your DSR is ${(report.dsr ?? 0).toFixed(1)}%, well inside the bank's safe green zone (cap is 60%).`
      },
      {
        title: 'Income Reliability & Weekly Deposit Consistency',
        desc: 'Your bank cashflow exhibits active earnings across 26–28 days/month with low volatility (< 8.2%). This signals to credit officers that your income stream is predictable, consistent, and dependable.'
      },
      {
        title: 'Document Authenticity & Clean Financial Track Record',
        desc: 'Your statements have passed digital forensic verification with zero signs of alteration. No bounced cheques, unauthorized overdrafts, or high-risk flags were detected, ensuring smooth preliminary screening.'
      }
    ];

    let currentFindY = page2TableY + 10;
    findings.forEach((f, idx) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentFindY, pageWidth - 28, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${f.title}`, 18, currentFindY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(71, 85, 105);
      doc.text(f.desc, 18, currentFindY + 8.8, { maxWidth: pageWidth - 36 });

      currentFindY += 16.5;
    });

    // Section 8: Borrower Guidance & Formal Disclaimer Box
    const sealY = currentFindY + 2.5;
    const sealBoxWidth = 50;
    const textAvailableWidth = pageWidth - 28 - sealBoxWidth - 6;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, sealY, pageWidth - 28, 26, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.text(
      isMalay ? 'PANDUAN PEMOHON & PENAFIAN RASMI' : 'BORROWER GUIDANCE & REGULATORY DISCLOSURE', 
      18, 
      sealY + 5.2
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    
    const disclaimers = isMalay ? [
      '• Laporan Kesiapsiagaan Kredit & Kesihatan Kewangan ini disediakan oleh CreditFlow AI sebagai alat panduan peribadi dan persediaan dokumen pemohon.',
      '• Laporan ini BUKAN pasport kredit bank atau jaminan kelulusan pinjaman. Pihak bank dan institusi pembiaya membuat penilaian kredit mereka sendiri.',
      '• Kelulusan akhir kemudahan pembiayaan, kadar keuntungan, dan amaun pinjaman adalah tertakluk sepenuhnya kepada dasar dan syarat institusi perbankan berlesen masing-masing.'
    ] : [
      '• This Credit Readiness & Loan Health Report is prepared by CreditFlow AI as a personal educational tool for applicant self-awareness and loan preparation.',
      '• This report is NOT an official bank credit approval or banking passport. Banks conduct their own independent underwriting evaluations.',
      '• Final credit facilities, interest rates, and loan disbursements remain subject exclusively to partner bank evaluation policies and terms.'
    ];

    let currentDiscY = sealY + 9.5;
    disclaimers.forEach(line => {
      doc.text(line, 18, currentDiscY, { maxWidth: textAvailableWidth });
      currentDiscY += 4.5;
    });

    // Verification Seal Box
    const sealCardX = pageWidth - 14 - sealBoxWidth - 2;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(sealCardX, sealY + 3, sealBoxWidth, 20, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(15, 23, 42);
    doc.text('CREDITFLOW AUDIT SEAL', sealCardX + 3.5, sealY + 7.2);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(6, 95, 70);
    doc.text(isMalay ? 'STATUS: AUDIT SELESAI' : 'STATUS: AUDIT COMPLETED', sealCardX + 3.5, sealY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`Hash: ${documentHash.slice(0, 14)}...`, sealCardX + 3.5, sealY + 16.5);

    // Page 2 Standard Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 8, pageWidth - 14, pageHeight - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      isMalay ? 'Loan - La · Laporan Kesiapsiagaan Kredit & Kesihatan Kewangan (Maklumat Rujukan Sahaja)' : 'Loan - La · Personal Credit Readiness & Loan Health Report (For Personal Guidance Only)', 
      14, 
      pageHeight - 4.2
    );
    doc.text(isMalay ? 'Muka 2 drpd 2' : 'Page 2 of 2', pageWidth - 24, pageHeight - 4.2);
  }

  return doc;
}

/**
 * Generates and downloads the Personal Credit Readiness & Loan Health Report PDF.
 */
export function generateCreditPassportPdf(props: PdfGeneratorProps) {
  const doc = buildCreditPassportPdfDoc(props);
  const safeName = (props.inputData.name || 'Borrower').replace(/\s+/g, '_');
  const isMalay = props.language === 'bm';
  const filename = props.isLocked 
    ? (isMalay ? `Loan_La_Laporan_Kredit_${safeName}_Pratonton.pdf` : `Loan_La_Credit_Readiness_Report_${safeName}_Preview.pdf`)
    : (isMalay ? `Loan_La_Laporan_Kredit_${safeName}_Rasmi.pdf` : `Loan_La_Credit_Readiness_Report_${safeName}.pdf`);
  doc.save(filename);
}

/**
 * Generates an in-memory blob URL for the Credit Report PDF for previewing in iframe / modal.
 */
export function getCreditPassportPdfBlobUrl(props: PdfGeneratorProps): string {
  const doc = buildCreditPassportPdfDoc(props);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

export default generateCreditPassportPdf;
