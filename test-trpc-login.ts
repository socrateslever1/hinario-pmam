import { appRouter } from './server/routers.ts';
import 'dotenv/config';

async function run() {
  const caller = appRouter.createCaller({
    req: {} as any,
    res: {
      cookie: (name: string, value: string, options: any) => {
        console.log("Set cookie:", name, value, options);
      }
    } as any,
    user: undefined as any
  });
  
  try {
    const result = await caller.auth.loginEmail({ email: '4122', password: 'temp' });
    console.log("Login Success:", result);
  } catch(e: any) {
    console.log("Login Failed:", e.code, e.message);
  }
}

run().catch(console.error);
