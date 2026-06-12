import AcademicGroup from "../models/AcademicGroup.js";
import BookIssue from "../models/BookIssue.js";
import LibraryBook from "../models/LibraryBook.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import createAuditLog from "../utils/audit.js";
import { calculateFineAmount, getIssueStatus, sanitizeBookIssue, sanitizeLibraryBook } from "../utils/libraryUtils.js";
import { ensureParentStudentAccess, getStudentProfileForUser } from "../utils/roleAccess.js";
import { ensureInstituteScope, getScopedInstituteId } from "../utils/scope.js";
import { getUserModelName } from "../utils/userModel.js";
import { createNotification, getParentUserIdsForStudent } from "../utils/notificationUtils.js";

const populateBook = (query) =>
  query
    .populate("subjectId", "subjectName subjectCode")
    .populate("academicGroupId", "className section department course semester year batch")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role");

const populateIssue = (query) =>
  query
    .populate("bookId", "title author isbn category shelfNumber")
    .populate("studentId", "name email phone role status rollNumber admissionNumber academicGroupId instituteId")
    .populate("issuedBy", "name role")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role");

const validateBookPayload = async (req, payload) => {
  const instituteId = getScopedInstituteId(req, false);

  if (!payload.title?.trim() || !payload.author?.trim() || payload.totalCopies === undefined) {
    return "Title, author, and total copies are required";
  }

  if (Number(payload.totalCopies) < 0 || Number(payload.availableCopies ?? payload.totalCopies) < 0) {
    return "Copies cannot be negative";
  }

  if (Number(payload.availableCopies ?? payload.totalCopies) > Number(payload.totalCopies)) {
    return "Available copies cannot exceed total copies";
  }

  if (payload.subjectId) {
    const subject = await Subject.findOne({ _id: payload.subjectId, instituteId, isDeleted: false });
    if (!subject) return "Subject not found for this institute";
  }

  if (payload.academicGroupId) {
    const group = await AcademicGroup.findOne({ _id: payload.academicGroupId, instituteId, isDeleted: false });
    if (!group) return "Academic group not found for this institute";
  }

  return null;
};

const createBook = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const actorModel = getUserModelName(req.user?.role);
    const validationError = await validateBookPayload(req, req.body);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const book = await LibraryBook.create({
      instituteId,
      title: req.body.title.trim(),
      author: req.body.author.trim(),
      isbn: req.body.isbn?.trim() || "",
      category: req.body.category || "textbook",
      subjectId: req.body.subjectId || null,
      academicGroupId: req.body.academicGroupId || null,
      publisher: req.body.publisher?.trim() || "",
      edition: req.body.edition?.trim() || "",
      language: req.body.language?.trim() || "",
      shelfNumber: req.body.shelfNumber?.trim() || "",
      totalCopies: Number(req.body.totalCopies),
      availableCopies: Number(req.body.availableCopies ?? req.body.totalCopies),
      status: req.body.status || "active",
      createdBy: req.user._id,
      createdByModel: actorModel,
      updatedBy: req.user._id,
      updatedByModel: actorModel,
    });

    await createAuditLog({
      req,
      instituteId,
      action: "create",
      entity: "library_book",
      entityId: book._id,
      message: "Library book created",
    });

    res.status(201).json({ message: "Book created successfully", book: sanitizeLibraryBook(book) });
  } catch (error) {
    next(error);
  }
};

const getBooks = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const query = { instituteId, isDeleted: false };

    if (req.query.category && req.query.category !== "all") query.category = req.query.category;
    if (req.query.status && req.query.status !== "all") query.status = req.query.status;
    if (req.query.search?.trim()) {
      query.$or = [
        { title: { $regex: req.query.search.trim(), $options: "i" } },
        { author: { $regex: req.query.search.trim(), $options: "i" } },
        { isbn: { $regex: req.query.search.trim(), $options: "i" } },
      ];
    }

    const books = await populateBook(LibraryBook.find(query).sort({ createdAt: -1 }));
    res.json({ books: books.map(sanitizeLibraryBook) });
  } catch (error) {
    next(error);
  }
};

const getBookById = async (req, res, next) => {
  try {
    const book = await populateBook(LibraryBook.findOne({ _id: req.params.id, isDeleted: false }));
    if (!book) {
      res.status(404);
      throw new Error("Book not found");
    }
    if (!ensureInstituteScope(req, book.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this book");
    }

    res.json({ book: sanitizeLibraryBook(book) });
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const book = await LibraryBook.findOne({ _id: req.params.id, isDeleted: false });
    if (!book) {
      res.status(404);
      throw new Error("Book not found");
    }
    if (!ensureInstituteScope(req, book.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this book");
    }

    const validationError = await validateBookPayload(req, { ...book.toObject(), ...req.body });
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const issuedCopies = Number(book.totalCopies) - Number(book.availableCopies);
    const nextTotalCopies = Number(req.body.totalCopies ?? book.totalCopies);
    const nextAvailableCopies = req.body.availableCopies !== undefined ? Number(req.body.availableCopies) : nextTotalCopies - issuedCopies;

    if (nextAvailableCopies < 0) {
      res.status(400);
      throw new Error("Available copies cannot be negative");
    }
    if (nextAvailableCopies > nextTotalCopies) {
      res.status(400);
      throw new Error("Available copies cannot exceed total copies");
    }

    Object.assign(book, {
      title: req.body.title?.trim() ?? book.title,
      author: req.body.author?.trim() ?? book.author,
      isbn: req.body.isbn?.trim() ?? book.isbn,
      category: req.body.category ?? book.category,
      subjectId: req.body.subjectId ?? book.subjectId,
      academicGroupId: req.body.academicGroupId ?? book.academicGroupId,
      publisher: req.body.publisher?.trim() ?? book.publisher,
      edition: req.body.edition?.trim() ?? book.edition,
      language: req.body.language?.trim() ?? book.language,
      shelfNumber: req.body.shelfNumber?.trim() ?? book.shelfNumber,
      totalCopies: nextTotalCopies,
      availableCopies: nextAvailableCopies,
      status: req.body.status ?? book.status,
      updatedBy: req.user._id,
      updatedByModel: actorModel,
    });

    await book.save();

    await createAuditLog({
      req,
      instituteId: book.instituteId,
      action: "update",
      entity: "library_book",
      entityId: book._id,
      message: "Library book updated",
    });

    res.json({ message: "Book updated successfully", book: sanitizeLibraryBook(book) });
  } catch (error) {
    next(error);
  }
};

const updateBookStatus = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    if (!["active", "inactive"].includes(req.body.status)) {
      res.status(400);
      throw new Error("Status must be active or inactive");
    }

    const book = await LibraryBook.findOne({ _id: req.params.id, isDeleted: false });
    if (!book) {
      res.status(404);
      throw new Error("Book not found");
    }
    if (!ensureInstituteScope(req, book.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this book");
    }

    book.status = req.body.status;
    book.updatedBy = req.user._id;
    book.updatedByModel = actorModel;
    await book.save();

    await createAuditLog({
      req,
      instituteId: book.instituteId,
      action: "status_update",
      entity: "library_book",
      entityId: book._id,
      message: `Library book marked ${req.body.status}`,
    });

    res.json({ message: "Book status updated successfully", book: sanitizeLibraryBook(book) });
  } catch (error) {
    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const book = await LibraryBook.findOne({ _id: req.params.id, isDeleted: false });
    if (!book) {
      res.status(404);
      throw new Error("Book not found");
    }
    if (!ensureInstituteScope(req, book.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this book");
    }

    book.isDeleted = true;
    book.deletedAt = new Date();
    book.status = "inactive";
    book.updatedBy = req.user._id;
    book.updatedByModel = actorModel;
    await book.save();

    await createAuditLog({
      req,
      instituteId: book.instituteId,
      action: "soft_delete",
      entity: "library_book",
      entityId: book._id,
      message: "Library book deleted",
    });

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const syncIssueStatus = async (issue) => {
  issue.status = getIssueStatus(issue);
  await issue.save();
};

const createIssue = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const actorModel = getUserModelName(req.user?.role);
    if (!req.body.bookId || !req.body.studentId || !req.body.issueDate || !req.body.dueDate) {
      res.status(400);
      throw new Error("Book, student, issue date, and due date are required");
    }

    const [book, student] = await Promise.all([
      LibraryBook.findOne({ _id: req.body.bookId, instituteId, isDeleted: false }),
      Student.findOne({ _id: req.body.studentId, instituteId, isDeleted: false }),
    ]);

    if (!book) {
      res.status(404);
      throw new Error("Book not found");
    }
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    if (book.availableCopies <= 0) {
      res.status(400);
      throw new Error("No available copies left for this book");
    }

    const duplicate = await BookIssue.findOne({
      instituteId,
      bookId: book._id,
      studentId: student._id,
      isDeleted: false,
      status: { $in: ["issued", "overdue", "lost"] },
      returnDate: null,
    });
    if (duplicate) {
      res.status(409);
      throw new Error("This book is already actively issued to the student");
    }

    const issue = await BookIssue.create({
      instituteId,
      bookId: book._id,
      studentId: student._id,
      issuedBy: req.user._id,
      issuedByModel: actorModel,
      issueDate: req.body.issueDate,
      dueDate: req.body.dueDate,
      fineAmount: Number(req.body.fineAmount || 0),
      status: "issued",
      remarks: req.body.remarks?.trim() || "",
      createdBy: req.user._id,
      createdByModel: actorModel,
      updatedBy: req.user._id,
      updatedByModel: actorModel,
    });

    book.availableCopies -= 1;
    book.updatedBy = req.user._id;
    await book.save();
    await syncIssueStatus(issue);

    // Notify student and parent when book is issued
    const recipientUserIds = [student.userId];
    const parentUserIds = await getParentUserIdsForStudent(student._id);
    recipientUserIds.push(...parentUserIds);

    await createNotification({
      instituteId,
      recipientUserId: recipientUserIds,
      title: `Book Issued: ${book.title}`,
      message: `You have been issued the book "${book.title}". Due date: ${new Date(issue.dueDate).toLocaleDateString()}`,
      type: "library",
      link: `/student/library`,
      priority: "normal",
      createdBy: req.user._id,
      metadata: { issueId: issue._id },
    });

    await createAuditLog({
      req,
      instituteId,
      action: "issue",
      entity: "book_issue",
      entityId: issue._id,
      message: "Book issued to student",
      metadata: { bookId: book._id, studentId: student._id },
    });

    const populatedIssue = await populateIssue(BookIssue.findById(issue._id));
    res.status(201).json({ message: "Book issued successfully", issue: sanitizeBookIssue(populatedIssue) });
  } catch (error) {
    next(error);
  }
};

const getIssues = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const query = { instituteId, isDeleted: false };
    if (req.query.studentId && req.query.studentId !== "all") query.studentId = req.query.studentId;
    if (req.query.status && req.query.status !== "all") query.status = req.query.status;

    const issues = await populateIssue(BookIssue.find(query).sort({ createdAt: -1 }));
    res.json({ issues: issues.map(sanitizeBookIssue) });
  } catch (error) {
    next(error);
  }
};

const getOverdueIssues = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const issues = await populateIssue(
      BookIssue.find({
        instituteId,
        isDeleted: false,
        returnDate: null,
        status: { $in: ["issued", "overdue"] },
      }).sort({ dueDate: 1 })
    );

    const overdueIssues = issues
      .map((issue) => ({ raw: issue, status: getIssueStatus(issue) }))
      .filter((entry) => entry.status === "overdue")
      .map((entry) => sanitizeBookIssue({ ...entry.raw.toObject(), status: entry.status }));

    res.json({ issues: overdueIssues });
  } catch (error) {
    next(error);
  }
};

const getIssuesByStudentId = async (req, res, next) => {
  try {
    const instituteId = getScopedInstituteId(req, false);
    const student = await Student.findOne({ _id: req.params.studentId, instituteId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const issues = await populateIssue(
      BookIssue.find({ instituteId, studentId: student._id, isDeleted: false }).sort({ createdAt: -1 })
    );

    res.json({ issues: issues.map(sanitizeBookIssue), studentId: student._id });
  } catch (error) {
    next(error);
  }
};

const getMyBooks = async (req, res, next) => {
  try {
    const student = await getStudentProfileForUser(req.user._id);
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }

    const issues = await populateIssue(
      BookIssue.find({ instituteId: student.instituteId, studentId: student._id, isDeleted: false }).sort({ createdAt: -1 })
    );

    res.json({ issues: issues.map(sanitizeBookIssue) });
  } catch (error) {
    next(error);
  }
};

const getChildBooks = async (req, res, next) => {
  try {
    const hasAccess = await ensureParentStudentAccess(req, req.params.studentId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("Access denied for this student");
    }

    const instituteId = getScopedInstituteId(req, false);
    const student = await Student.findOne({ _id: req.params.studentId, instituteId, isDeleted: false });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const issues = await populateIssue(
      BookIssue.find({ instituteId, studentId: student._id, isDeleted: false }).sort({ createdAt: -1 })
    );

    res.json({ issues: issues.map(sanitizeBookIssue) });
  } catch (error) {
    next(error);
  }
};

const getIssueById = async (req, res, next) => {
  try {
    const issue = await populateIssue(BookIssue.findOne({ _id: req.params.id, isDeleted: false }));
    if (!issue) {
      res.status(404);
      throw new Error("Book issue not found");
    }
    if (!ensureInstituteScope(req, issue.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this book issue");
    }

    res.json({ issue: sanitizeBookIssue(issue) });
  } catch (error) {
    next(error);
  }
};

const returnBook = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const issue = await BookIssue.findOne({ _id: req.params.id, isDeleted: false });
    if (!issue) {
      res.status(404);
      throw new Error("Book issue not found");
    }
    if (!ensureInstituteScope(req, issue.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this book issue");
    }
    if (issue.returnDate) {
      res.status(400);
      throw new Error("Book is already returned");
    }

    const book = await LibraryBook.findOne({ _id: issue.bookId, isDeleted: false });
    if (!book) {
      res.status(404);
      throw new Error("Book not found");
    }

    const returnDate = req.body.returnDate || new Date();
    issue.returnDate = returnDate;
    issue.fineAmount = req.body.fineAmount !== undefined ? Number(req.body.fineAmount) : calculateFineAmount(issue.dueDate, returnDate);
    issue.remarks = req.body.remarks?.trim() ?? issue.remarks;
    issue.status = "returned";
    issue.updatedBy = req.user._id;
    issue.updatedByModel = actorModel;
    await issue.save();

    book.availableCopies += 1;
    if (book.availableCopies > book.totalCopies) {
      book.availableCopies = book.totalCopies;
    }
    book.updatedBy = req.user._id;
    book.updatedByModel = actorModel;
    await book.save();

    // Notify student when book is returned
    const student = await Student.findById(issue.studentId).select("userId");
    if (student) {
      await createNotification({
        instituteId: issue.instituteId,
        recipientUserId: student.userId,
        title: `Book Returned: ${book.title}`,
        message: `The book "${book.title}" has been returned successfully${issue.fineAmount > 0 ? `. Fine: ${issue.fineAmount}` : ""}`,
        type: "library",
        link: `/student/library`,
        priority: issue.fineAmount > 0 ? "high" : "normal",
        createdBy: req.user._id,
        metadata: { issueId: issue._id },
      });
    }

    await createAuditLog({
      req,
      instituteId: issue.instituteId,
      action: "return",
      entity: "book_issue",
      entityId: issue._id,
      message: "Book returned",
      metadata: { bookId: book._id, studentId: issue.studentId },
    });

    const populatedIssue = await populateIssue(BookIssue.findById(issue._id));
    res.json({ message: "Book returned successfully", issue: sanitizeBookIssue(populatedIssue) });
  } catch (error) {
    next(error);
  }
};

const updateIssueFine = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const issue = await BookIssue.findOne({ _id: req.params.id, isDeleted: false });
    if (!issue) {
      res.status(404);
      throw new Error("Book issue not found");
    }
    if (!ensureInstituteScope(req, issue.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this book issue");
    }

    issue.fineAmount = Number(req.body.fineAmount || 0);
    issue.updatedBy = req.user._id;
    issue.updatedByModel = actorModel;
    await issue.save();

    await createAuditLog({
      req,
      instituteId: issue.instituteId,
      action: "fine_update",
      entity: "book_issue",
      entityId: issue._id,
      message: "Book issue fine updated",
    });

    const populatedIssue = await populateIssue(BookIssue.findById(issue._id));
    res.json({ message: "Fine updated successfully", issue: sanitizeBookIssue(populatedIssue) });
  } catch (error) {
    next(error);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    const actorModel = getUserModelName(req.user?.role);
    const issue = await BookIssue.findOne({ _id: req.params.id, isDeleted: false });
    if (!issue) {
      res.status(404);
      throw new Error("Book issue not found");
    }
    if (!ensureInstituteScope(req, issue.instituteId)) {
      res.status(403);
      throw new Error("Access denied for this book issue");
    }

    if (!issue.returnDate && ["issued", "overdue", "lost"].includes(issue.status)) {
      const book = await LibraryBook.findOne({ _id: issue.bookId, isDeleted: false });
      if (book) {
        book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
        book.updatedBy = req.user._id;
        book.updatedByModel = actorModel;
        await book.save();
      }
    }

    issue.isDeleted = true;
    issue.deletedAt = new Date();
    issue.updatedBy = req.user._id;
    issue.updatedByModel = actorModel;
    await issue.save();

    await createAuditLog({
      req,
      instituteId: issue.instituteId,
      action: "soft_delete",
      entity: "book_issue",
      entityId: issue._id,
      message: "Book issue deleted",
    });

    res.json({ message: "Book issue deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  updateBookStatus,
  deleteBook,
  createIssue,
  getIssues,
  getOverdueIssues,
  getIssuesByStudentId,
  getMyBooks,
  getChildBooks,
  getIssueById,
  returnBook,
  updateIssueFine,
  deleteIssue,
};
