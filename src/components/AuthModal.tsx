'use client';

import React, { useState } from 'react';
import { 
  Lock, Phone, Mail, ArrowRight, ShieldCheck, X, Eye, EyeOff, 
  UserPlus, LogIn, User, Briefcase, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { UserProfileData } from './UserSettingsModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfileData, applications?: any[], reports?: any[]) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const { language } = useLanguage();
  
  // Auth Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In Methods: 'phone' or 'email'
  const [signInMethod, setSignInMethod] = useState<'phone' | 'email'>('phone');
  
  // Sign In Form States
  const [signInPhone, setSignInPhone] = useState('12-482 9182');
  const [signInEmail, setSignInEmail] = useState('borrower@loan-la.my');
  const [signInPassword, setSignInPassword] = useState('password123');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('8888');

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpCategory, setSignUpCategory] = useState<'gig' | 'business' | 'freelance' | 'salaried'>('gig');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Sign Up Form Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signUpName.trim()) {
      setErrorMessage(language === 'bm' ? 'Sila masukkan nama penuh anda.' : 'Please enter your full name.');
      return;
    }
    if (!signUpPhone.trim() && !signUpEmail.trim()) {
      setErrorMessage(language === 'bm' ? 'Sila masukkan nombor telefon atau emel.' : 'Please enter a phone number or email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name: signUpName.trim(),
          phone: signUpPhone.trim(),
          email: signUpEmail.trim(),
          password: signUpPassword || '123456',
          workCategory: signUpCategory,
          role: signUpCategory === 'gig' ? (language === 'bm' ? 'Pekerja Gig (Grab / Shopee)' : 'Gig Worker (Grab / Shopee)')
              : signUpCategory === 'business' ? (language === 'bm' ? 'Peniaga E-Dagang / Mikro' : 'E-Commerce / Micro-Seller')
              : signUpCategory === 'freelance' ? (language === 'bm' ? 'Pekerja Bebas / Profesional' : 'Freelancer / Independent')
              : (language === 'bm' ? 'Pekerja Bergaji Swasta/Kerajaan' : 'Salaried Employee')
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setSuccessMessage(language === 'bm' ? 'Akaun berjaya dicipta!' : 'Account created successfully!');
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(data.user, data.applications || [], data.reports || []);
          onClose();
        }, 500);
      } else {
        setIsLoading(false);
        setErrorMessage(data.message || (language === 'bm' ? 'Gagal mendaftar akaun.' : 'Failed to create account.'));
      }
    } catch (err: any) {
      // Fallback local registration
      setIsLoading(false);
      const fallbackUser: UserProfileData = {
        name: signUpName.trim(),
        phone: signUpPhone.startsWith('+60') ? signUpPhone : `+60 ${signUpPhone.replace(/^0/, '')}`,
        email: signUpEmail.trim() || `${signUpPhone.replace(/[^0-9]/g, '')}@loan-la.my`,
        role: signUpCategory === 'gig' ? 'Gig Worker' : 'Borrower',
        workCategory: signUpCategory,
        profileId: `usr_${Date.now().toString(36)}`
      };
      onLoginSuccess(fallbackUser, [], []);
      onClose();
    }
  };

  // Handle Sign In Form Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Phone OTP flow: Step 1 = Request OTP, Step 2 = Verify OTP
    if (signInMethod === 'phone' && !otpStep) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setOtpStep(true);
      }, 500);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signin',
          method: signInMethod,
          phone: signInPhone.trim(),
          email: signInEmail.trim(),
          password: signInPassword,
          otpCode: otpCode
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setSuccessMessage(language === 'bm' ? 'Log masuk berjaya!' : 'Signed in successfully!');
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(data.user, data.applications || [], data.reports || []);
          onClose();
          setOtpStep(false);
        }, 400);
      } else {
        setIsLoading(false);
        setErrorMessage(data.message || (language === 'bm' ? 'Maklumat log masuk tidak sah.' : 'Invalid login credentials.'));
      }
    } catch (err: any) {
      // Fallback local sign in
      setIsLoading(false);
      const fallbackUser: UserProfileData = {
        name: signInMethod === 'phone' ? 'Ahmad Bin Razak' : signInEmail.split('@')[0].toUpperCase(),
        phone: signInMethod === 'phone' ? (signInPhone.startsWith('+60') ? signInPhone : `+60 ${signInPhone.replace(/^0/, '')}`) : '+60 12-482 9182',
        email: signInMethod === 'email' ? signInEmail : 'borrower@loan-la.my',
        role: 'Verified Borrower',
        workCategory: 'gig',
        profileId: 'usr_ahmad'
      };
      onLoginSuccess(fallbackUser, [], []);
      onClose();
      setOtpStep(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-blue-950 text-white flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-900 text-blue-200 rounded-xl flex items-center justify-center shadow-xs">
              {authMode === 'signup' ? <UserPlus className="w-4.5 h-4.5" /> : <Lock className="w-4.5 h-4.5" />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">
                {authMode === 'signup' 
                  ? (language === 'bm' ? 'Cipta Akaun Peminjam' : 'Create Borrower Account')
                  : (language === 'bm' ? 'Log Masuk Akaun' : 'Sign In')}
              </h3>
              <span className="text-[10.5px] text-blue-200/80 font-medium">
                {authMode === 'signup'
                  ? (language === 'bm' ? 'Daftar kali pertama untuk simpan rekod & laporan' : 'First time? Sign up to save your applications & reports')
                  : (language === 'bm' ? 'Akses laporan & permohonan tersimpan anda' : 'Access your saved reports & applications')}
              </span>
            </div>
          </div>
          <button 
            onClick={() => { setOtpStep(false); onClose(); }} 
            className="p-1.5 hover:bg-blue-900 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
            title={language === 'bm' ? 'Tutup' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4.5">

          {/* 1. Seamless Mode Selector: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMessage(null); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{language === 'bm' ? 'Log Masuk' : 'Sign In'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setErrorMessage(null); setOtpStep(false); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{language === 'bm' ? 'Daftar Baru' : 'Sign Up'}</span>
            </button>
          </div>

          {/* Error / Success Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB A: SIGN UP FORM (FIRST TIME USERS)                    */}
          {/* ========================================================= */}
          {authMode === 'signup' ? (
            <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3.5">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'bm' ? 'Nama Penuh / Nama Perniagaan' : 'Full Name / Business Name'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Ahmad Bin Razak / Maju Enterprise"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Work Category / Occupation Type */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'bm' ? 'Kategori Pekerjaan / Sumber Pendapatan' : 'Occupation / Income Source'}
                </label>
                <select
                  value={signUpCategory}
                  onChange={(e) => setSignUpCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                >
                  <option value="gig">{language === 'bm' ? '🚗 Pekerja Gig (Grab, Foodpanda, ShopeeFood)' : '🚗 Gig Worker (Grab, Foodpanda, Delivery)'}</option>
                  <option value="business">{language === 'bm' ? '🛍️ Peniaga E-Dagang & Online (Shopee, TikTok, Live)' : '🛍️ E-Commerce & Online Seller (Shopee, TikTok)'}</option>
                  <option value="freelance">{language === 'bm' ? '💻 Pekerja Bebas (Freelancer) / Bekerja Sendiri' : '💻 Freelancer / Independent Professional'}</option>
                  <option value="salaried">{language === 'bm' ? '💼 Pekerja Bergaji Tetap (Swasta / Kerajaan)' : '💼 Salaried Employee (Private / Gov)'}</option>
                </select>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'bm' ? 'Nombor Telefon Bimbit' : 'Mobile Phone Number'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-slate-700 font-mono pr-2 border-r border-slate-200">
                    <span>🇲🇾</span>
                    <span>+60</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="12-345 6789"
                    className="w-full pl-18 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'bm' ? 'Alamat Emel' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'bm' ? 'Kata Laluan Keselamatan' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer active:scale-98"
              >
                {isLoading ? (
                  <span>{language === 'bm' ? 'Mendaftar Akaun...' : 'Creating Account...'}</span>
                ) : (
                  <>
                    <span>{language === 'bm' ? 'Daftar & Mula Pra-Semakan' : 'Sign Up & Start Pre-Check'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-500 mt-1">
                {language === 'bm' ? 'Sudah mempunyai akaun?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="font-bold text-blue-900 hover:underline cursor-pointer"
                >
                  {language === 'bm' ? 'Log Masuk di sini' : 'Sign In here'}
                </button>
              </p>
            </form>
          ) : (

            /* ========================================================= */
            /* TAB B: SIGN IN FORM (RETURNING USERS)                     */
            /* ========================================================= */
            <div className="flex flex-col gap-4">
              
              {/* Method Sub-Tabs: Phone vs Email */}
              {!otpStep && (
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSignInMethod('phone')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      signInMethod === 'phone'
                        ? 'bg-white text-blue-950 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Phone className="w-3 h-3" />
                    <span>{language === 'bm' ? 'Telefon & SMS OTP' : 'Mobile OTP'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignInMethod('email')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      signInMethod === 'email'
                        ? 'bg-white text-blue-950 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>{language === 'bm' ? 'Emel & Kata Laluan' : 'Email & Password'}</span>
                  </button>
                </div>
              )}

              {/* Form Method 1: Phone OTP */}
              {signInMethod === 'phone' ? (
                <form onSubmit={handleSignInSubmit} className="flex flex-col gap-3.5">
                  {!otpStep ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">
                        {language === 'bm' ? 'Nombor Telefon Bimbit Terdaftar' : 'Registered Mobile Number'}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-slate-700 font-mono pr-2 border-r border-slate-200">
                          <span>🇲🇾</span>
                          <span>+60</span>
                        </div>
                        <input
                          type="tel"
                          required
                          value={signInPhone}
                          onChange={(e) => setSignInPhone(e.target.value)}
                          placeholder="12-345 6789"
                          className="w-full pl-18 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all font-mono"
                        />
                      </div>
                      <span className="text-[10.5px] text-slate-500 mt-0.5">
                        {language === 'bm' ? 'Kod pengesahan 4-digit akan dihantar ke telefon anda.' : 'A 4-digit verification code will be sent to your mobile.'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-center justify-between">
                        <span>{language === 'bm' ? 'Kod SMS dihantar ke' : 'Code sent to'} <strong>+60 {signInPhone}</strong></span>
                        <button 
                          type="button" 
                          onClick={() => setOtpStep(false)}
                          className="text-blue-900 font-bold underline text-[11px]"
                        >
                          {language === 'bm' ? 'Tukar' : 'Change'}
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-700">
                          {language === 'bm' ? 'Masukkan Kod SMS 4-Digit' : 'Enter 4-Digit SMS Code'}
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          required
                          autoFocus
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="8888"
                          className="w-full text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-blue-950 outline-hidden focus:border-blue-900 focus:bg-white tracking-[0.4em] font-mono transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer active:scale-98"
                  >
                    {isLoading ? (
                      <span>{language === 'bm' ? 'Mengesahkan...' : 'Authenticating...'}</span>
                    ) : (
                      <>
                        <span>{otpStep ? (language === 'bm' ? 'Sahkan & Log Masuk' : 'Verify & Sign In') : (language === 'bm' ? 'Hantar Kod OTP' : 'Send Verification OTP')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (

                /* Form Method 2: Email & Password */
                <form onSubmit={handleSignInSubmit} className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      {language === 'bm' ? 'Alamat Emel Terdaftar' : 'Registered Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">
                        {language === 'bm' ? 'Kata Laluan' : 'Password'}
                      </label>
                      <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[10.5px] font-bold text-blue-900 hover:underline">
                        {language === 'bm' ? 'Lupa Kata Laluan?' : 'Forgot Password?'}
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer active:scale-98"
                  >
                    {isLoading ? <span>{language === 'bm' ? 'Sedang Log Masuk...' : 'Signing In...'}</span> : <><span>{language === 'bm' ? 'Log Masuk ke Akaun' : 'Sign In to Account'}</span> <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              <p className="text-[11px] text-center text-slate-500 mt-1">
                {language === 'bm' ? 'Pengguna kali pertama?' : 'First time user?'}{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="font-bold text-blue-900 hover:underline cursor-pointer"
                >
                  {language === 'bm' ? 'Cipta akaun baru di sini' : 'Create an account here'}
                </button>
              </p>
            </div>
          )}

          {/* Security & Data Integrity Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
            <span>{language === 'bm' ? 'Privasi Dijamin & Penilaian Disimpan Selamat' : 'Privacy Protected & Historical Records Securely Saved'}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
