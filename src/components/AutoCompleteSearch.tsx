import React, { useState, useEffect, useRef } from "react";

interface AutoCompleteProps<T> {
  id: string;
  name: string;
  value?: string;
  options: T[];

  optionKey?: string; // key used to show in input
  placeholder?: string;
  onSelect: (selected: T) => void;

  renderOption?: (item: T) => React.ReactNode;

  /** NEW: keys to search inside */
  searchKeys?: string[];
}

export default function AutoCompleteSearch<T>({
  id,
  name,
  value = "",
  options = [],
  optionKey = "name",
  placeholder = "Search...",
  onSelect,
  renderOption,

  /** NEW */
  searchKeys = ["name"],
}: AutoCompleteProps<T>) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    searchKeys.some((key) =>
      String(o[key] ?? "")
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full">
      <input
        id={id}
        name={name}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="
          p-3 rounded-lg w-full
          border border-gray-300 dark:border-gray-700
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-200
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />

      {open && filtered.length > 0 && (
        <div
          className="
            absolute left-0 right-0 mt-1 max-h-60 overflow-auto
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-700
            rounded-lg shadow-lg z-20
          "
        >
          {filtered.map((item: any) => (
            <div
              key={item.id || item[optionKey]}
              onClick={() => {
                setQuery(item[optionKey]);
                setOpen(false);
                onSelect(item);
              }}
              className="cursor-pointer"
            >
              {renderOption ? (
                renderOption(item)
              ) : (
                <div
                  className="
                    px-3 py-2
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    text-gray-900 dark:text-gray-200
                  "
                >
                  {item[optionKey]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
