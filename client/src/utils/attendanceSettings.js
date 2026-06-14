const DEFAULT_ATTENDANCE_SETTINGS = {
  goodThreshold: 80,
  warningThreshold: 60,
  goodColor: "#16a34a",
  warningColor: "#f8e58c",
  criticalColor: "#ef4444",
};

const clampPercentage = (value, fallback) => {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(numericValue, 0), 100);
};

const normalizeHexColor = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return /^#([0-9a-fA-F]{6})$/.test(trimmed) ? trimmed : fallback;
};

const toRgb = (hex) => {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

export const withAlpha = (hex, alpha) => {
  const { r, g, b } = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getAttendanceSettings = (settings = {}) => {
  const goodThreshold = clampPercentage(settings.attendanceGoodThreshold, DEFAULT_ATTENDANCE_SETTINGS.goodThreshold);
  const warningThresholdRaw = clampPercentage(settings.attendanceWarningThreshold, DEFAULT_ATTENDANCE_SETTINGS.warningThreshold);
  const warningThreshold = Math.min(warningThresholdRaw, Math.max(goodThreshold - 1, 0));

  return {
    goodThreshold,
    warningThreshold,
    goodColor: normalizeHexColor(settings.attendanceGoodColor, DEFAULT_ATTENDANCE_SETTINGS.goodColor),
    warningColor: normalizeHexColor(settings.attendanceWarningColor, DEFAULT_ATTENDANCE_SETTINGS.warningColor),
    criticalColor: normalizeHexColor(settings.attendanceCriticalColor, DEFAULT_ATTENDANCE_SETTINGS.criticalColor),
  };
};

export const getAttendanceBand = (percentage, totalUnits, settings = {}) => {
  const attendanceSettings = getAttendanceSettings(settings);

  if (!totalUnits) {
    return {
      key: "no-data",
      label: "No Data",
      toneColor: "#64748b",
      ...attendanceSettings,
    };
  }

  if (percentage >= attendanceSettings.goodThreshold) {
    return {
      key: "good",
      label: "Good Standing",
      toneColor: attendanceSettings.goodColor,
      ...attendanceSettings,
    };
  }

  if (percentage >= attendanceSettings.warningThreshold) {
    return {
      key: "warning",
      label: "Needs Attention",
      toneColor: attendanceSettings.warningColor,
      ...attendanceSettings,
    };
  }

  return {
    key: "critical",
    label: "Critical",
    toneColor: attendanceSettings.criticalColor,
    ...attendanceSettings,
  };
};

export const DEFAULT_ATTENDANCE_UI_SETTINGS = {
  attendanceGoodThreshold: DEFAULT_ATTENDANCE_SETTINGS.goodThreshold,
  attendanceWarningThreshold: DEFAULT_ATTENDANCE_SETTINGS.warningThreshold,
  attendanceGoodColor: DEFAULT_ATTENDANCE_SETTINGS.goodColor,
  attendanceWarningColor: DEFAULT_ATTENDANCE_SETTINGS.warningColor,
  attendanceCriticalColor: DEFAULT_ATTENDANCE_SETTINGS.criticalColor,
};
