import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Parent from "../models/Parent.js";
import StaffMember from "../models/StaffMember.js";
import Admin from "../models/Admin.js";
import SuperAdmin from "../models/SuperAdmin.js";

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error("Not authorized, token missing"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id || decoded.userId;
    let role = decoded.role;

    let user = null;

    if (role) {
      const modelMap = {
        student: Student,
        teacher: Teacher,
        parent: Parent,
        staff: StaffMember,
        admin: Admin,
        superadmin: SuperAdmin,
      };

      const Model = modelMap[role];
      if (Model) {
        let query = Model.findById(id).select("-password");
        if (Model.schema.path("instituteId")) {
          query = query.populate("instituteId", "name instituteCode instituteType status");
        }
        user = await query;
      }
    } else {
      const models = [Student, Teacher, Parent, StaffMember, Admin, SuperAdmin];
      for (const Model of models) {
        let query = Model.findById(id).select("-password");
        if (Model.schema.path("instituteId")) {
          query = query.populate("instituteId", "name instituteCode instituteType status");
        }
        user = await query;
        if (user) {
          role = user.role;
          break;
        }
      }
    }

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    if (user.status !== "active") {
      res.status(401);
      throw new Error("User inactive");
    }

    if (user.isDeleted) {
      res.status(401);
      throw new Error("User deleted");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    next(new Error("Not authorized, token invalid"));
  }
};

export { protect };
