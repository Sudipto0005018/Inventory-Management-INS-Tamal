import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { Input } from "@/components/ui/input";
import { imageBaseURL } from "../utils/baseURL";

// Added productId to props
const MultiImageSelect = ({ initialImages = [], productId, onImagesUpdate }) => {
    const [imageStatus, setImageStatus] = useState([]);
    const [newImageFiles, setNewImageFiles] = useState({});
    useEffect(() => {
        const statusArray = Array.from({ length: 5 }).map((_, index) => {
            const img = initialImages[index];
            return {
                isChanged: false,
                isDeleted: img === null || img === undefined,
                isReplaced: false,
                oldName: img ? img : null,
            };
        });
        setImageStatus(statusArray);
        setNewImageFiles({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    const updateStateAndNotify = (newStatus, newFiles) => {
        setImageStatus(newStatus);
        setNewImageFiles(newFiles);
        // Notify parent
        if (onImagesUpdate) {
            onImagesUpdate({ imageStatus: newStatus, newImageFiles: newFiles });
        }
    };

    const handleImageChange = (index, file) => {
        if (file) {
            // Create copies of current state
            const updatedFiles = { ...newImageFiles, [index]: file };
            const updatedStatus = [...imageStatus];

            updatedStatus[index] = {
                ...updatedStatus[index],
                isChanged: true,
                isDeleted: false,
                isReplaced: true,
            };

            updateStateAndNotify(updatedStatus, updatedFiles);
        }
    };

    const handleDeleteImage = (index) => {
        const updatedFiles = { ...newImageFiles };
        delete updatedFiles[index];

        const updatedStatus = [...imageStatus];
        updatedStatus[index] = {
            ...updatedStatus[index],
            isChanged: true,
            isDeleted: true,
            isReplaced: false,
        };

        updateStateAndNotify(updatedStatus, updatedFiles);
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {imageStatus.map((status, index) => {
                const originalImage = initialImages[index];
                const isDeleted = status.isDeleted;
                const newFile = newImageFiles[index];

                const displayUrl = newFile
                    ? URL.createObjectURL(newFile)
                    : originalImage && !isDeleted
                    ? `${imageBaseURL}${originalImage}`
                    : null;

                return (
                    <div
                        key={index}
                        className="relative w-full h-[100px] border border-gray-300 rounded-lg flex items-center justify-center group"
                    >
                        {displayUrl ? (
                            <>
                                <img
                                    src={displayUrl}
                                    alt={`Product Image ${index + 1}`}
                                    className="w-full h-full object-contain rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteImage(index)}
                                    className="cursor-pointer bg-red-500 text-white rounded-sm p-1 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <IoClose />
                                </button>
                            </>
                        ) : (
                            <label
                                htmlFor={`image-upload-${index}`}
                                className="cursor-pointer text-center text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <div className="flex flex-col items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="lucide lucide-image-plus mb-2"
                                    >
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                                        <line x1="16" x2="22" y1="5" y2="5" />
                                        <line x1="19" x2="19" y1="2" y2="8" />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="m21 15-3.5-3.5L9 19" />
                                    </svg>
                                </div>
                                {/* Input must have onChange */}
                                <Input
                                    id={`image-upload-${index}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageChange(index, e.target.files[0])}
                                />
                            </label>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MultiImageSelect;