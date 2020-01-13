import {SmtpOptions} from 'nodemailer-smtp-transport';

const config: SmtpOptions = {
    "host": process.env.SMTP_HOST ? process.env.SMTP_HOST : "localhost",
    "port": process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 25,
    "secure": process.env.SMTP_SECURE ? (process.env.SMTP_SECURE === "true") : true,
    "tls": {
        "rejectUnauthorized": process.env.SMTP_REJECT_UNAUTHORIZED ? (process.env.SMTP_REJECT_UNAUTHORIZED === "true") : false
    },
    "auth": {
        "user": process.env.SMTP_USER,
        "pass": process.env.SMTP_PASS
    }
};

export {config};