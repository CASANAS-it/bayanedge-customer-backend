
const nodemailer = require('nodemailer');
const properties = require('../properties');

const sendEmail = (mailOptions) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: properties.transporter.username,
            pass: properties.transporter.password
        }
    });
    
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error,'error');
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = {
    sendEmail
}