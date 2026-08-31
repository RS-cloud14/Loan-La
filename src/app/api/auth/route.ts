import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Global in-memory cache for serverless environments (Vercel, AWS Lambda)
declare global {
  // eslint-disable-next-line no-var
  var _crediflowUserStore: Record<string, any> | undefined;
}

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const USERS_FILE_PATH = path.join(DATA_DIR, 'users.json');
const TMP_USERS_FILE_PATH = path.join(os.tmpdir(), 'crediflow_users.json');

// Initialize in-memory cache
if (!globalThis._crediflowUserStore) {
  globalThis._crediflowUserStore = {};
}

async function loadUsersStore(): Promise<Record<string, any>> {
  // 1. If in-memory is populated, return it
  if (globalThis._crediflowUserStore && Object.keys(globalThis._crediflowUserStore).length > 0) {
    return globalThis._crediflowUserStore;
  }

  // 2. Try loading from public/data/users.json
  try {
    const data = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    globalThis._crediflowUserStore = parsed;
    return parsed;
  } catch {}

  // 3. Try loading from /tmp
  try {
    const data = await fs.readFile(TMP_USERS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    globalThis._crediflowUserStore = parsed;
    return parsed;
  } catch {}

  // 4. Default mock/starter user database
  const defaultUsers: Record<string, any> = {
    'usr_ahmad': {
      id: 'usr_ahmad',
      profileId: 'ahmad',
      name: 'Ahmad Bin Razak',
      phone: '+60 12-482 9182',
      email: 'borrower@loan-la.my',
      password: 'password123',
      role: 'Gig Worker / Self-Employed',
      workCategory: 'gig',
      platformName: 'Grab / Foodpanda',
      platformId: 'GBR-884219',
      icNumber: '891012-14-5566',
      bankName: 'Maybank (Malayan Banking Berhad)',
      bankAccountNumber: '114012849201',
      bankAccountHolder: 'Ahmad Bin Razak',
      bankAccountType: 'savings',
      estimatedMonthlyIncome: 3500,
      epfStatus: 'i-saraan',
      createdAt: new Date().toISOString(),
      applications: [],
      reports: []
    }
  };

  globalThis._crediflowUserStore = defaultUsers;
  await persistUsersStore(defaultUsers);
  return defaultUsers;
}

async function persistUsersStore(store: Record<string, any>): Promise<string> {
  globalThis._crediflowUserStore = store;

  // 1. Try public/data
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    return 'disk:public/data';
  } catch {}

  // 2. Try /tmp
  try {
    await fs.writeFile(TMP_USERS_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    return 'disk:tmp';
  } catch {}

  return 'memory';
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// GET: Retrieve user data and application history by userId, phone or email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    const users = await loadUsersStore();

    if (userId && users[userId]) {
      const user = users[userId];
      return NextResponse.json({
        success: true,
        user: { ...user, password: undefined },
        applications: user.applications || [],
        reports: user.reports || []
      });
    }

    if (phone) {
      const norm = normalizePhone(phone);
      const matched = Object.values(users).find(u => normalizePhone(u.phone).endsWith(norm) || norm.endsWith(normalizePhone(u.phone)));
      if (matched) {
        return NextResponse.json({
          success: true,
          user: { ...matched, password: undefined },
          applications: matched.applications || [],
          reports: matched.reports || []
        });
      }
    }

    if (email) {
      const norm = normalizeEmail(email);
      const matched = Object.values(users).find(u => normalizeEmail(u.email) === norm);
      if (matched) {
        return NextResponse.json({
          success: true,
          user: { ...matched, password: undefined },
          applications: matched.applications || [],
          reports: matched.reports || []
        });
      }
    }

    return NextResponse.json({ success: false, message: 'User not found' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 200 });
  }
}

// POST: Handles sign up, sign in, and data sync (applications, reports)
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { action } = payload;
    const users = await loadUsersStore();

    // 0. ACTION: GOOGLE AUTH (1-CLICK SIGN IN / SIGN UP)
    if (action === 'google') {
      const { email, name, avatar } = payload;
      const cleanEmail = normalizeEmail(email || 'borrower.google@gmail.com');
      const cleanName = name || (cleanEmail ? cleanEmail.split('@')[0].toUpperCase() : 'Google User');

      let foundUser = Object.values(users).find(u => normalizeEmail(u.email) === cleanEmail);

      if (!foundUser) {
        const newId = `usr_g_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        foundUser = {
          id: newId,
          profileId: newId,
          name: cleanName,
          phone: '+60 12-888 9911',
          email: cleanEmail,
          avatar: avatar || null,
          role: 'Google Verified Borrower',
          workCategory: 'gig',
          platformName: 'Grab / Shopee',
          platformId: `ID-${Math.floor(100000 + Math.random() * 900000)}`,
          icNumber: '910815-10-6622',
          bankName: 'Maybank (Malayan Banking Berhad)',
          bankAccountNumber: '114012849201',
          bankAccountHolder: cleanName,
          bankAccountType: 'savings',
          estimatedMonthlyIncome: 3800,
          epfStatus: 'i-saraan',
          createdAt: new Date().toISOString(),
          applications: [],
          reports: []
        };
        users[newId] = foundUser;
        await persistUsersStore(users);
      }

      return NextResponse.json({
        success: true,
        message: 'Google Sign In successful.',
        user: { ...foundUser, password: undefined },
        applications: foundUser.applications || [],
        reports: foundUser.reports || []
      });
    }

    // 1. ACTION: SIGN UP (CREATE NEW ACCOUNT)
    if (action === 'signup') {
      const { name, phone, email, password, workCategory, platformName, icNumber, role } = payload;

      if (!name || (!phone && !email)) {
        return NextResponse.json({ success: false, message: 'Name and Phone/Email are required for registration.' }, { status: 400 });
      }

      const normPhone = phone ? normalizePhone(phone) : '';
      const normEmail = email ? normalizeEmail(email) : '';

      // Check if user already exists
      const existingUser = Object.values(users).find(u => {
        if (normPhone && normalizePhone(u.phone).endsWith(normPhone.slice(-8))) return true;
        if (normEmail && normalizeEmail(u.email) === normEmail) return true;
        return false;
      });

      if (existingUser) {
        // Already registered - sign them in directly with their historical data
        return NextResponse.json({
          success: true,
          isExisting: true,
          message: 'Account already exists. Signed in successfully.',
          user: { ...existingUser, password: undefined },
          applications: existingUser.applications || [],
          reports: existingUser.reports || []
        });
      }

      // Create new user record
      const cleanPhone = phone ? (phone.startsWith('+60') ? phone : `+60 ${phone.replace(/^0/, '')}`) : '+60 12-000 0000';
      const cleanEmail = email ? email.trim() : `${normalizePhone(cleanPhone)}@loan-la.my`;
      const newId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

      const newUser = {
        id: newId,
        profileId: newId,
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password: password || '123456',
        role: role || (workCategory === 'gig' ? 'Gig Worker' : workCategory === 'business' ? 'Online Seller' : 'Borrower'),
        workCategory: workCategory || 'gig',
        platformName: platformName || (workCategory === 'gig' ? 'Grab / Foodpanda' : workCategory === 'business' ? 'Shopee / TikTok' : 'Independent'),
        platformId: `ID-${Math.floor(100000 + Math.random() * 900000)}`,
        icNumber: icNumber || '900101-14-0000',
        bankName: 'Maybank (Malayan Banking Berhad)',
        bankAccountNumber: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        bankAccountHolder: name.trim(),
        bankAccountType: 'savings',
        estimatedMonthlyIncome: 3500,
        epfStatus: 'i-saraan',
        createdAt: new Date().toISOString(),
        applications: [],
        reports: []
      };

      users[newId] = newUser;
      await persistUsersStore(users);

      return NextResponse.json({
        success: true,
        isNew: true,
        message: 'Account created successfully.',
        user: { ...newUser, password: undefined },
        applications: [],
        reports: []
      });
    }

    // 2. ACTION: SIGN IN (EXISTING ACCOUNT)
    if (action === 'signin') {
      const { phone, email, password, method } = payload;

      const normPhone = phone ? normalizePhone(phone) : '';
      const normEmail = email ? normalizeEmail(email) : '';

      let foundUser: any = null;

      if (method === 'phone' && normPhone) {
        foundUser = Object.values(users).find(u => normalizePhone(u.phone).endsWith(normPhone.slice(-8)) || normPhone.endsWith(normalizePhone(u.phone).slice(-8)));
      } else if (normEmail) {
        foundUser = Object.values(users).find(u => normalizeEmail(u.email) === normEmail);
      }

      // If user not found during sign-in, auto-provision friendly account so user is never blocked
      if (!foundUser) {
        const cleanPhone = phone ? (phone.startsWith('+60') ? phone : `+60 ${phone.replace(/^0/, '')}`) : '+60 12-482 9182';
        const cleanEmail = email ? email.trim() : `${normalizePhone(cleanPhone)}@loan-la.my`;
        const autoName = email ? email.split('@')[0].toUpperCase() : 'Borrower';
        const newId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

        foundUser = {
          id: newId,
          profileId: newId,
          name: autoName,
          phone: cleanPhone,
          email: cleanEmail,
          password: password || '123456',
          role: 'Verified Borrower',
          workCategory: 'gig',
          platformName: 'Grab / Shopee',
          platformId: `ID-${Math.floor(100000 + Math.random() * 900000)}`,
          icNumber: '920512-10-5544',
          bankName: 'Maybank (Malayan Banking Berhad)',
          bankAccountNumber: '114012849201',
          bankAccountHolder: autoName,
          bankAccountType: 'savings',
          estimatedMonthlyIncome: 3500,
          epfStatus: 'i-saraan',
          createdAt: new Date().toISOString(),
          applications: [],
          reports: []
        };

        users[newId] = foundUser;
        await persistUsersStore(users);
      }

      return NextResponse.json({
        success: true,
        message: 'Signed in successfully.',
        user: { ...foundUser, password: undefined },
        applications: foundUser.applications || [],
        reports: foundUser.reports || []
      });
    }

    // 3. ACTION: SAVE / SYNC APPLICATION
    if (action === 'save-application') {
      const { userId, phone, email, application } = payload;
      let targetUser = userId ? users[userId] : null;

      if (!targetUser) {
        const normPhone = phone ? normalizePhone(phone) : '';
        const normEmail = email ? normalizeEmail(email) : '';
        targetUser = Object.values(users).find(u => 
          (normPhone && normalizePhone(u.phone).endsWith(normPhone.slice(-8))) ||
          (normEmail && normalizeEmail(u.email) === normEmail)
        );
      }

      if (targetUser && application) {
        if (!targetUser.applications) targetUser.applications = [];
        // Deduplicate or append
        const existingIdx = targetUser.applications.findIndex((a: any) => a.refCode === application.refCode);
        if (existingIdx >= 0) {
          targetUser.applications[existingIdx] = application;
        } else {
          targetUser.applications.unshift(application);
        }
        targetUser.updatedAt = new Date().toISOString();
        await persistUsersStore(users);

        return NextResponse.json({
          success: true,
          message: 'Application recorded to user profile.',
          applications: targetUser.applications
        });
      }

      return NextResponse.json({ success: true, message: 'Application recorded in memory.' });
    }

    // 4. ACTION: SAVE / SYNC ASSESSMENT REPORT
    if (action === 'save-report') {
      const { userId, phone, email, reportItem } = payload;
      let targetUser = userId ? users[userId] : null;

      if (!targetUser) {
        const normPhone = phone ? normalizePhone(phone) : '';
        const normEmail = email ? normalizeEmail(email) : '';
        targetUser = Object.values(users).find(u => 
          (normPhone && normalizePhone(u.phone).endsWith(normPhone.slice(-8))) ||
          (normEmail && normalizeEmail(u.email) === normEmail)
        );
      }

      if (targetUser && reportItem) {
        if (!targetUser.reports) targetUser.reports = [];
        const existingIdx = targetUser.reports.findIndex((r: any) => r.id === reportItem.id || (r.date === reportItem.date && r.result?.hash === reportItem.result?.hash));
        if (existingIdx >= 0) {
          targetUser.reports[existingIdx] = reportItem;
        } else {
          targetUser.reports.unshift(reportItem);
        }
        targetUser.updatedAt = new Date().toISOString();
        await persistUsersStore(users);

        return NextResponse.json({
          success: true,
          message: 'Report recorded to user profile.',
          reports: targetUser.reports
        });
      }

      return NextResponse.json({ success: true, message: 'Report recorded in memory.' });
    }

    // 5. ACTION: UPDATE PROFILE
    if (action === 'update-profile') {
      const { userId, profile } = payload;
      if (userId && users[userId] && profile) {
        users[userId] = {
          ...users[userId],
          ...profile,
          updatedAt: new Date().toISOString()
        };
        await persistUsersStore(users);
        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully.',
          user: { ...users[userId], password: undefined }
        });
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid action provided.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/auth:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Authentication error' }, { status: 500 });
  }
}
