import React, { useEffect, useState } from "react";
import { HiOutlineRefresh } from "react-icons/hi";
import { MdEdit } from "react-icons/md";
import { GiPlainCircle } from "react-icons/gi";
import apiService from "../utils/apiService";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const UsbConnection = () => {
  const [devices, setDevices] = useState([]);
  const [dbDevices, setDbDevices] = useState([]);
  const [selectedUSB, setSelectedUSB] = useState("");

  const [isLoading, setIsLoading] = useState({
    fetch: false,
    sync: false,
    update: false,
  });

  const [isOpen, setIsOpen] = useState({
    editUSB: false,
    syncSuccess: false,
    syncFailed: false,
  });

  const [editValues, setEditValues] = useState({
    uid: "",
    name: "",
    status: true,
  });

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getUSBDevices();
    getDbUsbDevices();
  }, []);

  const getUSBDevices = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, fetch: true }));

      const response = await apiService.get("/sync/devices");

      console.log("USB API response:", response);

      setDevices(response?.data || []);
    } catch (error) {
      console.error("Error fetching USB devices:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const getDbUsbDevices = async () => {
    try {
      const response = await apiService.get("/sync/db-devices");

      setDbDevices(response?.data || []);
    } catch (error) {
      console.error("Error fetching DB devices:", error);
    }
  };

  const handleUSBSync = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, sync: true }));

      await apiService.get(`/sync/sync/${selectedUSB}`);

      setIsOpen((prev) => ({
        ...prev,
        syncSuccess: true,
      }));

      getDbUsbDevices();
      getUSBDevices();
    } catch (error) {
      console.error("Sync failed:", error);

      setErrorMessage(error?.response?.data?.message || "Something went wrong");

      setIsOpen((prev) => ({
        ...prev,
        syncFailed: true,
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, sync: false }));
    }
  };

  const handleEditUSB = (device) => {
    setEditValues({
      uid: device.uid,
      name: device.name || "",
      status: Boolean(device.status),
    });

    setIsOpen((prev) => ({
      ...prev,
      editUSB: true,
    }));
  };

  const handleSaveUSB = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, update: true }));

      await apiService.post("/sync/update", editValues);

      setIsOpen((prev) => ({
        ...prev,
        editUSB: false,
      }));

      getDbUsbDevices();
      getUSBDevices();
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

const getISTTimestamp = (timestamp) => {
  if (!timestamp) return "--";

  const date = new Date(
    new Date(timestamp).toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    }),
  );

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = String(date.getFullYear()).slice(-2);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

  return (
    // <div className="w-[300px] md:w-[320px] h-[calc(90vh-120px)] flex flex-col border bg-white rounded-lg shadow-sm p-3">
    <div className="w-full h-full flex flex-col bg-white">
      {/* <p className="text-gray-800 text-sm font-semibold text-center">
        USB Connection
      </p> */}

      <div className=" w-full flex flex-col items-center">
        <p className="mb-4 text-[11px] font-semibold text-gray-600">
          Select Handheld
        </p>

        <div className="w-full flex items-center gap-4">
          <Select value={selectedUSB} onValueChange={setSelectedUSB}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select Handheld" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {devices.length > 0 ? (
                  devices.map((device) => (
                    <SelectItem key={device.uid} value={device.uid}>
                      {device.name || device.uid}
                    </SelectItem>
                  ))
                ) : (
                  <SelectLabel className="text-center text-md font-normal py-8">
                    No device found
                  </SelectLabel>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>

          <HiOutlineRefresh
            className="size-6 cursor-pointer"
            onClick={getUSBDevices}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <Button
          className="w-24 h-8 text-xs"
          onClick={handleUSBSync}
          disabled={isLoading.sync || !selectedUSB}
        >
          {isLoading.sync ? "Syncing..." : "Sync"}
        </Button>
      </div>

      <div className="mt-3 w-full flex-1 overflow-y-auto overflow-x-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold">Name</TableHead>
              <TableHead className="text-xs font-semibold">
                Last Synced
              </TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Edit</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {dbDevices.map((device) => (
              <TableRow className="text-xs" key={device.uid}>
                <TableCell>{device.name || device.uid}</TableCell>

                <TableCell>
                  <p className="text-wrap">
                    {device.last_sync
                      ? getISTTimestamp(device.last_sync)
                      : "--"}
                  </p>
                </TableCell>

                <TableCell>
                  <div className="flex justify-center items-center">
                    {device.status ? (
                      <GiPlainCircle className="text-green-500" />
                    ) : (
                      <GiPlainCircle className="text-red-500" />
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-primary hover:text-primary h-8 w-8"
                    onClick={() => handleEditUSB(device)}
                  >
                    <MdEdit size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={isOpen.editUSB}
        onOpenChange={(open) =>
          setIsOpen((prev) => ({
            ...prev,
            editUSB: open,
          }))
        }
      >
        <DialogContent>
          <DialogTitle>Edit USB Device</DialogTitle>
          <DialogDescription />

          <div className="space-y-4 mt-4">
            <Input
              value={editValues.name}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Device Name"
            />

            <Select
              value={editValues.status ? "true" : "false"}
              onValueChange={(value) =>
                setEditValues((prev) => ({
                  ...prev,
                  status: value === "true",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setIsOpen((prev) => ({
                    ...prev,
                    editUSB: false,
                  }))
                }
              >
                Cancel
              </Button>

              <Button onClick={handleSaveUSB} disabled={isLoading.update}>
                {isLoading.update ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={isOpen.syncSuccess}
        onOpenChange={(open) =>
          setIsOpen((prev) => ({
            ...prev,
            syncSuccess: open,
          }))
        }
      >
        <DialogContent className="bg-green-100">
          <DialogTitle>Success</DialogTitle>
          <p className="text-green-700 font-semibold">
            Handheld synced successfully
          </p>

          <div className="flex justify-end">
            <Button
              onClick={() =>
                setIsOpen((prev) => ({
                  ...prev,
                  syncSuccess: false,
                }))
              }
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Failed Dialog */}
      <Dialog
        open={isOpen.syncFailed}
        onOpenChange={(open) =>
          setIsOpen((prev) => ({
            ...prev,
            syncFailed: open,
          }))
        }
      >
        <DialogContent className="bg-red-100">
          <DialogTitle>Failed</DialogTitle>

          <p className="text-red-700 font-semibold">Handheld sync failed</p>

          <p className="text-sm text-red-600 mt-2">{errorMessage}</p>

          <div className="flex justify-end">
            <Button
              onClick={() =>
                setIsOpen((prev) => ({
                  ...prev,
                  syncFailed: false,
                }))
              }
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsbConnection;
