'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, User, Landmark, Briefcase, ShieldCheck, 
  CheckCircle2, Lock, Check
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface UserProfileData {
  name: string;
  phone: string;
  role?: string;
  profileId?: string;
  icNumber?: string;
  email?: string;
  address?: string;
  postcode?: string;
  state?: string;
  // Banking & Disbursement details
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankAccountType?: 'savings' | 'current';
  // Work & Platform Profile
  workCategory?: string;
  platformName?: string;
  platformId?: string;
  estimatedMonthlyIncome?: number;
  epfStatus?: 'active' | 'i-saraan' | 'none';
}

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserProfileData | null;
  onSaveProfile: (updated: UserProfileData) => void;
}

const MALAYSIAN_BANKS = [
  { id: 'maybank', name: 'Maybank (Malayan Banking Berhad)' },
  { id: 'cimb', name: 'CIMB Bank Berhad' },
  { id: 'public_bank', name: 'Public Bank Berhad' },
  { id: 'rhb', name: 'RHB Bank Berhad' },
  { id: 'hong_leong', name: 'Hong Leong Bank Berhad' },
  { id: 'ambank', name: 'AmBank (M) Berhad' },
  { id: 'bank_islam', name: 'Bank Islam Malaysia Berhad' },
  { id: 'alliance', name: 'Alliance Bank Malaysia Berhad' },
  { id: 'affin', name: 'Affin Bank Berhad' },
  { id: 'bank_muamalat', name: 'Bank Muamalat Malaysia Berhad' },
  { id: 'bsn', name: 'Bank Simpanan Nasional (BSN)' },
  { id: 'gxbank', name: 'GXBank (Digital Bank)' },
  { id: 'boost_bank', name: 'Boost Bank (Digital Bank)' },
  { id: 'aeon_bank', name: 'AEON Bank (Digital Islamic Bank)' },
];

const MALAYSIAN_STATES = [
  'Selangor', 'Kuala Lumpur', 'Johor', 'Penang', 'Perak', 
  'Kedah', 'Pahang', 'Negeri Sembilan', 'Melaka', 'Sabah', 
  'Sarawak', 'Terengganu', 'Kelantan', 'Perlis', 'Putrajaya', 'Labuan'
];

export default function UserSettingsModal({
  isOpen,
  onClose,
  userSession,
  onSaveProfile
}: UserSettingsModalProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'banking' | 'work'>('profile');
  const [savedNotice, setSavedNotice] = useState(false);

  // Form Fields State
  const [name, setName] = useState(userSession?.name || 'Tham Ren Sheng');
  const [icNumber, setIcNumber] = useState(userSession?.icNumber || '891012-14-5566');
  const [phone, setPhone] = useState(userSession?.phone || '+60 12-482 9182');
  const [email, setEmail] = useState(userSession?.email || 'ahmad.razak@gmail.com');
  const [address, setAddress] = useState(userSession?.address || 'No. 18, Jalan USJ 4/1');
  const [postcode, setPostcode] = useState(userSession?.postcode || '47600');
  const [stateName, setStateName] = useState(userSession?.state || 'Selangor');

  // Banking
  const [bankName, setBankName] = useState(userSession?.bankName || 'Maybank (Malayan Banking Berhad)');
  const [bankAccountNumber, setBankAccountNumber] = useState(userSession?.bankAccountNumber || '114012849201');
  const [bankAccountHolder, setBankAccountHolder] = useState(userSession?.bankAccountHolder || userSession?.name || 'Tham Ren Sheng');
  const [bankAccountType, setBankAccountType] = useState<'savings' | 'current'>(userSession?.bankAccountType || 'savings');

  // Work & Platform
  const [workCategory, setWorkCategory] = useState(userSession?.workCategory || 'gig');
  const [platformName, setPlatformName] = useState(userSession?.platformName || 'Grab / Foodpanda');
  const [platformId, setPlatformId] = useState(userSession?.platformId || 'GBR-884219');
  const [estimatedMonthlyIncome, setEstimatedMonthlyIncome] = useState<number>(userSession?.estimatedMonthlyIncome || 3500);
  const [epfStatus, setEpfStatus] = useState<'active' | 'i-saraan' | 'none'>(userSession?.epfStatus || 'i-saraan');

  // Synchronize when userSession changes
  useEffect(() => {
    if (userSession) {
      setName(userSession.name || 'Tham Ren Sheng');
      setIcNumber(userSession.icNumber || '891012-14-5566');
      setPhone(userSession.phone || '+60 12-482 9182');
      setEmail(userSession.email || 'ahmad.razak@gmail.com');
      setAddress(userSession.address || 'No. 18, Jalan USJ 4/1');
      setPostcode(userSession.postcode || '47600');
      setStateName(userSession.state || 'Selangor');

      setBankName(userSession.bankName || 'Maybank (Malayan Banking Berhad)');
      setBankAccountNumber(userSession.bankAccountNumber || '114012849201');
      setBankAccountHolder(userSession.bankAccountHolder || userSession.name || 'Tham Ren Sheng');
      setBankAccountType(userSession.bankAccountType || 'savings');

      setWorkCategory(userSession.workCategory || 'gig');
      setPlatformName(userSession.platformName || 'Grab / Foodpanda');
      setPlatformId(userSession.platformId || 'GBR-884219');
      setEstimatedMonthlyIncome(userSession.estimatedMonthlyIncome || 3500);
      setEpfStatus(userSession.epfStatus || 'i-saraan');
    }
  }, [userSession]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData: UserProfileData = {
      name,
      icNumber,
      phone,
      email,
      address,
      postcode,
      state: stateName,
      bankName,
      bankAccountNumber,
      bankAccountHolder,
      bankAccountType,
      workCategory,
      platformName,
      platformId,
      estimatedMonthlyIncome,
      epfStatus,
      role: userSession?.role || 'Gig Worker / Self-Employed',
      profileId: userSession?.profileId || 'borrower'
    };

    onSaveProfile(updatedData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col h-[560px] max-h-[90vh] overflow-hidden my-auto">
        
        {/* Clean Corporate Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {language === 'bm' ? 'Tetapan Profil & Akaun Bank' : 'Profile & Bank Account Settings'}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer text-sm font-semibold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modern Segmented Tab Switcher - Fully Responsive for Mobile & Desktop */}
        <div className="px-3 sm:px-6 pt-3 bg-white shrink-0">
          <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-1/3 py-2 px-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer overflow-hidden ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {language === 'bm' ? '1. Identiti' : '1. Identity'}
                <span className="hidden md:inline">{language === 'bm' ? ' & Peribadi' : ' & Personal'}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('banking')}
              className={`w-1/3 py-2 px-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer overflow-hidden ${
                activeTab === 'banking'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {language === 'bm' ? '2. Bank Payout' : '2. Banking'}
                <span className="hidden md:inline">{language === 'bm' ? '' : ' & Payout'}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('work')}
              className={`w-1/3 py-2 px-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer overflow-hidden ${
                activeTab === 'work'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {language === 'bm' ? '3. Pendapatan' : '3. Work & Income'}
              </span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col justify-between gap-4">
          
          {/* TAB 1: IDENTITY & PERSONAL INFO */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {language === 'bm'
                    ? 'Maklumat nama penuh dan MyKad diperlukan oleh institusi perbankan berlesen di Malaysia untuk semakan kelayakan CCRIS/CTOS serta perjanjian kemudahan kredit.'
                    : 'Your legal name and MyKad number are required by licensed banks for CCRIS/CTOS eligibility checks and official loan disbursement contracts.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Nama Penuh (Seperti Dalam MyKad) *' : 'Full Legal Name (as per MyKad) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tham Ren Sheng"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'No. Kad Pengenalan (MyKad) *' : 'MyKad / IC Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={icNumber}
                    onChange={(e) => setIcNumber(e.target.value)}
                    placeholder="e.g. 891012-14-5566"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Nombor Telefon Bimbit (WhatsApp) *' : 'Mobile Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +60 12-482 9182"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Emel Notifikasi *' : 'Email Address (For Notices) *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ahmad.razak@gmail.com"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'bm' ? 'Alamat Kediaman Semasa' : 'Current Residential Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. No. 18, Jalan USJ 4/1, Subang Jaya"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Poskod' : 'Postcode'}
                  </label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="e.g. 47600"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Negeri' : 'State'}
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  >
                    {MALAYSIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BANKING & DISBURSEMENT */}
          {activeTab === 'banking' && (
            <div className="flex flex-col gap-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
                <Landmark className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {language === 'bm'
                    ? 'Akaun bank ini digunakan untuk mengesahkan penyata dan memindahkan wang pinjaman yang diluluskan secara terus (Direct Payout).'
                    : 'This primary bank account receives your approved loan disbursement funds and is verified against your statements during underwriting.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'bm' ? 'Pilihan Bank Utama *' : 'Primary Receiving Bank *'}
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                >
                  {MALAYSIAN_BANKS.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Nombor Akaun Bank *' : 'Bank Account Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g. 114012849201"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {language === 'bm' ? 'Nombor akaun sahaja tanpa sengkang' : 'Digits only without hyphens'}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Nama Pemegang Akaun *' : 'Account Holder Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Must match MyKad name"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {language === 'bm' ? 'Mesti sepadan dengan nama MyKad pemohon' : 'Must match applicant MyKad name'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'bm' ? 'Jenis Akaun Bank' : 'Bank Account Type'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBankAccountType('savings')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                      bankAccountType === 'savings'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {language === 'bm' ? 'Akaun Simpanan (Savings)' : 'Savings Account'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBankAccountType('current')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                      bankAccountType === 'current'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {language === 'bm' ? 'Akaun Semasa (Current)' : 'Current Account'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WORK & PLATFORM PROFILE */}
          {activeTab === 'work' && (
            <div className="flex flex-col gap-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
                <Briefcase className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {language === 'bm'
                    ? 'Penetapan profil pendapatan membantu sistem memadankan produk pembiayaan mikro dan kadar faedah yang sesuai.'
                    : 'Setting your primary platform allows our engine to calculate your DSR and match gig-tailored financing products.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'bm' ? 'Kategori Pekerjaan Utama' : 'Primary Employment Category'}
                </label>
                <select
                  value={workCategory}
                  onChange={(e) => setWorkCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                >
                  <option value="gig">{language === 'bm' ? 'Pekerja Gig (Grab, Foodpanda, Lalamove, ShopeeFood, dsb.)' : 'Gig Economy Worker (Grab, Foodpanda, Lalamove, etc.)'}</option>
                  <option value="freelancer">{language === 'bm' ? 'Pekerja Bebas / Kontraktor Digital (Freelancer)' : 'Freelancer / Digital Contractor'}</option>
                  <option value="sme">{language === 'bm' ? 'Perniagaan Mikro / Peniaga Tunggal (SSM)' : 'Sole Proprietor / Micro Business Owner'}</option>
                  <option value="salaried">{language === 'bm' ? 'Pekerja Bergaji (Swasta / Kerajaan)' : 'Salaried Employee (Private / Public Sector)'}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Nama Platform / Perniagaan' : 'Primary Platform / Business Name'}
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    placeholder="e.g. Grab / Foodpanda"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'ID Pemandu / No. SSM (Pilihan)' : 'Platform ID / SSM (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={platformId}
                    onChange={(e) => setPlatformId(e.target.value)}
                    placeholder="e.g. GBR-884219"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Anggaran Pendapatan Kasar Bulanan (RM)' : 'Estimated Monthly Gross Inflow (RM)'}
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={estimatedMonthlyIncome}
                    onChange={(e) => setEstimatedMonthlyIncome(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 font-semibold outline-hidden transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {language === 'bm' ? 'Status Caruman KWSP / i-Saraan' : 'EPF (KWSP) / i-Saraan Status'}
                  </label>
                  <select
                    value={epfStatus}
                    onChange={(e) => setEpfStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden transition-colors shadow-2xs font-normal"
                  >
                    <option value="i-saraan">{language === 'bm' ? 'Caruman Sendiri (i-Saraan KWSP)' : 'Self-Contributed (EPF i-Saraan)'}</option>
                    <option value="active">{language === 'bm' ? 'Caruman Majikan Aktif' : 'Active Employer EPF Contribution'}</option>
                    <option value="none">{language === 'bm' ? 'Tiada Caruman KWSP' : 'No Active EPF'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {language === 'bm' ? 'Batal' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {savedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'bm' ? 'Tersimpan' : 'Saved'}</span>
                </>
              ) : (
                <span>{language === 'bm' ? 'Simpan Perubahan' : 'Save Changes'}</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
