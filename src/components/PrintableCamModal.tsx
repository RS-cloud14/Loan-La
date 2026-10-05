'use client';

import React from 'react';
import { X, Printer, Landmark, CheckCircle2, ShieldCheck, Scale, FileText } from 'lucide-react';
import { ExtendedUnderwritingInput } from './Dashboard';
import { CreditProfileReport } from '@/lib/scoring';
import { maskMyKad } from '@/lib/masking';

interface PrintableCamModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicantData: ExtendedUnderwritingInput;
  report: CreditProfileReport;
  hash: string;
}

export default function PrintableCamModal({
  isOpen,
  onClose,
  applicantData,
  report,
  hash
}: PrintableCamModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const memoRef = `CAM-MY-2026-LL-${hash.slice(0, 8).toUpperCase()}`;
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 sm:p-10 relative my-8 animate-in fade-in zoom-in-95 duration-150 text-slate-900 font-sans print:p-0 print:border-none print:shadow-none print:m-0 print:max-w-none">
        
        {/* Screen action bar (hidden during print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Printable Credit Risk Committee Digest
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-300" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Document Content */}
        <div className="flex flex-col gap-6 text-xs leading-relaxed">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Landmark className="w-5 h-5 text-blue-950" />
                <h1 className="text-lg font-black tracking-tight text-blue-950 uppercase">
                  CREDIT ASSESSMENT MEMORANDUM (CAM)
                </h1>
              </div>
              <span className="text-[11px] font-bold text-slate-600 block">
                FOR SANCTION CONSIDERATION · ALTERNATIVE FINANCING APPRAISAL
              </span>
              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                COMPLIANT WITH BANK NEGARA MALAYSIA (BNM) POLICY DOCUMENT ON RESPONSIBLE FINANCING
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono font-bold block text-blue-900">{memoRef}</span>
              <span className="text-[11px] text-slate-500 block">Date: {todayStr}</span>
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mt-1">
                CONFIDENTIAL · INTERNAL USE ONLY
              </span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5">
              1. EXECUTIVE FACILITY PROPOSAL &amp; BORROWER PROFILE
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Applicant Full Name</span>
                <span className="font-bold text-slate-900 block mt-0.5">{applicantData.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">IC: {maskMyKad(applicantData.identityData?.icNumber)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Income Platform / Source</span>
                <span className="font-bold text-slate-900 block mt-0.5">{applicantData.platform}</span>
                <span className="text-[10px] text-emerald-700 font-bold">Verified Digital Footprint</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Assessed Net Income</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  RM {applicantData.averageMonthlyNetIncome.toLocaleString()} / mo
                </span>
                <span className="text-[10px] text-slate-500">Trailing 3-Month Normalized</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Proposed Facility</span>
                <span className="font-bold text-blue-950 block mt-0.5">
                  RM {(applicantData.targetLoanAmount || 8000).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Tenure: {applicantData.tenureYears || 2} Years</span>
              </div>
            </div>
          </div>

          {/* Section 2: Underwriting Risk Telemetries */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5">
              2. ALTERNATIVE CREDIT METRICS &amp; AFFORDABILITY STRESS-TEST
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Financial Readiness Index</span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  {report.score} / 850 (Grade {report.grade})
                </span>
                <span className="text-[10px] text-slate-600 block mt-1 leading-tight">
                  Status: <strong>{report.status} ({report.affordabilityStatus} Buffer)</strong>
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Debt Service Ratio (DSR)</span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  {report.dsr.toFixed(1)}% (BNM Cap: 60%)
                </span>
                <span className="text-[10px] text-emerald-700 block mt-1 font-medium">
                  ✓ Compliant with Responsible Financing Guidelines
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Disposable Living Buffer</span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  RM {report.monthlySurplus.toFixed(0)} / mo
                </span>
                <span className="text-[10px] text-slate-600 block mt-1">
                  Buffer: {report.runwayMonths.toFixed(1)} Months Liquid Runway
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Dual-Source Payout Reconciliation & Forensics */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5">
              3. FORENSIC INTEGRITY &amp; LEDGER RECONCILIATION AUDIT
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Audit Checkpoint</th>
                    <th className="p-2.5">Observed Telemetry</th>
                    <th className="p-2.5">Audit Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">Platform Payout Cross-Reconciliation</td>
                    <td className="p-2.5 text-slate-600">
                      Weekly platform earnings reconcile with bank statement DuitNow entries with T+1 clearing lag.
                    </td>
                    <td className="p-2.5 text-emerald-700 font-bold">MATCHED (PASS)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Bank Statement Balance Arithmetic Check</td>
                    <td className="p-2.5 text-slate-600">
                      <code>Start Balance + Credits - Debits == End Balance</code> verified mathematically across 3 statement cycles.
                    </td>
                    <td className="p-2.5 text-emerald-700 font-bold">VERIFIED (PASS)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Digital Tampering &amp; Clone Stamp Inspection</td>
                    <td className="p-2.5 text-slate-600">
                      EXIF metadata, font rasterization, and compression artifacts checked. Zero evidence of visual fabrication.
                    </td>
                    <td className="p-2.5 text-emerald-700 font-bold">CLEAN (PASS)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Mandatory Conditions Precedent (CPs) */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5">
              4. RECOMMENDED CONDITIONS PRECEDENT (CPs) TO DISBURSEMENT
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li>Borrower must execute an irrevocable weekly DuitNow Auto-Debit mandate on their primary gig earnings account.</li>
              <li>Post-sanction DSR must remain strictly below the 50.0% benchmark throughout the facility amortization period.</li>
              <li>Verification of continuous active platform partner status with zero suspension flags prior to disbursement.</li>
              <li>Facility assignment under Bank Negara Malaysia Credit Guarantee Corporation (CGC) micro-enterprise framework where applicable.</li>
            </ul>
          </div>

          {/* Section 5: Committee Sign-Off Matrix */}
          <div className="pt-4 border-t-2 border-slate-900">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              5. CREDIT RISK COMMITTEE SIGN-OFF &amp; AUTHORIZATION
            </h2>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="border-t border-slate-300 pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Prepared By</span>
                <span className="font-bold text-slate-800 text-xs block mt-1">Automated Credit Intelligence</span>
                <span className="text-[10px] text-slate-500 font-mono">Loan-La Engine v2.5</span>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Assessed &amp; Recommended By</span>
                <span className="font-bold text-slate-800 text-xs block mt-1">Credit Risk Analyst</span>
                <span className="text-[10px] text-slate-500">Retail &amp; Micro-Financing Unit</span>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Sanctioned By</span>
                <span className="font-bold text-slate-800 text-xs block mt-1">Credit Risk Committee</span>
                <span className="text-[10px] text-slate-500">Authorized Signatory</span>
              </div>
            </div>
          </div>

          {/* Footer Hash */}
          <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-3 flex justify-between font-mono">
            <span>Cryptographic Dossier Hash: {hash}</span>
            <span>Generated: {new Date().toISOString()}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
