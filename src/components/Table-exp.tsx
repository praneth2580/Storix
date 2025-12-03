import React, { useState, useMemo } from "react";
import { FancyToggle } from "./Toggle";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  itemsPerPage?: number;
}

export interface OperatorConfig {
  value:
    | "contains"
    | "equals"
    | "startsWith"
    | "endsWith"
    | "greaterThan"
    | "lessThan";
  label: string;
}

function getValue<T>(row: T, accessor: Column<T>["accessor"]) {
  return typeof accessor === "function"
    ? accessor(row)
    : (row[accessor] as React.ReactNode);
}

export default function Table<T extends object>({
  columns,
  data,
  itemsPerPage = 10,
}: TableProps<T>) {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState<keyof T | "">("");
  const [filterOperator, setFilterOperator] = useState<
    OperatorConfig["value"] | ""
  >("");
  const [filterValue, setFilterValue] = useState("");

  const operators: OperatorConfig[] = [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "startsWith", label: "Starts With" },
    { value: "endsWith", label: "Ends With" },
    { value: "greaterThan", label: "Greater Than" },
    { value: "lessThan", label: "Less Than" },
  ];

  // -----------------------------
  // Filtering
  // -----------------------------
  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        columns.some((col) => {
          const value =
            typeof col.accessor === "function"
              ? col.accessor(item)
              : item[col.accessor];
          return value
            ?.toString()
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase());
        })
      );
    }

    if (filterColumn && filterOperator && filterValue) {
      filtered = filtered.filter((item) => {
        const rawValue = item[filterColumn];
        if (rawValue === undefined || rawValue === null) return false;

        const value = rawValue.toString().toLowerCase();
        const filter = filterValue.toLowerCase();

        switch (filterOperator) {
          case "contains":
            return value.includes(filter);
          case "equals":
            return value === filter;
          case "startsWith":
            return value.startsWith(filter);
          case "endsWith":
            return value.endsWith(filter);
          case "greaterThan":
            return parseFloat(value) > parseFloat(filter);
          case "lessThan":
            return parseFloat(value) < parseFloat(filter);
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [data, searchTerm, filterColumn, filterOperator, filterValue]);

  // -----------------------------
  // Pagination
  // -----------------------------
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleClearFilter = () => {
    setFilterColumn("");
    setFilterOperator("");
    setFilterValue("");
    setCurrentPage(1);
  };

  // -----------------------------
  // Common Actions UI (Filters + Toggle)
  // -----------------------------
  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">

      {/* TOP BAR = Search + Filters + Toggle */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          className="w-full md:w-1/3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* FILTER GROUP */}
        <div className="flex items-center rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <select
            value={filterColumn}
            onChange={(e) =>
              setFilterColumn(e.target.value as keyof T | "")
            }
            className="px-4 py-2.5 bg-transparent outline-none"
          >
            <option value="">Column</option>
            {columns.map((col) => (
              <option
                key={typeof col.accessor === "string" ? col.accessor : col.header}
                value={typeof col.accessor === "string" ? col.accessor : ""}
              >
                {col.header}
              </option>
            ))}
          </select>

          <select
            value={filterOperator}
            disabled={!filterColumn}
            onChange={(e) =>
              setFilterOperator(e.target.value as OperatorConfig["value"])
            }
            className="px-4 py-2.5 bg-transparent outline-none disabled:opacity-40"
          >
            <option value="">Operator</option>
            {operators.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Value"
            value={filterValue}
            disabled={!filterOperator}
            onChange={(e) => setFilterValue(e.target.value)}
            className="px-4 py-2.5 bg-transparent outline-none disabled:opacity-40 min-w-[120px]"
          />

          <button
            onClick={handleClearFilter}
            className="px-4 py-2.5 text-red-600 dark:text-red-400"
          >
            Clear
          </button>
        </div>

        {/* VIEW TOGGLE */}
        <FancyToggle
          value={viewMode === "card"}
          onChange={(checked) => setViewMode(checked ? "card" : "table")}
          labelLeft="Table"
          labelRight="Card"
        />
      </div>

      {/* BODY RENDERER */}
      {viewMode === "table" ? (
        <TableUI columns={columns} paginatedData={paginatedData} />
      ) : (
        <CardUI columns={columns} paginatedData={paginatedData} />
      )}

      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredData.length}
        count={paginatedData.length}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

/* TABLE VIEW */
function TableUI<T extends object>({
  columns,
  paginatedData,
}: {
  columns: Column<T>[];
  paginatedData: T[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-3 text-left text-xs font-semibold uppercase">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedData.map((row, rIdx) => (
            <tr key={rIdx}>
              {columns.map((col, cIdx) => (
                <td key={cIdx} className="px-6 py-3">
                  {getValue(row, col.accessor)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* CARD VIEW */
function CardUI<T extends object>({
  columns,
  paginatedData,
}: {
  columns: Column<T>[];
  paginatedData: T[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginatedData.map((row, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 
          bg-white/80 dark:bg-gray-800/60 shadow-md hover:shadow-xl transition"
        >
          {columns.map((col, j) => (
            <div key={j} className="mb-3">
              <p className="text-xs uppercase text-gray-500">{col.header}</p>
              <p className="text-lg font-semibold">{getValue(row, col.accessor)}</p>
              {j < columns.length - 1 && (
                <hr className="mt-2 opacity-30" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* PAGINATION */
function Pagination({
  currentPage,
  totalPages,
  count,
  totalCount,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  count: number;
  totalCount: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex justify-between items-center mt-6">
      <span className="text-sm opacity-70">
        Showing {count} of {totalCount}
      </span>

      <div className="flex gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Prev
        </button>

        <span className="px-2">Page {currentPage}</span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
