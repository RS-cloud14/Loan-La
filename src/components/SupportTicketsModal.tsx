'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Headphones, CheckCircle2, Clock, AlertCircle, 
  ShieldCheck, ArrowRight, MessageSquare, Plus, Check,
  Send, RefreshCw, ChevronRight, User, Phone, Mail, FileText
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  SupportTicket, 
  TicketCategory, 
  TicketPriority, 
  getSupportTickets, 
  saveSupportTicket,
  getCategoryLabels 
} from '@/lib/supportTickets';
import { UserProfileData } from './UserSettingsModal';

interface SupportTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserProfileData | null;
  initialTicketId?: string | null;
  onOpenAIChatForHelp?: () => void;
}

export default function SupportTicketsModal({
  isOpen,
  onClose,
  userSession,
  initialTicketId,
  onOpenAIChatForHelp
}: SupportTicketsModalProps) {
  const { language } = useLanguage();
  const isMalay = language === 'bm';

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTicketId || null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New Ticket Form State
  const [category, setCategory] = useState<TicketCategory>('general_support');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  // Load tickets on mount or open
  useEffect(() => {
    if (isOpen) {
      const loaded = getSupportTickets();
      setTickets(loaded);
      if (initialTicketId) {
        setSelectedTicketId(initialTicketId);
      } else if (loaded.length > 0 && !selectedTicketId) {
        setSelectedTicketId(loaded[0].id);
      }
    }
  }, [isOpen, initialTicketId]);

  if (!isOpen) return null;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const newTicket = saveSupportTicket({
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      userContact: {
        name: userSession?.name || 'Borrower',
        phone: userSession?.phone,
        email: userSession?.email,
        profileId: userSession?.profileId
      },
      agentDiagnostic: isMalay 
        ? "Tiket dihantar melalui Pusat Khidmat Pelanggan Portal." 
        : "Ticket submitted via Portal Customer Care Center."
    });

    setTickets(getSupportTickets());
    setSelectedTicketId(newTicket.id);
    setIsCreatingNew(false);
    setIsSubmitting(false);
    setSuccessNotice(true);
    setSubject('');
    setDescription('');
    setTimeout(() => setSuccessNotice(false), 3000);
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col h-[620px] max-h-[92vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {isMalay ? "Pusat Khidmat Pelanggan & Tiket Sokongan" : "Customer Support & Service Tickets"}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isMalay ? "Bantuan pengunderaitan rasmi, semakan dokumen & penyelesaian isu" : "Official underwriting care, document verification & resolution"}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-sm font-semibold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Success Banner Notice */}
        {successNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isMalay 
                ? "Tiket perkhidmatan berjaya dihantar ke pegawai sokongan kami! Sila semak status di bawah." 
                : "Service ticket successfully dispatched to our support officers! Check status below."}
            </span>
          </div>
        )}

        {/* Modal Main Layout (Split View: Left List, Right Detail/Form) */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden bg-slate-50">
          
          {/* Left Sidebar: Tickets List & Action */}
          <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-slate-200 bg-white flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">
                {isMalay ? `Senarai Tiket (${tickets.length})` : `My Tickets (${tickets.length})`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedTicketId(null);
                }}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isMalay ? "Tiket Baru" : "New Ticket"}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {tickets.length === 0 ? (
                <div className="p-6 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                  <MessageSquare className="w-8 h-8 opacity-40" />
                  <p className="text-xs font-medium">
                    {isMalay ? "Tiada tiket sokongan aktif." : "No active support tickets."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(true)}
                    className="text-xs text-blue-600 hover:underline font-bold mt-1"
                  >
                    {isMalay ? "+ Buka Tiket Sokongan" : "+ Open a Support Ticket"}
                  </button>
                </div>
              ) : (
                tickets.map(t => {
                  const isSelected = selectedTicketId === t.id && !isCreatingNew;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTicketId(t.id);
                        setIsCreatingNew(false);
                      }}
                      className={`w-full p-3 text-left transition-colors flex flex-col gap-1.5 cursor-pointer ${
                        isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-mono font-bold text-slate-900">
                          {t.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          t.status === 'resolved' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : t.status === 'under_review'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {t.status === 'resolved' 
                            ? (isMalay ? 'Selesai' : 'Resolved') 
                            : t.status === 'under_review' 
                            ? (isMalay ? 'Sedang Disemak' : 'Under Review') 
                            : (isMalay ? 'Diterima' : 'Open')}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {t.subject}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{isMalay ? t.categoryLabelBm : t.categoryLabel}</span>
                        <span>{new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick AI CoPilot Trigger in Sidebar */}
            {onOpenAIChatForHelp && (
              <div className="p-3 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAIChatForHelp();
                  }}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isMalay ? "Tanya AI CoPilot Secara Langsung" : "Ask AI CoPilot Live"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Ticket Detail View or Create Form */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 flex flex-col justify-between">
            {isCreatingNew ? (
              // CREATE NEW TICKET FORM
              <form onSubmit={handleCreateTicket} className="flex-1 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {isMalay ? "Borang Pembukaan Tiket Sokongan Rasmi" : "Create New Official Support Ticket"}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {isMalay ? "Respon pantas 15-30 minit" : "Fast 15-30 mins SLA"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        {isMalay ? "Kategori Isu / Masalah *" : "Issue Category *"}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TicketCategory)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 outline-hidden font-medium"
                      >
                        <option value="statement_upload">{isMalay ? "Penyata Bank & Masalah Muat Naik" : "Bank Statement & Upload Issue"}</option>
                        <option value="payment_pass">{isMalay ? "Pembayaran & Pasport Kredit (RM9.90/RM19.90)" : "Payment & Passport Pass (RM9.90/RM19.90)"}</option>
                        <option value="underwriting_score">{isMalay ? "Skor Kredit & Pertanyaan DSR" : "Credit Score & DSR Inquiry"}</option>
                        <option value="disbursement_lender">{isMalay ? "Status Permohonan Bank & Pengeluaran" : "Bank Match & Payout Status"}</option>
                        <option value="account_security">{isMalay ? "Profil, Akaun & Keselamatan Data" : "Profile, Account & Data Privacy"}</option>
                        <option value="general_support">{isMalay ? "Pertanyaan Am & Khidmat Pelanggan" : "General Support & Assistance"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        {isMalay ? "Tahap Keutamaan (Priority) *" : "Priority Level *"}
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TicketPriority)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 outline-hidden font-medium"
                      >
                        <option value="normal">{isMalay ? "Normal (Respon dalam 60 minit)" : "Normal (Within 60 mins)"}</option>
                        <option value="high">{isMalay ? "Tinggi / Penting (Respon dalam 30 minit)" : "High Priority (Within 30 mins)"}</option>
                        <option value="urgent">{isMalay ? "Kecemasan / Urgent (Respon 15 minit)" : "Urgent / Critical (Within 15 mins)"}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {isMalay ? "Tajuk Masalah (Subject) *" : "Subject / Issue Summary *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={isMalay ? "cth: Gagal muat naik penyata Maybank PDF" : "e.g. Maybank PDF upload failed"}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {isMalay ? "Keterangan Terperinci Masalah *" : "Detailed Issue Description *"}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={isMalay 
                        ? "Terangkan masalah yang anda hadapi, termasuk nama bank atau ralat yang dipaparkan..." 
                        : "Describe the issue you encountered, including bank name or error messages..."}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-slate-800 rounded-lg text-xs text-slate-900 outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  {tickets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {isMalay ? "Batal" : "Cancel"}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isMalay ? "Hantar Tiket Sokongan" : "Submit Support Ticket"}</span>
                  </button>
                </div>
              </form>
            ) : selectedTicket ? (
              // TICKET DETAIL VIEW
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3.5">
                  {/* Top Bar of Ticket */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-2 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {selectedTicket.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {isMalay ? selectedTicket.categoryLabelBm : selectedTicket.categoryLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          selectedTicket.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : selectedTicket.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {selectedTicket.priority} Priority
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedTicket.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : selectedTicket.status === 'under_review'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {selectedTicket.status === 'resolved' 
                            ? (isMalay ? '✅ Selesai' : '✅ Resolved') 
                            : selectedTicket.status === 'under_review' 
                            ? (isMalay ? '⏳ Sedang Disemak' : '⏳ Under Review') 
                            : (isMalay ? '📬 Diterima & Diserahkan' : '📬 Open')}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {selectedTicket.subject}
                    </h4>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{isMalay ? "Dihantar pada:" : "Created on:"} {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                      <span className="font-semibold text-slate-600">
                        {isMalay ? `Jaminan Tindakan: ${selectedTicket.slaMinutes} Minit` : `SLA Response Time: ${selectedTicket.slaMinutes} Mins`}
                      </span>
                    </div>
                  </div>

                  {/* AI Pre-Diagnostic Assessment Box */}
                  {selectedTicket.agentDiagnostic && (
                    <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-blue-950 block mb-0.5">
                          {isMalay ? "Analisis Pra-Diagnostik AI:" : "AI Pre-Diagnostic Assessment:"}
                        </span>
                        <p className="text-[11px] leading-relaxed text-blue-800">
                          {selectedTicket.agentDiagnostic}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Resolution Notes (if resolved) */}
                  {selectedTicket.resolutionNote && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-emerald-950 block mb-0.5">
                          {isMalay ? "Nota Penyelesaian Pegawai Khidmat Pelanggan:" : "Support Officer Resolution Note:"}
                        </span>
                        <p className="text-[11px] leading-relaxed text-emerald-800">
                          {selectedTicket.resolutionNote}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                  <span className="text-[11px] text-slate-500">
                    {isMalay ? "Pegawai kami akan menghubungi anda melalui WhatsApp/Emel." : "Our officer will reach out via WhatsApp/Email."}
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isMalay ? "Tutup" : "Close"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                <MessageSquare className="w-8 h-8 opacity-40" />
                <p className="text-xs">{isMalay ? "Pilih tiket untuk melihat perincian." : "Select a ticket to view details."}</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
