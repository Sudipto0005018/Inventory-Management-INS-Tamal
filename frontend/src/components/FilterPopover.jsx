// components/FilterPopover.jsx
import { useState, useEffect, useRef } from "react";
import { FaFilter, FaCheck, FaTimes } from "react-icons/fa";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

const FilterPopover = ({ columnKey, data, onFilterChange, activeFilters }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const popoverRef = useRef(null);
  
  const [selectedValues, setSelectedValues] = useState(() => {
    return activeFilters[columnKey] || [];
  });
  
  // Extract unique values from column based on column key mapping
  const getColumnValue = (row, key) => {
    // Map column keys to actual data properties
    const keyMapping = {
      'equipment_system': 'equipment_system',
      'boxNo': 'boxNo',
      'category': 'category',
      'description': 'description',
      'indian_pattern': 'indian_pattern',
      'denos': 'denos',
      'obs_authorised': 'obs_authorised',
      'obs_held': 'obs_held',
      'itemDistribution': 'itemDistribution',
      'location': 'location'
    };
    
    const actualKey = keyMapping[key] || key;
    let value = row[actualKey];
    
    // Handle different value types
    if (value === undefined || value === null) {
      return null;
    }
    
    // If it's a React component (like ImagePreviewDialog or ActionIcons), skip it
    if (typeof value === 'object' && value !== null && (value.type || value.$$typeof)) {
      return null;
    }
    
    // Convert to string for display
    return String(value).trim();
  };
  
  // Get unique values for this column
  const uniqueValues = [...new Set(
    data
      .map(row => getColumnValue(row, columnKey))
      .filter(v => v !== null && v !== undefined && v !== "--" && v !== "")
  )];
  
  // Sort values alphabetically
  uniqueValues.sort();
  
  const filteredValues = uniqueValues.filter(value =>
    String(value).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);
  
  const handleSelectAll = () => {
    if (selectedValues.length === filteredValues.length && filteredValues.length > 0) {
      setSelectedValues([]);
    } else {
      setSelectedValues([...filteredValues]);
    }
  };
  
  const handleApply = () => {
    onFilterChange(columnKey, selectedValues);
    setOpen(false);
  };
  
  const handleClear = () => {
    setSelectedValues([]);
    onFilterChange(columnKey, []);
    setOpen(false);
  };
  
  const handleCheckboxChange = (value, checked) => {
    if (checked) {
      setSelectedValues([...selectedValues, value]);
    } else {
      setSelectedValues(selectedValues.filter(v => v !== value));
    }
  };
  
  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        className={cn(
          "ml-1 p-1 rounded hover:bg-white/20 transition-colors inline-flex items-center",
          activeFilters[columnKey]?.length > 0 && "text-yellow-300"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <FaFilter className="h-3 w-3" />
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-50 w-64">
          {/* Header with search */}
          <div className="p-2 border-b bg-gray-50">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm text-black"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Filter options */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredValues.length > 0 && (
              <div className="flex items-center justify-between mb-2 pb-2 border-b">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedValues.length === filteredValues.length ? "Clear All" : "Select All"}
                </button>
                <span className="text-xs text-gray-500">
                  {selectedValues.length} selected
                </span>
              </div>
            )}
            
            {filteredValues.map((value, idx) => (
              <label
                key={idx}
                className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={(e) => handleCheckboxChange(value, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 truncate">{value}</span>
              </label>
            ))}
            
            {filteredValues.length === 0 && uniqueValues.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                No filterable data
              </div>
            )}
            
            {filteredValues.length === 0 && uniqueValues.length > 0 && searchTerm && (
              <div className="text-center text-gray-500 text-sm py-4">
                No matching options
              </div>
            )}
          </div>
          
          {/* Footer buttons */}
          <div className="p-2 border-t bg-gray-50 flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              className="h-7 text-xs"
            >
              <FaTimes className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FaCheck className="h-3 w-3 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPopover;