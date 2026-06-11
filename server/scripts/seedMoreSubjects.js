import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Institute from "../models/Institute.js";
import AcademicGroup from "../models/AcademicGroup.js";
import Subject from "../models/Subject.js";
import Teacher from "../models/Teacher.js";
import Admin from "../models/Admin.js";

dotenv.config();

const seedMoreSubjects = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for seeding more subjects...");

    // Find institutes
    const schoolInst = await Institute.findOne({ instituteCode: "SPS" });
    const collegeInst = await Institute.findOne({ instituteCode: "EDC" });
    const universityInst = await Institute.findOne({ instituteCode: "EDU" });

    if (!schoolInst || !collegeInst || !universityInst) {
      console.log("Institutes not found. Please run seedDemoData.js first.");
      process.exit(1);
    }

    // Find academic groups
    const schoolGroup = await AcademicGroup.findOne({ instituteId: schoolInst._id, className: "Class 10" });
    const collegeGroup = await AcademicGroup.findOne({ instituteId: collegeInst._id, course: "B.Tech" });
    const universityGroup = await AcademicGroup.findOne({ instituteId: universityInst._id, course: "M.Sc" });

    if (!schoolGroup || !collegeGroup || !universityGroup) {
      console.log("Academic groups not found. Please run seedDemoData.js first.");
      process.exit(1);
    }

    // Find teachers
    const spsTeacher1 = await Teacher.findOne({ instituteId: schoolInst._id, email: /spsteacher1/ });
    const spsTeacher2 = await Teacher.findOne({ instituteId: schoolInst._id, email: /spsteacher2/ });
    const edcTeacher1 = await Teacher.findOne({ instituteId: collegeInst._id, email: /edcteacher1/ });
    const edcTeacher2 = await Teacher.findOne({ instituteId: collegeInst._id, email: /edcteacher2/ });
    const eduTeacher1 = await Teacher.findOne({ instituteId: universityInst._id, email: /eduteacher1/ });

    // Find admins
    const schoolAdmin = await Admin.findOne({ instituteId: schoolInst._id, email: /spsadmin/ });
    const collegeAdmin = await Admin.findOne({ instituteId: collegeInst._id, email: /edcadmin/ });
    const universityAdmin = await Admin.findOne({ instituteId: universityInst._id, email: /eduadmin/ });

    console.log("Adding more subjects to Sunrise Public School (SPS)...");
    const spsSubjects = [
      {
        instituteId: schoolInst._id,
        academicGroupId: schoolGroup._id,
        subjectName: "Physics",
        subjectCode: "PHY101",
        subjectType: "core",
        teacherId: spsTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 33,
        createdBy: schoolAdmin?._id || null,
      },
      {
        instituteId: schoolInst._id,
        academicGroupId: schoolGroup._id,
        subjectName: "Chemistry",
        subjectCode: "CHEM101",
        subjectType: "core",
        teacherId: spsTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 33,
        createdBy: schoolAdmin?._id || null,
      },
      {
        instituteId: schoolInst._id,
        academicGroupId: schoolGroup._id,
        subjectName: "Biology",
        subjectCode: "BIO101",
        subjectType: "core",
        teacherId: spsTeacher2?._id || null,
        totalMarks: 100,
        passingMarks: 33,
        createdBy: schoolAdmin?._id || null,
      },
      {
        instituteId: schoolInst._id,
        academicGroupId: schoolGroup._id,
        subjectName: "History",
        subjectCode: "HIST101",
        subjectType: "core",
        teacherId: spsTeacher2?._id || null,
        totalMarks: 100,
        passingMarks: 33,
        createdBy: schoolAdmin?._id || null,
      },
      {
        instituteId: schoolInst._id,
        academicGroupId: schoolGroup._id,
        subjectName: "Geography",
        subjectCode: "GEOG101",
        subjectType: "core",
        teacherId: spsTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 33,
        createdBy: schoolAdmin?._id || null,
      },
      {
        instituteId: schoolInst._id,
        academicGroupId: schoolGroup._id,
        subjectName: "Computer Science",
        subjectCode: "CS101",
        subjectType: "elective",
        teacherId: spsTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 33,
        createdBy: schoolAdmin?._id || null,
      },
      {
        instituteId: schoolInst._id,
        academicGroupId: schoolGroup._id,
        subjectName: "Physical Education",
        subjectCode: "PE101",
        subjectType: "practical",
        teacherId: spsTeacher2?._id || null,
        totalMarks: 50,
        passingMarks: 20,
        createdBy: schoolAdmin?._id || null,
      },
      {
        instituteId: schoolInst._id,
        academicGroupId: schoolGroup._id,
        subjectName: "Art & Craft",
        subjectCode: "ART101",
        subjectType: "elective",
        teacherId: spsTeacher2?._id || null,
        totalMarks: 50,
        passingMarks: 20,
        createdBy: schoolAdmin?._id || null,
      },
    ];

    console.log("Adding more subjects to Eduvanta Degree College (EDC)...");
    const edcSubjects = [
      {
        instituteId: collegeInst._id,
        academicGroupId: collegeGroup._id,
        subjectName: "Database Management Systems",
        subjectCode: "CS203",
        subjectType: "core",
        teacherId: edcTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 40,
        createdBy: collegeAdmin?._id || null,
      },
      {
        instituteId: collegeInst._id,
        academicGroupId: collegeGroup._id,
        subjectName: "Computer Networks",
        subjectCode: "CS204",
        subjectType: "core",
        teacherId: edcTeacher2?._id || null,
        totalMarks: 100,
        passingMarks: 40,
        createdBy: collegeAdmin?._id || null,
      },
      {
        instituteId: collegeInst._id,
        academicGroupId: collegeGroup._id,
        subjectName: "Software Engineering",
        subjectCode: "CS205",
        subjectType: "core",
        teacherId: edcTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 40,
        createdBy: collegeAdmin?._id || null,
      },
      {
        instituteId: collegeInst._id,
        academicGroupId: collegeGroup._id,
        subjectName: "Web Technologies",
        subjectCode: "CS206",
        subjectType: "elective",
        teacherId: edcTeacher2?._id || null,
        totalMarks: 100,
        passingMarks: 40,
        createdBy: collegeAdmin?._id || null,
      },
      {
        instituteId: collegeInst._id,
        academicGroupId: collegeGroup._id,
        subjectName: "Machine Learning",
        subjectCode: "CS207",
        subjectType: "elective",
        teacherId: edcTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 40,
        createdBy: collegeAdmin?._id || null,
      },
      {
        instituteId: collegeInst._id,
        academicGroupId: collegeGroup._id,
        subjectName: "Mathematics III",
        subjectCode: "MATH201",
        subjectType: "core",
        teacherId: edcTeacher2?._id || null,
        totalMarks: 100,
        passingMarks: 40,
        createdBy: collegeAdmin?._id || null,
      },
      {
        instituteId: collegeInst._id,
        academicGroupId: collegeGroup._id,
        subjectName: "Digital Logic Design",
        subjectCode: "ECE201",
        subjectType: "core",
        teacherId: edcTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 40,
        createdBy: collegeAdmin?._id || null,
      },
      {
        instituteId: collegeInst._id,
        academicGroupId: collegeGroup._id,
        subjectName: "DBMS Lab",
        subjectCode: "CS201L",
        subjectType: "lab",
        teacherId: edcTeacher2?._id || null,
        totalMarks: 50,
        passingMarks: 20,
        createdBy: collegeAdmin?._id || null,
      },
      {
        instituteId: collegeInst._id,
        academicGroupId: collegeGroup._id,
        subjectName: "Networks Lab",
        subjectCode: "CS204L",
        subjectType: "lab",
        teacherId: edcTeacher1?._id || null,
        totalMarks: 50,
        passingMarks: 20,
        createdBy: collegeAdmin?._id || null,
      },
    ];

    console.log("Adding more subjects to Eduvanta University (EDU)...");
    const eduSubjects = [
      {
        instituteId: universityInst._id,
        academicGroupId: universityGroup._id,
        subjectName: "Classical Mechanics",
        subjectCode: "PHY502",
        subjectType: "core",
        teacherId: eduTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 50,
        createdBy: universityAdmin?._id || null,
      },
      {
        instituteId: universityInst._id,
        academicGroupId: universityGroup._id,
        subjectName: "Electrodynamics",
        subjectCode: "PHY503",
        subjectType: "core",
        teacherId: eduTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 50,
        createdBy: universityAdmin?._id || null,
      },
      {
        instituteId: universityInst._id,
        academicGroupId: universityGroup._id,
        subjectName: "Statistical Mechanics",
        subjectCode: "PHY504",
        subjectType: "core",
        teacherId: eduTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 50,
        createdBy: universityAdmin?._id || null,
      },
      {
        instituteId: universityInst._id,
        academicGroupId: universityGroup._id,
        subjectName: "Solid State Physics",
        subjectCode: "PHY505",
        subjectType: "core",
        teacherId: eduTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 50,
        createdBy: universityAdmin?._id || null,
      },
      {
        instituteId: universityInst._id,
        academicGroupId: universityGroup._id,
        subjectName: "Quantum Field Theory",
        subjectCode: "PHY601",
        subjectType: "elective",
        teacherId: eduTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 50,
        createdBy: universityAdmin?._id || null,
      },
      {
        instituteId: universityInst._id,
        academicGroupId: universityGroup._id,
        subjectName: "Advanced Mathematics",
        subjectCode: "MATH501",
        subjectType: "core",
        teacherId: eduTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 50,
        createdBy: universityAdmin?._id || null,
      },
      {
        instituteId: universityInst._id,
        academicGroupId: universityGroup._id,
        subjectName: "Research Methodology",
        subjectCode: "RES501",
        subjectType: "research",
        teacherId: eduTeacher1?._id || null,
        totalMarks: 100,
        passingMarks: 50,
        createdBy: universityAdmin?._id || null,
      },
    ];

    // Clear existing subjects for these institutes to avoid duplicates
    console.log("Clearing existing subjects for these institutes...");
    await Subject.deleteMany({ instituteId: schoolInst._id });
    await Subject.deleteMany({ instituteId: collegeInst._id });
    await Subject.deleteMany({ instituteId: universityInst._id });

    // Insert new subjects
    console.log("Inserting new subjects...");
    const spsCreated = await Subject.insertMany(spsSubjects);
    console.log(`Created ${spsCreated.length} subjects for SPS`);

    const edcCreated = await Subject.insertMany(edcSubjects);
    console.log(`Created ${edcCreated.length} subjects for EDC`);

    const eduCreated = await Subject.insertMany(eduSubjects);
    console.log(`Created ${eduCreated.length} subjects for EDU`);

    const totalCreated = spsCreated.length + edcCreated.length + eduCreated.length;
    console.log(`\n✅ Successfully seeded ${totalCreated} subjects in total!`);
    console.log(`   - SPS: ${spsCreated.length} subjects`);
    console.log(`   - EDC: ${edcCreated.length} subjects`);
    console.log(`   - EDU: ${eduCreated.length} subjects`);

    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedMoreSubjects();
