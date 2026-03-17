"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { ADMIN_LOGIN } from "@/graphql/mutations";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [adminLogin, { loading }] = useMutation<{
    adminLogin: { token: string; admin: { id: number; username: string } };
  }>(ADMIN_LOGIN);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await adminLogin({
        variables: { username, password },
      });

      if (data?.adminLogin?.token) {
        localStorage.setItem("admin_token", data.adminLogin.token);
        router.push("/admin/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗");
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="font-serif text-2xl text-stone-800 text-center mb-2">
            管理者登入
          </h1>
          <p className="text-stone-400 text-xs text-center mb-8 font-sans">
            紀念網站後台管理系統
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-stone-600 mb-1 font-sans">
                帳號
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-1 font-sans">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-800 text-white text-sm py-3 rounded-lg hover:bg-stone-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors font-sans"
            >
              {loading ? "登入中..." : "登入"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
