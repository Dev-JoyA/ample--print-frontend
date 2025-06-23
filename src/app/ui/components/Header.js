import Image from "next/image";

const Header = ({ isLoading }) => {
  return (
    <div>
      <div>
        <div className="absolute inset-0 rounded-[10px] mt-[-10px] shadow-[4px_4px_8px_0px_rgba(0,0,0,0.1),-4px_-4px_8px_0px_rgba(0,0,0,0.1)] -z-10"></div>
        <div className="flex justify-center mt-[-20px]">
          <Image
            src="/images/logo/aph-logo.png"
            width={300}
            height={400}
            alt="APH Logo"
            priority
            className="object-contain"
          />
        </div>
        {isLoading && (
          <div className="w-full max-w-md mx-auto pt-8 pb-8 h-1 bg-transparent">
            <div className="loading-bar"></div>
          </div>
        )}
        <p className="font-carlito text-[20px] font-[600] text-gray-800 text-center max-w-lg mt-[-150px] mb-4 mx-auto">
          Join thousands of businesses who use Ampleprint every day and scale
          your business in no time
        </p>
        <div className="flex flex-col items-center">
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

export default Header;