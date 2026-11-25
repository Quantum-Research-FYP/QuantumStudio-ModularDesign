# Unified Modular Monolith Quantum Computing Platform — Run Commands

This document provides complete instructions for starting and testing the unified Modular Monolith application.

---

## 1. Local Development (Multi-Service Unified Orchestration)

The platform consists of three coordinated services working together:

### 1.1 Start the Shared Simulation & QML Service (Port 8000)
```bash
cd simulation-service
# Activate virtual environment if configured
# Windows: .venv\Scripts\activate  |  macOS/Linux: source .venv/bin/activate
python -m uvicorn main:app --port 8000 --reload
```

### 1.2 Start the Platform Gateway & Core Server (Port 3001)
```bash
cd server
npm run dev
```

### 1.3 Start the Unified Frontend (Port 5173)
```bash
cd client
npm run dev
```

The unified frontend will be available at: `http://localhost:5173`
- Quantum Studio Builder: `http://localhost:5173/builder`
- Quantum Studio IDE: `http://localhost:5173/ide`
- Quantum Machine Learning Lab: `http://localhost:5173/qml`
- Execution History & Dashboard: `http://localhost:5173/results`

---

## 2. Docker Multi-Container Startup

Run the entire consolidated platform with Docker Compose:

```bash
docker-compose up --build -d
```

Services started:
- `mongo`: Port 27017 (Persistent MongoDB 7)
- `simulation`: Port 8000 (FastAPI Shared Simulation & QML Engine)
- `server`: Port 3001 (Node.js/Express Platform Gateway & Job Runner)
- `client`: Port 80 (Unified React 18 Production App)

---

## 3. Automated Validation & Test Suite

### 3.1 Run All Integration & Concurrency Scenarios (1-7)
```bash
python simulation-service/test_integration_concurrency.py
```
This tests:
1. Health & Discovery Endpoints (`/health`, `/api/health`, `/api/qml/health`)
2. Quantum Studio Execution (OpenQASM 2/3, Python mode, Transpile trace)
3. QML Workflows (Data generation, feature maps, ansatz search, quantum kernels, VQC training, barren plateau, experiments, reproducibility package)
4. All 7 Concurrency Scenarios:
   - Scenario 1: Multiple simultaneous Quantum Studio circuit submissions
   - Scenario 2: Multiple concurrent QML circuit evaluations
   - Scenario 3: Cross-module simultaneous submission (Quantum Studio + QML)
   - Scenario 4: Simulator concurrency control under load (threading semaphore)
   - Scenario 5: Hardware request serialization & queuing safety
   - Scenario 6: Execution isolation (failed job does not interrupt valid job)
   - Scenario 7: Execution result routing & integrity

### 3.2 Run Client Unit Tests
```bash
cd client
npm run test
```

### 3.3 Verify Production Builds
```bash
cd client
npm run build

cd ../server
npm run build
```
