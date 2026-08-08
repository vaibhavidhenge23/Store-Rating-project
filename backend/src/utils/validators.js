function validateName(name) {
  return typeof name === 'string' && name.length >= 20 && name.length <= 60;
}

function validateAddress(address) {
  return typeof address === 'string' && address.length > 0 && address.length <= 400;
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 16) {
    return false;
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password);
  return hasUpper && hasSpecial;
}

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = { validateName, validateAddress, validatePassword, validateEmail };
