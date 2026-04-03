import Image from "next/image";

const Header = ({ isLoading }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 mt-[-10px] rounded-[10px] shadow-[4px_4px_8px_0px_rgba(0,0,0,0.1),-4px_-4px_8px_0px_rgba(0,0,0,0.1)]"></div>
      <div className="flex justify-center pt-4 sm:pt-6 md:pt-8 lg:pt-10 mt-[-20px] sm:mt-[-15px] md:mt-[-10px]">
        <div className="relative h-24 w-48 sm:h-28 sm:w-56 md:h-32 md:w-64 lg:h-36 lg:w-72">
          <Image
            src="/images/logo/aph-logo.png"
            fill
            alt="APH Logo"
            priority
            className="object-contain"
            sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, (max-width: 1024px) 256px, 288px"
          />
        </div>
      </div>
      {isLoading && (
        <div className="mx-auto w-full max-w-md px-4 pb-6 pt-4 sm:pb-8">
          <div className="loading-bar"></div>
        </div>
      )}
      <p className="mx-auto mb-3 max-w-md text-center font-carlito text-base font-semibold text-gray-800 sm:mb-4 sm:max-w-lg sm:text-lg md:text-xl lg:mt-[-150px]">
        Join thousands of businesses who use Ampleprint every day and scale
        your business in no time
      </p>
      <div className="flex flex-col items-center">
        <button className="mt-2 flex items-center gap-2 rounded-lg bg-[#D1D1D1] px-4 py-1 transition hover:bg-gray-300 sm:gap-3 sm:px-6">
          <div className="relative h-5 w-5 sm:h-6 sm:w-6">
            <Image
              src="/images/icons/google.png"
              fill
              alt="Google logo"
              className="object-contain"
            />
          </div>
          <span className="font-carlito text-xs font-semibold text-[#575757] sm:text-sm">
            Sign in with Google
          </span>
        </button>
        <p className="mt-3 font-carlito text-sm text-gray-600 sm:mt-4 sm:text-base md:text-lg">or</p>
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