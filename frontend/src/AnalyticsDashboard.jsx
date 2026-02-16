import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';
import {
  ArrowLeft, LayoutDashboard, Building2, Target, History,
  DollarSign, Clock, Zap, ArrowDownUp, Activity, RefreshCw,
  TrendingUp, Coins, Timer, Hash
} from 'lucide-react';
const API_BASE = 'http://localhost:8000/api';

const PROVIDER_COLORS = {
  'Google': '#4285F4',
  'OpenAI': '#10A37F',
  'Meta': '#0668E1',
  'Mistral AI': '#FF7000',
  'Amazon': '#FF9900',
  'DeepSeek': '#8B5CF6',
};

const USE_CASE_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316'
];

function AnalyticsDashboard({ onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm tracking-wider uppercase">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics || !analytics.data || analytics.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 gap-6">
        <Activity size={48} className="text-slate-600" />
        <p className="text-slate-400 text-lg">No telemetry data yet. Run some queries first!</p>
        <button onClick={onBack} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>
    );
  }

  const { data, total_requests, total_cost, total_input_tokens, total_output_tokens } = analytics;

  // ---- Data Aggregation ----

  // Provider-wise aggregation
  const providerMap = {};
  data.forEach(r => {
    const p = r.provider || 'Unknown';
    if (!providerMap[p]) providerMap[p] = { provider: p, requests: 0, cost: 0, input_tokens: 0, output_tokens: 0, total_latency: 0 };
    providerMap[p].requests += 1;
    providerMap[p].cost += parseFloat(r.cost || 0);
    providerMap[p].input_tokens += parseInt(r.input_tokens || 0);
    providerMap[p].output_tokens += parseInt(r.output_tokens || 0);
    providerMap[p].total_latency += parseInt(r.latency_ms || 0);
  });
  const providerData = Object.values(providerMap).map(p => ({
    ...p,
    cost: parseFloat(p.cost.toFixed(6)),
    avg_latency: Math.round(p.total_latency / p.requests),
  }));

  // Use-case aggregation
  const useCaseMap = {};
  data.forEach(r => {
    const uc = r.use_case || 'Unknown';
    if (!useCaseMap[uc]) useCaseMap[uc] = { use_case: uc, requests: 0, cost: 0, input_tokens: 0, output_tokens: 0 };
    useCaseMap[uc].requests += 1;
    useCaseMap[uc].cost += parseFloat(r.cost || 0);
    useCaseMap[uc].input_tokens += parseInt(r.input_tokens || 0);
    useCaseMap[uc].output_tokens += parseInt(r.output_tokens || 0);
  });
  const useCaseData = Object.values(useCaseMap);

  // Cost per provider (for pie chart)
  const costPieData = providerData
    .filter(p => p.cost > 0)
    .map(p => ({ name: p.provider, value: parseFloat(p.cost.toFixed(6)) }));

  // Request distribution by provider
  const requestPieData = providerData.map(p => ({ name: p.provider, value: p.requests }));

  // Timeline data (last 20 requests)
  const timelineData = [...data].reverse().slice(-20).map((r, i) => ({
    index: i + 1,
    latency: parseInt(r.latency_ms || 0),
    cost: parseFloat((r.cost || 0) * 1000).toFixed(4), // cost in millicents for visibility
    provider: r.provider,
    tokens: (parseInt(r.input_tokens || 0)) + (parseInt(r.output_tokens || 0)),
  }));

  // Provider efficiency radar
  const radarData = providerData.map(p => ({
    provider: p.provider,
    speed: Math.max(0, 100 - (p.avg_latency / 50)), // Normalize: lower latency = higher score
    cost_efficiency: Math.max(0, 100 - (p.cost / (p.requests || 1)) * 10000),
    throughput: Math.min(100, ((p.input_tokens + p.output_tokens) / (p.requests || 1)) / 10),
  }));

  const avg_latency = data.length > 0
    ? Math.round(data.reduce((s, r) => s + parseInt(r.latency_ms || 0), 0) / data.length)
    : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'providers', label: 'Providers', icon: Building2 },
    { id: 'usecases', label: 'Use Cases', icon: Target },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-5 shrink-0">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Chat
        </button>

        <h1 className="text-lg font-bold text-white mb-6 tracking-tight flex items-center gap-2.5">
          <Activity size={20} className="text-blue-400" /> Analytics
        </h1>

        {/* Summary Cards */}
        <div className="space-y-3 mb-8">
          <SummaryCard label="Total Requests" value={total_requests} color="blue" icon={Hash} />
          <SummaryCard label="Total Cost" value={`$${total_cost.toFixed(4)}`} color="green" icon={Coins} />
          <SummaryCard label="Avg Latency" value={`${avg_latency}ms`} color="purple" icon={Timer} />
          <SummaryCard label="Input Tokens" value={total_input_tokens.toLocaleString()} color="cyan" icon={Zap} />
          <SummaryCard label="Output Tokens" value={total_output_tokens.toLocaleString()} color="orange" icon={ArrowDownUp} />
        </div>

        {/* Tab Navigation */}
        <nav className="space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center">
          AI Governance Analytics
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'overview' && (
          <OverviewTab providerData={providerData} costPieData={costPieData} timelineData={timelineData} radarData={radarData} />
        )}
        {activeTab === 'providers' && (
          <ProvidersTab providerData={providerData} requestPieData={requestPieData} />
        )}
        {activeTab === 'usecases' && (
          <UseCasesTab useCaseData={useCaseData} />
        )}
        {activeTab === 'history' && (
          <HistoryTab data={data} />
        )}
      </main>
    </div>
  );
}

// ---- Summary Card ----
function SummaryCard({ label, value, color, icon: Icon }) {
  const colors = {
    blue: 'border-blue-500/30 text-blue-400',
    green: 'border-emerald-500/30 text-emerald-400',
    purple: 'border-purple-500/30 text-purple-400',
    cyan: 'border-cyan-500/30 text-cyan-400',
    orange: 'border-orange-500/30 text-orange-400',
  };
  return (
    <div className={`border ${colors[color]} bg-slate-800/50 rounded-lg p-3`}>
      <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className="text-lg font-bold font-mono mt-1">{value}</p>
    </div>
  );
}

// ---- Chart Card ----
function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-5 ${className}`}>
      <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ---- OVERVIEW TAB ----
function OverviewTab({ providerData, costPieData, timelineData, radarData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">System Overview</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Cost by Provider - Bar */}
        <ChartCard title="Cost by Provider ($)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={providerData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="provider" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                {providerData.map((entry, i) => (
                  <Cell key={i} fill={PROVIDER_COLORS[entry.provider] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cost Distribution - Pie */}
        <ChartCard title="Cost Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={costPieData.length > 0 ? costPieData : [{ name: 'No data', value: 1 }]}
                cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {costPieData.map((entry, i) => (
                  <Cell key={i} fill={PROVIDER_COLORS[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Latency Comparison */}
        <ChartCard title="Average Latency by Provider (ms)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={providerData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="provider" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="avg_latency" radius={[6, 6, 0, 0]}>
                {providerData.map((entry, i) => (
                  <Cell key={i} fill={PROVIDER_COLORS[entry.provider] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Request Timeline */}
        <ChartCard title="Request Timeline (Recent)">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="index" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="latency" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ---- PROVIDERS TAB ----
function ProvidersTab({ providerData, requestPieData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Provider Analysis</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Token Consumption */}
        <ChartCard title="Token Consumption by Provider">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={providerData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="provider" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
              <Bar dataKey="input_tokens" name="Input Tokens" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="output_tokens" name="Output Tokens" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Request Distribution */}
        <ChartCard title="Request Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={requestPieData}
                cx="50%" cy="50%" outerRadius={110}
                dataKey="value" label={({ name, value }) => `${name}: ${value}`}
              >
                {requestPieData.map((entry, i) => (
                  <Cell key={i} fill={PROVIDER_COLORS[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Provider Comparison Table */}
        <ChartCard title="Provider Comparison" className="col-span-2">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Provider</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Requests</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Avg Latency</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Input Tokens</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Output Tokens</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Total Cost</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Cost/Request</th>
                </tr>
              </thead>
              <tbody>
                {providerData.map((p, i) => (
                  <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50 transition-all">
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[p.provider] || '#64748b' }} />
                        <span className="font-medium text-white">{p.provider}</span>
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 font-mono">{p.requests}</td>
                    <td className="text-right py-3 px-4 font-mono text-purple-400">{p.avg_latency}ms</td>
                    <td className="text-right py-3 px-4 font-mono">{p.input_tokens.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 font-mono">{p.output_tokens.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 font-mono text-emerald-400">${p.cost.toFixed(6)}</td>
                    <td className="text-right py-3 px-4 font-mono text-blue-400">${(p.cost / p.requests).toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// ---- USE CASES TAB ----
function UseCasesTab({ useCaseData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Use Case Analysis</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Requests by Use Case */}
        <ChartCard title="Requests by Use Case">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={useCaseData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="use_case" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="requests" radius={[0, 6, 6, 0]}>
                {useCaseData.map((_, i) => (
                  <Cell key={i} fill={USE_CASE_COLORS[i % USE_CASE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cost by Use Case */}
        <ChartCard title="Cost by Use Case ($)">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={useCaseData.filter(u => u.cost > 0)}
                cx="50%" cy="50%" innerRadius={50} outerRadius={100}
                paddingAngle={3} dataKey="cost"
                label={({ use_case, cost }) => `${use_case}: $${cost.toFixed(4)}`}
              >
                {useCaseData.map((_, i) => (
                  <Cell key={i} fill={USE_CASE_COLORS[i % USE_CASE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Token Usage by Use Case */}
        <ChartCard title="Token Consumption by Use Case" className="col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={useCaseData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="use_case" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
              <Bar dataKey="input_tokens" name="Input Tokens" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="output_tokens" name="Output Tokens" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ---- HISTORY TAB ----
function HistoryTab({ data }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Request History</h2>

      <ChartCard title={`Recent Requests (${data.length} total)`}>
        <div className="overflow-auto max-h-[calc(100vh-200px)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Time</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Provider</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Model</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Use Case</th>
                <th className="text-right py-3 px-3 text-slate-400 font-medium">Latency</th>
                <th className="text-right py-3 px-3 text-slate-400 font-medium">Tokens</th>
                <th className="text-right py-3 px-3 text-slate-400 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all">
                  <td className="py-2.5 px-3 text-slate-500 text-xs font-mono">
                    {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: PROVIDER_COLORS[r.provider] || '#64748b' }} />
                      <span className="text-white text-xs">{r.provider}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-blue-400 max-w-[180px] truncate">{r.model_id}</td>
                  <td className="py-2.5 px-3 text-xs capitalize">{r.use_case}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-purple-400">{r.latency_ms}ms</td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs">
                    {((parseInt(r.input_tokens || 0)) + (parseInt(r.output_tokens || 0))).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-emerald-400">${parseFloat(r.cost || 0).toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

export default AnalyticsDashboard;
