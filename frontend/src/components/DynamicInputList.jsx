import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DynamicInputList = ({ data = [], onChange, placeholder = "Input" }) => {
    const inputs = data.length > 0 ? data : [""];

    const handleInputChange = (index, value) => {
        const newInputs = [...inputs];
        newInputs[index] = value;
        onChange(newInputs);
    };

    const handleAddInput = () => {
        onChange([...inputs, ""]);
    };

    const handleRemoveInput = (index) => {
        const newInputs = inputs.filter((_, i) => i !== index);
        onChange(newInputs.length ? newInputs : [""]);
    };

    return (
        <div className="w-full space-y-4">
            {inputs.map((value, index) => {
                const showPlusButton = value.trim() !== "" && index === inputs.length - 1;

                return (
                    <div key={index} className="flex items-center w-full gap-2">
                        <Input
                            // placeholder={`${placeholder} ${index + 1}`}
                            value={value}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            className="flex-1"
                        />

                        <div className="w-10 flex justify-center">
                            {showPlusButton && (
                                <Button
                                    onClick={handleAddInput}
                                    size="icon"
                                    variant="outline"
                                    className=" h-8 w-8"
                                    type="button"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {inputs.length > 1 && (
                            <Button
                                onClick={() => handleRemoveInput(index)}
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                type="button"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default DynamicInputList;
