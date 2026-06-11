# Eduvanta ERP

Eduvanta ERP is a SaaS-style MERN Stack Institution ERP for schools, colleges and universities, featuring role-based dashboards, secure authentication, institute management, academic workflows, fees, hostel, transport, library and full ERP customization.

## Security Notice

**Important**: This project is designed for development and demonstration purposes. For production deployments, ensure you:

1. **Never commit sensitive data**:
   - `.env` files containing database URIs, JWT secrets, or API keys
   - Backup folders containing user data or audit logs
   - Any files with credentials or secrets

2. **Secure your environment**:
   - Use strong, unique passwords for all accounts
   - Change default credentials immediately after first login
   - Use environment variables for all sensitive configuration
   - Enable HTTPS in production
   - Implement rate limiting and authentication throttling
   - Regularly update dependencies for security patches

3. **Database security**:
   - Use strong database passwords
   - Enable MongoDB authentication and authorization
   - Use network whitelisting for database access
   - Enable database backups with encryption

4. **Application security**:
   - Review and audit the code before production use
   - Implement proper input validation and sanitization
   - Use parameterized queries to prevent SQL/NoSQL injection
   - Enable CORS only for trusted domains
   - Implement proper session management

## Phase 1 Features

- Express + MongoDB backend setup
- JWT authentication
- bcrypt password hashing
- role-based route protection
- permission middleware starter structure
- seed script for the first superadmin
- React + Vite + Tailwind frontend
- role-based dashboard redirects

## Phase 2 Features

- Super admin institute management
- Create, list, view, update, activate/deactivate and soft delete institutes
- Create institute-specific admin users from superadmin panel
- Global UI customization for login page and dashboard shell
- Super admin analytics cards for institute overview
- Institute search and filter UI
- Status, plan and payment badges in superadmin institute pages

## Phase 3 Features

- Academic Group Management for school and college institutes
- Teacher / Faculty Management with academic group assignment
- Student Management with login accounts and academic profiles
- Parent / Guardian Management with linked students
- Staff Management with permissions
- Admin dashboard stats for institute operations
- Institute-level data isolation using `req.user.instituteId`

## Phase 4 Features

- Subject Management with teacher assignment
- Attendance Management for admin, teacher, student, and parent views
- **Admin/Super Admin Attendance Edit** - Edit submitted attendance with mandatory reason and audit log tracking
- Exam Management for academic groups
- Marks and Result Management with grade calculation
- Teacher attendance and marks upload workflow
- Student and parent attendance/result viewing
- Phase 4 dashboard cards for admin, teacher, student, and parent

## Phase 5A Features

- Notice Board for institute admins with create, list, details, edit, publish/archive, and soft delete flow
- Targeted notice visibility for teachers, students, parents, staff, and academic groups
- Basic Fees Management for single-student fee creation, editing, payment updates, and soft delete
- Student self-service fees page and parent linked-child fees pages
- Sidebar updates for notices and fees
- Existing dashboard pages updated with notice and fee cards plus latest notices sections

## Phase 5B Features

- Timetable Management for academic groups with day-wise period scheduling
- Teacher, student, and parent timetable views with institute-level access control
- Assignment / Homework Management for teachers and admin oversight
- Student assignment submission flow with late submission handling
- Teacher submission review flow with marks and feedback
- Parent linked-child assignment visibility
- Sidebar updates for timetable and assignments
- Existing dashboard pages updated with timetable and assignment stats

## Phase 6A Features

- Library Book Management for admin and librarian staff
- Book issue, return, overdue tracking, and fine updates
- Student own library history view
- Parent linked-child library view
- Librarian staff access based on designation or `library.manage` permission
- Sidebar updates for library pages
- Existing dashboard pages updated with library stats

## Phase 6B Features

- Transport Vehicle Management with create, list, details, edit, status update, and soft delete
- Transport Route and Stops Management with vehicle, driver, helper, and monthly fee mapping
- Student Transport Allocation with route stop selection, capacity validation, and fee display
- Driver Route View and assigned student pickup list
- Student own transport view and parent linked-child transport view
- Transport staff access based on `designation === "transport_staff"` or `transport.manage` permission
- Sidebar updates for admin, staff, student, and parent transport pages
- Existing dashboard pages updated with transport stats

## Phase 7A Features

- Hostel Basic Management with create, list, details, edit, status update, and soft delete
- Hostel Room Management with hostel-wise room setup, capacity, floor, and occupancy tracking
- Hostel Bed Management with room-wise bed setup and maintenance status
- Hostel Warden access based on `designation === "hostel_warden"` or `hostel.manage` permission
- Hostel Security read-only access for hostels, rooms, and beds
- Sidebar updates for hostel pages
- Existing dashboard pages updated with hostel stats

## Phase 7B Features

- Hostel Allocation with room and bed assignment, leave flow, and cancellation handling
- Student own hostel view and parent linked-child hostel view
- Hostel Outpass request, parent approval, and warden approval flow
- Hostel Complaint Management for student-raised issues and manager resolution tracking
- Hostel Warden management access and Hostel Security outpass/complaint view access
- Sidebar updates for hostel allocations, outpasses, and complaints
- Existing dashboard pages updated with hostel workflow stats

## ERP Customization Module

The ERP Customization module enables full customization of the ERP system at two levels:

### Two-Level Settings Architecture

1. **Global Settings (Super Admin)** - Default settings that apply to all institutes
2. **Institute Settings (Institute Admin)** - Institute-specific settings that override global defaults

### Customization Features

#### 1. Branding & UI Settings (ERPSettings)
- App name, short name, and tagline
- Logo and favicon
- Color scheme (primary, secondary, accent, sidebar, navbar, background, card, text)
- Button style (rounded, pill, square)
- Theme mode (light, dark, system)
- Login layout (split, centered, minimal)
- Login page customization (background, hero title, subtitle)
- Footer text
- Feature toggles (dark mode, captcha, remember me, forgot password)
- Regional settings (language, date format, time format, currency, timezone)

#### 2. Label Settings (LabelSettings)
- Customize labels for all entities (Institute, Class/Section, Teacher, Parent, Student, Staff, Subject, Exam, Result, Fee, Notice, Timetable, Assignment, Library, Transport, Hostel, Attendance, Marks)
- Institute-specific label overrides

#### 3. Module Settings (ModuleSettings)
- Enable/disable modules (academics, students, teachers, parents, staff, subjects, attendance, exams, marks, fees, notices, timetable, assignments, library, transport, hostel, payroll, reports)
- Institute-specific module availability
- Sidebar automatically hides disabled modules

#### 4. Academic Settings (AcademicSettings)
- Customize academic structure labels (academic group, sub-group, teacher, parent, student)
- Define academic levels (e.g., Class 1-10, UG/PG/PhD, Semester 1-8)
- Add custom fields for academic groups
- Template presets (School, College, University, Minimal)
- Dynamic academic group form fields

#### 5. Form Settings (FormSettings)
- Dynamic form field configuration for entities (student, teacher, parent, staff, fee, admission, hostel, transport)
- Field properties: key, label, type (text, number, select, date, textarea), required, options, placeholder
- Show/hide in form and list views
- Field ordering
- Auto-generation support with patterns

### Frontend Integration

#### Settings Pages
- **Super Admin**: `/super-admin/settings` - Global settings management with tabs for branding, labels, modules, academic, and forms
- **Institute Admin**: `/admin/settings` - Institute settings management with reset to global option

#### Dynamic Components
- **Sidebar**: Dynamically shows/hides menu items based on ModuleSettings and uses LabelSettings for labels
- **Login Page**: Uses ERPSettings from public endpoint for branding and UI customization
- **Dashboard**: Filters cards and quick action links based on enabled modules
- **Academic Group Form**: Renders dynamic fields from AcademicSettings
- **Student Form**: Renders dynamic fields from FormSettings with auto-generation support

### API Routes

#### Public Settings (No Authentication)
- `GET /api/settings/public` - Public ERP settings for login page

#### Global Settings (Super Admin Only)
- `GET /api/settings/global/erp` - Get global ERP settings
- `PUT /api/settings/global/erp` - Update global ERP settings
- `POST /api/settings/global/erp/reset` - Reset global ERP settings to defaults
- `GET /api/settings/global/labels` - Get global label settings
- `PUT /api/settings/global/labels` - Update global label settings
- `POST /api/settings/global/labels/reset` - Reset global label settings to defaults
- `GET /api/settings/global/modules` - Get global module settings
- `PUT /api/settings/global/modules` - Update global module settings
- `POST /api/settings/global/modules/reset` - Reset global module settings to defaults
- `GET /api/settings/global/academic` - Get global academic settings
- `PUT /api/settings/global/academic` - Update global academic settings
- `POST /api/settings/global/academic/reset` - Reset global academic settings to defaults or apply template
- `GET /api/settings/global/forms/:entity` - Get global form settings for entity
- `PUT /api/settings/global/forms/:entity` - Update global form settings for entity
- `POST /api/settings/global/forms/:entity/reset` - Reset global form settings to defaults

#### Institute Settings (Admin/Super Admin)
- `GET /api/settings/institute/erp` - Get institute ERP settings (falls back to global)
- `PUT /api/settings/institute/erp` - Update institute ERP settings
- `POST /api/settings/institute/erp/reset` - Reset institute ERP settings to global defaults
- `GET /api/settings/institute/labels` - Get institute label settings (falls back to global)
- `PUT /api/settings/institute/labels` - Update institute label settings
- `POST /api/settings/institute/labels/reset` - Reset institute label settings to global defaults
- `GET /api/settings/institute/modules` - Get institute module settings (falls back to global)
- `PUT /api/settings/institute/modules` - Update institute module settings
- `POST /api/settings/institute/modules/reset` - Reset institute module settings to global defaults
- `GET /api/settings/institute/academic` - Get institute academic settings (falls back to global)
- `PUT /api/settings/institute/academic` - Update institute academic settings
- `POST /api/settings/institute/academic/reset` - Reset institute academic settings to global defaults or apply template
- `GET /api/settings/institute/forms/:entity` - Get institute form settings for entity (falls back to global)
- `PUT /api/settings/institute/forms/:entity` - Update institute form settings for entity
- `POST /api/settings/institute/forms/:entity/reset` - Reset institute form settings to global defaults

### Backward Compatibility

The customization system includes built-in backward compatibility:

1. **Fallback to Defaults**: All API endpoints fall back to global settings if institute-specific settings don't exist
2. **Default Values**: Controllers return sensible defaults if no settings are configured
3. **Initialization Script**: Run `node server/initialize_settings.js` to create default settings for existing institutes
4. **No Breaking Changes**: Existing data and functionality continue to work without settings

### Initialization

For existing deployments, run the initialization script to create default settings:

```bash
cd server
node initialize_settings.js
```

This script:
- Creates default settings for all existing institutes
- Creates global default settings for Super Admin
- Skips settings that already exist
- Reports created vs skipped counts

### Testing Customization

1. **Global Settings**:
   - Login as Super Admin
   - Navigate to `/super-admin/settings`
   - Customize branding, labels, modules, academic structure, and form fields
   - Verify changes apply to all institutes

2. **Institute Settings**:
   - Login as Institute Admin
   - Navigate to `/admin/settings`
   - Customize settings for your institute
   - Use "Reset to Global" to revert to defaults
   - Verify institute-specific overrides work

3. **Module Enable/Disable**:
   - Disable a module in settings
   - Verify sidebar menu item disappears
   - Verify dashboard cards for that module hide
   - Verify quick action links hide

4. **Label Customization**:
   - Change labels (e.g., "Class" to "Grade", "Teacher" to "Faculty")
   - Verify labels update across sidebar, forms, and pages

5. **Dynamic Academic Fields**:
   - Add custom academic levels
   - Add custom fields to academic groups
   - Verify academic group form shows new fields

6. **Dynamic Form Fields**:
   - Add custom fields to student form
   - Set field types, required status, and options
   - Verify student form renders new fields

### Security & Audit

- Role-based access control (Super Admin for global, Admin for institute)
- All settings changes are logged with user information
- Public settings endpoint only returns safe, non-sensitive data
- Institute settings automatically scoped to user's institute

## Folder Structure

```text
package.json
scripts/
server/
client/
```

## Root Run Command

If you want to run the full project from the main folder:

```bash
npm run install:all
npm start
```

This starts:

- backend on `http://localhost:5000`
- frontend on `http://localhost:5173`

## Initial Setup

Run the seed script locally to create the first superadmin. Change the default password immediately after first login. Never use default credentials in production.

```bash
cd server
npm run seed
```

### Seeding Demo Data

To seed the database with pre-configured demo data including 1 school, 1 college, admins, teachers, students, parents, staff, academic groups, notices, and fees:

```bash
cd server
npm run seed:demo
```

### Login Flow

1. Open `http://localhost:5173/login`
2. Login with your superadmin credentials
3. Open `Super Admin -> Institutes`
4. Create an institute
5. Open the institute details page
6. Use `Create Admin` to create the institute admin user

## Backend Setup

Create `server/.env` with:

```env
MONGO_URI=your_mongodb_atlas_uri_here
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

Install and run backend:

```bash
cd server
npm install
npm run seed
npm run dev
```

## Frontend Setup

Install and run frontend:

```bash
cd client
npm install
npm run dev
```

## Phase 1 Routes

- Login page: `http://localhost:5173/login`
- API health: `http://localhost:5000/api/health`

## Role Redirects

- `superadmin` -> `/super-admin/dashboard`
- `admin` -> `/admin/dashboard`
- `teacher` -> `/teacher/dashboard`
- `student` -> `/student/dashboard`
- `parent` -> `/parent/dashboard`
- `staff` -> `/staff/dashboard`

## Phase 2 API Routes

Authentication:

- `POST /api/auth/login`
- `GET /api/auth/me`

Institute Management:

- `POST /api/institutes`
- `GET /api/institutes`
- `GET /api/institutes/:id`
- `PUT /api/institutes/:id`
- `PATCH /api/institutes/:id/status`
- `DELETE /api/institutes/:id`
- `POST /api/institutes/:id/admin`

Global UI Settings:

- `GET /api/ui-settings/global`
- `PUT /api/ui-settings/global`

Phase 3 Admin Routes:

- `GET /api/admin/dashboard-stats`
- `POST /api/academic-groups`
- `GET /api/academic-groups`
- `GET /api/academic-groups/:id`
- `PUT /api/academic-groups/:id`
- `PATCH /api/academic-groups/:id/status`
- `DELETE /api/academic-groups/:id`
- `POST /api/teachers`
- `GET /api/teachers`
- `GET /api/teachers/:id`
- `PUT /api/teachers/:id`
- `PATCH /api/teachers/:id/status`
- `DELETE /api/teachers/:id`
- `PATCH /api/teachers/:id/assign-academic-groups`
- `POST /api/students`
- `GET /api/students`
- `GET /api/students/:id`
- `PUT /api/students/:id`
- `PATCH /api/students/:id/status`
- `DELETE /api/students/:id`
- `PATCH /api/students/:id/assign-academic-group`
- `POST /api/parents`
- `GET /api/parents`
- `GET /api/parents/:id`
- `PUT /api/parents/:id`
- `PATCH /api/parents/:id/status`
- `DELETE /api/parents/:id`
- `PATCH /api/parents/:id/link-students`
- `POST /api/staff`
- `GET /api/staff`
- `GET /api/staff/:id`
- `PUT /api/staff/:id`
- `PATCH /api/staff/:id/status`
- `DELETE /api/staff/:id`
- `PATCH /api/staff/:id/permissions`

Phase 4 Routes:

- `GET /api/phase4-dashboard/admin`
- `GET /api/phase4-dashboard/teacher`
- `GET /api/phase4-dashboard/student`
- `GET /api/phase4-dashboard/parent`
- `POST /api/subjects`
- `GET /api/subjects`
- `GET /api/subjects/:id`
- `PUT /api/subjects/:id`
- `PATCH /api/subjects/:id/status`
- `PATCH /api/subjects/:id/assign-teacher`
- `DELETE /api/subjects/:id`
- `POST /api/attendance`
- `GET /api/attendance`
- `GET /api/attendance/:id`
- `PUT /api/attendance/:id`
- `PUT /api/attendance/:id/edit` (Admin/Super Admin only - edit submitted attendance with mandatory reason)
- `DELETE /api/attendance/:id`
- `GET /api/attendance/reports/academic-group/:academicGroupId`
- `GET /api/attendance/reports/student/:studentId`
- `GET /api/attendance/reports/my-attendance`
- `GET /api/attendance/reports/child/:studentId`
- `POST /api/exams`
- `GET /api/exams`
- `GET /api/exams/:id`
- `PUT /api/exams/:id`
- `PATCH /api/exams/:id/status`
- `DELETE /api/exams/:id`
- `POST /api/marks`
- `GET /api/marks`
- `GET /api/marks/:id`
- `PUT /api/marks/:id`
- `PATCH /api/marks/:id/status`
- `PATCH /api/marks/publish`
- `DELETE /api/marks/:id`
- `GET /api/results/student/:studentId`
- `GET /api/results/my-result`
- `GET /api/results/child/:studentId`
- `GET /api/results/exam/:examId/academic-group/:academicGroupId`

Phase 5A Routes:

- `POST /api/notices`
- `GET /api/notices`
- `GET /api/notices/my-notices`
- `GET /api/notices/:id`
- `PUT /api/notices/:id`
- `PATCH /api/notices/:id/status`
- `DELETE /api/notices/:id`
- `POST /api/fees`
- `GET /api/fees`
- `GET /api/fees/my-fees`
- `GET /api/fees/student/:studentId`
- `GET /api/fees/child/:studentId`
- `GET /api/fees/:id`
- `PUT /api/fees/:id`
- `PATCH /api/fees/:id/payment`
- `DELETE /api/fees/:id`

Phase 5B Routes:

- `POST /api/timetables`
- `GET /api/timetables`
- `GET /api/timetables/:id`
- `PUT /api/timetables/:id`
- `PATCH /api/timetables/:id/status`
- `DELETE /api/timetables/:id`
- `GET /api/timetables/my-timetable`
- `GET /api/timetables/teacher/my-timetable`
- `GET /api/timetables/child/:studentId`
- `POST /api/assignments`
- `GET /api/assignments`
- `GET /api/assignments/:id`
- `PUT /api/assignments/:id`
- `PATCH /api/assignments/:id/status`
- `DELETE /api/assignments/:id`
- `POST /api/assignments/:id/submit`
- `GET /api/assignments/:id/submissions`
- `PATCH /api/assignments/submissions/:submissionId/review`
- `GET /api/assignments/my-assignments`
- `GET /api/assignments/child/:studentId`

Phase 6A Routes:

- `POST /api/library/books`
- `GET /api/library/books`
- `GET /api/library/books/:id`
- `PUT /api/library/books/:id`
- `PATCH /api/library/books/:id/status`
- `DELETE /api/library/books/:id`
- `POST /api/library/issues`
- `GET /api/library/issues`
- `GET /api/library/issues/overdue`
- `GET /api/library/issues/student/:studentId`
- `GET /api/library/issues/my-books`
- `GET /api/library/issues/child/:studentId`
- `GET /api/library/issues/:id`
- `PATCH /api/library/issues/:id/return`
- `PATCH /api/library/issues/:id/fine`
- `DELETE /api/library/issues/:id`

Phase 6B Routes:

- `POST /api/transport/vehicles`
- `GET /api/transport/vehicles`
- `GET /api/transport/vehicles/:id`
- `PUT /api/transport/vehicles/:id`
- `PATCH /api/transport/vehicles/:id/status`
- `DELETE /api/transport/vehicles/:id`
- `POST /api/transport/routes`
- `GET /api/transport/routes`
- `GET /api/transport/routes/:id`
- `PUT /api/transport/routes/:id`
- `PATCH /api/transport/routes/:id/status`
- `DELETE /api/transport/routes/:id`
- `POST /api/transport/allocations`
- `GET /api/transport/allocations`
- `GET /api/transport/allocations/my-transport`
- `GET /api/transport/allocations/child/:studentId`
- `GET /api/transport/allocations/student/:studentId`
- `GET /api/transport/allocations/:id`
- `PUT /api/transport/allocations/:id`
- `PATCH /api/transport/allocations/:id/status`
- `DELETE /api/transport/allocations/:id`
- `GET /api/transport/driver/my-route`
- `GET /api/transport/driver/my-students`

Phase 7A Routes:

- `POST /api/hostels`
- `GET /api/hostels`
- `GET /api/hostels/:id`
- `PUT /api/hostels/:id`
- `PATCH /api/hostels/:id/status`
- `DELETE /api/hostels/:id`
- `POST /api/hostels/:hostelId/rooms`
- `GET /api/hostels/:hostelId/rooms`
- `GET /api/hostel-rooms`
- `GET /api/hostel-rooms/:id`
- `PUT /api/hostel-rooms/:id`
- `PATCH /api/hostel-rooms/:id/status`
- `DELETE /api/hostel-rooms/:id`
- `POST /api/hostel-rooms/:roomId/beds`
- `GET /api/hostel-rooms/:roomId/beds`
- `GET /api/hostel-beds`
- `GET /api/hostel-beds/:id`
- `PUT /api/hostel-beds/:id`
- `PATCH /api/hostel-beds/:id/status`
- `DELETE /api/hostel-beds/:id`

Phase 7B Routes:

- `POST /api/hostel-allocations`
- `GET /api/hostel-allocations`
- `GET /api/hostel-allocations/my-hostel`
- `GET /api/hostel-allocations/child/:studentId`
- `GET /api/hostel-allocations/student/:studentId`
- `GET /api/hostel-allocations/:id`
- `PUT /api/hostel-allocations/:id`
- `PATCH /api/hostel-allocations/:id/leave`
- `PATCH /api/hostel-allocations/:id/cancel`
- `DELETE /api/hostel-allocations/:id`
- `POST /api/hostel-outpasses`
- `GET /api/hostel-outpasses`
- `GET /api/hostel-outpasses/my-outpasses`
- `GET /api/hostel-outpasses/child/:studentId`
- `GET /api/hostel-outpasses/:id`
- `PATCH /api/hostel-outpasses/:id/parent-approval`
- `PATCH /api/hostel-outpasses/:id/warden-approval`
- `PATCH /api/hostel-outpasses/:id/cancel`
- `DELETE /api/hostel-outpasses/:id`
- `POST /api/hostel-complaints`
- `GET /api/hostel-complaints`
- `GET /api/hostel-complaints/my-complaints`
- `GET /api/hostel-complaints/child/:studentId`
- `GET /api/hostel-complaints/:id`
- `PATCH /api/hostel-complaints/:id/assign`
- `PATCH /api/hostel-complaints/:id/status`
- `DELETE /api/hostel-complaints/:id`

## Super Admin Pages

- `/super-admin/dashboard`
- `/super-admin/institutes`
- `/super-admin/institutes/create`
- `/super-admin/institutes/:id`
- `/super-admin/institutes/:id/edit`
- `/super-admin/institutes/:id/create-admin`
- `/super-admin/ui-settings`

## Admin Pages

- `/admin/dashboard`
- `/admin/academic-groups`
- `/admin/academic-groups/create`
- `/admin/academic-groups/:id`
- `/admin/academic-groups/:id/edit`
- `/admin/teachers`
- `/admin/teachers/create`
- `/admin/teachers/:id`
- `/admin/teachers/:id/edit`
- `/admin/teachers/:id/assign`
- `/admin/students`
- `/admin/students/create`
- `/admin/students/:id`
- `/admin/students/:id/edit`
- `/admin/parents`
- `/admin/parents/create`
- `/admin/parents/:id`
- `/admin/parents/:id/edit`
- `/admin/parents/:id/link-students`
- `/admin/staff`
- `/admin/staff/create`
- `/admin/staff/:id`
- `/admin/staff/:id/edit`
- `/admin/staff/:id/permissions`
- `/admin/subjects`
- `/admin/subjects/create`
- `/admin/subjects/:id`
- `/admin/subjects/:id/edit`
- `/admin/subjects/:id/assign-teacher`
- `/admin/attendance`
- `/admin/attendance/:id/edit` (Admin/Super Admin - edit submitted attendance)
- `/admin/attendance/reports`
- `/admin/attendance/students/:studentId`
- `/admin/exams`
- `/admin/exams/create`
- `/admin/exams/:id`
- `/admin/exams/:id/edit`
- `/admin/marks`
- `/admin/results`
- `/admin/results/exam/:examId/academic-group/:academicGroupId`
- `/admin/notices`
- `/admin/notices/create`
- `/admin/notices/:id`
- `/admin/notices/:id/edit`
- `/admin/fees`
- `/admin/fees/create`
- `/admin/fees/:id`
- `/admin/fees/:id/edit`
- `/admin/fees/:id/payment`
- `/admin/timetables`
- `/admin/timetables/create`
- `/admin/timetables/:id`
- `/admin/timetables/:id/edit`
- `/admin/assignments`
- `/admin/library/books`
- `/admin/library/books/create`
- `/admin/library/books/:id`
- `/admin/library/books/:id/edit`
- `/admin/library/issues`
- `/admin/library/issues/create`
- `/admin/library/issues/overdue`
- `/admin/library/students/:studentId/history`
- `/admin/transport/vehicles`
- `/admin/transport/vehicles/create`
- `/admin/transport/vehicles/:id`
- `/admin/transport/vehicles/:id/edit`
- `/admin/transport/routes`
- `/admin/transport/routes/create`
- `/admin/transport/routes/:id`
- `/admin/transport/routes/:id/edit`
- `/admin/transport/allocations`
- `/admin/transport/allocations/create`
- `/admin/transport/allocations/:id`
- `/admin/transport/allocations/:id/edit`
- `/admin/hostels`
- `/admin/hostels/create`
- `/admin/hostels/:id`
- `/admin/hostels/:id/edit`
- `/admin/hostels/:hostelId/rooms`
- `/admin/hostels/:hostelId/rooms/create`
- `/admin/hostel-rooms`
- `/admin/hostel-rooms/create`
- `/admin/hostel-rooms/:id`
- `/admin/hostel-rooms/:id/edit`
- `/admin/hostel-rooms/:roomId/beds`
- `/admin/hostel-rooms/:roomId/beds/create`
- `/admin/hostel-beds`
- `/admin/hostel-beds/create`
- `/admin/hostel-beds/:id`
- `/admin/hostel-beds/:id/edit`
- `/admin/hostel-allocations`
- `/admin/hostel-allocations/create`
- `/admin/hostel-allocations/:id`
- `/admin/hostel-allocations/:id/edit`
- `/admin/hostel-outpasses`
- `/admin/hostel-outpasses/:id`
- `/admin/hostel-complaints`
- `/admin/hostel-complaints/:id`

## Teacher Pages

- `/teacher/subjects`
- `/teacher/subjects/:id`
- `/teacher/attendance`
- `/teacher/attendance/mark`
- `/teacher/attendance/history`
- `/teacher/exams`
- `/teacher/marks`
- `/teacher/marks/upload`
- `/teacher/marks/history`
- `/teacher/notices`
- `/teacher/timetable`
- `/teacher/assignments`
- `/teacher/assignments/create`
- `/teacher/assignments/:id`
- `/teacher/assignments/:id/edit`
- `/teacher/assignments/:id/submissions`

## Student Pages

- `/student/attendance`
- `/student/exams`
- `/student/results`
- `/student/notices`
- `/student/fees`
- `/student/timetable`
- `/student/assignments`
- `/student/assignments/:id`
- `/student/assignments/:id/submit`
- `/student/library`
- `/student/transport`
- `/student/hostel`
- `/student/hostel/outpasses`
- `/student/hostel/outpasses/create`
- `/student/hostel/outpasses/:id`
- `/student/hostel/complaints`
- `/student/hostel/complaints/create`
- `/student/hostel/complaints/:id`

## Parent Pages

- `/parent/attendance`
- `/parent/children/:studentId/attendance`
- `/parent/exams`
- `/parent/results`
- `/parent/children/:studentId/results`
- `/parent/notices`
- `/parent/fees`
- `/parent/children/:studentId/fees`
- `/parent/timetable`
- `/parent/children/:studentId/timetable`
- `/parent/assignments`
- `/parent/children/:studentId/assignments`
- `/parent/library`
- `/parent/children/:studentId/library`
- `/parent/hostel`
- `/parent/children/:studentId/hostel`
- `/parent/hostel/outpasses`
- `/parent/children/:studentId/hostel/outpasses`
- `/parent/hostel/outpasses/:id`
- `/parent/hostel/complaints`
- `/parent/children/:studentId/hostel/complaints`
- `/parent/hostel/complaints/:id`
- `/parent/transport`
- `/parent/children/:studentId/transport`

## Staff Pages

- `/staff/dashboard`
- `/staff/notices`
- `/staff/library/books`
- `/staff/library/books/create`
- `/staff/library/books/:id`
- `/staff/library/books/:id/edit`
- `/staff/library/issues`
- `/staff/library/issues/create`
- `/staff/library/issues/overdue`
- `/staff/transport/vehicles`
- `/staff/transport/vehicles/create`
- `/staff/transport/vehicles/:id`
- `/staff/transport/vehicles/:id/edit`
- `/staff/transport/routes`
- `/staff/transport/routes/create`
- `/staff/transport/routes/:id`
- `/staff/transport/routes/:id/edit`
- `/staff/transport/allocations`
- `/staff/transport/allocations/create`
- `/staff/transport/allocations/:id`
- `/staff/transport/allocations/:id/edit`
- `/staff/transport/my-route`
- `/staff/transport/my-students`
- `/staff/hostels`
- `/staff/hostels/create`
- `/staff/hostels/:id`
- `/staff/hostels/:id/edit`
- `/staff/hostels/:hostelId/rooms`
- `/staff/hostels/:hostelId/rooms/create`
- `/staff/hostel-rooms`
- `/staff/hostel-rooms/create`
- `/staff/hostel-rooms/:id`
- `/staff/hostel-rooms/:id/edit`
- `/staff/hostel-rooms/:roomId/beds`
- `/staff/hostel-rooms/:roomId/beds/create`
- `/staff/hostel-beds`
- `/staff/hostel-beds/create`
- `/staff/hostel-beds/:id`
- `/staff/hostel-beds/:id/edit`
- `/staff/hostel-allocations`
- `/staff/hostel-allocations/create`
- `/staff/hostel-allocations/:id`
- `/staff/hostel-allocations/:id/edit`
- `/staff/hostel-outpasses`
- `/staff/hostel-outpasses/:id`
- `/staff/hostel-complaints`
- `/staff/hostel-complaints/:id`

## Data Isolation Rule

- Institute-specific records always use `instituteId`
- Admin users can only manage records from their own institute
- Superadmin can pass institute scope only where explicitly needed
- Frontend never blindly decides institute scope for admin-created records

## Exact Commands

First-time install from root:

```bash
npm run install:all
```

Seed the default superadmin:

```bash
npm run seed
```

Run full project from root:

```bash
npm start
```

## Phase 4 Test Flow

1. Login as `superadmin@eduvanta.com` and create an institute admin if not already created.
2. Login as the institute admin.
3. Create academic groups, teachers, and students.
4. Create a subject and assign a teacher to it.
5. Create an exam for the same academic group.
6. Login as the assigned teacher and mark attendance.
7. From teacher marks upload, select exam and subject, then upload student marks.
8. Login as student to check `/student/attendance` and `/student/results`.
9. Login as parent to check linked child attendance and results pages.

## Phase 5A Test Flow

1. Login as `superadmin@eduvanta.com` and create an institute admin if needed.
2. Login as the institute admin.
3. Make sure at least one academic group, student, and parent-child link already exists from earlier phases.
4. Open `/admin/notices` and create a draft notice.
5. Publish a notice for `all`, then create another one for `students`, `parents`, or `academic_group`.
6. Login as teacher, student, parent, and staff to verify only targeted notices are shown on dashboard and notice pages.
7. Open `/admin/fees/create` and create a fee for one student.
8. Visit `/admin/fees` to filter by student, group, status, and fee type.
9. Use `/admin/fees/:id/payment` to mark a payment and recheck status changes.
10. Login as the student to verify `/student/fees`.
11. Login as the linked parent to verify `/parent/fees` and `/parent/children/:studentId/fees`.

## Phase 5B Test Flow

1. Login as institute admin.
2. Create or confirm academic groups, teachers, students, and subjects already exist.
3. Open `/admin/timetables/create` and create one day timetable for an academic group.
4. Verify `/admin/timetables`, `/admin/timetables/:id`, and edit flow.
5. Login as assigned teacher and verify `/teacher/timetable`.
6. Login as student and verify `/student/timetable`.
7. Login as linked parent and verify `/parent/timetable` and `/parent/children/:studentId/timetable`.
8. Login as teacher and open `/teacher/assignments/create`.
9. Create an assignment for one assigned group and subject, then publish it.
10. Open `/teacher/assignments/:id/submissions` after a student submits work.
11. Login as student, verify `/student/assignments`, then submit from `/student/assignments/:id/submit`.
12. Login back as teacher, review the submission, and add marks plus feedback.
13. Login as parent and verify `/parent/assignments` and `/parent/children/:studentId/assignments`.

## Phase 6A Test Flow

1. Login as institute admin or librarian staff.
2. Open `/admin/library/books/create` or `/staff/library/books/create` and create a book.
3. Verify `/admin/library/books` or `/staff/library/books` list, detail, edit, and status update flow.
4. Open `/admin/library/issues/create` or `/staff/library/issues/create` and issue the book to a student.
5. Verify available copies decrease after issue.
6. Open overdue page and confirm overdue items appear after due date passes.
7. Return the book and verify available copies increase again.
8. Update fine manually from the issues page if needed.
9. Login as student and verify `/student/library`.
10. Login as parent and verify `/parent/library` and `/parent/children/:studentId/library`.

## Phase 6B Test Flow

1. Login as institute admin.
2. Open `/admin/staff/create` and create a `driver` staff user and optionally a `transport_staff` user.
3. Open `/admin/transport/vehicles/create` and create a vehicle with driver/helper assignment.
4. Verify `/admin/transport/vehicles`, details page, edit flow, status update, and soft delete.
5. Open `/admin/transport/routes/create` and create a route with at least two stops, a vehicle, and a driver.
6. Verify `/admin/transport/routes`, details page, edit flow, and route status update.
7. Open `/admin/transport/allocations/create` and allocate one student to a route stop.
8. Verify duplicate active allocation is blocked for the same student.
9. Verify route capacity validation by trying to exceed vehicle capacity.
10. Login as transport staff and verify `/staff/transport/vehicles`, `/staff/transport/routes`, and `/staff/transport/allocations`.
11. Login as driver and verify `/staff/transport/my-route` and `/staff/transport/my-students`.
12. Login as student and verify `/student/transport`.
13. Login as parent and verify `/parent/transport` and `/parent/children/:studentId/transport`.

## Phase 7A Test Flow

1. Login as institute admin.
2. Open `/admin/staff/create` and create a `hostel_warden` user and optionally a `hostel_security` user.
3. Open `/admin/hostels/create` and create a hostel with hostel type, floors, and warden.
4. Verify `/admin/hostels`, hostel detail page, edit flow, status update, and soft delete.
5. Open `/admin/hostels/:hostelId/rooms/create` and create rooms under that hostel.
6. Verify `/admin/hostel-rooms`, room detail page, room edit flow, and status update.
7. Open `/admin/hostel-rooms/:roomId/beds/create` and create beds under the room.
8. Verify room capacity block when trying to create beds beyond room capacity.
9. Verify `/admin/hostel-beds`, bed detail page, bed edit flow, and maintenance/inactive status changes.
10. Login as hostel warden and verify hostel, room, and bed create/edit/list flows under `/staff/...`.
11. Login as hostel security and verify `/staff/hostels`, `/staff/hostels/:id`, `/staff/hostel-rooms/:id`, and `/staff/hostel-beds/:id` are view-only.

## Phase 7B Test Flow

1. Login as institute admin or hostel warden.
2. Open `/admin/hostel-allocations/create` or `/staff/hostel-allocations/create` and allocate one student to one hostel room and bed.
3. Verify the bed becomes `occupied`, the room occupied count increases, and the room becomes `full` when capacity is reached.
4. Verify duplicate active hostel allocation is blocked for the same student.
5. Mark an allocation as `left` or `cancelled` and verify the bed becomes `available` again.
6. Login as student and verify `/student/hostel`.
7. Login as parent and verify `/parent/hostel` and `/parent/children/:studentId/hostel`.
8. Login as student and create an outpass from `/student/hostel/outpasses/create`.
9. Login as parent and approve or reject from `/parent/children/:studentId/hostel/outpasses`.
10. Login as hostel warden or admin and approve or reject from `/admin/hostel-outpasses` or `/staff/hostel-outpasses`.
11. Login as student and create a hostel complaint from `/student/hostel/complaints/create`.
12. Login as admin or hostel warden and review `/admin/hostel-complaints` or `/staff/hostel-complaints`, assign staff, and update complaint status.
13. Login as hostel security and verify `/staff/hostel-outpasses` and `/staff/hostel-complaints` are visible but management actions remain restricted.

## Demo Data Seeding

To populate the database with comprehensive demo records for testing school, college, and university flows, run the following command in the server folder:

```bash
cd server
npm run seed:demo
```

This seeds:
- 3 Institutes (Sunrise Public School `SPS`, Eduvanta Degree College `EDC`, Eduvanta University `EDU`)
- 3 Admins, 5 Teachers, 20 Students, 10 Parents, 5 Staff members, 5 Subjects, 5 Notices, 5 Fees, 3 Timetable records, 3 Library books, 2 Transport routes, and 1 Hostel with rooms and beds.

Optional individual commands:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

## Demo UI Polish Completed

The Eduvanta ERP UI has been successfully polished for presentation and demo readiness. Key enhancements include:
- Telegram-style circular theme transition polished (600ms viewport-fixed reveal animation with 45% class switch threshold and double-click protection).
- Light mode contrast improved (clean white cards, clean borders, high-readability muted labels, and prominent soft-teal active highlights).
- SaaS-style footer added (3-column layout on desktop, stacked on mobile, consistent spacing, and subtle top border).
- Unified sidebar navigation incorporating accordion expand/collapse transitions, clean grouping, and consistent icon scaling.
- Highly responsive navbar header with consistent layout height, hiding or collapsing search bar and selectors on smaller viewports.
- Enhanced "Create Institute" primary CTA button with plus icons and hover scaling states.
- Clean EmptyState templates configured globally to display informative descriptions and context-specific CTAs.
