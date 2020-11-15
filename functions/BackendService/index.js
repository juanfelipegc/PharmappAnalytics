const functions = require('firebase-functions');
const {admin, dbFirestore} = require('../Firebase')
const moment = require('moment')
const {callCloudTask} = require('./CreateCloudTask');
const {generateHash} = require('random-hash')
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
            numPills: medicine.numPills,
            dateAdded: new Date()
        })
        let days = medicine.days
        let promises = []
        let cloudTasks = []
        for (let i = 0; i < days; i++) {
            let todayDate = new Date()
            let dateMed = todayDate.setDate(todayDate.getDate() + i)
            let finalDate = moment(dateMed).format('D MMM')
            cloudTasks[i] = {
                dateMed,
                finalDate
            }
            promises.push(addCalendarAndMedicine(idUser, medicine, finalDate))
        }
        await Promise.all(promises)
        cloudTasks.forEach((task) => {
            sendCloudTask(idUser, task.finalDate, task.dateMed, medicine.id).then((res)=>{
                console.log(res)
                return res
            }).catch((err) => {
                console.log(err)
                return err
            })
        })
        return "Added"
    } catch (e) {
        console.log(e)
        return e
    }
}

const sendCloudTask = async(idUser, finalDate, dateMed, medicineId) => {
    let dateTask = new Date(dateMed)
    dateTask.setHours(23)
    dateTask.setMinutes(59)
    let nameTask = generateHash({length: 20})
    let payload = {
        name: nameTask,
        idUser: idUser,
        idDate: finalDate,
        idMed: medicineId
    }
    await callCloudTask(dateTask, payload)
}

const addCalendarAndMedicine = async (idUser, medicine, finalDate) => {
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
}

exports.dayFinished = functions.https.onRequest(async (req, res) => {
    const payload = req.body;
    console.log(payload)
    try {
        let idUser = payload.idUser
        let dateDelete = payload.idDate
        let idMedicine = payload.idMed
        let snapshot = await dbFirestore.collection(`users/${idUser}/calendar/${dateDelete}/medicines`).get()
        const batch = dbFirestore.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        await dbFirestore.doc(`users/${idUser}/calendar/${dateDelete}`).delete()
        await dbFirestore.doc(`users/${idUser}/medicine/${idMedicine}`).update({
            numPills: admin.firestore.FieldValue.increment(-1)
        })
        res.status(200).send("Day finished");
    } catch (error) {
        console.error(error);
        res.status(500).send(error)
    }
})