const calculateFineAmount = (dueDate, returnDate) => {
  if (!dueDate || !returnDate) return 0;

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const returned = new Date(returnDate);
  returned.setHours(0, 0, 0, 0);

  if (returned <= due) return 0;

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const lateDays = Math.ceil((returned - due) / millisecondsPerDay);
  return lateDays * 5;
};

const getIssueStatus = (issue) => {
  if (issue.status === "lost") return "lost";
  if (issue.returnDate || issue.status === "returned") return "returned";
  if (issue.dueDate && new Date(issue.dueDate) < new Date()) return "overdue";
  return "issued";
};

const sanitizeLibraryBook = (book) => ({
  _id: book._id,
  instituteId: book.instituteId,
  title: book.title,
  author: book.author,
  isbn: book.isbn,
  category: book.category,
  subjectId: book.subjectId,
  academicGroupId: book.academicGroupId,
  publisher: book.publisher,
  edition: book.edition,
  language: book.language,
  shelfNumber: book.shelfNumber,
  totalCopies: book.totalCopies,
  availableCopies: book.availableCopies,
  status: book.status,
  createdBy: book.createdBy,
  updatedBy: book.updatedBy,
  createdAt: book.createdAt,
  updatedAt: book.updatedAt,
});

const sanitizeBookIssue = (issue) => ({
  _id: issue._id,
  instituteId: issue.instituteId,
  bookId: issue.bookId,
  studentId: issue.studentId,
  issuedBy: issue.issuedBy,
  issueDate: issue.issueDate,
  dueDate: issue.dueDate,
  returnDate: issue.returnDate,
  fineAmount: issue.fineAmount,
  status: getIssueStatus(issue),
  remarks: issue.remarks,
  createdBy: issue.createdBy,
  updatedBy: issue.updatedBy,
  createdAt: issue.createdAt,
  updatedAt: issue.updatedAt,
});

export { calculateFineAmount, getIssueStatus, sanitizeLibraryBook, sanitizeBookIssue };
