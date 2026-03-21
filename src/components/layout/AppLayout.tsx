import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Topbar from './Topbar'
import { ToastContainer } from '../ui'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col lg:flex-row transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 lg:ml-[240px] pb-20 lg:pb-0 min-w-0 flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 w-full max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}
