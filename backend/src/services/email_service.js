import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // For development, you can use Gmail or any SMTP service
  // For production, use a service like SendGrid, AWS SES, etc.
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    });
  }

  // Generic SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email function
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Skip email sending if email is not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('📧 Email not configured. Skipping email send.');
      console.log('Would send to:', to);
      console.log('Subject:', subject);
      return { success: true, skipped: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Community Safety Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: html || text,
      text: text || html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
export const emailTemplates = {
  incidentReported: (userName, incidentType) => ({
    subject: 'Incident Report Submitted Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You for Reporting!</h2>
        <p>Hello ${userName},</p>
        <p>Your incident report for <strong>${incidentType}</strong> has been successfully submitted.</p>
        <p>Our team will review it shortly and you'll be notified once it's verified.</p>
        <p>Thank you for helping keep our community safe!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Community Safety Platform.</p>
      </div>
    `,
    text: `Hello ${userName},\n\nYour incident report for ${incidentType} has been successfully submitted. Our team will review it shortly.`,
  }),

  incidentVerified: (userName, incidentType) => ({
    subject: 'Your Incident Report Has Been Verified',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Incident Verified!</h2>
        <p>Hello ${userName},</p>
        <p>Great news! Your incident report for <strong>${incidentType}</strong> has been verified by our moderation team.</p>
        <p>The incident is now visible to the community and appropriate action is being taken.</p>
        <p>Thank you for your contribution to community safety!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Community Safety Platform.</p>
      </div>
    `,
    text: `Hello ${userName},\n\nYour incident report for ${incidentType} has been verified and is now visible to the community.`,
  }),

  incidentRejected: (userName, incidentType, reason) => ({
    subject: 'Incident Report Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Incident Report Status Update</h2>
        <p>Hello ${userName},</p>
        <p>Your incident report for <strong>${incidentType}</strong> has been reviewed by our moderation team.</p>
        <p>Unfortunately, the report could not be verified at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you believe this is an error, please contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Community Safety Platform.</p>
      </div>
    `,
    text: `Hello ${userName},\n\nYour incident report for ${incidentType} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
  }),

  incidentResolved: (userName, incidentType) => ({
    subject: 'Incident Resolved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #17a2b8;">Incident Resolved!</h2>
        <p>Hello ${userName},</p>
        <p>Good news! The incident you reported for <strong>${incidentType}</strong> has been resolved.</p>
        <p>Thank you for reporting it and helping keep our community safe!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Community Safety Platform.</p>
      </div>
    `,
    text: `Hello ${userName},\n\nThe incident you reported for ${incidentType} has been resolved. Thank you!`,
  }),
};

