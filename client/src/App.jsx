import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import SecureAccountRecovery from "./pages/SecureAccountRecovery";
import RecycleBin from "./pages/RecycleBin";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/admin/Dashboard";
import AcademicGroupDetails from "./pages/admin/AcademicGroupDetails";
import AcademicGroups from "./pages/admin/AcademicGroups";
import AcademicSettings from "./pages/admin/AcademicSettings";
import AssignSubjectTeacher from "./pages/admin/AssignSubjectTeacher";
import Attendance from "./pages/admin/Attendance";
import AttendanceReports from "./pages/admin/AttendanceReports";
import Assignments from "./pages/admin/Assignments";
import AssignTeacherAcademicGroups from "./pages/admin/AssignTeacherAcademicGroups";
import CreateAssignment from "./pages/teacher/CreateAssignment";
import CreateAcademicGroup from "./pages/admin/CreateAcademicGroup";
import BulkImport from "./pages/admin/BulkImport";
import CreateExam from "./pages/admin/CreateExam";
import CreateFee from "./pages/admin/CreateFee";
import CreateNotice from "./pages/admin/CreateNotice";
import CreateTimetable from "./pages/admin/CreateTimetable";
import CreateParent from "./pages/admin/CreateParent";
import CreateStaff from "./pages/admin/CreateStaff";
import CreateStudent from "./pages/admin/CreateStudent";
import CreateSubject from "./pages/admin/CreateSubject";
import CreateTeacher from "./pages/admin/CreateTeacher";
import ExamAcademicGroupResults from "./pages/admin/ExamAcademicGroupResults";
import ExamDetails from "./pages/admin/ExamDetails";
import Exams from "./pages/admin/Exams";
import EditAcademicGroup from "./pages/admin/EditAcademicGroup";
import EditExam from "./pages/admin/EditExam";
import EditFee from "./pages/admin/EditFee";
import EditNotice from "./pages/admin/EditNotice";
import EditAssignment from "./pages/teacher/EditAssignment";
import EditParent from "./pages/admin/EditParent";
import EditStaff from "./pages/admin/EditStaff";
import EditStudent from "./pages/admin/EditStudent";
import EditSubject from "./pages/admin/EditSubject";
import EditTeacher from "./pages/admin/EditTeacher";
import EditTimetable from "./pages/admin/EditTimetable";
import EditAttendance from "./pages/admin/EditAttendance";
import FeeDetails from "./pages/admin/FeeDetails";
import FeePayment from "./pages/admin/FeePayment";
import Fees from "./pages/admin/Fees";
import LinkParentStudents from "./pages/admin/LinkParentStudents";
import Marks from "./pages/admin/Marks";
import NoticeDetails from "./pages/admin/NoticeDetails";
import Notices from "./pages/admin/Notices";
import ParentDetails from "./pages/admin/ParentDetails";
import Parents from "./pages/admin/Parents";
import Results from "./pages/admin/Results";
import Staff from "./pages/admin/Staff";
import StaffDetails from "./pages/admin/StaffDetails";
import StaffPermissions from "./pages/admin/StaffPermissions";
import StudentAttendanceReport from "./pages/admin/StudentAttendanceReport";
import StudentDetails from "./pages/admin/StudentDetails";
import Students from "./pages/admin/Students";
import SubjectDetails from "./pages/admin/SubjectDetails";
import Subjects from "./pages/admin/Subjects";
import TeacherDetails from "./pages/admin/TeacherDetails";
import Teachers from "./pages/admin/Teachers";
import TimetableDetails from "./pages/admin/TimetableDetails";
import Timetables from "./pages/admin/Timetables";
import ParentAttendance from "./pages/parent/Attendance";
import ChildAttendance from "./pages/parent/ChildAttendance";
import ChildAssignments from "./pages/parent/ChildAssignments";
import ChildFees from "./pages/parent/ChildFees";
import ChildTimetable from "./pages/parent/ChildTimetable";
import ParentAssignments from "./pages/parent/Assignments";
import ParentExams from "./pages/parent/Exams";
import ParentFees from "./pages/parent/Fees";
import ParentLibrary from "./pages/parent/Library";
import ParentNotices from "./pages/parent/Notices";
import ParentResults from "./pages/parent/Results";
import ParentTimetable from "./pages/parent/Timetable";
import ChildResults from "./pages/parent/ChildResults";
import ParentDashboard from "./pages/parent/Dashboard";
import StaffDashboard from "./pages/staff/Dashboard";
import StaffNotices from "./pages/staff/Notices";
import StudentAttendance from "./pages/student/Attendance";
import StudentAssignmentDetails from "./pages/student/AssignmentDetails";
import StudentAssignments from "./pages/student/Assignments";
import StudentExams from "./pages/student/Exams";
import StudentFees from "./pages/student/Fees";
import StudentNotices from "./pages/student/Notices";
import StudentResults from "./pages/student/Results";
import StudentSubmitAssignment from "./pages/student/SubmitAssignment";
import StudentTimetable from "./pages/student/Timetable";
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import AdminProfile from "./pages/admin/Profile";
import TeacherProfile from "./pages/teacher/Profile";
import ParentProfile from "./pages/parent/Profile";
import StaffProfile from "./pages/staff/Profile";
import CreateInstitute from "./pages/superadmin/CreateInstitute";
import CreateInstituteAdmin from "./pages/superadmin/CreateInstituteAdmin";
import EditInstitute from "./pages/superadmin/EditInstitute";
import GlobalSettings from "./pages/superadmin/GlobalSettings";
import GlobalUISettings from "./pages/superadmin/GlobalUISettings";
import InstituteDetails from "./pages/superadmin/InstituteDetails";
import Institutes from "./pages/superadmin/Institutes";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import Admins from "./pages/superadmin/Admins";
import CreateAdmin from "./pages/superadmin/CreateAdmin";
import EditAdmin from "./pages/superadmin/EditAdmin";
import Settings from "./pages/superadmin/Settings";
import AuditLogSettings from "./pages/superadmin/AuditLogSettings";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherAssignmentDetails from "./pages/teacher/AssignmentDetails";
import TeacherAssignments from "./pages/teacher/Assignments";
import TeacherAssignmentSubmissions from "./pages/teacher/AssignmentSubmissions";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherExams from "./pages/teacher/Exams";
import TeacherMarks from "./pages/teacher/Marks";
import MarkAttendance from "./pages/teacher/MarkAttendance";
import TeacherNotices from "./pages/teacher/Notices";
import TeacherSubjectDetails from "./pages/teacher/SubjectDetails";
import TeacherSubjects from "./pages/teacher/Subjects";
import TeacherTimetable from "./pages/teacher/Timetable";
import UploadMarks from "./pages/teacher/UploadMarks";
import BookDetailsPage from "./pages/library/BookDetailsPage";
import BookFormPage from "./pages/library/BookFormPage";
import CreateIssuePage from "./pages/library/CreateIssuePage";
import BedDetailsPage from "./pages/hostel/BedDetailsPage";
import BedFormPage from "./pages/hostel/BedFormPage";
import HostelAllocationDetailsPage from "./pages/hostel/HostelAllocationDetailsPage";
import HostelAllocationFormPage from "./pages/hostel/HostelAllocationFormPage";
import HostelComplaintDetailsPage from "./pages/hostel/HostelComplaintDetailsPage";
import HostelComplaintFormPage from "./pages/hostel/HostelComplaintFormPage";
import HostelDetailsPage from "./pages/hostel/HostelDetailsPage";
import HostelFormPage from "./pages/hostel/HostelFormPage";
import HostelOutpassDetailsPage from "./pages/hostel/HostelOutpassDetailsPage";
import HostelOutpassFormPage from "./pages/hostel/HostelOutpassFormPage";
import ManageHostelAllocationsPage from "./pages/hostel/ManageAllocationsPage";
import ManageComplaintsPage from "./pages/hostel/ManageComplaintsPage";
import ManageOutpassesPage from "./pages/hostel/ManageOutpassesPage";
import ManageBedsPage from "./pages/hostel/ManageBedsPage";
import ManageHostelsPage from "./pages/hostel/ManageHostelsPage";
import ManageRoomsPage from "./pages/hostel/ManageRoomsPage";
import ParentHostelSectionPage from "./pages/hostel/ParentHostelSectionPage";
import RoomDetailsPage from "./pages/hostel/RoomDetailsPage";
import RoomFormPage from "./pages/hostel/RoomFormPage";
import UserHostelPage from "./pages/hostel/UserHostelPage";
import ManageBooksPage from "./pages/library/ManageBooksPage";
import ManageIssuesPage from "./pages/library/ManageIssuesPage";
import UserLibraryPage from "./pages/library/UserLibraryPage";
import AllocationDetailsPage from "./pages/transport/AllocationDetailsPage";
import AllocationFormPage from "./pages/transport/AllocationFormPage";
import DriverRoutePage from "./pages/transport/DriverRoutePage";
import DriverStudentsPage from "./pages/transport/DriverStudentsPage";
import ManageAllocationsPage from "./pages/transport/ManageAllocationsPage";
import ManageRoutesPage from "./pages/transport/ManageRoutesPage";
import ManageVehiclesPage from "./pages/transport/ManageVehiclesPage";
import ParentTransportPage from "./pages/transport/ParentTransportPage";
import RouteDetailsPage from "./pages/transport/RouteDetailsPage";
import RouteFormPage from "./pages/transport/RouteFormPage";
import UserTransportPage from "./pages/transport/UserTransportPage";
import VehicleDetailsPage from "./pages/transport/VehicleDetailsPage";
import VehicleFormPage from "./pages/transport/VehicleFormPage";
import CustomAlert from "./components/CustomAlert";
import Notifications from "./pages/Notifications";

const App = () => {
  return (
    <>
      <CustomAlert />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/secure/super-admin/recovery" element={<SecureAccountRecovery />} />
        <Route path="/secure/account-recovery" element={<SecureAccountRecovery />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route element={<RoleRoute allowedRoles={["superadmin"]} />}>
              <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/institutes" element={<Institutes />} />
              <Route path="/super-admin/institutes/create" element={<CreateInstitute />} />
              <Route path="/super-admin/institutes/:id" element={<InstituteDetails />} />
              <Route path="/super-admin/institutes/:id/edit" element={<EditInstitute />} />
              <Route path="/super-admin/institutes/:id/create-admin" element={<CreateInstituteAdmin />} />
              <Route path="/super-admin/ui-settings" element={<GlobalUISettings />} />
              <Route path="/super-admin/recycle-bin" element={<RecycleBin />} />
              <Route path="/super-admin/admins" element={<Admins />} />
              <Route path="/super-admin/admins/create" element={<CreateAdmin />} />
              <Route path="/super-admin/admins/:id/edit" element={<EditAdmin />} />
              <Route path="/super-admin/profile" element={<Settings />} />
              <Route path="/super-admin/settings" element={<GlobalSettings />} />
              <Route path="/super-admin/audit-log-settings" element={<AuditLogSettings />} />
              <Route path="/super-admin/notifications" element={<Notifications />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/bulk-import" element={<BulkImport />} />
              <Route path="/admin/academic-settings" element={<AcademicSettings />} />
              <Route path="/admin/academic-groups" element={<AcademicGroups />} />
              <Route path="/admin/academic-groups/create" element={<CreateAcademicGroup />} />
              <Route path="/admin/academic-groups/:id" element={<AcademicGroupDetails />} />
              <Route path="/admin/academic-groups/:id/edit" element={<EditAcademicGroup />} />
              <Route path="/admin/teachers" element={<Teachers />} />
              <Route path="/admin/teachers/create" element={<CreateTeacher />} />
              <Route path="/admin/teachers/:id" element={<TeacherDetails />} />
              <Route path="/admin/teachers/:id/edit" element={<EditTeacher />} />
              <Route path="/admin/teachers/:id/assign" element={<AssignTeacherAcademicGroups />} />
              <Route path="/admin/students" element={<Students />} />
              <Route path="/admin/students/create" element={<CreateStudent />} />
              <Route path="/admin/students/:id" element={<StudentDetails />} />
              <Route path="/admin/students/:id/edit" element={<EditStudent />} />
              <Route path="/admin/parents" element={<Parents />} />
              <Route path="/admin/parents/create" element={<CreateParent />} />
              <Route path="/admin/parents/:id" element={<ParentDetails />} />
              <Route path="/admin/parents/:id/edit" element={<EditParent />} />
              <Route path="/admin/parents/:id/link-students" element={<LinkParentStudents />} />
              <Route path="/admin/staff" element={<Staff />} />
              <Route path="/admin/staff/create" element={<CreateStaff />} />
              <Route path="/admin/staff/:id" element={<StaffDetails />} />
              <Route path="/admin/staff/:id/edit" element={<EditStaff />} />
              <Route path="/admin/staff/:id/permissions" element={<StaffPermissions />} />
              <Route path="/admin/subjects" element={<Subjects />} />
              <Route path="/admin/subjects/create" element={<CreateSubject />} />
              <Route path="/admin/subjects/:id" element={<SubjectDetails />} />
              <Route path="/admin/subjects/:id/edit" element={<EditSubject />} />
              <Route path="/admin/subjects/:id/assign-teacher" element={<AssignSubjectTeacher />} />
              <Route path="/admin/attendance" element={<Attendance />} />
              <Route path="/admin/attendance/:id/edit" element={<EditAttendance />} />
              <Route path="/admin/attendance/reports" element={<AttendanceReports />} />
              <Route path="/admin/attendance/students/:studentId" element={<StudentAttendanceReport />} />
              <Route path="/admin/exams" element={<Exams />} />
              <Route path="/admin/exams/create" element={<CreateExam />} />
              <Route path="/admin/exams/:id" element={<ExamDetails />} />
              <Route path="/admin/exams/:id/edit" element={<EditExam />} />
              <Route path="/admin/marks" element={<Marks />} />
              <Route path="/admin/results" element={<Results />} />
              <Route path="/admin/results/exam/:examId/academic-group/:academicGroupId" element={<ExamAcademicGroupResults />} />
              <Route path="/admin/notices" element={<Notices />} />
              <Route path="/admin/notices/create" element={<CreateNotice />} />
              <Route path="/admin/notices/:id" element={<NoticeDetails />} />
              <Route path="/admin/notices/:id/edit" element={<EditNotice />} />
              <Route path="/admin/fees" element={<Fees />} />
              <Route path="/admin/fees/create" element={<CreateFee />} />
              <Route path="/admin/fees/:id" element={<FeeDetails />} />
              <Route path="/admin/fees/:id/edit" element={<EditFee />} />
              <Route path="/admin/fees/:id/payment" element={<FeePayment />} />
              <Route path="/admin/timetables" element={<Timetables />} />
              <Route path="/admin/timetables/create" element={<CreateTimetable />} />
              <Route path="/admin/timetables/:id" element={<TimetableDetails />} />
              <Route path="/admin/timetables/:id/edit" element={<EditTimetable />} />
              <Route path="/admin/assignments" element={<Assignments />} />
              <Route path="/admin/recycle-bin" element={<RecycleBin />} />
              <Route path="/admin/library/books" element={<ManageBooksPage basePath="/admin/library" eyebrow="Admin" title="Library Books" description="Manage institute books, copies, categories, and shelf mapping." />} />
              <Route path="/admin/library/books/create" element={<BookFormPage basePath="/admin/library" eyebrow="Admin" />} />
              <Route path="/admin/library/books/:id" element={<BookDetailsPage basePath="/admin/library" eyebrow="Admin" />} />
              <Route path="/admin/library/books/:id/edit" element={<BookFormPage mode="edit" basePath="/admin/library" eyebrow="Admin" />} />
              <Route path="/admin/library/issues" element={<ManageIssuesPage basePath="/admin/library" eyebrow="Admin" title="Book Issues" description="Track issued, returned, and lost books across students." />} />
              <Route path="/admin/library/issues/create" element={<CreateIssuePage basePath="/admin/library" eyebrow="Admin" />} />
              <Route path="/admin/library/issues/overdue" element={<ManageIssuesPage basePath="/admin/library" eyebrow="Admin" title="Overdue Books" description="Review overdue books and update returns or fines." overdueOnly />} />
              <Route path="/admin/library/students/:studentId/history" element={<ManageIssuesPage basePath="/admin/library" eyebrow="Admin" title="Student Library History" description="Review library history for one student." studentHistory />} />
              <Route path="/admin/transport/vehicles" element={<ManageVehiclesPage basePath="/admin/transport" eyebrow="Admin" title="Transport Vehicles" description="Manage institute vehicles, staff assignment, and maintenance readiness." />} />
              <Route path="/admin/transport/vehicles/create" element={<VehicleFormPage basePath="/admin/transport" eyebrow="Admin" />} />
              <Route path="/admin/transport/vehicles/:id" element={<VehicleDetailsPage basePath="/admin/transport" eyebrow="Admin" />} />
              <Route path="/admin/transport/vehicles/:id/edit" element={<VehicleFormPage mode="edit" basePath="/admin/transport" eyebrow="Admin" />} />
              <Route path="/admin/transport/routes" element={<ManageRoutesPage basePath="/admin/transport" eyebrow="Admin" title="Transport Routes" description="Create route maps with stops, assigned staff, and vehicle details." />} />
              <Route path="/admin/transport/routes/create" element={<RouteFormPage basePath="/admin/transport" eyebrow="Admin" />} />
              <Route path="/admin/transport/routes/:id" element={<RouteDetailsPage basePath="/admin/transport" eyebrow="Admin" />} />
              <Route path="/admin/transport/routes/:id/edit" element={<RouteFormPage mode="edit" basePath="/admin/transport" eyebrow="Admin" />} />
              <Route path="/admin/transport/allocations" element={<ManageAllocationsPage basePath="/admin/transport" eyebrow="Admin" title="Transport Allocations" description="Allocate students to route stops and manage transport fee details." />} />
              <Route path="/admin/transport/allocations/create" element={<AllocationFormPage basePath="/admin/transport" eyebrow="Admin" />} />
              <Route path="/admin/transport/allocations/:id" element={<AllocationDetailsPage basePath="/admin/transport" eyebrow="Admin" />} />
              <Route path="/admin/transport/allocations/:id/edit" element={<AllocationFormPage mode="edit" basePath="/admin/transport" eyebrow="Admin" />} />
              <Route path="/admin/hostels" element={<ManageHostelsPage basePath="/admin" eyebrow="Admin" title="Hostels" description="Manage institute hostels, wardens, and overall hostel setup." />} />
              <Route path="/admin/hostels/create" element={<HostelFormPage basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostels/:id" element={<HostelDetailsPage basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostels/:id/edit" element={<HostelFormPage mode="edit" basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostels/:hostelId/rooms" element={<ManageRoomsPage basePath="/admin" eyebrow="Admin" title="Hostel Rooms" description="Manage room capacity, floor, and occupancy readiness for one hostel." nested />} />
              <Route path="/admin/hostels/:hostelId/rooms/create" element={<RoomFormPage basePath="/admin" eyebrow="Admin" nested />} />
              <Route path="/admin/hostel-rooms" element={<ManageRoomsPage basePath="/admin" eyebrow="Admin" title="Hostel Rooms" description="Review rooms across hostels with floor and status filters." />} />
              <Route path="/admin/hostel-rooms/create" element={<RoomFormPage basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostel-rooms/:id" element={<RoomDetailsPage basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostel-rooms/:id/edit" element={<RoomFormPage mode="edit" basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostel-rooms/:roomId/beds" element={<ManageBedsPage basePath="/admin" eyebrow="Admin" title="Hostel Beds" description="Manage room-wise bed setup and maintenance status." nested />} />
              <Route path="/admin/hostel-rooms/:roomId/beds/create" element={<BedFormPage basePath="/admin" eyebrow="Admin" nested />} />
              <Route path="/admin/hostel-beds" element={<ManageBedsPage basePath="/admin" eyebrow="Admin" title="Hostel Beds" description="Review hostel beds across hostels and rooms." />} />
              <Route path="/admin/hostel-beds/create" element={<BedFormPage basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostel-beds/:id" element={<BedDetailsPage basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostel-beds/:id/edit" element={<BedFormPage mode="edit" basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostel-allocations" element={<ManageHostelAllocationsPage basePath="/admin" eyebrow="Admin" title="Hostel Allocations" description="Allocate students to hostel rooms and beds, and manage leave or cancellation flow." />} />
              <Route path="/admin/hostel-allocations/create" element={<HostelAllocationFormPage basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostel-allocations/:id" element={<HostelAllocationDetailsPage basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostel-allocations/:id/edit" element={<HostelAllocationFormPage mode="edit" basePath="/admin" eyebrow="Admin" />} />
              <Route path="/admin/hostel-outpasses" element={<ManageOutpassesPage basePath="/admin" eyebrow="Admin" title="Hostel Outpasses" description="Review and approve hostel outpass requests." mode="manager" />} />
              <Route path="/admin/hostel-outpasses/:id" element={<HostelOutpassDetailsPage eyebrow="Admin" roleMode="manager" />} />
              <Route path="/admin/hostel-complaints" element={<ManageComplaintsPage basePath="/admin" eyebrow="Admin" title="Hostel Complaints" description="Track hostel issues, assignments, and resolution status." mode="manager" />} />
              <Route path="/admin/hostel-complaints/:id" element={<HostelComplaintDetailsPage eyebrow="Admin" roleMode="manager" />} />
              <Route path="/admin/notifications" element={<Notifications />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["teacher"]} />}>
              <Route path="/teacher/profile" element={<TeacherProfile />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/subjects" element={<TeacherSubjects />} />
              <Route path="/teacher/subjects/:id" element={<TeacherSubjectDetails />} />
              <Route path="/teacher/attendance" element={<TeacherAttendance />} />
              <Route path="/teacher/attendance/mark" element={<MarkAttendance />} />
              <Route path="/teacher/attendance/history" element={<TeacherAttendance />} />
              <Route path="/teacher/exams" element={<TeacherExams />} />
              <Route path="/teacher/marks" element={<TeacherMarks />} />
              <Route path="/teacher/marks/upload" element={<UploadMarks />} />
              <Route path="/teacher/marks/history" element={<TeacherMarks />} />
              <Route path="/teacher/notices" element={<TeacherNotices />} />
              <Route path="/teacher/timetable" element={<TeacherTimetable />} />
              <Route path="/teacher/assignments" element={<TeacherAssignments />} />
              <Route path="/teacher/assignments/create" element={<CreateAssignment />} />
              <Route path="/teacher/assignments/:id" element={<TeacherAssignmentDetails />} />
              <Route path="/teacher/assignments/:id/edit" element={<EditAssignment />} />
              <Route path="/teacher/assignments/:id/submissions" element={<TeacherAssignmentSubmissions />} />
              <Route path="/teacher/notifications" element={<Notifications />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["student"]} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/exams" element={<StudentExams />} />
              <Route path="/student/results" element={<StudentResults />} />
              <Route path="/student/notices" element={<StudentNotices />} />
              <Route path="/student/fees" element={<StudentFees />} />
              <Route path="/student/timetable" element={<StudentTimetable />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/assignments/:id" element={<StudentAssignmentDetails />} />
              <Route path="/student/assignments/:id/submit" element={<StudentSubmitAssignment />} />
              <Route path="/student/library" element={<UserLibraryPage role="Student" />} />
              <Route path="/student/transport" element={<UserTransportPage role="Student" />} />
              <Route path="/student/hostel" element={<UserHostelPage role="Student" />} />
              <Route path="/student/hostel/outpasses" element={<ManageOutpassesPage basePath="/student" eyebrow="Student" title="Hostel Outpasses" description="Track your hostel outpass requests and approval states." mode="student" />} />
              <Route path="/student/hostel/outpasses/create" element={<HostelOutpassFormPage basePath="/student" eyebrow="Student" />} />
              <Route path="/student/hostel/outpasses/:id" element={<HostelOutpassDetailsPage eyebrow="Student" roleMode="student" />} />
              <Route path="/student/hostel/complaints" element={<ManageComplaintsPage basePath="/student" eyebrow="Student" title="Hostel Complaints" description="Track your hostel complaints and issue resolution." mode="student" />} />
              <Route path="/student/hostel/complaints/create" element={<HostelComplaintFormPage basePath="/student" eyebrow="Student" />} />
              <Route path="/student/hostel/complaints/:id" element={<HostelComplaintDetailsPage eyebrow="Student" roleMode="student" />} />
              <Route path="/student/notifications" element={<Notifications />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["parent"]} />}>
              <Route path="/parent/profile" element={<ParentProfile />} />
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/parent/attendance" element={<ParentAttendance />} />
              <Route path="/parent/children/:studentId/attendance" element={<ChildAttendance />} />
              <Route path="/parent/exams" element={<ParentExams />} />
              <Route path="/parent/results" element={<ParentResults />} />
              <Route path="/parent/children/:studentId/results" element={<ChildResults />} />
              <Route path="/parent/notices" element={<ParentNotices />} />
              <Route path="/parent/fees" element={<ParentFees />} />
              <Route path="/parent/children/:studentId/fees" element={<ChildFees />} />
              <Route path="/parent/timetable" element={<ParentTimetable />} />
              <Route path="/parent/children/:studentId/timetable" element={<ChildTimetable />} />
              <Route path="/parent/assignments" element={<ParentAssignments />} />
              <Route path="/parent/children/:studentId/assignments" element={<ChildAssignments />} />
              <Route path="/parent/library" element={<ParentLibrary />} />
              <Route path="/parent/children/:studentId/library" element={<UserLibraryPage role="Parent" childMode />} />
              <Route path="/parent/transport" element={<ParentTransportPage />} />
              <Route path="/parent/children/:studentId/transport" element={<UserTransportPage role="Parent" childMode />} />
              <Route path="/parent/hostel" element={<ParentHostelSectionPage title="Child Hostel" description="Choose a linked child to review hostel room and bed details." pathBuilder={(id) => `/parent/children/${id}/hostel`} />} />
              <Route path="/parent/children/:studentId/hostel" element={<UserHostelPage role="Parent" childMode />} />
              <Route path="/parent/hostel/outpasses" element={<ParentHostelSectionPage title="Hostel Outpasses" description="Choose a linked child to review and approve hostel outpass requests." pathBuilder={(id) => `/parent/children/${id}/hostel/outpasses`} />} />
              <Route path="/parent/children/:studentId/hostel/outpasses" element={<ManageOutpassesPage basePath="/parent" eyebrow="Parent" title="Child Hostel Outpasses" description="Review linked child outpass requests and parent approval status." mode="parent-child" />} />
              <Route path="/parent/hostel/outpasses/:id" element={<HostelOutpassDetailsPage eyebrow="Parent" roleMode="parent" />} />
              <Route path="/parent/hostel/complaints" element={<ParentHostelSectionPage title="Hostel Complaints" description="Choose a linked child to review hostel complaints." pathBuilder={(id) => `/parent/children/${id}/hostel/complaints`} />} />
              <Route path="/parent/children/:studentId/hostel/complaints" element={<ManageComplaintsPage basePath="/parent" eyebrow="Parent" title="Child Hostel Complaints" description="Review linked child hostel complaints and status updates." mode="parent-child" />} />
              <Route path="/parent/hostel/complaints/:id" element={<HostelComplaintDetailsPage eyebrow="Parent" roleMode="parent" />} />
              <Route path="/parent/notifications" element={<Notifications />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["staff"]} />}>
              <Route path="/staff/profile" element={<StaffProfile />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/notices" element={<StaffNotices />} />
              <Route path="/staff/library/books" element={<ManageBooksPage basePath="/staff/library" eyebrow="Staff" title="Library Books" description="Manage library books if you are the librarian or have library access." />} />
              <Route path="/staff/library/books/create" element={<BookFormPage basePath="/staff/library" eyebrow="Staff" />} />
              <Route path="/staff/library/books/:id" element={<BookDetailsPage basePath="/staff/library" eyebrow="Staff" />} />
              <Route path="/staff/library/books/:id/edit" element={<BookFormPage mode="edit" basePath="/staff/library" eyebrow="Staff" />} />
              <Route path="/staff/library/issues" element={<ManageIssuesPage basePath="/staff/library" eyebrow="Staff" title="Book Issues" description="Issue and return books when you manage the library." />} />
              <Route path="/staff/library/issues/create" element={<CreateIssuePage basePath="/staff/library" eyebrow="Staff" />} />
              <Route path="/staff/library/issues/overdue" element={<ManageIssuesPage basePath="/staff/library" eyebrow="Staff" title="Overdue Books" description="Monitor overdue books and fine amounts." overdueOnly />} />
              <Route path="/staff/transport/vehicles" element={<ManageVehiclesPage basePath="/staff/transport" eyebrow="Staff" title="Transport Vehicles" description="Manage transport vehicles if you handle institute transport operations." />} />
              <Route path="/staff/transport/vehicles/create" element={<VehicleFormPage basePath="/staff/transport" eyebrow="Staff" />} />
              <Route path="/staff/transport/vehicles/:id" element={<VehicleDetailsPage basePath="/staff/transport" eyebrow="Staff" />} />
              <Route path="/staff/transport/vehicles/:id/edit" element={<VehicleFormPage mode="edit" basePath="/staff/transport" eyebrow="Staff" />} />
              <Route path="/staff/transport/routes" element={<ManageRoutesPage basePath="/staff/transport" eyebrow="Staff" title="Transport Routes" description="Manage route mapping, stops, and staff assignments for transport." />} />
              <Route path="/staff/transport/routes/create" element={<RouteFormPage basePath="/staff/transport" eyebrow="Staff" />} />
              <Route path="/staff/transport/routes/:id" element={<RouteDetailsPage basePath="/staff/transport" eyebrow="Staff" />} />
              <Route path="/staff/transport/routes/:id/edit" element={<RouteFormPage mode="edit" basePath="/staff/transport" eyebrow="Staff" />} />
              <Route path="/staff/transport/allocations" element={<ManageAllocationsPage basePath="/staff/transport" eyebrow="Staff" title="Transport Allocations" description="Manage student route allocation and transport fee visibility." />} />
              <Route path="/staff/transport/allocations/create" element={<AllocationFormPage basePath="/staff/transport" eyebrow="Staff" />} />
              <Route path="/staff/transport/allocations/:id" element={<AllocationDetailsPage basePath="/staff/transport" eyebrow="Staff" />} />
              <Route path="/staff/transport/allocations/:id/edit" element={<AllocationFormPage mode="edit" basePath="/staff/transport" eyebrow="Staff" />} />
              <Route path="/staff/transport/my-route" element={<DriverRoutePage />} />
              <Route path="/staff/transport/my-students" element={<DriverStudentsPage />} />
              <Route path="/staff/hostels" element={<ManageHostelsPage basePath="/staff" eyebrow="Staff" title="Hostels" description="Review hostel setup, wardens, and hostel status." />} />
              <Route path="/staff/hostels/create" element={<HostelFormPage basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostels/:id" element={<HostelDetailsPage basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostels/:id/edit" element={<HostelFormPage mode="edit" basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostels/:hostelId/rooms" element={<ManageRoomsPage basePath="/staff" eyebrow="Staff" title="Hostel Rooms" description="Review and manage rooms for the selected hostel." nested />} />
              <Route path="/staff/hostels/:hostelId/rooms/create" element={<RoomFormPage basePath="/staff" eyebrow="Staff" nested />} />
              <Route path="/staff/hostel-rooms" element={<ManageRoomsPage basePath="/staff" eyebrow="Staff" title="Hostel Rooms" description="Review rooms across hostels with floor and status filters." />} />
              <Route path="/staff/hostel-rooms/create" element={<RoomFormPage basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostel-rooms/:id" element={<RoomDetailsPage basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostel-rooms/:id/edit" element={<RoomFormPage mode="edit" basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostel-rooms/:roomId/beds" element={<ManageBedsPage basePath="/staff" eyebrow="Staff" title="Hostel Beds" description="Review and manage room-wise bed setup." nested />} />
              <Route path="/staff/hostel-rooms/:roomId/beds/create" element={<BedFormPage basePath="/staff" eyebrow="Staff" nested />} />
              <Route path="/staff/hostel-beds" element={<ManageBedsPage basePath="/staff" eyebrow="Staff" title="Hostel Beds" description="Review hostel beds across hostels and rooms." />} />
              <Route path="/staff/hostel-beds/create" element={<BedFormPage basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostel-beds/:id" element={<BedDetailsPage basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostel-beds/:id/edit" element={<BedFormPage mode="edit" basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostel-allocations" element={<ManageHostelAllocationsPage basePath="/staff" eyebrow="Staff" title="Hostel Allocations" description="Manage student hostel allocations, leave, and cancellation flow." />} />
              <Route path="/staff/hostel-allocations/create" element={<HostelAllocationFormPage basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostel-allocations/:id" element={<HostelAllocationDetailsPage basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostel-allocations/:id/edit" element={<HostelAllocationFormPage mode="edit" basePath="/staff" eyebrow="Staff" />} />
              <Route path="/staff/hostel-outpasses" element={<ManageOutpassesPage basePath="/staff" eyebrow="Staff" title="Hostel Outpasses" description="Review hostel outpass requests and approval states." mode="manager" />} />
              <Route path="/staff/hostel-outpasses/:id" element={<HostelOutpassDetailsPage eyebrow="Staff" roleMode="manager" />} />
              <Route path="/staff/hostel-complaints" element={<ManageComplaintsPage basePath="/staff" eyebrow="Staff" title="Hostel Complaints" description="Review, assign, and resolve hostel complaints." mode="manager" />} />
              <Route path="/staff/hostel-complaints/:id" element={<HostelComplaintDetailsPage eyebrow="Staff" roleMode="manager" />} />
              <Route path="/staff/notifications" element={<Notifications />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;
