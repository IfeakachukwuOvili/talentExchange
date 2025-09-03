// Define the shape of the user object that your auth middleware attaches to the request.
interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// This is the magic. We are telling TypeScript to add our custom 'user' property
// to the global Express.Request interface.
declare global {
  namespace Express {
    export interface Request {
      // The user property is optional ('?') because not all routes are authenticated.
      user?: AuthenticatedUser;
    }
  }
}

// This empty export is required to make the file a module.
export {};