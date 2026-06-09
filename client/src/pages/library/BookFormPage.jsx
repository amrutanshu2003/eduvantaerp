import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import LibraryBookForm from "../../components/library/LibraryBookForm";
import LoadingBlock from "../../components/LoadingBlock";
import { bookFormDefaults } from "../../utils/libraryOptions";

const BookFormPage = ({ mode = "create", basePath, eyebrow }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(bookFormDefaults);
  const [subjects, setSubjects] = useState([]);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const requests = [api.get("/subjects"), api.get("/academic-groups")];
        if (mode === "edit") requests.unshift(api.get(`/library/books/${id}`));
        const responses = await Promise.all(requests);
        const offset = mode === "edit" ? 1 : 0;
        if (mode === "edit") {
          const book = responses[0].data.book;
          setFormData({
            title: book.title || "",
            author: book.author || "",
            isbn: book.isbn || "",
            category: book.category || "textbook",
            subjectId: book.subjectId?._id || book.subjectId || "",
            academicGroupId: book.academicGroupId?._id || book.academicGroupId || "",
            publisher: book.publisher || "",
            edition: book.edition || "",
            language: book.language || "",
            shelfNumber: book.shelfNumber || "",
            totalCopies: book.totalCopies ?? 1,
            availableCopies: book.availableCopies ?? 1,
            status: book.status || "active",
          });
        }
        setSubjects(responses[offset].data.subjects || []);
        setAcademicGroups(responses[offset + 1].data.academicGroups || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load book form");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, mode]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      const endpoint = mode === "edit" ? `/library/books/${id}` : "/library/books";
      const request = mode === "edit" ? api.put(endpoint, formData) : api.post(endpoint, formData);
      const { data } = await request;
      const bookId = mode === "edit" ? id : data.book._id;
      window.alert(`Book ${mode === "edit" ? "updated" : "created"} successfully`);
      navigate(`${basePath}/books/${bookId}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Unable to ${mode} book`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock message="Loading book form..." />;

  return <LibraryBookForm title={`${mode === "edit" ? "Edit" : "Create"} Library Book`} description={`${eyebrow} can manage library books, copies, and academic mapping from here.`} formData={formData} subjects={subjects} academicGroups={academicGroups} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default BookFormPage;
