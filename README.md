# CPU Monitor

CPU Monitor is a real-time full-stack system monitoring dashboard designed to visualize CPU performance and resource usage.

The project uses a lightweight Node.js backend to collect local CPU telemetry and streams live metrics to a Next.js dashboard using WebSockets.

The primary goal is to provide a clean, low-overhead dashboard useful for monitoring CPU behavior during workloads such as gaming.

> Status: Currently under development

---

## Features

### CPU Monitoring

The dashboard is designed to monitor:

- Overall CPU utilization
- Per-logical-processor utilization
- Average CPU clock speed
- Per-logical-processor clock speeds
- Top 3 CPU-consuming background processes
- Static CPU hardware information
  - CPU model
  - Manufacturer
  - Physical core count
  - Logical processor count
  - Base clock speed
  - Maximum reported clock speed

CPU temperature monitoring is planned as a future addition.

---

## Architecture

The project is separated into a frontend and backend:

```text
system-analytics/
│
├── backend/
│   └── Node.js + Express + Socket.IO
│
└── frontend/
    └── Next.js + Tailwind CSS
```

### Backend

The backend uses:

- Node.js
- Express
- Socket.IO
- systeminformation

`systeminformation` collects telemetry directly from the host operating system.

Static CPU information is collected once when the backend starts and cached in memory.

Live telemetry is collected only while at least one dashboard client is connected.

### Frontend

The frontend will use:

- Next.js
- Tailwind CSS
- Socket.IO Client
- A charting library for live CPU graphs

The frontend will receive telemetry through a persistent Socket.IO connection without requiring page refreshes.

---

## Telemetry Pipeline

```text
Operating System
       │
       ▼
systeminformation
       │
       ▼
Node.js Backend
       │
       │ Socket.IO
       ▼
Next.js Dashboard
       │
       ▼
Live CPU Visualization
```

---

## Performance Design

The monitoring backend is designed to minimize its own impact on system performance.

### Client-aware polling

Hardware polling starts when the first dashboard client connects.

```text
0 clients
    ↓
Polling stopped

1+ clients
    ↓
Polling active
```

When the final client disconnects, telemetry collection automatically stops.

### Non-overlapping polling

The backend uses self-scheduling asynchronous polling instead of a fixed `setInterval()`.

The next telemetry collection is scheduled only after the previous collection has completed.

This prevents slow hardware queries from creating overlapping monitoring operations.

### Concurrent metric collection

Independent system telemetry requests are executed concurrently using `Promise.all()` where appropriate.

---

## Current Development Progress

- [x] Project structure
- [x] CPU telemetry collection
- [x] Static CPU information collection
- [x] Per-logical-processor load monitoring
- [x] CPU clock monitoring
- [x] Top CPU process detection
- [x] Express HTTP server
- [x] Socket.IO server
- [x] Static CPU information caching
- [x] Client connection tracking
- [x] Client-aware telemetry polling
- [x] Non-overlapping asynchronous polling
- [ ] Test real-time Socket.IO telemetry
- [ ] Next.js frontend
- [ ] Live CPU charts
- [ ] Per-processor visualization
- [ ] Top process visualization
- [ ] Frontend ring buffer for chart history
- [ ] Historical telemetry storage
- [ ] Separate lightweight monitoring agent
- [ ] CPU temperature monitoring

---

## Project Structure

```text
system-analytics/
│
├── backend/
│   ├── src/
│   │   ├── metrics.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   └── (coming soon)
│
├── .gitignore
└── README.md
```

---

## Running the Backend

Install the backend dependencies:

```bash
cd backend
npm install
```

Start the monitoring server:

```bash
node src/server.js
```

The backend currently runs on:

```text
http://localhost:3000
```

The telemetry polling system remains inactive until a Socket.IO client connects.

---

## Future Plans

Future development will include:

- Real-time Next.js monitoring dashboard
- Historical CPU usage tracking
- Local database storage
- CPU temperature support
- Separation of the monitoring agent from the dashboard server
- Support for monitoring remote machines
- Containerization and DevOps deployment

---

## License

This project is currently intended for educational and development purposes.
