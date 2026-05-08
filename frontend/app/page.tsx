"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setMessage(`✅ ${data.message}`);
    } catch (err) {
      setMessage("❌ Upload failed");
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
        {loading ? "Uploading..." : "Upload Log"}
      </button>

      <p style={{ marginTop: 20 }}>{message}</p>
    </main>
  );
}