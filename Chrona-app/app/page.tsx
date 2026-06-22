export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080812]">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">CHRONA</h1>

        <p className="mb-8 text-[#00D4FF]">
          Enterprise Knowledge Intelligence Platform
        </p>

        <a
          href="/dashboard"
          className="rounded-lg bg-[#7C3AED] px-6 py-3 text-white transition-colors hover:bg-[#6d28d9]"
        >
          Go to Dashboard →
        </a>
      </div>
    </main>
  )
}