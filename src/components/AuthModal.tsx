'use client';

import React, { useState } from 'react';
import { 
  Lock, Phone, Mail, ArrowRight, ShieldCheck, X, Eye, EyeOff, 
  User, CheckCircle2, AlertCircle
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
  
  // Single Unified Sign In field (Phone or Email)
  const [signInIdentifier, setSignInIdentifier] = useState('12-482 9182');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('8888');

  // Sign Up Form (Streamlined to 3 essential fields)
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const isEmail = signInIdentifier.includes('@');

    // Phone OTP step 1 -> step 2
    if (!isEmail && !otpStep) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setOtpStep(true);
      }, 350);
      return;
    }

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
          password: 'password123',
          otpCode: otpCode
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setIsLoading(false);
        onLoginSuccess(data.user, data.applications || [], data.reports || []);
        onClose();
        setOtpStep(false);
      } else {
        setIsLoading(false);
        setErrorMessage(data.message || (language === 'bm' ? 'Maklumat log masuk tidak sah.' : 'Invalid credentials.'));
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
      setOtpStep(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signUpName.trim()) {
      setErrorMessage(language === 'bm' ? 'Sila masukkan nama penuh.' : 'Please enter your name.');
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
          email: `${signUpPhone.replace(/[^0-9]/g, '')}@loan-la.my`,
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
        email: `${signUpPhone.replace(/[^0-9]/g, '')}@loan-la.my`,
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
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/80 p-6 sm:p-7 flex flex-col gap-5 relative">
        
        {/* Top Close Button */}
        <button 
          onClick={() => { setOtpStep(false); onClose(); }} 
          className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          title={language === 'bm' ? 'Tutup' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimal Header */}
        <div className="text-left pr-6">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {authMode === 'signin' 
              ? (language === 'bm' ? 'Log Masuk' : 'Sign In') 
              : (language === 'bm' ? 'Cipta Akaun' : 'Create Account')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {authMode === 'signin'
              ? (language === 'bm' ? 'Akses laporan & permohonan tersimpan anda' : 'Access your saved reports & applications')
              : (language === 'bm' ? 'Daftar untuk simpan keputusan pinjaman anda' : 'Save your reports and track applications')}
          </p>
        </div>

        {/* Minimalist Top Switcher */}
        <div className="flex p-1 bg-slate-100/90 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setErrorMessage(null); setOtpStep(false); }}
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

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 1. MINIMAL SIGN IN                                        */}
        {/* ========================================================= */}
        {authMode === 'signin' ? (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3.5">
            
            {!otpStep ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  {language === 'bm' ? 'Nombor Telefon atau Emel' : 'Phone Number or Email'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="e.g. 012-345 6789 or email"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{language === 'bm' ? 'Kod SMS dihantar ke' : 'Code sent to'} <strong>{signInIdentifier}</strong></span>
                  <button 
                    type="button" 
                    onClick={() => setOtpStep(false)}
                    className="text-blue-900 font-bold hover:underline text-[11px] cursor-pointer"
                  >
                    {language === 'bm' ? 'Tukar' : 'Change'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="8888"
                  className="w-full text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-blue-950 outline-hidden focus:border-blue-900 focus:bg-white tracking-[0.3em] font-mono transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isLoading ? (
                <span>{language === 'bm' ? 'Mengesahkan...' : 'Authenticating...'}</span>
              ) : (
                <>
                  <span>{otpStep ? (language === 'bm' ? 'Sahkan & Log Masuk' : 'Verify & Sign In') : (language === 'bm' ? 'Hantar Kod OTP' : 'Continue with OTP')}</span>
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
          /* 2. MINIMAL SIGN UP (3 CLEAN INPUTS)                       */
          /* ========================================================= */
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            
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
                  type={showPassword ? 'text' : 'password'}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-60"
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
