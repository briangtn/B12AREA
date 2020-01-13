import {Request, RestBindings, get, ResponseObject} from '@loopback/rest';
import {inject} from '@loopback/context';
import {EmailService} from "../services/email.service";

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
    description: 'Ping Response',
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    greeting: {type: 'string'},
                    date: {type: 'string'},
                    url: {type: 'string'},
                    headers: {
                        type: 'object',
                        properties: {
                            'Content-Type': {type: 'string'},
                        },
                        additionalProperties: true,
                    },
                },
            },
        },
    },
};

/**
 * A simple controller to bounce back http requests
 */
export class PingController {
    constructor(@inject(RestBindings.Http.REQUEST) private req: Request,
                @inject('services.normalizer')
                protected emailService: EmailService) {}

  // Map to `GET /ping`
  @get('/ping', {
      responses: {
          '200': PING_RESPONSE,
      },
  })
    ping(): object {
    // Reply with a greeting, the current time, the url, and request headers
      this.emailService.sendMail({
          from: "B12 <noreply@b12powered.com>",
          to: "julian.frabel@epitech.eu",
          subject: "Is nodemailer service working?",
          html: "<p>HTML version</p>",
          text: "text version"
      })
          .then(o => console.log("Email sent"))
          .catch(e => console.log("Failed to deliver email", e));
        return {
            greeting: 'Hello from LoopBack',
            date: new Date(),
            url: this.req.url,
            headers: Object.assign({}, this.req.headers),
        };
    }
}
