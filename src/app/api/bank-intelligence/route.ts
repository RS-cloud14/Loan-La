import { NextRequest, NextResponse } from 'next/server';
import { getBankIntelligenceState, runBankIntelligenceAgent } from '@/lib/bankIntelligence';

export async function GET() {
  try {
    const state = await getBankIntelligenceState();
    return NextResponse.json({
      success: true,
      data: state
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to retrieve bank intelligence'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { targetLenderId } = body;

    const result = await runBankIntelligenceAgent(targetLenderId);

    return NextResponse.json({
      success: result.success,
      message: `AI Bank Intelligence Agent scanned ${result.scannedCount} Malaysian financial institutions.`,
      updatesFound: result.updatesFound,
      state: result.state
    });
  } catch (err: any) {
    console.error("API /api/bank-intelligence error:", err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to execute bank intelligence audit'
    }, { status: 500 });
  }
}
