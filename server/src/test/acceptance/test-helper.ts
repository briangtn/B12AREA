import {AreaApplication} from '../..';
import {
    createRestAppClient,
    givenHttpServerConfig,
    Client,
} from '@loopback/testlab';
import {EmailManager} from "../../services";
import {sinon} from "@loopback/testlab/dist/sinon";
import {ActionRepository, AreaRepository, ReactionRepository, UserRepository} from "../../repositories";
import {Area, User} from "../../models";

interface AppWithClient {
    app: AreaApplication;
    client: Client;
}

export class TestHelper {
    client: Client;
    app: AreaApplication;
    userRepository: UserRepository;
    areaRepository: AreaRepository;
    actionRepository: ActionRepository;
    reactionRepository: ReactionRepository;
    private hasBeenInit: boolean;

    constructor() {}

    async initTestHelper(): Promise<void> {
        if (this.hasBeenInit)
            throw new Error("TestHelper isn't supposed to be initialized twice");
        const appWithClient: AppWithClient = await TestHelper.setupApplication();

        this.app = appWithClient.app;
        this.client = appWithClient.client;
        this.userRepository = await this.app.get('repositories.UserRepository');
        this.areaRepository = await this.app.get('repositories.AreaRepository');
        this.actionRepository = await this.app.get('repositories.ActionRepository');
        this.reactionRepository = await this.app.get('repositories.ReactionRepository');
        await this.app.migrateSchema();

        this.hasBeenInit = true;
    }

    async stop(): Promise<void> {
        await this.app.stop();
    }

    private static async setupApplication(): Promise<AppWithClient> {
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

        TestHelper.mockEmails(app);

        return {app, client};
    }

    private static mockEmails(app: AreaApplication) {
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

    async createUser(email: string, password: string, isAdmin = false, isValidated = true) {
        const user = await this.client
            .post('/users/register?redirectURL=http://localhost:8081/validate?api=http://localhost:8080')
            .send({email, password})
            .expect(200);
        const roles = ['user'];
        if (isAdmin)
            roles.push('admin');
        if (!isValidated)
            roles.push('email_not_validated');
        await this.userRepository.updateById(user.body.id, {role: roles});
        return this.userRepository.findById(user.body.id);
    }

    async createArea(user: User, areaName: string, enabled = true): Promise<Area> {
        return this.userRepository.areas(user.id).create({
            name: areaName,
            enabled: enabled
        })
    }

    async getJWT(email: string, password: string) {
        const res = await this.client
            .post('/users/login')
            .send({email, password})
            .expect(200);
        const body = res.body;
        return body.token;
    }
}