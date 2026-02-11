import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Plus } from "lucide-react";

export default function ServicePersonnel({
  options = [],
  value,
  onChange,
  onAdd,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    name: "",
    rank: "",
    phone_no: "",
  });

  // Sync searchTerm with the selected value's service number
  useEffect(() => {
    if (value) {
      setSearchTerm(value.serviceNumber || "");
    } else if (value === null) {
    }
  }, [value]);

  const handleSearchChange = (e) => {
    const text = e.target.value;
    setSearchTerm(text);

    const match = options.find(
      (opt) => opt.serviceNumber && opt.serviceNumber.toString() === text,
    );

    if (match) {
      onChange(match);
    } else {
      // No match found
      if (value) {
        onChange(null); // Deselect if we had a value before
      }
    }
  };

  const handleAddNew = () => {
    if (onAdd) {
      onAdd({
        serviceNumber: searchTerm,
        ...newEntry,
      });
    }
    setIsDialogOpen(false);
    // Reset new entry form
    setNewEntry({ name: "", rank: "", phone_no: "" });
  };

  const showAddButton = searchTerm && !value;

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Row 1 */}
        <div className="space-y-2">
          <Label className="ms-1">
            Service No. <span className="text-red-500">*</span>{" "}
          </Label>
          <Input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Enter Service No"
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="ms-1">Name</Label>
          <Input
            value={value?.name || ""}
            readOnly
            placeholder="Name"
            className="bg-muted"
          />
        </div>
      </div>

      {/* Row 3 - Add Button */}
      {showAddButton && (
        <div className="flex justify-start">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus size={16} /> Add New
              </Button>
            </DialogTrigger>
            <DialogContent
              className="sm:max-w-[425px]"
              onCloseAutoFocus={() => {
                setNewEntry({ name: "", rank: "", phone_no: "" });
              }}
            >
              <DialogHeader>
                <DialogTitle>Add Personnel Details</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="serviceNo" className="text-right">
                    Service No
                  </Label>
                  <Input
                    id="serviceNo"
                    value={searchTerm}
                    placeholder="Service No"
                    className="col-span-3 bg-muted"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newEntry.name}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, name: e.target.value })
                    }
                    placeholder="Name"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddNew}>Save Details</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
