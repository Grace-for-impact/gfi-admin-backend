import { Request, Response } from "express";
import Application from "../models/Application";
import sendEmail from "../utils/sendEmail";
import cloudinary from "../config/cloudinary";
import fs from "fs";
import path from "path";

// @desc    Submit a new application
// @route   POST /api/applications
// @access  Public
export const submitApplication = async (req: Request, res: Response) => {
  try {
    let applicationData = req.body;

    // If data is sent as a string (common with FormData), parse it
    if (typeof applicationData.data === "string") {
      applicationData = JSON.parse(applicationData.data);
    }

    // Handle File Upload to Cloudinary
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a CV/Resume" });
    }

    // Upload to Cloudinary with original extension preservation
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "gfi_applications",
      resource_type: "raw",
      public_id: `${req.file.fieldname}-${Date.now()}${path.extname(req.file.originalname)}`,
    });

    // Remove file from local storage
    fs.unlinkSync(req.file.path);

    // Create application with Cloudinary URL
    const application = await Application.create({
      ...applicationData,
      resumeUrl: result.secure_url,
    });

    // Fetch application with Job details for the email
    const populatedApp = await Application.findById(application._id).populate(
      "jobId",
      "title company",
    );

    if (populatedApp) {
      const { personalInfo, jobId } = populatedApp as any;

      const emailMessage = `
        New Job Application Received!
        
        Candidate: ${personalInfo.fullName}
        Position: ${jobId.title}
        Subsidiary: ${jobId.company}
        Email: ${personalInfo.email}
        Phone: ${personalInfo.phone}
        Address: ${personalInfo.address}
        LGA: ${personalInfo.lga}
        
        Please log in to the GFI Admin Dashboard to review the full application, CV, and cover letter.
      `;

      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 20px; text-align: center;">
            <div style="background: rgba(255,255,255,0.1); width: 60px; height: 60px; border-radius: 12px; margin: 0 auto 20px; text-align: center; line-height: 60px;">
              <span style="font-size: 30px; vertical-align: middle;">📄</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">New Application Received</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px; font-weight: 500;">Grace For Impact Recruitment Portal</p>
          </div>
          <div style="padding: 40px; background: #ffffff;">
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">Hello HR Team,</p>
            <p style="font-size: 15px; color: #4b5563; margin-bottom: 30px;">A new candidate has just submitted an application through the subsidiary portal. Below are the summary details:</p>
            
            <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
              <h3 style="margin: 0 0 20px; color: #4F46E5; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Candidate Overview</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #64748b; width: 100px;"><strong>Name:</strong></td>
                  <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600;">${personalInfo.fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #64748b;"><strong>Position:</strong></td>
                  <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600;">${jobId.title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #64748b;"><strong>Subsidiary:</strong></td>
                  <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600;">${jobId.company}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #64748b;"><strong>Location:</strong></td>
                  <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600;">${personalInfo.address}, ${personalInfo.lga}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 30px;">You can review the full profile, education history, and download the resume via the link below.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.ADMIN_URL || "http://localhost:3000"}/applications/${application._id}" style="background: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">View Full Application</a>
            </div>
          </div>
          <div style="background-color: #f9fafb; color: #9ca3af; padding: 25px; text-align: center; font-size: 11px; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0 0 10px;">This is an automated notification from the GFI Admin System.</p>
            &copy; ${new Date().getFullYear()} Grace For Impact. All rights reserved.
          </div>
        </div>
      `;

      await sendEmail({
        email: process.env.HR_EMAIL || "hr@graceforimpact.org",
        subject: `New Application: ${personalInfo.fullName} - ${jobId.title}`,
        message: emailMessage,
        html: emailHtml,
      });

      // Send Auto-Reply to Applicant
      const applicantHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 20px; text-align: center;">
            <div style="background: rgba(255,255,255,0.1); width: 60px; height: 60px; border-radius: 12px; margin: 0 auto 20px; text-align: center; line-height: 60px;">
              <span style="font-size: 30px; vertical-align: middle;">📩</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Application Received</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px; font-weight: 500;">Grace For Impact Recruitment</p>
          </div>
          <div style="padding: 40px; background: #ffffff;">
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">Hi ${personalInfo.fullName.split(' ')[0]},</p>
            <p style="font-size: 15px; color: #4b5563; margin-bottom: 20px;">Thank you for your interest in joining the team at <strong>${jobId.company}</strong>. We've successfully received your application for the <strong>${jobId.title}</strong> position.</p>
            <p style="font-size: 15px; color: #4b5563; margin-bottom: 30px;">Our HR team is currently reviewing all applications. We appreciate your patience, and we will get back to you soon regarding the status of your application.</p>
            
            <div style="border-top: 1px solid #f3f4f6; padding-top: 25px;">
              <p style="font-size: 14px; color: #4b5563; margin: 0;">Best Regards,</p>
              <p style="font-size: 14px; font-weight: bold; color: #4F46E5; margin: 5px 0 0;">The GFI Recruitment Team</p>
            </div>
          </div>
          <div style="background-color: #f9fafb; color: #9ca3af; padding: 25px; text-align: center; font-size: 11px; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0 0 10px;">This is an automated confirmation of your application. Please do not reply to this email.</p>
            &copy; ${new Date().getFullYear()} Grace For Impact. All rights reserved.
          </div>
        </div>
      `;

      await sendEmail({
        email: personalInfo.email,
        subject: `Application Received: ${jobId.title} at ${jobId.company}`,
        message: `Hi ${personalInfo.fullName}, thank you for applying for the ${jobId.title} position. Our HR team has received your application and will get back to you soon.`,
        html: applicantHtml,
      });
    }

    res.status(201).json(application);
  } catch (error: any) {
    console.error("Submission Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all applications (with optional jobId filter)
// @route   GET /api/applications
// @access  Private/Admin
export const getApplications = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.query;
    let query: any = {};
    if (jobId) query.jobId = jobId;

    const applications = await Application.find(query)
      .populate("jobId", "title company")
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private/Admin
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const application = await Application.findById(req.params.id);

    if (application) {
      application.status = req.body.status || application.status;
      const updatedApplication = await application.save();
      res.json(updatedApplication);
    } else {
      res.status(404).json({ message: "Application not found" });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single application details
// @route   GET /api/applications/:id
// @access  Private/Admin
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      "jobId",
      "title company",
    );
    if (application) {
      res.json(application);
    } else {
      res.status(404).json({ message: "Application not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
