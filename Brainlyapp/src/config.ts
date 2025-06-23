// export const JWT_PASSWORD = "!23123";

import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET;
export const MONGO_URI = process.env.MONGO_URI;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in the .env file.");
    process.exit(1);
}

if (!MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI is not defined in the .env file.");
    process.exit(1);
}