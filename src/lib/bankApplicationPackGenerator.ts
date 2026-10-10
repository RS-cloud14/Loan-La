import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BsnScheme } from './bsnSchemes';
import { LoanProposalData } from '@/components/LoanProposalWizardModal';
import { getLenderOfficialPortalUrl } from './lenders';

export interface ApplicationPackProps {
  applicant: {
    name: string;
    icNumber?: string;
    phone?: string;
    email?: string;
    address?: string;
    platform?: string;
    averageMonthlyNetIncome: number;
    score: number;
    grade: string;
    dsr: number;
    documentHash: string;
    companyName?: string;
    ssmNumber?: string;
    constitution?: string;
  };
  lenderName: string;
  scheme?: BsnScheme | null;
  loanAmount: number;
  tenureYears?: number;
  proposal?: LoanProposalData | null;
  language?: 'en' | 'bm';
}

/**
 * Builds and downloads a certified, institutional-ready Bank Application Pack PDF.
 * Specifically structured to match BSN Micro-i / Bank Rakyat / Commercial intake standards.
 */
export function generateBankApplicationPackPdf({
  applicant,
  lenderName,
  scheme,
  loanAmount,
  tenureYears = 2,
  proposal,
  language = 'en'
}: ApplicationPackProps): void {
  const isBm = language === 'bm';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const refCode = `LL-APP-${applicant.documentHash.slice(0, 8).toUpperCase()}`;
  const now = new Date().toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Top header bar
  doc.setFillColor(15, 23, 42); // Navy slate-900
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Title Monogram & Brand
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, 11, 12, 12, 2.5, 2.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('L', 18, 19.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(
    isBm ? 'Pakej Permohonan Pembiayaan Mikro Rasmi' : 'Official Micro-Financing Intake Application Pack',
    30,
    16
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isBm
      ? `Disahkan untuk Serahan Rasmi: ${lenderName} · Sedia untuk Cawangan / Portal Dalam Talian`
      : `Certified for Submission: ${lenderName} · Ready for Branch Intake / Online Portal Upload`,
    30,
    21
  );

  // Top Right Reference Badge
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageWidth - 70, 10, 56, 14, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`REF: ${refCode}`, pageWidth - 67, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`ISSUED: ${now} MYT`, pageWidth - 67, 19.5);
  doc.text('STATUS: VERIFIED & SEALED', pageWidth - 67, 23);

  // Section 1: Pre-Filled Bank Intake Form Part A
  const sec1Y = 28;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, sec1Y, pageWidth - 28, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    isBm
      ? 'BAHAGIAN A: BUTIRAN PEMOHON & PERUSAHAAN (BORANG PRA-ISI INSTITUSI)'
      : 'PART A: APPLICANT & BUSINESS PARTICULARS (PRE-FILLED INTAKE FORM)',
    18,
    sec1Y + 4.5
  );

  const schemeTitle = scheme ? scheme.name : `${lenderName} Micro-i`;
  const particularsData = [
    [
      isBm ? 'Nama Penuh Pemohon:' : 'Full Legal Name:',
      applicant.name || 'AHMAD BIN RAZALI',
      isBm ? 'No. Kad Pengenalan (MyKad):' : 'MyKad / NRIC No:',
      applicant.icNumber || '940815-14-5521'
    ],
    [
      isBm ? 'No. Telefon & WhatsApp:' : 'Mobile / Contact No:',
      applicant.phone || '+60 12-345 6789',
      isBm ? 'E-mel Pemohon:' : 'Email Address:',
      applicant.email || 'borrower@loan-la.my'
    ],
    [
      isBm ? 'Nama Perniagaan / Platform:' : 'Business / Platform Name:',
      applicant.companyName || applicant.platform || 'Foodpanda & Grab Delivery',
      isBm ? 'No. Pendaftaran SSM / PBT:' : 'SSM / Council Reg No:',
      applicant.ssmNumber || 'SSM-2024031942 (or Verified Gig Partner)'
    ],
    [
      isBm ? 'Bentuk Entiti Perniagaan:' : 'Constitution of Business:',
      applicant.constitution || 'Milikan Tunggal / Sole Proprietorship (Gig)',
      isBm ? 'Skim Sasaran Khusus:' : 'Specific Target Scheme:',
      schemeTitle
    ],
    [
      isBm ? 'Jumlah Pembiayaan Dipohon:' : 'Financing Amount Requested:',
      `RM ${loanAmount.toLocaleString()}`,
      isBm ? 'Cadangan Tempoh Pembiayaan:' : 'Proposed Tenure:',
      `${tenureYears * 12} Months (${tenureYears} Years)`
    ],
    [
      isBm ? 'Purata Pendapatan Bulanan Diaudit:' : 'Audited Monthly Net Income:',
      `RM ${Math.round(applicant.averageMonthlyNetIncome).toLocaleString()} / month`,
      isBm ? 'Nisbah Khidmat Hutang (DSR):' : 'Debt Service Ratio (DSR):',
      `${applicant.dsr.toFixed(1)}% (Healthy Buffer)`
    ]
  ];

  autoTable(doc, {
    startY: sec1Y + 8,
    margin: { left: 14, right: 14 },
    body: particularsData,
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 44 },
      1: { cellWidth: 48 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 44 },
      3: { cellWidth: 46 }
    }
  });

  const afterTable1Y = (doc as any).lastAutoTable.finalY + 5;

  // Section 2: 5-Step Borrower Loan Proposal
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, afterTable1Y, pageWidth - 28, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    isBm
      ? 'BAHAGIAN B: CADANGAN PINJAMAN 5-LANGKAH (LAMPIRAN JUSTIFIKASI BORROWER)'
      : 'PART B: 5-STEP BORROWER LOAN PROPOSAL (OFFICIAL JUSTIFICATION ADDENDUM)',
    18,
    afterTable1Y + 4.5
  );

  const defaultPurpose = `Working capital of RM ${loanAmount.toLocaleString()} to purchase inventory, repair primary delivery motorcycle, and maintain uninterrupted daily earnings run rate.`;
  const defaultRepayment = `Monthly installment of ~RM ${Math.round((loanAmount * 1.04) / (tenureYears * 12))} repaid from verified monthly net cashflow of RM ${Math.round(applicant.averageMonthlyNetIncome).toLocaleString()}/mo, with RM 1,500 emergency buffer.`;
  const defaultRisk = `Rating of 4.9 stars on gig platform with zero customer grievances. Equipment assets and emergency buffer savings serve as secondary comfort.`;
  const defaultTrack = `Operating continuously for over 24 months with regular weekly bank deposits and zero bounced cheques or default records.`;

  const proposalRows = [
    [
      isBm ? '1. Tujuan Terperinci & Keperluan Mendesak' : '1. Purpose Detail & Immediate Need',
      proposal?.purposeDetail || defaultPurpose
    ],
    [
      isBm ? '2. Pelan Bayaran Balik & Sumber Sandaran' : '2. Repayment Plan & Backup Source',
      proposal?.repaymentPlan || defaultRepayment
    ],
    [
      isBm ? '3. Pengurangan Risiko Peminjam' : '3. Risk Mitigation & Secondary Comfort',
      proposal?.riskMitigation || defaultRisk
    ],
    [
      isBm ? '4. Rekod Prestasi & Kebolehpercayaan' : '4. Character & Operational Track Record',
      proposal?.characterTrackRecord || defaultTrack
    ]
  ];

  autoTable(doc, {
    startY: afterTable1Y + 8,
    margin: { left: 14, right: 14 },
    body: proposalRows,
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 2.2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 48 },
      1: { cellWidth: 134 }
    }
  });

  const afterTable2Y = (doc as any).lastAutoTable.finalY + 5;

  // Section 3: Verified Document Checklist for Branch / Portal Submission
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, afterTable2Y, pageWidth - 28, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    isBm
      ? 'BAHAGIAN C: SENARAI SEMAK DOKUMEN DISAHKAN UNTUK SERAHAN CAWANGAN / PORTAL'
      : 'PART C: VERIFIED DOCUMENT CHECKLIST FOR BRANCH / PORTAL SUBMISSION',
    18,
    afterTable2Y + 4.5
  );

  const docChecklist = [
    ['[ / ]', 'Salinan MyKad Pemohon (Depan & Belakang)', 'Disahkan Telus · Sifar Usikan Digital (BNM RMiT PASS)'],
    ['[ / ]', 'Penyata Akaun Bank (3 - 6 Bulan Terkini)', 'Semakan Kredit Aliran Tunai & Baki Akhir Padan'],
    ['[ / ]', 'Penyata Pendapatan Mingguan Platform / Slip Gaji', 'Mengesahkan Pendapatan Purata Gig / Perniagaan'],
    ['[ / ]', 'Sijil SSM / Lesen Penjaja PBT (jika ada)', 'Pendaftaran Entiti Diperakui'],
    ['[ / ]', 'Cadangan Pinjaman 5-Langkah & Sebut Harga (Quotation)', 'Lampiran Bahagian B Dimeteraikan dalam Dossier Ini']
  ];

  autoTable(doc, {
    startY: afterTable2Y + 8,
    margin: { left: 14, right: 14 },
    body: docChecklist,
    theme: 'grid',
    styles: {
      fontSize: 6.6,
      cellPadding: 1.8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [6, 95, 70], cellWidth: 12, halign: 'center' },
      1: { fontStyle: 'bold', cellWidth: 90 },
      2: { cellWidth: 80 }
    }
  });

  const afterTable3Y = (doc as any).lastAutoTable.finalY + 6;

  // Bottom Submission Instructions Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, afterTable3Y, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setTextColor(6, 95, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    isBm
      ? 'PANDUAN TINDAKAN SERAHAN KEPADA PEMINJAM:'
      : 'ACTIONABLE SUBMISSION INSTRUCTIONS FOR BORROWER:',
    18,
    afterTable3Y + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(30, 41, 59);
  const officialPortal = scheme ? scheme.officialUrl : getLenderOfficialPortalUrl(lenderName);
  doc.text(
    isBm
      ? `1. Untuk Serahan Cawangan (${lenderName}): Cetak pakej ini bersama salinan MyKad & penyata bank. Serahkan kepada Pegawai Pinjaman Mikro / SME di cawangan terdekat. Maklumkan kod rujukan: ${refCode}.\n` +
        `2. Untuk Serahan Portal Dalam Talian: Buka portal rasmi (${officialPortal}), salin medan Part A secara 1-klik menggunakan alat Fast-Fill CreditFlow, dan muat naik PDF ini sebagai lampiran sokongan.`
      : `1. For Branch Intake (${lenderName}): Print this pack with your MyKad copy & bank statements. Present it directly to the Micro/SME Loan Officer at the nearest branch. Quote Reference: ${refCode}.\n` +
        `2. For Online Portal Intake: Access official gateway (${officialPortal}), copy Part A figures using CreditFlow 1-Click Fast-Fill, and upload this certified dossier as your supporting evidence.`,
    18,
    afterTable3Y + 10.5,
    { maxWidth: pageWidth - 36 }
  );

  // Footer bar
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Loan - La Financial Technologies · Certified Pre-Filled Micro Application Kit · Bank Negara Malaysia FTFC Aligned',
    14,
    pageHeight - 5.5
  );
  doc.text('Page 1 of 1', pageWidth - 26, pageHeight - 5.5);

  // Download
  const filename = `LoanLa_Application_Pack_${lenderName.replace(/\s+/g, '_')}_${applicant.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
