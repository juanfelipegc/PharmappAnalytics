const functions = require('firebase-functions');
const {dbFirestore} = require('../Firebase');
const { Client } = require('pg')

// Function to connect with the datanase client
function conectarBD(){
    const client = new Client({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: {
            rejectUnauthorized: false
        }
    })
    client.connect()
    return client
}

/*
Function to create a new user in the postgreSQL database once it is created in the Firebase Cloud Firestore
 */
exports.updateUsersData = functions.firestore.document('users/{usersId}').onCreate((snap, context) => {
    const client = conectarBD()
    const newUser = snap.data()
    const text = 'INSERT INTO users(name, age, email, insurance, gender, city) VALUES($1, $2, $3, $4, $5, $6)'
    const values = [newUser.name, newUser.age, newUser.email, newUser.insurance, newUser.gender, newUser.city]
    return client
        .query(text, values)
        .then(res => {
            console.log("New user created")
            return "New user created"
        })
        .catch(e => console.error(e.stack))
});

/*
Function to update a user in the postgreSQL database
 */
exports.updateNews = functions.firestore.document('news/{newsId}').onUpdate((snap, context) => {
    const client = conectarBD()
    const data = snap.after.data()
    const text = 'UPDATE news SET views = $1 WHERE id = 2'
    const values = [data.views]
    return client
        .query(text, values)
        .then(res => {
            console.log("News updated")
            return "News updated"
        })
        .catch(e => console.error(e.stack))
});

/*
Function to update the number of times a medicines is forgotten
 */
exports.updateNotConsumed = functions.firestore.document('users/{usersId}/medicine/{medicineId}').onUpdate((change, context) => {
    const client = conectarBD()
    const data = change.after.data()
    const text = 'UPDATE active_medicines SET num_not_consumed = $1 WHERE id = 1'
    const values = [data.numNotConsumed]
    return client
        .query(text, values)
        .then(res => {
            console.log("Medicine Updated")
            return "Medicine Updated"
        })
        .catch(e => console.error(e.stack))
});