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

    activeClients++;

    console.log(`Client connected: ${socket.id}`);
    console.log(`Active clients: ${activeClients}`);


    // Send cached hardware information only
    // to the newly connected client.
    socket.emit("cpu_static", cachedCpuInfo);


    /*
     * If the counter just changed from 0 -> 1,
     * this is the first active dashboard.
     *
     * Start the telemetry worker immediately.
     */
    if (activeClients === 1) {

        console.log("Starting live metrics collection...");

        pollAndBroadcast();
    }


    socket.on("disconnect", () => {

        activeClients--;

        console.log(`Client disconnected: ${socket.id}`);
        console.log(`Active clients: ${activeClients}`);


        /*
         * The final dashboard has disconnected.
         * Cancel any poll that is waiting to execute.
         */
        if (activeClients === 0) {

            if (metricsTimeout !== null) {
                clearTimeout(metricsTimeout);
                metricsTimeout = null;
            }

            console.log("Live metrics collection stopped.");
        }
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