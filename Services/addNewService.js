const Service = require("../Models/service");
const readlineSync = require('readline-sync');


async function createService() {
    
    try {
        const serviceName = readlineSync.question('Service name: ');
        await Service.create({ name: serviceName });
        console.log('Service created successfully!');
    } catch (error) {
        console.error('Failed to create superuser:', error.message);
    }
}

createService();