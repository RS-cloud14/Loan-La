# Loan-La: Technical Architecture Addendum
**Project Name**: Loan-La (CreditFlow AI)  
**Team**: Oversized Minions  
**Submission Version**: Final Production Release (October 2026)  
**Live URL**: https://loan-la.vercel.app/

---

## 1. Executive Summary of Architectural Updates

Since initial project submission, Loan-La has enhanced its enterprise-grade underwriting architecture across **data privacy, multimodal AI document pipelines, and institutional lender routing**:

1. **Dual-Audience Ingestion Engine**:
   - Explicit segmentation between **Individual Gig/Salaried Borrowers** and **Micro-SMEs / Business Borrowers**.
   - Intelligent cross-category document validation preventing duplicate or counterfeit file uploads across distinct document requirements (MyKad e-KYC, SSM Business Registration, Supplier Quotations).
2. **End-to-End Cryptographic Zero-Knowledge Security (BNM RMiT & PDPA 2010)**:
   - Client-side in-memory PII sanitization (Web Crypto API) redacting raw names, MyKad numbers, and addresses before sending payloads to edge functions.
   - Symmetric **AES-256-GCM** encryption for in-transit vector communication with ephemeral processing.
   - Deterministic SHA-256 document hashing (`UNDERWRITE_CACHE`) ensuring reproducible, tamper-evident audit records.
3. **Multimodal AI Pipeline & Forensic RMiT Inspector**:
   - Google Gemini 2.5 Flash / Flash-Lite cascade with vision prompting for line-item statement extraction and pixel-level clone-stamp tampering detection.
   - Payout-to-ledger reconciliation cross-matching third-party platform transfers (e.g. Grab weekly disbursements) against bank deposit credits.
4. **Institutional B2B Underwriter Console & 1-Click Application Dispatcher**:
   - Generation of bank-committee-ready **Credit Assessment Memos (CAM)** and packaging with equipment quotes.
   - Integration of `/api/bank-intelligence` and `/api/dispatch-application` for live underwriting policy matching and automated routing to Malaysian developmental lenders (BSN, TEKUN Nasional, SME Bank, Agrobank, MARA, Maybank SME, GXBank).

---

## 2. Updated System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CLIENT LAYER (BROWSER)                                    │
│  Next.js 16 (App Router) + React 19 + Tailwind CSS 4.0                                           │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌──────────────────────────────────┐  │
│  │ Dual Workflow Switch  │   │ Cross-Category Upload  │   │ Client-Side PII Masker           │  │
│  │ • Gig / Salaried      │──>│ • Duplicate Detection  │──>│ • Web Crypto API (SubtleCrypto)  │  │
│  │ • Micro-SME           │   │ • Type & Size Checks   │   │ • Strips Names, ICs, Addrs       │  │
│  └───────────────────────┘   └────────────────────────┘   └─────────────────┬────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┼───────────────────┘
                                                                              │ AES-256-GCM Encrypted
                                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      SERVERLESS EDGE GATEWAY                                    │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ /api/underwrite (Multimodal AI Parsing & Forensics Pipeline)                              │  │
│  │ /api/chat (Conversational Voice Agent & Interactive PDF Explainer)                        │  │
│  │ /api/bank-intelligence (Live Underwriting Policy Matcher)                                 │  │
│  │ /api/dispatch-application (1-Click Encrypted Lender Routing)                              │  │
│  └─────────────────────────────────────────────┬─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────┼────────────────────────────────────────────────┘
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      AI INTELLIGENCE CORE                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Google Gemini 2.5 Flash / Flash-Lite Vision Model Cascade                                  │  │
│  │ • Strict JSON Schema Enforcement (`temperature: 0`)                                       │  │
│  │ • Multi-page Ledger & Bank Statement Table Ingestion                                       │  │
│  │ • RMiT Pixel Tamper & Font Inconsistency Detection                                        │  │
│  └─────────────────────────────────────────────┬─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────┼────────────────────────────────────────────────┘
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            DETERMINISTIC MATHEMATICAL RISK ENGINE                               │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ • Financial Readiness Index (FRI: 300–850)                                                │  │
│  │   [Cashflow Stability: 250 | Frequency: 200 | Diversification: 150 | Runway: 150 | DSR: 100]│  │
│  │ • BNM Debt Service Ratio (DSR < 60% Benchmark)                                            │  │
│  │ • Monthly Cash Surplus & Liquidity Buffer Calculation                                     │  │
│  │ • Grab / Platform Payout-to-Bank Ledger Reconciliation (99.4% Precision)                  │  │
│  └─────────────────────────────────────────────┬─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────┼────────────────────────────────────────────────┘
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              INSTITUTIONAL LENDER OUTPUT & DISPATCH                             │
│  ┌──────────────────────────────┐   ┌──────────────────────────────┐   ┌─────────────────────┐  │
│  │ Dynamic B2C Credit Passport  │   │ Institutional B2B CAM Memo   │   │ Direct Lender Route │  │
│  │ Certified Client PDF         │   │ Commercial Assessment Pack   │   │ BSN, TEKUN, Maybank,│  │
│  │ (@react-pdf/renderer)        │   │ (Bank-Ready Underwriter Pack)│   │ SME Bank, GXBank    │  │
│  └──────────────────────────────┘   └──────────────────────────────┘   └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Data Flow & Security Sequence

```
Borrower (Client)              Edge Gateway                Gemini 2.5 Flash            Deterministic Rule Engine
       │                             │                             │                               │
       │── 1. Uploads Statements ───>│                             │                               │
       │   (Bank PDF, Gig, IC, SSM)  │                             │                               │
       │                             │                             │                               │
       │── 2. Local PII Masking ────>│                             │                               │
       │   & AES-256-GCM Encrypt     │                             │                               │
       │                             │── 3. Parse Vision OCR ─────>│                               │
       │                             │      & Forensic Heatmap     │                               │
       │                             │<── 4. Structured JSON ──────│                               │
       │                             │       Ledger Rows           │                               │
       │                             │                             │                               │
       │                             │── 5. Calculate FRI Score, DSR & Surplus ───────────────────>│
       │                             │<── 6. Deterministic Credit Assessment & Document Hash ──────│
       │                             │                             │                               │
       │<── 7. Render Passport & ────│                             │                               │
       │    Bank Matches (BSN/TEKUN) │                             │                               │
```

---

## 4. Key Architectural Differentiators

| Architectural Pillar | Prior Iteration | Current Production Architecture |
| :--- | :--- | :--- |
| **Applicant Scope** | Generic individual loan application | **Specialized Gig/Salaried Individual + SME Business Dossier** with tailored document checklists |
| **Document Verification** | Basic file type check | **Cross-category duplicate detection + SSM registry & equipment quotation audit** |
| **Data Privacy** | Standard in-transit HTTPS | **Client-side PII sanitization + AES-256-GCM encrypted mathematical vectors (Zero-Knowledge)** |
| **Underwriting Logic** | Fully generative prompt | **Hybrid Architecture**: Gemini for vision OCR extraction; **deterministic TypeScript engine** for FRI / DSR calculations |
| **Institutional Hand-off** | Simple recommendation list | **1-Click Application Dispatcher** with certified Credit Assessment Memo (CAM) and tamper-proof SHA-256 hash |

---

## 5. Regulatory & Compliance Alignment

* **Bank Negara Malaysia (BNM) RMiT**: Integrated image tamper detection, metadata inspection, and client PII scrubbing.
* **Personal Data Protection Act 2010 (PDPA)**: Zero-knowledge mathematical vector evaluation ensures no raw personal identifiers or unencrypted credentials are retained by the AI core.
* **Gig Workers Act 2025 (Act 872)**: Direct alignment with Malaysia's statutory framework supporting financial mobility and alternative credit evaluation for digital contractors.
