import { Request, Response } from "express";
import Job from "../models/Job";

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private/Admin
export const createJob = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      company, 
      category, 
      location, 
      type, 
      description, 
      requirements, 
      responsibilities, 
      salary, 
      deadline,
      status 
    } = req.body;

    const job = await Job.create({
      title,
      company,
      category,
      location,
      type,
      description,
      requirements,
      responsibilities,
      salary,
      deadline,
      status,
      postedBy: (req as any).user._id
    });

    res.status(201).json(job);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all jobs (with optional company filter)
// @route   GET /api/jobs
// @access  Public (for company sites) or Private (for admin)
export const getJobs = async (req: Request, res: Response) => {
  try {
    const { company, status } = req.query;
    
    let query: any = {};
    if (company) query.company = company;
    if (status) query.status = status;

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: "Job not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private/Admin
export const updateJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);

    if (job) {
      job.title = req.body.title || job.title;
      job.company = req.body.company || job.company;
      job.category = req.body.category || job.category;
      job.location = req.body.location || job.location;
      job.type = req.body.type || job.type;
      job.description = req.body.description || job.description;
      job.requirements = req.body.requirements || job.requirements;
      job.responsibilities = req.body.responsibilities || job.responsibilities;
      job.salary = req.body.salary || job.salary;
      job.deadline = req.body.deadline || job.deadline;
      job.status = req.body.status || job.status;

      const updatedJob = await job.save();
      res.json(updatedJob);
    } else {
      res.status(404).json({ message: "Job not found" });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private/Admin
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);

    if (job) {
      await job.deleteOne();
      res.json({ message: "Job removed" });
    } else {
      res.status(404).json({ message: "Job not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
