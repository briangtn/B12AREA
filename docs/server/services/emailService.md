# Email service

## What is this service for ?

This service is used to send emails easily.

## Initialisation

Your .env file should have the following variables:
* `SMTP_HOST`: Host of the smtp server (default if not set: localhost)
* `SMTP_SECURE`: Force the usage of tls and abort if impossible (default if not set: false)
* `SMTP_PORT`: Port to connect to (default if not set: 25)
* `SMTP_REJECT_UNAUTHORIZED`: Reject self signed tls certificates (default if not set: false)
* `SMTP_USER`: smtp user login
* `SMTP_PASS`: smtp user password

## How to use.

To use this service you first need to inject his dependency (for example in a Controller)

```typescript
import {RestBindings, get, api} from '@loopback/rest';
import {EmailService} from '../services';
import {inject} from '@loopback/context';

@api({basePath: '/test', paths: {}})
export class TestController {
    constructor(@inject('services.email')
                protected emailService: EmailService) {}

    @get('/')
    mainPage() {
    }
}

```

Then you can use the following method:
`sendMail(mailObj: IEmail): Promise<object>`.

The `IEmail` interface can be found in `src/services/email.service.ts`.

Properties:

* `from`: The email address of the sender. (syntax example: `XXX@XXX.XXX` or `XXX <XXX@XXX.XXX>`)
* `to`: Comma separated list or an array of recipients email addresses that will appear on the Cc: field. (syntax example: `XXX@XXX.XXX` or `XXX <XXX@XXX.XXX>`)
* `subject`: The subject of the email.
* `html`: The HTML version of the message as an Unicode string.
* `text`: The plaintext version of the message as an Unicode string.
* `cc`: Comma separated list or an array of recipients email addresses that will appear on the Cc: field.
* `bcc`: Comma separated list or an array of recipients email addresses that will appear on the Bcc: field.

You can see [nodemailer](https://nodemailer.com/) for more informations.

Example:

```typescript
// ...

    @get('/')
    mainPage() {
        this.emailService.sendMail({
            from: "Sender <noreply@example.com>",
            to: "Receiver <receiver@example.com>",
            subject: "Email subject",
            html: "<p>HTML version</p>",
            text: "text version"
        })
        .then(o => console.log("Email sent"))
        .catch(e => console.log("Failed to deliver email", e));
    }

// ...
```