import { useUsers } from "@/hooks/useUsers";

function App() {
  const { data: users, isPending, isError } = useUsers();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Nexus Console</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Users</h2>

          {isPending && <p className="text-gray-600">Loading users...</p>}

          {isError && (
            <p className="text-red-600">Error loading users. Make sure the API is running.</p>
          )}

          {users && users.length === 0 && (
            <p className="text-gray-600">No users found. Create one to get started!</p>
          )}

          {users && users.length > 0 && (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {user.name || "Unnamed User"}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
