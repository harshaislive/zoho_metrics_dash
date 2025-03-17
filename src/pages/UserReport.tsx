import SearchBar from '../components/search/SearchBar'
import SearchResults from '../components/search/SearchResults'

export default function UserReport() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
        <p className="mt-1 text-sm text-gray-500">
          Search and manage user information
        </p>
      </div>

      <SearchBar />
      <SearchResults />
    </div>
  )
} 