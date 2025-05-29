
import Link from "next/link";
import Image from "next/image";

const Page = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center sm:p-6 md:p-8">
      <div className="w-[850px] h-auto max-h-screen mx-auto rounded-[10px] pr-[40px] pb-[10px] pl-[40px] flex flex-col gap-[10px] bg-white shadow-[-4px_4px_3px_0px_rgba(223,223,223,0.25)] shadow-[4px_-4px_3px_0px_rgba(223,223,223,0.25)]">
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
          <div className="w-full max-w-md flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                First Name
              </label>
              <input
                type="text"
                placeholder="First Name"
                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Last Name"
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Username
              </label>
              <input
                type="text"
                placeholder="Username"
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Email
              </label>
              <input
                type="email"
                placeholder="Email"
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-carlito text-[15px] font-[600] text-[#1E1E1E]">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="Phone Number"
                className="px-4 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="font-carlito text-sm text-gray-600">
              By creating an account, you accept our{" "}
              <Link href="/terms" className="text-[#000000] font-carlito hover:underline">
                Terms and Conditions
              </Link>
            </p>
            <button className="px-6 py-2 bg-[#000000] text-white font-carlito text-[18px] font-[600] rounded-md hover:bg-blue-700 transition">
              Create Free Account
            </button>
            <p className="font-carlito text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#FF676A] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;