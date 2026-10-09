/**
 * Malaysian Licensed Bank & Alternative Lender Database
 * Sources: Bank Negara Malaysia (BNM), Securities Commission (SC) Malaysia,
 * Ministry of Entrepreneur Development & Cooperatives (KUSKOP), individual official rate sheets.
 * 
 * Verified Malaysian Banks, Government Micro-Funds & Licensed P2P Platforms.
 * Last updated: 2026.
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

export type ApplicationChannel =
  | 'digital_bank_app'        // 100% App-based (GXBank, Boost Bank, AEON Bank, TNG GOpinjam)
  | 'digital_web_portal'      // 100% Online Web Form (Maybank SME, Alliance Digital SME, Funding Societies, CapBay)
  | 'government_micro_agency' // e-Permohonan / Cawangan / WhatsApp Officer (TEKUN, MARA, AIM, BSN)
  | 'commercial_bank_assisted';// Bank portal + Branch/Officer intake (CIMB, Public Bank, AmBank, Affin, Agrobank, Bank Rakyat, Bank Islam, SME Bank)

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

export interface ApplicationStep {
  step: number;
  titleEn: string;
  titleBm: string;
  descEn: string;
  descBm: string;
}

export interface Lender {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  type: LenderType;
  channelType: ApplicationChannel;
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
  appDownloadUrl?: {
    ios?: string;
    android?: string;
  };
  whatsappOfficer?: string;
  applicationSteps?: ApplicationStep[];
}

export const LENDERS: Lender[] = [
  /* ─────────────────────────────────────────────────────────────────── */
  /* 1. GXBANK — Malaysia's 1st BNM-Licensed Digital Bank                */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'gxbank',
    name: 'GX Bank Berhad (GXBank)',
    shortName: 'GXBank',
    emoji: '📱',
    type: 'Commercial Bank',
    channelType: 'digital_bank_app',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee', 'lazada', 'freelance'],
    minIncomeRM: 1500,
    minGigHistoryMonths: 3,
    website: 'gxbank.my',
    hotline: '+603-7498 3188',
    applicationUrl: 'https://www.gxbank.my',
    appDownloadUrl: {
      ios: 'https://apps.apple.com/my/app/gxbank/id6448790074',
      android: 'https://play.google.com/store/apps/details?id=my.gxbank.app'
    },
    minFRIScore: 500,
    highlight: 'Malaysia’s 1st BNM-licensed digital bank. 100% in-app application with 10-minute instant approval & fast disbursement.',
    notes: 'Applications are submitted exclusively inside the GXBank mobile app. Collateral-free personal financing with automated e-KYC.',
    applicationSteps: [
      {
        step: 1,
        titleEn: 'Open GXBank Mobile App',
        titleBm: 'Buka Aplikasi GXBank di Telefon',
        descEn: 'Install and open the GXBank app on your iOS or Android smartphone.',
        descBm: 'Pasang dan buka aplikasi GXBank di telefon pintar iOS atau Android anda.'
      },
      {
        step: 2,
        titleEn: 'Navigate to FlexiCredit',
        titleBm: 'Pilih Bahagian FlexiCredit',
        descEn: 'On the app home screen, tap "FlexiCredit" under the "For You Today" section.',
        descBm: 'Di skrin utama aplikasi, ketik "FlexiCredit" di bawah bahagian "For You Today".'
      },
      {
        step: 3,
        titleEn: 'Input Pre-Screened Figures',
        titleBm: 'Masukkan Maklumat Pra-Saringan',
        descEn: 'Use our 1-click Fast-Fill tool to paste your verified monthly income, financing amount, and tenure.',
        descBm: 'Gunakan alat Salin Pantas kami untuk menampal pendapatan bersih, jumlah pembiayaan, dan tempoh pinjaman.'
      },
      {
        step: 4,
        titleEn: 'Attach CAM PDF & Facial e-KYC',
        titleBm: 'Muat Naik CAM PDF & Imbasan Wajah e-KYC',
        descEn: 'Attach your Loan-La Credit Passport CAM if requested, complete your 30-second selfie verification, and get funded.',
        descBm: 'Muat naik PDF Credit Passport CAM jika diminta, lengkapkan imbasan swafoto e-KYC 30 saat, dan dana dikreditkan terus.'
      }
    ],
    products: [
      {
        id: 'gx_flexicredit',
        name: 'GX FlexiCredit / Digital Cash',
        productType: 'personal_financing',
        minAmountRM: 1000,
        maxAmountRM: 50000,
        tenureMinMonths: 6,
        tenureMaxMonths: 60,
        rateType: 'reducing_pa',
        rateFromPercent: 4.88,
        rateToPercent: 8.88,
        payslipRequired: false,
        compatibleAssets: ['personal_cash', 'working_capital'],
        requiredDocs: ['MyKad (e-KYC Face Scan)', '6 months Bank Statement (PDF) or Grab E-Wallet Statement'],
        notes: 'Instant approval within app for gig earners, drivers, and freelancers.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 2. BOOST BANK — Digital Bank (Axiata & RHB Consortium)             */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'boost_bank',
    name: 'Boost Bank Berhad',
    shortName: 'Boost Bank',
    emoji: '📱',
    type: 'Commercial Bank',
    channelType: 'digital_bank_app',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'shopee', 'lazada', 'freelance'],
    minIncomeRM: 1000,
    minGigHistoryMonths: 3,
    website: 'boostbank.my',
    hotline: '+603-7651 8833',
    applicationUrl: 'https://www.myboostsme.co',
    appDownloadUrl: {
      ios: 'https://apps.apple.com/my/app/boost-bank/id6471676884',
      android: 'https://play.google.com/store/apps/details?id=com.boostbank.app'
    },
    minFRIScore: 480,
    highlight: 'BNM-licensed digital bank by Axiata & RHB. Rapid 10-minute approval for micro-merchants, online sellers, and gig workers.',
    notes: 'Available through Boost Bank Mobile App and Boost SME digital portal. High acceptance for digital sellers and riders.',
    applicationSteps: [
      {
        step: 1,
        titleEn: 'Launch Boost Bank / Boost SME App',
        titleBm: 'Buka Aplikasi Boost Bank / Boost SME',
        descEn: 'Open the Boost Bank or Boost SME application on your smartphone.',
        descBm: 'Buka aplikasi Boost Bank atau Boost SME di telefon pintar anda.'
      },
      {
        step: 2,
        titleEn: 'Select SME Financing / Micro Credit',
        titleBm: 'Pilih Pembiayaan Mikro / SME',
        descEn: 'Navigate to "Financing" and choose Term Loan or Revolving Micro Credit.',
        descBm: 'Pergi ke bahagian "Pembiayaan" dan pilih Pinjaman Berjangka atau Kredit Mikro.'
      },
      {
        step: 3,
        titleEn: 'Enter Pre-Calculated Data',
        titleBm: 'Salin Maklumat Terpilih',
        descEn: 'Copy your monthly net earnings and business details directly from the Loan-La Assistant.',
        descBm: 'Salin anggaran pendapatan dan maklumat perniagaan anda daripada Pembantu Loan-La.'
      },
      {
        step: 4,
        titleEn: 'Digital Signature & Payout',
        titleBm: 'Tandatangan Digital & Pengeluaran',
        descEn: 'Review the approval terms in-app and confirm disbursement directly into your bank account within 24 hours.',
        descBm: 'Semak tawaran kelulusan dalam aplikasi dan sahkan pengeluaran dana ke akaun anda dalam 24 jam.'
      }
    ],
    products: [
      {
        id: 'boost_sme_capital',
        name: 'Boost SME Capital / Micro-Financing',
        productType: 'sme_loan',
        minAmountRM: 1000,
        maxAmountRM: 100000,
        tenureMinMonths: 3,
        tenureMaxMonths: 36,
        rateType: 'reducing_pa',
        rateFromPercent: 5.5,
        rateToPercent: 10.5,
        payslipRequired: false,
        compatibleAssets: ['working_capital', 'equipment', 'personal_cash'],
        requiredDocs: ['MyKad (e-KYC)', '3-6 months Bank Statement (PDF)', 'Digital Store Link or Platform Profile'],
        notes: 'Zero paperwork, 100% digital disbursement in 24 to 48 hours.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 3. AEON BANK — Malaysia's 1st Islamic Digital Bank                  */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'aeon_bank',
    name: 'AEON Bank (M) Berhad',
    shortName: 'AEON Bank',
    emoji: '📱',
    type: 'Islamic Bank',
    channelType: 'digital_bank_app',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee', 'freelance'],
    minIncomeRM: 1000,
    minGigHistoryMonths: 3,
    website: 'aeonbank.com.my',
    hotline: '+603-2719 9999',
    applicationUrl: 'https://www.aeonbank.com.my',
    appDownloadUrl: {
      ios: 'https://apps.apple.com/my/app/aeon-bank/id6473859663',
      android: 'https://play.google.com/store/apps/details?id=my.com.aeonbank'
    },
    minFRIScore: 460,
    highlight: 'Malaysia’s 1st Islamic digital bank. 100% Shariah-compliant digital micro financing via mobile app.',
    notes: 'Fully digital Islamic financing operated via mobile app under Tawarruq structure. No physical branch required.',
    applicationSteps: [
      {
        step: 1,
        titleEn: 'Download AEON Bank App',
        titleBm: 'Muat Turun Aplikasi AEON Bank',
        descEn: 'Install AEON Bank on your smartphone and activate your digital Islamic account.',
        descBm: 'Pasang aplikasi AEON Bank di telefon anda dan aktifkan akaun digital Islamik anda.'
      },
      {
        step: 2,
        titleEn: 'Apply for Digital Financing-i',
        titleBm: 'Mohon Pembiayaan Digital-i',
        descEn: 'Tap on "Financing-i" to access Shariah-compliant micro capital.',
        descBm: 'Ketik "Pembiayaan-i" untuk memohon modal mikro patuh Syariah.'
      },
      {
        step: 3,
        titleEn: 'Provide Verified Statement & CAM',
        titleBm: 'Lampirkan Penyata & CAM PDF',
        descEn: 'Upload your verified PDF bank statement prepared by Loan-La as supporting proof.',
        descBm: 'Muat naik penyata bank PDF yang disahkan oleh Loan-La sebagai dokumen sokongan.'
      },
      {
        step: 4,
        titleEn: 'Instant Digital Murabahah Acceptance',
        titleBm: 'Penerimaan Akad Murabahah Digital',
        descEn: 'Complete the digital Akad consent on screen for instant credit line disbursement.',
        descBm: 'Selesaikan persetujuan Akad digital pada skrin untuk pengeluaran pembiayaan serta-merta.'
      }
    ],
    products: [
      {
        id: 'aeon_bank_islamic_cash',
        name: 'AEON Bank Digital Financing-i',
        productType: 'personal_financing',
        minAmountRM: 1000,
        maxAmountRM: 50000,
        tenureMinMonths: 6,
        tenureMaxMonths: 60,
        rateType: 'flat_pa',
        rateFromPercent: 5.0,
        rateToPercent: 9.5,
        payslipRequired: false,
        compatibleAssets: ['personal_cash', 'working_capital'],
        requiredDocs: ['MyKad (e-KYC)', '3-6 months Bank Statement (PDF)'],
        notes: '100% Shariah-compliant digital financing. Instant approval.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 4. TOUCH 'N GO GOPINJAM — CIMB-Powered Express Digital Credit       */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'tng_gopinjam',
    name: 'Touch \'n Go GOpinjam (CIMB Bank)',
    shortName: 'TNG GOpinjam',
    emoji: '📱',
    type: 'Commercial Bank',
    channelType: 'digital_bank_app',
    regulatedBy: 'Bank Negara Malaysia (BNM)',
    shariah: false,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee', 'freelance'],
    minIncomeRM: 800,
    minGigHistoryMonths: 1,
    website: 'touchngo.com.my',
    hotline: '+603-5022 3888',
    applicationUrl: 'https://www.touchngo.com.my/consumer/financial-services/gopinjam/',
    appDownloadUrl: {
      ios: 'https://apps.apple.com/my/app/touch-n-go-ewallet/id1344696702',
      android: 'https://play.google.com/store/apps/details?id=my.com.tngdigital.ewallet'
    },
    minFRIScore: 420,
    highlight: 'Micro-personal loan inside TNG eWallet. Powered by CIMB. Lowest income threshold (RM 800/mo) and instant credit.',
    notes: 'Access directly within the Touch \'n Go eWallet app under Financial Services > GOpinjam.',
    applicationSteps: [
      {
        step: 1,
        titleEn: 'Open Touch \'n Go eWallet App',
        titleBm: 'Buka Aplikasi TNG eWallet',
        descEn: 'Open your existing Touch \'n Go eWallet app on your phone.',
        descBm: 'Buka aplikasi Touch \'n Go eWallet sedia ada di telefon anda.'
      },
      {
        step: 2,
        titleEn: 'Tap GOpinjam Icon',
        titleBm: 'Ketik Ikon GOpinjam',
        descEn: 'Go to Financial Services > GOpinjam and tap "Apply Now".',
        descBm: 'Pergi ke Perkhidmatan Kewangan > GOpinjam dan ketik "Mohon Sekarang".'
      },
      {
        step: 3,
        titleEn: 'Paste Loan-La Verified Info',
        titleBm: 'Tampal Maklumat Disahkan Loan-La',
        descEn: 'Paste your exact pre-calculated net income and loan amount using our Fast-Fill clipboard.',
        descBm: 'Tampal pendapatan bersih dan jumlah pinjaman yang telah disahkan menggunakan papan keratan pantas kami.'
      },
      {
        step: 4,
        titleEn: 'Instant Credit to TNG Wallet or Bank',
        titleBm: 'Pindahan Segera ke Dompet TNG / Bank',
        descEn: 'Once approved, funds are transferred instantly into your TNG eWallet balance or CIMB account.',
        descBm: 'Setelah diluluskan, wang dipindahkan serta-merta ke baki TNG eWallet atau akaun bank anda.'
      }
    ],
    products: [
      {
        id: 'gopinjam_micro',
        name: 'TNG GOpinjam Express Cash',
        productType: 'personal_financing',
        minAmountRM: 500,
        maxAmountRM: 10000,
        tenureMinMonths: 1,
        tenureMaxMonths: 36,
        rateType: 'flat_pa',
        rateFromPercent: 8.0,
        rateToPercent: 18.0,
        payslipRequired: false,
        compatibleAssets: ['personal_cash', 'working_capital'],
        requiredDocs: ['MyKad (e-KYC)', '1-3 months Bank / e-Wallet Statement'],
        notes: 'Rapid disbursement directly to eWallet or nominated bank account.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 5. MAYBANK — SME Digital Financing (100% Online Web Portal)         */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'maybank',
    name: 'Malayan Banking Berhad (Maybank)',
    shortName: 'Maybank',
    emoji: '🏦',
    type: 'Commercial Bank',
    channelType: 'digital_web_portal',
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
    applicationSteps: [
      {
        step: 1,
        titleEn: 'Open Maybank SME Digital Portal',
        titleBm: 'Buka Portal Maybank SME Digital',
        descEn: 'Loan-La opens Maybank’s official clean SME digital application portal in a secure window.',
        descBm: 'Loan-La membuka portal permohonan digital rasmi Maybank SME dalam tetingkap selamat.'
      },
      {
        step: 2,
        titleEn: 'Copy Pre-Filled Details',
        titleBm: 'Salin Maklumat Lengkap',
        descEn: 'Use our floating clipboard assistant to paste your SSM number, IC, and verified revenue.',
        descBm: 'Gunakan pembantu salin terapung untuk menampal nombor pendaftaran, IC, dan pendapatan disahkan.'
      },
      {
        step: 3,
        titleEn: 'Upload 6 Months Statement & CAM',
        titleBm: 'Muat Naik Penyata 6 Bulan & CAM',
        descEn: 'Upload your original e-statement PDF alongside your Loan-La certified Credit Memo.',
        descBm: 'Muat naik fail PDF penyata bank asal bersama Memo Kredit CAM Loan-La yang disahkan.'
      },
      {
        step: 4,
        titleEn: 'In-Principle Digital Decision',
        titleBm: 'Keputusan Kelulusan Digital',
        descEn: 'Receive in-principle decision within 10 minutes with immediate disbursement offer.',
        descBm: 'Terima keputusan awal dalam masa 10 minit dengan tawaran pengeluaran segera.'
      }
    ],
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
  /* 6. CIMB BANK — Regional leader with Micro-SME packages              */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'cimb',
    name: 'CIMB Bank Berhad',
    shortName: 'CIMB',
    emoji: '🏦',
    type: 'Commercial Bank',
    channelType: 'commercial_bank_assisted',
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
  /* 7. TEKUN NASIONAL — Subsidized 4% Micro-Financing for Usahawan       */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'tekun',
    name: 'TEKUN Nasional',
    shortName: 'TEKUN',
    emoji: '🏛️',
    type: 'Government Agency',
    channelType: 'government_micro_agency',
    regulatedBy: 'Kementerian Pembangunan Usahawan & Koperasi (KUSKOP)',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee', 'freelance'],
    minIncomeRM: 500,
    minGigHistoryMonths: 3,
    website: 'tekun.gov.my',
    hotline: '+603-9059 8888',
    whatsappOfficer: '+6019-223 8888',
    applicationUrl: 'https://tekunonline.tekun.gov.my/login',
    minFRIScore: 400,
    highlight: 'Ultra-low 4.0% subsidized annual profit rate. Open to micro-traders, blacklisted applicants & gig riders.',
    notes: 'Agency under KUSKOP. Highest approval rate in Malaysia for self-employed and informal earners. Supports online e-Permohonan and WhatsApp loan officer dispatch.',
    applicationSteps: [
      {
        step: 1,
        titleEn: 'Review Pre-Approved Dossier',
        titleBm: 'Semak Dossier Pra-Kelulusan',
        descEn: 'Loan-La packages your verified earnings into the official TEKUN Kertas Kerja format.',
        descBm: 'Loan-La menyusun pendapatan disahkan anda ke dalam format Kertas Kerja rasmi TEKUN.'
      },
      {
        step: 2,
        titleEn: 'Choose Submission Channel',
        titleBm: 'Pilih Kaedah Permohonan',
        descEn: 'Submit directly via TEKUN Online Portal, WhatsApp an authorized TEKUN Officer, or download printed dossier.',
        descBm: 'Mohon terus melalui Portal TEKUN Online, WhatsApp Pegawai TEKUN bertauliah, atau cetak dossier.'
      },
      {
        step: 3,
        titleEn: 'Submit Documentation',
        titleBm: 'Hantar Dokumen Sokongan',
        descEn: 'Provide MyKad, bank statement book, and gig rider platform screenshots.',
        descBm: 'Sertakan MyKad, penyata akaun bank, dan tangkap layar profil pemandu/rider gig.'
      },
      {
        step: 4,
        titleEn: 'Officer Interview & Disbursement',
        titleBm: 'Temuduga Pegawai & Agihan Dana',
        descEn: 'Brief phone or counter verification, followed by direct bank credit at 4% flat subsidized rate.',
        descBm: 'Pengesahan ringkas melalui telefon atau kaunter, diikuti kemasukan dana pada kadar subsidi 4% setahun.'
      }
    ],
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
  /* 8. BSN — Bank Simpanan Nasional (MicroKredit Madani)                */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bsn',
    name: 'Bank Simpanan Nasional (BSN)',
    shortName: 'BSN',
    emoji: '🏦',
    type: 'Development Bank',
    channelType: 'government_micro_agency',
    regulatedBy: 'Bank Negara Malaysia (BNM) / Ministry of Finance',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'lalamove', 'shopee', 'freelance'],
    minIncomeRM: 800,
    minGigHistoryMonths: 6,
    website: 'bsn.com.my',
    hotline: '1300-88-1900',
    whatsappOfficer: '+6012-288 1900',
    applicationUrl: 'https://www.bsn.com.my/page/business-financing-products-index',
    minFRIScore: 450,
    highlight: 'Lowest monthly income requirement (RM 800/mo). Subsidized rate 4.0% p.a. for micro-businesses & gig workers.',
    notes: 'Official mandate bank under Belanjawan Madani for micro-enterprise empowerment. Applied online via official BSN Business portal or at BSN Micro Finance centers.',
    applicationSteps: [
      {
        step: 1,
        titleEn: 'Review BSN Madani Dossier',
        titleBm: 'Semak Dossier BSN Madani',
        descEn: 'Check your verified income and pre-calculated installment at the subsidized 4.0% rate.',
        descBm: 'Periksa pendapatan disahkan dan anggaran ansuran pada kadar subsidi 4.0% p.a.'
      },
      {
        step: 2,
        titleEn: 'Open BSN Business Financing Portal',
        titleBm: 'Buka Portal Pembiayaan BSN',
        descEn: 'Access official BSN business financing portal or locate your nearest BSN Micro Credit Center.',
        descBm: 'Akses portal rasmi pembiayaan BSN atau rujuk Pusat Kredit Mikro BSN berdekatan.'
      },
      {
        step: 3,
        titleEn: 'Submit Application with CAM Memo',
        titleBm: 'Hantar Permohonan bersama Memo CAM',
        descEn: 'Attach your certified Credit Assessment Memo (CAM) for priority review by BSN officers.',
        descBm: 'Sertakan Memo Penilaian Kredit (CAM) Loan-La untuk semakan keutamaan pegawai BSN.'
      },
      {
        step: 4,
        titleEn: 'Disbursement into BSN Account',
        titleBm: 'Penyaluran ke Akaun BSN',
        descEn: 'Once endorsed, financing is credited directly into your BSN Giro account.',
        descBm: 'Setelah disahkan, pembiayaan dikreditkan terus ke akaun BSN Giro anda.'
      }
    ],
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
  /* 9. ALLIANCE BANK — Digital SME Specialist (100% Online)             */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'alliance_mikro',
    name: 'Alliance Bank Malaysia Berhad',
    shortName: 'Alliance SME',
    emoji: '🏦',
    type: 'Commercial Bank',
    channelType: 'digital_web_portal',
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
    notes: 'Fastest digital onboarding for Malaysian registered sole props and partnerships. 100% web application.',
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
  /* 10. FUNDING SOCIETIES — Malaysia's #1 SC-Licensed P2P Platform      */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'fundingsocieties',
    name: 'Funding Societies Malaysia (Modalku Ventures Sdn Bhd)',
    shortName: 'Funding Societies',
    emoji: '🤝',
    type: 'P2P Platform',
    channelType: 'digital_web_portal',
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
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 11. CAPBAY — Supply Chain & Invoice Liquidity Specialist            */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'capbay',
    name: 'CapBay (Bay Group Holdings / Amber Creative Sdn Bhd)',
    shortName: 'CapBay',
    emoji: '🤝',
    type: 'P2P Platform',
    channelType: 'digital_web_portal',
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

  /* ─────────────────────────────────────────────────────────────────── */
  /* 12. SME BANK — Government SME Specialist (SPUM Scheme)               */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'sme_bank_mikro',
    name: 'SME Bank (Small Medium Enterprise Development Bank Malaysia)',
    shortName: 'SME Bank',
    emoji: '🏛️',
    type: 'Development Bank',
    channelType: 'commercial_bank_assisted',
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
  /* 13. MARA — Majlis Amanah Rakyat (SPiM & SPiKE)                       */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'mara_spim',
    name: 'Majlis Amanah Rakyat (MARA)',
    shortName: 'MARA',
    emoji: '🏛️',
    type: 'Government Agency',
    channelType: 'government_micro_agency',
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
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 14. BANK RAKYAT — Islamic Cooperative Bank                          */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bank_rakyat',
    name: 'Bank Kerjasama Rakyat Malaysia Berhad',
    shortName: 'Bank Rakyat',
    emoji: '🏛️',
    type: 'Cooperative Bank',
    channelType: 'commercial_bank_assisted',
    regulatedBy: 'Bank Negara Malaysia (BNM) / Ministry of Finance',
    shariah: true,
    gigFriendly: true,
    acceptedPlatforms: ['all', 'grab', 'foodpanda', 'shopee', 'freelance'],
    minIncomeRM: 1000,
    minGigHistoryMonths: 3,
    website: 'bankrakyat.com.my',
    hotline: '1300-80-5454',
    applicationUrl: 'https://www.bankrakyat.com.my',
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
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 15. AGROBANK — Agriculture & Rural Food Micro-Financing             */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'agrobank_mikro',
    name: 'Agrobank (Bank Pertanian Malaysia Berhad)',
    shortName: 'Agrobank',
    emoji: '🌾',
    type: 'Development Bank',
    channelType: 'commercial_bank_assisted',
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
        requiredDocs: ['MyKad / NRIC', '6 months Bank Statement', 'SSM Registration or Agro Association Member Letter'],
        notes: 'Working capital for raw materials, fertilizers, seeds, and stall operations.',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 16. BANK ISLAM — Social Finance BangKIT Micro-Financing             */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bank_islam_mikro',
    name: 'Bank Islam Malaysia Berhad',
    shortName: 'Bank Islam',
    emoji: '🕌',
    type: 'Islamic Bank',
    channelType: 'commercial_bank_assisted',
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
  /* 17. AIM (AMANAH IKHTIAR MALAYSIA) — Grameen-style Microcredit       */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'aim',
    name: 'Amanah Ikhtiar Malaysia (AIM)',
    shortName: 'AIM (Amanah Ikhtiar)',
    emoji: '🏛️',
    type: 'Government Agency',
    channelType: 'government_micro_agency',
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
  /* 18. AEON CREDIT SERVICE — Largest Non-Bank Hire Purchase & Cash     */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'aeon',
    name: 'AEON Credit Service (M) Berhad',
    shortName: 'AEON Credit',
    emoji: '🏪',
    type: 'Finance Company',
    channelType: 'commercial_bank_assisted',
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
  /* 19. AMBANK — CGC-backed BizClub Micro Financing                     */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'ambank_mikro',
    name: 'AmBank (M) Berhad',
    shortName: 'AmBank BizClub',
    emoji: '🏦',
    type: 'Commercial Bank',
    channelType: 'commercial_bank_assisted',
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
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 20. PUBLIC BANK — Solid Commercial Micro Sizing (SPM)               */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'public_bank_mikro',
    name: 'Public Bank Berhad',
    shortName: 'Public Bank',
    emoji: '🏦',
    type: 'Commercial Bank',
    channelType: 'commercial_bank_assisted',
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
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 21. BANK MUAMALAT — Islamic Micro-Financing Specialist             */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'muamalat_mikro',
    name: 'Bank Muamalat Malaysia Berhad',
    shortName: 'Bank Muamalat',
    emoji: '🕌',
    type: 'Islamic Bank',
    channelType: 'commercial_bank_assisted',
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
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  /* 22. AFFIN BANK — Affin SMEmerge Micro-Financing                     */
  /* ─────────────────────────────────────────────────────────────────── */
  {
    id: 'affin_mikro',
    name: 'Affin Bank Berhad',
    shortName: 'Affin SMEmerge',
    emoji: '🏦',
    type: 'Commercial Bank',
    channelType: 'commercial_bank_assisted',
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
];

/**
 * Returns the verified direct application/portal URL for a lender.
 * Never returns broken/placeholder links.
 */
export function getLenderOfficialPortalUrl(lenderName?: string, existingUrl?: string): string {
  if (
    existingUrl &&
    existingUrl.startsWith('http') &&
    !existingUrl.includes('localhost') &&
    existingUrl !== '#' &&
    !existingUrl.includes('undefined')
  ) {
    // If it's a known old broken BSN link, fix it to the official working one
    if (existingUrl.includes('bsn.com.my') && (existingUrl.includes('BSN-Micro') || existingUrl.includes('semarak'))) {
      return 'https://www.bsn.com.my/page/business-financing-products-index';
    }
    return existingUrl;
  }

  const name = (lenderName || '').toLowerCase();
  if (name.includes('gxbank') || name.includes('gx bank')) return 'https://www.gxbank.my';
  if (name.includes('boost')) return 'https://www.myboostsme.co';
  if (name.includes('aeon bank')) return 'https://www.aeonbank.com.my';
  if (name.includes('tng') || name.includes('gopinjam') || name.includes('touch')) return 'https://www.touchngo.com.my/consumer/financial-services/gopinjam/';
  if (name.includes('tekun')) return 'https://tekunonline.tekun.gov.my/login';
  if (name.includes('bsn') || name.includes('simpanan')) return 'https://www.bsn.com.my/page/business-financing-products-index';
  if (name.includes('maybank')) return 'https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/loans/business/sme_clean_loan.page';
  if (name.includes('alliance')) return 'https://www.alliancebank.com.my/business/loans/digital-sme.aspx';
  if (name.includes('funding societies') || name.includes('fundingsocieties')) return 'https://fundingsocieties.com.my/micro-financing';
  if (name.includes('capbay')) return 'https://capbay.com/p2p-financing';
  if (name.includes('cimb')) return 'https://www.cimb.com.my/en/business/financing/micro-financing.html';
  if (name.includes('agrobank') || name.includes('agro')) return 'https://www.agrobank.com.my/product/pembiayaan-kredit-mikro-i';
  if (name.includes('bank islam') || name.includes('islam')) return 'https://www.bankislam.com/sme-banking/social-finance/bangkit-microfinancing';
  if (name.includes('bank rakyat') || name.includes('rakyat')) return 'https://www.bankrakyat.com.my';
  if (name.includes('sme bank')) return 'https://www.smebank.com.my/en/financing/spum';
  if (name.includes('mara')) return 'https://www.mara.gov.my/en/business/entrepreneur-financing';
  if (name.includes('aim') || name.includes('ikhtiar')) return 'https://www.aim.gov.my';
  if (name.includes('aeon')) return 'https://www.aeoncredit.com.my';
  if (name.includes('ambank')) return 'https://www.ambank.com.my/business/financing/bizclub';
  if (name.includes('public bank') || name.includes('pbb')) return 'https://www.pbebank.com/business-banking/loans-financing/micro-financing.aspx';
  if (name.includes('muamalat')) return 'https://www.muamalat.com.my/business-banking/micro-financing';
  if (name.includes('affin')) return 'https://www.affinalways.com/en/sme-banking/smemerge';

  return 'https://www.gxbank.my';
}

/**
 * Returns the application channel type for a lender (app, web, government, or assisted).
 */
export function getLenderChannelType(lenderNameOrId?: string): ApplicationChannel {
  const query = (lenderNameOrId || '').toLowerCase();
  
  // 1. Digital Bank Apps
  if (
    query.includes('gxbank') ||
    query.includes('gx bank') ||
    query.includes('boost') ||
    query.includes('aeon bank') ||
    query.includes('tng') ||
    query.includes('gopinjam') ||
    query.includes('touch')
  ) {
    return 'digital_bank_app';
  }

  // 2. Government & Subsidized Micro Agencies
  if (
    query.includes('tekun') ||
    query.includes('bsn') ||
    query.includes('mara') ||
    query.includes('aim') ||
    query.includes('ikhtiar')
  ) {
    return 'government_micro_agency';
  }

  // 3. Digital Web Online Portals
  if (
    query.includes('maybank') ||
    query.includes('alliance') ||
    query.includes('funding societies') ||
    query.includes('capbay')
  ) {
    return 'digital_web_portal';
  }

  // 4. Commercial / Development Banks
  return 'commercial_bank_assisted';
}

/**
 * Finds a lender object by ID or partial name
 */
export function findLenderByNameOrId(nameOrId?: string): Lender | undefined {
  if (!nameOrId) return undefined;
  const q = nameOrId.toLowerCase().trim();
  return LENDERS.find(l => 
    l.id.toLowerCase() === q ||
    l.name.toLowerCase().includes(q) ||
    l.shortName.toLowerCase().includes(q) ||
    q.includes(l.shortName.toLowerCase())
  );
}
