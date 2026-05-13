export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}