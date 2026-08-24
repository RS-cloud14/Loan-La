'use client';

import React, { useState } from 'react';
import { 
  Building2, Search, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink, 
  Zap, Clock, Landmark, Coins, Tag, BarChart3, X, Check, Info, Sparkles, 
  Scale, FileText, Filter, ArrowUpDown, DollarSign, Award, ChevronRight, LayoutGrid, Table as TableIcon
} from 'lucide-react';
import BankLogo from '@/components/BankLogo';
import { useLanguage } from '@/context/LanguageContext';

interface LenderDirectoryProps {
  onApplyLender?: (lenderName: string) => void;
}

export default function LenderDirectory({ onApplyLender }: LenderDirectoryProps) {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Comparison Modal Interactive States
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>(['gxbank', 'boost', 'bsn']);

  const lenders = [
    {
      id: 'gxbank',
      name: 'GXBank FlexiCredit',
      shortName: 'GXBank',
      institution: 'GX Bank Berhad',
      category: 'digital_bank',
      categoryLabel: language === 'bm' ? 'Bank Digital' : 'Digital Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 1,
      rankLabel: language === 'bm' ? '#1 Pilihan Utama Pekerja Gig' : '#1 Top Pick for Gig Workers',
      rate: '5.88% – 14.50% p.a.',
      rateNumeric: 5.88,
      minIncome: 'RM 1,500 / mo',
      minIncomeNumeric: 1500,
      turnaround: language === 'bm' ? '2 – 4 Jam' : '2 – 4 Hours',
      turnaroundHours: 3,
      maxLoan: 'RM 150,000',
      maxLoanNumeric: 150000,
      tenure: language === 'bm' ? '6 – 36 Bulan' : '6 – 36 Months',
      tenureMonths: 36,
      shariah: false,
      isFast: true,
      isLowIncome: false,
      isBusiness: false,
      highlightBadge: language === 'bm' ? 'Kelulusan Digital Terpantas' : 'Fastest Digital Approval',
      description: language === 'bm'
        ? 'Pembiayaan mikro digital sepenuhnya untuk pemandu Grab, penghantar makanan, dan pekerja gig. Menilai pendapatan platform tanpa perlu ke cawangan fizikal atau slip gaji.'
        : 'Fully digital micro-financing tailored for Grab drivers, food delivery riders, and gig workers. Evaluates platform earnings without requiring physical branch visits or traditional payslips.',
      features: language === 'bm' ? [
        'Pengeluaran segera berasaskan algoritma dalam aplikasi',
        'Tiada penalti penyelesaian awal',
        'Pengesahan pendapatan pemandu Grab bersepadu'
      ] : [
        'Instant algorithmic in-app disbursement',
        'Zero early repayment settlement penalty',
        'Integrated Grab driver earnings verification'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3 Bulan', 'Ringkasan Pendapatan Grab/Platform', 'MyKad'] : ['3-Month Bank Statements', 'Grab / Platform Earnings Summary', 'MyKad Identity']
    },
    {
      id: 'boost',
      name: 'Boost Credit (Capital)',
      shortName: 'Boost Credit',
      institution: 'Boost Bank Berhad / Axiata Digital',
      category: 'digital_bank',
      categoryLabel: language === 'bm' ? 'Bank Digital' : 'Digital Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 2,
      rankLabel: language === 'bm' ? '#2 Terbaik Tanpa Penjamin' : '#2 Best for Zero Guarantor',
      rate: '1.5% / month (~18% p.a.)',
      rateNumeric: 18.0,
      minIncome: 'RM 1,000 / mo',
      minIncomeNumeric: 1000,
      turnaround: language === 'bm' ? 'Dalam 24 Jam' : 'Within 24 Hours',
      turnaroundHours: 24,
      maxLoan: 'RM 100,000',
      maxLoanNumeric: 100000,
      tenure: language === 'bm' ? '3 – 24 Bulan' : '3 – 24 Months',
      tenureMonths: 24,
      shariah: true,
      isFast: true,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Patuh Syariah' : 'Shariah-Compliant',
      description: language === 'bm'
        ? 'Modal pusingan mikro untuk peniaga kecil, peruncit digital, dan freelancer. Menggunakan analitik transaksi e-dompet Boost dan aliran tunai untuk kelulusan.'
        : 'Micro-working capital for small merchants, digital stall owners, and freelancers. Uses Boost e-wallet transaction analytics and QR turnover for underwriting.',
      features: language === 'bm' ? [
        'Sijil Patuh Syariah (Murabahah)',
        'Tiada cagaran atau penjamin diperlukan',
        'Kelulusan pantas untuk pemegang akaun e-dompet'
      ] : [
        'Shariah-compliant Murabahah structure',
        'Zero collateral or guarantor required',
        'Instant scoring for Boost merchant e-wallet users'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank / E-Dompet', 'Pendaftaran Perniagaan SSM (Pilihan)', 'MyKad'] : ['Bank Statement / QR Settlement PDF', 'SSM Business Reg (Optional)', 'MyKad Identity']
    },
    {
      id: 'bsn',
      name: 'BSN MicroKredit',
      shortName: 'BSN MicroKredit',
      institution: 'Bank Simpanan Nasional (BSN)',
      category: 'micro_credit',
      categoryLabel: language === 'bm' ? 'Kredit Mikro Kerajaan' : 'Micro-Credit (Gov)',
      regulator: 'MOF / Bank Negara Malaysia',
      rank: 3,
      rankLabel: language === 'bm' ? '#3 Kadar Faedah Terendah Malaysia' : '#3 Lowest Interest Rate in Malaysia',
      rate: '4.0% p.a. (Kadar Subsidi)',
      rateNumeric: 4.0,
      minIncome: 'RM 800 / mo',
      minIncomeNumeric: 800,
      turnaround: language === 'bm' ? '2 – 3 Hari Bekerja' : '2 – 3 Working Days',
      turnaroundHours: 48,
      maxLoan: 'RM 50,000',
      maxLoanNumeric: 50000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: false,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Kadar Faedah Terendah (4.0%)' : 'Lowest Interest Rate (4.0%)',
      description: language === 'bm'
        ? 'Skim pembiayaan mikro disokong kerajaan Malaysia untuk penjaja, peniaga pasar malam, dan pekerja ekonomi gig dengan kadar faedah termurah.'
        : 'Government-supported micro-financing scheme for hawkers, night-market traders, and gig economy workers with the lowest subsidized interest rates in Malaysia.',
      features: language === 'bm' ? [
        'Kadar faedah terendah 4.0% setahun',
        'Tempoh bayaran balik fleksibel sehingga 5 tahun',
        'Tempoh penangguhan bayaran (moratorium) tersedia'
      ] : [
        'Ultra-low 4.0% subsidized flat rate',
        'Flexible long repayment terms up to 5 years',
        'Grace period moratorium available'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3-6 Bulan', 'Lesen PBT / Surat Pengesahan Majlis', 'MyKad'] : ['3-6 Months Bank Statements', 'Local Council (PBT) Permit or Gig ID', 'MyKad Identity']
    },
    {
      id: 'aeon',
      name: 'AEON Credit i-Cash',
      shortName: 'AEON Credit',
      institution: 'AEON Credit Service (M) Berhad',
      category: 'micro_credit',
      categoryLabel: language === 'bm' ? 'Pembiayaan Patuh Syariah' : 'Shariah Financing',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 4,
      rankLabel: language === 'bm' ? '#4 Paling Popular Sewa Beli & Tunai' : '#4 Popular for Hire Purchase & Cash',
      rate: '0.66% – 1.25% / mo (~8%–15% p.a.)',
      rateNumeric: 7.92,
      minIncome: 'RM 1,500 / mo',
      minIncomeNumeric: 1500,
      turnaround: language === 'bm' ? 'Hari Yang Sama' : 'Same Day',
      turnaroundHours: 12,
      maxLoan: 'RM 100,000',
      maxLoanNumeric: 100000,
      tenure: language === 'bm' ? '6 – 84 Bulan' : '6 – 84 Months',
      tenureMonths: 84,
      shariah: true,
      isFast: true,
      isLowIncome: false,
      isBusiness: false,
      highlightBadge: language === 'bm' ? 'Paling Popular Sewa Beli' : 'Popular for Vehicles',
      description: language === 'bm'
        ? 'Pembiayaan peribadi & sewa beli kenderaan yang paling meluas menerima pendapatan gig pemandu dan peniaga kecil di seluruh Malaysia.'
        : 'Widespread personal financing & vehicle hire purchase with lenient income criteria for gig drivers, bike couriers, and freelance sole proprietors.',
      features: language === 'bm' ? [
        'Menerima penyata pendapatan aplikasi gig',
        'Pindahan tunai segera hari yang sama',
        'Rangkaian cawangan dan kiosk di seluruh negara'
      ] : [
        'Accepts rider app earnings statements',
        'Same-day direct express bank credit',
        'Nationwide branch & kiosk support'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3 Bulan', 'Bukti Pendapatan Gig / Lesen Memandu', 'MyKad'] : ['3-Month Bank Statements', 'Rider / Driver Profile Screenshot', 'MyKad & Driving License']
    },
    {
      id: 'fundingsocieties',
      name: 'Funding Societies Micro Financing',
      shortName: 'Funding Societies',
      institution: 'Modalku Ventures Sdn Bhd',
      category: 'p2p',
      categoryLabel: language === 'bm' ? 'P2P / Pendanaan Awam' : 'P2P Crowdfunding',
      regulator: 'Securities Commission Malaysia (SC)',
      rank: 5,
      rankLabel: language === 'bm' ? '#5 Had Pinjaman Modal Tertinggi' : '#5 Highest Business Loan Cap',
      rate: '10.0% – 18.0% p.a.',
      rateNumeric: 10.0,
      minIncome: 'RM 3,000 / mo jualan',
      minIncomeNumeric: 3000,
      turnaround: language === 'bm' ? '24 – 48 Jam' : '24 – 48 Hours',
      turnaroundHours: 36,
      maxLoan: 'RM 200,000',
      maxLoanNumeric: 200000,
      tenure: language === 'bm' ? '1 – 12 Bulan' : '1 – 12 Months',
      tenureMonths: 12,
      shariah: true,
      isFast: false,
      isLowIncome: false,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Terbaik Untuk Peniaga Shopee' : 'Best for E-Commerce',
      description: language === 'bm'
        ? 'Platform pendanaan P2P digital terbesar di Asia Tenggara untuk peniaga Shopee, Lazada, TikTok Shop, dan kontraktor freelance.'
        : 'Southeast Asia largest SME digital P2P financing platform. Fast working capital for Shopee, Lazada, and TikTok Shop sellers with invoice financing options.',
      features: language === 'bm' ? [
        'Tiada cagaran fizikal diperlukan',
        'Kelulusan berdasarkan jumlah jualan kedai digital',
        'Pengeluaran modal pantas dalam 48 jam'
      ] : [
        'Zero hard asset collateral required',
        'Evaluated on e-commerce seller GMV and turnover',
        'Fast fund disbursement within 48 hours'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank Syarikat 6 Bulan', 'Laporan Jualan Kedai E-Dagang', 'Pendaftaran SSM'] : ['6-Month Bank Statements', 'Marketplace Store Sales CSV Export', 'SSM Certificate']
    },
    {
      id: 'spaylater',
      name: 'SPayLater / SLoan',
      shortName: 'SPayLater',
      institution: 'SeaMoney Capital Malaysia Sdn Bhd',
      category: 'bnpl',
      categoryLabel: 'BNPL & E-Commerce',
      regulator: 'KPKT Moneylenders Act 1951',
      rank: 6,
      rankLabel: language === 'bm' ? '#6 Serta-merta Tanpa Dokumen' : '#6 Instant Zero-Doc Credit',
      rate: '1.25% – 1.50% / mo (~15% p.a.)',
      rateNumeric: 15.0,
      minIncome: language === 'bm' ? 'Aliran Jualan Shopee' : 'Shopee Seller / Buyer Flow',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? 'Serta-merta (1 Minit)' : 'Instant (1 Minute)',
      turnaroundHours: 0.02,
      maxLoan: 'RM 10,000',
      maxLoanNumeric: 10000,
      tenure: language === 'bm' ? '1 – 12 Bulan' : '1 – 12 Months',
      tenureMonths: 12,
      shariah: true,
      isFast: true,
      isLowIncome: true,
      isBusiness: false,
      highlightBadge: language === 'bm' ? 'Tanpa Sebarang Kertas Kerja' : 'Zero Paperwork',
      description: language === 'bm'
        ? 'Kemudahan kredit mikro algoritma yang dinilai terus daripada volum jualan kedai dan rekod transaksi tanpa perlu muat naik dokumen.'
        : 'Algorithmic micro-credit line evaluated purely on marketplace seller volume, fulfillment metrics, and buyer repayment history without file uploads.',
      features: language === 'bm' ? [
        'Kelulusan algoritma serta-merta',
        'Tiada muat naik dokumen fizikal',
        'Tolak automatik daripada dompet jualan'
      ] : [
        'Instant algorithmic credit approval',
        'Zero physical document upload required',
        'Automated checkout & wallet deduction'
      ],
      requiredDocs: language === 'bm' ? ['Akaun Shopee Disahkan', 'Pengesahan e-KYC MyKad'] : ['Verified Shopee Account', 'MyKad e-KYC Identity']
    },
    {
      id: 'tng_gopinjam',
      name: 'Touch \'n Go GOpinjam',
      shortName: 'TNG GOpinjam',
      institution: 'TNG Digital / CIMB Bank Berhad',
      category: 'digital_bank',
      categoryLabel: language === 'bm' ? 'E-Dompet & Kredit Mikro' : 'E-Wallet & Micro-Credit',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 7,
      rankLabel: language === 'bm' ? '#7 Tunai Terpantas Terus ke E-Dompet' : '#7 Instant In-Wallet Direct Cash',
      rate: '8.0% – 18.0% p.a.',
      rateNumeric: 8.0,
      minIncome: 'RM 800 / mo',
      minIncomeNumeric: 800,
      turnaround: language === 'bm' ? 'Serta-merta (5 Minit)' : 'Instant (5 Minutes)',
      turnaroundHours: 0.1,
      maxLoan: 'RM 10,000',
      maxLoanNumeric: 10000,
      tenure: language === 'bm' ? '1 – 12 Bulan' : '1 – 12 Months',
      tenureMonths: 12,
      shariah: false,
      isFast: true,
      isLowIncome: true,
      isBusiness: false,
      highlightBadge: language === 'bm' ? 'Kelulusan 5 Minit' : '5-Minute Approval',
      description: language === 'bm'
        ? 'Kemudahan kredit peribadi digital penuh dalam aplikasi Touch \'n Go eWallet, dikuasakan oleh infrastruktur CIMB Bank dengan kelulusan kredit serta-merta.'
        : 'Full digital personal credit within the Touch \'n Go eWallet app, powered by CIMB Bank infrastructure with instant disbursement to your eWallet or bank account.',
      features: language === 'bm' ? [
        'Pengeluaran segera terus ke TNG eWallet atau akaun bank',
        'Ambang pendapatan permulaan serendah RM 800 sebulan',
        'Dikuasakan oleh infrastruktur keselamatan perbankan CIMB'
      ] : [
        'Instant disbursement directly to TNG eWallet or bank',
        'Low income entry threshold starting from RM 800/month',
        'Powered by CIMB Bank institutional banking security'
      ],
      requiredDocs: language === 'bm' ? ['Akaun TNG eWallet Disahkan', 'Penyata Pendapatan / Bank 1 Bulan', 'MyKad'] : ['Verified TNG eWallet Account', '1-Month Bank / Gig Statement', 'MyKad Identity']
    },
    {
      id: 'aeon_bank',
      name: 'AEON Bank i-Financing',
      shortName: 'AEON Bank',
      institution: 'AEON Bank (M) Berhad',
      category: 'digital_bank',
      categoryLabel: language === 'bm' ? 'Bank Digital Islamik' : 'Islamic Digital Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 8,
      rankLabel: language === 'bm' ? '#8 Bank Digital Islamik Pertama Malaysia' : '#8 Malaysia\'s 1st Islamic Digital Bank',
      rate: '5.50% – 12.00% p.a.',
      rateNumeric: 5.5,
      minIncome: 'RM 1,500 / mo',
      minIncomeNumeric: 1500,
      turnaround: language === 'bm' ? 'Hari Yang Sama' : 'Same Day',
      turnaroundHours: 12,
      maxLoan: 'RM 100,000',
      maxLoanNumeric: 100000,
      tenure: language === 'bm' ? '6 – 60 Bulan' : '6 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: true,
      isLowIncome: false,
      isBusiness: false,
      highlightBadge: language === 'bm' ? '100% Patuh Syariah' : '100% Shariah Compliant',
      description: language === 'bm'
        ? 'Bank digital Islamik berlesen pertama di Malaysia. Menawarkan pembiayaan berasaskan prinsip Tawarruq dengan integrasi mata ganjaran ekosistem AEON.'
        : 'Malaysia\'s first licensed Islamic digital bank. Offers Tawarruq-based financing integrated with AEON Points ecosystem rewards and digital onboarding.',
      features: language === 'bm' ? [
        'Prinsip Tawarruq Islamik sepenuhnya',
        'Ganjaran mata ekosistem AEON di seluruh Malaysia',
        'Permohonan digital 100% tanpa ke kaunter'
      ] : [
        'Fully Shariah-compliant Tawarruq structure',
        'AEON ecosystem rewards integration across Malaysia',
        '100% paperless mobile app onboarding'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3 Bulan', 'Penyata Gaji / Ringkasan Pendapatan Gig', 'MyKad'] : ['3-Month Bank Statements', 'Payslip / Gig Income Summary', 'MyKad Identity']
    },
    {
      id: 'bank_rakyat',
      name: 'Bank Rakyat Pembiayaan Mikro-i',
      shortName: 'Bank Rakyat',
      institution: 'Bank Kerjasama Rakyat Malaysia Berhad',
      category: 'micro_credit',
      categoryLabel: language === 'bm' ? 'Bank Koperasi Islamik' : 'Islamic Cooperative Bank',
      regulator: 'Bank Negara Malaysia / KUSKOP',
      rank: 9,
      rankLabel: language === 'bm' ? '#9 Terbaik Untuk Komuniti Koperasi & B40' : '#9 Best for Cooperative Members & B40',
      rate: '4.50% – 6.50% p.a.',
      rateNumeric: 4.5,
      minIncome: 'RM 1,000 / mo',
      minIncomeNumeric: 1000,
      turnaround: language === 'bm' ? '2 – 3 Hari Bekerja' : '2 – 3 Working Days',
      turnaroundHours: 48,
      maxLoan: 'RM 50,000',
      maxLoanNumeric: 50000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: false,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Kadar Koperasi Rendah' : 'Low Cooperative Rate',
      description: language === 'bm'
        ? 'Pembiayaan mikro patuh Syariah untuk peniaga kecil, usahawan mikro, dan pekerja bebas dengan syarat kelayakan pendapatan yang fleksibel.'
        : 'Shariah-compliant micro-financing for micro-entrepreneurs, traders, and freelancers with lenient income qualification and cooperative profit distribution.',
      features: language === 'bm' ? [
        'Kadar keuntungan kompetitif untuk golongan B40/M40',
        'Menerima caruman KWSP sukarela sebagai bukti pendapatan',
        'Cawangan meluas di seluruh bandar dan luar bandar'
      ] : [
        'Competitive profit rates for B40/M40 income earners',
        'Accepts voluntary EPF contributions as income proof',
        'Extensive nationwide branch network'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3-6 Bulan', 'Penyata KWSP / SSM (Jika Ada)', 'MyKad'] : ['3-6 Months Bank Statements', 'EPF Statement / SSM (If Available)', 'MyKad Identity']
    },
    {
      id: 'tekun',
      name: 'TEKUN Nasional Skim Pembiayaan',
      shortName: 'TEKUN',
      institution: 'Tabung Ekonomi Kumpulan Usaha Niaga (TEKUN)',
      category: 'micro_credit',
      categoryLabel: language === 'bm' ? 'Kredit Agensi Kerajaan' : 'Government Agency Credit',
      regulator: 'KUSKOP (Kementerian Usahawan)',
      rank: 10,
      rankLabel: language === 'bm' ? '#10 Bantuan Modal Usahawan Mikro' : '#10 Government Micro Enterprise Fund',
      rate: '4.0% p.a. (Kadar Subsidi)',
      rateNumeric: 4.0,
      minIncome: 'RM 500 / mo',
      minIncomeNumeric: 500,
      turnaround: language === 'bm' ? '5 – 7 Hari Bekerja' : '5 – 7 Working Days',
      turnaroundHours: 120,
      maxLoan: 'RM 100,000',
      maxLoanNumeric: 100000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: false,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Agensi Rasmi Kerajaan' : 'Official Government Agency',
      description: language === 'bm'
        ? 'Skim pembiayaan modal perniagaan mikro daripada TEKUN Nasional untuk memulakan dan mengembangkan perniagaan kecil, pasar malam, dan penghantar barangan.'
        : 'Official government micro-financing scheme by TEKUN Nasional to support micro-enterprises, stall operators, and independent courier businesses.',
      features: language === 'bm' ? [
        'Kadar keuntungan serendah 4% setahun',
        'Bimbingan keusahawanan dan khidmat nasihat perniagaan percuma',
        'Perlindungan takaful berkelompok disediakan'
      ] : [
        'Subsidized 4% annual profit rate',
        'Free entrepreneurial guidance and business advisory',
        'Group takaful coverage included'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3 Bulan', 'Lesen Perniagaan / Permit PBT / SSM', 'MyKad & Gambar Premis'] : ['3-Month Bank Statements', 'Business License / Local Council Permit', 'MyKad & Business Photos']
    },
    {
      id: 'capbay',
      name: 'CapBay Supply Chain Financing',
      shortName: 'CapBay',
      institution: 'Bay Group Holdings Sdn Bhd',
      category: 'p2p',
      categoryLabel: language === 'bm' ? 'P2P & Pembiayaan Invois' : 'P2P & Invoice Financing',
      regulator: 'Securities Commission Malaysia (SC)',
      rank: 11,
      rankLabel: language === 'bm' ? '#11 Had Pembiayaan Sehingga RM 500,000' : '#11 Highest Working Capital Limit',
      rate: '6.0% – 14.0% p.a.',
      rateNumeric: 6.0,
      minIncome: 'RM 5,000 / mo jualan',
      minIncomeNumeric: 5000,
      turnaround: language === 'bm' ? '24 – 48 Jam' : '24 – 48 Hours',
      turnaroundHours: 36,
      maxLoan: 'RM 500,000',
      maxLoanNumeric: 500000,
      tenure: language === 'bm' ? '1 – 6 Bulan' : '1 – 6 Months',
      tenureMonths: 6,
      shariah: true,
      isFast: false,
      isLowIncome: false,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Modal Invois Terbesar' : 'Highest Working Capital',
      description: language === 'bm'
        ? 'Platform pendanaan P2P berlesen Suruhanjaya Sekuriti untuk pendahuluan tunai invois, pesanan belian (PO), dan modal pusingan PKS digital.'
        : 'Securities Commission regulated multi-award P2P platform for invoice factoring, purchase order financing, and digital supply chain liquidity.',
      features: language === 'bm' ? [
        'Pendahuluan tunai sehingga 80% daripada nilai invois',
        'Kelulusan berasaskan keteguhan pembayar korporat / kontrak',
        'Struktur konvensional dan patuh Syariah'
      ] : [
        'Cash advance up to 80% of invoice face value',
        'Underwriting backed by buyer/client payment track record',
        'Both Conventional & Islamic financing structures'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 6 Bulan', 'Salinan Invois / Pesanan Belian (PO)', 'Pendaftaran SSM'] : ['6-Month Bank Statements', 'Client Invoices / Purchase Orders (PO)', 'SSM Company Registration']
    }
  ];

  // Main Directory Filtering
  const filtered = lenders.filter(l => {
    let matchCategory = true;
    if (selectedCategory === 'shariah') {
      matchCategory = l.shariah;
    } else if (selectedCategory !== 'all') {
      matchCategory = l.category === selectedCategory;
    }

    const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.institution.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white rounded-3xl shadow-lg border border-blue-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-blue-300" /> {language === 'bm' ? 'Direktori Bank & Pemberi Pinjaman Berlesen' : 'Licensed Alternative Lenders Directory'}
            </h2>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
              {language === 'bm'
                ? 'Terokai institusi kewangan dan bank digital berlesen di Malaysia yang menerima pendapatan pekerja gig, jualan peniaga, dan penyata e-dompet tanpa slip gaji tradisional.'
                : 'Explore verified financial institutions and digital banks in Malaysia that officially accept gig worker incomes, merchant cash flows, and e-wallet statements without traditional payslips.'}
            </p>
          </div>

          <button
            onClick={() => setCompareModalOpen(true)}
            className="px-5 py-3 bg-white hover:bg-blue-50 text-blue-950 text-xs font-black rounded-2xl shadow-md transition-all flex items-center gap-2 shrink-0 border border-white cursor-pointer active:scale-98"
          >
            <BarChart3 className="w-4 h-4 text-blue-900" />
            <span>{language === 'bm' ? 'Bandingkan Bank Bersebelahan' : 'Compare Lenders Side-by-Side'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'bm' ? 'Cari mengikut nama bank, kata kunci...' : 'Search by bank name, keyword...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-hidden focus:border-blue-900 focus:bg-white font-medium transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
          {[
            { id: 'all', label: language === 'bm' ? 'Semua Institusi' : 'All Lenders', count: lenders.length },
            { id: 'digital_bank', label: language === 'bm' ? 'Bank Digital & Dompet' : 'Digital Banks & Wallets', count: lenders.filter(l => l.category === 'digital_bank').length },
            { id: 'shariah', label: language === 'bm' ? '☪️ Patuh Syariah' : '☪️ Islamic (Shariah)', count: lenders.filter(l => l.shariah).length },
            { id: 'micro_credit', label: language === 'bm' ? 'Kredit Mikro (Gov/Koperasi)' : 'Micro-Credit (Gov/Coop)', count: lenders.filter(l => l.category === 'micro_credit').length },
            { id: 'p2p', label: 'P2P Crowdfunding', count: lenders.filter(l => l.category === 'p2p').length },
            { id: 'bnpl', label: 'BNPL / E-Dagang', count: lenders.filter(l => l.category === 'bnpl').length },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-950 text-white border-blue-950 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === cat.id ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {filtered.map((lender) => (
          <div 
            key={lender.id} 
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group"
          >
            
            <div className="flex flex-col gap-4">
              
              {/* Card Top: Header & Badges */}
              <div>
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {lender.categoryLabel}
                  </span>
                  {lender.shariah ? (
                    <span className="text-[10px] font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      ☪️ SHARIAH
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                      Conventional
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1 mb-1">
                  <BankLogo bankId={lender.id} bankName={lender.name} size="md" />
                  <div>
                    <h3 className="text-base font-black text-blue-950 group-hover:text-blue-900 transition-colors">
                      {lender.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      {lender.institution} · <span className="text-blue-900 font-semibold">{lender.regulator}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Standardized 4-Box Metric Matrix (Clean Font Sizes & Weights) */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="p-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Indicative Rate
                  </span>
                  <span className="text-xs font-black text-blue-950 block mt-1">
                    {lender.rate}
                  </span>
                </div>

                <div className="p-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Approval SLA
                  </span>
                  <span className="text-xs font-bold text-blue-900 block mt-1">
                    {lender.turnaround}
                  </span>
                </div>

                <div className="p-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Max Loan Limit
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-1">
                    {lender.maxLoan}
                  </span>
                </div>

                <div className="p-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Min. Income
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-1">
                    {lender.minIncome}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {lender.description}
              </p>

              {/* Key Features */}
              <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Key Advantages
                </span>
                {lender.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-900 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Card Footer */}
            <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200">
                ✓ Gig Friendly
              </span>
              <button
                onClick={() => onApplyLender ? onApplyLender(lender.name) : null}
                className="px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Check Match</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL NO-SCROLL SIDE-BY-SIDE LENDER COMPARISON                      */}
      {/* ========================================================================= */}
      {compareModalOpen && (() => {
        const selectedLenderObjects = lenders.filter(l => selectedCompareIds.includes(l.id));

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
              
              {/* 1. Professional Header */}
              <div className="px-6 py-4 bg-blue-950 text-white flex items-center justify-between border-b border-blue-900 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900 rounded-lg">
                    <Building2 className="w-4 h-4 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wide uppercase">
                      {language === 'bm' ? 'Perbandingan Institusi Perbankan' : 'Bank & Lender Comparison'}
                    </h3>
                    <span className="text-xs text-blue-200">
                      {language === 'bm' ? 'Pilih institusi untuk perbandingan bersebelahan' : 'Select lenders to compare side-by-side'}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setCompareModalOpen(false)} 
                  className="p-1.5 hover:bg-blue-900 rounded-lg text-blue-200 hover:text-white transition-all cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2. Professional Quick Filter Presets & Bank Multi-Select Bar */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                
                {/* Left: 1-Click Quick Filter Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider mr-1">
                    {language === 'bm' ? 'Tapis Cepat:' : 'Quick Filter:'}
                  </span>
                  {[
                    { id: 'rate', label: language === 'bm' ? 'Kadar Terendah' : 'Lowest Rate', bankIds: ['bsn', 'tekun', 'bank_rakyat'] },
                    { id: 'speed', label: language === 'bm' ? 'Kelulusan Pantas' : 'Fastest Speed', bankIds: ['spaylater', 'tng_gopinjam', 'gxbank'] },
                    { id: 'shariah', label: language === 'bm' ? 'Patuh Syariah' : 'Shariah Only', bankIds: ['aeon_bank', 'boost', 'bank_rakyat'] },
                    { id: 'low_income', label: language === 'bm' ? 'Gaji Min. Rendah' : 'Lowest Min. Income', bankIds: ['tekun', 'bsn', 'tng_gopinjam'] },
                  ].map((preset) => {
                    const isPresetActive = selectedCompareIds.length === preset.bankIds.length && 
                      preset.bankIds.every(id => selectedCompareIds.includes(id));

                    return (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedCompareIds(preset.bankIds)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all border cursor-pointer ${
                          isPresetActive
                            ? 'bg-blue-900 text-white border-blue-900 font-bold shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right: Manual Bank Multi-Select (Max 3) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider mr-1">
                    {language === 'bm' ? 'Pilih Bank (Maks. 3):' : 'Select Banks (Max 3):'}
                  </span>
                  {lenders.map((l) => {
                    const isSelected = selectedCompareIds.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        onClick={() => {
                          if (isSelected) {
                            if (selectedCompareIds.length > 2) {
                              setSelectedCompareIds(selectedCompareIds.filter(id => id !== l.id));
                            }
                          } else {
                            if (selectedCompareIds.length >= 3) {
                              setSelectedCompareIds([...selectedCompareIds.slice(1), l.id]);
                            } else {
                              setSelectedCompareIds([...selectedCompareIds, l.id]);
                            }
                          }
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-950 text-white border-blue-950 font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{l.shortName || l.name}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* 3. Professional Side-by-Side Comparison Grid (Fits in screen, No Scroll) */}
              <div className="p-6 bg-white overflow-x-auto">
                <div className={`grid gap-4 ${selectedLenderObjects.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {selectedLenderObjects.map((l, idx) => (
                    <div 
                      key={l.id} 
                      className={`border rounded-xl p-4.5 flex flex-col justify-between gap-4 transition-all ${
                        idx === 0 ? 'border-blue-900/40 bg-blue-50/20' : 'border-slate-200 bg-white'
                      }`}
                    >
                      {/* Top: Institution Name & Status */}
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {l.regulator}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            l.shariah 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {l.shariah ? '☪️ Shariah' : 'Conventional'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <BankLogo bankId={l.id} bankName={l.name} size="sm" />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-blue-950 truncate leading-tight">
                              {l.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-medium block truncate">
                              {l.institution}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Side-by-Side Spec Rows */}
                      <div className="flex flex-col gap-2.5 text-xs">
                        
                        {/* Indicative Rate */}
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">
                            {language === 'bm' ? 'Kadar Faedah' : 'Indicative Rate'}
                          </span>
                          <span className="font-bold text-blue-950">
                            {l.rate}
                          </span>
                        </div>

                        {/* Approval Turnaround */}
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">
                            {language === 'bm' ? 'Tempoh Kelulusan' : 'Approval SLA'}
                          </span>
                          <span className="font-bold text-blue-900">
                            {l.turnaround}
                          </span>
                        </div>

                        {/* Min Monthly Income */}
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">
                            {language === 'bm' ? 'Kelayakan Gaji Min.' : 'Min. Monthly Income'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {l.minIncome}
                          </span>
                        </div>

                        {/* Max Sizing */}
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">
                            {language === 'bm' ? 'Had Maksimum' : 'Max Loan Limit'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {l.maxLoan}
                          </span>
                        </div>

                        {/* Tenure */}
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">
                            {language === 'bm' ? 'Tempoh Bayaran' : 'Tenure Period'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {l.tenure}
                          </span>
                        </div>

                        {/* Underwriting Method / Primary Advantage */}
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            {language === 'bm' ? 'Ciri Penilaian Utama' : 'Underwriting Advantage'}
                          </span>
                          <p className="text-xs text-slate-700 font-normal leading-relaxed">
                            {l.features[0]}
                          </p>
                        </div>

                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setCompareModalOpen(false);
                          if (onApplyLender) onApplyLender(l.name);
                        }}
                        className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                      >
                        <span>{language === 'bm' ? 'Pilih Institusi Ini' : 'Select Lender'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Professional Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
                <span className="text-[11px]">
                  {language === 'bm' 
                    ? 'Kadar faedah dan had pembiayaan adalah anggaran indikatif tertakluk kepada semakan kredit rasmi.' 
                    : 'Indicative financing terms subject to official regulatory guidelines and institutional credit assessment.'}
                </span>
                <button
                  onClick={() => setCompareModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-all cursor-pointer text-xs"
                >
                  {language === 'bm' ? 'Tutup' : 'Close'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
