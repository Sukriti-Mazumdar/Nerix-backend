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
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

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

    res.json({ success: true });

  } catch (error: unknown) {
    console.error("Contact POST error:", error);
    let errorMessage = "Server error";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as { message?: string }).message || errorMessage;
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