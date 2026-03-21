import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { ToastContainer } from '../ui'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex">
      <Sidebar />
      <main className="flex-1 lg:ml-[220px] pb-20 lg:pb-0 min-w-0">
        <Outlet />
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}
