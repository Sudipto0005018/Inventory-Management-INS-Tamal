import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

function BoxNoMaintainedQty({
  value,
  onChange,
  isLooseSpare = false,
  isBoxnumberDisable = false,
  isAddRow = true,
}) {
  const handleInputChange = (index, fieldName, fieldValue) => {
    const newRows = [...value];
    newRows[index] = {
      ...newRows[index],
      [fieldName]: fieldValue,
    };
    onChange(newRows);
  };

  console.log(value);

  const addRow = () => {
    onChange([...value, { no: "", qnMain: "", qtyHeld: "", deposit: "" }]);
  };

  const handleRemoveRow = (index) => {
    const newRows = value.filter((_, i) => i !== index);
    onChange(newRows);
  };

  if (!Array.isArray(value)) {
    console.error("BoxNoInputs 'value' prop must be an array.");
    return null;
  }

  const lastRow = value.length > 0 ? value[value.length - 1] : null;
  const canAddRow = lastRow && lastRow.no && lastRow.qnMain;

  return (
    <div className="w-full p-2 border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">
              {isLooseSpare ? "Rack No." : "Box No."}{" "}
              <span className="text-red-500">*</span>
            </TableHead>
            <TableHead className="text-center">
              Maintained Qty <span className="text-red-500">*</span>
            </TableHead>
            <TableHead className="text-center">
              Qty Held <span className="text-red-500">*</span>
            </TableHead>
            <TableHead className="text-center">
              Deposit Qty <span className="text-red-500">*</span>
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
                  disabled={isBoxnumberDisable}
                  type="text"
                  placeholder={
                    isLooseSpare ? "Enter Rack No." : "Enter Box No."
                  }
                  value={row.no}
                  onChange={(e) => {
                    let val = e.target.value;

                    if (isLooseSpare) {
                      // Rack No → alphanumeric
                      val = val.replace(/[^a-zA-Z0-9]/g, "");
                    } else {
                      // Box No → numeric only
                      val = val.replace(/[^0-9]/g, "");
                    }

                    handleInputChange(index, "no", val);
                  }}
                />
              </TableCell>

              <TableCell>
                <Input
                  readOnly
                  placeholder="Maintained Qty"
                  type="number"
                  value={row.qnMain}
                  onChange={(e) =>
                    handleInputChange(index, "qnMain", e.target.value)
                  }
                />
              </TableCell>

              <TableCell>
                <Input
                  readOnly
                  placeholder="Qty Held"
                  type="number"
                  value={row.qtyHeld}
                  onChange={(e) => {
                    let val = e.target.value;
                    handleInputChange(index, "qtyHeld", val);
                  }}
                />
              </TableCell>

              <TableCell>
                <Input
                  placeholder="Deposit Qty"
                  type="number"
                  min="0"
                  value={row.deposit}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) =>
                    handleInputChange(index, "deposit", e.target.value)
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default BoxNoMaintainedQty;
