import mongoose, { model, Schema } from "mongoose";
const MONGO_URI="mongodb+srv://bharatha:CRICKETER@cluster0.wznbsy9.mongodb.net/brainly"

// Establish database connection
mongoose.connect(MONGO_URI).then(() => {
    console.log("Successfully connected to MongoDB.");
}).catch(err => {
    console.error("Database connection error:", err);
});

// --- User Schema ---
// Stores user credentials securely.
const UserSchema = new Schema({
    username: { type: String, unique: true, required: true, minlength: 3, trim: true },
    password: { type: String, required: true, minlength: 6 }
});

export const UserModel = model("User", UserSchema);


// --- Content Schema ---
// Stores the individual pieces of content a user saves.
const ContentSchema = new Schema({
    title: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    type: { 
        type: String, 
        required: true, 
        enum: ['youtube', 'twitter', 'reddit', 'instagram', 'link', 'article', 'facebook'] 
    },
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

export const ContentModel = model("Content", ContentSchema);


// --- Link Schema ---
// Stores the unique hash for sharing a user's entire "brain".
const LinkSchema = new Schema({
    hash: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
});

export const LinkModel = model("Link", LinkSchema);
// import mongoose, {model, Schema} from "mongoose";

// mongoose.connect("mongodb+srv://bharatha:CRICKETER@cluster0.wznbsy9.mongodb.net/brainly")

// const UserSchema = new Schema({
//     username: {type: String, unique: true},
//     password: String
// })

// export const UserModel = model("User", UserSchema);

// const ContentSchema = new Schema({
//     title: String,
//     link: String,
//     tags: [{type: mongoose.Types.ObjectId, ref: 'Tag'}],
//     type: String,
//     userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true },
// })

// const LinkSchema = new Schema({
//     hash: String,
//     userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
// })

// export const LinkModel = model("Links", LinkSchema);
// export const ContentModel = model("Content", ContentSchema);