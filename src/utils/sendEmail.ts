import nodemailer from "nodemailer";

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

const sendEmail = async (options: EmailOptions) => {
  const transporter = nodemailer.createTransport({
    host: "premium283.web-hosting.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "noreply@graceforimpact.org", // your cPanel email address
      pass: ")lDopLgl2L=O", // your cPanel email password
    },
    // service: "gmail",
    // auth: {
    //   user: "techdevjerry@gmail.com", // your cPanel email address
    //   pass: "nscodzumgymincbh", // your cPanel email password
    // },
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

export default sendEmail;
