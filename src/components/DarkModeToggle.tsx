import { useDarkMode } from "../utils/index";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useDarkMode();

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="relative w-14 h-8 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300 focus:outline-none"
    >
      {/* Circle */}
      <div
        className={`w-6 h-6 bg-white dark:bg-yellow-400 rounded-full shadow-md transform transition-transform duration-300 ${
          isDark ? "translate-x-6" : "translate-x-0"
        } flex items-center justify-center text-yellow-500`}
      >
        {/* Sun/Moon icon */}
        {isDark ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-900"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21.75 12c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25 21.75 6.615 21.75 12z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-yellow-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2.25a9.75 9.75 0 000 19.5 9.75 9.75 0 000-19.5zM12 0a12 12 0 110 24A12 12 0 0112 0z" />
          </svg>
        )}
      </div>
    </button>
  );
}
