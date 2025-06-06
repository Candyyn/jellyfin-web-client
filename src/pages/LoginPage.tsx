import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AtSign, Lock, AlertCircle } from "lucide-react";

const LoginPage: React.FC = () => {
  const auth = useAuth();
  const login = auth?.login;
  const isLoading = auth?.isLoading ?? false;
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to add-server if no server URL is set
    if (!localStorage.getItem("jellyfin_server_url")) {
      navigate("/add-server");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      
      if (login) {
        await login({ username, password });
        navigate("/");
      } else {
        setError("Login function is not available.");
        console.error("Login function is undefined.");
      }
    } catch (err) {
      setError("Invalid username or password. Please try again.");
      console.error("Login error:", err);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-black flex flex-col items-center justify-center text-white p-4"
      style={{
        backgroundImage:
          'linear-gradient(rgba(33, 35, 45, 0.7), rgba(0, 0, 0, 0.7))',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-red-600 font-bold text-4xl mb-2">JELLYFLIX</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        <div className="bg-black/80 rounded-md p-8 backdrop-blur-sm">
          {error && (
            <div className="mb-6 p-3 bg-red-900/50 border border-red-700 rounded flex items-start gap-2 text-red-100">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-400 mb-1"
                >
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <AtSign size={18} />
                  </span>
                  <input
                    id="username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-400 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Magnusson Plus | Stream movies and shows
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
