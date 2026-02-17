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

const PendingSpecial = () => {
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
      width: "min-w-[40px]",
    },
    {
      key: "item_type",
      header: "Type",
      width: "min-w-[40px]",
    },
    { key: "category", header: "Category" },
    { key: "quantity", header: "Qty" },
    {
      key: "modified_obs",
      header: (
        <span>
          Modified OBS <br /> Authorised
        </span>
      ),
    },
    { key: "quote_authority", header: "Quote Authority" },
    { key: "demandno", header: "Internal Demand No." },
    { key: "demanddate", header: "Internal Demand Date." },
    { key: "requisition", header: "Requisition No." },
    { key: "Reqdate", header: "Requisition Date." },
    { key: "modemand", header: "MO Demand No." },
    { key: "modate", header: "MO Demand Date" },
    { key: "status", header: "Status" },
    { key: "created_at", header: "Created On" },
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "vue", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "quantity", label: "Issued Quantity" },
    { value: "survey_quantity", label: "Surveyed Quantity" },
    { value: "modified_obs", label: "Modified OBS Authorised" },
    { value: "demandno", label: "Internal Demand No." },
    { value: "demanddate", label: "Internal Demand Date." },
    { value: "requisition", label: "Requisition No." },
    { value: "Reqdate", label: "Requisition Date." },
    { value: "modemand", label: "MO Demand No." },
    { value: "modate", label: "MO Demand Date" },
    { value: "status", label: "Status" },
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
    internal_demand_no: "",
    internal_demand_date: null,
    requisition_no: "",
    requisition_date: null,

    mo_demand_no: "",
    mo_demand_date: null,
  });

  const [boxNo, setBoxNo] = useState([{ qn: "", no: "" }]);

  const fetchdata = async () => {
    try {
      const response = await apiService.get("/specialDemand/logs", {
        params: {
          page: currentPage,
          limit: config.row_per_page,
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
    }
  };

  const handleRefresh = () => {
    setInputs((prev) => ({
      ...prev,
      search: "",
    }));

    setSelectedSearchFields([]);
    setCurrentPage(1);
    setActualSearch("");
    // setSelectedRowIndex(null);
    setPanelProduct({ critical_spare: "no" });
    fetchdata("", 1);
  };

  useEffect(() => {
    fetchdata();
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
      // Qty increased from spares
      quantity: row.obs_increase_qty || "--",
      created_at: getTimeDate(row.created_at),
      // Final expected OBS qty
      modified_obs: row.obs_authorised || "--",
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
          <MultiSelect
            className="bg-white hover:bg-blue-50"
            options={options}
            placeholder="Select columns"
            onValueChange={setSelectedValues}
            defaultValue={selectedValues}
            singleLine
            maxCount={7}
          />
        </div>
        <div className="flex items-center mb-4 gap-4 w-[98%] mx-auto">
          <Input
            type="text"
            placeholder="Search items"
            className="bg-white"
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, search: e.target.value }))
            }
          />
          <SpinnerButton
            className="cursor-pointer hover:bg-primary/85"
            // onClick={handleSearch}
            loading={isLoading.search}
            disabled={isLoading.search}
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
          pageSize={fetchedData.items?.length || 10}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          className="h-[calc(100vh-230px)]"
        />
      </div>
    </>
  );
};

export default PendingSpecial;
