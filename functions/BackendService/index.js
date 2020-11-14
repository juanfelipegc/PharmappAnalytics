const functions = require('firebase-functions');
const {dbFirestore} = require('../Firebase')
const moment = require('moment')
const {callCloudTask} = require('./CreateCloudTask');
/*
First function to add a medicine, this validates if there are adverse effects
 */
exports.addMedicine = functions.https.onCall(async (data, context) => {
    let uid = context.auth.uid
    if (uid !== null) {
        let idMed = data.uid
        if (idMed) {
            let docMed = await dbFirestore.doc(`medicines/${idMed}`).get()
            if (!docMed.exists) {
                return "No medicine found"
            } else {
                let medicine = docMed.data()
                let snapshotMeds = await dbFirestore.collection(`users/${uid}/medicine`).get()
                if (snapshotMeds.empty) {
                    return await addMedicineUser(uid, medicine)
                } else {
                    //Review if the med has adverse effects
                    let hasInteractions = false
                    let warnings = medicine.warnings
                    if (warnings) {
                        snapshotMeds.forEach(doc => {
                            if (!hasInteractions) {
                                warnings.forEach(warning => {
                                    if (warning.id === doc.id)
                                        hasInteractions = true
                                })
                            }
                        })
                    }
                    if (!hasInteractions)
                        return await addMedicineUser(uid, medicine)
                    else
                        return "Risk"
                }
            }
        } else
            return "No id medicine receive"
    } else
        return 'Unauthorized'
});

const addMedicineUser = async (idUser, medicine) => {
    try {
        await dbFirestore.doc(`users/${idUser}/medicine/${medicine.id}`).set({
            name: medicine.name,
            days: medicine.days,
            description: medicine.description,
            descriptionMed: medicine.descriptionMed,
            id: medicine.id,
            brand: medicine.brand,
            tag: medicine.tag,
            time: medicine.time,
            dateAdded: new Date()
        })
        let days = medicine.days
        let promises = []
        for (let i = 0; i < days; i++) {
            promises.push(addCalendarAndMedicine(idUser, medicine, i))
        }
        await Promise.all(promises)
        return "Added"
    } catch (e) {
        console.log(e)
        return e
    }
}

const addCalendarAndMedicine = async (idUser, medicine, i) => {
    let todayDate = new Date()
    let dateMed = todayDate.setDate(todayDate.getDate() + i)
    let finalDate = moment(dateMed).format('D MMM')
    let snapshotMeds = await dbFirestore.collection(`users/${idUser}/calendar/${finalDate}/medicines`).get()
    let numMeds = snapshotMeds.size + 1
    await dbFirestore.doc(`users/${idUser}/calendar/${finalDate}`).set({
        day: finalDate,
        times: numMeds
    }, {merge: true})
    await dbFirestore.doc(`users/${idUser}/calendar/${finalDate}/medicines/${medicine.id}`).set({
        hours: medicine.time,
        name: medicine.name,
        tag: medicine.tag
    })
    let taskName = idUser + finalDate
    let dateTask = dateMed.setMinutes(dateMed.getMinutes() + 60)
    let finalName = taskName.replace(' ','')
    console.log(finalName)
    let payload = {
        name: finalName,
        idUser: idUser,
        idDate: finalDate
    }
    callCloudTask(dateTask, payload)
}

exports.dayFinished = functions.https.onRequest(async (req, res) => {
    const payload = req.body;
    console.log(payload)
    try {
        let idUser = payload.idUser
        let dateDelete = payload.idDate
        let snapshot = dbFirestore.collection(`users/${idUser}/calendar/${dateDelete}/medicines`).get()
        const batch = dbFirestore.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        await dbFirestore.doc(`users/${idUser}/calendar/${dateDelete}`).delete()
        res.status(200).send("Day finished");
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})