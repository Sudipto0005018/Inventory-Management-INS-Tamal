import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import apiService from "../utils/apiService";
import toaster from "../utils/toaster";

const SupplierFirm = ({
  open,
  onOpenChange,
  isEditable = true,
  val,
  onEdited = () => {},
  fetchData = async () => {},
}) => {
  const [value, setValue] = useState(() => {
    if (val && val != null) {
      return {
        supplier: val.name || "",
        address: val.address || "",
        contacts:
          typeof val.contacts === "string"
            ? JSON.parse(val.contacts)
            : val.contacts || [""],
        persons:
          typeof val.details === "string"
            ? JSON.parse(val.details)
            : val.details || [
                { prefix: "Mr", name: "", designation: "", phone: "" },
              ],
      };
    }
    return {
      supplier: "",
      address: "",
      contacts: [""],
      persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
    };
  });
  const [enabledFields, setEnabledFields] = useState({});

  useEffect(() => {
    if (val && val != null) {
      setValue({
        supplier: val.name || "",
        address: val.address || "",
        contacts:
          typeof val.contacts === "string"
            ? JSON.parse(val.contacts)
            : val.contacts || [""],
        persons:
          typeof val.details === "string"
            ? JSON.parse(val.details)
            : val.details || [
                { prefix: "Mr", name: "", designation: "", phone: "" },
              ],
      });
    } else {
      setValue({
        supplier: "",
        address: "",
        contacts: [""],
        persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
      });
    }
  }, [val]);

  const handleAdd = async () => {
    if (!value.supplier.trim()) {
      toaster("error", "Supplier Name is required");
      return;
    }

    const payload = {
      name: value.supplier,
      address: value.address,
      contacts: value.contacts.filter((c) => c.trim() !== ""),
      details: value.persons,
    };

    try {
      const res = await apiService.post("/supplier", payload);

      if (!res.success) {
        toaster("error", res.message || "Failed to add Supplier");
        return;
      }
      await fetchData();
      toaster("success", "Supplier added successfully");

      // Reset form
      setValue({
        supplier: "",
        address: "",
        contacts: [""],
        persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error adding Supplier:", error);
      toaster("error", "Something went wrong");
    }
  };

  const handleEdit = async () => {
    if (!value.supplier.trim()) {
      toaster("error", "Supplier Name is required");
      return;
    }

    const payload = {
      name: value.supplier,
      address: value.address,
      contacts: value.contacts.filter((c) => c.trim() !== ""),
      details: value.persons,
    };

    try {
      // Check if we have an ID to update
      if (!val || !val.id) {
        toaster("error", "Cannot update: Missing ID");
        return;
      }

      const res = await apiService.put(`/supplier/${val.id}`, payload);

      if (!res.success) {
        toaster("error", res.message || "Failed to update Supplier");
        return;
      }
      onEdited(val.id);
      toaster("success", "Supplier updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating Supplier:", error);
      toaster("error", "Something went wrong");
    }
  };

  const isFieldEnabled = (key) => isEditable || enabledFields[key];

  const enableField = (key) => {
    setEnabledFields((prev) => ({ ...prev, [key]: true }));
  };

  const renderEditIcon = (key) => {
    if (isEditable) return null;
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 ml-2"
        onClick={() => enableField(key)}
        disabled={enabledFields[key]}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>{val ? "Edit" : "Add"} Supplier Firm</DialogTitle>

        <div className="space-y-3">
          {/* Supplier Name */}
          <Label>Supplier Name</Label>
          <div className="flex items-center">
            <Input
              placeholder="Supplier Name"
              value={value.supplier}
              disabled={!isFieldEnabled("supplier")}
              onChange={(e) => setValue({ ...value, supplier: e.target.value })}
            />
            {renderEditIcon("supplier")}
          </div>

          {/* Address */}
          <Label>Supplier Address</Label>
          <div className="flex items-center">
            <Textarea
              placeholder="Address"
              value={value.address}
              disabled={!isFieldEnabled("address")}
              onChange={(e) => setValue({ ...value, address: e.target.value })}
            />
            {renderEditIcon("address")}
          </div>

          {/* Contacts */}
          <Label>Office / Firm Contacts</Label>
          {value.contacts &&
            value.contacts.map((c, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <Input
                  placeholder="Contact Number"
                  value={c}
                  disabled={!isFieldEnabled(`contact-${i}`)}
                  onChange={(e) => {
                    const contacts = [...value.contacts];
                    contacts[i] = e.target.value;
                    setValue({ ...value, contacts });
                  }}
                />
                {renderEditIcon(`contact-${i}`)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                  onClick={() => {
                    const contacts = value.contacts.filter(
                      (_, idx) => idx !== i,
                    );
                    setValue({ ...value, contacts });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

          <Button
            variant="outline"
            type="button"
            onClick={() =>
              setValue((prev) => ({
                ...prev,
                contacts: [...prev.contacts, ""],
              }))
            }
          >
            + Add Contact
          </Button>

          {/* Contact Persons */}
          <Label>Individual Details</Label>
          {value.persons.map((p, i) => (
            <div
              key={i}
              className="mb-4 bg-gray-50 p-3 rounded-md border relative"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  const persons = value.persons.filter((_, idx) => idx !== i);
                  setValue({ ...value, persons });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-2 gap-2 pr-8">
                {/* Prefix */}
                <div className="flex items-center">
                  <Select
                    value={p.prefix}
                    disabled={!isFieldEnabled(`person-${i}-prefix`)}
                    onValueChange={(newValue) => {
                      const persons = [...value.persons];
                      persons[i].prefix = newValue;
                      setValue({ ...value, persons });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Prefix" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                    </SelectContent>
                  </Select>
                  {renderEditIcon(`person-${i}-prefix`)}
                </div>

                {/* Name */}
                <div className="flex items-center">
                  <Input
                    placeholder="Name"
                    value={p.name}
                    disabled={!isFieldEnabled(`person-${i}-name`)}
                    onChange={(e) => {
                      const persons = [...value.persons];
                      persons[i].name = e.target.value;
                      setValue({ ...value, persons });
                    }}
                  />
                  {renderEditIcon(`person-${i}-name`)}
                </div>

                {/* Designation */}
                <div className="flex items-center">
                  <Input
                    placeholder="Designation"
                    value={p.designation}
                    disabled={!isFieldEnabled(`person-${i}-designation`)}
                    onChange={(e) => {
                      const persons = [...value.persons];
                      persons[i].designation = e.target.value;
                      setValue({ ...value, persons });
                    }}
                  />
                  {renderEditIcon(`person-${i}-designation`)}
                </div>

                {/* Phone */}
                <div className="flex items-center">
                  <Input
                    placeholder="Phone"
                    value={p.phone}
                    disabled={!isFieldEnabled(`person-${i}-phone`)}
                    onChange={(e) => {
                      const persons = [...value.persons];
                      persons[i].phone = e.target.value;
                      setValue({ ...value, persons });
                    }}
                  />
                  {renderEditIcon(`person-${i}-phone`)}
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            type="button"
            onClick={() =>
              setValue((prev) => ({
                ...prev,
                persons: [
                  ...prev.persons,
                  {
                    prefix: "Mr",
                    name: "",
                    designation: "",
                    phone: "",
                  },
                ],
              }))
            }
          >
            + Add Person
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (isEditable && val && val.id) {
                handleEdit();
              } else {
                handleAdd();
              }
            }}
          >
            {isEditable && val && val.id ? "Update" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierFirm;
