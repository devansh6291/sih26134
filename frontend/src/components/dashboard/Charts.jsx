import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const demand = [
  { month: "Jan", demand: 58, supply: 48 },
  { month: "Feb", demand: 62, supply: 51 },
  { month: "Mar", demand: 68, supply: 54 },
  { month: "Apr", demand: 72, supply: 59 },
  { month: "May", demand: 78, supply: 61 },
  { month: "Jun", demand: 84, supply: 67 }
];

const skills = [
  { skill: "AI/ML", value: 92 },
  { skill: "Cloud", value: 81 },
  { skill: "Cyber", value: 73 },
  { skill: "Data", value: 68 },
  { skill: "IoT", value: 54 }
];

export function DemandChart() {
  return (
    <div className="chart-card">
      <div className="card-heading">
        <div>
          <h3>Industry demand vs training supply</h3>
          <p>Six-month demand signal</p>
        </div>
        <span className="mini-badge">Live view</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={demand}>
          <defs>
            <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#64748B" />
          <YAxis stroke="#64748B" />
          <Tooltip />
          <Area type="monotone" dataKey="demand" stroke="#2563EB" fill="url(#demandFill)" strokeWidth={3} />
          <Area type="monotone" dataKey="supply" stroke="#0F766E" fill="none" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SkillChart() {
  return (
    <div className="chart-card">
      <div className="card-heading">
        <div>
          <h3>Top requested skills</h3>
          <p>Current market signal</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={skills} layout="vertical" margin={{ left: 15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="skill" width={55} />
          <Tooltip />
          <Bar dataKey="value" fill="#12355B" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GapChart() {
  const data = [
    { name: "Aligned", value: 62 },
    { name: "Partial", value: 25 },
    { name: "Gap", value: 13 }
  ];
  return (
    <div className="chart-card compact-chart">
      <div className="card-heading">
        <div>
          <h3>Curriculum alignment</h3>
          <p>Industry validation snapshot</p>
        </div>
      </div>
      <div className="pie-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3}>
              <Cell fill="#0F766E" />
              <Cell fill="#D97706" />
              <Cell fill="#DC2626" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pie-center"><strong>62%</strong><span>aligned</span></div>
      </div>
    </div>
  );
}