import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import EmptyState from "../../components/EmptyState";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { bookCategoryOptions } from "../../utils/libraryOptions";
import { formatLabel } from "../../utils/formatters";

const filterClass = "rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none";

const ManageBooksPage = ({ basePath, eyebrow, title, description }) => {
  const { settings, getButtonRadius } = useUISettings();
  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleStatusUpdate = async (id, status) => {
    try {
      const { data } = await api.patch(`/library/books/${id}/status`, { status });
      setBooks((current) => current.map((book) => (book._id === id ? data.book : book)));
      window.alert(`Book marked ${status}`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to update book status");
    }
  };

  if (loading) return <LoadingBlock message="Loading library books..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={<Link to={`${basePath}/books/create`} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Add Book</Link>} />
      <div className="grid gap-4 rounded-[1.75rem] bg-white p-6 shadow-card md:grid-cols-3">
        <input placeholder="Search by title or author" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className={filterClass} />
        <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className={filterClass}>
          <option value="all">All Categories</option>
          {bookCategoryOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
        </select>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <AlertMessage tone="error" message={errorMessage} />
      {books.length === 0 ? <EmptyState title="No books found" description="Add the first library book for this institute." /> : <div className="grid gap-4">{books.map((book) => <div key={book._id} className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{book.title}</h3><p className="mt-2 text-sm text-slate-600">{book.author} • {formatLabel(book.category)}</p></div><StatusBadge value={book.status} /></div><div className="mt-5 grid gap-4 md:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">ISBN</p><p className="mt-2 font-semibold text-ink">{book.isbn || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shelf</p><p className="mt-2 font-semibold text-ink">{book.shelfNumber || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Copies</p><p className="mt-2 font-semibold text-ink">{book.totalCopies}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Available Copies</p><p className="mt-2 font-semibold text-ink">{book.availableCopies}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Link to={`${basePath}/books/${book._id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View</Link><Link to={`${basePath}/books/${book._id}/edit`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link><button type="button" onClick={() => handleStatusUpdate(book._id, book.status === "active" ? "inactive" : "active")} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{book.status === "active" ? "Deactivate" : "Activate"}</button></div></div>)}</div>}
    </section>
  );
};

export default ManageBooksPage;
