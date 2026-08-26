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
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>(['maybank_mikro', 'cimb_mikro', 'bsn']);

  const lenders = [
    // ─── TRADITIONAL BANK MICRO LOANS ───────────────────────────────────────
    {
      id: 'maybank_mikro',
      name: 'Maybank Mikro / Maybank Islamic Mikro-i',
      shortName: 'Maybank Mikro',
      institution: 'Malayan Banking Berhad (Maybank)',
      category: 'traditional_bank',
      categoryLabel: language === 'bm' ? 'Bank Perdagangan' : 'Commercial Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 1,
      rankLabel: language === 'bm' ? '#1 Bank Terbesar Malaysia' : '#1 Largest Bank in Malaysia',
      rate: '11% p.a. (flat, sehingga RM 20k) · BLR+1.25% (RM 20k–50k)',
      rateNumeric: 11.0,
      minIncome: language === 'bm' ? 'Operasi Perniagaan ≥ 2 Tahun' : 'Business in Operation ≥ 2 Years',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '3 – 5 Hari Bekerja' : '3 – 5 Working Days',
      turnaroundHours: 72,
      maxLoan: 'RM 50,000',
      maxLoanNumeric: 50000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: false,
      isLowIncome: false,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Bank Terbesar Malaysia' : 'Malaysia\'s Largest Bank',
      description: language === 'bm'
        ? 'Pembiayaan mikro untuk peniaga perseorangan dan usahawan mikro yang beroperasi sekurang-kurangnya 2 tahun. Boleh mohon melalui Maybank2u atau cawangan. Versi Islam-i (Murabahah) turut tersedia.'
        : 'Term micro-financing for sole proprietors and micro-enterprises with at least 2 years of business operation. Apply via Maybank2u or branch. Islamic Mikro-i (Murabahah) option also available.',
      features: language === 'bm' ? [
        'Tiada cagaran diperlukan untuk pembiayaan sehingga RM 20,000',
        'Kadar tetap 11% setahun – mudah perancangan kewangan',
        'Versi konvensional dan Islamik (Murabahah) tersedia'
      ] : [
        'No collateral required for financing up to RM 20,000',
        'Fixed 11% p.a. flat rate – easy financial planning',
        'Both conventional & Islamic Murabahah structures available'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3–6 Bulan', 'Lesen Perniagaan / Pendaftaran SSM', 'MyKad · Bukti Premis Perniagaan'] : ['3–6 Months Bank Statements', 'Business License / SSM Registration', 'MyKad · Business Premise Proof']
    },
    {
      id: 'cimb_mikro',
      name: 'CIMB SME Micro Financing',
      shortName: 'CIMB SME Mikro',
      institution: 'CIMB Bank Berhad',
      category: 'traditional_bank',
      categoryLabel: language === 'bm' ? 'Bank Perdagangan' : 'Commercial Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 2,
      rankLabel: language === 'bm' ? '#2 Rangkaian Cawangan Terluas' : '#2 Widest Branch Network',
      rate: language === 'bm' ? 'Berdasarkan profil kredit (SRF: max 3.75% p.a.)' : 'Credit-based (SRF scheme: capped at 3.75% p.a.)',
      rateNumeric: 6.5,
      minIncome: language === 'bm' ? 'Operasi Perniagaan ≥ 12 Bulan' : 'Business in Operation ≥ 12 Months',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '3 – 7 Hari Bekerja' : '3 – 7 Working Days',
      turnaroundHours: 96,
      maxLoan: 'RM 750,000',
      maxLoanNumeric: 750000,
      tenure: language === 'bm' ? '12 – 84 Bulan' : '12 – 84 Months',
      tenureMonths: 84,
      shariah: true,
      isFast: false,
      isLowIncome: false,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Had Modal Kerja Tertinggi' : 'Highest Working Capital Limit',
      description: language === 'bm'
        ? 'Pembiayaan SME & mikro daripada CIMB Bank yang menyertai pelbagai skim BNM termasuk Skim Relief Penstabilan PKS (SRF). Sesuai untuk modal pusingan, pengambilalihan aset, dan pengembangan perniagaan.'
        : 'SME & micro-financing from CIMB Bank participating in various BNM schemes including SME Stabilisation Relief Facility (SRF). Ideal for working capital, asset acquisition, and business expansion.',
      features: language === 'bm' ? [
        'Menyertai skim BNM/CGC – kadar lebih kompetitif',
        'Sesuai modal pusingan, aset, dan pengembangan perniagaan',
        'Perkhidmatan Pengurus Hubungan SME peribadi'
      ] : [
        'Participates in BNM/CGC guarantee schemes – competitive rates',
        'Suitable for working capital, asset, and business expansion',
        'Dedicated SME Relationship Manager service'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank Syarikat 6 Bulan', 'Dokumen Kewangan Syarikat', 'Pendaftaran SSM · MyKad Pengarah'] : ['6-Month Business Bank Statements', 'Company Financial Documents', 'SSM Registration · Director MyKad']
    },
    {
      id: 'bank_islam_mikro',
      name: 'Bank Islam iTEKAD / Pembiayaan Mikro-i',
      shortName: 'Bank Islam Mikro',
      institution: 'Bank Islam Malaysia Berhad',
      category: 'traditional_bank',
      categoryLabel: language === 'bm' ? 'Bank Islam Penuh' : 'Full Islamic Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 3,
      rankLabel: language === 'bm' ? '#3 Bank Islam Tertua Malaysia' : '#3 Malaysia\'s Oldest Islamic Bank',
      rate: language === 'bm' ? 'Program sosial – kadar sangat rendah / tiada keuntungan' : 'Social finance programme – very low / zero profit rate',
      rateNumeric: 3.0,
      minIncome: language === 'bm' ? 'Usahawan Mikro B40 / Asnaf' : 'B40 Micro-Entrepreneur / Asnaf',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '5 – 10 Hari Bekerja' : '5 – 10 Working Days',
      turnaroundHours: 120,
      maxLoan: 'RM 50,000',
      maxLoanNumeric: 50000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: false,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? '100% Patuh Syariah · Program Sosial' : '100% Shariah · Social Finance',
      description: language === 'bm'
        ? 'Program kewangan sosial iTEKAD BangKIT/Maju untuk usahawan mikro berpendapatan rendah (B40 & Asnaf). Selain modal, peserta mendapat latihan perniagaan dan bimbingan berterusan daripada Bank Islam.'
        : 'iTEKAD BangKIT/Maju social finance programme for low-income (B40 & Asnaf) micro-entrepreneurs. Beyond capital, participants receive business training and ongoing mentorship from Bank Islam.',
      features: language === 'bm' ? [
        'Program kewangan sosial – kadar keuntungan sangat rendah',
        'Latihan perniagaan praktikal & bimbingan usahawan percuma',
        'Terbuka kepada peserta blacklist & usahawan baru'
      ] : [
        'Social finance programme – very low profit rate',
        'Free practical business training & entrepreneurship coaching',
        'Open to blacklisted & first-time entrepreneurs'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3 Bulan', 'Bukti Perniagaan / Lesen PBT', 'MyKad · Gambar Premis Perniagaan'] : ['3-Month Bank Statements', 'Business Proof / Local Council License', 'MyKad · Business Premise Photos']
    },
    {
      id: 'agrobank_mikro',
      name: 'Agrobank Pembiayaan Kredit Mikro-i',
      shortName: 'Agrobank Mikro',
      institution: 'Bank Pertanian Malaysia Berhad (Agrobank)',
      category: 'traditional_bank',
      categoryLabel: language === 'bm' ? 'Bank Pertanian Kerajaan' : 'Government Agricultural Bank',
      regulator: 'Bank Negara Malaysia (BNM) / MOF',
      rank: 4,
      rankLabel: language === 'bm' ? '#4 Terbaik Sektor Agro & Makanan' : '#4 Best for Agro & Food Sector',
      rate: 'dari 4.75% p.a. (baki berkurangan)',
      rateNumeric: 4.75,
      minIncome: language === 'bm' ? 'Perniagaan Berasaskan Pertanian / Agromakanan' : 'Agriculture / Agro-food Based Business',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '3 – 7 Hari Bekerja' : '3 – 7 Working Days',
      turnaroundHours: 96,
      maxLoan: 'RM 100,000',
      maxLoanNumeric: 100000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: false,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Khusus Sektor Agro & Luar Bandar' : 'Agro & Rural Sector Specialist',
      description: language === 'bm'
        ? 'Pembiayaan mikro Patuh Syariah (Tawarruq) daripada Agrobank untuk usahawan pertanian, pengusaha makanan, pesawah, penternak, dan peniaga produk kampung. Tanpa cagaran untuk kelayakan tertentu.'
        : 'Shariah-compliant (Tawarruq) micro-financing from Agrobank for agriculture entrepreneurs, food operators, paddy farmers, livestock breeders, and rural product traders. No collateral for eligible applicants.',
      features: language === 'bm' ? [
        'Kadar dari 4.75% setahun – antara terendah di Malaysia',
        'Tanpa cagaran fizikal untuk kelayakan tertentu',
        'Sokongan khas untuk sektor pertanian, makanan & luar bandar'
      ] : [
        'Rate from 4.75% p.a. – among the lowest in Malaysia',
        'No physical collateral for eligible applicants',
        'Special support for agricultural, food & rural sectors'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3–6 Bulan', 'Dokumen Pertanian / Lesen Perniagaan', 'MyKad · Bukti Aktiviti Pertanian'] : ['3–6 Months Bank Statements', 'Agricultural Documents / Business License', 'MyKad · Proof of Agricultural Activity']
    },
    {
      id: 'affin_mikro',
      name: 'Affin Bank SMEmerge Micro Financing',
      shortName: 'Affin SMEmerge',
      institution: 'Affin Bank Berhad / Affin Islamic Bank',
      category: 'traditional_bank',
      categoryLabel: language === 'bm' ? 'Bank Perdagangan' : 'Commercial Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 5,
      rankLabel: language === 'bm' ? '#5 Mesra Usahawan Baru' : '#5 Most Startup-Friendly',
      rate: language === 'bm' ? 'Berdasarkan skim (SRF: max 3.75% p.a.)' : 'Scheme-based (SRF: capped at 3.75% p.a.)',
      rateNumeric: 5.5,
      minIncome: language === 'bm' ? 'Operasi ≥ 12 Bulan (Startup: 12–24 bulan)' : 'In Operation ≥ 12 Months (Startup: 12–24 months)',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '3 – 7 Hari Bekerja' : '3 – 7 Working Days',
      turnaroundHours: 96,
      maxLoan: 'RM 300,000',
      maxLoanNumeric: 300000,
      tenure: language === 'bm' ? '12 – 84 Bulan' : '12 – 84 Months',
      tenureMonths: 84,
      shariah: true,
      isFast: false,
      isLowIncome: false,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Khas untuk Startup & PKS Baru' : 'Startup & Early-Stage SME Focused',
      description: language === 'bm'
        ? 'Skim SMEmerge Affin Bank yang direka khas untuk perusahaan baharu dan syarikat permulaan yang beroperasi antara 12–24 bulan. Menyertai jaminan CGC/SJPP untuk membantu usahawan muda tanpa rekod kredit kukuh.'
        : 'Affin Bank\'s SMEmerge scheme specifically designed for new enterprises and startups in operation between 12–24 months. Participates in CGC/SJPP guarantees to support young entrepreneurs without strong credit history.',
      features: language === 'bm' ? [
        'Sesuai untuk startup berumur 12–24 bulan tanpa rekod kredit panjang',
        'Menyertai jaminan CGC/SJPP – kelayakan lebih mudah',
        'Aplikasi digital melalui laman web Affin Always'
      ] : [
        'Ideal for 12–24 month startups without long credit history',
        'Participates in CGC/SJPP guarantee – easier qualification',
        'Digital application via Affin Always website'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank Syarikat 6 Bulan', 'Pendaftaran SSM · Penyata Kewangan', 'MyKad Pengarah'] : ['6-Month Business Bank Statements', 'SSM Registration · Financial Statements', 'Director MyKad']
    },
    {
      id: 'muamalat_mikro',
      name: 'Bank Muamalat Skim Pembiayaan Mikro-i',
      shortName: 'Bank Muamalat',
      institution: 'Bank Muamalat Malaysia Berhad',
      category: 'traditional_bank',
      categoryLabel: language === 'bm' ? 'Bank Islam Penuh' : 'Full Islamic Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 6,
      rankLabel: language === 'bm' ? '#6 Bank Islam Mikro Berdaftar BNM' : '#6 BNM-Registered Islamic Micro Bank',
      rate: 'dari 6.99% p.a. (tetap)',
      rateNumeric: 6.99,
      minIncome: language === 'bm' ? 'Warganegara Malaysia · SSM/PBT berdaftar' : 'Malaysian Citizen · SSM/PBT Registered',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '3 – 5 Hari Bekerja' : '3 – 5 Working Days',
      turnaroundHours: 72,
      maxLoan: 'RM 100,000',
      maxLoanNumeric: 100000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: false,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Peserta Skim Mikro BNM' : 'BNM Micro Scheme Participant',
      description: language === 'bm'
        ? 'Bank Muamalat Malaysia adalah peserta rasmi Skim Pembiayaan Mikro (SPM) Bank Negara Malaysia. Menawarkan pembiayaan mikro patuh Syariah untuk usahawan mikro berdaftar SSM dan pemohon individu.'
        : 'Bank Muamalat Malaysia is an official participant of Bank Negara Malaysia\'s Skim Pembiayaan Mikro (SPM). Offers Shariah-compliant micro-financing for SSM-registered micro-entrepreneurs and individual applicants.',
      features: language === 'bm' ? [
        'Peserta rasmi BNM Skim Pembiayaan Mikro (SPM)',
        'Kadar tetap dari 6.99% setahun – tiada kejutan bayaran',
        'Tiada cagaran fizikal untuk kelayakan SPM'
      ] : [
        'Official BNM Skim Pembiayaan Mikro (SPM) participant',
        'Fixed rate from 6.99% p.a. – no payment surprises',
        'No physical collateral under SPM qualification'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3–6 Bulan', 'Pendaftaran SSM / Permit PBT', 'MyKad · Gambar Premis Perniagaan'] : ['3–6 Months Bank Statements', 'SSM Registration / PBT Permit', 'MyKad · Business Premise Photos']
    },
    {
      id: 'aim',
      name: 'AIM Skim Pembiayaan Ikhtiar (PADURI Madani)',
      shortName: 'AIM (Amanah Ikhtiar)',
      institution: 'Amanah Ikhtiar Malaysia (AIM)',
      category: 'government_fund',
      categoryLabel: language === 'bm' ? 'Dana Kerajaan / B40' : 'Government Fund / B40',
      regulator: 'KUSKOP / Amanah Ikhtiar Malaysia',
      rank: 7,
      rankLabel: language === 'bm' ? '#7 Terbaik Wanita & Isi Rumah B40' : '#7 Best for Women & B40 Households',
      rate: '10% p.a. (kadar tetap standard)',
      rateNumeric: 10.0,
      minIncome: language === 'bm' ? 'Pendapatan Isi Rumah ≤ RM 5,880 / bulan' : 'Household Income ≤ RM 5,880 / month',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '7 – 14 Hari Bekerja' : '7 – 14 Working Days',
      turnaroundHours: 168,
      maxLoan: 'RM 30,000',
      maxLoanNumeric: 30000,
      tenure: language === 'bm' ? '12 – 36 Bulan' : '12 – 36 Months',
      tenureMonths: 36,
      shariah: true,
      isFast: false,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Terbuka kepada Pemegang Rekod Hitam' : 'Open to Blacklisted Applicants',
      description: language === 'bm'
        ? 'AIM menawarkan Skim Pembiayaan Ikhtiar (PADURI Madani) untuk isi rumah B40, wanita, Orang Asli, dan komuniti kurang bernasib baik. Terbuka kepada pemohon yang pernah blacklist atau bankrap. Tanpa penjamin atau cagaran.'
        : 'AIM offers the Skim Pembiayaan Ikhtiar (PADURI Madani) for B40 households, women, Orang Asli, and underserved communities. Open to previously blacklisted or bankrupt applicants. Zero guarantor or collateral required.',
      features: language === 'bm' ? [
        'Terbuka kepada pemohon blacklist & bankrap – tiada diskriminasi',
        'Tiada penjamin atau cagaran diperlukan',
        'Latihan keusahawanan & bimbingan berterusan percuma'
      ] : [
        'Open to blacklisted & bankrupt applicants – no discrimination',
        'Zero guarantor or collateral required',
        'Free entrepreneurship training & ongoing mentorship'
      ],
      requiredDocs: language === 'bm' ? ['MyKad · Kad OKU / Dokumen B40 (Jika Ada)', 'Bukti Aktiviti Perniagaan', 'Gambar Premis / Produk'] : ['MyKad · OKU Card / B40 Document (If Available)', 'Proof of Business Activity', 'Premise / Product Photos']
    },

    // ─── GOVERNMENT & COOPERATIVE MICRO CREDIT ──────────────────────────────
    {
      id: 'bsn',
      name: 'BSN MicroKredit',
      shortName: 'BSN MicroKredit',
      institution: 'Bank Simpanan Nasional (BSN)',
      category: 'government_fund',
      categoryLabel: language === 'bm' ? 'Kredit Mikro Kerajaan' : 'Micro-Credit (Gov)',
      regulator: 'MOF / Bank Negara Malaysia',
      rank: 8,
      rankLabel: language === 'bm' ? '#8 Kadar Faedah Terendah Malaysia' : '#8 Lowest Interest Rate in Malaysia',
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
      id: 'bank_rakyat',
      name: 'Bank Rakyat Pembiayaan Mikro-i',
      shortName: 'Bank Rakyat',
      institution: 'Bank Kerjasama Rakyat Malaysia Berhad',
      category: 'government_fund',
      categoryLabel: language === 'bm' ? 'Bank Koperasi Islamik' : 'Islamic Cooperative Bank',
      regulator: 'Bank Negara Malaysia / KUSKOP',
      rank: 9,
      rankLabel: language === 'bm' ? '#9 Terbaik Komuniti Koperasi & B40' : '#9 Best for Cooperative Members & B40',
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
      category: 'government_fund',
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

    // ─── AEON CREDIT (NON-BANK MICRO CREDIT) ────────────────────────────────
    {
      id: 'aeon',
      name: 'AEON Credit i-Cash',
      shortName: 'AEON Credit',
      institution: 'AEON Credit Service (M) Berhad',
      category: 'micro_credit',
      categoryLabel: language === 'bm' ? 'Pembiayaan Bukan Bank' : 'Non-Bank Financing',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 11,
      rankLabel: language === 'bm' ? '#11 Popular Sewa Beli & Tunai' : '#11 Popular for Hire Purchase & Cash',
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

    // ─── P2P CROWDFUNDING ────────────────────────────────────────────────────
    {
      id: 'fundingsocieties',
      name: 'Funding Societies Micro Financing',
      shortName: 'Funding Societies',
      institution: 'Modalku Ventures Sdn Bhd',
      category: 'p2p',
      categoryLabel: language === 'bm' ? 'P2P / Pendanaan Awam' : 'P2P Crowdfunding',
      regulator: 'Securities Commission Malaysia (SC)',
      rank: 12,
      rankLabel: language === 'bm' ? '#12 Had Pinjaman Modal Tertinggi' : '#12 Highest Business Loan Cap',
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
      id: 'alliance_mikro',
      name: 'Alliance Digital SME Micro Financing',
      shortName: 'Alliance SME',
      institution: 'Alliance Bank Malaysia Berhad',
      category: 'traditional_bank',
      categoryLabel: language === 'bm' ? 'Bank Perdagangan' : 'Commercial Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 12,
      rankLabel: language === 'bm' ? '#12 Kelulusan Digital 24 Jam' : '#12 24-Hour Digital Approval',
      rate: '6.50% – 12.0% p.a.',
      rateNumeric: 6.5,
      minIncome: language === 'bm' ? 'Jualan Tahunan ≥ RM 50,000' : 'Annual Sales ≥ RM 50,000',
      minIncomeNumeric: 4000,
      turnaround: language === 'bm' ? '24 Jam (Digital)' : '24 Hours (Digital)',
      turnaroundHours: 24,
      maxLoan: 'RM 200,000',
      maxLoanNumeric: 200000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: true,
      isLowIncome: false,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Permohonan Digital Tanpa Kertas' : '100% Paperless Digital',
      description: language === 'bm'
        ? 'Pembiayaan digital PKS tanpa cagaran daripada Alliance Bank. Menilai penyata bank digital dengan kelulusan pantas seawal 24 jam untuk usahawan mikro dan peruncit.'
        : 'Collateral-free digital SME micro-financing from Alliance Bank. Evaluates digital bank statements with fast conditional approval in 24 hours for micro-traders and retailers.',
      features: language === 'bm' ? [
        'Permohonan digital 100% tanpa perlu ke cawangan fizikal',
        'Kelulusan bersyarat sepantas 24 jam',
        'Tiada cagaran atau cagaran aset tetap'
      ] : [
        '100% paperless digital onboarding without branch visits',
        'Fast conditional approval within 24 hours',
        'Zero fixed asset collateral required'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank Syarikat 6 Bulan (PDF)', 'Pendaftaran SSM', 'MyKad Pengarah / Pemilik'] : ['6-Month Company Bank Statements (PDF)', 'SSM Business Registration', 'Director / Owner MyKad']
    },
    {
      id: 'ambank_mikro',
      name: 'AmBank BizClub Micro SME (CGC BizMula-i)',
      shortName: 'AmBank BizClub',
      institution: 'AmBank (M) Berhad / AmBank Islamic',
      category: 'traditional_bank',
      categoryLabel: language === 'bm' ? 'Bank Perdagangan' : 'Commercial Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 13,
      rankLabel: language === 'bm' ? '#13 Sokongan Jaminan CGC BizMula' : '#13 CGC BizMula Guarantee Backed',
      rate: '5.50% – 9.00% p.a.',
      rateNumeric: 5.5,
      minIncome: language === 'bm' ? 'Operasi Perniagaan ≥ 6 Bulan' : 'Business in Operation ≥ 6 Months',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '3 – 5 Hari Bekerja' : '3 – 5 Working Days',
      turnaroundHours: 72,
      maxLoan: 'RM 300,000',
      maxLoanNumeric: 300000,
      tenure: language === 'bm' ? '12 – 84 Bulan' : '12 – 84 Months',
      tenureMonths: 84,
      shariah: true,
      isFast: false,
      isLowIncome: false,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Mesra PKS Awal Operasi (≥6 Bulan)' : 'Early-Stage Friendly (≥6 Mos)',
      description: language === 'bm'
        ? 'Pembiayaan AmBank BizClub dengan jaminan Credit Guarantee Corporation (CGC BizMula-i). Sesuai untuk perniagaan yang baru beroperasi 6 bulan ke atas untuk pembelian stok dan modal kerja.'
        : 'AmBank BizClub micro-financing backed by Credit Guarantee Corporation (CGC BizMula-i). Designed for businesses in operation for at least 6 months to fund stock inventory and cash flow.',
      features: language === 'bm' ? [
        'Terbuka kepada perniagaan yang baru beroperasi 6 bulan',
        'Jaminan sehingga 70% daripada Credit Guarantee Corporation (CGC)',
        'Pakej konvensional dan patuh Syariah tersedia'
      ] : [
        'Open to businesses operating for just 6 months',
        'Up to 70% guarantee coverage by CGC Malaysia',
        'Both conventional & Shariah-compliant facilities available'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank Syarikat 6 Bulan', 'Pendaftaran SSM', 'MyKad & Gambar Premis'] : ['6-Month Bank Statements', 'SSM Certificate', 'MyKad & Premise Photos']
    },
    {
      id: 'public_bank_mikro',
      name: 'Public Bank PB Micro Financing (SPM)',
      shortName: 'Public Bank Mikro',
      institution: 'Public Bank Berhad',
      category: 'traditional_bank',
      categoryLabel: language === 'bm' ? 'Bank Perdagangan' : 'Commercial Bank',
      regulator: 'Bank Negara Malaysia (BNM)',
      rank: 14,
      rankLabel: language === 'bm' ? '#14 Bank Runcit Paling Teguh' : '#14 Strongest Retail Banking Track Record',
      rate: '9.0% – 12.0% p.a. (tetap)',
      rateNumeric: 9.0,
      minIncome: language === 'bm' ? 'Operasi Perniagaan ≥ 2 Tahun' : 'Business in Operation ≥ 2 Years',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '3 – 5 Hari Bekerja' : '3 – 5 Working Days',
      turnaroundHours: 72,
      maxLoan: 'RM 50,000',
      maxLoanNumeric: 50000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: false,
      isFast: false,
      isLowIncome: false,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Peserta Skim SPM BNM' : 'BNM SPM Scheme Participant',
      description: language === 'bm'
        ? 'Skim Pembiayaan Mikro rasmi Public Bank di bawah inisiatif Bank Negara Malaysia. Direka khas untuk peniaga pasar, peruncit komuniti, dan penjaja berlesen tanpa memerlukan cagaran hartanah.'
        : 'Official Public Bank Micro Financing under Bank Negara Malaysia SPM framework. Tailored for market stall operators, community retailers, and licensed hawkers without property collateral.',
      features: language === 'bm' ? [
        'Tiada cagaran hartanah atau penjamin pihak ketiga',
        'Kadar bayaran ansuran bulanan yang tetap dan jelas',
        'Rangkaian cawangan Public Bank yang meluas di seluruh negara'
      ] : [
        'Zero property collateral or third-party guarantor required',
        'Fixed and transparent monthly repayment installments',
        'Extensive nationwide Public Bank branch support network'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 6 Bulan', 'Lesen Perniagaan / PBT / SSM', 'MyKad Pemohon'] : ['6-Month Bank Statements', 'Business License / Local Council Permit / SSM', 'Applicant MyKad']
    },
    {
      id: 'sme_bank_mikro',
      name: 'SME Bank Skim Pembiayaan Usahawan Mikro (SPUM)',
      shortName: 'SME Bank SPUM',
      institution: 'Small Medium Enterprise Development Bank Malaysia Berhad',
      category: 'government_fund',
      categoryLabel: language === 'bm' ? 'Bank Pembangunan Kerajaan' : 'Gov Development Bank',
      regulator: 'KUSKOP / Bank Negara Malaysia',
      rank: 15,
      rankLabel: language === 'bm' ? '#15 Dana Pembangunan Usahawan KUSKOP' : '#15 KUSKOP Entrepreneur Development Fund',
      rate: '4.0% – 5.0% p.a. (Kadar Subsidi)',
      rateNumeric: 4.0,
      minIncome: language === 'bm' ? 'Usahawan Mikro / Belia / Graduan' : 'Micro-Entrepreneurs / Youth / Graduates',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '5 – 10 Hari Bekerja' : '5 – 10 Working Days',
      turnaroundHours: 120,
      maxLoan: 'RM 50,000',
      maxLoanNumeric: 50000,
      tenure: language === 'bm' ? '12 – 60 Bulan' : '12 – 60 Months',
      tenureMonths: 60,
      shariah: true,
      isFast: false,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Kadar Subsidi Kerajaan (4%)' : 'Subsidized Gov Rate (4%)',
      description: language === 'bm'
        ? 'Skim Pembiayaan Usahawan Mikro (SPUM) oleh SME Bank untuk membiayai pembelian mesin, peralatan, dan modal pusingan usahawan mikro Bumiputera dan belia berpendapatan rendah.'
        : 'Skim Pembiayaan Usahawan Mikro (SPUM) by SME Bank to finance machinery purchase, equipment, and working capital for micro-entrepreneurs, youth, and low-income business starters.',
      features: language === 'bm' ? [
        'Kadar keuntungan bersubsidi serendah 4.0% setahun',
        'Khidmat bimbingan usahawan melalui CEDAR SME Bank',
        'Tempoh moratorium bayaran pokok pada peringkat permulaan'
      ] : [
        'Subsidized profit rate as low as 4.0% per annum',
        'Free entrepreneur mentorship through CEDAR SME Bank',
        'Principal moratorium grace period during initial months'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 3–6 Bulan', 'Pendaftaran SSM', 'Rancangan Perniagaan / Kertas Kerja Ringkas', 'MyKad'] : ['3–6 Months Bank Statements', 'SSM Registration', 'Brief Business Plan / Proposal', 'MyKad']
    },
    {
      id: 'mara_spim',
      name: 'MARA Skim Pembiayaan Mudah Jaya (SPiM / SPiKE)',
      shortName: 'MARA SPiM',
      institution: 'Majlis Amanah Rakyat (MARA)',
      category: 'government_fund',
      categoryLabel: language === 'bm' ? 'Agensi Kerajaan / Bumiputera' : 'Government Agency / Bumiputera',
      regulator: 'Kementerian Kemajuan Desa dan Wilayah (KKDW)',
      rank: 16,
      rankLabel: language === 'bm' ? '#16 Dana Penuh Bumiputera & Kontrak' : '#16 Bumiputera & Contract Gig Fund',
      rate: '4.0% p.a. (Kadar Keuntungan Tetap)',
      rateNumeric: 4.0,
      minIncome: language === 'bm' ? 'Warganegara Bumiputera ≥ 18 Tahun' : 'Bumiputera Citizen ≥ 18 Years',
      minIncomeNumeric: 0,
      turnaround: language === 'bm' ? '7 – 14 Hari Bekerja' : '7 – 14 Working Days',
      turnaroundHours: 168,
      maxLoan: 'RM 100,000',
      maxLoanNumeric: 100000,
      tenure: language === 'bm' ? '12 – 84 Bulan' : '12 – 84 Months',
      tenureMonths: 84,
      shariah: true,
      isFast: false,
      isLowIncome: true,
      isBusiness: true,
      highlightBadge: language === 'bm' ? 'Kadar MARA 4% · Tempoh Sehingga 7 Tahun' : 'MARA 4% Rate · Up to 7-Year Tenure',
      description: language === 'bm'
        ? 'Skim pembiayaan perniagaan mikro & kecil MARA untuk usahawan Bumiputera dalam sektor peruncitan, perkhidmatan, dan pembekalan kontrak (SPiKE) dengan tempoh bayaran balik fleksibel.'
        : 'MARA micro and small business financing scheme for Bumiputera entrepreneurs in retail, services, and contract supply (SPiKE) with flexible repayment tenures up to 7 years.',
      features: language === 'bm' ? [
        'Kadar keuntungan tetap 4% setahun tanpa caj tersembunyi',
        'Tempoh bayaran balik panjang sehingga 7 tahun (84 bulan)',
        'Sokongan pembiayaan kontrak & pesanan bekalan ekspres (SPiKE)'
      ] : [
        'Fixed 4% profit rate with zero hidden processing charges',
        'Long repayment tenure up to 7 years (84 months)',
        'Express contract supply & invoice financing support (SPiKE)'
      ],
      requiredDocs: language === 'bm' ? ['Penyata Bank 6 Bulan', 'Pendaftaran SSM / Lesen PBT', 'Rancangan Perniagaan / Kertas Kerja Ringkas', 'MyKad Pemohon'] : ['6-Month Bank Statements', 'SSM Certificate / Local Council Permit', 'Business Proposal / Plan Summary', 'Applicant MyKad']
    },
    {
      id: 'fundingsocieties',
      name: 'Funding Societies Micro Financing',
      shortName: 'Funding Societies',
      institution: 'Modalku Ventures Sdn Bhd',
      category: 'p2p',
      categoryLabel: language === 'bm' ? 'P2P / Pendanaan Awam' : 'P2P Crowdfunding',
      regulator: 'Securities Commission Malaysia (SC)',
      rank: 17,
      rankLabel: language === 'bm' ? '#17 Had Pinjaman Modal Tertinggi' : '#17 Highest Business Loan Cap',
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
      id: 'capbay',
      name: 'CapBay Supply Chain Financing',
      shortName: 'CapBay',
      institution: 'Bay Group Holdings Sdn Bhd',
      category: 'p2p',
      categoryLabel: language === 'bm' ? 'P2P & Pembiayaan Invois' : 'P2P & Invoice Financing',
      regulator: 'Securities Commission Malaysia (SC)',
      rank: 18,
      rankLabel: language === 'bm' ? '#18 Had Pembiayaan Sehingga RM 500,000' : '#18 Highest Working Capital Limit',
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
                ? 'Bandingkan pelbagai skim pembiayaan mikro daripada bank perdagangan, institusi kerajaan, dan platform P2P yang tersedia di Malaysia. Loan-La membantu anda memilih skim yang paling sesuai dengan profil kewangan anda.'
                : 'Compare micro-financing schemes from commercial banks, government institutions, and P2P platforms available in Malaysia. Loan-La helps you identify the best-fit scheme based on your financial profile.'}
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
            { id: 'traditional_bank', label: language === 'bm' ? '🏦 Bank Perdagangan' : '🏦 Commercial Banks', count: lenders.filter(l => l.category === 'traditional_bank').length },
            { id: 'government_fund', label: language === 'bm' ? '🏛️ Dana & Koperasi Kerajaan' : '🏛️ Gov Funds & Coops', count: lenders.filter(l => l.category === 'government_fund').length },
            { id: 'micro_credit', label: language === 'bm' ? '💳 Kredit Bukan Bank' : '💳 Non-Bank Credit', count: lenders.filter(l => l.category === 'micro_credit').length },
            { id: 'p2p', label: '🤝 P2P Crowdfunding', count: lenders.filter(l => l.category === 'p2p').length },
            { id: 'shariah', label: language === 'bm' ? '☪️ Patuh Syariah' : '☪️ Islamic (Shariah)', count: lenders.filter(l => l.shariah).length },
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
