const noticeTypeOptions = ["general", "academic", "exam", "fees", "holiday", "event", "emergency"];
const noticeAudienceOptions = ["all", "admins", "teachers", "students", "parents", "staff", "academic_group"];
const noticePriorityOptions = ["low", "normal", "high", "urgent"];
const noticeStatusOptions = ["draft", "published", "archived"];

const noticeFormDefaults = {
  title: "",
  description: "",
  noticeType: "general",
  audience: "all",
  academicGroupId: "",
  priority: "normal",
  publishDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
  status: "draft",
};

export { noticeTypeOptions, noticeAudienceOptions, noticePriorityOptions, noticeStatusOptions, noticeFormDefaults };
