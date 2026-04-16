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
  const [surveyReason, setSurveyReason] = useState([]);
  const [category, setCategory] = useState([]);
  const [denos, setDenos] = useState([]);
  const [equipment_system, setEquipment] = useState([]);

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

  const fetchSurveyReason = async () => {
    try {
      const response = await apiService.get("/config/survey");

      if (response.success) {
        setSurveyReason(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  async function fetchCategory() {
    try {
      const response = await apiService.get("/config/category");
      if (response.success) {
        setCategory(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchDenos() {
    try {
      const response = await apiService.get("/config/denos");
      if (response.success) {
        setDenos(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  }

    async function fetchEquipment() {
      try {
        const response = await apiService.get("/config/equipment_system");
        if (response.success) {
          setEquipment(response.data);
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
        surveyReason,
        setSurveyReason,
        fetchIssueTo,
        fetchStorageLocation,
        fetchConcurredBy,
        fetchSurveyReason,
        category,
        setCategory,
        fetchCategory,
        denos,
        setDenos,
        fetchDenos,
        equipment_system,
        setEquipment,
        fetchEquipment,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;

export { Context };
