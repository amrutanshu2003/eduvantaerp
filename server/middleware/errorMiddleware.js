const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (err?.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0];
    const fieldLabels = {
      email: "email",
      phone: "phone number",
      employeeId: "employee ID",
      staffId: "staff ID",
      rollNumber: "roll number",
      admissionNumber: "admission number",
      registrationNumber: "registration number",
    };

    const statusCode = 409;
    res.status(statusCode).json({
      message: `Duplicate ${fieldLabels[duplicateField] || duplicateField} is not allowed`,
      stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
    return;
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { notFound, errorHandler };
