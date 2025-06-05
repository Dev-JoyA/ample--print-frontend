"use client"
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../components/Header"

const Page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    userName: "",
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
      const response = await fetch("https://ample-printhub-backend-latest.onrender.com/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
       if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }
      setFormData({
          firstName: "",
          lastName: "",
          phoneNumber: "",
          userName: "",
          email: "",
          password: "",
      });
      setError(data.message || "Registration successful");
      setTimeout(() => {
          router.push("/sign-in");
      }, 2000);

    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

    return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center sm:p-6 md:p-8">
      <Header isLoading={isLoading} />
      <div className="w-[850px] h-auto max-h-screen mx-auto rounded-[10px] pr-[40px] pb-[10px] pl-[40px] flex flex-col gap-[10px] bg-white/95 backdrop-blur-sm relative">
        {/* Shadow element separated from container */}
        <div className="flex flex-col items-center">
          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
            {error && (
              <div className={`text-sm text-center ${error.includes("successful") ? "text-green-500" : "text-red-500"}`}>
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Username
              </label>
              <input
                type="text"
                name="userName"
                placeholder="Username"
                value={formData.userName}
                onChange={handleChange}
                required
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="font-carlito text-sm text-gray-600">
              By creating an account, you accept our{" "}
              <Link href="/terms" className="text-[#000000] font-carlito hover:underline">
                Terms and Conditions
              </Link>
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[#000000] text-white font-carlito text-[18px] font-[600] rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Free Account"}
            </button>
            <p className="font-carlito text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#FF676A] hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
       
    </div>
  );
};

export default Page;