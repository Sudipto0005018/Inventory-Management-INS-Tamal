import { useContext, useEffect, useMemo, useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { IoMdRefresh } from "react-icons/io";
import Chip from "../components/Chip";

import SpinnerButton from "../components/ui/spinner-button";
import PaginationTable from "../components/PaginationTableTwo";
import { MultiSelect } from "../components/ui/multi-select";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import toaster from "../utils/toaster";
import {
  formatSimpleDate,
  getFormatedDate,
  getTimeDate,
} from "../utils/helperFunctions";

const PermanentPendings = () => {
  const { config } = useContext(Context);

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
    { value: "survey_date", label: "Survey Date", width: "min-w-[40px]" },
    {
      value: "survey_quantity",
      label: "Surveyed / Consumable / Local Perchase Qty",
      width: "min-w-[40px]",
    },
    {
      value: "survey_voucher_no",
      label: "Survey Voucher No",
      width: "min-w-[40px]",
    },
  ];
  const [selectedValues, setSelectedValues] = useState([]);

  const handleSearch = async (e) => {
    const searchTerm = inputs.search.trim();
    if (searchTerm === actualSearch) {
      return;
    } else {
      setActualSearch(searchTerm);
    }
    setIsLoading((prev) => ({ ...prev, search: true }));
    await fetchdata();
    setIsLoading((prev) => ({ ...prev, search: false }));
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

  const columns = useMemo(
    () => [
      { key: "description", header: "Item Description" },
      {
        key: "indian_pattern",
        header: (
          <span>
            <i>IN</i> Part No.
          </span>
        ),
      },
      { key: "item_type", header: "Type" },
      { key: "category", header: "Category" },
      { key: "demand_no", header: "Demand No." },
      { key: "demand_date", header: "Demand Date" },
      { key: "demand_quantity", header: "Demanded Qty" },
      { key: "stocked_nac_qty", header: "Stocked In / NAC Qty" },
      { key: "created_at", header: "Created On" },
      // { key: "status_badge", header: "Status" },
    ],
    [],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [tableData, setTableData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const [fetchedData, setFetchedData] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });

  const [isOpen, setIsOpen] = useState({
    issue: false,
    inventory: false,
    demand_calender: false,
  });

  const [isLoading, setIsLoading] = useState({
    nac: false,
    mo: false,
    inventory: false,
  });

  const [procurementPending, setProcurementPending] = useState("no");

  const [inputs, setInputs] = useState({
    issue_type: "nac",
    demand_quantity: "",
    nac_no: "",
    nac_calender: new Date(),
    validity: "",
    rate_unit: "",
    nac_qty: "",

    stocked_qty: "",
    mo_no: "",
    gate_pass_calender: new Date(),
  });

  const [boxNo, setBoxNo] = useState([]);

  const fetchData = async () => {
    try {
      console.log("TABLE DATA LENGTH:", tableData.length);

      const res = await apiService.get("/issue/logs", {
        params: {
          page: currentPage,
          limit: config.row_per_page,
        },
      });
      console.log("Rows per page:", config.row_per_page);

      if (res.success) {
        setFetchedData(res.data);
      } else {
        toaster("error", res.message);
      }
    } catch (err) {
      console.log(err);

      toaster("error", err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    console.log("API DATA:", fetchedData.items);
    const mapped = fetchedData.items.map((row) => {
      let statusBadge = null;
      //   const status = row.status?.toLowerCase();
      console.log("TABLE DATA LENGTH:", tableData.length);

      if (row.status === "complete") {
        statusBadge = <Chip text="Complete" varient="success" />;
      } else {
        statusBadge = <Chip text={row.status} varient="default" />;
      }

      return {
        ...row,
        demand_date: getFormatedDate(row.demand_date),
        demand_quantity: row.demand_quantity || "0",
        item_type: row.spare_id ? "Spare" : row.tool_id ? "Tool" : "-",
        created_at: getTimeDate(row.created_at),
        status_badge: statusBadge,
      };
    });

    setTableData(mapped);
  }, [fetchedData]);

  const updatePendingIssue = async (payload) => {
    try {
      const res = await apiService.put(
        `/issue/pending-issue/${selectedRow.id}`,
        payload,
      );

      if (!res.success) {
        toaster("error", res.message);
        return false;
      }

      return true;
    } catch (err) {
      toaster("error", err.message);
      return false;
    }
  };

  const handleNAC = async () => {
    if (
      !inputs.nac_no ||
      !inputs.validity ||
      !inputs.rate_unit ||
      !inputs.nac_qty
    ) {
      toaster("error", "All NAC fields are required");
      return;
    }

    if (Number(inputs.nac_qty) > Number(inputs.demand_quantity)) {
      toaster("error", "NAC Qty cannot exceed demand qty");
      return;
    }

    setIsLoading((p) => ({ ...p, nac: true }));

    const payload = {
      issue_type: "nac",
      nac_qty: inputs.nac_qty,
      nac_no: inputs.nac_no,
      nac_date: formatSimpleDate(inputs.nac_calender),
      validity: inputs.validity,
      rate_unit: inputs.rate_unit,

      qty_withdrawn: inputs.nac_qty,
      status: "NAC_GENERATED",
    };

    const updated = await updatePendingIssue(payload);

    if (updated) {
      toaster("success", "NAC saved successfully");
      setIsOpen((p) => ({ ...p, issue: false }));
      fetchData();
    }

    setIsLoading((p) => ({ ...p, nac: false }));
  };

  const handleStocking = async () => {
    if (!inputs.mo_no || !inputs.stocked_qty) {
      toaster("error", "All stocking fields required");
      return;
    }

    if (Number(inputs.stocked_qty) > Number(inputs.demand_quantity)) {
      toaster("error", "Stocked qty cannot exceed demand qty");
      return;
    }

    setIsLoading((p) => ({ ...p, mo: true }));

    const payload = {
      issue_type: "stocking",
      stocked_in_qty: inputs.stocked_qty,
      mo_no: inputs.mo_no,
      mo_date: formatSimpleDate(inputs.gate_pass_calender),

      qty_withdrawn: inputs.stocked_qty,

      status: "STOCKED",
    };

    const updated = await updatePendingIssue(payload);

    if (updated) {
      toaster("success", "Item stocked successfully");
      setIsOpen((p) => ({ ...p, issue: false }));
      fetchData();
    }

    setIsLoading((p) => ({ ...p, mo: false }));
  };

  return (
    <>
      <div className="w-full px-2 pt-2 h-full rounded-md bg-white">
        <div className="mb-2">
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
        <div className="flex items-center mb-4 gap-4 w-full">
          <Input
            type="text"
            placeholder="Search..."
            className="bg-white "
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, search: e.target.value }))
            }
          />
          <SpinnerButton
            className="cursor-pointer hover:bg-primary/85"
            onClick={handleSearch}
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
          currentPage={fetchedData.currentPage}
          pageSize={config.row_per_page}
          totalPages={fetchedData.totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
};

export default PermanentPendings;
