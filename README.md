# CPU Monitor — Real-Time System Analytics Dashboard

A real-time CPU monitoring and observability project that streams system telemetry from a local machine to a web dashboard.

The project uses a lightweight Node.js monitoring agent to collect CPU telemetry, a Socket.IO backend to route telemetry between machines and dashboards, and a Next.js frontend to visualize the data in real time.

The architecture is designed so that the monitoring agent can eventually run on remote machines while the backend and dashboard are hosted separately.

---

## Architecture

```text
┌──────────────────────────────┐
│       Monitored Machine      │
│                              │
│       Node.js Agent          │
│   ┌──────────────────────┐   │
│   │ CPU telemetry        │   │
│   │ Static CPU info      │   │
│   │ Heartbeats           │   │
│   │ Persistent Machine ID│   │
│   └──────────┬───────────┘   │
└──────────────┼───────────────┘
               │
               │ Socket.IO
               ▼
┌──────────────────────────────┐
│        Backend Relay         │
│                              │
│  Node.js + Express           │
│  Socket.IO                   │
│                              │
│  • Machine rooms             │
│  • Telemetry routing         │
│  • Static CPU cache          │
│  • Machine status tracking   │
│  • Heartbeat monitoring      │
└──────────────┬───────────────┘
               │
               │ Socket.IO
               ▼
┌──────────────────────────────┐
│       Web Dashboard          │
│                              │
│  Next.js                     │
│  Tailwind CSS                │
│  Recharts                    │
│                              │
│  • Live CPU metrics          │
│  • Historical charts         │
│  • Machine pairing           │
│  • Online/offline status     │
└──────────────────────────────┘
```

The three components have intentionally separate responsibilities:

- **Agent** — collects system telemetry.
- **Backend** — routes and coordinates telemetry.
- **Frontend** — visualizes telemetry.

The backend does **not** collect CPU statistics from the machine it is running on.

---

## Features

### Real-Time CPU Monitoring

The monitoring agent currently collects:

- Overall CPU utilization
- Per-logical-processor utilization
- Average CPU clock speed
- Per-logical-processor clock speeds
- Top 3 CPU-consuming processes
- CPU manufacturer
- CPU model
- Physical core count
- Logical processor count
- Base clock speed
- Maximum clock speed reported by the operating system

Telemetry is streamed continuously through Socket.IO.

CPU temperature support is reserved for future development because availability varies by operating system and hardware.

---

### Monitoring Agent

The project contains a standalone Node.js monitoring agent.

The agent:

- Collects CPU telemetry using `systeminformation`
- Generates a persistent Machine ID
- Sends static CPU information when it connects
- Streams live CPU metrics
- Sends periodic heartbeats
- Automatically reconnects to the backend
- Resumes telemetry after reconnection

Each installation generates its own persistent UUID.

Example:

```text
Machine ID:
b5d24a59-a4fd-4ac9-8f1f-e6daf8b17193
```

The local Machine ID is stored in:

```text
agent/machine.json
```

This file is intentionally excluded from Git.

---

## Machine Pairing

The frontend does not contain a hard-coded Machine ID.

When opening the dashboard for the first time, the user is asked to enter the Machine ID displayed by the monitoring agent.

```text
Agent
  │
  │ displays Machine ID
  ▼
User enters Machine ID
  │
  ▼
Dashboard
  │
  │ dashboard_subscribe
  ▼
Backend
  │
  ▼
room:<machineId>
```

The selected Machine ID is stored in browser `localStorage`.

This means subsequent visits automatically reconnect to the previously selected machine.

The dashboard also provides a **Change Machine** option for selecting another machine.

When switching machines, telemetry belonging to the previous machine is cleared before subscribing to the new machine.

> Machine IDs currently provide routing and pairing only. They are not authentication credentials.

---

## Machine-Specific Telemetry Routing

Socket.IO rooms isolate telemetry between machines.

Each machine is assigned a room using:

```text
room:<machineId>
```

For example:

```text
Agent A ─────► room:AAA ─────► Dashboard A

Agent B ─────► room:BBB ─────► Dashboard B
```

An agent joins the room associated with its Machine ID.

A dashboard sends:

```text
dashboard_subscribe
```

with the selected Machine ID and joins the corresponding room.

This architecture allows the backend to route telemetry for multiple machines independently.

---

## Machine Online / Offline Detection

The system distinguishes between:

1. The browser being connected to the backend
2. The monitored machine actually being online

These are intentionally maintained as separate states.

### Heartbeats

The monitoring agent periodically sends:

```text
agent_heartbeat
```

to the backend.

The backend stores machine state containing:

```text
{
    status,
    lastSeen
}
```

The agent currently sends a heartbeat approximately every **5 seconds**.

The backend periodically checks machine timestamps and marks a machine offline if heartbeats have not been received within the configured timeout.

This helps detect silent failures such as:

- Network loss
- Wi-Fi disconnection
- Agent crashes
- Machine sleep
- Abrupt connectivity loss

Normal Socket.IO disconnects are also detected immediately.

---

## Dashboard Connection States

The dashboard can represent three different states:

```text
Live
Machine Offline
Disconnected
```

### Live

The browser is connected to the backend and the selected monitoring agent is online.

### Machine Offline

The browser is still connected to the backend, but the selected agent is offline.

### Disconnected

The browser has lost its connection to the backend.

When a machine goes offline, the dashboard does **not** erase its existing telemetry.

Instead:

- The last CPU values remain visible
- Existing graph history remains visible
- Static CPU information remains visible
- The last-update timestamp stops changing
- The status changes to `Machine Offline`

This prevents stale telemetry from being replaced with fake zero values while still making it clear that new data is no longer arriving.

---

## Static CPU Information Cache

Static CPU information does not need to be transmitted continuously.

When an agent connects, it sends its CPU hardware information once.

The backend caches this information using the Machine ID.

```text
machineId
    │
    ▼
Static CPU information
```

This solves both possible connection orders.

### Dashboard connects first

```text
Dashboard
   ↓
Agent connects
   ↓
Static information forwarded
```

### Agent connects first

```text
Agent
   ↓
Backend caches CPU information
   ↓
Dashboard connects later
   ↓
Cached information sent immediately
```

---

## Dashboard

The frontend is built using:

- Next.js
- React
- Tailwind CSS
- Recharts
- Socket.IO Client

The dashboard currently displays:

### CPU Usage Gauge

Displays current overall CPU utilization.

### CPU Usage History

Displays a rolling history of overall CPU load.

### Clock Speed History

Displays changes in average CPU frequency.

### Logical Processor Monitoring

Displays utilization and clock information for individual logical processors.

### Top Processes

Displays the processes currently consuming the most CPU.

### Static CPU Information

Displays hardware information such as:

- CPU manufacturer
- CPU model
- Physical cores
- Logical processors
- Base frequency
- Maximum reported frequency

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
│   │   └── server.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── components/
│   │       │   ├── Dashboard.js
│   │       │   ├── CpuGauge.js
│   │       │   ├── CpuUsageChart.js
│   │       │   ├── ClockSpeedChart.js
│   │       │   ├── LogicalProcessorChart.js
│   │       │   ├── ProcessList.js
│   │       │   └── StaticCpuInfo.js
│   │       │
│   │       ├── hooks/
│   │       │   └── useTelemetry.js
│   │       │
│   │       ├── globals.css
│   │       ├── layout.js
│   │       └── page.js
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# Running Locally

The project currently consists of three processes:

1. Backend
2. Monitoring Agent
3. Frontend

All three should be running during local development.

---

## 1. Start the Backend

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

Expected output:

```text
Backend server running on port 4000
```

---

## 2. Start the Monitoring Agent

Open another terminal:

```bash
cd agent
npm install
node src/agent.js
```

The agent will display its persistent Machine ID.

Example:

```text
Starting CPU Monitor Agent...
Machine ID: b5d24a59-a4fd-4ac9-8f1f-e6daf8b17193
Backend: http://localhost:4000
Connected to backend: ...
```

Keep this terminal running while monitoring the machine.

---

## 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

On the first visit, enter the Machine ID displayed by the monitoring agent.

The browser remembers the selected machine for future visits.

---

# Socket.IO Event Flow

The main events currently used by the system are:

```text
Agent → Backend

agent_cpu_static
agent_metrics_update
agent_heartbeat


Dashboard → Backend

dashboard_subscribe


Backend → Dashboard

cpu_static
metrics_update
machine_status_change
```

A simplified flow:

```text
Agent
  │
  ├── agent_cpu_static
  ├── agent_metrics_update
  └── agent_heartbeat
          │
          ▼
       Backend
          │
          ├── machine room
          ├── static cache
          └── status tracking
          │
          ▼
       Dashboard
          │
          ├── cpu_static
          ├── metrics_update
          └── machine_status_change
```

---

# Current Development Status

## Completed

- [x] Standalone Node.js monitoring agent
- [x] Real CPU telemetry collection
- [x] Overall CPU utilization
- [x] Per-logical-processor utilization
- [x] CPU clock monitoring
- [x] Top CPU-consuming processes
- [x] Static CPU hardware information
- [x] Persistent Machine IDs
- [x] Socket.IO Agent → Backend communication
- [x] Socket.IO Backend → Dashboard communication
- [x] Machine-specific Socket.IO rooms
- [x] Dashboard machine subscriptions
- [x] Per-machine static CPU caching
- [x] Agent automatic reconnection
- [x] Dashboard automatic re-subscription
- [x] Machine heartbeat system
- [x] Online/offline machine tracking
- [x] Last-seen tracking
- [x] Silent-disconnection timeout detection
- [x] Live/offline/disconnected dashboard states
- [x] Preservation of last-known telemetry while offline
- [x] Dynamic Machine ID selection
- [x] Browser persistence using localStorage
- [x] Change Machine functionality
- [x] Removal of backend-local CPU collection
- [x] Separation of Agent, Backend, and Frontend responsibilities
- [x] Real-time Next.js dashboard
- [x] Rolling telemetry charts
- [x] End-to-end local integration testing

---

# Current Limitations

The project is currently intended for local development and experimentation.

### No Authentication

Authentication and authorization have intentionally not been implemented yet.

Machine IDs are currently used for routing, not security.

A user who knows another Machine ID could potentially attempt to subscribe to that machine's telemetry.

For this reason, the current version should **not be treated as a secure public multi-user monitoring service**.

### In-Memory Backend State

Machine status and static CPU caches currently exist in backend memory.

Restarting the backend clears this temporary state.

Agents automatically reconnect and repopulate their state afterward.

### No Historical Database

Telemetry is currently streamed live and maintained temporarily in the browser.

Long-term historical metrics are not yet persisted.

### CPU Temperature

Temperature collection is currently disabled because support depends on operating system and hardware sensor availability.

---

# Planned Development

Future phases may include:

- Production deployment
- Environment-based backend/frontend configuration
- Production CORS configuration
- Persistent telemetry storage
- Machine naming
- Improved machine pairing
- Multi-machine dashboard selection
- Authentication and authorization
- Agent authentication
- Prometheus integration
- Grafana dashboards
- Alerting
- Slack or Discord notifications
- Health endpoints
- Structured logging
- Docker
- CI/CD with GitHub Actions
- CPU temperature monitoring where supported

Authentication is intentionally **not part of the current implementation** and may be added in a later phase.

---

# Deployment Architecture

The intended production architecture is:

```text
User's Computer
      │
      ▼
Monitoring Agent
      │
      │ Internet / Socket.IO
      ▼
Hosted Backend
      │
      │ Socket.IO
      ▼
Hosted Next.js Dashboard
```

A persistent Node.js hosting platform is required for the Socket.IO backend.

The frontend can be deployed independently from the backend.

The monitoring agent remains on the machine being monitored because it requires access to local system information.

---

# Design Principles

This project follows several architectural principles:

### Separation of Responsibilities

Telemetry collection, routing, and visualization are handled by separate components.

### Real Telemetry Only

The dashboard does not generate fake or random CPU data.

### Machine Isolation

Machine IDs and Socket.IO rooms keep telemetry streams separated.

### Graceful Failure

A machine going offline does not destroy its last-known telemetry.

### Non-Overlapping Polling

Telemetry collection uses recursive scheduling so a new collection cycle does not begin before the previous collection operation finishes.

### Extensible Architecture

The Agent → Backend → Dashboard model is designed to support future remote monitoring, persistent storage, observability tooling, and multiple monitored machines.

---

# Tech Stack

**Agent**

- Node.js
- systeminformation
- Socket.IO Client

**Backend**

- Node.js
- Express
- Socket.IO

**Frontend**

- Next.js
- React
- Tailwind CSS
- Recharts
- Socket.IO Client

**Development**

- Git
- GitHub
- VS Code

---

# License

This project is currently intended for educational and portfolio purposes.
