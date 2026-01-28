import { useContext, useEffect, useMemo, useState } from "react";
import PaginationTable from "../components/PaginationTableTwo";
import { Context } from "../utils/Context";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { addDate, formatSimpleDate, getDate, getDateStrToDate } from "../utils/helperFunctions";
import { Button } from "../components/ui/button";
import { FaChevronRight } from "react-icons/fa6";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";

const CompletedTempLoan = () => {
    const { config } = useContext(Context);
    const columns = useMemo(() => [
        { key: "issued_to", header: "Issued To" },
        { key: "loan_duration", header: "Loan Duration" },
        { key: "loan_status", header: "Status" },
        { key: "quantity", header: "Quantity" },
        { key: "issue_date_formated", header: "Issue Date" },
        { key: "submission_date", header: "Max Return Date" },
        { key: "details", header: "Details" },
    ]);
    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [fetchedData, setFetchedData] = useState({
        items: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
    });
    const [selectedRow, setSelectedRow] = useState({});
    const [isOpen, setIsOpen] = useState({
        details: false,
    });
    const [receiveHistory, setReceiveHistory] = useState([]);

    const fetchdata = async () => {
        try {
            const response = await apiService.get("/loan/temp-loans-completed", {
                params: {
                    page: currentPage,
                    limit: config.row_per_page,
                },
            });
            if (response.success) {
                setFetchedData(response.data);
            } else {
                toaster("error", response.message);
            }
        } catch (error) {
            console.log(error);
            const errMsg = error.response?.data?.message || error.message || "Failed to fetch data";
            toaster("error", errMsg);
        }
    };
    const fetchLoanReceiveHistory = async () => {
        try {
            const response = await apiService.get("/loan/temp-loans-history/" + selectedRow.id);
            if (response.success) {
                setReceiveHistory(response.data);
                console.log(response.data);
            } else {
                setReceiveHistory([]);
            }
            console.log(response);
        } catch (error) {
            toaster("error", error.message);
        }
    };

    useEffect(() => {
        if (isOpen.details) {
            fetchLoanReceiveHistory();
        }
    }, [isOpen.details]);
    useEffect(() => {
        fetchdata();
    }, [currentPage]);
    useEffect(() => {
        const t = fetchedData.items.map((row) => ({
            ...row,
            issued_to: row.issued_to.toUpperCase(),
            loan_status: row.loan_status == "pending" ? "Pending" : "Completed",
            issue_date_formated: getDate(row.issue_date),
            submission_date: getDate(
                formatSimpleDate(
                    addDate(getDateStrToDate(row.issue_date), parseInt(row.loan_duration))
                )
            ),
            details: (
                <Button
                    size="icon"
                    className="bg-white text-black shadow-md border hover:bg-gray-100"
                    onClick={() => {
                        setSelectedRow(row);
                        setIsOpen((prev) => ({ ...prev, details: true }));
                    }}
                >
                    <FaChevronRight />
                </Button>
            ),
        }));
        setTableData(t);
    }, [fetchedData]);

    return (
        <>
            <div className="w-full h-full rounded-md bg-white">
                <PaginationTable
                    data={tableData}
                    columns={columns}
                    currentPage={fetchedData.currentPage || 1}
                    pageSize={fetchedData.items?.length || 10}
                    totalPages={fetchedData.totalPages || 1}
                    onPageChange={setCurrentPage}
                    hasSearch={false}
                />
            </div>
            <Dialog
                open={isOpen.details}
                onOpenChange={(set) =>
                    setIsOpen((prev) => {
                        return { ...prev, details: set };
                    })
                }
            >
                <DialogContent
                    onPointerDownOutside={(e) => {
                        // e.preventDefault();
                    }}
                    className="max-h-[90%] overflow-y-auto"
                    onCloseAutoFocus={() => {}}
                >
                    <DialogTitle className="capitalize">Returned details</DialogTitle>
                    <DialogDescription className="hidden" />
                    {receiveHistory.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Returned Quantity</TableHead>
                                    <TableHead>Returned Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receiveHistory.map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{row.quantity}</TableCell>
                                        <TableCell>{getDate(row.date)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    <div className="flex items-center mt-4 gap-4 justify-end">
                        <Button
                            onClick={() => setIsOpen((prev) => ({ ...prev, details: false }))}
                            variant="outline"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CompletedTempLoan;
