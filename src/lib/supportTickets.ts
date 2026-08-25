// Support Tickets Management & Persistence
export type TicketCategory = 
  | 'statement_upload' 
  | 'payment_pass' 
  | 'underwriting_score' 
  | 'disbursement_lender' 
  | 'account_security'
  | 'general_support';

export type TicketPriority = 'urgent' | 'high' | 'normal';
export type TicketStatus = 'open' | 'under_review' | 'resolved';

export interface SupportTicket {
  id: string;
  category: TicketCategory;
  categoryLabel: string;
  categoryLabelBm: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  slaMinutes: number;
  userContact: {
    name: string;
    phone?: string;
    email?: string;
    profileId?: string;
  };
  agentDiagnostic?: string;
  resolutionNote?: string;
}

const STORAGE_KEY = 'loanla_support_tickets';

export function generateTicketId(): string {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `TKT-${year}-${randNum}`;
}

export function getCategoryLabels(category: TicketCategory): { en: string; bm: string } {
  switch (category) {
    case 'statement_upload':
      return { en: 'Bank Statement & Upload Issue', bm: 'Masalah Penyata Bank & Muat Naik' };
    case 'payment_pass':
      return { en: 'Payment & Passport Pass', bm: 'Pembayaran & Pasport Kredit' };
    case 'underwriting_score':
      return { en: 'Credit Score & DSR Inquiry', bm: 'Pertanyaan Skor Kredit & DSR' };
    case 'disbursement_lender':
      return { en: 'Lender Matching & Payout Status', bm: 'Status Padanan Bank & Pengeluaran' };
    case 'account_security':
      return { en: 'Account Settings & Privacy', bm: 'Tetapan Akaun & Keselamatan' };
    case 'general_support':
    default:
      return { en: 'Customer Care & General Support', bm: 'Khidmat Pelanggan & Bantuan Am' };
  }
}

export function getSupportTickets(): SupportTicket[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading support tickets from localStorage:", e);
    return [];
  }
}

export function saveSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status' | 'categoryLabel' | 'categoryLabelBm' | 'slaMinutes'> & { id?: string; categoryLabel?: string; categoryLabelBm?: string; slaMinutes?: number }): SupportTicket {
  if (typeof window === 'undefined') {
    throw new Error("Cannot save ticket in non-browser environment");
  }

  const existing = getSupportTickets();
  const id = ticket.id || generateTicketId();
  const labels = getCategoryLabels(ticket.category);

  const newTicket: SupportTicket = {
    id,
    category: ticket.category,
    categoryLabel: ticket.categoryLabel || labels.en,
    categoryLabelBm: ticket.categoryLabelBm || labels.bm,
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority || 'normal',
    status: 'open',
    createdAt: new Date().toISOString(),
    slaMinutes: ticket.priority === 'urgent' ? 15 : (ticket.priority === 'high' ? 30 : 60),
    userContact: ticket.userContact,
    agentDiagnostic: ticket.agentDiagnostic
  };

  const updated = [newTicket, ...existing.filter(t => t.id !== id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving support ticket:", e);
  }

  return newTicket;
}

export function updateSupportTicketStatus(id: string, status: TicketStatus, resolutionNote?: string): SupportTicket[] {
  if (typeof window === 'undefined') return [];
  const existing = getSupportTickets();
  const updated = existing.map(t => {
    if (t.id === id) {
      return {
        ...t,
        status,
        resolutionNote: resolutionNote !== undefined ? resolutionNote : t.resolutionNote
      };
    }
    return t;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error updating support ticket:", e);
  }

  return updated;
}
