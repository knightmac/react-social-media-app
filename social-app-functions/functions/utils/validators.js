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

exports.validateSignupData = data => {
  let errors = {};

  //Email validation
  if (isEmpty(data.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Email must be a valid email address";
  }

  //Password validation
  if (isEmpty(data.password)) {
    errors.password = "Password is not set";
  }
  if (data.password !== data.confirmPassword) {
    errors.password = "Passwords must match";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.validateLoginData = data => {
  let errors = {};
  if (isEmpty(data.email)) errors.email = "Email must not be empty";
  if (isEmpty(data.password)) errors.password = "Password must not be empty";
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};
