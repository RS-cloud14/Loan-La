'use client';

import React, { useState } from 'react';
import { Lock, Phone, Mail, ArrowRight, ShieldCheck, X, Eye, EyeOff, CheckCircle2, Shield, Building2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { UserProfileData } from './UserSettingsModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfileData) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('12-482 9182');
  const [emailAddress, setEmailAddress] = useState('borrower@loan-la.my');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('8888');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpStep) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setOtpStep(true);
      }, 500);
    } else {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess({
          name: 'Ahmad',
          phone: `+60 ${phoneNumber}`,
          role: language === 'bm' ? 'Pekerja Gig / Bekerja Sendiri' : 'Gig Worker / Self-Employed',
          profileId: 'ahmad'
        });
        onClose();
        setOtpStep(false);
      }, 400);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        name: emailAddress.split('@')[0].toUpperCase(),
        phone: '+60 12-482 9182',
        role: language === 'bm' ? 'Perniagaan Disahkan / Peminjam' : 'Verified Business / Borrower',
        profileId: 'ahmad'
      });
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Institutional Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white flex items-center justify-between border-b border-blue-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-900/90 rounded-2xl border border-blue-700/60 shadow-xs">
              <Lock className="w-4.5 h-4.5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wide uppercase">
                {language === 'bm' ? 'Log Masuk Portal Peminjam' : 'Borrower Portal Sign In'}
              </h3>
              <span className="text-[10px] text-blue-200 font-mono flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-blue-300" /> {language === 'bm' ? 'Gerbang Sulit PDPA 2010' : 'PDPA 2010 Encrypted Gateway'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => { setOtpStep(false); onClose(); }} 
            className="p-2 hover:bg-blue-800/80 rounded-xl text-blue-200 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-7 flex flex-col gap-5">
          {/* Method Tabs */}
          {!otpStep && (
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('phone')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'phone'
                    ? 'bg-white text-blue-950 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Phone className="w-3.5 h-3.5" /> {language === 'bm' ? 'Log Masuk OTP Telefon' : 'Mobile OTP Login'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'email'
                    ? 'bg-white text-blue-950 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> {language === 'bm' ? 'Emel & Kata Laluan' : 'Email & Password'}
              </button>
            </div>
          )}

          {/* Tab 1: Phone OTP Form */}
          {activeTab === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
              {!otpStep ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'bm' ? 'Nombor Telefon Bimbit Malaysia' : 'Malaysian Mobile Number'}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 font-mono pr-2 border-r border-slate-200">
                      <span>🇲🇾</span>
                      <span>+60</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="12-345 6789"
                      className="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'bm' ? 'Kami akan menghantar kod pengesahan 4-digit ke telefon anda.' : 'We will send a 4-digit verification code to your phone.'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-center justify-between">
                    <span>{language === 'bm' ? 'Kod dihantar ke' : 'Code sent to'} <strong>+60 {phoneNumber}</strong></span>
                    <button 
                      type="button" 
                      onClick={() => setOtpStep(false)}
                      className="text-blue-900 font-bold underline text-[11px]"
                    >
                      {language === 'bm' ? 'Tukar' : 'Change'}
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
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
                      className="w-full text-center py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-extrabold text-blue-950 outline-hidden focus:border-blue-900 focus:bg-white tracking-[0.5em] font-mono transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <span>{language === 'bm' ? 'Mengesahkan...' : 'Authenticating...'}</span>
                ) : (
                  <>
                    <span>{otpStep ? (language === 'bm' ? 'Sahkan & Masuk Portal' : 'Verify & Access Portal') : (language === 'bm' ? 'Hantar Kod OTP' : 'Send Secure OTP')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Tab 2: Email & Password Form */
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'bm' ? 'Emel Perniagaan / Peribadi' : 'Business / Personal Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-hidden focus:border-blue-900 focus:bg-white transition-all"
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
                className="w-full py-3.5 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? <span>{language === 'bm' ? 'Sedang Log Masuk...' : 'Signing In...'}</span> : <><span>{language === 'bm' ? 'Log Masuk ke Dashboard' : 'Sign In to Dashboard'}</span> <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* Security Assurance Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-900" />
            <span>{language === 'bm' ? 'Penyulitan SSL 256-Bit Standard Bank · Tiada Dokumen Disimpan di Pelayan' : 'Bank-Grade 256-Bit SSL Encryption · Zero Server Document Storage'}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
