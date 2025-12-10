export default function CountHandler({ handleCountChange, maxCount, itemCount }: {
    handleCountChange: (increment: number) => void;
    maxCount: number;
    itemCount: number
}) {
    return (
        <div className="flex items-center mt-2 bg-white dark:bg-gray-700 rounded-lg px-2 py-1 shadow-sm justify-between">
            <button
                onClick={() => handleCountChange(-1)}
                className="w-7 h-7 flex items-center justify-center cursor-pointer  rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
                –
            </button>

            <span className="px-3 font-medium text-gray-700 dark:text-gray-200">
                {itemCount}
            </span>

            <button
                onClick={() => handleCountChange(+1)}
                disabled={itemCount >= maxCount}
                className={`
                    w-7 h-7 flex items-center justify-center rounded-md transition
                    ${itemCount >= maxCount
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100"
                    }
                `}
            >
                +
            </button>

        </div>
    )
}