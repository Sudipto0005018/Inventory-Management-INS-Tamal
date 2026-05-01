import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
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
import { formatDate, getFormatedDate } from "../utils/helperFunctions";
import { MultiSelect } from "../components/ui/multi-select";
import AddPTSDemand from "../components/AddPTSDemand";

const PendingPTS = () => {
  const { config, user } = useContext(Context);

  const columns = useMemo(() => [
    { key: "description", header: "Item Description" },
    {
      key: "indian_pattern",
      header: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "max-w-[180px]",
    },
    { key: "category", header: "Category", width: "max-w-[50px]" },
    { key: "denos", header: "Denos.", width: "max-w-[50px]" },
    {
      key: "quantity",
      header: <span>Qty Demanded</span>,
      width: "max-w-[50px]",
    },
    {
      key: "demandno",
      header: (
        <span>
          Internal <br /> Demand No.
        </span>
      ),
    },
    {
      key: "demanddate",
      header: (
        <span>
          Internal <br /> Demand Date
        </span>
      ),
      width: "max-w-[64px]",
    },
    {
      key: "requisition",
      header: (
        <span>
          Requisition <br /> No.
        </span>
      ),
    },
    {
      key: "Reqdate",
      header: (
        <span>
          Requisition <br /> Date
        </span>
      ),
      width: "max-w-[64px]",
    },
    {
      key: "modemand",
      header: (
        <span>
          MO <br /> Demand No.
        </span>
      ),
      width: "max-w-[60px]",
    },
    {
      key: "modate",
      header: (
        <span>
          MO <br /> Demand Date
        </span>
      ),
      width: "max-w-[60px]",
    },
    { key: "status", header: "Status", width: "max-w-[100px]" },
    ...(user.role !== "user"
      ? [{ key: "processed", header: "Proceed", width: "min-w-[40px]" }]
      : []),
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "indian_pattern", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "denos", label: "Denos." },
    { value: "internal_demand_no", label: "Internal Demand No." },
    { value: "internal_demand_date", label: "Internal Demand Date" },
    { value: "requisition_no", label: "Requisition No." },
    { value: "requisition_date", label: "Requisition Date." },
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
    update: false,
    inventory: false,
  });
  const [isOpen, setIsOpen] = useState({
    amend: false,
    inventory: false,
    addPTS: false,
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

  const fetchData = async (page = currentPage) => {
    setIsLoading((prev) => ({ ...prev, table: true }));
    try {
      const response = await apiService.get("/pts/pts-demand", {
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
    fetchData(1);
  };

  const handleRefresh = () => {
    setInputs((prev) => ({ ...prev, search: "" }));
    setSelectedValues([]);
    setCurrentPage(1);
    fetchData(1);
  };

  const handleUpdatePTS = async () => {
    const payload = {
      id: selectedRow.id,
    };

    if (inputs.internal_demand_no) {
      payload.internal_demand_no = inputs.internal_demand_no;
      payload.internal_demand_date = inputs.internal_demand_date;
    }
    if (inputs.requisition_no) {
      payload.requisition_no = inputs.requisition_no;
      payload.requisition_date = inputs.requisition_date;
    }
    if (inputs.mo_demand_no) {
      payload.mo_demand_no = inputs.mo_demand_no;
      payload.mo_demand_date = inputs.mo_demand_date;
    }

    try {
      setIsLoading((prev) => ({ ...prev, update: true }));
      const response = await apiService.put("/pts/pts-demand", payload);
      if (response.success) {
        toaster("success", response.message);
        setIsOpen((prev) => ({ ...prev, amend: false }));
        fetchData();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster("error", error.response?.data?.message || "Update failed");
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const handleInventory = async () => {
    setIsLoading((prev) => ({ ...prev, inventory: true }));
    try {
      const response = await apiService.post("/pts/pts-inventory", {
        id: selectedRow.id,
        box_no: selectedRow.box_no,
        source: selectedRow.source,
        uid: selectedRow.uid,
      });
      if (response.success) {
        toaster("success", "PTS item added to inventory successfully");
        setIsOpen((prev) => ({ ...prev, inventory: false }));
        fetchData();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to add to inventory";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, inventory: false }));
    }
  };

  const showRequisition =
    inputs.internal_demand_no && inputs.internal_demand_date;
  const showMoDemand = inputs.requisition_no && inputs.requisition_date;

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [selectedValues]);

  const getPTSStatus = (row) => {
    if (!row.internal_demand_no) return "Awaiting Internal Demand No";
    if (row.internal_demand_no && !row.requisition_no)
      return "Awaiting Requisition No";
    if (row.requisition_no && !row.mo_demand_no) return "Awaiting MO Demand No";
    return "MO Demand Added - Ready for Issue";
  };

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      quantity: row.quantity || "--",
      created_at: getFormatedDate(row.created_at),
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
      status: getPTSStatus(row),
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
            setIsOpen((prev) => ({ ...prev, amend: true }));
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
            placeholder="Search PTS.."
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

          <Button
            className="cursor-pointer hover:bg-primary/85 flex items-center gap-1 text-white"
            onClick={() => setIsOpen((prev) => ({ ...prev, addPTS: true }))}
          >
            <FaPlus className="size-3.5" />
            Add PTS Demand
          </Button>

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
            className="cursor-pointer flex items-center gap-1 bg-white hover:bg-gray-200 hover:scale-105 transition-all duration-200"
            onClick={handleRefresh}
            title="Reset Search"
          >
            <IoMdRefresh
              className="size-7 font-bold hover:rotate-180 transition-transform duration-300"
              style={{
                color: "#109240",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            />
          </Button>
        </div>

        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={fetchedData.currentPage || 1}
          pageSize={fetchedData.items?.length || 10}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          className="w-[calc(100vw-35px)] h-[calc(100vh-230px)]"
        />
      </div>

      {/* Amend PTS Demand Dialog */}
      <Dialog
        open={isOpen.amend}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, amend: set }))}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
        >
          <div className="sticky top-0 z-10 bg-background grid grid-cols-2 items-center pb-2 border-b">
            <DialogTitle className="text-lg font-semibold">
              Amend PTS Demand
            </DialogTitle>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => ({ ...prev, amend: false }))}
              className="justify-self-end rounded-md p-1 transition"
            >
              ✕
            </button>
          </div>

          <div className="flex items-start gap-2 mb-3">
            <span className="font-semibold text-gray-700">
              Item Description:
            </span>
            <span className="text-gray-900 font-semibold ml-1">
              {selectedRow?.description || "-"}
            </span>
          </div>

          <DialogDescription className="hidden" />

          <div>
            <div className="flex gap-4 w-full">
              <div className="w-full">
                <Label htmlFor="internal_demand_no" className="ms-2 mb-2 mt-4">
                  Internal Demand No.
                </Label>
                <Input
                  type="text"
                  id="internal_demand_no"
                  value={inputs.internal_demand_no}
                  placeholder="Internal Demand No."
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      internal_demand_no: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
              <div className="w-full mt-3">
                <FormattedDatePicker
                  label="Internal Demand Date"
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

            {showRequisition && (
              <div className="flex gap-4 w-full">
                <div className="w-full">
                  <Label htmlFor="requisition_no" className="ms-2 mb-2 mt-5">
                    Requisition No.
                  </Label>
                  <Input
                    type="text"
                    id="requisition_no"
                    value={inputs.requisition_no}
                    placeholder="Requisition No."
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        requisition_no: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-4">
                  <FormattedDatePicker
                    label="Requisition Date"
                    value={inputs.requisition_date}
                    onChange={(date) =>
                      setInputs((prev) => ({ ...prev, requisition_date: date }))
                    }
                  />
                </div>
              </div>
            )}

            {showMoDemand && (
              <div className="flex gap-4 w-full">
                <div className="w-full">
                  <Label htmlFor="mo_demand_no" className="ms-2 mb-2 mt-7">
                    MO Demand No.
                  </Label>
                  <Input
                    type="text"
                    id="mo_demand_no"
                    value={inputs.mo_demand_no}
                    placeholder="MO Demand No."
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        mo_demand_no: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-6">
                  <FormattedDatePicker
                    label="MO Demand Date"
                    value={inputs.mo_demand_date}
                    onChange={(date) =>
                      setInputs((prev) => ({ ...prev, mo_demand_date: date }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end mt-6 gap-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen((prev) => ({ ...prev, amend: false }))}
              >
                Cancel
              </Button>
              <SpinnerButton
                loading={isLoading.update}
                disabled={isLoading.update}
                loadingText="Submitting..."
                onClick={handleUpdatePTS}
              >
                Submit
              </SpinnerButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add PTS Demand Dialog */}
      <AddPTSDemand
        open={isOpen.addPTS}
        onOpenChange={(open) =>
          setIsOpen((prev) => ({ ...prev, addPTS: open }))
        }
        onSuccess={() => {
          fetchData();
          setIsOpen((prev) => ({ ...prev, addPTS: false }));
        }}
      />
    </>
  );
};

export default PendingPTS;
