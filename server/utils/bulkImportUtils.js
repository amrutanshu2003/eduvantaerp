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

const parseCsv = (csvText) => {
  const text = String(csvText || "").replace(/\r/g, "").trim();
  if (!text) {
    return { headers: [], rows: [] };
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row");
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  if (headers.some((header) => !header)) {
    throw new Error("CSV headers cannot be empty");
  }

  const rows = lines.slice(1).map((line, rowIndex) => {
    const cells = splitCsvLine(line);
    const row = {};

    headers.forEach((header, cellIndex) => {
      row[header] = cells[cellIndex] ?? "";
    });

    row.__rowNumber = rowIndex + 2;
    return row;
  });

  return { headers, rows };
};

const splitPipeValues = (value) =>
  String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const coerceStatus = (value) => {
  const normalized = String(value || "active").trim().toLowerCase();
  if (!normalized) {
    return "active";
  }
  if (!["active", "inactive"].includes(normalized)) {
    throw new Error("Status must be active or inactive");
  }
  return normalized;
};

const coerceDate = (value) => {
  if (!String(value || "").trim()) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return parsedDate;
};

const coerceNumber = (value, fieldName) => {
  if (!String(value || "").trim()) {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return parsed;
};

const buildAcademicGroupLookupKey = (payload, instituteType) => {
  if (instituteType === "school") {
    return [
      instituteType,
      String(payload.schoolLevel || "").trim().toLowerCase(),
      String(payload.className || "").trim().toLowerCase(),
      String(payload.section || "").trim().toLowerCase(),
    ].join("|");
  }

  return [
    instituteType,
    String(payload.programLevel || "").trim().toLowerCase(),
    String(payload.department || "").trim().toLowerCase(),
    String(payload.course || "").trim().toLowerCase(),
    String(payload.section || "").trim().toLowerCase(),
    String(payload.semester || "").trim().toLowerCase(),
    String(payload.year || "").trim().toLowerCase(),
    String(payload.batch || "").trim().toLowerCase(),
  ].join("|");
};

const getTrimmedValue = (row, key) => String(row[key] || "").trim();

export {
  buildAcademicGroupLookupKey,
  coerceDate,
  coerceNumber,
  coerceStatus,
  getTrimmedValue,
  parseCsv,
  splitPipeValues,
};
