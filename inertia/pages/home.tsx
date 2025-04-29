import { Head } from '@inertiajs/react'
import authUser from '~/hooks/auth'

export default function Home() {
  const user = authUser()
  console.log(user)
  return (
    <>
      <Head title="Homepage" />

      {user?.isAuthenticated ? (
        <>
          <div className="text-sand-12 text-sm font-semibold mt-4">
            <span className="text-sand-11">Welcome back, </span>
            <span className="text-sand-12">{user.user.name}</span>
          </div>
          <a href="/logout" className="inline-block mt-2 bg-primary text-white px-4 py-2 rounded">
            Logout
          </a>
        </>
      ) : (
        <div className="flex gap-4 mt-4">
          <a href="/github/redirect" className="bg-primary text-white px-4 py-2 rounded">
            Login with GitHub
          </a>
          <a href="/google/redirect" className="bg-primary text-white px-4 py-2 rounded">
            Login with Google
          </a>
        </div>
      )}
    </>
  )
}
