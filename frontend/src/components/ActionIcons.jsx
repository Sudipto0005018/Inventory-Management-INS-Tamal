import { FaRegEye } from "react-icons/fa";
import { PiHandWithdrawLight } from "react-icons/pi";
import { IoQrCodeSharp } from "react-icons/io5";
import { Button } from "../components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useEffect } from "react";
import { Input } from "./ui/input";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import SpinnerButton from "./ui/spinner-button";

const ActionIcons = ({ row, onEdit, onWithdraw, onShowQR, disabled = {} }) => {
  const [open, setOpen] = useState(false);
  const [boxes, setBoxes] = useState([]);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const box = JSON.parse(row.box_no).map((b) => b.no);
    setBoxes(box);
  }, [row]);

  async function handleGenarateQr() {
    if (!inputs.box_no || !inputs.copy_count) {
      toaster("error", "Please fill all the required fields");
      return;
    }
    if (parseInt(inputs.copy_count) <= 0) {
      toaster("error", "Invalid no of copies");
      return;
    }
    try {
      const payload = {
        tool_id: row.source == "spare" ? null : row.id,
        spare_id: row.source == "spare" ? row.id : null,
        box_no: inputs.box_no,
        copy_count: inputs.copy_count,
      };
      setLoading(true);

      await apiService.downloadFile("/spares/genarate-qr", payload);
    } catch (error) {
      console.log(error);
      toaster("error", "QR generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* View */}
      <Button
        variant="ghost"
        size="icon"
        title="Edit"
        disabled={disabled.edit}
        className="text-blue-600"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(row);
        }}
      >
        <FaRegEye className="size-5" />
      </Button>

      {/* Withdraw */}
      <Button
        variant="ghost"
        size="icon"
        title="Withdraw"
        disabled={disabled.withdraw}
        className="text-red-600 hover:text-red-700 hover:bg-red-100"
        onClick={(e) => {
          e.stopPropagation();
          onWithdraw?.(row);
        }}
      >
        <PiHandWithdrawLight className="size-5" />
      </Button>

      {/* 📦 QR Code */}
      <Button
        variant="ghost"
        size="icon"
        title="View QR Code"
        disabled={disabled.qr}
        className="text-black-600 hover:text-black-700 hover:bg-gray-200"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
          onShowQR?.(row);
        }}
      >
        <IoQrCodeSharp className="size-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Genarate QR</DialogTitle>
            <DialogDescription className="hidden" />
          </DialogHeader>
          <div>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Item Description</TableCell>
                  <TableCell>{row.description}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <i>IN</i> part No.
                  </TableCell>
                  <TableCell>{row.indian_pattern}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Equipment/System</TableCell>
                  <TableCell>{row.equipment_system}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    Box No. <span className="text-red-500">*</span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={inputs.box_no}
                      onValueChange={(value) =>
                        setInputs((prev) => ({ ...prev, box_no: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select box no" />
                      </SelectTrigger>
                      <SelectContent>
                        {boxes?.map((box) => (
                          <SelectItem key={box} value={box}>
                            {box}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    No of copies <span className="text-red-500">*</span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={inputs.copy_count}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          copy_count: e.target.value,
                        }))
                      }
                      placeholder="No of copy"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SpinnerButton
              disabled={loading}
              loading={loading}
              loadingText="Generating"
              onClick={handleGenarateQr}
            >
              Submit
            </SpinnerButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionIcons;
