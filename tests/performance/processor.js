/**
 * Artillery Performance Test Processor
 * Custom functions untuk load testing
 */

module.exports = {
  generateRandomGuestName,
  generateRandomComment,
  logResponse,
};

function generateRandomGuestName(context, events, done) {
  context.vars.randomGuestName = `Guest_${Math.random().toString(36).substring(7)}`;
  return done();
}

function generateRandomComment(context, events, done) {
  const comments = [
    'Beautiful photo!',
    'Amazing capture!',
    'Love this moment!',
    'Great memories!',
    'Stunning shot!',
  ];
  context.vars.randomComment = comments[Math.floor(Math.random() * comments.length)];
  return done();
}

function logResponse(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.log(`Error: ${response.statusCode} - ${response.body}`);
  }
  return next();
}
