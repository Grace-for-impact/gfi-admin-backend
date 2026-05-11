import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    dob: Date;
    lga: string;
  };
  education: {
    school: string;
    startDate: Date;
    endDate: Date;
    qualification: string;
    grade: string;
  }[];
  experience: {
    company: string;
    role: string;
    startDate: Date;
    endDate?: Date;
    description: string;
  }[];
  coverLetter: string;
  resumeUrl: string; // URL to uploaded file
  status: "Pending" | "In Review" | "Shortlisted" | "Rejected" | "Hired";
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    personalInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      dob: { type: Date, required: true },
      lga: { type: String, required: true },
    },
    education: [
      {
        school: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        qualification: { type: String, required: true },
        grade: { type: String, required: true },
      },
    ],
    experience: [
      {
        company: { type: String, required: true },
        role: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        description: { type: String, required: true },
      },
    ],
    coverLetter: { type: String, required: true },
    resumeUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "In Review", "Shortlisted", "Rejected", "Hired"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IApplication>("Application", ApplicationSchema);
