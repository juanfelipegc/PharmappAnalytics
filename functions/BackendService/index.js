const functions = require('firebase-functions');

/*
First function to show the correct deployment of the backend service
 */
exports.backend = functions.https.onRequest((req, res) => {
    res.status(200).send("Backend service working");
});