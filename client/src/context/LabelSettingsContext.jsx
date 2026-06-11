import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const LabelSettingsContext = createContext();

export const LabelSettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [labelSettings, setLabelSettings] = useState(null);
  const [moduleSettings, setModuleSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const endpoint = user.role === "superadmin" 
        ? "/settings/global/labels" 
        : "/settings/institute/labels";
      
      const moduleEndpoint = user.role === "superadmin"
        ? "/settings/global/modules"
        : "/settings/institute/modules";

      const [labelRes, moduleRes] = await Promise.all([
        api.get(endpoint),
        api.get(moduleEndpoint),
      ]);

      if (labelRes.data.labelSettings) {
        setLabelSettings(labelRes.data.labelSettings);
      }
      if (moduleRes.data.moduleSettings) {
        setModuleSettings(moduleRes.data.moduleSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (key) => {
    if (!labelSettings || !labelSettings.labels) {
      // Fallback to default labels
      const defaults = {
        instituteLabel: "Institute",
        academicGroupLabel: "Class",
        subGroupLabel: "Section",
        teacherLabel: "Teacher",
        parentLabel: "Parent",
        studentLabel: "Student",
        staffLabel: "Staff",
        subjectLabel: "Subject",
        examLabel: "Exam",
        resultLabel: "Result",
        feeLabel: "Fee",
        noticeLabel: "Notice",
        timetableLabel: "Timetable",
        assignmentLabel: "Assignment",
        libraryLabel: "Library",
        transportLabel: "Transport",
        hostelLabel: "Hostel",
        attendanceLabel: "Attendance",
        marksLabel: "Marks",
      };
      return defaults[key] || key;
    }
    return labelSettings.labels[key] || key;
  };

  const isModuleEnabled = (module) => {
    if (!moduleSettings || !moduleSettings.modules) return true;
    return moduleSettings.modules[module] !== false;
  };

  const refreshSettings = () => {
    fetchSettings();
  };

  return (
    <LabelSettingsContext.Provider
      value={{
        labelSettings,
        moduleSettings,
        loading,
        getLabel,
        isModuleEnabled,
        refreshSettings,
      }}
    >
      {children}
    </LabelSettingsContext.Provider>
  );
};

export const useLabelSettings = () => {
  const context = useContext(LabelSettingsContext);
  if (!context) {
    throw new Error("useLabelSettings must be used within a LabelSettingsProvider");
  }
  return context;
};

export default LabelSettingsContext;
