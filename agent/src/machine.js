const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MACHINE_FILE = path.join(
    __dirname,
    "..",
    "machine.json"
);

function getMachineId() {

    // Existing installation
    if (fs.existsSync(MACHINE_FILE)) {
        const data = JSON.parse(
            fs.readFileSync(MACHINE_FILE, "utf8")
        );

        return data.machineId;
    }

    // First run
    const machineId = crypto.randomUUID();

    fs.writeFileSync(
        MACHINE_FILE,
        JSON.stringify(
            { machineId },
            null,
            2
        )
    );

    return machineId;
}

module.exports = {
    getMachineId
};