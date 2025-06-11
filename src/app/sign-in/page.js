"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Link from "next/link";

const Page = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:4001/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Sign-in failed");
        setIsLoading(false);
        return;
      }
      setFormData({
        email: "",
        password: ""
      });
      setError(data.message || "Sign-in successful");
      setTimeout(() => {
        console.log(data, data.user, data.user.role, "finding role")
        if (data.user.role === "admin") {
          router.push("/dashboards/admin-dashboard");
        }
        else if (data.user.role === "super-admin") {
          router.push("/dashboards/super-admin-dashboard");
        }
        
        router.push("/dashboards/user-dashboard");
      }, 1500);
    } catch (error) {
      console.error("Cannot fetch:", error);
      setError(error.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 mt-[-50px]">
      <Header isLoading={isLoading} />
      {/* Content */}
      <div className="w-full max-w-lg rounded-lg p-6 sm:p-8 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="flex flex-col items-center">
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {error && (
              <div className={`text-sm text-center ${error.includes("successful") ? "text-green-500" : "text-red-500"}`}>
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                // required
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                // required
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[#000000] text-white font-carlito text-[18px] font-[600] rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
            <p className="font-carlito text-sm text-gray-600 text-center">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-[#FF676A] hover:underline">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
       <button
          onClick={() => router.push("/forgot-password")}
          disabled={isLoading}
          type="submit"
          className="w-full mt-4 py-2 bg-transparent text-[#FF676A] font-carlito text-[16px] font-[500] rounded-md hover:bg-[red] hover:text-white transition duration-300 disabled:opacity-50 border border-[#FF676A]"
        >
          Forgot Password?
      </button>
      </div>
    </div>
  );
};

export default Page;