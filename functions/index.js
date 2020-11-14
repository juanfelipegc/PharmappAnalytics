// To deploy run the next command: firebase deploy --only functions:addMessage
//firebase emulators:start --inspect-functions
require('dotenv').config();

////////////////////////////////////////////////////////////////////////////////
// Analytics Service Endpoints
////////////////////////////////////////////////////////////////////////////////
const analytics = require('./AnalyticsService/index');
exports.updateUsersData = analytics.updateUsersData;
exports.updateNotConsumed = analytics.updateNotConsumed;
exports.updateNews = analytics.updateNews;

////////////////////////////////////////////////////////////////////////////////
// Backend Service Endpoints
////////////////////////////////////////////////////////////////////////////////
const backend = require('./BackendService/index');
exports.addMedicine = backend.addMedicine;
exports.dayFinished = backend.dayFinished;
