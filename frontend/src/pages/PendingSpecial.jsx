import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";
import { IoMdRefresh } from "react-icons/io";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import {
  formatDate,
  getFormatedDate,
  getTimeDate,
} from "../utils/helperFunctions";
import BoxNoInputs from "../components/BoxNoInputsTwo";
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
    { key: "category", header: "Category" },
    { key: "quantity", header: "OBS Inc/Dec Qty" },
    { key: "modified_obs", header: "Modified OBS Authorised" },
    { key: "quote_authority", header: "Quote Authority" },
    { key: "demandno", header: "Internal Demand No." },
    { key: "demanddate", header: "Internal Demand Date." },
    { key: "requisition", header: "Requisition No." },
    { key: "Reqdate", header: "Requisition Date." },
    { key: "modemand", header: "MO Demand No." },
    { key: "modate", header: "MO Demand Date" },
    { key: "created_at", header: "Created On", width: "min-w-[40px]" },
    { key: "status", header: "Status" },
    { key: "processed", header: "Proceed" },
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "indian_pattern", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "quantity", label: "Issued Quantity" },
    { value: "obs_authorised", label: "Modified OBS Authorised" },
    { value: "quote_authority", label: "Quote Authority" },
    { value: "internal_demand_no", label: "Internal Demand No." },
    { value: "internal_demand_date", label: "Internal Demand Date." },
    { value: "requisition_no", label: "Requisition No." },
    { value: "requisition_date", label: "Requisition Date." },
    { value: "mo_demand_no", label: "MO Demand No." },
    { value: "mo_demand_date", label: "MO Demand Date" },
    // { value: "created_at", label: "Created On" },
    // { value: "status", label: "Status" },
  ];

  const [date, setDate] = useState(new Date());
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

  const fetchdata = async (page = currentPage) => {
    try {
      const response = await apiService.get("/specialDemand/special-demand", {
        params: {
          page,
          limit: config.row_per_page,
          search: inputs.search || "",
          cols: selectedValues.join(","),
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

  const handleSubmitSpecialDemand = async () => {
    // 👇 --- CHANGE IS HERE ---
    // Add the ID of the record we are updating
    console.log(selectedRow);

    const payload = {
      id: selectedRow.id, // <-- ADD THIS LINE
      spare_id: selectedRow.spare_id,
      tool_id: selectedRow.tool_id,
    };

    if (inputs.internal_demand_no) {
      payload.internal_demand_no = inputs.internal_demand_no;
      payload.internal_demand_date = formatDate(inputs.internal_demand_date);
    }
    if (inputs.requisition_no) {
      payload.requisition_no = inputs.requisition_no;
      payload.requisition_date = formatDate(inputs.requisition_date);
    }
    if (inputs.mo_demand_no) {
      payload.mo_demand_no = inputs.mo_demand_no;
      payload.mo_demand_date = formatDate(inputs.mo_demand_date);
    }

    try {
      setIsLoading((p) => ({ ...p, issue: true }));
      // This PUT request now sends the ID to the updateSpecialDemand function
      const response = await apiService.put(
        "/specialDemand/special-demand",
        payload,
      );
      if (response.success) {
        // This message will now correctly be "Moved from Special Demand to Pending Issue"
        toaster("success", response.message);
        setIsOpen((p) => ({ ...p, issue: false }));
        fetchdata(); // Refresh the table
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster("error", error.response?.data?.message || "Update failed");
    } finally {
      setIsLoading((p) => ({ ...p, issue: false }));
    }
  };

  const handleInventory = async () => {
    let total = 0;
    for (let i = 0; i < boxNo.length; i++) {
      total += parseInt(boxNo[i].wd || "0");
      if (!boxNo[i].no) {
        toaster("error", "Box number is required");
        return;
      }
      console.log(boxNo, selectedRow.quantity);
    }
    if (total !== parseInt(selectedRow.quantity)) {
      toaster("error", "Stock quantity is not matched with survey quantity");
      return;
    }
    setIsLoading((prev) => ({ ...prev, inventory: true }));
    try {
      const response = await apiService.post("/specialDemand/special-demand", {
        id: selectedRow.id,
        box_no: JSON.stringify(boxNo),
        source: selectedRow.source,
        uid: selectedRow.uid,
      });
      if (response.success) {
        toaster("success", "Item added in inventory successfully");
        setIsOpen((prev) => ({ ...prev, inventory: false }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to add in inventory";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, inventory: false }));
    }
  };

  // Pagination change
  useEffect(() => {
    fetchdata(currentPage);
  }, [currentPage]);

  // Column change auto search
  useEffect(() => {
    setCurrentPage(1);
    fetchdata(1);
  }, [selectedValues]);

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

      // Qty increased from spares
      quantity: row.obs_increase_qty || "--",
      created_at: getTimeDate(row.created_at),
      // Final expected OBS qty
      modified_obs: row.obs_authorised || "--",

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

            // 🔥 FINAL STEP — prefill dialog fields
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
          pageSize={fetchedData.items?.length || 10}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          className="h-[calc(100vh-230px)]"
        />
      </div>

      <Dialog
        open={isOpen.issue}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, issue: set }))}
      >
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault(); // 🚫 Prevent outside click close
          }}
          onCloseAutoFocus={() => {
            setInputs({
              internal_demand_no: "",
              internal_demand_date: null,
              requisition_no: "",
              requisition_date: null,
              mo_demand_no: "",
              mo_demand_date: null,
            });
          }}
        >
          <div
            className="sticky top-0 z-10 bg-background 
                grid grid-cols-2 items-center 
                px-4 py-2 border-b"
          >
            <DialogTitle className="text-lg font-semibold">
              Amend Special Demand
            </DialogTitle>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => ({ ...prev, issue: false }))}
              className="justify-self-end rounded-md p-1 transition"
            >
              ✕
            </button>
          </div>
          <div className="flex items-start gap-2 mb-3">
            <span className="font-semibold text-gray-700">
              Item Description :
            </span>

            <span className="text-gray-900 font-semibold ml-1">
              {selectedRow?.description || "-"}
            </span>
          </div>
          <DialogDescription className="hidden" />
          <div>
            <>
              <div className="flex gap-4 w-full">
                {/* Demand No */}
                <div className="w-full">
                  <Label
                    htmlFor="internal_demand_no"
                    className="ms-2 mb-2 mt-4"
                  >
                    Internal Demand No. *
                  </Label>
                  <Input
                    type="text"
                    id="internal_demand_no"
                    value={inputs.internal_demand_no}
                    placeholder="Internal Demand No."
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        internal_demand_no: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-3">
                  <FormattedDatePicker
                    label="Internal Demand Date *"
                    value={inputs.internal_demand_date}
                    onChange={(date) =>
                      setInputs((prev) => ({
                        ...prev,
                        internal_demand_date: date,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4 w-full">
                {/* Requisition No */}
                <div className="w-full">
                  <Label htmlFor="requisition_no" className="ms-2 mb-2 mt-5">
                    Requisition No. *
                  </Label>
                  <Input
                    type="text"
                    id="requisition_no"
                    value={inputs.requisition_no}
                    placeholder="Requisition No."
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        requisition_no: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-4">
                  <FormattedDatePicker
                    label="Requisition Date *"
                    value={inputs.requisition_date}
                    onChange={(date) =>
                      setInputs((prev) => ({
                        ...prev,
                        requisition_date: date,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4 w-full">
                {/* MO Demand No */}
                <div className="w-full">
                  <Label htmlFor="nmo_demand_no" className="ms-2 mb-2 mt-7">
                    MO Demand No. *
                  </Label>
                  <Input
                    type="text"
                    id="mo_demand_no"
                    value={inputs.mo_demand_no}
                    placeholder="MO Demand No."
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        mo_demand_no: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-6">
                  <FormattedDatePicker
                    label="MO Demand Date *"
                    value={inputs.mo_demand_date}
                    onChange={(date) =>
                      setInputs((prev) => ({
                        ...prev,
                        mo_demand_date: date,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-end mt-6 gap-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setIsOpen((prev) => ({ ...prev, issue: false }))
                  }
                >
                  Cancel
                </Button>
                <SpinnerButton
                  loading={isLoading.requisition}
                  disabled={isLoading.requisition}
                  loadingText="Submitting..."
                  onClick={handleSubmitSpecialDemand}
                >
                  Submit
                </SpinnerButton>
              </div>
            </>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpen.inventory}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, inventory: set }))
        }
      >
        <DialogContent
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
            }));
          }}
        >
          <DialogTitle className="capitalize">Box wise segregation</DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <BoxNoInputs
              value={boxNo}
              onChange={setBoxNo}
              isAddRow={false}
              isBoxnumberDisable={true}
              isStocking={true}
            />
            <div className="flex items-center justify-end mt-6 gap-4">
              <Button
                variant="outline"
                onClick={() =>
                  setIsOpen((prev) => ({ ...prev, inventory: false }))
                }
              >
                Cancel
              </Button>
              <SpinnerButton
                loading={isLoading.mo}
                disabled={isLoading.mo}
                loadingText="Submitting..."
                onClick={handleInventory}
              >
                Submit
              </SpinnerButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingSpecial;
