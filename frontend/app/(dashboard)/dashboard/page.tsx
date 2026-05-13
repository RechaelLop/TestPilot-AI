"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const getColor = (s: string) => {
  switch (s) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#eab308";
    case "low":
      return "#22c55e";
    default:
      return "#64748b";
  }
};

export default function DashboardPage() {
  const [failures, setFailures] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [realtimeMonitoring, setRealtimeMonitoring] = useState(false);
  const [realtimeLog, setRealtimeLog] = useState("");
  const [trendData, setTrendData] = useState<any[]>([
    { day: "Mon", failures: 0 },
    { day: "Tue", failures: 0 },
    { day: "Wed", failures: 0 },
    { day: "Thu", failures: 0 },
    { day: "Fri", failures: 0 },
    { day: "Sat", failures: 0 },
    { day: "Sun", failures: 0 }
  ]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    fetchFailures();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchFailures, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update trend data and category data whenever failures change
  useEffect(() => {
    if (failures.length > 0) {
      calculateTrendData();
      calculateCategoryData();
    }
  }, [failures]);

  const fetchFailures = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/failures");
      const data = await res.json();
      setFailures(data);
    } catch (err) {
      console.log("error fetching failures");
    }
  };

  // Calculate REAL trend data from actual failures
  const calculateTrendData = () => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();

    // Initialize last 7 days with zero failures
    const last7Days: Array<{day: string, failures: number, date: string}> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayName = daysOfWeek[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push({
        day: dayName,
        failures: 0,
        date: dateStr
      });
    }
    
    // Count failures per day from actual data
    failures.forEach((failure: any) => {
      if (failure.created_at) {
        // Handle different date formats
        let failureDate;
        try {
          // Try parsing the date
          const dateObj = new Date(failure.created_at);
          if (!isNaN(dateObj.getTime())) {
            failureDate = dateObj.toISOString().split('T')[0];
          } else {
            console.warn("Invalid date format:", failure.created_at);
            return;
          }
        } catch (e) {
          console.warn("Error parsing date:", failure.created_at);
          return;
        }
        
        const dayIndex = last7Days.findIndex(day => day.date === failureDate);
        if (dayIndex !== -1) {
          last7Days[dayIndex].failures++;
        }
      }
    });
    
    // Remove the date field for the chart
    const chartData = last7Days.map(({ day, failures }) => ({
      day: day,
      failures: failures
    }));
    
    setTrendData(chartData);
  };

  // Categorize failure by type
  const categorizeFailure = (failure: any) => {
    const logText = (failure.log || "").toLowerCase();
    const rootCause = (failure.analysis?.root_cause || failure.root_cause || "").toLowerCase();
    const module = (failure.analysis?.module || failure.module || "").toLowerCase();
    const summary = (failure.analysis?.summary || "").toLowerCase();
    
    const combinedText = `${logText} ${rootCause} ${module} ${summary}`;
    
    // Concurrency/Race Conditions
    if (combinedText.match(/race condition|concurrent|deadlock|thread|async|await|promise|lock|mutex|synchronization|parallel|race|concurrency/i)) {
      return "Concurrency/Race Conditions";
    }
    
    // API/Backend Failures
    if (combinedText.match(/api|endpoint|http|rest|graphql|backend|server|500|502|503|504|gateway|timeout|request|response/i)) {
      return "API/Backend Failures";
    }
    
    // Payment/Financial Systems  
    if (combinedText.match(/payment|transaction|credit card|billing|invoice|refund|charge|financial|money|bank|wallet|currency|checkout/i)) {
      return "Payment/Financial Systems";
    }
    
    // Infrastructure/DevOps
    if (combinedText.match(/kubernetes|docker|pod|container|deployment|aws|azure|gcp|cloud|vm|serverless|lambda|ec2|s3|load balancer|nginx|apache|infrastructure|devops|ci\/cd|jenkins|gitlab|github action/i)) {
      return "Infrastructure/DevOps";
    }
    
    // AI/ML Pipeline Failures
    if (combinedText.match(/model|inference|training|pipeline|ml|ai|llm|gpt|bert|tensorflow|pytorch|prediction|feature|embedding|vector|dataset|epoch|batch|neural network/i)) {
      return "AI/ML Pipeline Failures";
    }
    
    return "Other";
  };

  // Calculate category data for the graph
  const calculateCategoryData = () => {
    const categories: Record<string, number> = {
      "Concurrency/Race Conditions": 0,
      "API/Backend Failures": 0,
      "Payment/Financial Systems": 0,
      "Infrastructure/DevOps": 0,
      "AI/ML Pipeline Failures": 0,
      "Other": 0
    };
    
    failures.forEach(failure => {
      const category = categorizeFailure(failure);
      categories[category] = (categories[category] || 0) + 1;
    });
    
    const chartData = Object.entries(categories)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    setCategoryData(chartData);
  };

  const getSeverity = (f: any) =>
    (f.analysis?.severity || f.severity || "unknown").toLowerCase();

  const count = (lvl: string) =>
    failures.filter((f) => getSeverity(f) === lvl).length;

  const total = failures.length;
  const critical = count("critical");
  const high = count("high");
  const medium = count("medium");
  const low = count("low");

  const severityData = [
    { name: "Critical", value: critical },
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ];

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

  const moduleMap: Record<string, number> = {};

  failures.forEach((f) => {
    const moduleName =
      f.analysis?.module || f.module || "Unknown Service";
    moduleMap[moduleName] = (moduleMap[moduleName] || 0) + 1;
  });

  const moduleData = Object.keys(moduleMap).map((key) => ({
    name: key,
    value: moduleMap[key],
  }));

  const penalty = critical * 12 + high * 7 + medium * 4 + low * 1;
  const healthScore = Math.max(15, Math.min(100, 100 - penalty));

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const responseData = await res.json();
        setUploadSuccess(`✅ Successfully analyzed ${file.name}!`);
        
        setSelectedReport(responseData);
        setShowReportModal(true);
        await fetchFailures();
        setFile(null);
        
        setTimeout(() => setUploadSuccess(null), 5000);
      } else {
        setUploadError("❌ Upload failed. Please try again.");
        setTimeout(() => setUploadError(null), 5000);
      }
    } catch (err) {
      console.log("upload failed");
      setUploadError("❌ Network error. Please check if backend is running.");
      setTimeout(() => setUploadError(null), 5000);
    }

    setLoading(false);
  };

  const handleRealtimeAnalysis = async () => {
    if (!realtimeLog.trim()) return;
    
    setLoading(true);
    
    const blob = new Blob([realtimeLog], { type: 'text/plain' });
    const logFile = new File([blob], `realtime-log-${Date.now()}.txt`);
    
    const formData = new FormData();
    formData.append("file", logFile);
    
    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        const responseData = await res.json();
        setUploadSuccess(`✅ Realtime log analyzed!`);
        setSelectedReport(responseData);
        setShowReportModal(true);
        await fetchFailures();
        setRealtimeLog("");
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    } catch (err) {
      console.log("Realtime analysis failed");
    }
    
    setLoading(false);
  };

  const getConfidence = (f: any) => {
    const raw = f.analysis?.confidence_score ?? f.confidence_score;
    if (raw === undefined || raw === null || raw === "") return "N/A";
    const num = typeof raw === "string" ? parseFloat(raw) : raw;
    if (typeof num !== "number" || isNaN(num)) return "N/A";
    const percentage = num <= 1 ? num * 100 : num;
    return `${Math.round(percentage)}%`;
  };

  const getAnalysisType = (filename: string) => {
    if (filename?.includes('realtime')) return '🔴 Real-time';
    return '📁 Rule-based + AI';
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #020617, #0f172a)",
        padding: 30,
        color: "white",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          marginBottom: 30,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 42, marginBottom: 8, fontWeight: "bold" }}>
            TestPilot AI Dashboard
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 16 }}>
            Real-time QA Failure Intelligence Platform
          </p>
        </div>

        <div
          style={{
            background: "linear-gradient(to right, #111827, #1e293b)",
            padding: "18px 26px",
            borderRadius: 18,
            border: "1px solid #334155",
            minWidth: 220,
          }}
        >
          <p style={{ color: "#94a3b8", marginBottom: 10 }}>System Health Score</p>
          <h1
            style={{
              fontSize: 44,
              color: healthScore >= 75 ? "#22c55e" : healthScore >= 50 ? "#eab308" : "#ef4444",
            }}
          >
            {healthScore}%
          </h1>
        </div>
      </div>

      {/* UPLOAD SECTION */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))",
          padding: 24,
          borderRadius: 22,
          border: "1px solid rgba(148,163,184,0.12)",
          marginBottom: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ marginBottom: 8, fontSize: 22, fontWeight: 700 }}>
              Upload Failure Logs
            </h2>
            <p style={{ color: "#94a3b8" }}>
              Upload CI/CD logs for AI-powered root cause analysis
            </p>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <label
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.35)",
                color: "#dbeafe",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              📂 Choose File
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            {file && (
              <span
                style={{
                  color: "#cbd5e1",
                  fontSize: 14,
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </span>
            )}

            <button
              onClick={handleUpload}
              disabled={loading}
              style={{
                padding: "12px 22px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                color: "white",
                fontWeight: 700,
                boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Analyzing..." : "🚀 Analyze Logs"}
            </button>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {uploadSuccess && (
          <div
            style={{
              marginTop: 20,
              padding: "15px 20px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              animation: "slideDown 0.3s ease-out",
            }}
          >
            <span style={{ fontSize: 24 }}>✅</span>
            <div>
              <strong style={{ color: "#22c55e" }}>Analysis Complete!</strong>
              <p style={{ color: "#cbd5e1", margin: 0, fontSize: 14 }}>{uploadSuccess}</p>
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {uploadError && (
          <div
            style={{
              marginTop: 20,
              padding: "15px 20px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 24 }}>❌</span>
            <div>
              <strong style={{ color: "#ef4444" }}>Upload Failed</strong>
              <p style={{ color: "#cbd5e1", margin: 0, fontSize: 14 }}>{uploadError}</p>
            </div>
          </div>
        )}
      </div>

      {/* REAL-TIME MONITORING SECTION */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))",
          padding: 30,
          borderRadius: 22,
          border: "1px solid rgba(148,163,184,0.12)",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ marginBottom: 5, fontSize: 22, fontWeight: 700 }}>
              🔴 Real-time Log Monitoring
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>
              Paste error logs for instant AI analysis
            </p>
          </div>
        </div>

        <textarea
          placeholder="Paste your error log here for instant AI analysis...&#10;&#10;Example:&#10;[ERROR] 2024-01-15 10:30:00 - Payment Service: Gateway timeout after 30s"
          value={realtimeLog}
          onChange={(e) => setRealtimeLog(e.target.value)}
          style={{
            width: "100%",
            minHeight: "150px",
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 12,
            padding: "18px",
            color: "white",
            fontFamily: "monospace",
            fontSize: 14,
            marginTop: 10,
            marginBottom: 20,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
        
        <button
          onClick={handleRealtimeAnalysis}
          disabled={loading || !realtimeLog.trim()}
          style={{
            padding: "12px 22px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            opacity: loading || !realtimeLog.trim() ? 0.5 : 1,
            marginTop: 15,
          }}
        >
          {loading ? "Analyzing..." : "🔍 Analyze Realtime Log"}
        </button>
      </div>

      {/* STATS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 18,
          marginBottom: 28,
        }}
      >
        {[
          ["Total Failures", total, "#60a5fa"],
          ["Critical", critical, "#ef4444"],
          ["High", high, "#f97316"],
          ["Medium", medium, "#eab308"],
          ["Low", low, "#22c55e"],
        ].map(([label, value, color]) => (
          <div
            key={label as string}
            style={{
              background: "linear-gradient(to bottom right, #111827, #0f172a)",
              border: "1px solid #1e293b",
              borderRadius: 22,
              padding: 22,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <p style={{ color: "#94a3b8", marginBottom: 12, fontSize: 14 }}>{label}</p>
            <h2 style={{ color: color as string, fontSize: 36, margin: 0 }}>{value as number}</h2>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          alignItems: "stretch",
          gap: 24,
          marginBottom: 25,
        }}
      >
        {/* FAILURE TREND - WITH FIXED CONTAINER */}
        <div
          style={{
            background: "linear-gradient(to bottom right, #111827, #0f172a)",
            borderRadius: 24,
            padding: 24,
            border: "1px solid #1e293b",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            height: 420,
            minWidth: 0,
            width: "100%",
            display: "flex",
            overflow: "hidden",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: 15, flexShrink: 0 }}>
            <h2 style={{ marginBottom: 5 }}>📈 Failure Trend</h2>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>
              Failure volume across the last 7 days
            </p>
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              width: "100%",
              paddingBottom: 18,
              marginTop: -10,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 30,
                }}
              >
                <defs>
                  <linearGradient id="colorFailure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  stroke="#94a3b8"
                  label={{ 
                    value: "Day of Week", 
                    position: "bottom", 
                    fill: "#94a3b8",
                    fontSize: 13,
                    offset: 0,
                  }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  label={{ 
                    value: "Number of Failures", 
                    angle: -90, 
                    position: "left", 
                    fill: "#94a3b8",
                    fontSize: 13,
                    offset: -5,
                  }}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12,
                    color: "white",
                  }}
                  formatter={(value: any) => [`${value} failures`, "Count"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="failures" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorFailure)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SEVERITY PIE CHART */}
        <div
          style={{
            background: "linear-gradient(to bottom right, #111827, #0f172a)",
            borderRadius: 24,
            padding: 24,
            border: "1px solid #1e293b",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            height: 420,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <h2>Severity Distribution</h2>
          <p style={{ color: "#94a3b8", marginBottom: 15 }}>AI categorized failures</p>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={severityData} dataKey="value" innerRadius={60} outerRadius={105} paddingAngle={5}>
                {severityData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 12,
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FAILURE CATEGORIES CHART - NEW */}
      <div
        style={{
          background: "linear-gradient(to bottom right, #111827, #0f172a)",
          borderRadius: 24,
          padding: 24,
          border: "1px solid #1e293b",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          marginBottom: 25,
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 5, display: "flex", alignItems: "center", gap: 10 }}>
            🏷️ Failure Categories
            <span style={{ 
              fontSize: 12, 
              background: "#1e293b", 
              padding: "4px 12px", 
              borderRadius: 20,
              color: "#94a3b8"
            }}>
              {categoryData.length} Types
            </span>
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Categorized by failure type (Concurrency, API, Payment, Infrastructure, AI/ML)
          </p>
        </div>
        
        {categoryData.length > 0 ? (
          <div
            style={{
              height: 400,
              width: "100%",
              paddingRight: 18,
              boxSizing: "border-box",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={categoryData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <defs>
                  <linearGradient id="categoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, dy: 8, angle: -15, textAnchor: "end" }}
                  height={80}
                  interval={0}
                  label={{ 
                    value: "Failure Category", 
                    position: "bottom", 
                    fill: "#94a3b8",
                    fontSize: 12,
                    offset: 15,
                    dy: 15
                  }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  label={{ 
                    value: "Number of Failures", 
                    angle: -90, 
                    position: "left", 
                    fill: "#94a3b8",
                    fontSize: 12,
                    offset: -5,
                  }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12,
                    color: "white",
                  }}
                  formatter={(value: any) => [`${value} failures`, "Count"]}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#categoryGradient)" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={`hsl(${260 + index * 30}, 70%, 60%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ 
            height: 400, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            flexDirection: "column",
            color: "#64748b"
          }}>
            <p style={{ fontSize: 48, marginBottom: 10 }}>🏷️</p>
            <p>No categorized data yet</p>
            <p style={{ fontSize: 12 }}>Upload logs to see failure categories</p>
          </div>
        )}
        
        {/* Category Summary Stats */}
        {categoryData.length > 0 && (
          <div style={{ 
            marginTop: 20, 
            paddingTop: 20, 
            borderTop: "1px solid #1e293b",
            display: "flex",
            justifyContent: "space-around",
            gap: 15,
            flexWrap: "wrap"
          }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>MOST COMMON</p>
              <p style={{ color: "#ec4899", fontWeight: "bold", fontSize: 13 }}>
                {categoryData[0]?.name || "N/A"}
              </p>
              <p style={{ color: "#60a5fa", fontSize: 20, fontWeight: "bold" }}>
                {categoryData[0]?.value || 0}
              </p>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>CATEGORIES FOUND</p>
              <p style={{ color: "#22c55e", fontSize: 20, fontWeight: "bold" }}>
                {categoryData.length}
              </p>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>TOTAL FAILURES</p>
              <p style={{ color: "#f97316", fontSize: 20, fontWeight: "bold" }}>
                {categoryData.reduce((sum, cat) => sum + cat.value, 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODULE CHART - IMPROVED WITH BETTER SPACING */}
      <div
        style={{
          background: "linear-gradient(to bottom right, #111827, #0f172a)",
          borderRadius: 24,
          padding: 24,
          border: "1px solid #1e293b",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          marginBottom: 25,
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 5, display: "flex", alignItems: "center", gap: 10 }}>
            📊 Module Failure Frequency
            <span style={{ 
              fontSize: 12, 
              background: "#1e293b", 
              padding: "4px 12px", 
              borderRadius: 20,
              color: "#94a3b8"
            }}>
              {moduleData.length} Modules
            </span>
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Services with highest failure count (sorted by frequency)
          </p>
        </div>
        
        {moduleData.length > 0 ? (
          <div
            style={{
              height: 450,
              width: "100%",
              paddingRight: 18,
              boxSizing: "border-box",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={moduleData} 
                layout="vertical"
                margin={{ left: 140, right: 40, top: 30, bottom: 40 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <XAxis 
                  type="number" 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12, fill: "#cbd5e1", dy: 8 }}
                  tickCount={10}
                  allowDecimals={false}
                  domain={[0, 'dataMax']}
                  tickFormatter={(value) => Math.floor(value).toString()}
                  label={{ 
                    value: "Number of Failures", 
                    position: "bottom", 
                    fill: "#94a3b8",
                    fontSize: 13,
                    fontWeight: "bold",
                    offset: 10,
                    dy: 20
                  }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  width={120}
                  tick={{ fontSize: 12, fill: "#cbd5e1", dx: -5 }}
                  label={{ 
                    value: "Module Name", 
                    angle: -90, 
                    position: "left", 
                    fill: "#94a3b8",
                    fontSize: 13,
                    fontWeight: "bold",
                    offset: -20,
                    dx: -30
                  }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12,
                    color: "white",
                    padding: "10px 15px",
                  }}
                  formatter={(value: any) => [`${value} failures`, "Count"]}
                  labelStyle={{ color: "#60a5fa", fontWeight: "bold", marginBottom: 5 }}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#barGradient)" 
                  radius={[0, 8, 8, 0]}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ 
            height: 400, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            flexDirection: "column",
            color: "#64748b"
          }}>
            <p style={{ fontSize: 48, marginBottom: 10 }}>📭</p>
            <p>No module data yet</p>
            <p style={{ fontSize: 12 }}>Upload logs to see failure distribution</p>
          </div>
        )}
        
        {/* Summary statistics */}
        {moduleData.length > 0 && (
          <div style={{ 
            marginTop: 20, 
            paddingTop: 20, 
            borderTop: "1px solid #1e293b",
            display: "flex",
            justifyContent: "space-around",
            gap: 15,
            flexWrap: "wrap"
          }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>TOP MODULE</p>
              <p style={{ color: "#60a5fa", fontWeight: "bold", fontSize: 14 }}>
                {moduleData[0]?.name || "N/A"}
              </p>
              <p style={{ color: "#ef4444", fontSize: 20, fontWeight: "bold" }}>
                {moduleData[0]?.value || 0}
              </p>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>MOST FREQUENT</p>
              <p style={{ color: "#f97316", fontWeight: "bold", fontSize: 14 }}>
                {moduleData[0]?.name || "N/A"}
              </p>
              <p style={{ color: "#22c55e", fontSize: 20, fontWeight: "bold" }}>
                {moduleData[0]?.value || 0} failures
              </p>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>TOTAL FAILURES</p>
              <p style={{ color: "#8b5cf6", fontSize: 20, fontWeight: "bold" }}>
                {moduleData.reduce((sum, m) => sum + m.value, 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FAILURES TABLE */}
      <div
        style={{
          background: "linear-gradient(to bottom right, #111827, #0f172a)",
          borderRadius: 24,
          padding: 24,
          border: "1px solid #1e293b",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <h2>Recent Failures</h2>
          <p style={{ color: "#94a3b8" }}>Latest AI analyzed incidents</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 12px" }}>
            <thead>
              <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                <th style={{ padding: "14px 18px", fontWeight: 600 }}>Analysis Type</th>
                <th style={{ padding: "14px 18px", fontWeight: 600 }}>Severity</th>
                <th style={{ padding: "14px 18px", fontWeight: 600 }}>Module</th>
                <th style={{ padding: "14px 18px", fontWeight: 600 }}>Root Cause</th>
                <th style={{ padding: "14px 18px", fontWeight: 600 }}>Confidence</th>
                <th style={{ padding: "14px 18px", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {failures.map((f, i) => {
                const severity = getSeverity(f);
                const moduleName = f.analysis?.module || f.module || "Unknown Service";
                const rootCause = f.analysis?.root_cause || f.root_cause || "Unknown Issue";

                return (
                  <tr
                    key={i}
                    style={{ background: "#111827", transition: "0.2s ease" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#1e293b")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#111827")}
                  >
                    <td style={{ padding: "18px", borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }}>
                      <span style={{
                        background: f.filename?.includes('realtime') ? "#7c3aed" : "#3b82f6",
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}>
                        {getAnalysisType(f.filename || 'upload')}
                      </span>
                    </td>
                    <td style={{ padding: "18px" }}>
                      <span
                        style={{
                          background: getColor(severity),
                          color: "white",
                          padding: "6px 14px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        {severity}
                      </span>
                    </td>
                    <td style={{ padding: "18px", color: "#e2e8f0" }}>{moduleName}</td>
                    <td style={{ padding: "18px", color: "#e2e8f0" }}>{rootCause}</td>
                    <td style={{ padding: "18px", color: "#60a5fa", fontWeight: 600 }}>{getConfidence(f)}</td>
                    <td style={{ padding: "18px", borderTopRightRadius: 14, borderBottomRightRadius: 14 }}>
                      <button
                        onClick={() => {
                          setSelectedReport(f);
                          setShowReportModal(true);
                        }}
                        style={{
                          background: "rgba(59,130,246,0.2)",
                          border: "1px solid #3b82f6",
                          padding: "6px 12px",
                          borderRadius: 8,
                          color: "#60a5fa",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORT MODAL */}
      {showReportModal && selectedReport && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              borderRadius: 24,
              maxWidth: 700,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              padding: 30,
              border: "1px solid #334155",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 28, margin: 0 }}>📊 AI Analysis Report</h2>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: "rgba(239,68,68,0.2)",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#ef4444",
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ borderTop: "1px solid #334155", paddingTop: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                  <h3 style={{ color: "#60a5fa", margin: 0 }}>BUG TITLE</h3>
                  <span style={{
                    background: getColor(selectedReport.analysis?.severity || "medium"),
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}>
                    {selectedReport.analysis?.severity?.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{selectedReport.analysis?.root_cause || "Unknown"}</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: "#22c55e", marginBottom: 8 }}>AFFECTED MODULE</h3>
                <p style={{ background: "#111827", padding: 10, borderRadius: 8 }}>{selectedReport.analysis?.module || "Unknown"}</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: "#f97316", marginBottom: 8 }}>DESCRIPTION</h3>
                <p style={{ background: "#111827", padding: 10, borderRadius: 8 }}>{selectedReport.analysis?.summary || "No description"}</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: "#8b5cf6", marginBottom: 8 }}>SUGGESTED FIX</h3>
                <p style={{ background: "#111827", padding: 10, borderRadius: 8, color: "#cbd5e1" }}>{selectedReport.analysis?.suggested_fix || "Investigate logs"}</p>
              </div>

              <div style={{ display: "flex", gap: 15, marginTop: 20 }}>
                <div style={{ flex: 1, background: "#111827", padding: 12, borderRadius: 12, textAlign: "center" }}>
                  <p style={{ color: "#94a3b8", margin: 0, fontSize: 12 }}>Confidence Score</p>
                  <p style={{ fontSize: 24, fontWeight: "bold", margin: 5, color: "#60a5fa" }}>
                    {selectedReport.analysis?.confidence_score || "N/A"}
                  </p>
                </div>
                <div style={{ flex: 1, background: "#111827", padding: 12, borderRadius: 12, textAlign: "center" }}>
                  <p style={{ color: "#94a3b8", margin: 0, fontSize: 12 }}>Analysis Method</p>
                  <p style={{ fontSize: 16, fontWeight: "bold", margin: 5 }}>
                    {selectedReport.filename?.includes('realtime') ? 'AI-Powered' : 'Rule Engine + AI'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              style={{
                marginTop: 25,
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🖨️ Export Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}