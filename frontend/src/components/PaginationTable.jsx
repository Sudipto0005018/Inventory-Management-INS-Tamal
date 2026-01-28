import { useContext, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Button } from "./ui/button";
import { Context } from "../utils/Context";

const PaginationTable = ({
    data,
    columns,
    currentPage: controlledPage,
    pageSize: controlledPageSize,
    totalPages: controlledTotalPages,
    onPageChange,
    onClickRow = (row) => {},
    bodyClassName = "",
}) => {
    const { user } = useContext(Context);
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
              (currentPage - 1) * (controlledPageSize || 5) + (controlledPageSize || 5)
          );

    // Filter columns based on user role
    const visibleColumns = columns.filter((col) => {
        return !col.adminOnly || user?.role === "admin";
    });

    return (
        <div className="bg-white shadow-md rounded-lg pb-2 border border-gray-300 overflow-hidden">
            <Table>
                <TableHeader className="bg-[#172452]">
                    <TableRow className="hover:bg-[#172452]">
                        {visibleColumns.map((col, i) => (
                            <TableHead
                                className={(i === 0 ? "ps-4" : "") + " text-white"}
                                key={col.key}
                            >
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody className={bodyClassName}>
                    {currentData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={visibleColumns.length} className="text-center">
                                No data
                            </TableCell>
                        </TableRow>
                    ) : (
                        currentData.map((row, idx) => (
                            <TableRow
                                key={idx}
                                className="hover:bg-gray-50"
                                onClick={() => onClickRow(row)}
                            >
                                {visibleColumns.map((col, i) => (
                                    <TableCell key={col.key} className={i === 0 ? "ps-5" : ""}>
                                        {typeof row[col.key] == "string" ? (
                                            <p className="text-wrap">{row[col.key]}</p>
                                        ) : (
                                            row[col.key]
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {totalPages > 1 && (
                <div className="pt-2 flex items-center justify-center gap-4 border-t">
                    <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        className="cursor-pointer"
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
