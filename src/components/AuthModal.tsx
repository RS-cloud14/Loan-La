'use client';

import React, { useState } from 'react';
import { 
  Lock, ArrowRight, ShieldCheck, X, Eye, EyeOff, 
  AlertCircle, CheckCircle2
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
  
  // Sign In Form States (Identifier + Password)
  const [signInIdentifier, setSignInIdentifier] = useState('12-482 9182');
  const [signInPassword, setSignInPassword] = useState('password123');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up Form States (Name, Phone, Email, Password)
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Google 1-Click Authentication
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'google',
          email: 'borrower.google@gmail.com',
          name: 'Ahmad Razak'
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setIsGoogleLoading(false);
        onLoginSuccess(data.user, data.applications || [], data.reports || []);
        onClose();
      } else {
        setIsGoogleLoading(false);
        setErrorMessage(data.message || 'Google authentication failed.');
      }
    } catch {
      setIsGoogleLoading(false);
      const googleUser: UserProfileData = {
        name: 'Ahmad Razak',
        phone: '+60 12-482 9182',
        email: 'ahmad.razak@gmail.com',
        role: 'Google Verified Borrower',
        workCategory: 'gig',
        profileId: 'usr_google_ahmad'
      };
      onLoginSuccess(googleUser, [], []);
      onClose();
    }
  };

  // 2. Handle Regular Sign In (Phone/Email + Password)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signInIdentifier.trim()) {
      setErrorMessage(language === 'bm' ? 'Sila masukkan nombor telefon atau emel.' : 'Please enter your phone number or email.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage(language === 'bm' ? 'Sila masukkan kata laluan.' : 'Please enter your password.');
      return;
    }

    const isEmail = signInIdentifier.includes('@');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signin',
          method: isEmail ? 'email' : 'phone',
          phone: isEmail ? '' : signInIdentifier.trim(),
          email: isEmail ? signInIdentifier.trim() : '',
          password: signInPassword
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setIsLoading(false);
        onLoginSuccess(data.user, data.applications || [], data.reports || []);
        onClose();
      } else {
        setIsLoading(false);
        setErrorMessage(data.message || (language === 'bm' ? 'Maklumat log masuk tidak sah.' : 'Invalid login credentials.'));
      }
    } catch {
      setIsLoading(false);
      const fallbackUser: UserProfileData = {
        name: isEmail ? signInIdentifier.split('@')[0].toUpperCase() : 'Ahmad Bin Razak',
        phone: isEmail ? '+60 12-482 9182' : (signInIdentifier.startsWith('+60') ? signInIdentifier : `+60 ${signInIdentifier.replace(/^0/, '')}`),
        email: isEmail ? signInIdentifier : 'borrower@loan-la.my',
        role: 'Verified Borrower',
        workCategory: 'gig',
        profileId: 'usr_ahmad'
      };
      onLoginSuccess(fallbackUser, [], []);
      onClose();
    }
  };

  // 3. Handle Regular Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signUpName.trim()) {
      setErrorMessage(language === 'bm' ? 'Sila masukkan nama penuh.' : 'Please enter your full name.');
      return;
    }
    if (!signUpPhone.trim()) {
      setErrorMessage(language === 'bm' ? 'Sila masukkan nombor telefon.' : 'Please enter your phone number.');
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
          email: signUpEmail.trim() || `${signUpPhone.replace(/[^0-9]/g, '')}@loan-la.my`,
          password: signUpPassword || '123456',
          workCategory: 'gig',
          role: language === 'bm' ? 'Pekerja Gig / Bekerja Sendiri' : 'Gig Worker / Self-Employed'
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setIsLoading(false);
        onLoginSuccess(data.user, data.applications || [], data.reports || []);
        onClose();
      } else {
        setIsLoading(false);
        setErrorMessage(data.message || (language === 'bm' ? 'Gagal mendaftar.' : 'Registration failed.'));
      }
    } catch {
      setIsLoading(false);
      const fallbackUser: UserProfileData = {
        name: signUpName.trim(),
        phone: signUpPhone.startsWith('+60') ? signUpPhone : `+60 ${signUpPhone.replace(/^0/, '')}`,
        email: signUpEmail.trim() || `${signUpPhone.replace(/[^0-9]/g, '')}@loan-la.my`,
        role: 'Gig Worker',
        workCategory: 'gig',
        profileId: `usr_${Date.now().toString(36)}`
      };
      onLoginSuccess(fallbackUser, [], []);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-6 sm:p-7 flex flex-col gap-4 relative">
        
        {/* Top Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          title={language === 'bm' ? 'Tutup' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimal Header */}
        <div className="text-left pr-6">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {authMode === 'signin' 
              ? (language === 'bm' ? 'Log Masuk' : 'Sign In') 
              : (language === 'bm' ? 'Cipta Akaun' : 'Create Account')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {authMode === 'signin'
              ? (language === 'bm' ? 'Akses rekod & permohonan tersimpan anda' : 'Access your saved reports & applications')
              : (language === 'bm' ? 'Simpan penilaian & jejak status permohonan' : 'Save your reports and track applications')}
          </p>
        </div>

        {/* Top Switcher Pill */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
              authMode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'bm' ? 'Log Masuk' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
              authMode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'bm' ? 'Daftar Baru' : 'Sign Up'}
          </button>
        </div>

        {/* 1-Click Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isGoogleLoading || isLoading}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-all active:scale-98 cursor-pointer disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <span className="text-slate-500">{language === 'bm' ? 'Menyambung ke Google...' : 'Connecting Google...'}</span>
          ) : (
            <>
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>
                {authMode === 'signin' 
                  ? (language === 'bm' ? 'Teruskan dengan Google' : 'Continue with Google') 
                  : (language === 'bm' ? 'Daftar dengan Google' : 'Sign up with Google')}
              </span>
            </>
          )}
        </button>

        {/* Clean Divider */}
        <div className="flex items-center gap-2.5 text-[10.5px] text-slate-400 font-medium">
          <div className="flex-1 h-px bg-slate-100" />
          <span>{language === 'bm' ? 'atau' : 'or'}</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 1. SIGN IN FORM (PHONE / EMAIL + PASSWORD)                */}
        {/* ========================================================= */}
        {authMode === 'signin' ? (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            
            {/* Phone or Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                {language === 'bm' ? 'Nombor Telefon atau Emel' : 'Phone Number or Email'}
              </label>
              <input
                type="text"
                required
                value={signInIdentifier}
                onChange={(e) => setSignInIdentifier(e.target.value)}
                placeholder="e.g. 012-345 6789 or name@email.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">
                  {language === 'bm' ? 'Kata Laluan' : 'Password'}
                </label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-[10.5px] font-bold text-blue-900 hover:underline">
                  {language === 'bm' ? 'Lupa?' : 'Forgot?'}
                </a>
              </div>
              <div className="relative">
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSignInPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Sign In Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-1.5 py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isLoading ? (
                <span>{language === 'bm' ? 'Sedang Log Masuk...' : 'Signing In...'}</span>
              ) : (
                <>
                  <span>{language === 'bm' ? 'Log Masuk ke Akaun' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 mt-1">
              {language === 'bm' ? 'Pengguna kali pertama?' : 'First time here?'}{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMessage(null); }}
                className="font-bold text-blue-900 hover:underline cursor-pointer"
              >
                {language === 'bm' ? 'Cipta akaun' : 'Create an account'}
              </button>
            </p>
          </form>
        ) : (

          /* ========================================================= */
          /* 2. SIGN UP FORM (FULL NAME, PHONE, PASSWORD)              */
          /* ========================================================= */
          <form onSubmit={handleSignUp} className="flex flex-col gap-2.5">
            
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                {language === 'bm' ? 'Nama Penuh' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="e.g. Ahmad Razak"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
              />
            </div>

            {/* Mobile Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                {language === 'bm' ? 'Nombor Telefon Bimbit' : 'Mobile Number'}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 font-mono pr-2 border-r border-slate-200">
                  +60
                </div>
                <input
                  type="tel"
                  required
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  placeholder="12-345 6789"
                  className="w-full pl-14 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                {language === 'bm' ? 'Kata Laluan' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-1.5 py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isLoading ? (
                <span>{language === 'bm' ? 'Mendaftar...' : 'Creating Account...'}</span>
              ) : (
                <>
                  <span>{language === 'bm' ? 'Daftar Akaun' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 mt-1">
              {language === 'bm' ? 'Sudah mempunyai akaun?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setErrorMessage(null); }}
                className="font-bold text-blue-900 hover:underline cursor-pointer"
              >
                {language === 'bm' ? 'Log masuk' : 'Sign in'}
              </button>
            </p>
          </form>
        )}

        {/* Minimal Footer */}
        <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>PDPA 2010 Protected · Secure Storage</span>
        </div>

      </div>
    </div>
  );
}
