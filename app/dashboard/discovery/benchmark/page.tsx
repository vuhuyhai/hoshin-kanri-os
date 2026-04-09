import { BenchmarkLibrary } from './components/BenchmarkLibrary'

export default function BenchmarkPage() {
  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">KPI Benchmark Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tham khảo KPI theo ngành và chọn target cho X-Matrix
        </p>
      </div>
      <BenchmarkLibrary currentIndustry="" />
    </div>
  )
}
