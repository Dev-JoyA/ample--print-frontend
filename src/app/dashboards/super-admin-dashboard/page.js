"use client";
import { useRouter } from 'next/navigation';
import { useAuthCheck } from "@/app/lib/auth";

const page = () => {
  const router = useRouter();
  useAuthCheck();


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <button onClick={() => router.push("../admin-management/create-admin") } className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300">
          Create Admin
        </button>
        <button onClick={() => router.push("../admin-management/activate-admin") } className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300">
          Activate Admin
        </button>
        <button onClick={() => router.push("../admin-management/deactivate-admin") } className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-300">
          Deactivate Admin
        </button>
      </div>
    </div>
  )
}

export default page