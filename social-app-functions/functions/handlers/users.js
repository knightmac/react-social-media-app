const { db } = require("../utils/admin");

const config = require("../utils/config");

//firebase connection
const firebase = require("firebase");
firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData
} = require("../utils/validators");

exports.signup = (req, res) => {
  //expects a JSON object with following data
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  //Entry validation
  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

  //validate data
  // Check in collection "users", if the handle exists already
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password); // create User
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken(); //access token
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
      return res.status(201).json({ token }); //show access token
    })

    .catch(err => {
      console.error(err);
      if (err === "auth/email-already-in-use") {
        return res.status(400).json({ email: "email is already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

///////////
// LOGIN //
///////////
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  //Entry validation
  const { valid, errors } = validateLoginData(user);
  if (!valid) return res.status(400).json({ errors });

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
};
