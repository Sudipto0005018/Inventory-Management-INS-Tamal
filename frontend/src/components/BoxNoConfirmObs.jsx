import { AiOutlineMinusCircle, AiOutlinePlusCircle } from "react-icons/ai";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import ComboBox from "./ComboBox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { useContext, useState, useEffect } from "react";
import SpinnerButton from "./ui/spinner-button";
import { Context } from "../utils/Context";
import apiService from "../utils/apiService";

function BoxNoConfirmObs({
  value,
  onChange,
  isLooseSpare = false,
  isBoxnumberDisable = false,
  isAddRow = true,
  action = "increase",
}) {
  const { storageLocation, fetchStorageLocation } = useContext(Context);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newValue, setNewValue] = useState(null);

  useEffect(() => {
    if (!Array.isArray(value)) return;

    let changed = false;

    const updated = value.map((row) => {
      if (row.baseQn === undefined || row.baseQn === null) {
        changed = true;
        return {
          ...row,
          baseQn: Number(row.qn || 0),
          baseMaintainedQty: Number(row.qnMain || 0),
          incDecQty: row.incDecQty ?? "",
        };
      }
      return row;
    });

    if (changed) {
      onChange(updated);
    }
  }, [value]);

  const handleInputChange = (index, fieldName, fieldValue) => {
    const newRows = [...value];
    newRows[index] = {
      ...newRows[index],
      [fieldName]: fieldValue,
    };
    onChange(newRows);
  };

  const handleIncDecChange = (index, val) => {
    const newRows = [...value];

    // store raw string for input typing
    newRows[index].incDecQty = val;

    const incDec = Number(val || 0);
    const base = Number(newRows[index].baseQn || 0);

    let updatedQn = action === "increase" ? base + incDec : base - incDec;

    if (updatedQn < 0) updatedQn = 0;

    newRows[index].qn = updatedQn;

    onChange(newRows);
  };

  const addRow = () => {
    onChange([
      ...value,
      {
        no: "",
        qn: "",
        baseQn: "",
        incDecQty: "",
        qtyHeld: "",
        location: "",
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    const newRows = value.filter((_, i) => i !== index);
    onChange(newRows);
  };

  const addToDropdown = async (type, value) => {
    try {
      const data = {
        type: [type],
        attr: [value],
      };

      const response = await apiService.post("/config/add", data);

      if (response.success) {
        toaster("success", "Data Added");

        if (type === "location") {
          await fetchStorageLocation();
        }
      }
    } catch (error) {
      console.error(error);
      toaster("error", "Failed to add");
    }
  };

  if (!Array.isArray(value)) {
    console.error("BoxNoInputs 'value' prop must be an array.");
    return null;
  }

  const lastRow = value.length > 0 ? value[value.length - 1] : null;
  const canAddRow = lastRow && lastRow.no && lastRow.qn;

  return (
    <div className="w-full p-2 border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">
              {isLooseSpare ? "Rack No." : "Box No."}
              <span className="text-red-500">*</span>
            </TableHead>

            <TableHead className="text-center">
              Authorised Qty
              <span className="text-red-500">*</span>
            </TableHead>

            <TableHead className="text-center">
              Maintained Qty
              <span className="text-red-500">*</span>
            </TableHead>

            <TableHead className="text-center">
              Qty (Inc / Dec) <span className="text-red-500">*</span>
            </TableHead>

            {/* <TableHead className="text-center">
              Qty Held
              <span className="text-red-500">*</span>
            </TableHead> */}

            <TableHead className="text-center">
              Location of Storage
              <span className="text-red-500">*</span>
            </TableHead>

            <TableHead></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="box-no-table">
          {value.map((row, index) => (
            <TableRow key={index}>
              <TableCell>
                <Input
                  readOnly
                  required
                  disabled={isBoxnumberDisable}
                  placeholder={isLooseSpare ? "Rack No." : "Box No."}
                  value={row.no}
                  onChange={(e) => {
                    let val = e.target.value;

                    if (isLooseSpare) {
                      val = val.replace(/[^a-zA-Z0-9]/g, "");
                      val = val.replace(/^R/i, "");
                      val = "R" + val;
                    } else {
                      val = val.replace(/[^0-9]/g, "");
                    }

                    handleInputChange(index, "no", val);
                  }}
                />
              </TableCell>

              <TableCell>
                <Input required type="number" value={row.qn} disabled />
              </TableCell>

              <TableCell>
                <Input required type="number" value={row.qnMain} disabled />
              </TableCell>

              <TableCell>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="!text-black !opacity-100 !caret-black"
                  value={row.incDecQty !== undefined ? row.incDecQty : ""}
                  onChange={(e) => handleIncDecChange(index, e.target.value)}
                />
              </TableCell>

              {/* Qty Held */}
              {/* <TableCell>
                <Input
                  required
                  type="number"
                  placeholder="Qty Held"
                  value={row.qtyHeld}
                  onChange={(e) =>
                    handleInputChange(index, "qtyHeld", e.target.value)
                  }
                />
              </TableCell> */}

              {/* Location */}
              <TableCell>
                <div className="location-combobox w-full">
                  <ComboBox
                    options={storageLocation}
                    placeholder="Select location"
                    value={row.location}
                    onSelect={(value) => {
                      handleInputChange(index, "location", value.name);
                    }}
                    onCustomAdd={(value) => {
                      setOpen(true);
                      setNewValue(value.name);
                    }}
                    onDelete={async (value) => {
                      try {
                        await apiService.delete(`/config/${value.id}`);
                        await fetchStorageLocation();
                        toaster("success", "Deleted Successfully");
                      } catch {
                        toaster("error", "Failed to delete the item");
                      }
                    }}
                  />
                </div>
              </TableCell>

              {/* Remove Row */}
              {value.length > 1 && isAddRow && (
                <TableCell className="w-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    onClick={() => handleRemoveRow(index)}
                  >
                    <AiOutlineMinusCircle className="size-5" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isAddRow && (
        <Button
          variant="outline"
          className="shadow-md m-2 flex items-center gap-2"
          onClick={addRow}
          disabled={!canAddRow}
        >
          <AiOutlinePlusCircle className="size-5" />
          Add new {isLooseSpare ? "rack" : "box"}
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>
            Do you want to save it for later?
          </DialogDescription>

          <div className="flex gap-3 justify-end items-center">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <SpinnerButton
              disabled={loading}
              loading={loading}
              loadingText="Adding..."
              onClick={async () => {
                setLoading(true);
                await addToDropdown("location", newValue);
                setOpen(false);
                setLoading(false);
              }}
            >
              Add
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BoxNoConfirmObs;
