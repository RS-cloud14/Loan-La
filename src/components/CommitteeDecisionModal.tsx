'use client';

import React, { useState } from 'react';
import {
  X, CheckCircle2, AlertTriangle, ShieldAlert,
  FileText, Landmark, Clock, ArrowRight,
  Send, HelpCircle, Check, Scale
} from 'lucide-react';

export interface CommitteeDecisionModalProps {
  isOpen: boolean;
  type: 'APPROVE' | 'RFI' | 'DECLINE';
  applicant: {
    id: string;
    name: string;
    platform: string;
    score: number;
    grade: string;
    dsr: number;
    requestedAmount?: number;
    hash: string;
  };
  onClose: () => void;
  onApprove: (data: {
    quantum: number;
    tenureMonths: number;
    profitRate: number;
    covenants: string[];
    notes: string;
    sanctionRef: string;
  }) => void;
  onRfi: (data: {
    lenderName: string;
    requiredDoc: string;
    queryText: string;
  }) => void;
  onDecline: (data: {
    reasonCode: string;
    notes: string;
  }) => void;
}

const MALAYSIAN_COVENANTS = [
  'Execution of mandatory weekly DuitNow Auto-Debit mandate on gig earnings account',
  'Borrower covenant to maintain total DSR below 50% throughout facility tenure',
  'Verification of active platform partner standing (zero disciplinary strikes) prior to first draw',
  'Credit Guarantee Corporation (CGC) or SJPP government guarantee backing assignment',
  'Mandatory submission of quarterly e-wallet payout summaries for portfolio monitoring'
];

const MALAYSIAN_RFI_DOCS = [
  'SSM Business Registration Certificate (Form D) / Local Council Hawkers Permit',
  'Latest 1-Month Payout Slip / Summary (Grab, Foodpanda, Shopee, Lalamove)',
  'Bank Statement First Page showing Account Number & Verified Account Holder Name',
  'Utility Bill (TNB / Syabas) or Tenancy Agreement for Residential Address Confirmation',
  'Income Tax Form B/BE or KWSP/EPF Voluntary Contribution Statement'
];

const BNM_DECLINE_CODES = [
  { code: 'BNM-RF-01', label: 'Inadequate Debt Service Ratio (DSR > 60% macroprudential limit)' },
  { code: 'BNM-RF-02', label: 'Dual-Source Payout Reconciliation Mismatch (unverified income flows)' },
  { code: 'BNM-RF-03', label: 'Insufficient Post-Commitment Living Buffer (below EPF Belanjawanku threshold)' },
  { code: 'BNM-RF-04', label: 'Non-verifiable Platform Operating Tenure (<3 months continuous activity)' },
  { code: 'BNM-RF-05', label: 'Excessive Liquidity Drain / High Returned Item Velocity in Statement Period' }
];

export default function CommitteeDecisionModal({
  isOpen,
  type,
  applicant,
  onClose,
  onApprove,
  onRfi,
  onDecline
}: CommitteeDecisionModalProps) {
  const [quantum, setQuantum] = useState<number>(applicant.requestedAmount || 8000);
  const [tenureMonths, setTenureMonths] = useState<number>(24);
  const [profitRate, setProfitRate] = useState<number>(4.5);
  const [selectedCovenants, setSelectedCovenants] = useState<string[]>([
    MALAYSIAN_COVENANTS[0],
    MALAYSIAN_COVENANTS[1],
    MALAYSIAN_COVENANTS[2]
  ]);
  const [sanctionNotes, setSanctionNotes] = useState<string>(
    'Approved based on 3-month verified banking reconciliation and consistent payout velocity.'
  );

  // RFI state
  const [rfiLender, setRfiLender] = useState<string>('GXBank Credit Operations Desk');
  const [rfiDoc, setRfiDoc] = useState<string>(MALAYSIAN_RFI_DOCS[0]);
  const [rfiQueryText, setRfiQueryText] = useState<string>(
    'Please submit official SSM Business Registration certificate or local council hawkers permit to proceed with facility sanction.'
  );

  // Decline state
  const [selectedDeclineCode, setSelectedDeclineCode] = useState<string>(BNM_DECLINE_CODES[0].code);
  const [declineNotes, setDeclineNotes] = useState<string>(
    'Applicant debt commitments exceed Bank Negara Malaysia (BNM) Responsible Financing macroprudential threshold.'
  );

  if (!isOpen) return null;

  const toggleCovenant = (cov: string) => {
    setSelectedCovenants(prev =>
      prev.includes(cov) ? prev.filter(c => c !== cov) : [...prev, cov]
    );
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanctionRef = `SANCT-2026-LL${Math.floor(1000 + Math.random() * 9000)}`;
    onApprove({
      quantum,
      tenureMonths,
      profitRate,
      covenants: selectedCovenants,
      notes: sanctionNotes,
      sanctionRef
    });
  };

  const handleRfiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRfi({
      lenderName: rfiLender,
      requiredDoc: rfiDoc,
      queryText: rfiQueryText
    });
  };

  const handleDeclineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codeObj = BNM_DECLINE_CODES.find(c => c.code === selectedDeclineCode);
    onDecline({
      reasonCode: codeObj ? `${codeObj.code}: ${codeObj.label}` : selectedDeclineCode,
      notes: declineNotes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              type === 'APPROVE' ? 'bg-emerald-600 text-white' :
              type === 'RFI' ? 'bg-blue-950 text-cyan-300' :
              'bg-rose-600 text-white'
            }`}>
              {type === 'APPROVE' && <CheckCircle2 className="w-5 h-5" />}
              {type === 'RFI' && <HelpCircle className="w-5 h-5" />}
              {type === 'DECLINE' && <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {type === 'APPROVE' && 'Credit Committee Sanction Terms'}
                {type === 'RFI' && 'Official Bank Request for Information (RFI)'}
                {type === 'DECLINE' && 'Record Formal Adverse Action (Decline)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Applicant: <strong className="text-slate-900">{applicant.name}</strong> · {applicant.platform}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* APPROVE FORM */}
        {type === 'APPROVE' && (
          <form onSubmit={handleApproveSubmit} className="flex flex-col gap-4 text-xs">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Borrower FRI Assessment
                </span>
                <span className="text-sm font-extrabold text-emerald-950 mt-0.5 block">
                  Grade {applicant.grade} · Score {applicant.score}/850 · DSR {applicant.dsr.toFixed(1)}%
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-white text-emerald-800 font-bold border border-emerald-300">
                BNM ELIGIBLE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Sanctioned Facility (RM)
                </label>
                <input
                  type="number"
                  step="500"
                  min="1000"
                  max="100000"
                  value={quantum}
                  onChange={(e) => setQuantum(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-blue-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tenure (Months)
                </label>
                <select
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-blue-900 focus:bg-white"
                >
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={24}>24 Months (2 Years)</option>
                  <option value={36}>36 Months (3 Years)</option>
                  <option value={48}>48 Months (4 Years)</option>
                  <option value={60}>60 Months (5 Years)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Profit Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="18.0"
                  value={profitRate}
                  onChange={(e) => setProfitRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-blue-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Covenants Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-900" />
                <span>Mandatory Conditions Precedent &amp; Risk Covenants</span>
              </label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {MALAYSIAN_COVENANTS.map((cov, idx) => {
                  const isChecked = selectedCovenants.includes(cov);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleCovenant(cov)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-900/40 text-blue-950 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                        isChecked ? 'bg-blue-950 border-blue-950 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-[11px] leading-tight">{cov}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Credit Committee Approval Note
              </label>
              <textarea
                rows={2}
                value={sanctionNotes}
                onChange={(e) => setSanctionNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-blue-900 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Issue Formal Sanction Letter
              </button>
            </div>
          </form>
        )}

        {/* RFI / QUERY FORM */}
        {type === 'RFI' && (
          <form onSubmit={handleRfiSubmit} className="flex flex-col gap-4 text-xs">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                Dispatched to Live Applicant Portal
              </span>
              <p className="text-xs text-slate-700 mt-1">
                This official inquiry will appear immediately in the borrower’s <strong>Application Tracker</strong> with an actionable document upload box.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Originating Underwriting Desk / Lender Name
              </label>
              <input
                type="text"
                value={rfiLender}
                onChange={(e) => setRfiLender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-blue-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Requested Clarification Document Category
              </label>
              <select
                value={rfiDoc}
                onChange={(e) => {
                  setRfiDoc(e.target.value);
                  setRfiQueryText(`Please submit official ${e.target.value} to proceed with facility sanction and disbursement.`);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-blue-900 focus:bg-white"
              >
                {MALAYSIAN_RFI_DOCS.map((doc, idx) => (
                  <option key={idx} value={doc}>{doc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Underwriter Clarification Message to Borrower
              </label>
              <textarea
                rows={3}
                value={rfiQueryText}
                onChange={(e) => setRfiQueryText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-blue-900 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-4 h-4 text-cyan-300" /> Dispatch Inquiry to Borrower
              </button>
            </div>
          </form>
        )}

        {/* DECLINE FORM */}
        {type === 'DECLINE' && (
          <form onSubmit={handleDeclineSubmit} className="flex flex-col gap-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
              <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">
                BNM Responsible Financing Policy Compliance
              </span>
              <p className="text-xs text-slate-700 mt-1">
                Adverse action notices must cite specific statutory reasons in accordance with Bank Negara Malaysia credit risk standards.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Statutory Decline Reason Code
              </label>
              <select
                value={selectedDeclineCode}
                onChange={(e) => {
                  setSelectedDeclineCode(e.target.value);
                  const found = BNM_DECLINE_CODES.find(c => c.code === e.target.value);
                  if (found) setDeclineNotes(`Application declined under ${found.code}: ${found.label}`);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-rose-800 focus:bg-white"
              >
                {BNM_DECLINE_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}: {c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Adverse Action Explanatory Notes
              </label>
              <textarea
                rows={3}
                value={declineNotes}
                onChange={(e) => setDeclineNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-rose-800 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" /> Record Adverse Action (Decline)
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
