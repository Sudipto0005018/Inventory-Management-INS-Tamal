import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

const TestDialog = ({ title, open, setOpen, value = {} }) => {
  return (
    <div>
      <Button onClick={() => setOpen(true)}>{title}</Button>
      <Dialog open={open} onOpenChange={(set) => setOpen(set)}>
        <DialogContent
          className="w-[95%] h-[95%] overflow-y-auto"
          unbounded={true}
          onPointerDownOutside={() => {}}
        >
          <DialogTitle className="">Add Tools & Accessories</DialogTitle>
          <DialogDescription className="hidden" />
          <p>Total count: {value.items?.length || 0}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestDialog;
