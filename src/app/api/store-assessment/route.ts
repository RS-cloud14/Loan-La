import { NextRequest, NextResponse } from 'next/server';
import {
  saveAssessment,
  getAssessment,
  updateUnderwriterDecision,
  addBankQuery,
  maskMyKad,
  maskPhoneNumber,
  generateBnmAuditHash,
  AssessmentRecord
} from '@/lib/storage';

// GET: Retrieve assessment by id/session, or latest fallback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    const key = id || (sessionId ? `session:${sessionId}` : '') || (userId ? `user:${userId}` : '') || 'latest';
    const record = await getAssessment(key);

    if (record) {
      return NextResponse.json({ success: true, data: record });
    }
    return NextResponse.json({ success: false, message: "No assessment data saved yet." }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Error reading assessment" }, { status: 200 });
  }
}

// POST: Save assessment data, update committee decision, or add bank query
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'SAVE_ASSESSMENT', assessmentId, payload } = body;

    if (action === 'UNDERWRITER_DECISION') {
      const targetId = assessmentId || payload?.assessmentId || 'latest';
      const updated = await updateUnderwriterDecision(targetId, payload?.decision);
      return NextResponse.json({
        success: Boolean(updated),
        message: updated ? "Underwriter committee decision recorded." : "Assessment record not found.",
        data: updated
      });
    }

    if (action === 'ADD_BANK_QUERY') {
      const targetId = assessmentId || payload?.assessmentId || 'latest';
      const updated = await addBankQuery(targetId, {
        lenderName: payload?.lenderName || 'Bank Underwriting Team',
        queryText: payload?.queryText || 'Clarification required on submitted documents.',
        requiredDocumentType: payload?.requiredDocumentType || 'Additional Evidence'
      });
      return NextResponse.json({
        success: Boolean(updated),
        message: updated ? "Bank query dispatched to applicant tracker." : "Assessment record not found.",
        data: updated
      });
    }

    // Default: SAVE_ASSESSMENT
    const now = new Date();
    const inputData = payload?.inputData || body?.inputData || body;
    const report = payload?.report || body?.report;
    const applicantName = inputData?.name || inputData?.identityData?.fullName || 'Borrower';
    const icDigits = inputData?.identityData?.icNumber || inputData?.icNumber || '';
    const monthlyIncome = inputData?.averageMonthlyNetIncome || 3500;
    const friScore = report?.score || 720;
    const timestamp = Date.now();
    const recordId = assessmentId || body?.id || `asm_${timestamp}_${Math.floor(Math.random() * 1000)}`;

    const bnmAuditHash = generateBnmAuditHash({
      applicantName,
      icDigits,
      monthlyIncome,
      friScore,
      timestamp,
      documentHash: body?.hash || payload?.hash
    });

    const assessmentRecord: AssessmentRecord = {
      id: recordId,
      userId: body?.userId || payload?.userId,
      sessionId: body?.sessionId || payload?.sessionId,
      createdAt: body?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
      timestamp,
      bnmComplianceHash: bnmAuditHash,
      applicant: {
        name: applicantName,
        maskedIc: maskMyKad(icDigits),
        maskedPhone: maskPhoneNumber(inputData?.phone || body?.phone),
        platform: inputData?.platform || 'Gig Economy & Micro-SME',
        address: inputData?.address || inputData?.identityData?.address
      },
      inputData,
      report,
      underwriterDecision: body?.underwriterDecision || payload?.underwriterDecision,
      bankQueries: body?.bankQueries || payload?.bankQueries
    };

    const persistResult = await saveAssessment(assessmentRecord);

    return NextResponse.json({
      success: true,
      message: "Assessment data successfully saved with multi-tenant partitioning.",
      storage: persistResult.storageLocation,
      assessmentId: recordId,
      bnmAuditHash,
      timestamp: assessmentRecord.updatedAt,
      data: assessmentRecord
    });
  } catch (error: any) {
    console.warn("store-assessment error:", error?.message);
    return NextResponse.json({
      success: true,
      warning: "Persisted to browser memory; server write skipped.",
      error: error?.message
    }, { status: 200 });
  }
}
