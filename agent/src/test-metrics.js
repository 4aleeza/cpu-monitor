const {
    getCpuInfo,
    getSystemMetrics
} = require("./metrics");

async function test() {
    try {
        console.log("===== STATIC CPU INFO =====");

        const cpuInfo = await getCpuInfo();

        console.log(
            JSON.stringify(cpuInfo, null, 2)
        );

        console.log("\n===== LIVE CPU METRICS =====");

        const metrics = await getSystemMetrics();

        console.log(
            JSON.stringify(metrics, null, 2)
        );

    } catch (error) {
        console.error(
            "Agent telemetry test failed:",
            error
        );

        process.exit(1);
    }
}

test();