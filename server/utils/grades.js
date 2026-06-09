const calculateGrade = (marksObtained) => {
  if (marksObtained >= 90) return "A+";
  if (marksObtained >= 80) return "A";
  if (marksObtained >= 70) return "B+";
  if (marksObtained >= 60) return "B";
  if (marksObtained >= 50) return "C";
  if (marksObtained >= 33) return "D";
  return "F";
};

export { calculateGrade };
