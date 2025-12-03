
import React, { useState, useMemo } from 'react';
import { FancyToggle } from './Toggle';

import FilledGridSVG from '../assets/images/grid-filled.svg?react';
import GridSVG from '../assets/images/grid.svg?react';
import FilledTableSVG from '../assets/images/table-filled.svg?react';
import TableSVG from '../assets/images/table.svg?react';

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

interface UIProps<T> {
  columns: Column<T>[];
  paginatedData: T[];
  filteredData: T[];
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  filterColumn: keyof T | "";
  setFilterColumn: React.Dispatch<React.SetStateAction<keyof T | "">>;
  filterOperator: OperatorConfig["value"] | "";
  setFilterOperator: React.Dispatch<
    React.SetStateAction<OperatorConfig["value"] | "">
  >;
  filterValue: string;
  setFilterValue: React.Dispatch<React.SetStateAction<string>>;
  handlePageChange: (page: number) => void;
  handleClearFilter: () => void;
  operators: OperatorConfig[];
  isTableVisible?: boolean;
  setIsTableVisible?: React.Dispatch<React.SetStateAction<boolean>>;
}

// function getValue<T>(row: T, accessor: Column<T>["accessor"]): React.ReactNode {
//   return typeof accessor === "function"
//     ? accessor(row)
//     : (row[accessor] as React.ReactNode);
// }


const Table = <T extends object>({ columns, data, itemsPerPage = 10 }: TableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColumn, setFilterColumn] = useState<keyof T | ''>('');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [isTableVisible, setIsTableVisible] = useState(true);

  const operators = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
  ];

  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        columns.some(column => {
          const value = typeof column.accessor === 'function'
            ? column.accessor(item)
            : item[column.accessor];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    if (filterColumn && filterOperator && filterValue) {
      filtered = filtered.filter(item => {
        const itemValue = item[filterColumn];
        if (itemValue === null || itemValue === undefined) {
          return false;
        }
        const value = itemValue.toString().toLowerCase();
        const filter = filterValue.toLowerCase();

        switch (filterOperator) {
          case 'contains':
            return value.includes(filter);
          case 'equals':
            return value === filter;
          case 'startsWith':
            return value.startsWith(filter);
          case 'endsWith':
            return value.endsWith(filter);
          case 'greaterThan':
            return parseFloat(value) > parseFloat(filter);
          case 'lessThan':
            return parseFloat(value) < parseFloat(filter);
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [data, searchTerm, filterColumn, filterOperator, filterValue, columns]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleClearFilter = () => {
    setFilterColumn('');
    setFilterOperator('');
    setFilterValue('');
    setCurrentPage(1);
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">

      <SearchAndFilterBar
        columns={columns}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterColumn={filterColumn}
        setFilterColumn={setFilterColumn}
        filterOperator={filterOperator}
        setFilterOperator={setFilterOperator}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        handleClearFilter={handleClearFilter}
        operators={operators}
        isTableVisible={isTableVisible}
        setIsTableVisible={setIsTableVisible}
      />

      {isTableVisible ?
        <TableUI
          columns={columns}
          paginatedData={paginatedData}
          filteredData={filteredData}
          currentPage={currentPage}
          totalPages={totalPages}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterColumn={filterColumn}
          setFilterColumn={setFilterColumn}
          filterOperator={filterOperator}
          setFilterOperator={setFilterOperator}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          handlePageChange={handlePageChange}
          handleClearFilter={handleClearFilter}
          operators={operators}
        /> :
        <CardTableUI
          columns={columns}
          paginatedData={paginatedData}
          filteredData={filteredData}
          currentPage={currentPage}
          totalPages={totalPages}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterColumn={filterColumn}
          setFilterColumn={setFilterColumn}
          filterOperator={filterOperator}
          setFilterOperator={setFilterOperator}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          handlePageChange={handlePageChange}
          handleClearFilter={handleClearFilter}
          operators={operators}
        />
      }

      <PaginationBar
        paginatedCount={paginatedData.length}
        totalCount={filteredData.length}
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
      />
    </div>
  );

};

// function SearchAndFilterBar<T extends object>({
//   columns,
//   searchTerm,
//   setSearchTerm,
//   filterColumn,
//   setFilterColumn,
//   filterOperator,
//   setFilterOperator,
//   filterValue,
//   setFilterValue,
//   handleClearFilter,
//   operators
// }: {
//   columns: Column<T>[];
//   searchTerm: string;
//   setSearchTerm: (v: string) => void;

//   filterColumn: keyof T | "";
//   setFilterColumn: (v: keyof T | "") => void;

//   filterOperator: OperatorConfig["value"] | "";
//   setFilterOperator: (v: OperatorConfig["value"] | "") => void;

//   filterValue: string;
//   setFilterValue: (v: string) => void;

//   handleClearFilter: () => void;
//   operators: OperatorConfig[];
// }) {
//   return (
//     <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
//       {/* Search */}
//       <div className="relative w-full md:w-1/3 mb-4 md:mb-0">
//         <input
//           type="text"
//           placeholder="Global Search..."
//           className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white 
//           dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 
//           focus:ring-blue-500"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {/* Filters */}
//       <div className="flex items-center w-full md:w-auto rounded-xl border border-gray-300 dark:border-gray-700 
//         bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition">

//         {/* Column */}
//         <select
//           value={filterColumn as string}
//           onChange={(e) => setFilterColumn(e.target.value as keyof T | "")}
//           className="px-4 py-2.5 min-w-[150px] bg-transparent border-none outline-none 
//           text-gray-900 dark:text-gray-200"
//         >
//           <option value="">Column</option>
//           {columns.map((col) => (
//             <option
//               key={typeof col.accessor === "string" ? col.accessor : col.header}
//               value={typeof col.accessor === "string" ? col.accessor : ""}
//             >
//               {col.header}
//             </option>
//           ))}
//         </select>

//         <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

//         {/* Operator */}
//         <select
//           value={filterOperator}
//           onChange={(e) => setFilterOperator(e.target.value as OperatorConfig["value"])}
//           disabled={!filterColumn}
//           className="px-4 py-2.5 min-w-[130px] bg-transparent border-none outline-none 
//             text-gray-900 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
//         >
//           <option value="">Operator</option>
//           {operators.map((op) => (
//             <option key={op.value} value={op.value}>{op.label}</option>
//           ))}
//         </select>

//         <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

//         {/* Value */}
//         <input
//           type="text"
//           placeholder="Value"
//           value={filterValue}
//           onChange={(e) => setFilterValue(e.target.value)}
//           disabled={!filterOperator}
//           className="px-4 py-2.5 min-w-[150px] bg-transparent border-none outline-none 
//           text-gray-900 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
//         />

//         <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

//         {/* Clear */}
//         <button
//           onClick={handleClearFilter}
//           className="px-4 py-2.5 font-medium bg-transparent text-red-600 dark:text-red-400 
//           hover:bg-red-50 dark:hover:bg-red-900/20 transition"
//         >
//           Clear
//         </button>
//       </div>
//     </div>
//   );
// }

function SearchAndFilterBar<T extends object>({
  columns,
  searchTerm,
  setSearchTerm,
  filterColumn,
  setFilterColumn,
  filterOperator,
  setFilterOperator,
  filterValue,
  setFilterValue,
  handleClearFilter,
  operators,
  isTableVisible,
  setIsTableVisible
}: {
  columns: Column<T>[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;

  filterColumn: keyof T | "";
  setFilterColumn: (v: keyof T | "") => void;

  filterOperator: OperatorConfig["value"] | "";
  setFilterOperator: (v: OperatorConfig["value"] | "") => void;

  filterValue: string;
  setFilterValue: (v: string) => void;

  handleClearFilter: () => void;
  operators: OperatorConfig[];
}) {
  const [showFilterModal, setShowFilterModal] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
      {/* Search */}
      <div className="relative w-full md:w-1/3 mb-4 md:mb-0">
        <input
          type="text"
          placeholder="Global Search..."
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white 
          dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 
          focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center w-full md:w-auto rounded-xl border border-gray-300 dark:border-gray-700 
        bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition">

        {/* TABLE & GRID TOGGLE */}
        <div className="mx-2">
          <FancyToggle
            checked={isTableVisible}
            activeImages={[FilledGridSVG, FilledTableSVG]}
            inActiveImages={[GridSVG, TableSVG]}
            onChange={() => setIsTableVisible(!isTableVisible)} />
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Column & Operators */}
        <p className="ms-2" onClick={() => setShowFilterModal(true)}>
          {filterColumn || filterOperator ? <>
            <span className="font-extrabold">{String(filterColumn).toUpperCase()}</span>
            <span> </span>
            <span className="font-extrabold">{String(filterOperator)}</span>
          </> : <span className="text-grey-700 dark:text-grey-200">No Filters</span>
          }
        </p>

        {/* Value */}
        <input
          type="text"
          placeholder="Value"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          disabled={!filterOperator}
          className="px-4 py-2.5 min-w-[150px] bg-transparent border-none outline-none 
          text-gray-900 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        />

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Clear */}
        <button
          onClick={handleClearFilter}
          disabled={!filterValue || filterValue === ''}
          className="px-4 py-2.5 font-medium bg-transparent text-red-600 dark:text-red-400 disabled:text-slate-200 dark:disabled:text-grey-600 
          hover:bg-red-50 dark:hover:bg-red-900/20 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-900/20 transition"
        >
          Clear
        </button>
      </div>
      <FilterModal
        show={showFilterModal}
        closeModal={() => setShowFilterModal(false)}
        columns={columns}
        operators={operators}
        filterColumn={filterColumn}
        setFilterColumn={setFilterColumn}
        filterOperator={filterOperator}
        setFilterOperator={setFilterOperator} />
    </div>
  );
}

function PaginationBar({
  paginatedCount,
  totalCount,
  currentPage,
  totalPages,
  handlePageChange
}: {
  paginatedCount: number;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-between items-center mt-8">
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Showing {paginatedCount} of {totalCount} results
      </div>

      <div className="flex items-center space-x-3">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 
            bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg 
            hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span className="text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 
            bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg 
            hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function TableUI<T extends object>(props: UIProps<T>) {
  const { columns, paginatedData, filteredData } = props;

  return (

    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full bg-white dark:bg-gray-900">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={typeof col.accessor === "string" ? col.accessor : col.header}
                className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedData.map((row, i) => (
            <tr key={i} className="hover:bg-gray-100 dark:hover:bg-gray-800">
              {columns.map((col, j) => (
                <td key={j} className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardTableUI<T extends object>(props: UIProps<T>) {
  const { columns, paginatedData } = props;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {paginatedData.map((row, idx) => (
        <div
          key={idx}
          className="relative p-5 rounded-2xl border border-gray-200 dark:border-gray-700
            bg-white/80 dark:bg-gray-800/60 backdrop-blur-md shadow-sm 
            hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r 
          from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl opacity-70" />

          {columns.map((col, j) => (
            <div key={j} className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r 
                    from-blue-400 to-blue-600 opacity-80 group-hover:scale-110 transition" />
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                  {col.header}
                </p>
              </div>

              <p className="text-base font-medium text-gray-900 dark:text-gray-200">
                {typeof col.accessor === "function"
                  ? col.accessor(row)
                  : (row[col.accessor] as React.ReactNode)}
              </p>

              {j !== columns.length - 1 && (
                <div className="h-px bg-gray-200 dark:bg-gray-700 mt-3" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
// >(''

function FilterModal<T extends object>({
  show,
  closeModal,
  columns,
  operators,
  filterColumn,
  setFilterColumn,
  filterOperator,
  setFilterOperator,
}: {
  show: boolean;
  closeModal: () => void;

  columns: Column<T>[];
  operators: OperatorConfig[];

  filterColumn: keyof T | "";
  setFilterColumn: (v: keyof T | "") => void;

  filterOperator: OperatorConfig["value"] | "";
  setFilterOperator: (v: OperatorConfig["value"] | "") => void;
}) {
  if (!show) return null;

  return (
    <div
      className="
        fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4
        z-50 animate-fadeIn
      "
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          rounded-xl p-6 w-full max-w-[600px]
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-700
          shadow-2xl dark:shadow-xl
          animate-scaleIn
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Filter Options
          </h1>

          <button
            onClick={closeModal}
            className="
              px-3 py-1 rounded-md
              bg-gray-200 dark:bg-gray-700
              hover:bg-gray-300 dark:hover:bg-gray-600
              text-gray-700 dark:text-gray-200
              transition
            "
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Columns */}
          <div className="flex-1">
            <p className="font-semibold text-md text-gray-500 dark:text-gray-400 mb-2">
              Columns
            </p>

            <div className="flex flex-wrap gap-2">
              {columns.map((col) => {
                const key =
                  typeof col.accessor === "string"
                    ? col.accessor
                    : (col.header as keyof T);

                const selected = filterColumn === key;

                return (
                  <button
                    key={key.toString()}
                    onClick={() => setFilterColumn(key)}
                    className={`
                      px-4 py-2 rounded-md border transition-all text-sm
                      ${selected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    {col.header}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operators */}
          <div className="flex-1">
            <p className="font-semibold text-md text-gray-500 dark:text-gray-400 mb-2">
              Operators
            </p>

            <div className="flex flex-wrap gap-2">
              {operators.map((op) => {
                const selected = filterOperator === op.value;

                return (
                  <button
                    key={op.value}
                    onClick={() => setFilterOperator(op.value)}
                    className={`
                      px-4 py-2 rounded-md border transition-all text-sm
                      ${selected
                        ? "bg-purple-600 text-white border-purple-600 shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    {op.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}



export default Table;
