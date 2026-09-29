const express = require("express");
const http = require("http");
const { Server } = require("socket.io");



// --------------------------------------------------
// Server setup
// --------------------------------------------------

const app = express();

const staticCpuCache = new Map();
const machineStatus = new Map();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = 4000;
const HEARTBEAT_TIMEOUT = 15000;
const HEARTBEAT_CHECK_INTERVAL = 5000;


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
        machineStatus.set(machineId, {
        status: "online",
        lastSeen: Date.now()
        });


        console.log(
        `Machine marked online: ${machineId}`
        );


        io.to(roomName).emit(
        "machine_status_change",
        {
        machineId,
        status: "online",
        lastSeen: Date.now()
        }
);


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
                // Save this machine's static CPU information
            staticCpuCache.set(
            machineId,
            data.cpuInfo
    );


    // Send it to dashboards that are already in the room
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

        socket.on("agent_heartbeat", (data) => {

    if (
        data.machineId !== machineId
    ) {
        console.log(
            `Invalid heartbeat from ${machineId}`
        );

        return;
    }

    const now = Date.now();

    machineStatus.set(machineId, {
        status: "online",
        lastSeen: now
    });
});

        socket.on("disconnect", () => {

    const lastSeen =
        machineStatus.get(machineId)?.lastSeen
        ?? Date.now();

    machineStatus.set(machineId, {
        status: "offline",
        lastSeen
    });

    io.to(roomName).emit(
        "machine_status_change",
        {
            machineId,
            status: "offline",
            lastSeen
        }
    );

    console.log(
        `Agent disconnected: ${machineId}`
    );

    console.log(
        `Machine marked offline: ${machineId}`
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
    if (machineStatus.has(machineId)) {

    const currentStatus =
        machineStatus.get(machineId);

    socket.emit(
        "machine_status_change",
        {
            machineId,
            ...currentStatus
        }
    );
}

    console.log(
        `Dashboard ${socket.id} subscribed to machine ${machineId}`
    );

    console.log(
        `Dashboard joined room: ${roomName}`
    );

    if (staticCpuCache.has(machineId)) {

        const cachedCpuInfo =
            staticCpuCache.get(machineId);

        // Send cached information only to this dashboard
        socket.emit(
            "cpu_static",
            cachedCpuInfo
        );

        console.log(
            `Cached CPU info sent to dashboard for ${machineId}`
        );
    }
});

    // activeClients++;

    console.log(
        `Dashboard connected: ${socket.id}`
    );



    socket.on("disconnect", () => {

    console.log(
        `Dashboard disconnected: ${socket.id}`
    );
    });


    });

    setInterval(() => {

    const now = Date.now();

    for (const [machineId, machine] of machineStatus) {

        if (
            machine.status === "online" &&
            now - machine.lastSeen > HEARTBEAT_TIMEOUT
        ) {

            machineStatus.set(machineId, {
                status: "offline",
                lastSeen: machine.lastSeen
            });

            const roomName =
                `room:${machineId}`;

            io.to(roomName).emit(
                "machine_status_change",
                {
                    machineId,
                    status: "offline",
                    lastSeen: machine.lastSeen
                }
            );

            console.log(
                `Heartbeat timeout: ${machineId}`
            );

            console.log(
                `Machine marked offline: ${machineId}`
            );
        }
    }

}, HEARTBEAT_CHECK_INTERVAL);



// startServer();
server.listen(PORT, () => {

    console.log(
        `Backend server running on port ${PORT}`
    );
});