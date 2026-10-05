import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface PiiMaskedApplicant {
  name: string;
  maskedIc: string;
  maskedPhone?: string;
  maskedEmail?: string;
  platform: string;
  address?: string;
}

export interface AssessmentRecord {
  id: string;
  userId?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  timestamp: number;
  bnmComplianceHash: string;
  applicant: PiiMaskedApplicant;
  inputData: any;
  report: any;
  underwriterDecision?: {
    verdict: 'APPROVED' | 'CONDITIONALLY_APPROVED' | 'REFER_TO_COMMITTEE' | 'QUERY_REQUIRED' | 'DECLINED';
    recommendedQuantum: number;
    recommendedTenureMonths: number;
    counterOfferRate: number;
    dsrAtRecommendedQuantum: number;
    covenants: string[];
    riskNotes: string;
    decidedBy: string;
    decidedAt: string;
  };
  bankQueries?: Array<{
    id: string;
    lenderName: string;
    queryText: string;
    requiredDocumentType: string;
    requestedAt: string;
    resolved: boolean;
    responseDocName?: string;
  }>;
}

// Global in-memory cache for serverless environments (Vercel, AWS Lambda)
declare global {
  // eslint-disable-next-line no-var
  var _loanLaMultiTenantStore: Map<string, AssessmentRecord> | undefined;
}

if (!globalThis._loanLaMultiTenantStore) {
  globalThis._loanLaMultiTenantStore = new Map<string, AssessmentRecord>();
}

const LOCAL_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'assessments');
const TMP_DATA_DIR = path.join(os.tmpdir(), 'loanla_assessments');

export { maskMyKad, maskBankAccount, maskPhoneNumber } from './masking';

/**
 * Generate immutable SHA-256 compliance hash for Bank Negara Malaysia (BNM) RMiT audits
 */
export function generateBnmAuditHash(payload: {
  applicantName: string;
  icDigits: string;
  monthlyIncome: number;
  friScore: number;
  timestamp: number;
  documentHash?: string;
}): string {
  const seed = `${payload.applicantName}|${payload.icDigits}|${payload.monthlyIncome}|${payload.friScore}|${payload.timestamp}|${payload.documentHash || 'zero-hash'}`;
  return crypto.createHash('sha256').update(seed).digest('hex');
}

/**
 * Persist an assessment record with user-isolated partitioning
 */
export async function saveAssessment(record: AssessmentRecord): Promise<{ success: boolean; storageLocation: string }> {
  // 1. Always store in global in-memory multi-tenant registry
  globalThis._loanLaMultiTenantStore?.set(record.id, record);
  if (record.sessionId) {
    globalThis._loanLaMultiTenantStore?.set(`session:${record.sessionId}`, record);
  }
  if (record.userId) {
    globalThis._loanLaMultiTenantStore?.set(`user:${record.userId}`, record);
  }

  // 2. Try writing to local project disk (dev environment)
  try {
    await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
    const localFile = path.join(LOCAL_DATA_DIR, `${record.id}.json`);
    await fs.writeFile(localFile, JSON.stringify(record, null, 2), 'utf-8');

    // Also mirror to legacy latest_assessment.json for backward compatibility
    const legacyPath = path.join(process.cwd(), 'public', 'data', 'latest_assessment.json');
    await fs.writeFile(legacyPath, JSON.stringify(record, null, 2), 'utf-8');
    return { success: true, storageLocation: 'local_disk' };
  } catch {
    // EROFS or permissions on serverless environments
  }

  // 3. Fallback: Write to OS temp directory (writable on Vercel)
  try {
    await fs.mkdir(TMP_DATA_DIR, { recursive: true });
    const tmpFile = path.join(TMP_DATA_DIR, `${record.id}.json`);
    await fs.writeFile(tmpFile, JSON.stringify(record, null, 2), 'utf-8');
    return { success: true, storageLocation: 'tmp_disk' };
  } catch {
    // Memory cache active
  }

  return { success: true, storageLocation: 'memory' };
}

/**
 * Retrieve an assessment record by ID or session key
 */
export async function getAssessment(idOrSessionKey: string): Promise<AssessmentRecord | null> {
  // 1. In-memory check
  if (globalThis._loanLaMultiTenantStore?.has(idOrSessionKey)) {
    return globalThis._loanLaMultiTenantStore.get(idOrSessionKey) || null;
  }

  // 2. Local disk check
  try {
    const localFile = path.join(LOCAL_DATA_DIR, `${idOrSessionKey}.json`);
    const data = await fs.readFile(localFile, 'utf-8');
    const parsed = JSON.parse(data);
    globalThis._loanLaMultiTenantStore?.set(idOrSessionKey, parsed);
    return parsed;
  } catch {}

  // 3. Tmp disk check
  try {
    const tmpFile = path.join(TMP_DATA_DIR, `${idOrSessionKey}.json`);
    const data = await fs.readFile(tmpFile, 'utf-8');
    const parsed = JSON.parse(data);
    globalThis._loanLaMultiTenantStore?.set(idOrSessionKey, parsed);
    return parsed;
  } catch {}

  // 4. Fallback to latest legacy assessment
  try {
    const legacyPath = path.join(process.cwd(), 'public', 'data', 'latest_assessment.json');
    const data = await fs.readFile(legacyPath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed;
  } catch {}

  return null;
}

/**
 * Update an underwriter committee decision on an existing assessment
 */
export async function updateUnderwriterDecision(
  assessmentId: string,
  decision: AssessmentRecord['underwriterDecision']
): Promise<AssessmentRecord | null> {
  const existing = await getAssessment(assessmentId);
  if (!existing) return null;

  existing.underwriterDecision = decision;
  existing.updatedAt = new Date().toISOString();

  await saveAssessment(existing);
  return existing;
}

/**
 * Add a bank clarification query for the borrower
 */
export async function addBankQuery(
  assessmentId: string,
  query: {
    lenderName: string;
    queryText: string;
    requiredDocumentType: string;
  }
): Promise<AssessmentRecord | null> {
  const existing = await getAssessment(assessmentId);
  if (!existing) return null;

  const newQuery = {
    id: `qry_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...query,
    requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    resolved: false
  };

  if (!existing.bankQueries) existing.bankQueries = [];
  existing.bankQueries.push(newQuery);
  existing.updatedAt = new Date().toISOString();

  await saveAssessment(existing);
  return existing;
}
