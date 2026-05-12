import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import { getFormatedDate, getTimeDate } from "../utils/helperFunctions";
import { MultiSelect } from "../components/ui/multi-select";

const PendingSpecialLogs = () => {
  const { config } = useContext(Context);
  const columns = useMemo(() => [
    { key: "description", header: "Item Description", width: "max-w-[110px]" },
    {
      key: "indian_pattern",
      header: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "max-w-[90px]",
    },
    { key: "category", header: "Category", width: "max-w-[30px]" },
    { key: "denos", header: "Denos.", width: "max-w-[30px]" },
    {
      key: "quantity",
      header: (
        <span>
          Qty
          <br /> Inc/ Dec
        </span>
      ),
      width: "max-w-[30px]",
    },
    {
      key: "modified_obs",
      header: (
        <span>
          Modified OBS <br /> Authorised
        </span>
      ),
      width: "max-w-[40px]",
    },
    { key: "quote_authority", header: "Authority", width: "max-w-[90px]" },
    {
      key: "modemand",
      header: <span> MO Demand No.</span>,
      width: "max-w-[70px]",
    },
    {
      key: "modate",
      header: <span>MO Demand Date</span>,
      width: "max-w-[50px]",
    },
    { key: "created_at", header: "Date of Return", width: "max-w-[60px]" },
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "indian_pattern", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "denos", label: "Denos." },
    { value: "quote_authority", label: "Authority" },
    { value: "mo_demand_no", label: "MO Demand No." },
    { value: "mo_demand_date", label: "MO Demand Date" },
  ];

  const [selectedValues, setSelectedValues] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchedData, setFetchedData] = useState({
    items: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [isLoading, setIsLoading] = useState({
    table: false,
    demand: false,
    requisition: false,
    mo: false,
    inventory: false,
    issue: false,
  });
  const [isOpen, setIsOpen] = useState({
    demand: false,
    issue: false,
    demand_calender: false,
    requisition_calender: false,
    gate_pass_calender: false,
    inventory: false,
  });
  const [selectedRow, setSelectedRow] = useState({});

  const [inputs, setInputs] = useState({
    search: "",
    internal_demand_no: "",
    internal_demand_date: null,
    requisition_no: "",
    requisition_date: null,

    mo_demand_no: "",
    mo_demand_date: null,
  });

  const [boxNo, setBoxNo] = useState([{ qn: "", no: "" }]);

  // Helper function to calculate modified OBS (same as PendingSpecial)
  const calculateModifiedOBS = (row) => {
    if (row.obs_authorised === null || row.obs_authorised === undefined)
      return "--";

    // If there's an increase quantity, add it to show final modified OBS
    if (row.obs_increase_qty && row.obs_increase_qty !== 0) {
      return row.obs_authorised + row.obs_increase_qty;
    }

    // Otherwise just show the authorised quantity
    return row.obs_authorised;
  };

  const fetchdata = async (page = currentPage) => {
    try {
      const response = await apiService.get("/specialDemand/logs", {
        params: {
          page,
          limit: 2000,
          search: inputs.search || "",
          cols: selectedValues.join(","),
        },
      });
      console.log("response==>", response);
      if (response.success) {
        setFetchedData(response.data);
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      console.log(error);
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

  // Column change auto search
  useEffect(() => {
    setCurrentPage(1);
    fetchdata(1);
  }, [selectedValues]);

  // Pagination change
  useEffect(() => {
    fetchdata(currentPage);
  }, [currentPage]);

  const getSpecialDemandStatus = (row) => {
    if (!row.internal_demand_no) return "Awaiting for Internal Demand No";

    if (row.internal_demand_no && !row.requisition_no)
      return "Awaiting for Requisition No";

    if (row.requisition_no && !row.mo_demand_no)
      return "Awaiting for MO Demand No";

    return "Completed";
  };

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      item_type: row.spare_id ? "Spare" : row.tool_id ? "Tool" : "-",

      // Qty increased from spares - show with +/- sign for clarity
      quantity: row.obs_increase_qty
        ? row.obs_increase_qty > 0
          ? `${row.obs_increase_qty}`
          : `${row.obs_increase_qty}`
        : "--",

      created_at: getTimeDate(row.created_at),

      // 🔥 FIXED: Use the same calculation as PendingSpecial
      modified_obs: calculateModifiedOBS(row),

      // Optional: Add tooltip for additional clarity (if your table supports it)
      modified_obs_tooltip:
        row.obs_increase_qty && row.obs_increase_qty !== 0
          ? `Base: ${row.obs_authorised}, Change: ${row.obs_increase_qty > 0 ? "+" : ""}${row.obs_increase_qty}`
          : `Base quantity: ${row.obs_authorised}`,

      quote_authority: row.quote_authority || "--",

      demandno: row.internal_demand_no || "--",
      demanddate: row.internal_demand_date
        ? getFormatedDate(row.internal_demand_date)
        : "--",

      requisition: row.requisition_no || "--",
      Reqdate: row.requisition_date
        ? getFormatedDate(row.requisition_date)
        : "--",

      modemand: row.mo_demand_no || "--",
      modate: row.mo_demand_date ? getFormatedDate(row.mo_demand_date) : "--",

      status: getSpecialDemandStatus(row),

      processed: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border"
          onClick={() => {
            setSelectedRow(row);

            setInputs({
              internal_demand_no: row.internal_demand_no || "",
              internal_demand_date: row.internal_demand_date
                ? new Date(row.internal_demand_date)
                : null,

              requisition_no: row.requisition_no || "",
              requisition_date: row.requisition_date
                ? new Date(row.requisition_date)
                : null,

              mo_demand_no: row.mo_demand_no || "",
              mo_demand_date: row.mo_demand_date
                ? new Date(row.mo_demand_date)
                : null,
            });

            // open dialog
            setIsOpen((prev) => ({ ...prev, issue: true }));
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
      <div className="w-table-2 pt-2 h-full rounded-md bg-white">
        <div className="px-3 mb-2">
          <Input
            type="text"
            placeholder="Search Special Demands"
            className="bg-white"
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, search: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>
        <div className="flex items-center mb-4 gap-4 w-[99%] mx-auto">
          <div className="w-full">
            <MultiSelect
              className="bg-white hover:bg-blue-50"
              options={options}
              placeholder="Select Fields"
              onValueChange={setSelectedValues}
              defaultValue={selectedValues}
              singleLine
              maxCount={7}
            />
          </div>
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
            className="cursor-pointer flex items-center gap-1 bg-white
            hover:bg-gray-200 
            hover:scale-105 
            transition-all duration-200"
            onClick={handleRefresh}
            title="Reset Search"
          >
            <IoMdRefresh
              className="size-7 font-bold
              hover:rotate-180 
              transition-transform duration-300"
              style={{
                color: "#109240",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            />
            <span className="text-md font-extrabold text-green-700"></span>
          </Button>
        </div>
        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={fetchedData.currentPage || 1}
          pageSize={config.row_per_page}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={(page) => {
            setCurrentPage(page);
            fetchdata(page);
          }}
          className="h-[calc(94vh-210px)]"
        />
      </div>
    </>
  );
};

export default PendingSpecialLogs;
