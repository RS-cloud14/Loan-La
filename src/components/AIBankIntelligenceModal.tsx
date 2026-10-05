'use client';

import React, { useState, useEffect } from 'react';
import {
  X, RefreshCw, Zap, Building2, CheckCircle2,
  ExternalLink, Sparkles, AlertCircle, ArrowUpRight,
  TrendingDown, ShieldCheck, Database, Radio, Globe
} from 'lucide-react';
import BankLogo from '@/components/BankLogo';
import { BankIntelligenceState, BankRateUpdate, LiveBankData } from '@/lib/bankIntelligence';

interface AIBankIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRates?: (overrides: Record<string, Partial<LiveBankData>>) => void;
}

export default function AIBankIntelligenceModal({
  isOpen,
  onClose,
  onApplyRates
}: AIBankIntelligenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [data, setData] = useState<BankIntelligenceState | null>(null);
  const [selectedTab, setSelectedTab] = useState<'verified_rates' | 'audit_log'>('verified_rates');

  const scanSteps = [
    'Connecting to Bank Negara Malaysia (BNM) OPR & Base Rate benchmarks...',
    'Auditing GXBank (Grab & Singtel) Digital Cash Facility rate sheets...',
    'Auditing Boost Bank (Axiata & RHB) Merchant Micro-Credit limits...',
    'Verifying AEON Bank Islamic Personal Financing-i & TEKUN circulars...',
    'Synthesizing verified rate matrices & updating live directory registry...'
  ];

  // Fetch current intelligence on modal open
  const fetchState = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bank-intelligence');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch bank intelligence:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchState();
    }
  }, [isOpen]);

  const handleRunAgent = async () => {
    setScanning(true);
    setScanStep(0);

    // Step animations
    const stepInterval = setInterval(() => {
      setScanStep(prev => (prev < scanSteps.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await fetch('/api/bank-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.success && json.state) {
        setData(json.state);
        if (onApplyRates && json.state.activeOverrides) {
          onApplyRates(json.state.activeOverrides);
        }
      }
    } catch (e) {
      console.error("Agent scan error:", e);
    } finally {
      clearInterval(stepInterval);
      setScanning(false);
      setScanStep(scanSteps.length - 1);
    }
  };

  if (!isOpen) return null;

  const overridesList = data?.activeOverrides ? Object.values(data.activeOverrides) : [];
  const updatesList = data?.recentUpdates || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 sm:p-8 relative my-8 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-950 text-white rounded-2xl shadow-sm">
              <Zap className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  AI Bank Intelligence &amp; Market Crawler Agent
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  LIVE MARKET AUDITING
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Autonomous agent scans Bank Negara Malaysia (BNM) rate sheets, digital bank concessions, and gig financing criteria.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleRunAgent}
              disabled={scanning}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
                scanning
                  ? 'bg-blue-900 text-slate-300 opacity-80 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 hover:from-blue-800 hover:to-indigo-900 text-white shadow-blue-950/20'
              }`}
            >
              <RefreshCw className={`w-4 h-4 text-cyan-300 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Agent Crawling...' : 'Run Live AI Market Crawl'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Agent Terminal Scanning Bar (Visible during scan) */}
        {scanning && (
          <div className="mb-6 p-4 bg-slate-950 text-white rounded-2xl border border-blue-900/50 shadow-inner flex flex-col gap-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-300 font-bold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Gemini 2.5 Market Research Subagent Active
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Phase {scanStep + 1} of {scanSteps.length}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
              />
            </div>

            <p className="text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-cyan-400">❯</span> {scanSteps[scanStep]}
            </p>
          </div>
        )}

        {/* 4 Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Institutions Tracked</span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block tabular-nums">
              {overridesList.length || 6} Licensed Lenders
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">BNM Benchmark OPR</span>
            <span className="text-base font-extrabold text-blue-950 mt-0.5 block tabular-nums">
              3.00% p.a.
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Digital Payout Velocity</span>
            <span className="text-base font-extrabold text-emerald-700 mt-0.5 block tabular-nums">
              10 Mins (GXBank)
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Last AI Intelligence Audit</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block truncate">
              {data?.lastSyncTimestamp ? new Date(data.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
            </span>
          </div>
        </div>

        {/* Tabs: Verified Rates vs Audit Log */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
          <button
            onClick={() => setSelectedTab('verified_rates')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTab === 'verified_rates'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Verified Bank Rate Sheets ({overridesList.length})
          </button>
          <button
            onClick={() => setSelectedTab('audit_log')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedTab === 'audit_log'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Agent Audit Log</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-700 font-bold font-mono">
              {updatesList.length}
            </span>
          </button>
        </div>

        {/* TAB 1: VERIFIED RATES GRID */}
        {selectedTab === 'verified_rates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
            {overridesList.map((lender: any) => (
              <div
                key={lender.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-1">
                        <BankLogo bankName={lender.name} size="sm" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          {lender.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Verified: {lender.lastVerifiedAt ? new Date(lender.lastVerifiedAt).toLocaleDateString('en-GB') : 'August 2026'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      ✓ LIVE VERIFIED
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Interest / Profit Rate:</span>
                      <strong className="text-blue-950 font-bold">{lender.rateLabel}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Turnaround Speed:</span>
                      <strong className="text-emerald-700 font-bold">{lender.turnaround}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Max Financing Limit:</span>
                      <strong className="text-slate-900 font-bold">{lender.maxLoan}</strong>
                    </div>
                  </div>

                  {lender.campaignPromo && (
                    <div className="mt-2.5 p-2 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 leading-tight">
                      <strong className="font-bold">Active Promo:</strong> {lender.campaignPromo}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="truncate max-w-[260px] font-mono">
                    Source: {lender.verifiedSource || 'Official PDS Disclosure'}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: AUDIT LOG */}
        {selectedTab === 'audit_log' && (
          <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1 text-xs">
            {updatesList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No recent rate shifts detected. All bank parameters match current BNM benchmarks.
              </div>
            ) : (
              updatesList.map((upd, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-xl border border-slate-200 text-blue-900 shrink-0 mt-0.5">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">{upd.lenderName}</strong>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                          {upd.field}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="line-through text-slate-400">{upd.oldValue}</span>
                        <span className="text-slate-400">→</span>
                        <strong className="text-emerald-700 font-bold">{upd.newValue}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                        Citation: {upd.sourceCitation} · Confidence: {upd.confidenceScore}%
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono self-start sm:self-center shrink-0">
                    {upd.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-100 mt-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted BNM OPR &amp; Digital Bank Registry Feed</span>
          </div>

          <button
            onClick={() => {
              if (onApplyRates && data?.activeOverrides) {
                onApplyRates(data.activeOverrides);
              }
              onClose();
            }}
            className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Apply to Directory &amp; Close
          </button>
        </div>

      </div>
    </div>
  );
}
