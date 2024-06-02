const jwt_decode = require('jwt-decode');

const testToken = 'your_jwt_token_here';
try {
  const decoded = jwt_decode(testToken);
  console.log('Decoded Token:', decoded);
} catch (error) {
  console.error('Error decoding token:', error);
}
