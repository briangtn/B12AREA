import {Client} from "@loopback/testlab";
import {UserRepository} from "../../repositories";

let client: Client;
let userRepo: UserRepository;

export async function createUser(email: string, password: string) {
    const user = await client
        .post('/users/register?redirectURL=http://localhost:8081/validate?api=http://localhost:8080')
        .send({email, password})
        .expect(200);
    await userRepo.updateById(user.body.id, {role: ['user']});
    return userRepo.findById(user.body.id);
}

export async function getJWT(email: string, password: string) {
    const res = await client
        .post('/users/login')
        .send({
            email: email,
            password: password
        })
        .expect(200);
    const body = res.body;
    return body.token;
}