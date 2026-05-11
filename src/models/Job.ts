import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  company: "Grace Eye Clinic" | "Grace For Impact" | "Purple Bee Technologies";
  category: string;
  location: string;
  type: "Full-time" | "Contract" | "Volunteer" | "Part-time";
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: string;
  deadline: Date;
  status: "Active" | "Closed";
  postedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    company: { 
      type: String, 
      required: true,
      enum: ["Grace Eye Clinic", "Grace For Impact", "Purple Bee Technologies"]
    },
    category: { type: String, required: true },
    location: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ["Full-time", "Contract", "Volunteer", "Part-time"],
      default: "Full-time"
    },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    salary: { type: String },
    deadline: { type: Date, required: true },
    status: { 
      type: String, 
      required: true,
      enum: ["Active", "Closed"],
      default: "Active"
    },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>("Job", JobSchema);
