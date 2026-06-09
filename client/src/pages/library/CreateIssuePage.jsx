import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import BookIssueForm from "../../components/library/BookIssueForm";
import { issueFormDefaults } from "../../utils/libraryOptions";

const CreateIssuePage = ({ basePath, eyebrow }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(issueFormDefaults);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: bookData }, { data: studentData }] = await Promise.all([
          api.get("/library/books", { params: { status: "active" } }),
          api.get("/students"),
        ]);
        setBooks((bookData.books || []).filter((book) => book.availableCopies > 0));
        setStudents(studentData.students || []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load issue form");
      }
    };
    loadData();
  }, []);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await api.post("/library/issues", formData);
      window.alert("Book issued successfully");
      navigate(`${basePath}/issues`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to issue book");
    } finally {
      setSubmitting(false);
    }
  };

  return <BookIssueForm title="Issue Book" description={`${eyebrow} can issue books to students and track due dates from here.`} formData={formData} books={books} students={students} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
};

export default CreateIssuePage;
