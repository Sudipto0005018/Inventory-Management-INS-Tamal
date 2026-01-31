import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";

const OEMFirm = ({ open, onOpenChange, isEditable = true, val }) => {
  const [value, setValue] = useState(
    val && val != null
      ? val
      : {
          vendor: "",
          address: "",
          contacts: [""],
          persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
        },
  );
  const [enabledFields, setEnabledFields] = useState({});

  const handleAdd = async () => {
    if (!value.vendor.trim()) {
      alert("OEM Name is required");
      return;
    }

    const payload = {
      name: value.vendor,
      address: value.address,
      contacts: value.contacts.filter((c) => c.trim() !== ""),
      details: value.persons,
    };

    try {
      const res = await fetch("http://localhost:7777/api/v1/oem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add OEM");
        return;
      }

      alert("OEM added successfully");

      // Reset form
      setValue({
        vendor: "",
        address: "",
        contacts: [""],
        persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error adding OEM:", error);
      alert("Something went wrong");
    }
  };
  const handleEdit = async () => {};

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
        <DialogTitle>Add OEM Firm</DialogTitle>

        <div className="space-y-3">
          {/* OEM Name */}
          <Label>OEM Name</Label>
          <div className="flex items-center">
            <Input
              placeholder="OEM Name"
              value={value.vendor}
              disabled={!isFieldEnabled("vendor")}
              onChange={(e) => setValue({ ...value, vendor: e.target.value })}
            />
            {renderEditIcon("vendor")}
          </div>

          {/* Address */}
          <Label>OEM Address</Label>
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
          {value.contacts.map((c, i) => (
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
            <div key={i} className="mb-4 bg-gray-50 p-3 rounded-md border">
              <div className="grid grid-cols-2 gap-2">
                {/* Prefix */}
                <div className="flex items-center">
                  <select
                    className="border rounded px-2 py-2 flex-1 h-10 w-full"
                    value={p.prefix}
                    disabled={!isFieldEnabled(`person-${i}-prefix`)}
                    onChange={(e) => {
                      const persons = [...value.persons];
                      persons[i].prefix = e.target.value;
                      setValue({ ...value, persons });
                    }}
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                  </select>
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
              if (isEditable) {
                handleAdd();
              } else {
                handleEdit();
              }
            }}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OEMFirm;
