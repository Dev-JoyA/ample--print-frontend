import Link from "next/link";
import Image from "next/image";
import React from "react";

const Page = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/logo/images.jpeg" // Replace with your image path
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority // Ensures the image loads first
        />
      </div>

      {/* Overlay with low opacity */}
      <div className="absolute inset-0 bg-white/30 z-10"></div>

      {/* Content */}
      <div className="relative z-20 text-center">
        <h1 className="text-4xl font-bold mb-4 text-black">Sign In</h1>
        <form className="bg-[#031433]/90 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.3)] max-w-md w-full p-8 space-y-4">
          <label className="block text-sm font-bold text-left text-white">Email</label>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
          <label className="block text-sm font-bold text-left text-white">Password</label>
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Submit
          </button>
        </form>
        <p className="mt-4 text-sm text-black-300">
          Or sign in with Google{" "}
          <a href="google/oauth" className="text-blue-500 font-bold hover:underline">
            Google
          </a>
        </p>
      </div>
    </div>
  );
};

export default Page;