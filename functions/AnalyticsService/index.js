const functions = require('firebase-functions');

/*
First function to show the correct deployment of the analytics service
 */
exports.analytics = functions.https.onRequest((req, res) => {
    res.status(200).send("Analytics service working");
});