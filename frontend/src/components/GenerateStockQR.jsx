import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import SpinnerButton from "../components/ui/spinner-button";

import PaginationTable from "./PaginationTable";
import apiService from "../utils/apiService";
import toaster from "../utils/toaster";

const GenerateStockQR = ({ open, setOpen, row, boxesData, updateDetails }) => {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !row) return;

    if (!row.box_no) {
      setBoxes([]);
      return;
    }

    try {
      const parsed =
        typeof row.box_no === "string" ? JSON.parse(row.box_no) : row.box_no;

      setBoxes(
        boxesData.map((b) => ({
          box_no: b.no,
          return_qty: b.deposit || "0",
          copy_count: b.deposit || "0",
        })),
      );
    } catch {
      toaster("error", "Invalid box number data");
    }
  }, [open, row]);
  console.log(row);

  const handleChange = (index, field, value) => {
    setBoxes((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  async function handleGenarateQr() {
    for (const box of boxes) {
      if (!box.return_qty || !box.copy_count) {
        toaster("error", `Fill all fields for Box ${box.box_no}`);
        return;
      }
      // if (parseInt(box.copy_count) <= 0) {
      //   toaster("error", `Invalid copies for Box ${box.box_no}`);
      //   return;
      // }
    }

    try {
      const payload = {
        tool_id: row.tool_id ? row.tool_id : null,
        spare_id: row.spare_id ? row.spare_id : null,
        boxes,
      };

      setLoading(true);
      await apiService.openPdfForPrint("/stock/genarate-qr", payload);
      await updateDetails();
    } catch {
      toaster("error", "QR generation failed");
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "box_no",
        header: "Box No",
        width: "w-[33%]",
      },
      {
        key: "return_qty",
        header: "Return Qty",
        width: "w-[33%]",
      },
      {
        key: "copy_count",
        header: "No of Copies",
        width: "w-[33%]",
      },
    ],
    [],
  );

  const tableData = useMemo(
    () =>
      boxes.map((box, index) => ({
        box_no: (
          <div className="mx-auto w-24 rounded-md bg-slate-100 py-2 text-center font-medium">
            {box.box_no}
          </div>
        ),
        return_qty: (
          <Input
            type="number"
            className="mx-auto w-24 text-center"
            value={box.return_qty}
            // onChange={(e) => handleChange(index, "return_qty", e.target.value)}
          />
        ),
        copy_count: (
          <Input
            type="number"
            className="mx-auto w-24 text-center"
            value={box.copy_count}
            onChange={(e) => {
              handleChange(index, "copy_count", e.target.value);
            }}
          />
        ),
      })),
    [boxes],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Generate QR</DialogTitle>
          <DialogDescription className="hidden" />
        </DialogHeader>

        {/* Read-only item info */}
        <div className="space-y-1 text-sm mb-4">
          <div>
            <span className="font-medium">Item Desc:</span> {row?.description}
          </div>
          <div>
            <span className="font-medium">IN Part No:</span>{" "}
            {row?.indian_pattern}
          </div>
          <div>
            <span className="font-medium">Equipment/System:</span>{" "}
            {row?.equipment_system}
          </div>
        </div>

        {/* PaginationTable used here */}
        <PaginationTable
          data={tableData}
          columns={columns}
          hasSearch={false}
          bodyClassName="max-h-[200px]"
          className="h-auto"
          onClickRow={() => {}}
        />

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <SpinnerButton
            loading={loading}
            disabled={loading}
            loadingText="Generating"
            onClick={handleGenarateQr}
          >
            Submit
          </SpinnerButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateStockQR;
