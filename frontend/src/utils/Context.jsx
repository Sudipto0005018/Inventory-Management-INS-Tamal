import { createContext, useState } from "react";
import apiService from "./apiService";

const Context = createContext();

const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ row_per_page: 10 });
  const [isOpen, setIsOpen] = useState(true);
  const [storageLocation, setStorageLocation] = useState([]);
  const [concurredBy, setConcurredBy] = useState([]);
  const [issueTo, setIssueTo] = useState([]);

  async function fetchStorageLocation() {
    try {
      const response = await apiService.get("/config/location-storage");
      if (response.success) {
        setStorageLocation(response.data);
      }
    } catch (error) {
      console.log(error);

      // setStorageLocation
    }
  }

  async function fetchIssueTo() {
    try {
      const response = await apiService.get("/config/issue");
      if (response.success) {
        setIssueTo(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchConcurredBy() {
    try {
      const response = await apiService.get("/config/concurred_by");
      console.log(response);

      if (response.success) {
        setConcurredBy(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <Context.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
        config,
        setConfig,
        isOpen,
        setIsOpen,
        storageLocation,
        setStorageLocation,
        issueTo,
        setIssueTo,
        concurredBy,
        setConcurredBy,
        fetchIssueTo,
        fetchStorageLocation,
        fetchConcurredBy,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;

export { Context };
