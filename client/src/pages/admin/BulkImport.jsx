import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiDownload,
  FiFileText,
  FiLayers,
  FiShield,
  FiUploadCloud,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import { SkeletonBlock, SkeletonButton, SkeletonLines } from "../../components/Skeleton";
import PageHeader from "../../components/PageHeader";
import { useUISettings } from "../../context/UISettingsContext";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const importConfigs = {
  students: {
    label: "Students",
    icon: FiUsers,
    description:
      "Import student profiles with admission and academic group mapping in one flow.",
    csv: `name,email,password,phone,roll_number,admission_number,registration_number,dob,gender,blood_group,address,admission_date,school_level,class_name,section,status
Ali Raza,ali.raza@student.com,Student@123,9876543201,12,ADM-1001,REG-501,2010-04-12,male,B+,Lahore,2026-04-01,Secondary,10,A,active`,
    requiredColumns: [
      "name",
      "email",
      "password",
      "roll_number",
      "admission_number",
      "dob",
      "gender",
      "blood_group",
      "address",
      "admission_date",
      "status",
    ],
    optionalColumns: ["phone", "registration_number", "academic_group_id", "school_level", "class_name", "section", "program_level", "department", "course"],
    rowRequiredFields: ["name", "email", "password", "roll_number", "admission_number"],
    uniqueFields: ["email", "roll_number", "admission_number", "registration_number"],
    emailFields: ["email"],
    phoneFields: ["phone"],
    dateFields: ["dob", "admission_date"],
    enumFields: {
      status: ["active", "inactive"],
    },
    route: "/admin/students",
  },
  teachers: {
    label: "Teachers",
    icon: FiUser,
    description: "Create teacher accounts in bulk with employee and department details.",
    csv: `name,email,password,phone,employee_id,qualification,experience,department,status
Sara Khan,sara.khan@school.com,Teacher@123,9876543210,TCH-001,MSc Physics,5 years,Science,active`,
    requiredColumns: ["name", "email", "password"],
    optionalColumns: ["phone", "employee_id", "qualification", "experience", "department", "profile_photo", "status"],
    rowRequiredFields: ["name", "email", "password"],
    uniqueFields: ["email", "employee_id", "phone"],
    emailFields: ["email"],
    phoneFields: ["phone"],
    enumFields: {
      status: ["active", "inactive"],
    },
    route: "/admin/teachers",
  },
  parents: {
    label: "Parents",
    icon: FiShield,
    description:
      "Link parent records to one or more students using admission numbers or roll numbers.",
    csv: `name,email,password,phone,relation,address,linked_student_admission_numbers,status
Ahmed Raza,ahmed.raza@parent.com,Parent@123,9876543202,father,Lahore,ADM-1001|ADM-1002,active`,
    requiredColumns: ["name", "email", "password", "relation"],
    optionalColumns: ["phone", "address", "linked_student_admission_numbers", "linked_student_roll_numbers", "status"],
    rowRequiredFields: ["name", "email", "password", "relation"],
    uniqueFields: ["email", "phone"],
    emailFields: ["email"],
    phoneFields: ["phone"],
    enumFields: {
      relation: ["father", "mother", "guardian", "other"],
      status: ["active", "inactive"],
    },
    route: "/admin/parents",
  },
  staff: {
    label: "Staff",
    icon: FiLayers,
    description:
      "Bulk onboard non-teaching teams with designations, salary, and permission values.",
    csv: `name,email,password,phone,staff_id,designation,department,joining_date,salary,address,permissions,status
Nadia Khan,nadia.khan@school.com,Staff@123,9876543203,STF-201,librarian,Library,2026-05-01,35000,Campus,library.manage,active`,
    requiredColumns: ["name", "email", "password", "staff_id", "designation"],
    optionalColumns: ["phone", "department", "joining_date", "salary", "address", "permissions", "status"],
    rowRequiredFields: ["name", "email", "password", "staff_id", "designation"],
    uniqueFields: ["email", "phone", "staff_id"],
    emailFields: ["email"],
    phoneFields: ["phone"],
    dateFields: ["joining_date"],
    numericFields: ["salary"],
    enumFields: {
      status: ["active", "inactive"],
    },
    route: "/admin/staff",
  },
  academic_groups: {
    label: "Academic Groups",
    icon: FiBookOpen,
    description:
      "Create school sections or higher-ed program groups using institute-specific column mapping.",
    csv: `school_level,class_name,section,mentor_teacher_email,status
Secondary,10,A,teacher1@school.com,active`,
    requiredColumns: ["section"],
    optionalColumns: ["school_level", "class_name", "program_level", "department", "course", "semester", "year", "batch", "mentor_teacher_email", "status"],
    rowRequiredFields: ["section"],
    uniqueFields: [],
    emailFields: ["mentor_teacher_email"],
    enumFields: {
      status: ["active", "inactive"],
    },
    route: "/admin/academic-groups",
  },
  subjects: {
    label: "Subjects",
    icon: FiFileText,
    description:
      "Import subjects with academic group mapping, marks structure, and optional teacher assignment.",
    csv: `subject_name,subject_code,subject_type,total_marks,passing_marks,teacher_email,school_level,class_name,section,status
Mathematics,MATH-10-A,core,100,33,sara.khan@school.com,Secondary,10,A,active`,
    requiredColumns: ["subject_name", "subject_code", "section"],
    optionalColumns: ["subject_type", "total_marks", "passing_marks", "teacher_email", "academic_group_id", "school_level", "class_name", "program_level", "department", "course", "semester", "year", "batch", "status"],
    rowRequiredFields: ["subject_name", "subject_code"],
    uniqueFields: ["subject_code"],
    emailFields: ["teacher_email"],
    numericFields: ["total_marks", "passing_marks"],
    enumFields: {
      status: ["active", "inactive"],
    },
    route: "/admin/subjects",
  },
};

const primaryImportTypes = ["students", "teachers", "parents", "staff"];
const secondaryImportTypes = ["academic_groups", "subjects"];

const unsupportedImportTypes = [
  {
    key: "admins",
    label: "Admins",
    icon: FiShield,
    note: "Not supported by the current bulk import API yet.",
  },
];

const stepLabels = [
  "Select Import Type",
  "Download Template",
  "Upload CSV or Paste CSV",
  "Preview & Validate",
  "Import Records",
];

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const splitCsvLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const parseCsvText = (csvText) => {
  const text = String(csvText || "").replace(/\r/g, "").trim();
  if (!text) {
    return { headers: [], rows: [], rawHeaders: [] };
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row");
  }

  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  if (headers.some((header) => !header)) {
    throw new Error("CSV headers cannot be empty");
  }

  const rows = lines.slice(1).map((line, rowIndex) => {
    const cells = splitCsvLine(line);
    const row = {};
    const rawRow = {};

    headers.forEach((header, cellIndex) => {
      row[header] = cells[cellIndex] ?? "";
      rawRow[rawHeaders[cellIndex] || header] = cells[cellIndex] ?? "";
    });

    row.__rowNumber = rowIndex + 2;
    row.__rawRow = rawRow;
    return row;
  });

  return { headers, rows, rawHeaders };
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const addRowError = (errors, rowTracker, rowNumber, field, error, value, code) => {
  const key = `${rowNumber}-${field}-${error}`;
  if (rowTracker.has(key)) {
    return;
  }
  rowTracker.add(key);
  errors.push({
    rowNumber,
    field,
    error,
    value: value ?? "",
    code,
  });
};

const validateParsedCsv = (csvText, config) => {
  if (!csvText.trim()) {
    return {
      headers: [],
      rows: [],
      rawHeaders: [],
      previewRows: [],
      parseError: "",
      missingColumns: [],
      extraColumns: [],
      columnsDetected: 0,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      missingRequiredFields: 0,
      rowErrors: [],
      rowValidity: new Map(),
      readyToImport: false,
    };
  }

  try {
    const { headers, rows, rawHeaders } = parseCsvText(csvText);
    const missingColumns = config.requiredColumns.filter((column) => !headers.includes(column));
    const extraColumns = headers.filter((header) => !config.requiredColumns.includes(header) && !config.optionalColumns.includes(header));
    const rowErrors = [];
    const rowTracker = new Set();
    const duplicateRowsSet = new Set();
    const fieldSeenMap = new Map();
    const rowValidity = new Map();

    config.uniqueFields.forEach((field) => {
      fieldSeenMap.set(field, new Map());
    });

    rows.forEach((row) => {
      rowValidity.set(row.__rowNumber, true);

      config.rowRequiredFields.forEach((field) => {
        if (!String(row[field] || "").trim()) {
          rowValidity.set(row.__rowNumber, false);
          addRowError(rowErrors, rowTracker, row.__rowNumber, field, "Missing required field", row[field], "missing");
        }
      });

      config.emailFields?.forEach((field) => {
        const value = String(row[field] || "").trim();
        if (value && !isValidEmail(value)) {
          rowValidity.set(row.__rowNumber, false);
          addRowError(rowErrors, rowTracker, row.__rowNumber, field, "Invalid email format", value, "format");
        }
      });

      config.phoneFields?.forEach((field) => {
        const value = String(row[field] || "").trim();
        if (value && !/^\d{10}$/.test(value)) {
          rowValidity.set(row.__rowNumber, false);
          addRowError(rowErrors, rowTracker, row.__rowNumber, field, "Phone must be exactly 10 digits", value, "format");
        }
      });

      config.dateFields?.forEach((field) => {
        const value = String(row[field] || "").trim();
        if (value && Number.isNaN(new Date(value).getTime())) {
          rowValidity.set(row.__rowNumber, false);
          addRowError(rowErrors, rowTracker, row.__rowNumber, field, "Invalid date value", value, "format");
        }
      });

      config.numericFields?.forEach((field) => {
        const value = String(row[field] || "").trim();
        if (value && Number.isNaN(Number(value))) {
          rowValidity.set(row.__rowNumber, false);
          addRowError(rowErrors, rowTracker, row.__rowNumber, field, "Must be a valid number", value, "format");
        }
      });

      Object.entries(config.enumFields || {}).forEach(([field, options]) => {
        const value = String(row[field] || "").trim().toLowerCase();
        if (value && !options.includes(value)) {
          rowValidity.set(row.__rowNumber, false);
          addRowError(rowErrors, rowTracker, row.__rowNumber, field, `Allowed values: ${options.join(", ")}`, row[field], "enum");
        }
      });

      config.uniqueFields.forEach((field) => {
        const value = String(row[field] || "").trim().toLowerCase();
        if (!value) {
          return;
        }

        const seenMap = fieldSeenMap.get(field);
        if (seenMap.has(value)) {
          rowValidity.set(row.__rowNumber, false);
          rowValidity.set(seenMap.get(value), false);
          duplicateRowsSet.add(row.__rowNumber);
          duplicateRowsSet.add(seenMap.get(value));
          addRowError(rowErrors, rowTracker, row.__rowNumber, field, `Duplicate value also used in row ${seenMap.get(value)}`, row[field], "duplicate");
        } else {
          seenMap.set(value, row.__rowNumber);
        }
      });

      if (missingColumns.length > 0) {
        rowValidity.set(row.__rowNumber, false);
      }
    });

    const validRows = rows.filter((row) => rowValidity.get(row.__rowNumber)).length;
    const invalidRows = rows.length - validRows;
    const missingRequiredFields = rowErrors.filter((error) => error.code === "missing").length;

    return {
      headers,
      rows,
      rawHeaders,
      previewRows: rows.slice(0, 8),
      parseError: "",
      missingColumns,
      extraColumns,
      columnsDetected: headers.length,
      totalRows: rows.length,
      validRows,
      invalidRows,
      duplicateRows: duplicateRowsSet.size,
      missingRequiredFields,
      rowErrors,
      rowValidity,
      readyToImport: missingColumns.length === 0 && rows.length > 0 && validRows > 0,
    };
  } catch (error) {
    return {
      headers: [],
      rows: [],
      rawHeaders: [],
      previewRows: [],
      parseError: error.message,
      missingColumns: [],
      extraColumns: [],
      columnsDetected: 0,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      missingRequiredFields: 0,
      rowErrors: [],
      rowValidity: new Map(),
      readyToImport: false,
    };
  }
};

const formatBytes = (value) => {
  if (!value) {
    return "0 KB";
  }

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const toCsvValue = (value) => {
  const text = String(value ?? "");
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const stepClasses = (state) => {
  if (state === "done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (state === "active") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300";
  }
  return "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-500";
};

const cardClassName =
  "rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900";
const mutedCardClassName = "rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60";

const BulkImport = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { settings, getButtonRadius } = useUISettings();
  const [entityType, setEntityType] = useState("students");
  const [csvText, setCsvText] = useState(importConfigs.students.csv);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [templateTouched, setTemplateTouched] = useState(false);
  const [showColumnsList, setShowColumnsList] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const activeConfig = useMemo(() => importConfigs[entityType], [entityType]);
  const validation = useMemo(() => validateParsedCsv(csvText, activeConfig), [csvText, activeConfig]);

  const currentStep = useMemo(() => {
    if (result) {
      return 5;
    }
    if (hasValidated) {
      return 4;
    }
    if (csvText.trim()) {
      return 3;
    }
    if (templateTouched) {
      return 2;
    }
    return 1;
  }, [csvText, hasValidated, result, templateTouched]);

  const failedImportRows = useMemo(() => {
    if (!result?.results?.length) {
      return [];
    }

    const byRowNumber = new Map(validation.rows.map((row) => [row.__rowNumber, row]));
    return result.results
      .filter((item) => item.status === "error")
      .map((item) => ({
        rowNumber: item.rowNumber,
        error: item.error || "",
        row: byRowNumber.get(item.rowNumber) || null,
      }));
  }, [result, validation.rows]);

  const samplePreview = useMemo(() => activeConfig.csv.split("\n").slice(0, 4).join("\n"), [activeConfig]);

  const handleEntityTypeChange = (nextEntityType) => {
    setEntityType(nextEntityType);
    setCsvText(importConfigs[nextEntityType].csv);
    setResult(null);
    setMessage("");
    setSelectedFile(null);
    setHasValidated(false);
    setTemplateTouched(false);
  };

  const handleCsvChange = (nextValue) => {
    setCsvText(nextValue);
    setResult(null);
    setMessage("");
    setHasValidated(false);
  };

  const loadFileIntoEditor = async (file) => {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setMessageTone("error");
      setMessage("Only CSV files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setMessageTone("error");
      setMessage("CSV file is too large. Please keep it under 2 MB.");
      return;
    }

    const text = await file.text();
    setSelectedFile({
      name: file.name,
      size: file.size,
    });
    handleCsvChange(text);
    setMessageTone("info");
    setMessage(`Loaded ${file.name} (${formatBytes(file.size)})`);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await loadFileIntoEditor(file);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    await loadFileIntoEditor(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([activeConfig.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entityType}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setTemplateTouched(true);
    setMessageTone("info");
    setMessage(`${activeConfig.label} template downloaded.`);
  };

  const handleValidate = () => {
    setHasValidated(true);
    setResult(null);

    if (validation.parseError) {
      setMessageTone("error");
      setMessage(validation.parseError);
      return;
    }

    if (validation.missingColumns.length > 0) {
      setMessageTone("error");
      setMessage(`Missing required columns: ${validation.missingColumns.join(", ")}`);
      return;
    }

    if (validation.invalidRows > 0) {
      setMessageTone("info");
      setMessage(`Validation finished. ${validation.validRows} rows look ready and ${validation.invalidRows} rows need fixes.`);
      return;
    }

    setMessageTone("success");
    setMessage(`Validation passed. ${validation.validRows} rows are ready to import.`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasValidated) {
      handleValidate();
      return;
    }

    if (!validation.readyToImport || validation.missingColumns.length > 0) {
      setMessageTone("error");
      setMessage("Please fix the CSV issues before starting the bulk import.");
      return;
    }

    try {
      setSubmitting(true);
      setResult(null);
      const { data } = await api.post("/bulk-import", { entityType, csvText });
      setResult(data);
      setMessageTone(data.failureCount > 0 ? "info" : "success");
      setMessage(data.message);
    } catch (error) {
      setMessageTone("error");
      setMessage(error.response?.data?.message || "Bulk import failed");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFailedRowsCsv = () => {
    if (!failedImportRows.length) {
      return;
    }

    const rawHeaders = validation.rawHeaders.length > 0 ? validation.rawHeaders : validation.headers;
    const headerLine = [...rawHeaders, "import_error"].map(toCsvValue).join(",");
    const bodyLines = failedImportRows.map(({ row, error }) => {
      const values = rawHeaders.map((header, index) => {
        const fallbackKey = validation.headers[index];
        return row?.__rawRow?.[header] ?? row?.[fallbackKey] ?? "";
      });
      return [...values, error].map(toCsvValue).join(",");
    });

    const blob = new Blob([[headerLine, ...bodyLines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entityType}-failed-rows.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderTypeCard = (typeKey, config, disabled = false, note = "") => {
    const Icon = config.icon;
    const isSelected = entityType === typeKey;

    return (
      <button
        key={typeKey}
        type="button"
        onClick={() => !disabled && handleEntityTypeChange(typeKey)}
        disabled={disabled}
        className={`group relative overflow-hidden rounded-[1.45rem] border p-4 text-left transition ${
          isSelected
            ? "border-transparent bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] dark:bg-slate-100 dark:text-slate-900"
            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700"
        } ${disabled ? "cursor-not-allowed opacity-55" : ""}`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 transition ${
            isSelected
              ? "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_36%),linear-gradient(135deg,rgba(45,212,191,0.18),transparent_58%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_36%),linear-gradient(135deg,rgba(15,118,110,0.12),transparent_58%)]"
              : "bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.08),transparent_34%)] opacity-0 group-hover:opacity-100"
          }`}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="relative min-w-0">
            <p className={`text-sm font-semibold ${isSelected ? "text-white dark:text-slate-900" : "text-ink dark:text-white"}`}>{config.label}</p>
            <p
              className={`mt-2 max-w-[34ch] text-sm leading-6 ${isSelected ? "text-white/78 dark:text-slate-700" : "text-slate-500 dark:text-slate-400"}`}
            >
              {note || config.description}
            </p>
          </div>
          <span
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isSelected ? "bg-white/15 dark:bg-slate-900/10" : "bg-slate-100 dark:bg-slate-900"
            }`}
          >
            <Icon size={18} />
          </span>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Bulk Import"
          description="Move from raw CSV upload to a guided ERP onboarding workflow with validation and import review."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="space-y-6">
            <div className="skeleton-surface rounded-[1.75rem] p-6 shadow-card">
              <div className="grid gap-4 md:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <SkeletonBlock className="mb-3 h-8 w-8 rounded-2xl" />
                    <SkeletonBlock className="h-3 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="skeleton-surface rounded-[1.75rem] p-6 shadow-card space-y-4">
              <SkeletonLines lines={["w-40", "w-5/6"]} />
              <div className="grid gap-4 md:grid-cols-2">
                <SkeletonBlock className="h-32 rounded-[1.4rem]" />
                <SkeletonBlock className="h-32 rounded-[1.4rem]" />
              </div>
              <SkeletonBlock className="h-56 rounded-[1.6rem]" />
              <SkeletonButton className="w-40" />
            </div>
          </div>
          <div className="skeleton-surface rounded-[1.75rem] p-6 shadow-card space-y-4">
            <SkeletonLines lines={["w-28", "w-3/4"]} />
            <div className="grid gap-3 sm:grid-cols-2">
              <SkeletonBlock className="h-24 rounded-[1.25rem]" />
              <SkeletonBlock className="h-24 rounded-[1.25rem]" />
              <SkeletonBlock className="h-24 rounded-[1.25rem]" />
              <SkeletonBlock className="h-24 rounded-[1.25rem]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Bulk Import"
        description="Guide institute teams through template download, CSV prep, preview validation, and record import without changing the existing backend workflow."
      />

      <AlertMessage tone={messageTone} message={message} />

      <div className={cardClassName}>
        <div className="grid gap-3 md:grid-cols-5">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const state = stepNumber < currentStep ? "done" : stepNumber === currentStep ? "active" : "pending";
            return (
              <div key={label} className={`rounded-[1.25rem] border p-4 ${stepClasses(state)}`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-sm font-semibold dark:bg-slate-900/30">
                    {state === "done" ? <FiCheckCircle size={16} /> : stepNumber}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">Step {stepNumber}</p>
                    <p className="mt-1 text-sm font-semibold">{label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={cardClassName}>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Step 1</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-white">Select Import Type</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Choose what you want to import. Required columns and sample template update automatically.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {primaryImportTypes.map((typeKey) => renderTypeCard(typeKey, importConfigs[typeKey]))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {secondaryImportTypes.map((typeKey) => renderTypeCard(typeKey, importConfigs[typeKey]))}
              {unsupportedImportTypes.map((item) =>
                renderTypeCard(item.key, { label: item.label, description: item.note, icon: item.icon }, true, item.note)
              )}
            </div>
          </div>

          <div className={cardClassName}>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Step 2</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-white">Download Template</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Start with a clean template, confirm required columns, then share the sample format with your data team.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
                  className="inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-500/15"
                >
                  <FiDownload size={16} />
                  Download CSV Template
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowColumnsList((current) => !current);
                    setTemplateTouched(true);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <FiBookOpen size={16} />
                  {showColumnsList ? "Hide Required Columns" : "View Required Columns"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className={mutedCardClassName}>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500" size={16} />
                  <p className="text-sm font-semibold text-ink dark:text-white">Required Columns</p>
                </div>
                {showColumnsList ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeConfig.requiredColumns.map((column) => (
                      <span
                        key={column}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
                      >
                        {column}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    Required columns list is hidden. Use the button above to review it again.
                  </p>
                )}

                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Optional but useful</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{activeConfig.optionalColumns.join(", ")}</p>
                </div>
              </div>

              <div className={mutedCardClassName}>
                <div className="flex items-center gap-2">
                  <FiFileText className="text-sky-500" size={16} />
                  <p className="text-sm font-semibold text-ink dark:text-white">Sample CSV Format Preview</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{activeConfig.description}</p>
                <pre className="mt-4 overflow-x-auto rounded-[1rem] bg-slate-950 px-4 py-4 font-mono text-[12px] leading-6 text-slate-100">
                  {samplePreview}
                </pre>
              </div>
            </div>
          </div>

          <div className={cardClassName}>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Step 3</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-white">Upload CSV or Paste CSV</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Drag and drop a CSV file, choose a file manually, or paste raw CSV with the header row included.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`rounded-[1.6rem] border-2 border-dashed p-5 transition ${
                  dragActive
                    ? "border-sky-400 bg-sky-50 dark:border-sky-400 dark:bg-sky-500/10"
                    : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60"
                }`}
              >
                <div className="flex h-full flex-col items-start justify-between gap-5">
                  <div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                      <FiUploadCloud size={22} />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-ink dark:text-white">Upload CSV file</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      CSV only, up to 2 MB. Header row is required and should match the template columns.
                    </p>
                  </div>

                  <div className="w-full space-y-3">
                    <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <FiUploadCloud size={16} />
                      Choose CSV File
                    </button>

                    <div className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      {selectedFile ? (
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate font-medium text-ink dark:text-white">{selectedFile.name}</span>
                          <span className="shrink-0 text-xs text-slate-400">{formatBytes(selectedFile.size)}</span>
                        </div>
                      ) : (
                        <span>No file selected yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={mutedCardClassName}>
                <div className="flex items-center gap-2">
                  <FiCopy className="text-violet-500" size={16} />
                  <p className="text-sm font-semibold text-ink dark:text-white">Paste CSV Data</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Paste comma-separated CSV data including the header row.
                </p>
                <textarea
                  value={csvText}
                  onChange={(event) => handleCsvChange(event.target.value)}
                  rows={16}
                  className="mt-4 w-full rounded-[1.2rem] border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-[12px] leading-6 text-slate-100 outline-none transition focus:border-slate-400 dark:border-slate-700"
                  placeholder={`name,email,password\nJohn Doe,john@example.com,Password@123`}
                />
              </div>
            </div>
          </div>

          <div className={cardClassName}>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Step 4</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-white">Preview & Validate</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Review detected columns, preview the first few rows, and catch structural issues before import.
                </p>
              </div>
              <button
                type="button"
                onClick={handleValidate}
                disabled={!csvText.trim()}
                style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
                className="inline-flex h-11 items-center justify-center px-5 text-sm font-semibold text-white shadow-lg shadow-teal-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Validating..." : "Validate CSV"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                { label: "Total Rows", value: validation.totalRows, tone: "bg-slate-50 text-slate-700 dark:bg-slate-950/60 dark:text-slate-200" },
                { label: "Valid Rows", value: validation.validRows, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
                { label: "Invalid Rows", value: validation.invalidRows, tone: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
                { label: "Duplicate Rows", value: validation.duplicateRows, tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
                { label: "Missing Fields", value: validation.missingRequiredFields, tone: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
              ].map((item) => (
                <div key={item.label} className={`rounded-[1.25rem] p-4 ${item.tone}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            {validation.parseError ? (
              <div className="mt-5 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                {validation.parseError}
              </div>
            ) : null}

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className={mutedCardClassName}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-white">Detected Columns</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{validation.columnsDetected} columns detected</p>
                  </div>
                  {validation.missingColumns.length > 0 ? (
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      Missing required columns
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      Structure looks good
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {validation.headers.length > 0 ? (
                    validation.headers.map((header) => (
                      <span
                        key={header}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          activeConfig.requiredColumns.includes(header)
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                            : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                        }`}
                      >
                        {header}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Load a CSV to inspect the detected columns.</p>
                  )}
                </div>

                {validation.missingColumns.length > 0 ? (
                  <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                    Missing required columns: {validation.missingColumns.join(", ")}
                  </div>
                ) : null}

                {validation.extraColumns.length > 0 ? (
                  <div className="mt-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    Extra columns detected: {validation.extraColumns.join(", ")}
                  </div>
                ) : null}
              </div>

              <div className={mutedCardClassName}>
                <div className="flex items-center gap-2">
                  <FiClock className="text-slate-500" size={16} />
                  <p className="text-sm font-semibold text-ink dark:text-white">Sample CSV reminder</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Keep the header row exactly aligned with the template. For multi-value cells, use `|` separators where supported.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-[1rem] bg-slate-950 px-4 py-4 font-mono text-[12px] leading-6 text-slate-100">
                  {samplePreview}
                </pre>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-white">Preview Table</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Showing first {Math.min(validation.previewRows.length, 8)} rows before import.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                  Row count: {validation.totalRows}
                </span>
              </div>

              <div className="overflow-x-auto">
                {validation.previewRows.length > 0 ? (
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 font-medium">Row</th>
                        {validation.headers.map((header) => (
                          <th key={header} className="px-4 py-3 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validation.previewRows.map((row) => (
                        <tr key={row.__rowNumber} className="border-t border-slate-100 align-top dark:border-slate-800">
                          <td className="px-4 py-3 font-semibold text-ink dark:text-white">{row.__rowNumber}</td>
                          {validation.headers.map((header) => (
                            <td key={`${row.__rowNumber}-${header}`} className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {row[header] || <span className="text-slate-400 dark:text-slate-500">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">
                    Load CSV data to generate a preview table here.
                  </div>
                )}
              </div>
            </div>

            {hasValidated && validation.rowErrors.length > 0 ? (
              <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-rose-200 dark:border-rose-500/20">
                <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 dark:border-rose-500/20 dark:bg-rose-500/10">
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Validation Errors</p>
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-300/80">Review row-level issues before starting the import.</p>
                </div>
                <div className="max-h-[24rem] overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 dark:bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 font-medium">Row Number</th>
                        <th className="px-4 py-3 font-medium">Field</th>
                        <th className="px-4 py-3 font-medium">Error</th>
                        <th className="px-4 py-3 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.rowErrors.map((errorItem, index) => (
                        <tr key={`${errorItem.rowNumber}-${errorItem.field}-${index}`} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-3 font-semibold text-ink dark:text-white">{errorItem.rowNumber}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{errorItem.field}</td>
                          <td className="px-4 py-3 text-rose-700 dark:text-rose-300">{errorItem.error}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{errorItem.value || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

          <div className={cardClassName}>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Step 5</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-white">Import Records</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Once the CSV is validated, launch the existing bulk import API and review row-wise results.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!hasValidated ? !csvText.trim() : !validation.readyToImport || submitting}
                style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }}
                className="inline-flex h-11 items-center justify-center px-5 text-sm font-semibold text-white shadow-lg shadow-teal-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (hasValidated ? "Importing..." : "Validating...") : hasValidated ? "Start Bulk Import" : "Validate CSV"}
              </button>
              <button
                type="button"
                onClick={() => navigate(activeConfig.route)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                View imported records
              </button>
            </div>

            {result ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Successfully imported {result.successCount} records
                  </p>
                  <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
                    Failed {result.failureCount} records
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={downloadFailedRowsCsv}
                    disabled={!failedImportRows.length}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    <FiDownload size={16} />
                    Download Failed Rows CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(activeConfig.route)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    <FiUsers size={16} />
                    View Imported Records
                  </button>
                </div>

                <div className="max-h-[22rem] overflow-auto rounded-[1.4rem] border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/50">
                      <tr>
                        <th className="px-4 py-3 font-medium">Row</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map((item) => (
                        <tr key={`${item.rowNumber}-${item.status}`} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-3 font-semibold text-ink dark:text-white">{item.rowNumber}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === "success"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.error || item.summary || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </form>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className={cardClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Import Summary</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-white">Workflow Status</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Track readiness before you hit the final import action.
            </p>

            <div className="mt-5 space-y-3">
              {[
                { label: "Selected import type", value: activeConfig.label, ready: true },
                { label: "Template status", value: templateTouched ? "Template reviewed" : "Template ready to download", ready: templateTouched },
                { label: "CSV loaded status", value: csvText.trim() ? (selectedFile ? selectedFile.name : "CSV data pasted") : "Waiting for CSV", ready: Boolean(csvText.trim()) },
                { label: "Total rows", value: validation.totalRows || "0", ready: validation.totalRows > 0 },
                { label: "Valid rows", value: validation.validRows || "0", ready: validation.validRows > 0 },
                { label: "Invalid rows", value: validation.invalidRows || "0", ready: validation.invalidRows === 0 && hasValidated },
                { label: "Import readiness", value: validation.readyToImport && hasValidated ? "Yes" : "No", ready: validation.readyToImport && hasValidated },
              ].map((item) => (
                <div key={item.label} className={`${mutedCardClassName} flex items-center justify-between gap-3`}>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-ink dark:text-white">{item.value}</p>
                  </div>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      item.ready
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500"
                    }`}
                  >
                    {item.ready ? <FiCheckCircle size={16} /> : <FiClock size={16} />}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-amber-500">
                  <FiAlertCircle size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-white">Readiness note</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Import stays disabled until CSV data is present, required columns are detected, and validation has been run.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default BulkImport;
