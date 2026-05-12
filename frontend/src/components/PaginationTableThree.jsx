import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import FilterPopover from "./FilterPopover";

const PaginationTable = ({
  data,
  columns,
  currentPage: controlledPage,
  pageSize: controlledPageSize,
  totalPages: controlledTotalPages,
  onPageChange,
  selectedRowIndex,
  onClickRow = (row, index) => {},
  bodyClassName = "",
  hasSearch = true,
  className = "",
  filters: externalFilters,
  onFiltersChange,
  filterableColumns = [
    "equipment_system",
    "boxNo",
    "category",
    "storage_location",
  ],
}) => {
  const [internalPage, setInternalPage] = useState(1);
  const [internalFilters, setInternalFilters] = useState({});

  const filters =
    externalFilters !== undefined ? externalFilters : internalFilters;
  const setFilters = onFiltersChange || setInternalFilters;

  const isControlled =
    typeof controlledPage === "number" &&
    typeof controlledPageSize === "number" &&
    typeof controlledTotalPages === "number" &&
    typeof onPageChange === "function";

  const currentPage = isControlled ? controlledPage : internalPage;
  const totalPages = isControlled
    ? controlledTotalPages
    : Math.ceil(data.length / (controlledPageSize || 5));

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    if (isControlled) {
      onPageChange(page);
    } else {
      setInternalPage(page);
    }
  };

  // Apply filters to data
  const filteredData = data.filter((row) => {
    for (const [columnKey, filterValues] of Object.entries(filters)) {
      if (filterValues && filterValues.length > 0) {
        let cellValue = row[columnKey];

        // Handle special cases
        if (cellValue && typeof cellValue === "object" && !cellValue.props) {
          cellValue = JSON.stringify(cellValue);
        }

        if (
          cellValue === undefined ||
          cellValue === null ||
          cellValue === "--"
        ) {
          if (!filterValues.includes("--")) return false;
        } else if (!filterValues.includes(String(cellValue))) {
          return false;
        }
      }
    }
    return true;
  });

  const currentData = isControlled
    ? filteredData
    : filteredData.slice(
        (currentPage - 1) * (controlledPageSize || 5),
        (currentPage - 1) * (controlledPageSize || 5) +
          (controlledPageSize || 5),
      );

  const visibleColumns = [...columns];

  const handleFilterChange = (columnKey, selectedValues) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: selectedValues,
    }));
    // Reset to first page when filters change
    if (isControlled && onPageChange) {
      onPageChange(1);
    } else {
      setInternalPage(1);
    }
  };

  const getColumnValue = (row, col) => {
    const value = row[col.key];
    if (typeof value === "string") {
      return <p className="text-wrap text-xs">{value || "--"}</p>;
    }
    return value || "--";
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-white pb-2 rounded-lg overflow-hidden border-gray-300 w-full",
        hasSearch ? "h-[calc(100vh-250px)]" : "h-[calc(100vh-130px)]",
        className,
      )}
    >
      <div className="overflow-x-auto flex-1 flex flex-col">
        <Table className="min-w-max relative pagination-table">
          <TableHeader className="sticky top-[1px] z-10 bg-blue-950">
            <TableRow>
              {visibleColumns.map((col, i) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    i === 0 ? "ps-4" : "",
                    "text-white bg-blue-950 text-center",
                    col.width,
                  )}
                >
                  <div className="flex items-center justify-center gap-1">
                    {filterableColumns.includes(col.key) && (
                      <FilterPopover
                        columnKey={col.key}
                        data={data}
                        onFilterChange={handleFilterChange}
                        activeFilters={filters}
                      />
                    )}
                    <p className="text-wrap py-2 text-xs">{col.header}</p>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className={cn("overflow-y-auto flex-1", bodyClassName)}>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="text-center"
                >
                  No data
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((row, idx) => {
                return (
                  <TableRow
                    key={idx}
                    className={cn(
                      "cursor-pointer transition-all duration-150",
                      idx === selectedRowIndex
                        ? "bg-indigo-200 hover:bg-indigo-100 border-l-4"
                        : "hover:bg-gray-50",
                    )}
                    onClick={() => onClickRow(row, idx)}
                  >
                    {visibleColumns.map((col, i) => {
                      return (
                        <TableCell
                          key={col.key}
                          className={cn(
                            i === 0
                              ? "ps-5 text-center"
                              : "border-l text-center",
                            visibleColumns.length - 1 === i ? "border-r" : "",
                            col.width,
                          )}
                        >
                          {getColumnValue(row, col)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="pt-2 flex items-center justify-center gap-4 border-t">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
          >
            Prev
          </Button>
          <span className="mx-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaginationTable;
