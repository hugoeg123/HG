const { Patient } = require('../models');

async function listPatients() {
    try {
        const patients = await Patient.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name']
        });

        const fs = require('fs');
        const output = JSON.stringify(patients, null, 2);
        console.log(output);
        fs.writeFileSync('patients_list.txt', output);
    } catch (err) {
        console.error('List Patients Error:', err);
    }
}

listPatients().then(() => process.exit(0));
