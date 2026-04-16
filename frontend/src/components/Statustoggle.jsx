import React from "react";

const Statustoggle = ({ status, onToggle, className = "", style = {} }) => {
  const isActive = status.toLowerCase() === "active";
  const label = isActive ? "Active" : "Inactive";

  return (
    <div
      className={`relative inline-flex items-center w-20 h-8 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${
        isActive ? "bg-[#E9F7EF]" : "bg-[#FDEDEC]"
      } ${className}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.12)", ...style }}
      onClick={onToggle}
      title={`Click to toggle to ${isActive ? "Inactive" : "Active"}`}
    >
      <div
        className={`absolute w-2 h-2 rounded-full transition-all duration-300 ease-in-out transform ${
          isActive
            ? "translate-x-[4.2rem] bg-[#2F7A4A]"
            : "translate-x-1 bg-[#A94442]"
        }`}
        style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
      />
      <span
        className={`absolute inset-0 flex items-center justify-center text-xs font-medium transition-colors duration-300 ${
          isActive ? "text-[#2F7A4A]" : "text-[#A94442]"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

export default Statustoggle;

