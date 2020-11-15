const {CloudTasksClient} = require('@google-cloud/tasks');
const client = new CloudTasksClient({ fallback: true });

/*
Function to create the cloud tasks
 */
const project = process.env.FIREBASE_PROJECT_ID;
const location = process.env.FIREBASE_LOCATION_FUNCTIONS;
const queue = process.env.GOOGLE_QUEUE_NAME;
const url = `https://${location}-${project}.cloudfunctions.net/dayFinished`;
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT;

function callCloudTask(dateTask, payload) {
    const formattedParent = client.queuePath(project, location, queue);
    const task = {
        name: `projects/${project}/locations/${location}/queues/${queue}/tasks/${payload.name}`,
        httpRequest: {
            httpMethod: "POST",
            url: url,
            body: Buffer.from(JSON.stringify(payload)),
            headers: {
                "Content-Type": "application/json"
            },
            oidcToken: {
                serviceAccountEmail
            },
        },
        scheduleTime: {
            seconds: dateTask / 1000
        }
    };
    const request = {
        parent: formattedParent,
        task: task
    };
    client.createTask(request)
        .then(()=>console.log("Cloud Task Created"))
        .catch((err)=> console.log("Error with the cloud task: " + err));
}

module.exports = {
    callCloudTask
};