# 🛡️ Compliance Roadmap: CERT-FR & SecNumCloud

This document outlines the security measures implemented and planned to align AlternaGen with French security standards (**CERT-FR**) and **SecNumCloud** (Sovereign Cloud) regulations.

## 1. Sovereignty & Hosting
- **Status**: 🟢 Planned
- **Action**: Deployment to **SecNumCloud** qualified providers (e.g., OVHcloud SecNumCloud regions, Outscale).
- **Control**: Data must remain within the EU/France and be protected from extraterritorial laws (Cloud Act).

## 2. Infrastructure Hardening (CERT-FR)
- **Status**: 🟠 In Progress
- **Measures**:
    - [x] **Non-Root Containers**: All services run as a non-privileged user (defined in Dockerfiles).
    - [x] **Capabilities Drop**: Dropped all Linux capabilities by default in `docker-compose.yml`.
    - [x] **No New Privileges**: Prevent containers from gaining new privileges.
    - [ ] **Read-Only RootFS**: Mount application filesystems as read-only.
    - [ ] **AppArmor/Seccomp**: Custom profiles for API and Database.

## 3. Network Isolation
- **Status**: 🟢 Implemented
- **Measures**:
    - **Internal Network**: Database and replicas communicate on a strictly internal network (`altergen-internal`).
    - **No Exposed Database**: Only the API can access the primary database. Ports 5432 is NOT exposed on the host in production.
    - **DMZ Strategy**: Frontend (when active) and API are the only entry points via an encrypted Reverse Proxy.

## 4. Encryption & Secrets (SecNumCloud Requirements)
- **Status**: 🟠 In Progress
- **Measures**:
    - [x] **TLS 1.2/1.3 Only**: Mandatory encryption for all external traffic.
    - [ ] **Disk Encryption**: LUKS or provider-managed encryption for database volumes.
    - [ ] **Vault Integration**: Transition from `.env` to **HashiCorp Vault** for dynamic secrets management.

## 5. Monitoring & Audit (LPM/CERT-FR)
- **Status**: 🟠 In Progress
- **Measures**:
    - [x] **Centralized Metrics**: Prometheus/Grafana stack.
    - [ ] **Immutable Logs**: Forwarding logs to a separate, write-once storage for forensic analysis.
    - [ ] **Intrusion Detection**: Implementation of Fail2Ban or a sovereign WAF.

## 6. CI/CD Security
- **Status**: 🟢 Implemented
- **Measures**:
    - [x] **Vulnerability Scanning**: Trivy scanning on every build (CRITICAL/HIGH blocking).
    - [x] **Dependency Audit**: `npm audit` integrated into CI.
    - [ ] **Image Signing**: Sign Docker images with Cosign.

---
*Last Updated: 2026-02-03*
