const canManageTransport = (user) =>
  user?.role === "admin" ||
  user?.role === "superadmin" ||
  (user?.role === "staff" &&
    (user?.designation === "transport_staff" || (user?.permissions || []).includes("transport.manage")));

const isDriverUser = (user) => user?.role === "staff" && user?.designation === "driver";

export { canManageTransport, isDriverUser };
