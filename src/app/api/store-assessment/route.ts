import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const FILE_PATH = path.join(DATA_DIR, 'latest_assessment.json');

// Ensure data directory exists
async function ensureDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn("Could not create data directory:", e);
  }
}

// GET: Retrieve latest assessment JSON stored on disk
export async function GET() {
  try {
    await ensureDirectory();
    try {
      const data = await fs.readFile(FILE_PATH, 'utf-8');
      return NextResponse.json({ success: true, data: JSON.parse(data) });
    } catch {
      return NextResponse.json({ success: false, message: "No assessment data saved yet." }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save assessment data to JSON file
export async function POST(request: NextRequest) {
  try {
    await ensureDirectory();
    const payload = await request.json();

    const record = {
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
      ...payload
    };

    await fs.writeFile(FILE_PATH, JSON.stringify(record, null, 2), 'utf-8');

    // Also write a timestamped history backup
    try {
      const historyDir = path.join(DATA_DIR, 'history');
      await fs.mkdir(historyDir, { recursive: true });
      const historyFile = path.join(historyDir, `assessment_${Date.now()}.json`);
      await fs.writeFile(historyFile, JSON.stringify(record, null, 2), 'utf-8');
    } catch (e) {
      console.warn("History backup skipped:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Assessment data successfully saved to JSON file.",
      filePath: "public/data/latest_assessment.json",
      timestamp: record.updatedAt
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
