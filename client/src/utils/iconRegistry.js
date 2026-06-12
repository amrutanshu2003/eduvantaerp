import {
  FiBookOpen,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiCreditCard,
  FiEdit,
  FiFileText,
  FiHome,
  FiInfo,
  FiLayers,
  FiMap,
  FiPackage,
  FiPlusSquare,
  FiSettings,
  FiShield,
  FiTruck,
  FiUser,
  FiUsers,
} from "react-icons/fi";

export const ICON_OPTIONS = [
  { key: "home", name: "Home", component: FiHome },
  { key: "user", name: "User", component: FiUser },
  { key: "users", name: "Users", component: FiUsers },
  { key: "shield", name: "Shield", component: FiShield },
  { key: "layers", name: "Layers", component: FiLayers },
  { key: "book-open", name: "Book Open", component: FiBookOpen },
  { key: "check-square", name: "Check Square", component: FiCheckSquare },
  { key: "calendar", name: "Calendar", component: FiCalendar },
  { key: "edit", name: "Edit", component: FiEdit },
  { key: "file-text", name: "File Text", component: FiFileText },
  { key: "credit-card", name: "Credit Card", component: FiCreditCard },
  { key: "clock", name: "Clock", component: FiClock },
  { key: "truck", name: "Truck", component: FiTruck },
  { key: "map", name: "Map", component: FiMap },
  { key: "package", name: "Package", component: FiPackage },
  { key: "plus-square", name: "Plus Square", component: FiPlusSquare },
  { key: "settings", name: "Settings", component: FiSettings },
  { key: "info", name: "Info", component: FiInfo },
];

const ICON_LOOKUP = new Map(ICON_OPTIONS.map((option) => [option.key, option]));

export const getIconOption = (iconKey) => ICON_LOOKUP.get(iconKey) || ICON_LOOKUP.get("info");

export const normalizeCustomSidebarItem = (item) => {
  const fallbackKey = item?.icon?.key || item?.iconKey || "info";
  const icon = getIconOption(fallbackKey);

  return {
    label: item?.label || "",
    path: item?.path || "",
    iconKey: icon.key,
    icon: {
      key: icon.key,
      name: icon.name,
      component: icon.component,
    },
  };
};

export const serializeCustomSidebarItem = (item) => ({
  label: item?.label || "",
  path: item?.path || "",
  iconKey: item?.iconKey || item?.icon?.key || "info",
});
