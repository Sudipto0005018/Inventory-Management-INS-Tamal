import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SupplierFirm = ({ open, onOpenChange }) => {
  const [value, setValue] = useState({
    supplier: "",
    address: "",
    contacts: [""],
    persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
  });

  const handleSubmit = async () => {
    if (!value.supplier.trim()) {
      alert("Supplier name is required");
      return;
    }

    const payload = {
      name: value.supplier,
      address: value.address,
      contacts: value.contacts.filter((c) => c.trim() !== ""),
      details: value.persons,
    };

    try {
      const res = await fetch("http://localhost:7777/api/v1/supplier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add supplier");
        return;
      }

      alert("Supplier added successfully");

      // Reset form
      setValue({
        supplier: "",
        address: "",
        contacts: [""],
        persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error adding supplier:", error);
      alert("Internal server error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Add Supplier</DialogTitle>

        <div className="space-y-3">
          {/* Supplier Name */}
          <Label>Supplier Name</Label>
          <Input
            placeholder="Supplier Name"
            value={value.supplier}
            onChange={(e) => setValue({ ...value, supplier: e.target.value })}
          />

          {/* Address */}
          <Label>Supplier Address</Label>
          <Textarea
            placeholder="Address"
            value={value.address}
            onChange={(e) => setValue({ ...value, address: e.target.value })}
          />

          {/* Contacts */}
          <Label>Office / Firm Contacts</Label>
          {value.contacts.map((c, i) => (
            <Input
              key={i}
              placeholder="Contact Number"
              value={c}
              onChange={(e) => {
                const contacts = [...value.contacts];
                contacts[i] = e.target.value;
                setValue({ ...value, contacts });
              }}
            />
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
            <div key={i} className="grid grid-cols-2 gap-2">
              {/* Prefix */}
              <select
                className="border rounded px-2 py-2"
                value={p.prefix}
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

              {/* Name */}
              <Input
                placeholder="Name"
                value={p.name}
                onChange={(e) => {
                  const persons = [...value.persons];
                  persons[i].name = e.target.value;
                  setValue({ ...value, persons });
                }}
              />

              {/* Designation */}
              <Input
                placeholder="Designation"
                value={p.designation}
                onChange={(e) => {
                  const persons = [...value.persons];
                  persons[i].designation = e.target.value;
                  setValue({ ...value, persons });
                }}
              />

              {/* Phone */}
              <Input
                placeholder="Phone"
                value={p.phone}
                onChange={(e) => {
                  const persons = [...value.persons];
                  persons[i].phone = e.target.value;
                  setValue({ ...value, persons });
                }}
              />
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
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierFirm;
