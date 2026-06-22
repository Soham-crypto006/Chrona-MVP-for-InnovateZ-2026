import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import { Toaster } from "sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
