import React, { useContext, useEffect, useMemo, useState } from "react";
import PaginationTable from "../components/PaginationTableTwo";
import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import toaster from "../utils/toaster";
import { getDate } from "../utils/helperFunctions";
import { Button } from "../components/ui/button";
import { AiFillPrinter } from "react-icons/ai";

const CompletedServays = () => {
    const { config } = useContext(Context);
    const columns = useMemo(() => [
        { key: "description", header: "Item Description" },
        { key: "issue_date", header: "Issue Date" },
        { key: "category", header: "Category" },
        { key: "issued_quantity", header: "Issued Quantity" },
        { key: "quantity", header: "Surveyed Quantity" },
        { key: "status", header: "Status" },
        { key: "print", header: "Print" },
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

    const fetchdata = async () => {
        try {
            const response = await apiService.get("/pending/completed-permanent-issues", {
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
            toaster("error", error.message);
        }
    };

    useEffect(() => {
        fetchdata();
    }, [currentPage]);
    useEffect(() => {
        const t = fetchedData.items.map((row) => ({
            ...row,
            survey_quantity: row.quantity || "0",
            issue_date: getDate(row.issue_date),
            print: (
                <Button
                    size="icon"
                    className="bg-white text-black shadow-md border hover:bg-gray-100"
                >
                    <AiFillPrinter />
                </Button>
            ),
        }));
        setTableData(t);
    }, [fetchedData]);

    return (
        <div className="w-table-2 h-full rounded-md bg-white">
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
    );
};

export default CompletedServays;
