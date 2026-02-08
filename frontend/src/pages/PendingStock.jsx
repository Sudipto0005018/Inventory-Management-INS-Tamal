import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
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
import GenerateStockQR from "../components/GenerateStockQR";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";

import BoxNoDeposit from "../components/BoxNoDeposit";
import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import {
  getFormatedDate,
  formatSimpleDate,
  getDate,
} from "../utils/helperFunctions";
import BoxNoInputs from "../components/BoxNoInputsTwo";
import { MultiSelect } from "../components/ui/multi-select";

const PermanentPendings = () => {
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
    { key: "demand_no", header: "Demand No." },
    { key: "demand_date", header: "Demand Date" },
    { key: "demand_quantity", header: "Stocked In Qty" },
    { key: "mo_no", header: "MO Gate Pass No." },
    { key: "mo_date", header: "MO Date" },
    { key: "processed", header: "Proceed" },
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "vue", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "quantity", label: "Issued Quantity" },
    { value: "survey_quantity", label: "Surveyed Quantity" },
    { value: "status", label: "Status" },
  ];

  const [generateQR, setGenerateQR] = useState("no");
  const [openQRDialog, setOpenQRDialog] = useState(false);

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
    nac: false,
    mo: false,
    inventory: false,
    issue: false,
  });
  const [isOpen, setIsOpen] = useState({
    demand: false,
    issue: false,
    demand_calender: false,
    nac_calender: false,
    gate_pass_calender: false,
    inventory: false,
    receive: false,
  });
  const [selectedRow, setSelectedRow] = useState({});
  const [inputs, setInputs] = useState({
    demand_no: "",
    demand_calender: new Date(),
    issue_type: "nac",
    nac_no: "",
    nac_calender: new Date(),
    validity: "",
    rate: "",
    mo_no: "",
    gate_pass_calender: new Date(),
    search: "",
    receive_date: new Date(),
  });
  const [boxNo, setBoxNo] = useState([{ qn: "", no: "" }]);

  const fetchdata = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, table: true }));

      const response = await apiService.get("/demand/pending-issue", {
        params: {
          page: currentPage,
          limit: config.row_per_page,
          search: inputs.search || "",
          cols: selectedValues.join(","),
          status: "STOCKED",
        },
      });
      console.log(response);

      if (response.success) {
        setFetchedData(response.data);
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      console.error(error);
      toaster("error", error.message || "Failed to fetch pending issues");
    } finally {
      setIsLoading((prev) => ({ ...prev, table: false }));
    }
  };

  const getDepositQty = () => {
    if (!Array.isArray(boxNo)) return 0;

    return boxNo.reduce((sum, row) => {
      const depositQty = Number(row?.deposit || 0);
      return sum + depositQty;
    }, 0);
  };

  const handleSearch = () => {
    setCurrentPage(1); // reset pagination
    fetchdata();
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

  async function updateDetails() {
    setIsLoading((prev) => ({ ...prev, receive: true }));

    try {
      const payload = {
        id: selectedRow.id,
        qty_received: Number(inputs.quantity_received),
        return_date: formatSimpleDate(inputs.receive_date),
        box_no: boxNo.map((b) => ({
          no: b.no,
          deposit: Number(b.deposit || 0),
        })),
        approve: true,
      };

      const response = await apiService.put("/stock/stock-update", payload);

      if (response.success) {
        toaster("success", "Item received successfully");

        setIsOpen((prev) => ({ ...prev, receive: false }));
        setInputs({
          quantity_received: "",
          receive_date: new Date(),
        });
        setBoxNo([]);
        setOpenQRDialog(false);
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster(
        "error",
        error.response?.data?.message || error.message || "Operation failed",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, receive: false }));
    }
  }

  const handleReceive = async () => {
    console.log("hj");
    const returnedQty = Number(inputs.quantity_received);
    const depositQty = Number(getDepositQty());

    // 🔴 No field should be less than zero
    const fieldsToValidate = [
      { value: returnedQty, label: "Returned quantity" },
      { value: depositQty, label: "Deposit quantity" },
    ];

    for (const field of fieldsToValidate) {
      if (field.value < 0) {
        toaster("error", `${field.label} cannot be less than zero`);
        return;
      }
    }

    if (!returnedQty) {
      toaster("error", "Quantity is required");
      return;
    }

    if (returnedQty > selectedRow.quantity) {
      toaster("error", "Quantity cannot be greater than issued quantity");
      return;
    }

    if (!inputs.receive_date) {
      toaster("error", "Receive date is required");
      return;
    }

    // ❌ No single deposit qty can be less than 0
    const hasNegativeDepositRow = boxNo.some((row) => Number(row.deposit) < 0);

    if (hasNegativeDepositRow) {
      toaster("error", "Deposit quantity in any box cannot be less than zero");
      return;
    }

    if (depositQty !== returnedQty) {
      toaster("error", "Deposit quantity must be equal to returned quantity");
      return;
    }

    if (generateQR != "no") {
      setOpenQRDialog(true);
      return;
    }
    await updateDetails();
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
      const response = await apiService.post("/pending/inventory", {
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

  useEffect(() => {
    fetchdata();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchdata();
  }, [selectedValues]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      survey_quantity: row.survey_quantity || "0",
      demand_date: row.demand_date ? getFormatedDate(row.demand_date) : "-",

      mo_date: row.mo_date ? getFormatedDate(row.mo_date) : "-",
      processed: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border hover:bg-gray-100"
          onClick={() => {
            setSelectedRow(row);
            console.log(row);

            const parsedBoxNo = row.box_no ? JSON.parse(row.box_no) : [];

            setBoxNo(normalizeBoxNoForDeposit(parsedBoxNo));

            setIsOpen((prev) => ({ ...prev, receive: true }));
          }}
        >
          <FaChevronRight />
        </Button>
      ),
    }));
    setTableData(t);
  }, [fetchedData]);

  const normalizeBoxNoForDeposit = (boxNo = []) => {
    return boxNo.map((item) => ({
      no: item.no || item.box_no || "",
      qn: Number(item.authorised_qty ?? item.qn ?? item.qty ?? 0),
      qtyHeld: Number(item.qty_held ?? item.qtyHeld ?? 0),
      deposit: Number(
        item.deposit ??
          item.deposit_qty ??
          Math.max(
            Number(item.authorised_qty ?? item.qty ?? 0) -
              Number(item.qty_held ?? 0),
            0,
          ),
      ),
    }));
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
            placeholder="Search survey items"
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

      <Dialog
        open={isOpen.receive}
        onOpenChange={(set) =>
          setIsOpen((prev) => {
            return { ...prev, receive: set };
          })
        }
      >
        <DialogContent
          unbounded
          className="w-[55vw] p-6"
          onPointerDownOutside={(e) => {
            // e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
            }));
          }}
        >
          <DialogTitle className="capitalize">Stock Update Details</DialogTitle>
          <>
            <div className="grid grid-cols-3 gap-4"></div>

            <DialogDescription className="hidden" />
            <div className="">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="mb-1 ms-2 gap-1" htmlFor="quantity">
                    Stocked In Qty<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-2"
                    id="quantity"
                    type="number"
                    placeholder="Quantity"
                    value={selectedRow?.demand_quantity ?? 0}
                    readOnly
                  />
                </div>
                <div>
                  <Label className="mb-1 ms-2 gap-1" htmlFor="quantity">
                    Deposit Qty<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-2"
                    id="quantity"
                    visibleColums={[]}
                    type="number"
                    placeholder="Quantity"
                    value={inputs.quantity_received}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInputs((prev) => ({
                        ...prev,
                        quantity_received: value,
                      }));

                      updateTablePreview({
                        qty_received: value,
                        received_quantity: value,
                      });
                    }}
                  />
                </div>
                <div className="">
                  <FormattedDatePicker
                    label="Deposit Date *"
                    className="w-full"
                    value={inputs.receive_date}
                    onChange={(date) => {
                      setInputs((prev) => ({
                        ...prev,
                        receive_date: date,
                      }));

                      updateTablePreview({
                        returned_date: date,
                        returned_date_formatted: getDate(date),
                      });
                    }}
                  />
                </div>
              </div>
              <Label className="ms-2 mb-1 mt-6" htmlFor="box_no">
                Box Wise Segregation
              </Label>
              <BoxNoDeposit
                className="mt-4"
                value={boxNo}
                onChange={(val) => {
                  setBoxNo(val);
                }}
              />
              <div className="mt-4">
                <Label className="ms-2 mb-2 block">
                  Generate QR <span className="text-red-500">*</span>
                </Label>

                <div className="flex gap-6 ms-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="generate_qr"
                      value="no"
                      checked={generateQR === "no"}
                      onChange={() => {
                        setGenerateQR("no");
                      }}
                    />
                    No
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="generate_qr"
                      value="yes"
                      checked={generateQR === "yes"}
                      onChange={() => {
                        setGenerateQR("yes");
                      }}
                    />
                    Yes
                  </label>
                </div>
              </div>
              <GenerateStockQR
                open={openQRDialog}
                setOpen={setOpenQRDialog}
                row={selectedRow}
                boxesData={boxNo}
                updateDetails={updateDetails}
              />
            </div>
          </>

          <div className="flex items-center mt-4 gap-4 justify-end">
            <Button onClick={closeDialog} variant="outline">
              Cancel
            </Button>
            <SpinnerButton
              loading={isLoading.receive}
              disabled={isLoading.receive}
              loadingText="Receiving..."
              onClick={handleReceive}
              className="text-white hover:bg-primary/85 cursor-pointer"
            >
              Submit
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PermanentPendings;
