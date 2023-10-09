const nodemailer = require('nodemailer');
const fs = require('fs')

module.exports = {
    sendCustomMail : async (recipientEmail, subject, templateFilePath) => {
        // Create a transporter using your email provider's SMTP settings
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'shivamrvgupta@gmail.com', // Replace with your Gmail email address
                pass: 'juopomfyzfjzbhti', // Replace with your Gmail password or an app-specific password
            },
        });
    
        try {
            // Read the HTML template file
            const templateContent = await promisify(fs.readFile)(templateFilePath, 'utf8');
    
            // Define the email message
            let mailOptions = {
                from: 'admin@joshfuels.com', // Sender's email address
                to: recipientEmail, // Recipient's email address
                subject: subject, // Subject of the email
                html: templateContent, // Use the HTML template content
            };
    
            // Send the email
            let info = await transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
            return { success: true, message: 'Email sent successfully' };
        } catch (error) {
            console.error(error);
            return { success: false, error: 'Failed to send email' };
        }
    }
}