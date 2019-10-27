const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();

admin.initializeApp();

const config = {
  apiKey: "AIzaSyAvf3qu9PD00deuxef2XAQ53lCZJT4jz4M",
  authDomain: "social-app-f16c1.firebaseapp.com",
  databaseURL: "https://social-app-f16c1.firebaseio.com",
  projectId: "social-app-f16c1",
  storageBucket: "social-app-f16c1.appspot.com",
  messagingSenderId: "467615227162",
  appId: "1:467615227162:web:6ca3a4dbad621b0a0860a3",
  measurementId: "G-GC0BEHLEXM"
};

const firebase = require("firebase");
firebase.initializeApp(config);

const db = admin.firestore();

//show all screams Route
app.get("/screams", (req, res) => {
  db.collection("screens")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      var screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch(err => console.log(err));
});

// Authentication Function (Middleware)
// Check, if a logged-in user posts scream
const FBAuth = (req, res, next) => {
  let idToken;
  // Validation, if its a valid user in general
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Validation, if its the right user
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);

      // "handle" is stored in db collection, not in firebase authentication
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      return next();
    })
    .catch(err => {
      console.error("Error while verifying token", err);
      return res.status(403).json({ err });
    });
};

//create new scream Route
app.post("/scream", FBAuth, (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString()
  };

  db.collection("screens")
    .add(newScream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

const isEmpty = string => {
  if (string.trim() === "") {
    return true;
  } else return false;
};

const isEmail = email => {
  let regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) {
    return true;
  } else return false;
};

// SignUp route
app.post("/signup", (req, res) => {
  //expects a JSON object with following data
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };
  let token, userId;

  let errors = {};

  //Email validation
  if (isEmpty(newUser.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Email must be a valid email address";
  }

  //Password validation
  if (isEmpty(newUser.password)) {
    errors.password = "Password is not set";
  }
  if (newUser.password !== newUser.confirmPassword) {
    errors.password = "Passwords must match";
  }

  // Check if errors are detected
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  //validate data
  // Check in collection "users", if the handle exists already
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        // create User
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      //access token
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      //show access token
      return res.status(201).json({ token });
    })

    .catch(err => {
      console.error(err);
      if (err === "auth/email-already-in-use") {
        return res.status(400).json({ email: "email is already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  //Entry validation
  let errors = {};
  if (isEmpty(user.email)) errors.email = "Email must not be empty";
  if (isEmpty(user.password)) errors.password = "Password must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  //Signing user in
  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      if (err.code === "auth/wrong-password") {
        return res
          .status(403)
          .json({ general: "Wrong credentials, please try again" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});
exports.api = functions.https.onRequest(app);
