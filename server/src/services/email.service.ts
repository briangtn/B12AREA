import {bind} from '@loopback/core';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import {config} from "./email.service.config";
import path from "path";

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
    getHtmlFromTemplate(templateName: string, params: Object): Promise<string>;
    getTextFromTemplate(templateName: string, params: Object): Promise<string>;
}

@bind({tags: {namespace: "services", name: "email"}})
export class EmailService implements EmailManager {
    constructor() {}

    async sendMail(mailObj: Email): Promise<object> {
        const transporter = nodemailer.createTransport(config);
        return transporter.sendMail(mailObj);
    }

    async getHtmlFromTemplate(templateName: string, params: Object): Promise<string> {
        return ejs.renderFile(path.join(__dirname, '..', '..', 'public/emails', templateName + "-html.ejs"), params);
    }

    async getTextFromTemplate(templateName: string, params: Object): Promise<string> {
        return ejs.renderFile(path.join(__dirname, '..', '..', 'public/emails', templateName + "-text.ejs"), params);
    }
}
