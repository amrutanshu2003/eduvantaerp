const feeTypeOptions = ["tuition", "admission", "exam", "transport", "hostel", "library", "lab", "other"];
const feeStatusOptions = ["unpaid", "partial", "paid", "overdue"];
const paymentMethodOptions = ["none", "cash", "online", "card", "upi", "bank_transfer", "cheque"];

const feeFormDefaults = {
  studentId: "",
  academicGroupId: "",
  feeType: "tuition",
  title: "",
  description: "",
  amount: "",
  discount: 0,
  fine: 0,
  paidAmount: 0,
  dueDate: "",
  paymentDate: "",
  paymentMethod: "none",
  transactionId: "",
};

const feePaymentDefaults = {
  paidAmount: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: "cash",
  transactionId: "",
};

export { feeTypeOptions, feeStatusOptions, paymentMethodOptions, feeFormDefaults, feePaymentDefaults };
