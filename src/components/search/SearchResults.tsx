interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
}

const mockUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive'
  }
]

export default function SearchResults() {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Users</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {mockUsers.map((user) => (
          <div key={user.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{user.role}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active'
                      ? 'text-green-600 bg-green-50'
                      : 'text-red-600 bg-red-50'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 