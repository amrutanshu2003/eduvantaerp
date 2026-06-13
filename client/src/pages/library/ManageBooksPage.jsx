import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import ActionPopover from "../../components/ui/ActionPopover";
import FilterBar from "../../components/ui/FilterBar";
import { Button, TableShell, ConfirmModal } from "../../components/ui";
import { useUISettings } from "../../context/UISettingsContext";
import { bookCategoryOptions } from "../../utils/libraryOptions";
import { formatLabel } from "../../utils/formatters";

const ManageBooksPage = ({ basePath, eyebrow, title, description }) => {
  const { settings, getButtonRadius, resolvedTheme } = useUISettings();
  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const { data } = await api.get("/library/books", { params: filters });
        setBooks(data.books || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load books");
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, [filters.search, filters.category, filters.status]);

  const handleStatusUpdate = async (book, status) => {
    setConfirmModal({
      type: "status",
      book,
      status,
      title: `Mark book as ${status}?`,
      message: `This book will be marked as ${status}.`,
    });
  };

  const confirmStatusUpdate = async () => {
    if (!confirmModal) return;
    const { book, status } = confirmModal;
    try {
      setActionLoading(true);
      const { data } = await api.patch(`/library/books/${book._id}/status`, { status });
      setBooks((current) => current.map((b) => (b._id === book._id ? data.book : b)));
      setConfirmModal(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update book status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ search: "", category: "all", status: "all" });
  };

  if (loading) return <LoadingBlock message="Loading library books..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={<Link to={`${basePath}/books/create`} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Add Book</Link>} />
      <FilterBar
        filters={filters}
        onFilterChange={(event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onSearch={() => {}}
        onReset={handleResetFilters}
        searchPlaceholder="Search by title or author"
      >
        <input
          name="search"
          placeholder="Search by title or author"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <select name="category" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Categories</option>
          {bookCategoryOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select name="status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterBar>
      <AlertMessage tone="error" message={errorMessage} />
      {books.length === 0 ? <EmptyState title="No books found" description="Add the first library book for this institute." /> : (
        <TableShell
          headers={["Book", "Author", "ISBN", "Shelf", "Copies", "Status", "Actions"]}
        >
          {books.map((book) => (
            <tr key={book._id} className={`border-t transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/40" : "border-slate-100 hover:bg-slate-50"}`}>
              <td className="px-6 py-4">
                <div>
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{book.title}</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{formatLabel(book.category)}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{book.author}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{book.isbn || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{book.shelfNumber || "-"}</p>
              </td>
              <td className="px-6 py-4">
                <p className={isDark ? "text-slate-300" : "text-slate-700"}>{book.availableCopies} / {book.totalCopies}</p>
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={book.status} />
              </td>
              <td className="px-6 py-4">
                <ActionPopover
                  item={book}
                  isActive={book.status === "active"}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDeactivate={book.status === "active" ? () => handleStatusUpdate(book, "inactive") : undefined}
                  onActivate={book.status === "inactive" ? () => handleStatusUpdate(book, "active") : undefined}
                />
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <ConfirmModal
        open={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmStatusUpdate}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText={confirmModal?.status}
        variant="primary"
        loading={actionLoading}
      />
    </section>
  );
};

export default ManageBooksPage;
