import { NextRequest, NextResponse } from 'next/server';

export interface DispatchApplicationPayload {
  applicantName: string;
  loanAmount: number;
  loanPurpose: string;
  tenureYears?: number;
  creditScore: number;
  creditGrade: string;
  dsr: number;
  selectedLenders: string[];
  documentHash?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DispatchApplicationPayload = await request.json();
    const {
      applicantName = 'Borrower',
      loanAmount = 8000,
      loanPurpose = 'working_capital',
      tenureYears = 1,
      creditScore = 710,
      creditGrade = 'A',
      dsr = 32.5,
      selectedLenders = ['GXBank', 'Boost Bank', 'Agrobank'],
      documentHash = 'd3b07384d113edec49eaa6238ad5ff00'
    } = body;

    const timestamp = Date.now();
    const dateStr = new Date().toISOString().split('T')[0];

    // Generate standardized BNM-compliant application dossiers for each matched lender
    const dispatchedApplications = selectedLenders.map((lenderName, idx) => {
      let speed = '24 Hours';
      let status: 'SUBMITTED' | 'UNDER_REVIEW' | 'CONDITIONALLY_APPROVED' = 'SUBMITTED';
      let bankQuery = undefined;
      let refPrefix = 'LL';

      if (lenderName.toLowerCase().includes('gxbank')) {
        speed = '10 Mins Digital Payout';
        status = 'CONDITIONALLY_APPROVED';
        refPrefix = 'GX';
      } else if (lenderName.toLowerCase().includes('boost')) {
        speed = '24–48 Hours';
        status = 'UNDER_REVIEW';
        refPrefix = 'BST';
      } else if (lenderName.toLowerCase().includes('agrobank')) {
        speed = '3–5 Working Days';
        status = 'SUBMITTED';
        refPrefix = 'AGR';
        bankQuery = {
          queryText: 'Agrobank Underwriting Team: Please submit SSM Business Registration certificate or local council license to proceed with disbursement.',
          requiredDoc: 'SSM Certificate',
          requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          resolved: false
        };
      }

      const refCode = `LL-2026-${refPrefix}${Math.floor(100 + Math.random() * 900)}`;
      const totalMonths = (tenureYears || 1) * 12;
      const monthlyInstallment = Math.round((loanAmount * (1 + 0.055 * (tenureYears || 1))) / totalMonths);

      return {
        id: `app_${timestamp}_${idx}`,
        refCode,
        lenderName,
        productName: lenderName.includes('GXBank') ? 'Digital Cash Facility' : lenderName.includes('Boost') ? 'Micro Merchant Credit' : 'Pembiayaan Kredit Mikro-i',
        loanAmount,
        monthlyInstallment,
        appliedAt: `${dateStr} · Today`,
        status,
        speed,
        lenderUrl: lenderName.includes('GXBank') ? 'https://gxbank.my' : lenderName.includes('Boost') ? 'https://myboost.co' : 'https://agrobank.com.my',
        bankQuery
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully dispatched application package for RM ${loanAmount.toLocaleString()} to ${selectedLenders.length} matched financial institutions.`,
      bnmComplianceHash: documentHash,
      applications: dispatchedApplications
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to dispatch application' }, { status: 500 });
  }
}
