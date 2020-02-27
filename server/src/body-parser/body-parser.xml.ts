import {
    BodyParser,
    Request,
    RequestBody,
    RequestBodyParserOptions,
    RestBindings
} from "@loopback/rest";
import {inject} from "@loopback/context";
import {is} from 'type-is';
import {
    BodyParserMiddleware,
    invokeBodyParserMiddleware
} from "@loopback/rest/dist/body-parsers/body-parser.helpers";
import xmlparser from "express-xml-bodyparser";

export class XmlBodyParser implements BodyParser {
    name: string | symbol = "xml";

    xmlParser: BodyParserMiddleware | undefined = undefined;
    constructor(
        @inject(RestBindings.REQUEST_BODY_PARSER_OPTIONS, {optional: true})
        options: RequestBodyParserOptions = {},
    ) {
        this.xmlParser = xmlparser();
    }

    async parse(request: Request): Promise<RequestBody> {
        return new Promise<RequestBody>((resolve, rejects) => {
            if (this.xmlParser === undefined) {
                rejects();
                return;
            }
            invokeBodyParserMiddleware(this.xmlParser, request).then((res) => {
                const contentLength = request.get('content-length');
                if (contentLength != null && +contentLength === 0) {
                    res = undefined;
                }
                resolve({value: res});
            }).catch((e) => {
                rejects(e);
            });
        });
    }

    supports(mediaType: string) {
        return !!is(mediaType, '*/xml', '*/*+xml');
    }
}