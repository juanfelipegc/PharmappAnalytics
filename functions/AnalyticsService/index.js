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
Function to create a new user in the postgreSQL database once iy is created in the Firebase Cloud Firestore
 */
exports.updateUsersData = functions.firestore.document('users/{usersId}').onCreate((snap, context) => {
    const client = conectarBD()
    const newUser = snap.data()
    const text = 'INSERT INTO users(name, age, email, last_name, insurance, gender, city) VALUES($1, $2, $3, $4, $5, $6, $7)'
    const values = [newUser.name, newUser.age, newUser.email, newUser.lastname, newUser.insurance, newUser.gender, newUser.city]
    client
        .query(text, values)
        .then(res => {
            console.log(res.rows[0])
            console.log("New user created")
            return res.rows[0]
        })
        .catch(e => console.error(e.stack))
});