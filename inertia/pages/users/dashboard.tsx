import { Head } from '@inertiajs/react'
import UserLayout from '~/layouts/user_layout'

function Dashboard() {
  return (
    <>
      <Head title="Dashboard" />
    </>
  )
}

Dashboard.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Dashboard
