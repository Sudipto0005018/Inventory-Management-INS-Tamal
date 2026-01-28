import React from "react";
const Chip = ({ varient, text }) => {
    if (varient === "success") {
        return (
            <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300`}
            >
                {text}
            </span>
        );
    } else if (varient === "danger") {
        return (
            <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300`}
            >
                {text}
            </span>
        );
    } else if (varient === "warning") {
        return (
            <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300`}
            >
                {text}
            </span>
        );
    } else {
        return (
            <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300`}
            >
                {text}
            </span>
        );
    }
};

export default Chip;
