"use client"

import { useState, useEffect } from "react"
import {
  Plus, Search, MoreHorizontal,
  TrendingUp, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight, BarChart2,
  PieChart as PieChartIcon,
  ChevronDown, Calendar, Bell, Maximize, Database
} from "lucide-react"
import { mockSources } from "@/lib/mock-data"
import { getSources, connectSource, type Source } from "@/lib/api"
import { toast } from "sonner"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts"

const sourceLogos: Record<string, string> = {
  confluence: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Confluence_Logo.png",
  sharepoint: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Microsoft_Office_SharePoint_%282019%E2%80%932025%29.svg",
  s3: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Amazon-S3-Logo.svg",
  notion: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
  slack: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
  github: "https://cdn.simpleicons.org/github/FFFFFF",
  gdrive: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg",
  salesforce: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
}

const typeLabel: Record<string, string> = {
  confluence: "Confluence",
  sharepoint: "SharePoint",
  s3: "Amazon S3",
  notion: "Notion",
  slack: "Slack",
  github: "GitHub",
  gdrive: "Google Drive",
  salesforce: "Salesforce",
}

function HealthRing({ value, size = 20 }: { value: number; size?: number }) {
  if (!value) return <span className="text-[#8A8F98]">—</span>;
  const r = size / 2 - 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const color = "#00D4FF"
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1F202E" strokeWidth={2} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={2}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
      </div>
      <span className="text-[13px] text-white font-medium">{value}%</span>
    </div>
  )
}

function StatRing({ percentage, color, size = 64 }: { percentage: number, color: string, size?: number }) {
  const strokeWidth = 5
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_0_6px_currentColor]" style={{ color: color }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1F202E" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
    </div>
  )
}

const sparklineData1 = [
  { val: 10 }, { val: 12 }, { val: 14 }, { val: 18 }, { val: 24 }, { val: 32 }, { val: 45 }, { val: 60 }, { val: 80 }
]
const sparklineData2 = [
  { val: 50 }, { val: 40 }, { val: 45 }, { val: 60 }, { val: 55 }, { val: 70 }, { val: 85 }, { val: 75 }, { val: 100 }
]

function SparklineArea({ data, color }: { data: { val: number }[], color: string }) {
  return (
    <div className="absolute bottom-0 right-0 left-0 h-[50px] pointer-events-none opacity-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="val" 
            stroke={color} 
            strokeWidth={2} 
            fill={`url(#gradient-${color.replace('#', '')})`} 
            isAnimationActive={false} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const barChartData = [
  { name: 'May 12', uv: 50000 }, { uv: 40000 }, { uv: 60000 }, { uv: 80000 }, { uv: 50000 }, { uv: 90000 }, { uv: 70000 },
  { name: 'May 19', uv: 100000 }, { uv: 80000 }, { uv: 110000 }, { uv: 130000 }, { uv: 100000 }, { uv: 140000 }, { uv: 120000 },
  { name: 'May 26', uv: 150000 }, { uv: 130000 }, { uv: 160000 }, { uv: 180000 }, { uv: 140000 }, { uv: 190000 }, { uv: 170000 },
  { name: 'Jun 02', uv: 180000 }, { uv: 160000 }, { uv: 190000 }, { uv: 170000 }, { uv: 150000 }, { uv: 200000 }, { uv: 180000 },
  { name: 'Jun 09', uv: 190000 }, { uv: 170000 }, { uv: 180000 }, { uv: 160000 }, { uv: 140000 }
]

const healthDistribution = [
  { name: 'Excellent (90-100%)', count: '1,642', percentage: '70.1%', value: 70.1, color: '#00D4FF' },
  { name: 'Good (70-89%)', count: '542', percentage: '23.2%', value: 23.2, color: '#7C3AED' },
  { name: 'Fair (50-69%)', count: '128', percentage: '5.5%', value: 5.5, color: '#F59E0B' },
  { name: 'Poor (<50%)', count: '29', percentage: '1.2%', value: 1.2, color: '#EF4444' },
]

const sourceDistribution = [
  { name: 'Confluence', value: 751, percentage: '32.1%', color: '#00D4FF' },
  { name: 'SharePoint', value: 578, percentage: '24.7%', color: '#0078D4' },
  { name: 'S3', value: 442, percentage: '18.9%', color: '#3B82F6' },
  { name: 'Notion', value: 229, percentage: '9.8%', color: '#EAB308' },
  { name: 'Others', value: 341, percentage: '14.5%', color: '#e5e5e5' },
];

function formatNumber(num: number) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
}

export default function SourcesPage() {
  const [search, setSearch] = useState("")
  const [sources, setSources] = useState<Source[] | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sourceName, setSourceName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [workspaceId, setWorkspaceId] = useState("")
  const [connecting, setConnecting] = useState(false)

  const loadSources = async () => {
    try {
      const data = await getSources()
      setSources(data)
      setUsingMockData(false)
    } catch (err) {
      console.error(err)
      setSources(mockSources as any)
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSources()
  }, [])

  const handleConnect = async () => {
    if (!sourceName || !apiKey) return;
    setConnecting(true)
    try {
      await connectSource(sourceName, "notion", apiKey, workspaceId)
      toast.success("Source connected successfully")
      setIsModalOpen(false)
      setSourceName("")
      setApiKey("")
      setWorkspaceId("")
      loadSources()
    } catch (err) {
      console.error(err)
      toast.error("Failed to connect source")
    } finally {
      setConnecting(false)
    }
  }

  const filtered = sources ? sources.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) : []

  if (loading || !sources) {
    return (
      <div className="min-h-screen bg-[#080812] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#1a1a2e] border-t-[#00D4FF] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080812] text-white p-8 pb-24 font-sans selection:bg-[#00D4FF]/30">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Sources</h1>
            {usingMockData && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                Sample data — live connection unavailable
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#8A8F98] mt-1.5">Manage and monitor all knowledge sources across your enterprise.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#11121C] border border-[#1F202E] rounded-lg px-3 py-2 w-64 transition-colors focus-within:border-[#00D4FF]/50">
            <Search size={14} className="text-[#8A8F98]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sources..."
              className="bg-transparent text-[13px] text-white placeholder-[#8A8F98] outline-none w-full"
            />
            <span className="text-[10px] font-semibold text-[#8A8F98] bg-[#1F202E] px-1.5 py-0.5 rounded">⌘K</span>
          </div>
          <div className="flex items-center gap-2.5 bg-[#11121C] border border-[#1F202E] rounded-lg px-3 py-2 hover:bg-[#1A1C28] cursor-pointer transition-colors">
            <Calendar size={14} className="text-[#8A8F98]" />
            <span className="text-[13px] text-white font-medium">May 12 – Jun 12, 2025</span>
          </div>
          <div className="flex items-center gap-2 bg-[#11121C] border border-[#1F202E] rounded-lg px-3 py-2 hover:bg-[#1A1C28] cursor-pointer transition-colors">
            <span className="text-[13px] text-white font-medium">All Sources</span>
            <ChevronDown size={14} className="text-[#8A8F98]" />
          </div>
          <div className="relative p-2 rounded-full border border-[#1F202E] bg-[#11121C] cursor-pointer hover:bg-[#1A1C28] transition-colors ml-1">
            <Bell size={16} className="text-[#8A8F98]" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#080812] text-[9px] font-bold flex items-center justify-center text-white translate-x-1/4 -translate-y-1/4">3</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#00D4FF] flex items-center justify-center text-xs font-bold text-white shadow-[0_0_12px_rgba(124,58,237,0.4)] cursor-pointer ml-1 border border-white/10">
            AD
          </div>
        </div>
      </div>

      {/* Four Stat Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-[#11121C] border border-[#1F202E] rounded-xl p-5 relative overflow-hidden flex flex-col h-[120px] shadow-sm">
          <div className="flex items-center justify-between z-10">
            <div className="text-[11px] font-medium tracking-wider text-[#8A8F98]">TOTAL SOURCES</div>
            <Maximize size={14} className="text-[#8A8F98] hover:text-white cursor-pointer transition-colors" />
          </div>
          <div className="mt-auto z-10">
            <div className="flex items-end gap-3">
              <div className="text-[32px] font-semibold text-white leading-none">2,341</div>
            </div>
            <div className="text-[12px] font-medium text-[#10B981] mt-1.5">↑ 18.7% <span className="text-[#8A8F98] ml-1">vs last 30 days</span></div>
          </div>
          <SparklineArea data={sparklineData1} color="#00D4FF" />
        </div>

        <div className="bg-[#11121C] border border-[#1F202E] rounded-xl p-5 flex items-center justify-between h-[120px] shadow-sm">
          <div className="h-full flex flex-col justify-between">
            <div className="text-[11px] font-medium tracking-wider text-[#8A8F98]">CONNECTED SOURCES</div>
            <div className="mt-auto">
              <div className="text-[32px] font-semibold text-white leading-none">2,102</div>
              <div className="text-[12px] font-medium text-[#8A8F98] mt-1.5">89.8% of total</div>
            </div>
          </div>
          <StatRing percentage={89.8} color="#00D4FF" size={64} />
        </div>

        <div className="bg-[#11121C] border border-[#1F202E] rounded-xl p-5 flex items-center justify-between h-[120px] shadow-sm">
          <div className="h-full flex flex-col justify-between">
            <div className="text-[11px] font-medium tracking-wider text-[#8A8F98]">DISCONNECTED</div>
            <div className="mt-auto">
              <div className="text-[32px] font-semibold text-white leading-none">239</div>
              <div className="text-[12px] font-medium text-[#8A8F98] mt-1.5">10.2% of total</div>
            </div>
          </div>
          <StatRing percentage={10.2} color="#7C3AED" size={64} />
        </div>

        <div className="bg-[#11121C] border border-[#1F202E] rounded-xl p-5 relative overflow-hidden flex flex-col h-[120px] shadow-sm">
          <div className="flex items-center justify-between z-10">
            <div className="text-[11px] font-medium tracking-wider text-[#8A8F98]">TOTAL CHUNKS</div>
            <Maximize size={14} className="text-[#8A8F98] hover:text-white cursor-pointer transition-colors" />
          </div>
          <div className="mt-auto z-10">
            <div className="text-[32px] font-semibold text-white leading-none">12.4M</div>
            <div className="text-[12px] font-medium text-[#10B981] mt-1.5">↑ 24.3% <span className="text-[#8A8F98] ml-1">vs last 30 days</span></div>
          </div>
          <SparklineArea data={sparklineData2} color="#7C3AED" />
        </div>
      </div>

      {/* Main Grid Layout containing ALL subsequent panels aligned nicely */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Table occupies 2 columns */}
        <div className="col-span-2 bg-[#11121C] border border-[#1F202E] rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between border-b border-[#1F202E] bg-[#11121C]">
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-semibold text-white">All Sources</span>
              <span className="text-[11px] bg-[#1F202E] text-[#8A8F98] px-2.5 py-0.5 rounded font-medium">2,341</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#080812] border border-[#1F202E] rounded-lg px-3 py-1.5 w-56">
                <Search size={14} className="text-[#8A8F98]" />
                <input
                  placeholder="Filter sources..."
                  className="bg-transparent text-[13px] text-white placeholder-[#8A8F98] outline-none w-full"
                />
              </div>
              <div className="flex items-center justify-center w-8 h-8 bg-[#00D4FF]/10 text-[#00D4FF] rounded-lg cursor-pointer hover:bg-[#00D4FF]/20 transition-colors">
                <BarChart2 size={16} />
              </div>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 border border-[#00D4FF]/50 text-[#00D4FF] bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[13px] font-medium px-4 py-1.5 rounded-lg transition-colors">
                <Plus size={16} />
                Add Source
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {["SOURCE NAME", "TYPE", "STATUS", "CHUNKS", "EMBEDDINGS", "LAST SYNC", "HEALTH", "ACTIONS"].map(h => (
                    <th key={h} className="text-[11px] font-medium tracking-wider text-[#8A8F98] uppercase py-3 px-6 border-b border-[#1F202E] bg-[#080812]/40 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((source) => (
                  <tr key={source.id} className="border-b border-[#1F202E] hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center bg-white border border-white/10 rounded flex-shrink-0 p-0.5">
                          {sourceLogos[source.type] ? (
                            <img src={sourceLogos[source.type]} alt={source.type} className="w-full h-full object-contain rounded-sm" />
                          ) : (
                            <Database size={12} className="text-[#080812]" />
                          )}
                        </div>
                        <span className="text-[13px] text-white font-medium">{source.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-[13px] text-[#8A8F98]">
                        {typeLabel[source.type] || source.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        {source.status === "connected" ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
                            <span className="text-[13px] font-medium text-[#00D4FF]">Connected</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                            <span className="text-[13px] font-medium text-[#7C3AED]">Disconnected</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-[13px] text-white">
                        {formatNumber(source.chunks)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-[13px] text-white">
                        {formatNumber(source.embeddings)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-[13px] text-[#8A8F98]">{source.lastSync}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <HealthRing value={source.health} size={22} />
                    </td>
                    <td className="py-3.5 px-6">
                      <button className="p-1 rounded text-[#8A8F98] hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3.5 border-t border-[#1F202E] flex items-center justify-between bg-[#080812]/40">
            <span className="text-[12px] text-[#8A8F98]">Showing 1 to {filtered.length} of 2,341 sources</span>
            <div className="flex items-center gap-1.5">
              <button className="p-1 text-[#8A8F98] hover:text-white transition-colors"><ChevronLeft size={14} /></button>
              {[1, 2, 3].map(n => (
                <button key={n} className={`w-6 h-6 rounded text-[12px] font-medium flex items-center justify-center transition-colors ${n === 1 ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30" : "text-[#8A8F98] hover:text-white hover:bg-white/5"}`}>{n}</button>
              ))}
              <span className="text-[#8A8F98] text-[12px] px-1">...</span>
              <button className="w-8 h-6 rounded text-[12px] text-[#8A8F98] hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors">293</button>
              <button className="p-1 text-[#8A8F98] hover:text-white transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>

        {/* Right side Stack of Panels */}
        <div className="col-span-1 flex flex-col gap-6">
          
          {/* Panel 1: Sync Activity */}
          <div className="bg-[#11121C] border border-[#1F202E] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[14px] font-semibold text-white">Sync Activity</span>
              <button className="text-[12px] font-medium text-[#00D4FF] hover:text-[#00bfe8] transition-colors">View All</button>
            </div>
            <div className="space-y-4">
              {mockSources.filter(s => s.status === "connected").slice(0, 5).map(source => (
                <div key={source.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center bg-white border border-white/10 rounded flex-shrink-0 p-0.5">
                      {sourceLogos[source.type] ? (
                        <img src={sourceLogos[source.type]} alt={source.type} className="w-full h-full object-contain rounded-sm" />
                      ) : (
                        <Database size={12} className="text-[#080812]" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-[13px] font-medium text-white truncate max-w-[130px]">{source.name.split(" - ")[0]}</div>
                      <div className="text-[11px] text-[#8A8F98]">Synced {source.lastSync.replace(' ago', 'm ago')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#10B981]">
                    <CheckCircle size={14} strokeWidth={2.5} />
                    <span className="text-[12px] font-medium">Success</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: Source Health Distribution */}
          <div className="bg-[#11121C] border border-[#1F202E] rounded-xl p-5 shadow-sm flex-1">
            <span className="text-[14px] font-semibold text-white block mb-4">Source Health Distribution</span>
            <div className="flex items-center gap-5">
              <div className="relative w-[110px] h-[110px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthDistribution}
                      innerRadius={40}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={3}
                    >
                      {healthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B0C10', borderColor: '#1F202E', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[18px] font-semibold text-white">2,341</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {healthDistribution.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[12px] text-[#8A8F98] truncate max-w-[80px]">{item.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[12px] font-medium text-white">{item.count}</span>
                      <span className="text-[12px] font-medium text-white w-8 text-right">{item.percentage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 3: Top Insights */}
          <div className="bg-[#11121C] border border-[#1F202E] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[14px] font-semibold text-white">Top Insights</span>
              <button className="text-[12px] font-medium text-[#00D4FF] hover:text-[#00bfe8] transition-colors">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { icon: TrendingUp, color: "#00D4FF", bg: "rgba(0, 212, 255, 0.1)", title: "Engineering docs saw 34% increase in updates", sub: "vs last 30 days" },
                { icon: AlertCircle, color: "#7C3AED", bg: "rgba(124, 58, 237, 0.1)", title: "3 data sources need attention", sub: "Health score below 70%" },
                { icon: Database, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", title: "1.2M new chunks added this month", sub: "↑ 24.3% vs last month" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                    <item.icon size={14} style={{ color: item.color }} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col justify-center min-h-[32px]">
                    <div className="text-[12px] font-medium text-white leading-tight">{item.title}</div>
                    <div className="text-[11px] text-[#8A8F98] mt-0.5">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Bottom Section (Same Grid layout alignment) */}
        
        {/* Panel 4: Data Ingestion Over Time (col-span-2 aligning with table) */}
        <div className="col-span-2 bg-[#11121C] border border-[#1F202E] rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-[15px] font-semibold text-white block mb-4">Data Ingestion Over Time</span>
              <div className="flex items-end gap-3">
                <div className="text-3xl font-semibold text-white leading-none">1.2M</div>
                <div className="text-[12px] font-medium text-[#10B981] mb-1">↑ 24.3% <span className="text-[#8A8F98]">vs last month</span></div>
              </div>
              <div className="text-[12px] font-medium text-[#8A8F98] mt-1.5">Total Chunks</div>
            </div>
            <button className="flex items-center gap-1.5 bg-[#080812] border border-[#1F202E] rounded-lg px-3 py-1.5 hover:bg-[#1A1C28] transition-colors">
              <span className="text-[12px] text-[#8A8F98]">Last 30 Days</span>
              <ChevronDown size={14} className="text-[#8A8F98]" />
            </button>
          </div>
          
          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 0, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4FF" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#8A8F98' }} 
                  dy={10}
                />
                <YAxis 
                  domain={[0, 200000]} 
                  ticks={[0, 50000, 100000, 150000, 200000]}
                  tickFormatter={(val) => val === 0 ? '0' : `${val / 1000}K`}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#8A8F98' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0B0C10', borderColor: '#1F202E', borderRadius: '8px' }}
                  itemStyle={{ color: '#00D4FF', fontSize: '12px', fontWeight: 500 }}
                  labelStyle={{ color: '#8A8F98', fontSize: '11px', marginBottom: '4px' }}
                />
                <Bar dataKey="uv" fill="url(#barGradient)" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 5: Source Types (col-span-1 aligning with right panels) */}
        <div className="col-span-1 bg-[#11121C] border border-[#1F202E] rounded-xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <span className="text-[15px] font-semibold text-white block">Source Types</span>
            <span className="text-[12px] text-[#8A8F98] mt-1 block">Distribution by source type</span>
          </div>
          
          <div className="flex items-center flex-1 gap-5">
            <div className="relative w-[120px] h-[120px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    innerRadius={45}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={3}
                  >
                    {sourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0C10', borderColor: '#1F202E', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[20px] font-semibold text-white">2,341</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-3.5">
              {sourceDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[12px] text-white">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-medium" style={{ color: item.color }}>{item.percentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#11121C] border border-[#1F202E] rounded-xl w-[400px] overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#1F202E]">
              <h2 className="text-lg font-semibold text-white">Add Source</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#8A8F98] mb-1.5">Source Name</label>
                <input
                  value={sourceName}
                  onChange={e => setSourceName(e.target.value)}
                  className="w-full bg-[#080812] border border-[#1F202E] rounded-lg px-3 py-2 text-[13px] text-white focus:border-[#00D4FF]/50 outline-none transition-colors"
                  placeholder="e.g. Notion Engineering"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#8A8F98] mb-1.5">API Key</label>
                <input
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  type="password"
                  className="w-full bg-[#080812] border border-[#1F202E] rounded-lg px-3 py-2 text-[13px] text-white focus:border-[#00D4FF]/50 outline-none transition-colors"
                  placeholder="Secret key"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#8A8F98] mb-1.5">Workspace ID</label>
                <input
                  value={workspaceId}
                  onChange={e => setWorkspaceId(e.target.value)}
                  className="w-full bg-[#080812] border border-[#1F202E] rounded-lg px-3 py-2 text-[13px] text-white focus:border-[#00D4FF]/50 outline-none transition-colors"
                  placeholder="Optional workspace ID"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1F202E] bg-[#080812]/40 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#8A8F98] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-4 py-2 text-[13px] font-medium bg-[#00D4FF] hover:bg-[#00bfe8] text-[#080812] rounded-lg transition-colors disabled:opacity-50"
              >
                {connecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
