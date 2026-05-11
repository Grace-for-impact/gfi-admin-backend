import { Request, Response } from "express";
import Job from "../models/Job";
import Application from "../models/Application";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalJobs = await Job.countDocuments({ status: "Active" });
    const totalApplicants = await Application.countDocuments();
    const pendingEvaluations = await Application.countDocuments({ 
      status: { $in: ["Pending", "In Review"] } 
    });
    const totalHired = await Application.countDocuments({ status: "Hired" });

    // Calculate Recruitment Rate (Hired / Total * 100)
    const recruitmentRate = totalApplicants > 0 
      ? Math.round((totalHired / totalApplicants) * 100) 
      : 0;

    // Get recent applications
    const recentApplications = await Application.find()
      .populate("jobId", "title category company")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get distribution by category (Aggregation)
    const categoryDistribution = await Application.aggregate([
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job"
        }
      },
      { $unwind: "$job" },
      {
        $group: {
          _id: "$job.category",
          count: { $sum: 1 }
        }
      },
      { $project: { label: "$_id", count: 1, _id: 0 } }
    ]);

    // Calculate percentages for distribution
    const distributionWithPercent = categoryDistribution.map(item => ({
      ...item,
      percent: totalApplicants > 0 ? Math.round((item.count / totalApplicants) * 100) : 0
    }));

    res.json({
      stats: {
        activeVacancies: totalJobs,
        totalApplicants,
        pendingEvaluations,
        recruitmentRate: `${recruitmentRate}%`
      },
      recentApplications,
      hiringDistribution: distributionWithPercent
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
