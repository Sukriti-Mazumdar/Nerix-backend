import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";
import Contact from "../models/contact";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Save to database first
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();
    console.log("Contact saved to database:", newContact._id);

    // Try to send email, but don't fail if it doesn't work
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email credentials not configured, skipping email notification");
      } else {
        const transporter = nodemailer.createTransport({
          host: "smtp.hostinger.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Website Contact" <${process.env.EMAIL_USER}>`,
          replyTo: email,
          to: process.env.EMAIL_USER,
          subject: `New Enquiry: ${subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><b>Name:</b> ${name}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Subject:</b> ${subject}</p>
            <p><b>Message:</b><br/> ${message}</p>
          `,
        });
        console.log("Email notification sent successfully");
      }
    } catch (emailError) {
      console.error("Email sending failed (non-critical):", emailError);
      // Don't fail the request if email fails
    }

    res.json({ success: true, message: "Your message has been received. We'll get back to you soon!" });

  } catch (error: unknown) {
    console.error("Contact POST error:", error);
    const errorMessage = "Failed to save your message. Please try again.";
    if (error && typeof error === "object" && "message" in error) {
      const errMsg = (error as { message?: string }).message;
      if (errMsg) {
        console.error("Detailed error:", errMsg);
        // Only expose generic error to client
      }
    }
    res.status(500).json({ error: errorMessage });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error: unknown) {
    console.error("Contact GET error:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});
  
export default router;