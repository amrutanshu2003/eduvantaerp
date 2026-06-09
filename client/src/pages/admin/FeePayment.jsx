import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import FeePaymentForm from "../../components/fees/FeePaymentForm";
import LoadingBlock from "../../components/LoadingBlock";
import { feePaymentDefaults } from "../../utils/feeOptions";

const FeePayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fee, setFee] = useState(null);
  const [formData, setFormData] = useState(feePaymentDefaults);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadFee = async () => {
      try {
        const { data } = await api.get(`/fees/${id}`);
        setFee(data.fee);
        setFormData({
          paidAmount: data.fee.paidAmount ?? "",
          paymentDate: data.fee.paymentDate ? data.fee.paymentDate.slice(0, 10) : feePaymentDefaults.paymentDate,
          paymentMethod: data.fee.paymentMethod || "cash",
          transactionId: data.fee.transactionId || "",
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to load fee");
      } finally {
        setLoading(false);
      }
    };

    loadFee();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      await api.patch(`/fees/${id}/payment`, formData);
      window.alert("Fee payment updated successfully");
      navigate(`/admin/fees/${id}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to save payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !fee) return <LoadingBlock message="Loading payment form..." />;

  return (
    <FeePaymentForm
      fee={fee}
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitting={submitting}
      errorMessage={errorMessage}
    />
  );
};

export default FeePayment;
