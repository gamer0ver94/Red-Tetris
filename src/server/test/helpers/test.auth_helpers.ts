import type { FastifyInstance, InjectOptions } from 'fastify';
import { expect } from 'vitest';

import type { TestAuthUser } from '../test.types.js';


let index = 0
export function unique_username(prefix = 'test') : string{
    index += 1;
    return `${prefix}_${index}`;
}

export function get_session_cookie(set_cookie: string | string[] | undefined): string{

    if (!set_cookie)
        throw new Error('Missing set_cookie header');
    const raw = Array.isArray(set_cookie) ? set_cookie[0] : set_cookie;
    return raw.split(';')[0];
}

export async function register_user(
    app:FastifyInstance,
    username = unique_username()
): Promise<TestAuthUser>{
    
    const res = await app.inject({
        method:'POST',
        url:'/auth/register',
        payload :{ username }
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    return{
        username,
        cookie: get_session_cookie(res.headers['set-cookie']),
        csrf_token: body.csrf_token,
        player_id: body.player_id,
    };
}

export async function register_users(
    app:FastifyInstance,
    count: number,
    prefix = 'testers'
){
    const users: TestAuthUser[] = [];

    for (let i = 0; i < count; i += 1)
        users.push(await register_user(app, unique_username(`${prefix}_${i}`)));
    return users;
}

export function auth_headers(user: TestAuthUser): Record<string, string> {
  return { cookie: user.cookie, 'x-csrf-token': user.csrf_token };
}

export async function inject_as(
    app:FastifyInstance,
    user: TestAuthUser,
    req: Omit<InjectOptions, 'headers'>& { headers?: Record<string, string> }
){
    return app.inject({...req, headers:{...auth_headers(user), ...(req.headers ?? {})}})
}
