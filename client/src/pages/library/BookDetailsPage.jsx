import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AlertMessage from "../../components/AlertMessage";
import LoadingBlock from "../../components/LoadingBlock";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useUISettings } from "../../context/UISettingsContext";
import { formatLabel } from "../../utils/formatters";

const BookDetailsPage = ({ basePath, eyebrow }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, getButtonRadius } = useUISettings();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadBook = async () => {
      try {
        const { data } = await api.get(`/library/books/${id}`);
        setBook(data.book);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load book details");
      } finally {
        setLoading(false);
      }
    };
    loadBook();
  }, [id]);

  const handleDelete = async () => {
    if (!(await window.confirm("Delete this book?"))) return;
    try {
      await api.delete(`/library/books/${id}`);
      window.alert("Book deleted successfully");
      navigate(`${basePath}/books`);
    } catch (error) {
      window.alert(error.response?.data?.message || "Unable to delete book");
    }
  };

  if (loading) return <LoadingBlock message="Loading book details..." />;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={book?.title || "Book Details"} description="Review book metadata, availability, and academic mapping." actions={<div className="flex flex-wrap gap-3"><Link to={`${basePath}/books/${id}/edit`} style={{ backgroundColor: settings.primaryColor, borderRadius: getButtonRadius(settings.buttonStyle) }} className="px-5 py-3 text-sm font-semibold text-white">Edit Book</Link><button type="button" onClick={handleDelete} className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600">Delete</button></div>} />
      <AlertMessage tone="error" message={errorMessage} />
      {book ? <div className="rounded-[1.75rem] bg-white p-6 shadow-card"><div className="flex flex-wrap gap-2"><StatusBadge value={book.status} /><StatusBadge value={book.category} /></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Author</p><p className="mt-2 font-semibold text-ink">{book.author}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">ISBN</p><p className="mt-2 font-semibold text-ink">{book.isbn || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Copies</p><p className="mt-2 font-semibold text-ink">{book.totalCopies}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Available Copies</p><p className="mt-2 font-semibold text-ink">{book.availableCopies}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Publisher</p><p className="mt-2 font-semibold text-ink">{book.publisher || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Edition</p><p className="mt-2 font-semibold text-ink">{book.edition || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Language</p><p className="mt-2 font-semibold text-ink">{book.language || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shelf Number</p><p className="mt-2 font-semibold text-ink">{book.shelfNumber || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Subject</p><p className="mt-2 font-semibold text-ink">{book.subjectId?.subjectName || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Academic Group</p><p className="mt-2 font-semibold text-ink">{book.academicGroupId?.className || [book.academicGroupId?.department, book.academicGroupId?.course, book.academicGroupId?.section].filter(Boolean).join(" - ") || "-"}</p></div><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Category</p><p className="mt-2 font-semibold text-ink">{formatLabel(book.category)}</p></div></div></div> : null}
    </section>
  );
};

export default BookDetailsPage;
