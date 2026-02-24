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

// const PaginationTable = ({
//     data,
//     columns,
//     currentPage: controlledPage,
//     pageSize: controlledPageSize,
//     totalPages: controlledTotalPages,
//     onPageChange,
//     onClickRow = (row) => {},
//     bodyClassName = "",
//     hasSearch = true,
//     className = "",
// }) => {
const PaginationTable = ({
  data,
  columns,
  currentPage: controlledPage,
  pageSize: controlledPageSize,
  totalPages: controlledTotalPages,
  onPageChange,
  selectedRowIndex, // ✅ ADD
  onClickRow = (row, index) => {}, // ✅ index support
  bodyClassName = "",
  hasSearch = true,
  className = "",
}) => {
  const [internalPage, setInternalPage] = useState(1);

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

  const currentData = isControlled
    ? data
    : data.slice(
        (currentPage - 1) * (controlledPageSize || 5),
        (currentPage - 1) * (controlledPageSize || 5) +
          (controlledPageSize || 5),
      );

  const visibleColumns = [...columns];

  return (
    <div
      className={cn(
        "flex flex-col bg-white pb-2 rounded-lg overflow-hidden border-gray-300 w-full",
        hasSearch ? "h-[calc(100vh-185px)]" : "h-[calc(100vh-130px)]",
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
                  <p className="text-wrap py-2 text-xs">{col.header}</p>
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
                  //   <TableRow
                  //     key={idx}
                  //     className="hover:bg-gray-50"
                  //     onClick={() => onClickRow(row)}
                  //   >
                  <TableRow
                    key={idx}
                    // className={cn(
                    //   "cursor-pointer",
                    //   idx === selectedRowIndex
                    //     ? "bg-blue-100"
                    //     : "hover:bg-blue-100",
                    // )}
                    className={cn(
                      "cursor-pointer transition-all duration-150",
                      idx === selectedRowIndex
                        ? "bg-indigo-200 hover:bg-indigo-100 border-l-4 "
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
                          {typeof row[col.key] === "string" ? (
                            <p className="text-wrap text-xs">
                              {row[col.key] || "--"}
                            </p>
                          ) : (
                            row[col.key] || "--"
                          )}
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
