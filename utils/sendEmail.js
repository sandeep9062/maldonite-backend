import nodemailer from "nodemailer";

export const sendConsultationEmail = async ({ name, email, phone, address, description }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // or use SMTP settings
      auth: {
        user: process.env.OWNER_EMAIL,      // your email
        pass: process.env.OWNER_EMAIL_PASS, // your email app password
      },
    });

    const mailOptions = {
      from: `"Consultation Booking" <${process.env.OWNER_EMAIL}>`,
      to: process.env.OWNER_RECEIVER_EMAIL, // owner's email
      subject: "New Consultation Booking",
      html: `
        <h2>New Consultation Submitted</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Description:</strong> ${description}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
