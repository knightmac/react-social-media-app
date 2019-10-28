const functions = require("firebase-functions");
const app = require("express")();

//Implementations
const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signup, login } = require("./handlers/users");

// Authentication Function (Middleware)
const FBAuth = require("./utils/fbAuth"); // Checks, if the right user is logged-in

//Scream routes
app.get("/screams", getAllScreams); //shows all Screams
app.post("/scream", FBAuth, postOneScream); //creates a new scream

// User routes
app.post("/signup", signup);
app.post("/login", login);

exports.api = functions.https.onRequest(app);
