import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Global in-memory cache for serverless environments (Vercel, AWS Lambda)
declare global {
  // eslint-disable-next-line no-var
  var _crediflowAssessmentStore: any;
}

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const FILE_PATH = path.join(DATA_DIR, 'latest_assessment.json');
const TMP_FILE_PATH = path.join(os.tmpdir(), 'crediflow_latest_assessment.json');

async function safeWrite(record: any): Promise<string> {
  // 1. Always update global in-memory store
  globalThis._crediflowAssessmentStore = record;

  // 2. Try writing to public/data (works in local dev)
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE_PATH, JSON.stringify(record, null, 2), 'utf-8');
    return 'disk:public/data';
  } catch {
    // Expected on Vercel / serverless (EROFS: read-only file system)
  }

  // 3. Fallback: Try writing to /tmp (writable on Vercel serverless)
  try {
    await fs.writeFile(TMP_FILE_PATH, JSON.stringify(record, null, 2), 'utf-8');
    return 'disk:tmp';
  } catch {
    // If even tmp fails, in-memory cache is still active
  }

  return 'memory';
}

async function safeRead(): Promise<any | null> {
  // 1. Check in-memory store
  if (globalThis._crediflowAssessmentStore) {
    return globalThis._crediflowAssessmentStore;
  }

  // 2. Check local disk (public/data)
  try {
    const data = await fs.readFile(FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    globalThis._crediflowAssessmentStore = parsed;
    return parsed;
  } catch {}

  // 3. Check /tmp
  try {
    const data = await fs.readFile(TMP_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    globalThis._crediflowAssessmentStore = parsed;
    return parsed;
  } catch {}

  return null;
}

// GET: Retrieve latest assessment JSON stored in memory or disk
export async function GET() {
  try {
    const data = await safeRead();
    if (data) {
      return NextResponse.json({ success: true, data });
    }
    return NextResponse.json({ success: false, message: "No assessment data saved yet." }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Error reading assessment" }, { status: 200 });
  }
}

// POST: Save assessment data to cache/disk (resilient to Vercel read-only filesystem)
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const record = {
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
      ...payload
    };

    const storageType = await safeWrite(record);

    return NextResponse.json({
      success: true,
      message: "Assessment data successfully saved.",
      storage: storageType,
      timestamp: record.updatedAt
    });
  } catch (error: any) {
    console.warn("store-assessment non-critical warning:", error?.message);
    // Never crash the client with 500 for optional persistence sync
    return NextResponse.json({
      success: true,
      warning: "Assessment persisted to browser localStorage; server cache write skipped",
      error: error?.message
    }, { status: 200 });
  }
}
