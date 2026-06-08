export const isDemoDataEnabled = process.env.NODE_ENV !== "production";

export const demoDashboard = {
  revenue: 12480,
  transactions: 128,
  paidLinks: 54,
  pending: 3,
  chart: [
    { label: "Mon", revenue: 1400 },
    { label: "Tue", revenue: 2180 },
    { label: "Wed", revenue: 1760 },
    { label: "Thu", revenue: 2920 },
    { label: "Fri", revenue: 2480 },
    { label: "Sat", revenue: 1880 },
    { label: "Sun", revenue: 3280 },
  ],
  activity: [
    { title: "Invoice #184 paid", description: "0x84d2...19ab · 420.00 USDC", status: "CONFIRMED" },
    { title: "Creator plan checkout", description: "0x1f03...9c22 · 88.00 USDC", status: "PENDING" },
    { title: "Consulting deposit", description: "0xa102...77dd · 1,200.00 USDC", status: "CONFIRMED" },
  ],
};
