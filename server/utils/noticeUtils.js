const sanitizeNotice = (notice) => ({
  _id: notice._id,
  instituteId: notice.instituteId,
  title: notice.title,
  description: notice.description,
  noticeType: notice.noticeType,
  audience: notice.audience,
  academicGroupId: notice.academicGroupId,
  priority: notice.priority,
  publishDate: notice.publishDate,
  expiryDate: notice.expiryDate,
  status: notice.status,
  createdBy: notice.createdBy,
  updatedBy: notice.updatedBy,
  createdAt: notice.createdAt,
  updatedAt: notice.updatedAt,
});

const getAudienceForRole = (role) => {
  if (role === "admin") return "admins";
  if (role === "teacher") return "teachers";
  if (role === "student") return "students";
  if (role === "parent") return "parents";
  if (role === "staff") return "staff";

  return null;
};

const buildPublishedNoticeQuery = ({ instituteId, role, academicGroupIds = [] }) => {
  const audience = getAudienceForRole(role);
  const now = new Date();
  const filters = [{ audience: "all" }];

  if (audience) {
    filters.push({ audience });
  }

  if (academicGroupIds.length > 0) {
    filters.push({ audience: "academic_group", academicGroupId: { $in: academicGroupIds } });
  }

  return {
    instituteId,
    isDeleted: false,
    status: "published",
    publishDate: { $lte: now },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    $and: [{ $or: filters }],
  };
};

export { sanitizeNotice, getAudienceForRole, buildPublishedNoticeQuery };
