
import { AppHeader } from '../components/layout/AppHeader'
import OperationsPage from '../features/operations/pages/OperationsPage'

export default function App() {
  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#17202a]">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 sm:py-9">
        <OperationsPage />
      </main>
    </div>
  )
}
