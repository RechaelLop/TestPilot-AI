"use client";

import { useEffect, useState } from "react";

export default function Home() {

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [analysis, setAnalysis] = useState<any>(null);
  const [bugReport, setBugReport] = useState("");
  const [message, setMessage] = useState("");

  const [failures, setFailures] = useState<any[]>([]);

  // -----------------------------------
  // FETCH RECENT FAILURES
  // -----------------------------------
  useEffect(() => {
    fetchFailures();
  }, []);

  const fetchFailures = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/failures");
      const data = await res.json();

      setFailures(data);
    } catch (err) {
      console.error("Failed to fetch failures");
    }
  };

  // -----------------------------------
  // HANDLE FILE UPLOAD
  // -----------------------------------
  const handleUpload = async () => {

    if (!file) return;

    setLoading(true);

    setMessage("");
    setAnalysis(null);

    const formData = new FormData();

    formData.append("file", file);

    try {

      const res = await fetch(
        "http://127.0.0.1:8000/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {

        setAnalysis(data.analysis);
        setBugReport(data.bug_report);

        setMessage("Analysis complete");

        // Refresh dashboard table
        fetchFailures();

      } else {
        setMessage("Upload failed");
      }

    } catch (err) {
      setMessage("Upload failed");
    }

    setLoading(false);
  };

  // -----------------------------------
  // SEVERITY BADGE COLORS
  // -----------------------------------
  const getSeverityColor = (severity: string) => {

    switch (severity?.toLowerCase()) {

      case "critical":
        return "#dc2626";

      case "high":
        return "#ea580c";

      case "medium":
        return "#ca8a04";

      default:
        return "#6b7280";
    }
  };

  return (

    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: 40,
        fontFamily: "Arial"
      }}
    >

      {/* HEADER */}
      <h1
        style={{
          fontSize: 36,
          fontWeight: "bold",
          marginBottom: 10
        }}
      >
        TestPilot AI 🚀
      </h1>

      <p
        style={{
          marginBottom: 30,
          color: "#555"
        }}
      >
        AI-powered QA failure analysis dashboard
      </p>

      {/* UPLOAD CARD */}
      <div
        style={{
          backgroundColor: "white",
          padding: 25,
          borderRadius: 14,
          marginBottom: 30,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}
      >

        <h2
          style={{
            fontSize: 24,
            marginBottom: 20
          }}
        >
          Upload QA Logs
        </h2>

        <input
          type="file"
          onChange={(e) => {
            if (e.target.files) {
              setFile(e.target.files[0]);
            }
          }}
        />

        <br /><br />

        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "black",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer"
          }}
        >
          {loading ? "Analyzing..." : "Upload Log"}
        </button>

        <p style={{ marginTop: 15 }}>
          {message}
        </p>

      </div>

      {/* AI ANALYSIS */}
      {analysis && (

        <div
          style={{
            backgroundColor: "white",
            padding: 25,
            borderRadius: 14,
            marginBottom: 30,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
          }}
        >

          <h2
            style={{
              fontSize: 24,
              marginBottom: 20
            }}
          >
            AI Analysis Result
          </h2>

          <p><b>Root Cause:</b> {analysis.root_cause}</p>

          <p>
            <b>Severity:</b>{" "}

            <span
              style={{
                backgroundColor: getSeverityColor(analysis.severity),
                color: "white",
                padding: "4px 10px",
                borderRadius: 8,
                fontSize: 14
              }}
            >
              {analysis.severity}
            </span>
          </p>

          <p><b>Module:</b> {analysis.module}</p>

          <p><b>Summary:</b> {analysis.summary}</p>

          <p><b>Suggested Fix:</b> {analysis.suggested_fix}</p>

          <p><b>Confidence:</b> {analysis.confidence_score}</p>

        </div>
      )}

      {/* BUG REPORT */}
      {bugReport && (

        <div
          style={{
            backgroundColor: "white",
            padding: 25,
            borderRadius: 14,
            marginBottom: 30,
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
          }}
        >

          <h2
            style={{
              fontSize: 24,
              marginBottom: 20
            }}
          >
            Generated Bug Report
          </h2>

          <textarea
            value={bugReport}
            readOnly
            rows={18}
            style={{
              width: "100%",
              padding: 15,
              borderRadius: 10,
              border: "1px solid #ddd"
            }}
          />

          <br /><br />

          <button
            onClick={() => {
              navigator.clipboard.writeText(bugReport);
              alert("Bug report copied!");
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "black",
              color: "white",
              borderRadius: 8,
              border: "none",
              cursor: "pointer"
            }}
          >
            Copy Bug Report
          </button>

        </div>
      )}

      {/* RECENT FAILURES TABLE */}
      <div
        style={{
          backgroundColor: "white",
          padding: 25,
          borderRadius: 14,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}
      >

        <h2
          style={{
            fontSize: 24,
            marginBottom: 20
          }}
        >
          Recent Failures
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse"
          }}
        >

          <thead>
            <tr
              style={{
                backgroundColor: "#f3f4f6",
                textAlign: "left"
              }}
            >
              <th style={{ padding: 12 }}>Severity</th>
              <th style={{ padding: 12 }}>Module</th>
              <th style={{ padding: 12 }}>Root Cause</th>
              <th style={{ padding: 12 }}>Confidence</th>
            </tr>
          </thead>

          <tbody>

            {failures.map((failure, index) => (

              <tr
                key={index}
                style={{
                  borderBottom: "1px solid #eee"
                }}
              >

                <td style={{ padding: 12 }}>
                  <span
                    style={{
                      backgroundColor: getSeverityColor(
                        failure.analysis?.severity || failure.severity
                      ),
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 13
                    }}
                  >
                    {failure.analysis?.severity || failure.severity || "N/A"}
                  </span>
                </td>

                <td style={{ padding: 12 }}>
                  {failure.analysis?.module || failure.module || "N/A"}
                </td>

                <td style={{ padding: 12 }}>
                  {failure.analysis?.root_cause || failure.root_cause || "N/A"}
                </td>

                <td style={{ padding: 12 }}>
                  {failure.analysis?.confidence_score || failure.confidence_score || "N/A"}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}