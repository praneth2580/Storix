export default function CountHandler({ handleCountChange, itemCount }: {
    handleCountChange: (increment: number) => void;
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
                className="w-7 h-7 flex items-center justify-center cursor-pointer rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
                +
            </button>
        </div>
    )
}