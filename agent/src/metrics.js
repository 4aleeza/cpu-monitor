const si = require("systeminformation");

/*
 * Get static CPU information.
 *
 * This information does not constantly change, so the backend
 * should call this once when it starts rather than every second.
 */
async function getCpuInfo() {
    try {
        const cpu = await si.cpu();

        return {
            manufacturer: cpu.manufacturer,
            brand: cpu.brand,
            physicalCores: cpu.physicalCores,
            logicalCores: cpu.cores,
            baseSpeedGHz: Number(cpu.speed),
            maxSpeedGHz: Number(cpu.speedMax)
        };

    } catch (error) {
        console.error("Error collecting CPU information:", error);
        throw error;
    }
}


/*
 * Get live system telemetry.
 *
 * This function will eventually be called once every second
 * while at least one dashboard client is connected.
 */
async function getSystemMetrics() {
    try {
        const [
            currentLoad,
            currentSpeed,
            processData
        ] = await Promise.all([
            si.currentLoad(),
            si.cpuCurrentSpeed(),
            si.processes()
        ]);

        const topProcesses = [...processData.list]
            .filter(process =>
                process.name !== "System Idle Process"
            )
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 3)
            .map(process => ({
                pid: process.pid,
                name: process.name,
                cpu: Number(process.cpu.toFixed(2)),
                memory: Number(process.mem.toFixed(2))
            }));

        return {
            timestamp: new Date().toISOString(),

            cpu: {
                overallLoad: Number(
                    currentLoad.currentLoad.toFixed(2)
                ),

                coreLoads: currentLoad.cpus.map((core, index) => ({
                    core: index,
                    load: Number(core.load.toFixed(2))
                })),

                clockSpeed: {
                    averageGHz: Number(currentSpeed.avg) || null,

                    cores: Array.isArray(currentSpeed.cores)
                        ? currentSpeed.cores.map((speed, index) => ({
                            core: index,
                            speedGHz: Number(speed)
                        }))
                        : []
                },

                /*
                 * Reserved for future temperature monitoring.
                 * Not currently collected or displayed.
                 */
                temperature: {
                    package: null,
                    cores: []
                }
            },

            topProcesses
        };

    } catch (error) {
        console.error("Error collecting system metrics:", error);
        throw error;
    }
}


module.exports = {
    getCpuInfo,
    getSystemMetrics
};