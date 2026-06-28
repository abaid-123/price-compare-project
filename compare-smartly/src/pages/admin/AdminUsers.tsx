import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { API_BASE_URL } from "../../config/api";

type User = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      setUsers(data);
    } else {
      alert(data.message || "Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id: number) => {
    const confirmDelete = confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      alert("User deleted");
      fetchUsers();
    } else {
      alert(data.message || "Delete failed");
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/admin/users/${editingUser.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: editingUser.full_name,
          email: editingUser.email,
        }),
      },
    );

    const data = await res.json();

    if (res.ok) {
      alert("User updated");
      setEditingUser(null);
      fetchUsers();
    } else {
      alert(data.message || "Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#050815] text-white flex">
      <AdminSidebar />

      <main className="flex-1 w-full p-4 pt-24 md:p-6 md:pt-6 lg:p-8 overflow-x-hidden">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Users</h2>
          <p className="text-white/50 text-sm md:text-base">
            Manage registered users
          </p>
        </div>

        {/* Desktop / Tablet Table */}
        <div className="hidden md:block rounded-2xl bg-[#0B1024] border border-white/10 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/10">
                  <td className="p-4">{user.full_name}</td>

                  <td className="p-4 text-white/60">{user.email}</td>

                  <td className="p-4">
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
                      {user.role}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="rounded-lg bg-yellow-500/20 p-2 text-yellow-400 hover:bg-yellow-500/30"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => deleteUser(user.id)}
                        className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-white/50" colSpan={4}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl bg-[#0B1024] border border-white/10 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold truncate">{user.full_name}</h3>
                  <p className="text-sm text-white/60 break-all mt-1">
                    {user.email}
                  </p>

                  <span className="inline-block mt-3 rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
                    {user.role}
                  </span>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="rounded-lg bg-yellow-500/20 p-2 text-yellow-400 hover:bg-yellow-500/30"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => deleteUser(user.id)}
                    className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="rounded-2xl bg-[#0B1024] border border-white/10 p-6 text-center text-white/50">
              No users found
            </div>
          )}
        </div>

        {editingUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0B1024] border border-white/10 p-5 md:p-6">
              <h3 className="text-lg md:text-xl font-bold mb-4">Edit User</h3>

              <div className="space-y-4">
                <input
                  value={editingUser.full_name}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      full_name: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Full Name"
                />

                <input
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Email"
                />

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="w-full sm:w-auto rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={updateUser}
                    className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}