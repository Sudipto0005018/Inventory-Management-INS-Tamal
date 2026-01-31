// import { AiOutlineMinusCircle, AiOutlinePlusCircle } from "react-icons/ai";
// import { Input } from "./ui/input";
// import { Button } from "./ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "./ui/table";
// // import { CustomComboBox } from "./CustomCombobox";
// import ComboBox from "./ComboBox";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
// } from "./ui/dialog";
// import { useContext, useState } from "react";
// import SpinnerButton from "./ui/spinner-button";
// import { Context } from "../utils/Context";
// import apiService from "../utils/apiService";

// function BoxNoInputs({
//   value,
//   onChange,
//   isLooseSpare = false,
//   isBoxnumberDisable = false,
//   isAddRow = true,
//   // addToDropdown = async () => {},
// }) {
//     const { storageLocation, fetchStorageLocation } = useContext(Context);
//   const handleInputChange = (index, fieldName, fieldValue) => {
//     const newRows = [...value];
//     newRows[index] = {
//       ...newRows[index],
//       [fieldName]: fieldValue,
//     };
//     onChange(newRows);
//   };

//   const addToDropdown = async (type, value) => {
//     if (!value || !value.trim()) {
//       toaster("error", "Value cannot be empty");
//       return;
//     }

//     try {
//       const data = {
//         type: [type],
//         attr: [value.trim()],
//       };

//       const response = await apiService.post("/config/add", data);

//       if (response?.success) {
//         toaster("success", "Data Added");
//         await fetchStorageLocation();
//       }
//     } catch (error) {
//       console.error(error);
//       toaster("error", "Failed to add");
//     }
//   };

//   const [open, setOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [newValue, setNewValue] = useState(null);

//   const addRow = () => {
//     onChange([...value, { no: "", qn: "", qtyHeld: "", location: "" }]);
//   };

//   const handleRemoveRow = (index) => {
//     const newRows = value.filter((_, i) => i !== index);
//     onChange(newRows);
//   };

//   if (!Array.isArray(value)) {
//     console.error("BoxNoInputs 'value' prop must be an array.");
//     return null;
//   }

//   // const lastRow = value.length > 0 ? value[value.length - 1] : null;
//   // const canAddRow = lastRow && lastRow.no && lastRow.qn && lastRow.location;

//   const lastRow = value.length > 0 ? value[value.length - 1] : null;
//   const canAddRow = lastRow && lastRow.no && lastRow.qn;

//   return (
//     <div className="w-full p-2 border rounded-md">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             {/* 🔁 Dynamic Header */}
//             <TableHead className="text-center">
//               {isLooseSpare ? "Rack No." : "Box No."}
//             </TableHead>
//             <TableHead className="text-center">
//               Authorised / Maintained Qty
//             </TableHead>
//             <TableHead className="text-center">Qty Held</TableHead>
//             <TableHead className="text-center">Location of Storage</TableHead>
//             <TableHead></TableHead>
//           </TableRow>
//         </TableHeader>

//         <TableBody className="box-no-table">
//           {value.map((row, index) => (
//             <TableRow key={index}>
//               <TableCell>
//                 <Input
//                   required
//                   disabled={isBoxnumberDisable}
//                   placeholder={isLooseSpare ? "Rack No." : "Box No."}
//                   value={row.no}
//                   onChange={(e) => {
//                     let val = e.target.value;

//                     if (isLooseSpare) {
//                       // remove non-alphanumeric
//                       val = val.replace(/[^a-zA-Z0-9]/g, "");

//                       // remove leading R if user typed it manually
//                       val = val.replace(/^R/i, "");

//                       // always prefix R
//                       val = "R" + val;
//                     } else {
//                       // Box No → only numbers
//                       val = val.replace(/[^0-9]/g, "");
//                     }

//                     handleInputChange(index, "no", val);
//                   }}
//                 />
//               </TableCell>

//               <TableCell>
//                 <Input
//                   required
//                   placeholder="Authorised Qty"
//                   type="number"
//                   value={row.qn}
//                   onChange={(e) =>
//                     handleInputChange(index, "qn", e.target.value)
//                   }
//                 />
//               </TableCell>

//               <TableCell>
//                 <Input
//                   required
//                   placeholder="Qty Held"
//                   type="number"
//                   value={row.qtyHeld}
//                   onChange={(e) => {
//                     let val = e.target.value;
//                     // if (!val.startsWith("-"))
//                     handleInputChange(index, "qtyHeld", val);
//                   }}
//                 />
//               </TableCell>

//               <TableCell>
//                 {/* <CustomComboBox
//                   options={storageLocation}
//                   placeholder="Select location"
//                   onSelect={(value) => {
//                     // console.log("onSelect: " + value);
//                     handleInputChange(index, "location", value);
//                   }}
//                   onAdd={(value) => {
//                     setOpen(true);
//                     setNewValue(value);
//                   }}
//                   className="w-full"
//                 /> */}
//                 <div className="location-combobox w-full">
//                   <ComboBox
//                     options={storageLocation}
//                     placeholder="Select location"
//                     onSelect={(value) => {
//                       const locationName =
//                         typeof value === "string" ? value : value?.name;
//                       handleInputChange(index, "location", locationName || "");
//                     }}
//                     onCustomAdd={(value) => {
//                       const name =
//                         typeof value === "string" ? value : value?.name;
//                       setNewValue(name);
//                       setOpen(true);
//                     }}
//                     onDelete={async (value) => {
//                       try {
//                         const id =
//                           typeof value === "string" ? value : value?.id;

//                         if (!id) {
//                           toaster("error", "Invalid item selected");
//                           return;
//                         }

//                         setLoading(true);
//                         await apiService.delete(`/config/${id}`);
//                         await fetchStorageLocation();
//                         toaster("success", "Deleted Successfully");
//                       } catch (err) {
//                         console.error(err);
//                         toaster("error", "Failed to delete the item");
//                       } finally {
//                         setLoading(false);
//                       }
//                     }}
//                   />
//                 </div>
//               </TableCell>

//               {value.length > 1 && isAddRow && (
//                 <TableCell className="w-10">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="text-red-600 hover:text-red-700 hover:bg-red-100"
//                     onClick={() => handleRemoveRow(index)}
//                     aria-label="Remove row"
//                   >
//                     <AiOutlineMinusCircle className="size-5" />
//                   </Button>
//                 </TableCell>
//               )}
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>

//       {isAddRow && (
//         <Button
//           variant="outline"
//           className="shadow-md m-2 flex items-center gap-2"
//           onClick={addRow}
//           disabled={!canAddRow}
//           aria-label="Add new row"
//         >
//           <AiOutlinePlusCircle className="size-5" />
//           Add new {isLooseSpare ? "rack" : "box"}
//         </Button>
//       )}
//       <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
//         <DialogContent
//           onPointerDownOutside={(e) => {
//             e.preventDefault();
//           }}
//           showCloseButton={false}
//         >
//           <DialogTitle>Confirmation</DialogTitle>
//           <DialogDescription>
//             Do you want to save it for later?
//           </DialogDescription>
//           <div className="flex gap-3 justify-end items-center">
//             <Button
//               className="cursor-pointer"
//               variant="outline"
//               onClick={() => setOpen(false)}
//             >
//               Cancel
//             </Button>
//             <SpinnerButton
//               className="cursor-pointer"
//               disabled={loading}
//               loading={loading}
//               loadingText="Adding..."
//               onClick={async () => {
//                 setLoading(true);
//                 await addToDropdown("location", newValue);
//                 setOpen(false);
//                 setLoading(false);
//               }}
//             >
//               Add
//             </SpinnerButton>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// export default BoxNoInputs;



import { AiOutlineMinusCircle, AiOutlinePlusCircle } from "react-icons/ai";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
// import { CustomComboBox } from "./CustomCombobox";
import ComboBox from "./ComboBox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { useContext, useState } from "react";
import SpinnerButton from "./ui/spinner-button";
import { Context } from "../utils/Context";
import apiService from "../utils/apiService";

function BoxNoInputs({
  value,
  onChange,
  isLooseSpare = false, 
  isBoxnumberDisable = false,
  isAddRow = true,
  // addToDropdown = async () => {},
}) {
    const { storageLocation, fetchStorageLocation } = useContext(Context);
  const handleInputChange = (index, fieldName, fieldValue) => {
    const newRows = [...value];
    newRows[index] = {
      ...newRows[index],
      [fieldName]: fieldValue,
    };
    onChange(newRows);
  };

   const addToDropdown = async (type, value) => {
     try {
       const data = {
         type: [type],
         attr: [value],
       };

       const response = await apiService.post("/config/add", data);

       if (response.success) {
         toaster("success", "Data Added");

         if (type === "location") {
           await fetchStorageLocation();
         }
       }
     } catch (error) {
       console.error(error);
       toaster("error", "Failed to add");
     }
   };
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newValue, setNewValue] = useState(null);

  const addRow = () => {
    onChange([...value, { no: "", qn: "", qtyHeld: "", location: "" }]);
  };

  const handleRemoveRow = (index) => {
    const newRows = value.filter((_, i) => i !== index);
    onChange(newRows);
  };

  if (!Array.isArray(value)) {
    console.error("BoxNoInputs 'value' prop must be an array.");
    return null;
  }

  // const lastRow = value.length > 0 ? value[value.length - 1] : null;
  // const canAddRow = lastRow && lastRow.no && lastRow.qn && lastRow.location;

  const lastRow = value.length > 0 ? value[value.length - 1] : null;
  const canAddRow = lastRow && lastRow.no && lastRow.qn;

  return (
    <div className="w-full p-2 border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {/* 🔁 Dynamic Header */}
            <TableHead className="text-center">
              {isLooseSpare ? "Rack No." : "Box No."}
            </TableHead>
            <TableHead className="text-center">
              Authorised / Maintained Qty
            </TableHead>
            <TableHead className="text-center">Qty Held</TableHead>
            <TableHead className="text-center">Location of Storage</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="box-no-table">
          {value.map((row, index) => (
            <TableRow key={index}>
              <TableCell>
                <Input
                  required
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
              </TableCell>

              <TableCell>
                <Input
                  required
                  placeholder="Authorised Qty"
                  type="number"
                  value={row.qn}
                  onChange={(e) =>
                    handleInputChange(index, "qn", e.target.value)
                  }
                />
              </TableCell>

              <TableCell>
                <Input
                  required
                  placeholder="Qty Held"
                  type="number"
                  value={row.qtyHeld}
                  onChange={(e) => {
                    let val = e.target.value;
                    // if (!val.startsWith("-"))
                    handleInputChange(index, "qtyHeld", val);
                  }}
                />
              </TableCell>

              <TableCell>
                {/* <CustomComboBox
                  options={storageLocation}
                  placeholder="Select location"
                  onSelect={(value) => {
                    // console.log("onSelect: " + value);
                    handleInputChange(index, "location", value);
                  }}
                  onAdd={(value) => {
                    setOpen(true);
                    setNewValue(value);
                  }}
                  className="w-full"
                /> */}
                <div className="location-combobox w-full">
                  <ComboBox
                    options={storageLocation}
                    placeholder="Select location"
                    onSelect={(value) => {
                      handleInputChange(index, "location", value.name);
                    }}
                    onCustomAdd={(value) => {
                      setOpen(true);
                      setNewValue(value.name);
                    }}
                    onDelete={async (value) => {
                      try {
                        await apiService.delete(`/config/${value.id}`);
                        await fetchStorageLocation();
                        toaster("success", "Deleted Successfully");
                      } catch {
                        toaster("error", "Failed to delete the item");
                      }
                    }}
                  />
                </div>
              </TableCell>

              {value.length > 1 && isAddRow && (
                <TableCell className="w-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    onClick={() => handleRemoveRow(index)}
                    aria-label="Remove row"
                  >
                    <AiOutlineMinusCircle className="size-5" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isAddRow && (
        <Button
          variant="outline"
          className="shadow-md m-2 flex items-center gap-2"
          onClick={addRow}
          disabled={!canAddRow}
          aria-label="Add new row"
        >
          <AiOutlinePlusCircle className="size-5" />
          Add new {isLooseSpare ? "rack" : "box"}
        </Button>
      )}
      <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          showCloseButton={false}
        >
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>
            Do you want to save it for later?
          </DialogDescription>
          <div className="flex gap-3 justify-end items-center">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SpinnerButton
              className="cursor-pointer"
              disabled={loading}
              loading={loading}
              loadingText="Adding..."
              onClick={async () => {
                setLoading(true);
                await addToDropdown("location", newValue);
                setOpen(false);
                setLoading(false);
              }}
            >
              Add
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BoxNoInputs;




// {/* Old Code */}

// import { AiOutlineMinusCircle, AiOutlinePlusCircle } from "react-icons/ai";
// import { Input } from "./ui/input";
// import { Button } from "./ui/button";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

// function BoxNoInputs({ value, onChange, isBoxnumberDisable = false, isAddRow = true }) {
//     const handleInputChange = (index, fieldName, fieldValue) => {
//         const newRows = [...value];
//         newRows[index] = {
//             ...newRows[index],
//             [fieldName]: fieldValue,
//         };
//         onChange(newRows);
//     };

//     const addRow = () => {
//         onChange([...value, { no: "", qn: "", location: "" }]);
//     };

//     const handleRemoveRow = (index) => {
//         const newRows = value.filter((_, i) => i !== index);
//         onChange(newRows);
//     };

//     if (!Array.isArray(value)) {
//         console.error("BoxSearch 'value' prop must be an array.");
//         return null;
//     }

//     const lastRow = value.length > 0 ? value[value.length - 1] : null;
//     const canAddRow = lastRow && lastRow.no && lastRow.qn && lastRow.location;

//     return (
//       <div className="w-full p-2 border rounded-md">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="text-center">Box No.</TableHead>
//               <TableHead className="text-center">Authorised Qty.</TableHead>
//               <TableHead className="text-center">Qty. Held</TableHead>
//               <TableHead className="text-center">Location of Storage</TableHead>
//               <TableHead></TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody className="box-no-table">
//             {value.map((row, index) => {
//               return (
//                 <TableRow key={index}>
//                   <TableCell>
//                     <Input
//                       disabled={isBoxnumberDisable}
//                       type="text"
//                       placeholder="Box Number"
//                       value={row.no}
//                       onChange={(e) =>
//                         handleInputChange(index, "no", e.target.value)
//                       }
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Input
//                       placeholder="Quantity"
//                       type="number"
//                       value={row.qn}
//                       onChange={(e) => {
//                         handleInputChange(index, "qn", e.target.value);
//                       }}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Input
//                       placeholder="Quantity"
//                       type="number"
//                       value={row.qn}
//                       onChange={(e) => {
//                         handleInputChange(index, "qn", e.target.value);
//                       }}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Input
//                       placeholder="Location"
//                       type="text"
//                       value={row.location}
//                       onChange={(e) => {
//                         handleInputChange(index, "location", e.target.value);
//                       }}
//                     />
//                   </TableCell>
//                   {value.length > 1 && isAddRow && (
//                     <TableCell className="w-10">
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="text-red-600 hover:text-red-700 hover:bg-red-100"
//                         onClick={() => handleRemoveRow(index)}
//                         aria-label="Remove row"
//                       >
//                         <AiOutlineMinusCircle className="size-5" />
//                       </Button>
//                     </TableCell>
//                   )}
//                 </TableRow>
//               );
//             })}
//           </TableBody>
//         </Table>
//         {canAddRow && isAddRow && (
//           <Button
//             variant="outline"
//             className="shadow-md m-2"
//             onClick={addRow}
//             aria-label="Add new row"
//           >
//             <AiOutlinePlusCircle className="size-5" />
//             Add new box
//           </Button>
//         )}
//       </div>
//     );
// }

// export default BoxNoInputs;

// // item demand -> 2 option
