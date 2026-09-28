# CPU Monitor

CPU Monitor is a real-time full-stack CPU monitoring dashboard designed to visualize CPU performance and process activity.

The project uses a lightweight **local Node.js monitoring agent** to collect CPU telemetry from a machine. The agent sends telemetry to a **Node.js + Socket.IO backend**, which routes the data to the correct **Next.js dashboard** using machine-specific Socket.IO rooms.

The project is being developed as an observability-focused system with the goal of supporting remote machine monitoring and later deployment to cloud infrastructure.

> **Status:** Under active development

---

## Features

### Real-Time CPU Monitoring

The dashboard currently displays:

- Overall CPU utilization
- Per-logical-processor utilization
- Average CPU clock speed
- Per-logical-processor clock speeds
- Top 3 CPU-consuming processes
- Static CPU hardware information
  - CPU model
  - Manufacturer
  - Physical core count
  - Logical processor count
  - Base clock speed
  - Maximum reported clock speed

Telemetry is streamed continuously to the dashboard using Socket.IO without requiring page refreshes.

CPU temperature monitoring is not currently available and may be added later.

---

## Architecture

The project is separated into three main components:

```text
system-analytics/
│
├── agent/
│   └── Local CPU telemetry collector
│
├── backend/
│   └── Node.js + Express + Socket.IO relay
│
└── frontend/
    └── Next.js + Tailwind CSS dashboard
```

The current architecture is:

```text
Local Machine
     │
     ▼
Monitoring Agent
(systeminformation)
     │
     │ Socket.IO
     ▼
Backend Relay
(Node.js + Socket.IO)
     │
     │ Machine-specific room
     ▼
Next.js Dashboard
     │
     ▼
Live CPU Visualization
```

This separation allows the machine being monitored to run only the lightweight agent while the backend and frontend can later be deployed independently.

---

## Monitoring Agent

The monitoring agent runs on the machine being monitored.

It uses:

- Node.js
- systeminformation
- Socket.IO Client

The agent is responsible for:

1. Reading CPU information from the operating system.
2. Collecting live CPU telemetry.
3. Identifying the machine using a persistent Machine ID.
4. Connecting to the backend through Socket.IO.
5. Sending static CPU information to the backend.
6. Continuously sending live CPU metrics.

Each installation generates a persistent Machine ID stored locally in:

```text
agent/machine.json
```

This file is excluded from Git.

The Machine ID allows the backend to distinguish between different monitored computers.

> Machine IDs are currently used for routing only and are not intended to provide authentication or security.

---

## Backend

The backend uses:

- Node.js
- Express
- Socket.IO

The backend is being transitioned from a local telemetry collector into a **telemetry relay and coordinator**.

Agents connect to the backend and are assigned to machine-specific Socket.IO rooms.

For example:

```text
Agent A
   │
   ▼
room:machine-A
   │
   ▼
Dashboard A


Agent B
   │
   ▼
room:machine-B
   │
   ▼
Dashboard B
```

This prevents CPU telemetry from one monitored machine from being broadcast to unrelated dashboards.

### Socket.IO Events

The agent sends:

```text
agent_cpu_static
agent_metrics_update
```

The backend relays the corresponding information to dashboards as:

```text
cpu_static
metrics_update
```

This allows the existing frontend telemetry interface to remain simple while the backend handles machine-specific routing.

---

## Frontend

The frontend uses:

- Next.js
- React
- Tailwind CSS
- Socket.IO Client
- Recharts

The dashboard currently includes:

- CPU utilization gauge
- CPU usage history chart
- CPU clock speed chart
- Per-logical-processor visualization
- Top CPU process list
- Static CPU hardware information
- Live backend connection status

The frontend maintains a rolling history of the latest telemetry samples for real-time chart visualization.

No fake or randomly generated telemetry is used. Dashboard values originate from the monitoring agent.

---

## Machine-Based Telemetry Routing

Each monitoring agent has a persistent Machine ID.

When the agent connects, it identifies itself to the backend:

```text
Agent
  │
  │ Machine ID
  ▼
Backend
  │
  ▼
room:<machineId>
```

A dashboard subscribes to the same Machine ID:

```text
Dashboard
   │
   │ dashboard_subscribe
   ▼
Backend
   │
   ▼
room:<machineId>
```

The resulting data flow is:

```text
Agent
  │
  │ agent_metrics_update
  ▼
Backend
  │
  │ room:<machineId>
  ▼
Dashboard
  │
  │ metrics_update
  ▼
Live Charts
```

This architecture provides the foundation for monitoring multiple machines through the same backend.

---

## Performance Design

The monitoring system is designed to keep telemetry collection lightweight.

### Non-Overlapping Polling

The monitoring agent uses self-scheduling asynchronous polling rather than a fixed `setInterval()`.

The next telemetry collection is scheduled only after the previous collection finishes.

Conceptually:

```text
Collect metrics
      │
      ▼
Send telemetry
      │
      ▼
Wait approximately 1 second
      │
      ▼
Collect again
```

This prevents slow telemetry queries from creating overlapping collection operations.

### Concurrent Metric Collection

Independent system telemetry requests are executed concurrently using `Promise.all()` where appropriate.

This reduces the time required to construct each telemetry snapshot.

### Automatic Socket.IO Reconnection

The monitoring agent and dashboard use Socket.IO connections.

If the connection is interrupted, Socket.IO can reconnect automatically.

When the dashboard reconnects, it subscribes to its Machine ID again so it can rejoin the correct machine-specific room.

---

## Current Development Progress

### Monitoring

- [x] CPU telemetry collection
- [x] Static CPU information collection
- [x] Overall CPU utilization
- [x] Per-logical-processor utilization
- [x] CPU clock monitoring
- [x] Per-logical-processor clock monitoring
- [x] Top CPU process detection
- [x] Non-overlapping asynchronous polling
- [x] Concurrent metric collection

### Monitoring Agent

- [x] Separate monitoring agent
- [x] Persistent Machine ID generation
- [x] Socket.IO backend connection
- [x] Static CPU information transmission
- [x] Live CPU telemetry transmission
- [x] Automatic Socket.IO reconnection

### Backend

- [x] Express server
- [x] Socket.IO server
- [x] Agent connection detection
- [x] Agent Machine ID handling
- [x] Machine-specific Socket.IO rooms
- [x] Agent telemetry reception
- [x] Machine-specific telemetry routing
- [x] Dashboard machine subscription
- [ ] Cache latest static CPU information per machine
- [ ] Remove legacy backend CPU collector
- [ ] Agent/dashboard authentication

### Frontend

- [x] Next.js dashboard
- [x] Tailwind CSS interface
- [x] Socket.IO Client integration
- [x] Live connection status
- [x] CPU utilization gauge
- [x] CPU usage history chart
- [x] CPU clock speed chart
- [x] Per-logical-processor visualization
- [x] Top CPU process visualization
- [x] Static CPU information display
- [x] Rolling telemetry history
- [x] Machine room subscription

### Future Work

- [ ] Static CPU information caching per machine
- [ ] Secure agent authentication
- [ ] Secure dashboard access
- [ ] User-friendly machine pairing
- [ ] Historical telemetry storage
- [ ] CPU temperature support
- [ ] Backend cloud deployment
- [ ] Frontend deployment
- [ ] Remote machine monitoring
- [ ] Containerization
- [ ] Monitoring and alerting infrastructure

---

## Project Structure

```text
system-analytics/
│
├── agent/
│   ├── src/
│   │   ├── agent.js
│   │   ├── machine.js
│   │   ├── metrics.js
│   │   ├── test-machine.js
│   │   └── test-metrics.js
│   │
│   ├── package.json
│   └── package-lock.json
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
│   ├── src/
│   │   └── app/
│   │       ├── components/
│   │       ├── hooks/
│   │       │   └── useTelemetry.js
│   │       ├── globals.css
│   │       ├── layout.js
│   │       └── page.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

> `backend/src/metrics.js` currently remains during the migration from backend-based telemetry collection to the standalone monitoring agent. It will be removed once the relay architecture is fully completed.

---

## Running the Project Locally

The project currently requires three processes:

1. Backend relay
2. Monitoring agent
3. Next.js frontend

### 1. Start the Backend

Open a terminal:

```bash
cd backend
npm install
node src/server.js
```

The backend runs on:

```text
http://localhost:4000
```

---

### 2. Start the Monitoring Agent

Open another terminal:

```bash
cd agent
npm install
node src/agent.js
```

The agent will:

- Load or generate its Machine ID
- Connect to the backend
- Send static CPU information
- Begin streaming CPU telemetry

Example:

```text
Starting CPU Monitor Agent...
Machine ID: <machine-id>
Backend: http://localhost:4000

Connected to backend
Static CPU information sent.

Telemetry sent | CPU: 24.31%
Telemetry sent | CPU: 31.82%
Telemetry sent | CPU: 18.47%
```

---

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs on:

```text
http://localhost:3000
```

Open it in a browser to view live CPU telemetry.

---

## Current Local Development Flow

During local development:

```text
Agent
http://localhost
       │
       ▼
Backend
http://localhost:4000
       │
       ▼
Frontend
http://localhost:3000
```

The frontend currently subscribes to a specific development Machine ID while the machine-pairing system is being developed.

---

## Planned Deployment Architecture

The intended deployment architecture is:

```text
User's Computer
      │
      ▼
Local Monitoring Agent
      │
      │ Internet / Socket.IO
      ▼
Hosted Backend Relay
      │
      ▼
Hosted Next.js Dashboard
```

The planned deployment model is:

```text
Monitoring Agent
    → runs locally on monitored machines

Backend
    → persistent Node.js hosting

Frontend
    → Next.js hosting
```

Before public deployment, authentication will be added so that Machine IDs alone cannot be used to access telemetry.

---

## Future Plans

Major planned improvements include:

- Complete removal of CPU collection from the backend
- Cache machine information for dashboards that connect after an agent
- Secure agent authentication
- Secure dashboard-to-machine authorization
- User-friendly machine registration and pairing
- Support for multiple monitored computers
- Historical CPU telemetry storage
- CPU temperature support where available
- Remote monitoring over the internet
- Containerization
- Cloud deployment
- Observability and alerting

---

## License

This project is currently intended for educational and development purposes.
