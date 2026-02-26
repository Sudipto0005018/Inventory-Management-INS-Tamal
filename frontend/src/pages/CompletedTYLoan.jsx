import { useContext, useEffect, useMemo, useState } from "react";
import { Context } from "../utils/Context";
import PaginationTable from "../components/PaginationTableTwo";
import apiService from "../utils/apiService";
import { Button } from "../components/ui/button";
import { IoMdRefresh } from "react-icons/io";
import { FaMagnifyingGlass } from "react-icons/fa6";

import Chip from "../components/Chip";
import {
  addDate,
  getFormatedDate,
  getTimeDate,
} from "../utils/helperFunctions";

import { MultiSelect } from "../components/ui/multi-select";
import { Input } from "../components/ui/input";
import toaster from "../utils/toaster";
import SpinnerButton from "../components/ui/spinner-button";

const PendingTempLoan = () => {
  const { config } = useContext(Context);
  const columns = useMemo(() => [
    { key: "description", header: "Item Description" },
    {
      key: "indian_pattern",
      header: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
    },
    {
      key: "item_type",
      header: "Type",
      width: "min-w-[40px]",
    },
    { key: "category", header: "Category" },
    { key: "qty_withdrawn", header: "Issued Qty" },
    { key: "service_no", header: "Service No." },
    { key: "concurred_by", header: "Concurred By" },
    { key: "issue_date_formated", header: "Issued Date" },
    { key: "loan_duration", header: "Loan Duration (days)" },
    { key: "submission_date", header: "Expected Return Date" },
    { key: "qty_received", header: "Returned Qty" },
    { key: "created_at", header: "Created On", width: "min-w-[40px]" },
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    {
      value: "indian_pattern",
      label: (
        <span>
          {" "}
          <i>IN</i> Part No.{" "}
        </span>
      ),
    },
    { value: "category", label: "Category" },
    { value: "qty_withdrawn", label: "Issued Qty" },
    { value: "qty_received", label: "Returned Qty" },
    { value: "service_no", label: "Service No." },
    { value: "concurred_by", label: "Concurred By" },
    { value: "loan_duration", label: "Loan Duration" },
    { value: "created_at", label: "Created On" },
  ];
  const [selectedValues, setSelectedValues] = useState([]);
  const [actionType, setActionType] = useState("returned");
  // "returned" | "utilised"

  const [boxNo, setBoxNo] = useState([]);
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
    receive: false,
    receive_calender: false,
  });
  const [inputs, setInputs] = useState({
    search: "",
    receive_date: new Date(),
    quantity_received: "",
  });
  const [isLoading, setIsLoading] = useState({
    table: false,
    receive: false,
  });
  const fetchdata = async (page = currentPage) => {
    try {
      setIsLoading((prev) => ({ ...prev, table: true }));
      const response = await apiService.get("/tyLoan/logs", {
        params: {
          page,
          limit: config.row_per_page,
          search: inputs.search || "",
          cols: selectedValues.join(","),
        },
      });

      if (response.success) {
        const items = Array.isArray(response.data)
          ? response.data
          : response.data?.items || [];

        setFetchedData({
          items,
          totalItems: response.data?.totalItems || items.length,
          totalPages: response.data?.totalPages || 1,
          currentPage,
        });
      }
    } catch (error) {
      toaster("error", error.message);
    } finally {
      setIsLoading((prev) => ({ ...prev, table: false }));
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchdata(1);
  };

  const handleRefresh = () => {
    setInputs((prev) => ({
      ...prev,
      search: "",
    }));

    setSelectedValues([]);
    setCurrentPage(1);

    fetchdata(1);
  };

  const getDepositQty = () => {
    if (!Array.isArray(boxNo)) return 0;

    return boxNo.reduce((sum, row) => {
      const depositQty = Number(row?.deposit || 0);
      return sum + depositQty;
    }, 0);
  };

  useEffect(() => {
    if (!Array.isArray(fetchedData.items)) return;

    const t = fetchedData.items.map((row) => {
      const issuedQty = Number(row.qty_withdrawn || 0);

      return {
        ...row,

        created_at: getTimeDate(row.created_at),

        item_type: row.spare_id ? "Spare" : row.tool_id ? "Tool" : "-",

        qty_withdrawn: issuedQty,

        concurred_by: row.concurred_by?.toUpperCase() || "-",

        loan_duration: row.loan_duration ?? "-",

        service_no: row.service_no || "-",

        issue_date_formated: row.issue_date
          ? getFormatedDate(row.issue_date)
          : "-",

        submission_date: row.issue_date
          ? getFormatedDate(
              addDate(row.issue_date, parseInt(row.loan_duration || 0)),
            )
          : "-",

        qty_received: row.qty_received ?? 0,

        /** ✅ Completed Logs Status */
        status: <Chip text="Completed" varient="success" />,

        /** ✅ Completed Loans → No countdown */
        days_until_return: (
          <span className="text-gray-500 font-medium">Completed</span>
        ),
      };
    });

    setTableData(t);
  }, [fetchedData]);

  // Pagination change
  useEffect(() => {
    fetchdata(currentPage);
  }, [currentPage]);

  // Column change auto search
  useEffect(() => {
    setCurrentPage(1);
    fetchdata(1);
  }, [selectedValues]);

  const updateTablePreview = (updates) => {
    setTableData((prev) =>
      prev.map((row) =>
        row.id === selectedRow.id ? { ...row, ...updates } : row,
      ),
    );
  };

  const closeDialog = () => {
    setIsOpen((prev) => ({ ...prev, receive: false }));
    setBoxNo([]);
    setInputs({
      receive_date: new Date(),
      quantity_received: "",
    });
  };

  return (
    <>
      <div className="w-table-2 pt-2 rounded-md bg-white">
        <div className="mb-2 px-3">
          <MultiSelect
            className="bg-white hover:bg-blue-50"
            options={options}
            placeholder="Select Fields"
            onValueChange={setSelectedValues}
            defaultValue={selectedValues}
            singleLine
            maxCount={6}
          />
        </div>
        <div className="flex items-center mb-4 gap-4 w-[98%] mx-auto">
          <Input
            type="text"
            placeholder="Search TY Loans for.."
            className="bg-white"
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, search: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />

          <SpinnerButton
            className="cursor-pointer hover:bg-primary/85"
            onClick={handleSearch}
            loading={isLoading.table}
            disabled={isLoading.table}
            loadingText="Searching..."
          >
            <FaMagnifyingGlass className="size-3.5" />
            Search
          </SpinnerButton>

          <Button
            variant="outline"
            className="cursor-pointer flex items-center gap-1 
            hover:bg-gray-200 font-extrabold
            hover:scale-105 
            transition-all duration-200"
            onClick={handleRefresh}
            title="Reset Search"
          >
            <IoMdRefresh
              className="size-7
              hover:rotate-180 
              transition-transform duration-300"
              style={{
                color: "#109240",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            />
            <span className="text-md font-bold text-green-700"></span>
          </Button>
        </div>
        <PaginationTable
          className="h-[calc(100vh-230px)] w-[calc(100vw-35px)]"
          data={tableData}
          columns={columns}
          currentPage={fetchedData.currentPage || 1}
          pageSize={config.row_per_page}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          hasSearch={false}
        />
      </div>
    </>
  );
};

export default PendingTempLoan;
