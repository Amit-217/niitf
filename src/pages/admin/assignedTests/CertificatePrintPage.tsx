import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../../../api/axios";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QP {
  _id: string;
  title: string;
  subject?: string;
  totalMarks: number;
  passingMarks: number;
  duration: number;
}

interface TestData {
  _id: string;
  assignId: string;
  questionPaper: QP;
  batch: { _id: string; batchId: string; batchName: string };
  scheduledAt: string;
  ndtMethod?: string;
  ndtLevel?: string;
  ndtTechnique?: string;
  limitations?: string;
  signatoryName1?: string;
}

interface SubmissionData {
  _id: string;
  submissionId: string;
  student: { _id: string; studentId: string; fullName: string; email: string };
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  status: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function fmtDate(d: string | Date) {
  const date = new Date(d);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function ndtMethodCode(subject: string) {
  const s = (subject || "").toLowerCase();
  if (s.includes("magnetic")) return "MT";
  if (s.includes("ultrasonic")) return "UT";
  if (s.includes("radiograph")) return "RT";
  if (s.includes("penetrant")) return "PT";
  if (s.includes("visual")) return "VT";
  if (s.includes("eddy")) return "ET";
  if (s.includes("flux")) return "MFL";
  return "NDT";
}

// ── Print styles ──────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  @media print {
    .no-print { display: none !important; }
    body { margin: 0 !important; background: #fff !important; }
    .cert-page { box-shadow: none !important; margin: 0 !important; }
  }
  @media screen {
    .cert-wrapper { background: #9ca3af; min-height: 100vh; padding: 24px 0; }
  }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-family: Arial, Helvetica, sans-serif;
  }
  * { box-sizing: border-box; }
`;

const BLUE = "#0C447C";

// ── Certificate Page Component ────────────────────────────────────────────────

export const CertificatePrintPage: React.FC = () => {
  const { testId, submissionId } = useParams<{
    testId: string;
    submissionId: string;
  }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<TestData | null>(null);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = PRINT_STYLES;
    document.head.appendChild(el);
    return () => {
      document.head.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (!testId || !submissionId) return;
    const load = async () => {
      try {
        const [testRes, resultsRes]: any[] = await Promise.all([
          api.get(`/assigned-tests/${testId}`),
          api.get(`/assigned-tests/${testId}/results`),
        ]);
        const testData: TestData = testRes?.data ?? testRes;
        setTest(testData);
        const submissions: SubmissionData[] = resultsRes?.submissions ?? [];
        const sub = submissions.find(
          (s) => s._id === submissionId || s.submissionId === submissionId,
        );
        if (!sub) throw new Error("Submission not found.");
        setSubmission(sub);
      } catch (e: any) {
        setError(e?.message || "Failed to load certificate data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [testId, submissionId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Loader2
          size={36}
          style={{ animation: "spin 1s linear infinite", color: BLUE }}
        />
      </div>
    );
  }

  if (error || !test || !submission) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 16,
        }}
      >
        <p style={{ color: "#dc2626", fontWeight: 600 }}>
          {error || "Certificate not found."}
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 20px",
            background: "#374151",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← Go Back
        </button>
      </div>
    );
  }

  // ── Compute certificate values ────────────────────────────────────────────
  const issuedAt = new Date(submission.submittedAt || Date.now());
  const expiryAt = new Date(issuedAt);
  expiryAt.setFullYear(expiryAt.getFullYear() + 5);

  let seq = "01";
  if (submission.submissionId) {
    const m = String(submission.submissionId).match(/(\d+)$/);
    if (m) seq = String(parseInt(m[1], 10)).padStart(2, "0");
  }
  const methodCode = ndtMethodCode(
    test.ndtMethod || test.questionPaper?.subject || "",
  );
  const levelCode = (test.ndtLevel || "Level II").replace(/^Level\s+/i, "");
  const yy = String(issuedAt.getFullYear()).slice(-2);
  const certNo = `NIIT/${methodCode}-${levelCode}/${yy}/${seq}`;

  const ndtMethod = test.ndtMethod || test.questionPaper?.subject || "-";
  const ndtLevel = test.ndtLevel || "Level II";
  const ndtTech = test.ndtTechnique || "-";
  const ndtLimits = test.limitations || "-";

  const studentName = "MR. " + submission.student.fullName.toUpperCase();
  const signatoryName = test.signatoryName1 || "Mr. B. R. Lohar";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="cert-wrapper">
      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          maxWidth: "210mm",
          margin: "0 auto 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 4px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px",
            background: "#374151",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          style={{
            padding: "7px 16px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          🖨 Print
        </button>
      </div>

      {/* A4 Certificate */}
      <div
        className="cert-page"
        style={{
          width: "210mm",
          height: "297mm",
          background: "#fff",
          margin: "0 auto",
          position: "relative",
          boxShadow: "0 6px 32px rgba(0,0,0,0.22)",
          overflow: "hidden",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* Outer border 3px */}
        <div
          style={{
            position: "absolute",
            top: "6.35mm",
            left: "6.35mm",
            right: "6.35mm",
            bottom: "6.35mm",
            border: `3px solid ${BLUE}`,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
        {/* Inner border 0.7px */}
        <div
          style={{
            position: "absolute",
            top: "8.47mm",
            left: "8.47mm",
            right: "8.47mm",
            bottom: "8.47mm",
            border: `0.7px solid ${BLUE}`,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            left: "8.47mm",
            right: "8.47mm",
            bottom: "8.47mm",
          }}
        >
          <div
            style={{ borderTop: `1.5px solid ${BLUE}`, marginBottom: "1.5mm" }}
          />
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "#444",
              margin: 0,
            }}
          >
            3rd Floor, Plot No. P&amp;T 12/B, Behind BSNL Office, MIDC,
            Ambarnath – 421135
          </p>
        </div>

        {/* Main content */}
        <div
          style={{
            position: "absolute",
            top: "13mm",
            left: "13mm",
            right: "13mm",
            bottom: "16mm",
            display: "flex",
            flexDirection: "column",
            fontSize: "14px",
            color: "#222",
          }}
        >
          {/* 1. Logo */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "2mm",
              marginTop: "-2mm",
            }}
          >
            <img
              src="/logo.png"
              alt="NIIT Logo"
              style={{ height: "30mm", width: "40mm", objectFit: "contain" }}
            />
          </div>

          {/* 2. Info Table — left, 60% width */}
          <div style={{ width: "60%", marginBottom: "4mm" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: `1px solid ${BLUE}`,
                fontSize: "14px",
              }}
            >
              <tbody>
                {(
                  [
                    ["Date Of Certification", fmtDate(issuedAt)],
                    ["Date Of Expiration", fmtDate(expiryAt)],
                    ["Certificate No.", certNo],
                  ] as [string, string][]
                ).map(([lbl, val], i) => (
                  <tr key={i}>
                    <td
                      style={{
                        padding: "2px 6px",
                        fontWeight: 700,
                        borderTop: i > 0 ? `0.5px solid ${BLUE}` : "none",
                        borderRight: `0.5px solid ${BLUE}`,
                        width: "45%",
                        verticalAlign: "middle",
                      }}
                    >
                      {lbl}
                    </td>
                    <td
                      style={{
                        padding: "2px 6px",
                        borderTop: i > 0 ? `0.5px solid ${BLUE}` : "none",
                        verticalAlign: "middle",
                      }}
                    >
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. Title Block with blue divider lines */}
          <div style={{ marginBottom: "4mm" }}>
            <div
              style={{ borderTop: `2px solid ${BLUE}`, marginBottom: "3px" }}
            />
            <p
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: "24px",
                color: BLUE,
                margin: "3px 0 2px",
                letterSpacing: "0.5px",
              }}
            >
              NATIONAL INDUSTRIAL INSPECTION AND TRAINING
            </p>
            <p
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: "21px",
                color: BLUE,
                margin: "0 0 3px",
                letterSpacing: "1px",
              }}
            >
              NDT CERTIFICATE
            </p>
            <div style={{ borderBottom: `2px solid ${BLUE}` }} />
          </div>

          {/* 4. Body Paragraph */}
          <p
            style={{
              fontSize: "14px",
              color: "#222",
              textAlign: "justify",
              lineHeight: "1.6",
              margin: "0 0 4mm",
            }}
          >
            This is to certify that the Individual named below has successfully
            completed experience, training and examination requirements in
            accordance with the provisions of M/s National Industrial Inspection
            and Training's NDT written practice for the Qualification and
            Certification of NDT personnel NIIT/WP/01 Rev. 03
          </p>

          {/* 5. Name of Individual */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "6px",
              marginBottom: "4mm",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Name of Individual :
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: "16px", color: BLUE }}>
                {studentName}
              </span>
              <div
                style={{ borderBottom: `1px solid #222`, marginTop: "1px" }}
              />
            </div>
          </div>

          {/* 6. Is hereby certified */}
          <p style={{ fontSize: "14px", color: "#222", margin: "0 0 3mm" }}>
            Is hereby certified to perform the following Nondestructive Testing
            Method(s)
          </p>

          {/* 7. NDT Methods Table — blue header */}
          <div style={{ marginBottom: "4mm" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr>
                  {(
                    [
                      "NDT Method",
                      "NDT Level",
                      "NDT Technique",
                      "Limitations (if any)",
                    ] as const
                  ).map((h, i) => (
                    <th
                      key={h}
                      style={{
                        color: "#000",
                        fontWeight: 700,
                        textAlign: "center",
                        padding: "5px 4px",
                        border: `0.8px solid ${BLUE}`,
                        width:
                          i === 0
                            ? "35%"
                            : i === 1
                              ? "20%"
                              : i === 2
                                ? "25%"
                                : "20%",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[ndtMethod, ndtLevel, ndtTech, ndtLimits].map((val, i) => (
                    <td
                      key={i}
                      style={{
                        textAlign: "center",
                        padding: "5px 4px",
                        fontSize: "14px",
                        color: "#222",
                        border: `0.8px solid ${BLUE}`,
                      }}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* 8. ASNT Statement — light shaded background */}
          <div
            style={{
              padding: "6px 10px",
              marginBottom: "5mm",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#222",
                textAlign: "justify",
                lineHeight: "1.55",
                margin: 0,
              }}
            >
              This company written practice intends to meet or exceed the
              requirements of ASNT published document SNT-TC-1A: 2024 as it
              applied to NDT performed by this company.
            </p>
          </div>

          {/* 9. Certifying Authority Box — right-aligned 68% */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                width: "68%",
                border: `0.8px solid #555`,
                fontSize: "14px",
                color: "#222",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Top: signatory 1 */}
              <div style={{ padding: "7px 8px 0" }}>
                <p style={{ margin: "0 0 2px" }}>
                  Certified on behalf of the Certifying Authority –
                </p>
                <p style={{ margin: "0 0 3px" }}>
                  M/s National Industrial Inspection and Training
                </p>
                <p style={{ margin: "0 0 20px" }}>Sign. :</p>
                <p style={{ fontWeight: 700, margin: "0 0 6px" }}>
                  Name : {signatoryName}
                </p>
              </div>

              {/* Divider */}
              <div style={{ borderTop: `0.8px solid #555` }} />

              {/* Bottom: Bajirao T. Kadam */}
              <div style={{ padding: "7px 8px" }}>
                <p style={{ margin: "0 0 2px" }}>
                  M/s&nbsp;National Industrial Inspection and Training
                </p>
                <p style={{ margin: "0 0 3px" }}>Designated Level III</p>
                <p style={{ margin: "0 0 20px" }}>Sign. :</p>
                <p style={{ fontWeight: 700, margin: "0 0 3px" }}>
                  Name : Mr. Bajirao T. Kadam
                </p>
                <p style={{ fontWeight: 700, margin: "0 0 3px" }}>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(ASNT Level
                  III)
                </p>
                <p style={{ fontWeight: 700, margin: 0 }}>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Certificate
                  No: 212306
                </p>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  );
};
