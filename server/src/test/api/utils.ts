import {Client} from "@loopback/testlab";
import {UserRepository} from "../../repositories";

let client: Client;
let userRepo: UserRepository;

export async function createUser(email: string, password: string, isAdmin = false) {
    const user = await client
        .post('/users/register?redirectURL=http://localhost:8081/validate?api=http://localhost:8080')
        .send({email, password})
        .expect(200);
    const roles = ['user'];
    if (isAdmin)
        roles.push('admin');
    await userRepo.updateById(user.body.id, {role: roles});
    return userRepo.findById(user.body.id);
}

export async function getJWT(email: string, password: string) {
    const res = await client
        .post('/users/login')
        .send({email, password})
        .expect(200);
    const body = res.body;
    return body.token;
}