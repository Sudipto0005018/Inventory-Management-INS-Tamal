import { useContext, useEffect, useMemo, useState } from "react";
import { Context } from "../utils/Context";
import PaginationTable from "../components/PaginationTableTwo";
import apiService from "../utils/apiService";
import { Button } from "../components/ui/button";
import { IoMdRefresh } from "react-icons/io";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import Chip from "../components/Chip";
import {
  addDate,
  getDate,
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
    { key: "equipment_system", header: "Equipment / System" },
    { key: "qty_withdrawn", header: "Issued Qty" },
    { key: "service_no", header: "Service No." },
    { key: "issue_to", header: "Issued to" },
    { key: "issue_date_formated", header: "Issued Date" },
    { key: "loan_duration", header: "Loan Duration (days)" },
    { key: "submission_date", header: "Expected Return Date" },
    { key: "qty_received", header: "Returned Qty" },
    { key: "utilised_qty", header: "Utilised Qty" },
    { key: "status", header: "Status" },
    { key: "created_at", header: "Created On", width: "min-w-[40px]" },
  ]);

  const options = [
    {
      value: "description",
      label: "Item Description",
      width: "min-w-[40px]",
    },
    {
      value: "indian_pattern",
      label: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "min-w-[40px]",
    },
    { value: "category", label: "Category", width: "min-w-[40px]" },
    { value: "quantity", label: "Issued Quantity", width: "min-w-[40px]" },
    {
      value: "survey_quantity",
      label: "Surveyed Quantity",
      width: "min-w-[40px]",
    },
    { value: "status", label: "Status", width: "min-w-[40px]" },
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
      const response = await apiService.get("/temporaryIssue/logs", {
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

  const getDaysUntilReturn = (
    issueDate,
    loanDuration,
    qtyWithdrawn,
    qtyReceived,
  ) => {
    if (!issueDate || loanDuration == null) return "-";

    // If fully returned
    if (Number(qtyReceived || 0) >= Number(qtyWithdrawn || 0)) {
      return "Returned";
    }

    const issue = new Date(issueDate);

    const expected = new Date(issue);
    expected.setDate(expected.getDate() + Number(loanDuration));

    const today = new Date();

    // Remove time for accurate diff
    expected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = expected - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `+${diffDays} days`;
    if (diffDays === 0) return "0 days";
    return `${diffDays} days`; // negative → overdue
  };

  useEffect(() => {
    if (!Array.isArray(fetchedData.items)) return;

    const t = fetchedData.items.map((row) => ({
      ...row,

      issued_to: row.issue_to?.toUpperCase() || "-",

      loan_duration: row.loan_duration ?? "-",

      loan_status: row.loan_status || "-",

      quantity: row.qty_withdrawn ?? 0,
      created_at: getTimeDate(row.created_at),
      service_no: row.service_no || "-",

      issue_date_formated: row.issue_date ? getDate(row.issue_date) : "-",

      received_quantity: row.qty_received ?? 0,

      status: (() => {
        const s = row.loan_status?.toLowerCase();
        if (s === "utilised") {
          return <Chip text="Utilised" varient="warning" />;
        }
        if (s === "complete") {
          return <Chip text="Completed" varient="success" />;
        }
        return <Chip text="Unknown" varient="default" />;
      })(),

      receive: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border hover:bg-gray-100"
          onClick={() => {
            setSelectedRow(row);
            setIsOpen((prev) => ({ ...prev, receive: true }));
          }}
        >
          <FaChevronRight />
        </Button>
      ),
    }));

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

  useEffect(() => {
    if (!Array.isArray(fetchedData.items)) return;

    const t = fetchedData.items.map((row) => {
      const issuedQty = Number(row.qty_withdrawn || 0);
      const receivedQty = Number(row.qty_received || 0);

      return {
        ...row,

        quantity: issuedQty,
        utilised_qty: Math.max(issuedQty - receivedQty, 0),
        created_at: getTimeDate(row.created_at),

        item_type: row.spare_id ? "Spare" : row.tool_id ? "Tool" : "-",
        issue_to: row.issue_to?.toUpperCase() || "-",

        loan_duration: row.loan_duration ?? "-",
        returned_date_formatted: getFormatedDate(row.return_date),

        loan_status:
          Number(row.qty_received || 0) >= issuedQty ? "Completed" : "Pending",

        service_no: row.service_no || "-",

        issue_date_formated: row.issue_date
          ? getFormatedDate(row.issue_date)
          : "-",

        submission_date: row.issue_date
          ? getFormatedDate(
              addDate(row.issue_date, parseInt(row.loan_duration || 0)),
            )
          : "-",

        received_quantity: row.qty_received ?? 0,

        status: (() => {
          const s = row.loan_status?.toLowerCase();

          if (s === "utilised") {
            return <Chip text="Utilised" varient="info" />;
          }

          if (s === "complete") {
            return <Chip text="Completed" varient="success" />;
          }

          return <Chip text={row.loan_status || "Unknown"} varient="default" />;
        })(),

        receive: (
          <Button
            size="icon"
            className="bg-white text-black shadow-md border hover:bg-gray-100"
            onClick={() => {
              let parsedBoxNo = [];

              try {
                if (Array.isArray(row.box_no)) {
                  parsedBoxNo = row.box_no;
                } else if (typeof row.box_no === "string") {
                  parsedBoxNo = JSON.parse(row.box_no);
                }
              } catch (e) {
                console.error("Invalid box_no JSON", e);
              }
              setSelectedRow({
                ...row,
                quantity: issuedQty,
              });
              setBoxNo(parsedBoxNo);
              setIsOpen((prev) => ({ ...prev, receive: true }));
            }}
          >
            <FaChevronRight />
          </Button>
        ),
      };
    });

    setTableData(t);
  }, [fetchedData]);

  return (
    <>
      <div className="w-table-2 pt-2 h-full rounded-md bg-white">
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
            placeholder="Search Temporary Issues for.."
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
