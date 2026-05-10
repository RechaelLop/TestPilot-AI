"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [bugReport, setBugReport] = useState("");
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMessage("");
    setAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setAnalysis(data.analysis);
        setBugReport(data.bug_report);
        setMessage("Analysis complete");
      } else {
        setMessage("Upload failed");
      }
    } catch (err) {
      setMessage("Upload failed");
    }

    setLoading(false);
  };

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        TestPilot AI 🚀
      </h1>

      <p>Upload QA test logs for analysis</p>

      <input
        type="file"
        onChange={(e) => {
          if (e.target.files) setFile(e.target.files[0]);
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
          borderRadius: 6,
        }}
      >
        {loading ? "Analyzing..." : "Upload Log"}
      </button>

      <p style={{ marginTop: 20 }}>{message}</p>

      {/* AI RESULT SECTION */}

      {analysis && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 10,
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2>AI Analysis Result</h2>

          <p><b>Root Cause:</b> {analysis.root_cause}</p>
          <p><b>Severity:</b> {analysis.severity}</p>
          <p><b>Module:</b> {analysis.module}</p>
          <p><b>Summary:</b> {analysis.summary}</p>
          <p><b>Suggested Fix:</b> {analysis.suggested_fix}</p>
        </div>
      )}

      {/* BUG REPORT SECTION */}
      
      {bugReport && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            border: "1px solid #ccc",
            borderRadius: 10,
            backgroundColor: "#ffffff",
          }}
        >
          <h2>Generated Bug Report</h2>

          <textarea
            value={bugReport}
            readOnly
            rows={18}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
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
              borderRadius: 6,
            }}
          >
            Copy Bug Report
          </button>
        </div>
      )}
    </main>
  );
}