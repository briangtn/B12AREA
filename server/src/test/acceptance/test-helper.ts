import {AreaApplication} from '../..';
import {
    createRestAppClient,
    givenHttpServerConfig,
    Client,
} from '@loopback/testlab';
import {EmailManager} from "../../services";
import {sinon} from "@loopback/testlab/dist/sinon";

export async function setupApplication(): Promise<AppWithClient> {
    const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    // port: +process.env.PORT,
    });

    const app = new AreaApplication({
        rest: restConfig,
    });

    await app.boot();
    await app.start();

    const client = createRestAppClient(app);

    mockEmails(app);

    return {app, client};
}

export interface AppWithClient {
  app: AreaApplication;
  client: Client;
}


function mockEmails(app: AreaApplication) {
    const emailService: EmailManager = {
        sendMail: sinon.stub(),
        getHtmlFromTemplate: sinon.stub(),
        getTextFromTemplate: sinon.stub()
    };
    const sendMail: sinon.SinonStub = emailService.sendMail as sinon.SinonStub;
    const getHtmlFromTemplate: sinon.SinonStub = emailService.getHtmlFromTemplate as sinon.SinonStub;
    const getTextFromTemplate: sinon.SinonStub = emailService.getTextFromTemplate as sinon.SinonStub;

    sendMail.resolves({});
    getHtmlFromTemplate.resolves("<p>Mocked email</p>");
    getTextFromTemplate.resolves("Mocked email");
    app.bind('services.email').to(emailService);
}