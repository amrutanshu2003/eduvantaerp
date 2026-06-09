const bookCategoryOptions = ["textbook", "reference", "novel", "magazine", "research", "other"];
const bookStatusOptions = ["active", "inactive"];
const issueStatusOptions = ["issued", "returned", "overdue", "lost"];

const bookFormDefaults = {
  title: "",
  author: "",
  isbn: "",
  category: "textbook",
  subjectId: "",
  academicGroupId: "",
  publisher: "",
  edition: "",
  language: "",
  shelfNumber: "",
  totalCopies: 1,
  availableCopies: 1,
  status: "active",
};

const issueFormDefaults = {
  bookId: "",
  studentId: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  fineAmount: 0,
  remarks: "",
};

export { bookCategoryOptions, bookStatusOptions, issueStatusOptions, bookFormDefaults, issueFormDefaults };
