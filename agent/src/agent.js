const { io } = require("socket.io-client");

const {
    getCpuInfo,
    getSystemMetrics
} = require("./metrics");

const {
    getMachineId
} = require("./machine");

const SERVER_URL =
    process.env.BACKEND_URL ||
    "http://localhost:4000";

const machineId = getMachineId();

let pollingTimeout = null;
let isPolling = false;

console.log("Starting CPU Monitor Agent...");
console.log(`Machine ID: ${machineId}`);
console.log(`Backend: ${SERVER_URL}`);

const socket = io(SERVER_URL, {
    auth: {
        role: "agent",
        machineId
    },

    reconnection: true
});


async function sendStaticCpuInfo() {
    try {
        const cpuInfo = await getCpuInfo();

        socket.emit("agent_cpu_static", {
            machineId,
            cpuInfo
        });

        console.log("Static CPU information sent.");

    } catch (error) {
        console.error(
            "Failed to collect/send static CPU information:",
            error
        );
    }
}


async function pollMetrics() {

    if (!socket.connected) {
        isPolling = false;
        return;
    }

    try {
        const metrics = await getSystemMetrics();

        // Connection could disappear while metrics
        // were being collected.
        if (socket.connected) {
            socket.emit("agent_metrics_update", {
                machineId,
                metrics
            });

            console.log(
                `Telemetry sent | CPU: ${metrics.cpu.overallLoad}%`
            );
        }

    } catch (error) {
        console.error(
            "Failed to collect/send telemetry:",
            error
        );

    } finally {

        if (socket.connected) {
            pollingTimeout = setTimeout(
                pollMetrics,
                1000
            );
        } else {
            pollingTimeout = null;
            isPolling = false;
        }
    }
}


function startPolling() {

    if (isPolling) {
        return;
    }

    isPolling = true;

    pollMetrics();
}


function stopPolling() {

    if (pollingTimeout !== null) {
        clearTimeout(pollingTimeout);
        pollingTimeout = null;
    }

    isPolling = false;
}


socket.on("connect", async () => {

    console.log(
        `Connected to backend: ${socket.id}`
    );

    await sendStaticCpuInfo();

    startPolling();
});


socket.on("disconnect", (reason) => {

    console.log(
        `Disconnected from backend: ${reason}`
    );

    stopPolling();
});


socket.on("connect_error", (error) => {

    console.error(
        `Backend connection error: ${error.message}`
    );
});