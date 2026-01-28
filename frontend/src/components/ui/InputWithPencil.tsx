import { useEffect, useRef } from "react";
import { MdModeEditOutline } from "react-icons/md";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InputWithPencilProps {
  label: string;
  name: string;
  value: string;
  editable: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: () => void;
  onBlur?: () => void;
}

const InputWithPencil = ({
  label,
  name,
  value,
  editable,
  required = false,
  placeholder,
  className,
  onChange,
  onEdit,
  onBlur,
}: InputWithPencilProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus when editable
  useEffect(() => {
    if (editable) {
      inputRef.current?.focus();
    }
  }, [editable]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.toUpperCase();
    onChange(e);
  };

  return (
    <div className="w-full">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative mt-1">
        <Input
          ref={inputRef}
          id={name}
          name={name}
          value={value || ""}
          placeholder={placeholder}
          disabled={!editable}
          onChange={handleChange}
          onBlur={onBlur}
          className={cn(
            "pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed",
            editable && "border-blue-500 ring-1 ring-blue-300",
            className
          )}
        />

        <MdModeEditOutline
          size={18}
          title="Click to edit"
          onClick={onEdit}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer",
            editable ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
          )}
        />
      </div>
    </div>
  );
};

export default InputWithPencil;
