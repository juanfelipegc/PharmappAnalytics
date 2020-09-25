const admin = require("firebase-admin");
const serviceAccount = require("./admin.json");
require('dotenv').config();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});
const dbFirestore = admin.firestore();
module.exports = {
    admin,
    dbFirestore
};