const nodemailer = require('nodemailer');

const sendMail = async (req, res) => {
    // Create a transporter using your email provider's SMTP settings
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'shivamrvgupta@gmail.com', // Replace with your Gmail email address
            pass: 'juopomfyzfjzbhti', // Replace with your Gmail password or an app-specific password
        },
    });

    // Define the email message
    let message = {
        from: 'shivamrvgupta@gmail.com', // Sender's email address
        to: 'rvshivamsahu.1222@gmail.com', // Recipient's email address
        subject: 'Welcome to My Product', // Subject of the email
        html: `
            <p>Hello,</p>
            <p>Welcome to My Product! To get started, please click the button below:</p>
            <a href="https://example.com/confirm-account">Confirm your account</a>
            <p>Need help or have questions? Just reply to this email, and we'll be happy to assist.</p>
        `,
    };

    // Send the email
    transporter.sendMail(message, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to send email' });
        } else {
            console.log('Email sent: ' + info.response);
            return res.status(201).json({ msg: 'You should receive an email' });
        }
    });
}

module.exports = {
    sendMail
}
