"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Link from "next/link";

const Page = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
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
      const response = await fetch("http://localhost:4001/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Reset password failed");
        setIsLoading(false);
        return;
      }
      setFormData({
        password: "",
        confirmPassword: ""
      });
      setError(data.message || "Reset password successful");
      setTimeout(() => {
        router.push("/sign-in");
      }, 1500);
    } catch (error) {
      console.error("Cannot fetch:", error);
      setError(error.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 mt-[-100px]">
        <Header isLoading={isLoading} />
        {/* Content */}
        <div className="w-full max-w-lg rounded-lg p-6 sm:p-8 bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col items-center">
            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
                {error && (
                <div className={`text-sm text-center ${error.includes("successful") ? "text-green-500" : "text-red-500"}`}>
                    {error}
                </div>
                )}
                <div className="flex flex-col gap-1">
                <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                </div>
                <div className="flex flex-col gap-1">
                <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                    Confirm Password
                </label>
                <input
                    type="password"
                    id="confirm-password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                </div>
                <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-[#000000] text-white font-carlito text-[18px] font-[600] rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                {isLoading ? "Setting..." : "Save Password"}
                </button>
            </form>
            </div>
        </div>
    </div>
  );
};

export default Page;