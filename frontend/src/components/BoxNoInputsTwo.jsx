import { AiOutlineMinusCircle, AiOutlinePlusCircle } from "react-icons/ai";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

function BoxNoInputs({
    value,
    onChange,
    isBoxnumberDisable = false,
    isAddRow = true,
    isStocking = false,
}) {
    const handleInputChange = (index, fieldName, fieldValue) => {
        const newRows = [...value];
        newRows[index] = {
            ...newRows[index],
            [fieldName]: fieldValue,
        };
        onChange(newRows);
    };

    const addRow = () => {
        onChange([...value, { no: "", qn: "" }]);
    };

    const handleRemoveRow = (index) => {
        const newRows = value.filter((_, i) => i !== index);
        onChange(newRows);
    };

    if (!Array.isArray(value)) {
        console.error("BoxSearch 'value' prop must be an array.");
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
                Box Number <span className="text-red-500">*</span>
              </TableHead>
              <TableHead className="text-center">
                Held Quantity <span className="text-red-500">*</span>
              </TableHead>
              <TableHead className="text-center">
                {isStocking ? "Stock Quantity" : "Withdrawn Quantity"}{" "}
                <span className="text-red-500">*</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="box-no-table">
            {value.map((row, index) => {
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      disabled={isBoxnumberDisable}
                      type="text"
                      placeholder="Box Number"
                      value={row.no}
                      onChange={(e) =>
                        handleInputChange(index, "no", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      disabled={isBoxnumberDisable}
                      placeholder="Quantity"
                      type="number"
                      value={row.qn}
                      onChange={(e) => {
                        handleInputChange(index, "qn", e.target.value);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Quantity"
                      type="number"
                      value={row.wd}
                      onChange={(e) => {
                        if (!isStocking) {
                          if (e.target.value) {
                            if (parseInt(e.target.value) <= parseInt(row.qn))
                              handleInputChange(index, "wd", e.target.value);
                          } else {
                            handleInputChange(index, "wd", e.target.value);
                          }
                        } else {
                          handleInputChange(index, "wd", e.target.value);
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {canAddRow && isAddRow && (
          <Button
            variant="outline"
            className="shadow-md m-2"
            onClick={addRow}
            aria-label="Add new row"
          >
            <AiOutlinePlusCircle className="size-5" />
            Add new box
          </Button>
        )}
      </div>
    );
}

export default BoxNoInputs;
