import {bind, /* inject, */ BindingScope} from '@loopback/core';
import * as nodemailer from 'nodemailer';
import {config} from "./email.service.config";

export interface IEmail {
  to: string;
  from: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface IEmailManager<T = Object> {
  sendMail(mailObj: IEmail): Promise<T>;
}

@bind({tags: {namespace: "services", name: "email"}})
export class EmailService implements IEmailManager {
  constructor() {}

  async sendMail(mailObj: IEmail): Promise<object> {
    let transporter = nodemailer.createTransport(config);
    return await transporter.sendMail(mailObj);
  }
}
