import { Link } from "react-router-dom";

export const StatCardSkeleton = () => (
  <div className="skeleton-surface rounded-[1.75rem] p-6 shadow-card min-h-[130px] flex flex-col justify-between">
    <div>
      <div className="skeleton-block h-3 w-24 rounded-full" />
    </div>
    <div className="skeleton-block h-9 w-16 rounded-xl" />
  </div>
);

const getDefaultDetail = (label) => {
  const l = label.toLowerCase();
  if (l.includes("attendance percentage")) return "Overall attendance rate for this term";
  if (l.includes("today attendance")) return "Students marked present today";
  if (l.includes("attendance")) return "Class attendance logs and history";
  
  if (l.includes("latest exam")) return "Schedule of upcoming exams";
  if (l.includes("total exams")) return "Exams created this academic term";
  if (l.includes("exam")) return "Examination schedule and details";
  
  if (l.includes("latest result")) return "Performance in recent exams";
  if (l.includes("published results")) return "Marksheets published to portals";
  if (l.includes("result") || l.includes("grade") || l.includes("marks")) return "Academic results and performance";

  if (l.includes("total subjects")) return "Enrolled courses and subjects";
  if (l.includes("subject")) return "Registered subjects and syllabus";

  if (l.includes("pending fees")) return "Outstanding fee payments due";
  if (l.includes("paid fees")) return "Fees successfully collected";
  if (l.includes("fee")) return "Fee structure and invoice details";

  if (l.includes("today timetable")) return "Scheduled classes for today";
  if (l.includes("active timetables")) return "Timetables active for groups";
  if (l.includes("timetable") || l.includes("period")) return "Class and period schedules";

  if (l.includes("pending assignments")) return "Assignments awaiting submission";
  if (l.includes("active assignments")) return "Assignments currently open";
  if (l.includes("assignment") || l.includes("submission")) return "Tasks and homework assignments";

  if (l.includes("my issued books")) return "Books checked out from library";
  if (l.includes("my overdue books")) return "Borrowed books past due date";
  if (l.includes("available books")) return "Copies available on shelves";
  if (l.includes("issued books")) return "Books currently checked out";
  if (l.includes("overdue books")) return "Checked out books past due date";
  if (l.includes("total books")) return "Total book titles in library";
  if (l.includes("book") || l.includes("library")) return "Library books and assets";

  if (l.includes("my transport route")) return "Assigned route and vehicle details";
  if (l.includes("pickup stop")) return "Boarding point for your route";
  if (l.includes("active routes")) return "Active routes for transport";
  if (l.includes("transport students")) return "Students allocated to transport";
  if (l.includes("vehicles in maintenance")) return "Vehicles undergoing repairs";
  if (l.includes("total vehicles")) return "Fleet vehicles in registry";
  if (l.includes("vehicle") || l.includes("transport") || l.includes("route") || l.includes("stop")) return "Transport routes and vehicles";

  if (l.includes("my hostel room")) return "Your allocated room details";
  if (l.includes("pending outpasses") || l.includes("pending hostel outpasses")) return "Gate pass requests to review";
  if (l.includes("open complaints") || l.includes("open hostel complaints")) return "Unresolved hostel complaints";
  if (l.includes("available beds")) return "Vacant beds in rooms";
  if (l.includes("beds in maintenance")) return "Beds/rooms under repair";
  if (l.includes("hostel students")) return "Students residing in hostels";
  if (l.includes("active hostels")) return "Hostels currently operating";
  if (l.includes("total hostels")) return "Total hostel facilities";
  if (l.includes("hostel") || l.includes("room") || l.includes("bed") || l.includes("outpass") || l.includes("complaint")) return "Hostel rooms and management";

  if (l.includes("total students") || l.includes("active students")) return "Total registered students";
  if (l.includes("total teachers") || l.includes("total faculty")) return "Active teaching staff members";
  if (l.includes("total parents") || l.includes("total guardians")) return "Registered parent accounts";
  if (l.includes("total staff") || l.includes("active staff")) return "Active non-teaching staff members";
  if (l.includes("total academic groups")) return "Registered academic batches";

  if (l.includes("published notices")) return "Notices broadcasted to users";
  if (l.includes("draft notices")) return "Notices saved for future broadcast";
  if (l.includes("notice")) return "Broadcasted announcements";

  if (l.includes("profile")) return "Your account profile details";
  
  return "Click to view detailed dashboard page";
};

const StatCard = ({ to, color, label, value, icon: Icon, detail }) => {
  const displayDetail = detail !== undefined ? detail : getDefaultDetail(label);

  const CardContent = (
    <>
      {/* Background watermark icon */}
      {Icon && (
        <div className="absolute -right-4 -bottom-4 text-white/[0.20] text-8xl pointer-events-none transform -rotate-12 group-hover:scale-110 transition-transform duration-500 transform-gpu will-change-transform">
          <Icon />
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-col justify-between h-full min-h-[100px] z-10 relative">
        {/* Top: Label and glassmorphic icon */}
        <div className="flex items-start justify-between gap-4">
          <span className="text-[18px] font-bold uppercase tracking-wider text-white/95 leading-snug flex-1">
            {label}
          </span>
          {Icon && (
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-white/20 text-white text-base backdrop-blur-md shadow-inner border border-white/10 group-hover:bg-white/35 group-hover:scale-110 transition-all duration-300">
              <Icon />
            </div>
          )}
        </div>
        
        {/* Bottom: Value and detail */}
        <div className="mt-5">
          <h3 className="text-4xl font-black tracking-tight text-white line-clamp-1">
            {value}
          </h3>
          {displayDetail && (
            <p className="mt-2 text-[15px] font-medium text-white/85 leading-normal">
              {displayDetail}
            </p>
          )}
        </div>
      </div>
    </>
  );

  const baseClassName = `${color} group rounded-[1.75rem] p-6 shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden flex flex-col justify-between h-full min-h-[130px] transform-gpu isolate will-change-transform`;
  const inlineStyles = {
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden"
  };

  if (to) {
    return (
      <Link to={to} className={baseClassName} style={inlineStyles}>
        {CardContent}
      </Link>
    );
  }

  return (
    <div className={baseClassName} style={inlineStyles}>
      {CardContent}
    </div>
  );
};

export default StatCard;
