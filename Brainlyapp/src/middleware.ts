// import { NextFunction, Request, Response } from "express";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import { JWT_PASSWORD } from "./config";

// export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
//     const header = req.headers["authorization"];
//     const decoded = jwt.verify(header as string, JWT_PASSWORD)
//     if (decoded) {
//         if (typeof decoded === "string") {
//             res.status(403).json({
//                 message: "You are not logged in"
//             })
//             return;    
//         }
//         req.userId = (decoded as JwtPayload).id;
//         next()
//     } else {
//         res.status(403).json({
//             message: "You are not logged in"
//         })
//     }
// }
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
const JWT_SECRET="replace-this-with-a-very-strong-random-secret-key-!@#$1234"
// Augment the Express Request type to include our custom 'userId' property
declare global {
    namespace Express {
      export interface Request {
          userId?: string;
      }
    }
}

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: "Access denied. No token provided or token is malformed."
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        
        if (!decoded || !decoded.id) {
             return res.status(401).json({ message: "Invalid token payload." });
        }
        
        req.userId = decoded.id;
        next();
    } catch (error) {
        // Catches expired tokens, invalid signatures, etc.
        return res.status(403).json({
            message: "Authentication failed. The provided token is invalid or has expired."
        });
    }
};