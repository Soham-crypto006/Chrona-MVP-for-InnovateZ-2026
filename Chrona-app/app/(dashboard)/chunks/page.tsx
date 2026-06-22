"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Database, XCircle } from "lucide-react"
import { getChunks, invalidateChunk, type Chunk } from "@/lib/api"
import { mockChunks } from "@/lib/mock-data"
import { toast } from "sonner"

export default function ChunksPage() {
  const [chunks, setChunks] = useState<Chunk[] | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const loadChunks = async () => {
    try {
      const data = await getChunks()
      setChunks(data)
      setUsingMockData(false)
    } catch (err) {
      console.error(err)
      setChunks(mockChunks as any)
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChunks()
  }, [])

  const handleInvalidate = async (id: string) => {
    if (!chunks) return;
    const previousChunks = [...chunks];
    
    // Optimistic UI update
    setChunks(chunks.map(c => c.id === id ? { ...c, status: "invalidated" } : c))
    
    try {
      await invalidateChunk(id)
      toast.success("Chunk invalidated successfully")
    } catch (err) {
      console.error(err)
      toast.error("Failed to invalidate chunk")
      setChunks(previousChunks) // Rollback
    }
  }

  const filtered = chunks ? chunks.filter(c =>
    c.documentTitle.toLowerCase().includes(search.toLowerCase())
  ) : []

  if (loading) {
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
            <h1 className="text-2xl font-semibold text-white tracking-tight">Chunks</h1>
            {usingMockData && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                Sample data — live connection unavailable
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#8A8F98] mt-1.5">Browse and manage granular knowledge chunks across all connected sources.</p>
        </div>
      </div>

      <div className="bg-[#11121C] border border-[#1F202E] rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#1F202E] bg-[#11121C]">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold text-white">All Chunks</span>
            <span className="text-[11px] bg-[#1F202E] text-[#8A8F98] px-2.5 py-0.5 rounded font-medium">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#080812] border border-[#1F202E] rounded-lg px-3 py-1.5 w-64">
              <Search size={14} className="text-[#8A8F98]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search chunks by title..."
                className="bg-transparent text-[13px] text-white placeholder-[#8A8F98] outline-none w-full"
              />
            </div>
            <button className="flex items-center gap-1.5 border border-[#1F202E] text-[#8A8F98] bg-[#11121C] hover:bg-[#1A1C28] text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Filter size={14} />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {["DOCUMENT TITLE", "SOURCE", "VERSION", "RETRIEVALS", "VALID FROM", "VALID TO", "STATUS", "ACTIONS"].map(h => (
                  <th key={h} className="text-[11px] font-medium tracking-wider text-[#8A8F98] uppercase py-3 px-6 border-b border-[#1F202E] bg-[#080812]/40 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((chunk) => (
                <tr key={chunk.id} className="border-b border-[#1F202E] hover:bg-white/[0.03] transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-white font-medium">{chunk.documentTitle}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2 text-[13px] text-[#8A8F98]">
                      <Database size={12} />
                      {chunk.source}
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="text-[13px] font-mono text-[#8A8F98]">v{chunk.version}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="text-[13px] text-white">{chunk.retrievalCount?.toLocaleString() ?? 0}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="text-[13px] text-[#8A8F98]">{chunk.validFrom}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="text-[13px] text-[#8A8F98]">{chunk.validTo}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    {chunk.status === "active" ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-bold tracking-widest uppercase">
                        ACTIVE
                      </span>
                    ) : chunk.status === "expired" ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-bold tracking-widest uppercase">
                        EXPIRED
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded border border-red-500 bg-red-500/10 text-red-500 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        ZOMBIE
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleInvalidate(chunk.id)}
                        disabled={chunk.status === "invalidated" || chunk.status === "zombie"}
                        className="flex items-center gap-1 p-1 text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Invalidate Chunk"
                      >
                        <XCircle size={14} />
                        Invalidate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-[#8A8F98]">
            No chunks found.
          </div>
        )}
      </div>
    </div>
  )
}
