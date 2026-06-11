/**
 * Initialize Default Settings for Existing Institutes
 * 
 * This script ensures backward compatibility by creating default settings
 * for existing institutes that don't have settings configured yet.
 * 
 * Run this script after deploying the customization module to ensure
 * all existing institutes have default settings.
 */

const mongoose = require('mongoose');
const Institute = require('./models/Institute');
const ERPSettings = require('./models/ERPSettings');
const LabelSettings = require('./models/LabelSettings');
const ModuleSettings = require('./models/ModuleSettings');
const AcademicSettings = require('./models/AcademicSettings');
const FormSettings = require('./models/FormSettings');

require('dotenv').config();

const defaultERPSettings = {
  appName: "Eduvanta ERP",
  appShortName: "Eduvanta",
  tagline: "Complete Institution Management System",
  logo: "",
  favicon: "",
  primaryColor: "#0f766e",
  secondaryColor: "#f59e0b",
  accentColor: "#3b82f6",
  sidebarColor: "#0f172a",
  navbarColor: "#ffffff",
  backgroundColor: "#f8fafc",
  cardColor: "#ffffff",
  textColor: "#1e293b",
  buttonStyle: "rounded",
  themeMode: "system",
  loginLayout: "split",
  loginBackground: "",
  loginHeroTitle: "Welcome Back",
  loginHeroSubtitle: "Sign in to access your dashboard",
  footerText: "© 2024 Eduvanta ERP. All rights reserved.",
  enableDarkMode: true,
  enableCaptcha: false,
  enableRememberMe: true,
  enableForgotPassword: true,
  defaultLanguage: "en",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  currency: "USD",
  timezone: "UTC",
};

const defaultLabelSettings = {
  labels: {
    instituteLabel: "Institute",
    academicGroupLabel: "Class",
    subGroupLabel: "Section",
    teacherLabel: "Teacher",
    parentLabel: "Parent",
    studentLabel: "Student",
    staffLabel: "Staff",
    subjectLabel: "Subject",
    examLabel: "Exam",
    resultLabel: "Result",
    feeLabel: "Fee",
    noticeLabel: "Notice",
    timetableLabel: "Timetable",
    assignmentLabel: "Assignment",
    libraryLabel: "Library",
    transportLabel: "Transport",
    hostelLabel: "Hostel",
    attendanceLabel: "Attendance",
    marksLabel: "Marks",
  },
};

const defaultModuleSettings = {
  modules: {
    academics: true,
    students: true,
    teachers: true,
    parents: true,
    staff: true,
    subjects: true,
    attendance: true,
    exams: true,
    marks: true,
    fees: true,
    notices: true,
    timetable: true,
    assignments: true,
    library: true,
    transport: true,
    hostel: true,
    payroll: false,
    reports: true,
  },
};

const defaultAcademicSettings = {
  academicGroupLabel: "Class",
  subGroupLabel: "Section",
  teacherLabel: "Teacher",
  parentLabel: "Parent",
  studentLabel: "Student",
  levels: [
    { name: "Class 1", order: 1, status: "active" },
    { name: "Class 2", order: 2, status: "active" },
    { name: "Class 3", order: 3, status: "active" },
    { name: "Class 4", order: 4, status: "active" },
    { name: "Class 5", order: 5, status: "active" },
    { name: "Class 6", order: 6, status: "active" },
    { name: "Class 7", order: 7, status: "active" },
    { name: "Class 8", order: 8, status: "active" },
    { name: "Class 9", order: 9, status: "active" },
    { name: "Class 10", order: 10, status: "active" },
  ],
  fields: [],
};

const defaultFormSettings = {
  entity: "student",
  fields: [],
};

async function initializeSettings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduvantaerp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all institutes
    const institutes = await Institute.find({});
    console.log(`Found ${institutes.length} institutes`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const institute of institutes) {
      console.log(`\nProcessing institute: ${institute.name} (${institute._id})`);

      // Check and create ERP Settings
      const existingERPSettings = await ERPSettings.findOne({ instituteId: institute._id });
      if (!existingERPSettings) {
        await ERPSettings.create({ ...defaultERPSettings, instituteId: institute._id });
        console.log('  ✓ Created ERP Settings');
        createdCount++;
      } else {
        console.log('  - ERP Settings already exist, skipping');
        skippedCount++;
      }

      // Check and create Label Settings
      const existingLabelSettings = await LabelSettings.findOne({ instituteId: institute._id });
      if (!existingLabelSettings) {
        await LabelSettings.create({ ...defaultLabelSettings, instituteId: institute._id });
        console.log('  ✓ Created Label Settings');
        createdCount++;
      } else {
        console.log('  - Label Settings already exist, skipping');
        skippedCount++;
      }

      // Check and create Module Settings
      const existingModuleSettings = await ModuleSettings.findOne({ instituteId: institute._id });
      if (!existingModuleSettings) {
        await ModuleSettings.create({ ...defaultModuleSettings, instituteId: institute._id });
        console.log('  ✓ Created Module Settings');
        createdCount++;
      } else {
        console.log('  - Module Settings already exist, skipping');
        skippedCount++;
      }

      // Check and create Academic Settings
      const existingAcademicSettings = await AcademicSettings.findOne({ instituteId: institute._id });
      if (!existingAcademicSettings) {
        await AcademicSettings.create({ ...defaultAcademicSettings, instituteId: institute._id });
        console.log('  ✓ Created Academic Settings');
        createdCount++;
      } else {
        console.log('  - Academic Settings already exist, skipping');
        skippedCount++;
      }

      // Check and create Form Settings for student
      const existingFormSettings = await FormSettings.findOne({ instituteId: institute._id, entity: 'student' });
      if (!existingFormSettings) {
        await FormSettings.create({ ...defaultFormSettings, instituteId: institute._id, entity: 'student' });
        console.log('  ✓ Created Form Settings (student)');
        createdCount++;
      } else {
        console.log('  - Form Settings (student) already exist, skipping');
        skippedCount++;
      }
    }

    // Ensure global settings exist (for superadmin)
    console.log('\nChecking global settings...');
    const globalERPSettings = await ERPSettings.findOne({ instituteId: null });
    if (!globalERPSettings) {
      await ERPSettings.create({ ...defaultERPSettings, instituteId: null });
      console.log('  ✓ Created Global ERP Settings');
      createdCount++;
    } else {
      console.log('  - Global ERP Settings already exist, skipping');
      skippedCount++;
    }

    const globalLabelSettings = await LabelSettings.findOne({ instituteId: null });
    if (!globalLabelSettings) {
      await LabelSettings.create({ ...defaultLabelSettings, instituteId: null });
      console.log('  ✓ Created Global Label Settings');
      createdCount++;
    } else {
      console.log('  - Global Label Settings already exist, skipping');
      skippedCount++;
    }

    const globalModuleSettings = await ModuleSettings.findOne({ instituteId: null });
    if (!globalModuleSettings) {
      await ModuleSettings.create({ ...defaultModuleSettings, instituteId: null });
      console.log('  ✓ Created Global Module Settings');
      createdCount++;
    } else {
      console.log('  - Global Module Settings already exist, skipping');
      skippedCount++;
    }

    const globalAcademicSettings = await AcademicSettings.findOne({ instituteId: null });
    if (!globalAcademicSettings) {
      await AcademicSettings.create({ ...defaultAcademicSettings, instituteId: null });
      console.log('  ✓ Created Global Academic Settings');
      createdCount++;
    } else {
      console.log('  - Global Academic Settings already exist, skipping');
      skippedCount++;
    }

    console.log(`\n✅ Initialization complete!`);
    console.log(`   Created: ${createdCount} settings`);
    console.log(`   Skipped: ${skippedCount} settings (already existed)`);

  } catch (error) {
    console.error('Error initializing settings:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the initialization
initializeSettings();
