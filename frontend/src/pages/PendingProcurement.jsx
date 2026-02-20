import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";
import Chip from "../components/Chip";

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
import SupplierFirm from "../components/Supplier";
import AsyncSelectBox from "../components/AsyncSelectBox";

const Procurement = () => {
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
    { key: "demand_quantity", header: "Ordered Qty" },
    { key: "nac_qty", header: "NAC Qty" },
    { key: "nac_no", header: "NAC No." },
    { key: "nac_date", header: "NAC Date" },
    { key: "validity", header: "Validity" },
    { key: "rate_unit", header: "Rate/ Unit" },
    { key: "qty_received", header: "Received Qty" },
    { key: "statusBadge", header: "Status" },

    { key: "processed", header: "Proceed" },
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "indian_pattern", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "equipment_system", label: "Equipment System" },
    { value: "nac_no", label: "NAC No." },
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
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedAddSupplier, setSelectedAddSupplier] = useState(null);
  const [supplierList, setSupplierList] = useState([]);

  const fetchdata = async (page = currentPage) => {
    try {
      setIsLoading((prev) => ({ ...prev, table: true }));

      const response = await apiService.get("/stocks/procurement", {
        params: {
          page,
          limit: config.row_per_page,
          search: inputs.search || "",
          cols: selectedValues.join(","),
          status: "NAC_GENERATED",
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

      const response = await apiService.put("/stocks/procurement", payload);

      if (response.success) {
        toaster("success", "Item received successfully");

        const returnedNow = Number(inputs.quantity_received || 0);
        const alreadyReceived = Number(selectedRow.qty_received || 0);
        const orderedQty = Number(selectedRow.nac_qty || 0);

        const totalReceived = returnedNow + alreadyReceived;

        // 🔥 Remove row instantly if complete
        if (totalReceived >= orderedQty) {
          setFetchedData((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== selectedRow.id),
          }));
        }
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

    if (returnedQty > selectedRow.nac_qty) {
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
    fetchSuppliers();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchdata(1);
  }, [selectedValues]);

  useEffect(() => {
    const t = fetchedData.items
      .filter((row) => row.status !== "complete")
      .map((row) => ({
        ...row,
        survey_quantity: row.survey_quantity || "0",
        demand_date: row.demand_date ? getFormatedDate(row.demand_date) : "-",
        nac_date: row.nac_date ? getFormatedDate(row.nac_date) : "-",
        qty_received:
          row.qty_received && row.qty_received > 0 ? row.qty_received : null,
        statusBadge:
          row.status === "pending" ? (
            <Chip text="Pending" varient="info" />
          ) : row.status === "partial" ? (
            <Chip text="Partial" varient="success" />
          ) : (
            <Chip text="Complete" varient="success" />
          ),
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

  const fetchSuppliers = async () => {
    try {
      const res = await apiService.get(`/supplier/list`);
      console.log(res);

      setSupplierList(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch suppliers", error);
      setSupplierList([]);
    }
  };

  const fetchSupplierOptions = async (query = "") => {
    try {
      const res = await apiService.get(`/supplier/all`);
      const items =
        res.data?.items?.map((item) => ({ id: item.id, name: item.name })) ||
        [];
      if (!query) return items;
      return items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      );
    } catch (error) {
      console.error("Failed to fetch Supplier options", error);
      return [];
    }
  };

  const onDeleteSupplier = async (id) => {
    try {
      const res = await apiService.delete(`/supplier/${id}`);
      if (res.success) {
        toaster("success", "Supplier deleted successfully");
        fetchSuppliers();
        if (selectedSupplier?.id === id) {
          setSelectedSupplier(null);
          setInputs((prev) => ({ ...prev, supplier: "" }));
        }
      } else {
        toaster("error", res.message || "Failed to delete Supplier");
      }
    } catch (error) {
      console.error(error);
      toaster("error", "Failed to delete Supplier");
    }
  };
  const fetchSupplierDetails = async (id) => {
    try {
      const res = await apiService.get(`/supplier/${id}`);
      return res.data;
    } catch (error) {
      console.error("Failed to fetch Supplier details", error);
      return null;
    }
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
            placeholder="Search procurement items"
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
          pageSize={config.row_per_page}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={(page) => {
            setCurrentPage(page);
            fetchdata(page);
          }}
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
          className="w-[55vw] p-6 max-h-[80vh] overflow-y-auto"
          onInteractOutside={(e) => {
            e.preventDefault(); // 🚫 Prevent outside click close
          }}
          onPointerDownOutside={(e) => {
            // e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
            }));
          }}
        >
          <button
            type="button"
            onClick={() => setIsOpen((prev) => ({ ...prev, receive: false }))}
            className="sticky top-0  ml-auto block z-20 rounded-sm bg-background opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            ✕
          </button>
          <DialogTitle className="text-md font-semibold -mt-10 border-b">
            Stock Update Details
          </DialogTitle>
          <div className="flex items-start gap-2 mb-3">
            <span className="font-semibold text-gray-700">
              Item Description :
            </span>

            <span className="text-gray-900 font-medium ml-1">
              {selectedRow?.description || "-"}
            </span>
          </div>

          <>
            <div className="grid grid-cols-3 gap-4"></div>

            <DialogDescription className="hidden" />
            <div className="">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="mb-1 ms-2 gap-1" htmlFor="quantity">
                    Qty Ordered
                  </Label>
                  <Input
                    className="mt-2"
                    id="quantity"
                    type="number"
                    placeholder="Quantity"
                    value={selectedRow?.nac_qty ?? 0}
                    readOnly
                  />
                </div>
                <div>
                  <Label className="mb-1 ms-2">Previously Received Qty</Label>
                  <Input
                    className="mt-2"
                    value={selectedRow?.qty_received ?? 0}
                    readOnly
                  />
                </div>
                <div>
                  <Label className="mb-1 ms-2 gap-1" htmlFor="quantity">
                    Received Qty<span className="text-red-500">*</span>
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
                    label="Received Date *"
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
                value={boxNo}
                onChange={(val) => {
                  setBoxNo(val);
                }}
              />
              <AsyncSelectBox
                label="Vendor/ Third Party Supplier"
                value={
                  selectedRow.supplier
                    ? {
                        id: supplierList.find(
                          (item) => item.name === selectedRow.supplier,
                        )?.id,
                        name: selectedRow.supplier,
                      }
                    : null
                }
                onChange={(val) => {
                  const id = supplierList.find(
                    (item) => item.name === selectedRow.supplier,
                  )?.id;
                  console.log(supplierList);

                  setSelectedRow((prev) => ({
                    ...prev,
                    supplier: val.name,
                  }));
                }}
                fetchOptions={fetchSupplierOptions}
                fetchDetails={fetchSupplierDetails}
                AddNewModal={SupplierFirm}
                onDelete={onDeleteSupplier}
              />
              <div className="mt-4">
                <Label className="ms-2 mb-2 block">Generate QR</Label>

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

export default Procurement;
