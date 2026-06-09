import express from "express";
import {
  createBook,
  createIssue,
  deleteBook,
  deleteIssue,
  getBookById,
  getBooks,
  getChildBooks,
  getIssueById,
  getIssues,
  getIssuesByStudentId,
  getMyBooks,
  getOverdueIssues,
  returnBook,
  updateBook,
  updateBookStatus,
  updateIssueFine,
} from "../controllers/libraryController.js";
import { protect } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { requireLibraryManager } from "../utils/libraryAccess.js";

const router = express.Router();

router.use(protect);

router.get("/issues/my-books", allowRoles("student"), getMyBooks);
router.get("/issues/child/:studentId", allowRoles("parent"), getChildBooks);
router.get("/issues/student/:studentId", requireLibraryManager, getIssuesByStudentId);
router.get("/issues/overdue", requireLibraryManager, getOverdueIssues);
router.get("/issues/:id", requireLibraryManager, getIssueById);
router.get("/issues", requireLibraryManager, getIssues);
router.post("/issues", requireLibraryManager, createIssue);
router.patch("/issues/:id/return", requireLibraryManager, returnBook);
router.patch("/issues/:id/fine", requireLibraryManager, updateIssueFine);
router.delete("/issues/:id", requireLibraryManager, deleteIssue);

router.get("/books/:id", requireLibraryManager, getBookById);
router.get("/books", requireLibraryManager, getBooks);
router.post("/books", requireLibraryManager, createBook);
router.put("/books/:id", requireLibraryManager, updateBook);
router.patch("/books/:id/status", requireLibraryManager, updateBookStatus);
router.delete("/books/:id", requireLibraryManager, deleteBook);

export default router;
