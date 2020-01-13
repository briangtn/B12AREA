import {bind} from '@loopback/core';
import * as nodemailer from 'nodemailer';
import {config} from "./email.service.config";

export interface Email {
    to: string;
    from: string;
    cc?: string;
    bcc?: string;
    subject: string;
    html?: string;
    text?: string;
}

export interface EmailManager<T = Object> {
    sendMail(mailObj: Email): Promise<T>;
}

@bind({tags: {namespace: "services", name: "email"}})
export class EmailService implements EmailManager {
    constructor() {}

    async sendMail(mailObj: Email): Promise<object> {
        const transporter = nodemailer.createTransport(config);
        return transporter.sendMail(mailObj);
    }
}
