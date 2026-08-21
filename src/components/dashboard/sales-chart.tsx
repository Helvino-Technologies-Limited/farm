"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function SalesChart({ data }: { data: { date: string; total: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-12 text-center">No sales recorded yet in this period.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickLine={false} width={70} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => Number(v).toLocaleString("en-KE", { style: "currency", currency: "KES" })} />
        <Line type="monotone" dataKey="total" stroke="#15803d" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
