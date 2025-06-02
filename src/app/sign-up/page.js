"use client"
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <div className="w-[850px] h-auto max-h-screen mx-auto rounded-[10px] pr-[40px] pb-[10px] pl-[40px] flex flex-col gap-[10px] bg-white/95 backdrop-blur-sm relative">
        {/* Shadow element separated from container */}
        <div className="absolute inset-0 rounded-[10px] shadow-[4px_4px_8px_0px_rgba(0,0,0,0.1),-4px_-4px_8px_0px_rgba(0,0,0,0.1)] -z-10"></div>
        
        <div className="flex justify-center mt-[-100px] mb-[-150px]">
          <Image
            src="/images/logo/aph-logo.png"
            width={250}
            height={353}
            alt="APH Logo"
            priority
            className="object-contain"
          />
        </div>
        {isLoading && (
          <div className="w-full max-w-md mx-auto h-1 bg-transparent">
            <div className="loading-bar"></div>
          </div>
        )}
        <div className="flex flex-col items-center">
          <p className="font-carlito text-[20px] font-[600] text-gray-800 text-center max-w-lg mt-2 mb-4">
            Join thousands of businesses who use Ampleprint every day and scale
            your business in no time
          </p>

          {/* Google Sign-In Button */}
          <button className="flex items-center gap-3 px-6 py-1 bg-[#D1D1D1] rounded-lg hover:bg-gray-300 transition mt-2">
            <Image
              src="/images/icons/google.png"
              width={20}
              height={32}
              alt="Google logo"
            />
            <span className="font-carlito text-[12px] font-[600] text-[#575757]">
              Sign in with Google
            </span>
          </button>

          <p className="font-carlito text-lg mt-4 text-gray-600">or</p>

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
       <style jsx>{`
        .loading-bar {
          height: 4px;
          background: black;
          width: 0;
          animation: load 2s linear forwards;
        }
        @keyframes load {
          0% {
            width: 0;
            background: black;
          }
          100% {
            width: 100%;
            background: red;
          }
        }
      `}</style>
    </div>
  );
};

export default Page;