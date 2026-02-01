import { AiOutlineMinusCircle, AiOutlinePlusCircle } from "react-icons/ai";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

function BoxNoInputsSimple({
  value,
  onChange,
  isLooseSpare = false,
  isBoxnumberDisable = false,
  isAddRow = true,
}) {
  const handleInputChange = (index, fieldName, fieldValue) => {
    console.log(index, fieldName, fieldValue);

    const newRows = [...value];
    newRows[index] = {
      ...newRows[index],
      [fieldName]: fieldValue,
    };
    onChange(newRows);
  };

  const addRow = () => {
    onChange([...value, { no: "", qn: "", qtyHeld: "", location: "" }]);
  };

  const handleRemoveRow = (index) => {
    const newRows = value.filter((_, i) => i !== index);
    onChange(newRows);
  };

  if (!Array.isArray(value)) {
    console.error("BoxNoInputsSimple 'value' prop must be an array.");
    return null;
  }

  const lastRow = value.length > 0 ? value[value.length - 1] : null;
  const canAddRow = lastRow && lastRow.no && lastRow.qn;
  console.log(value);
  return (
    <div className="w-full p-2 rounded-md space-y-4">
      <p className="text-xs text-muted-foreground mt-2">
        {/* Mention box no / rack no from which item quantity is withdrawn. */}
        Mention Box No. / Rack No. from which Authorised Qty is being revised.
      </p>
      {value.map((row, index) => (
        <div key={index} className="border p-4 rounded-md space-y-4">
          <div className="grid grid-cols-4 gap-4 items-end text-sm">
            {/* Box / Rack No */}
            <div>
              <label className="text-sm font-medium">
                {isLooseSpare ? "Rack No." : "Box No."}
              </label>
              <Input
                disabled={isBoxnumberDisable}
                placeholder={isLooseSpare ? "Rack No." : "Box No."}
                value={row.no}
                onChange={(e) => {
                  let val = e.target.value;

                  if (isLooseSpare) {
                    // remove non-alphanumeric
                    val = val.replace(/[^a-zA-Z0-9]/g, "");

                    // remove leading R if user typed it manually
                    val = val.replace(/^R/i, "");

                    // always prefix R
                    val = "R" + val;
                  } else {
                    // Box No → only numbers
                    val = val.replace(/[^0-9]/g, "");
                  }

                  handleInputChange(index, "no", val);
                }}
              />
            </div>

            {/* Authorised Qty */}
            <div>
              <label className="text-sm font-medium">
                Authorised Qty <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                className=""
                value={row.qn}
                onChange={(e) => handleInputChange(index, "qn", e.target.value)}
              />
            </div>

            {/* Qty Held */}
            <div>
              <label className="text-sm font-medium">
                Qty Held <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                className=""
                value={row.qtyHeld}
                onChange={(e) =>
                  handleInputChange(index, "qtyHeld", e.target.value)
                }
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium">
                Location <span className="text-red-500">*</span>
              </label>
              <Input
                className=""
                value={row.location}
                onChange={(e) =>
                  handleInputChange(index, "location", e.target.value)
                }
              />
            </div>
          </div>

          {/* Remove button */}
          {value.length > 1 && isAddRow && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                onClick={() => handleRemoveRow(index)}
              >
                <AiOutlineMinusCircle className="size-5" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Add row button */}
      {isAddRow && (
        <Button
          variant="outline"
          className="shadow-md flex items-center gap-2"
          onClick={addRow}
          disabled={!canAddRow}
          aria-label="Add new row"
        >
          <AiOutlinePlusCircle className="size-5" />
          Add new {isLooseSpare ? "rack" : "box"}
        </Button>
      )}
    </div>
  );
}

export default BoxNoInputsSimple;
