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
  messagingSenderId: "467615227162"
};

const firebase = require("firebase");
firebase.initializeApp();

app.get("/screams", (req, res) => {
  admin
    .firestore()
    .collection("screens")
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

app.post("/scream", (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  admin
    .firestore()
    .collection("screens")
    .add(newScream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

// SignUp route
app.post("/signup", (req, res) => {
  const newUser = {
    // extract form data from body
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };
  // TODO: validate data

  firebase
    .auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then(data => {
      return res
        .status(201)
        .json({ message: `user ${data.user.id} signed up successfully` });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code + " I am here" });
    });
});

exports.api = functions.https.onRequest(app);
