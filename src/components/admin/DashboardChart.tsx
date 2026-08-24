'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  orders: number;
  revenue: number;
}

interface DashboardChartProps {
  data: ChartDataPoint[];
}

export function DashboardChart({ data }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1b2537" vertical={false} />
        <XAxis dataKey="date" stroke="#44506b" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#44506b" fontSize={11} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: '#0b111d', border: '1px solid #1b2537', borderRadius: 8 }}
          labelStyle={{ color: '#f2f6ff' }}
          formatter={(v: any, name: any) => [name === 'revenue' && typeof v === 'number' ? `₹${v.toLocaleString('en-IN')}` : v, name]}
        />
        <Area type="monotone" dataKey="orders" stroke="#22d3ee" fill="url(#ordersGrad)" strokeWidth={2} />
        <Area type="monotone" dataKey="revenue" stroke="#a78bfa" fill="url(#revGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}