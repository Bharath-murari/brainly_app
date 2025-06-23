import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import mongoose from "mongoose";
import { ContentModel, LinkModel, UserModel } from "./db";
import { JWT_SECRET } from "./config";
import { userMiddleware } from "./middleware";
//@tis-ignore
import { random } from "./utils"; // FIX: Changed 'import random' to 'import { random }'

const app = express();

// --- Core Middleware ---
app.use(express.json());
app.use(cors());

// --- Zod Schemas for Input Validation ---
const signupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

const signinSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

const contentSchema = z.object({
    title: z.string().min(1, "Title cannot be empty"),
    link: z.string().url("Please provide a valid URL"),
    type: z.enum(['youtube', 'twitter', 'reddit', 'instagram', 'link', 'article', 'facebook']),
});
//@ts-ignore
// --- Auth Routes ---
app.post("/api/v1/signup", async (req, res) => {
    const parsedBody = signupSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsedBody.error.flatten().fieldErrors });
    }
    const { username, password } = parsedBody.data;

    try {
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.create({ username, password: hashedPassword });

        res.status(201).json({ message: "User signed up successfully. Please sign in." });
    } catch (e) {
        console.error("Signup Error:", e);
        res.status(500).json({ message: "An internal server error occurred" });
    }
});
//@ts-ignore
app.post("/api/v1/signin", async (req, res) => {
    const parsedBody = signinSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({ message: "Invalid input" });
    }
    const { username, password } = parsedBody.data;

    try {
        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(403).json({ message: "Incorrect username or password" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (isPasswordCorrect) {
            const token = jwt.sign({ id: user._id }, JWT_SECRET!, { expiresIn: '7d' });
            res.json({ token, username: user.username });
        } else {
            res.status(403).json({ message: "Incorrect username or password" });
        }
    } catch (e) {
        console.error("Signin Error:", e);
        res.status(500).json({ message: "An internal server error occurred" });
    }
});
//@ts-ignore
// --- Content Routes (Protected) ---
app.post("/api/v1/content", userMiddleware, async (req, res) => {
    const parsedBody = contentSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsedBody.error.flatten().fieldErrors });
    }

    try {
        const { link, title, type } = parsedBody.data;
        const content = await ContentModel.create({ link, title, type, userId: req.userId });
        res.status(201).json({ message: "Content added", content });
    } catch (e) {
        console.error("Add Content Error:", e);
        res.status(500).json({ message: "An internal server error occurred" });
    }
});
//@ts-ignore
app.get("/api/v1/content", userMiddleware, async (req, res) => {
    try {
        const content = await ContentModel.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ content });
    } catch (e) {
        console.error("Get Content Error:", e);
        res.status(500).json({ message: "An internal server error occurred" });
    }
});
//@ts-ignore
app.delete("/api/v1/content/:contentId", userMiddleware, async (req, res) => {
    const { contentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return res.status(400).json({ message: "Invalid content ID format." });
    }
    
    try {
        const result = await ContentModel.deleteOne({ _id: contentId, userId: req.userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Content not found or you lack permission to delete it." });
        }
        res.json({ message: "Deleted successfully" });
    } catch (e) {
        console.error("Delete Content Error:", e);
        res.status(500).json({ message: "An internal server error occurred" });
    }
});
//@ts-ignore
// --- Sharing Routes ---
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const share = req.body.share;
    try {
        if (share) {
            const existingLink = await LinkModel.findOne({ userId: req.userId });
            if (existingLink) {
                return res.json({ hash: existingLink.hash });
            }
            const hash = random(10);
            await LinkModel.create({ userId: req.userId, hash });
            res.json({ hash });
        } else {
            await LinkModel.deleteOne({ userId: req.userId });
            res.json({ message: "Sharing has been disabled" });
        }
    } catch (e) {
        console.error("Share Brain Error:", e);
        res.status(500).json({ message: "An internal server error occurred" });
    }
});

// --- Public Share Page Route ---
//@ts-ignore
app.get("/api/v1/brain/share/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;
    try {
        const link = await LinkModel.findOne({ hash }).populate("userId", "username");

        if (!link || !link.userId) {
            return res.status(404).json({ message: "This share link is invalid or has expired." });
        }
        
        const user = link.userId as { _id: mongoose.Types.ObjectId; username: string };
        const content = await ContentModel.find({ userId: user._id }).sort({ createdAt: -1 });
        
        res.json({ username: user.username, content });
    } catch(e) {
        console.error("Get Shared Brain Error:", e);
        res.status(500).json({ message: "An internal server error occurred" });
    }
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// import express from "express";
// import { random } from "./utils";
// import jwt from "jsonwebtoken";
// import { ContentModel, LinkModel, UserModel } from "./db";
// import { JWT_PASSWORD } from "./config";
// import { userMiddleware } from "./middleware";
// import cors from "cors";

// const app = express();
// app.use(express.json());
// app.use(cors());

// app.post("/api/v1/signup", async (req, res) => {
//     // TODO: zod validation , hash the password
//     const username = req.body.username;
//     const password = req.body.password;

//     try {
//         await UserModel.create({
//             username: username,
//             password: password
//         }) 

//         res.json({
//             message: "User signed up"
//         })
//     } catch(e) {
//         res.status(411).json({
//             message: "User already exists"
//         })
//     }
// })

// app.post("/api/v1/signin", async (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;

//     const existingUser = await UserModel.findOne({
//         username,
//         password
//     })
//     if (existingUser) {
//         const token = jwt.sign({
//             id: existingUser._id
//         }, JWT_PASSWORD)

//         res.json({
//             token
//         })
//     } else {
//         res.status(403).json({
//             message: "Incorrrect credentials"
//         })
//     }
// })

// app.post("/api/v1/content", userMiddleware, async (req, res) => {
//     const link = req.body.link;
//     const type = req.body.type;
//     await ContentModel.create({
//         link,
//         type,
//         title: req.body.title,
//         userId: req.userId,
//         tags: []
//     })

//     res.json({
//         message: "Content added"
//     })
    
// })

// app.get("/api/v1/content", userMiddleware, async (req, res) => {
//     // @ts-ignore
//     const userId = req.userId;
//     const content = await ContentModel.find({
//         userId: userId
//     }).populate("userId", "username")
//     res.json({
//         content
//     })
// })

// app.delete("/api/v1/content", userMiddleware, async (req, res) => {
//     const contentId = req.body.contentId;

//     await ContentModel.deleteMany({
//         contentId,
//         userId: req.userId
//     })

//     res.json({
//         message: "Deleted"
//     })
// })

// app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
//     const share = req.body.share;
//     if (share) {
//             const existingLink = await LinkModel.findOne({
//                 userId: req.userId
//             });

//             if (existingLink) {
//                 res.json({
//                     hash: existingLink.hash
//                 })
//                 return;
//             }
//             const hash = random(10);
//             await LinkModel.create({
//                 userId: req.userId,
//                 hash: hash
//             })

//             res.json({
//                 hash
//             })
//     } else {
//         await LinkModel.deleteOne({
//             userId: req.userId
//         });

//         res.json({
//             message: "Removed link"
//         })
//     }
// })

// app.get("/api/v1/brain/:shareLink", async (req, res) => {
//     const hash = req.params.shareLink;

//     const link = await LinkModel.findOne({
//         hash
//     });

//     if (!link) {
//         res.status(411).json({
//             message: "Sorry incorrect input"
//         })
//         return;
//     }
//     // userId
//     const content = await ContentModel.find({
//         userId: link.userId
//     })

//     console.log(link);
//     const user = await UserModel.findOne({
//         _id: link.userId
//     })

//     if (!user) {
//         res.status(411).json({
//             message: "user not found, error should ideally not happen"
//         })
//         return;
//     }

//     res.json({
//         username: user.username,
//         content: content
//     })

// })

// app.listen(3000);