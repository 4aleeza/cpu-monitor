const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const {
    getCpuInfo,
    getSystemMetrics
} = require("./metrics");


// --------------------------------------------------
// Server setup
// --------------------------------------------------

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = 4000;


// --------------------------------------------------
// Server state
// --------------------------------------------------

// Static CPU information loaded once at startup
let cachedCpuInfo = null;

// Number of currently connected dashboard clients
let activeClients = 0;

// Reference to the next scheduled metrics poll
let metricsTimeout = null;


// --------------------------------------------------
// Live metrics polling worker
// --------------------------------------------------

async function pollAndBroadcast() {

    // Nobody is watching anymore.
    // Do not collect metrics or schedule another poll.
    if (activeClients === 0) {
        return;
    }

    try {

        // Wait until the current hardware collection
        // completely finishes.
        const metrics = await getSystemMetrics();

        // It is possible that all clients disconnected
        // while we were waiting for the metrics.
        if (activeClients > 0) {
            io.emit("metrics_update", metrics);
        }

    } catch (error) {

        // A temporary telemetry failure should not
        // crash the entire backend.
        console.error(
            "Error collecting live system metrics:",
            error
        );

    } finally {

        /*
         * Only schedule the NEXT collection after
         * the current collection has completely finished.
         *
         * This prevents overlapping hardware polling.
         */
        if (activeClients > 0) {
            metricsTimeout = setTimeout(
                pollAndBroadcast,
                1000
            );
        } else {
            metricsTimeout = null;
        }
    }
}


// --------------------------------------------------
// Socket.IO connections
// --------------------------------------------------

io.on("connection", (socket) => {

    const role = socket.handshake.auth?.role;
    const machineId = socket.handshake.auth?.machineId;

    // ==============================
    // AGENT CONNECTION
    // ==============================

    if (role === "agent") {

        if (!machineId) {
            console.log(
                "Agent rejected: missing machine ID"
            );

            socket.disconnect(true);
            return;
        }

        const roomName = `room:${machineId}`;

        socket.join(roomName);

        console.log(
            `Agent connected: ${socket.id}`
        );

        console.log(
            `Machine ID: ${machineId}`
        );

        console.log(
            `Agent joined room: ${roomName}`
        );


        socket.on("agent_cpu_static", (data) => {

            if (
                data.machineId !== machineId ||
                !data.cpuInfo
            ) {
                console.log(
                    `Invalid static CPU payload from ${machineId}`
                );
                return;
            }

            console.log(
                `Static CPU info received from ${machineId}`
            );

            socket
                .to(roomName)
                .emit(
                    "cpu_static",
                    data.cpuInfo
                );
        });


        socket.on("agent_metrics_update", (data) => {

            if (
                data.machineId !== machineId ||
                !data.metrics
            ) {
                console.log(
                    `Invalid telemetry payload from ${machineId}`
                );
                return;
            }

            console.log(
                `Telemetry received from ${machineId} | CPU: ${data.metrics.cpu.overallLoad}%`
            );

            socket
                .to(roomName)
                .emit(
                    "metrics_update",
                    data.metrics
                );
        });


        socket.on("disconnect", () => {

            console.log(
                `Agent disconnected: ${machineId}`
            );
        });

        return;
    }


    // ==============================
    // EXISTING DASHBOARD CONNECTION
    // ==============================
    socket.on("dashboard_subscribe", ({ machineId }) => {

    if (!machineId) {
        console.log(
            `Dashboard ${socket.id} attempted subscription without machine ID`
        );
        return;
    }

    const roomName = `room:${machineId}`;

    socket.join(roomName);

    console.log(
        `Dashboard ${socket.id} subscribed to machine ${machineId}`
    );

    console.log(
        `Dashboard joined room: ${roomName}`
    );
});

    activeClients++;

    console.log(
        `Dashboard connected: ${socket.id}`
    );

    console.log(
        `Active dashboards: ${activeClients}`
    );

    // socket.emit(
    //     "cpu_static",
    //     cachedCpuInfo
    // );


    // if (activeClients === 1) {

    //     console.log(
    //         "Starting legacy live metrics collection..."
    //     );

    //     pollAndBroadcast();
    // }


    socket.on("disconnect", () => {

        activeClients--;

        console.log(
            `Dashboard disconnected: ${socket.id}`
        );

        console.log(
            `Active dashboards: ${activeClients}`
        );


        // if (activeClients === 0) {

        //     if (metricsTimeout !== null) {
        //         clearTimeout(metricsTimeout);
        //         metricsTimeout = null;
        //     }

        //     console.log(
        //         "Legacy live metrics collection stopped."
        //     );
        // }
    });
});


// --------------------------------------------------
// Server startup
// --------------------------------------------------

async function startServer() {

    try {

        console.log("Reading CPU hardware information...");

        // Fetch static CPU information exactly once.
        cachedCpuInfo = await getCpuInfo();

        console.log("CPU information cached successfully:");
        console.log(cachedCpuInfo);


        // Only accept connections after CPU
        // information has been successfully cached.
        server.listen(PORT, () => {
            console.log(
                `Backend server running on port ${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Critical error: Failed to initialize CPU information.",
            error
        );

        process.exit(1);
    }
}


startServer();