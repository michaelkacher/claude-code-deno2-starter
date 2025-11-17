import { createDefine } from "fresh";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  userEmail?: string | null;
  userRole?: string | null;
  initialTheme?: 'light' | 'dark' | null;
  token?: string | null;
  user?: {
    sub: string;
    email: string;
    role: string;
    emailVerified: boolean;
    iat: number;
    exp: number;
  } | null;
}

export const define = createDefine<State>();
