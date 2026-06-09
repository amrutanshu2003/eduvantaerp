const getPayableAmount = (fee) => {
  const amount = Number(fee.amount || 0);
  const discount = Number(fee.discount || 0);
  const fine = Number(fee.fine || 0);

  return Math.max(0, amount - discount + fine);
};

const getFeeStatus = (fee) => {
  const payableAmount = getPayableAmount(fee);
  const paidAmount = Number(fee.paidAmount || 0);
  const dueDate = fee.dueDate ? new Date(fee.dueDate) : null;
  const now = new Date();

  if (paidAmount >= payableAmount && payableAmount >= 0) {
    return "paid";
  }

  if (paidAmount > 0 && paidAmount < payableAmount) {
    return dueDate && dueDate < now ? "overdue" : "partial";
  }

  if (dueDate && dueDate < now) {
    return "overdue";
  }

  return "unpaid";
};

const sanitizeFee = (fee) => ({
  _id: fee._id,
  instituteId: fee.instituteId,
  studentId: fee.studentId,
  academicGroupId: fee.academicGroupId,
  feeType: fee.feeType,
  title: fee.title,
  description: fee.description,
  amount: fee.amount,
  discount: fee.discount,
  fine: fee.fine,
  paidAmount: fee.paidAmount,
  payableAmount: getPayableAmount(fee),
  dueDate: fee.dueDate,
  paymentDate: fee.paymentDate,
  paymentMethod: fee.paymentMethod,
  transactionId: fee.transactionId,
  status: getFeeStatus(fee),
  createdBy: fee.createdBy,
  updatedBy: fee.updatedBy,
  createdAt: fee.createdAt,
  updatedAt: fee.updatedAt,
});

export { getPayableAmount, getFeeStatus, sanitizeFee };
