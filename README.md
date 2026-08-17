# Task Manager (DevSecOps Demo)

This is a comprehensive full-stack DevSecOps demonstration project, built to showcase how to integrate security into every stage of the software development lifecycle (SDLC) — from code to cloud.

## 🏗️ Architecture

*   **Frontend**: React + Vite + Tailwind CSS v4
    *   *Security Features*: In-memory JWT access tokens (mitigates XSS), Axios interceptors for transparent refresh, Nginx unprivileged container, Strict OWASP Security Headers (CSP, X-Frame-Options).
*   **Backend**: FastAPI (Python 3.12) + PostgreSQL + SQLAlchemy + Alembic
    *   *Security Features*: Constant-time password verification (mitigates enumeration), UUID primary keys (mitigates IDOR), bcrypt hashing (work factor 12), strict Pydantic validation boundaries, separated ORM models from response schemas.
*   **Infrastructure**: Azure (Terraform)
    *   *Resources*: Azure Container Apps (serverless, scale-to-zero), Azure Database for PostgreSQL (Flexible Server), Azure Key Vault, Azure Container Registry.
    *   *Security Features*: User Assigned Managed Identities (no hardcoded credentials), Azure Key Vault RBAC for dynamic secrets injection, OIDC authentication for GitHub Actions.

## 🔒 DevSecOps Pipeline

The project features a two-stage GitHub Actions pipeline (`ci.yml` and `cd.yml`) implementing a true "Shift-Left" methodology.

### 1. Continuous Integration (CI) - `ci.yml`
Fails the build if any of the following checks do not pass:
*   **SAST (Static Application Security Testing)**: Uses `Semgrep` to scan the source code for complex security anti-patterns (e.g., SQLi, XSS).
*   **Secret Scanning**: Uses `Gitleaks` across the commit history to ensure no API keys or passwords are leaked.
*   **SCA (Software Composition Analysis)**: Uses `pip-audit` and `npm audit` to check all third-party dependencies against vulnerability databases.
*   **Container Scanning**: Uses `Trivy` to scan the compiled Docker images for OS-level vulnerabilities (Alpine/Debian packages).

### 2. Continuous Deployment (CD) - `cd.yml`
*   **OIDC Authentication**: Authenticates to Azure without storing long-lived static credentials in GitHub.
*   **GitOps Infrastructure**: Runs `terraform apply` automatically to provision/update the environment.
*   **Immutable Deployments**: Builds and tags Docker images with the Git commit SHA, deploying them to Azure Container Apps.
*   **DAST (Dynamic Application Security Testing)**: Runs an **OWASP ZAP** baseline scan against the live production URL to catch runtime misconfigurations, generating a report artifact.

## 🚀 Local Development

### Prerequisites
*   [Docker Desktop](https://www.docker.com/) or Docker Compose
*   Node.js 20+
*   Python 3.12+ (and `uv` package manager)

### Quick Start (Docker Compose)
The easiest way to run the full stack locally is via Docker Compose, which sets up the database, runs migrations, and starts the frontend and backend with hot-reloading.

1.  Copy the environment file:
    ```bash
    cp backend/.env.example backend/.env
    ```
2.  Start the stack:
    ```bash
    docker-compose up --build
    ```
3.  Access the app:
    *   Frontend: [http://localhost:5173](http://localhost:5173)
    *   Backend API: [http://localhost:8000](http://localhost:8000)

## ☁️ Azure Deployment

To deploy this project to your own Azure subscription, follow these steps to set up the OIDC federation:

1.  Create a Resource Group and Storage Account in Azure for Terraform remote state.
2.  Create a Service Principal in Microsoft Entra ID and grant it `Contributor` access to your subscription.
3.  Create a Federated Credential for the Service Principal, linking it to your GitHub repository (`repo:<username>/task-manager:ref:refs/heads/main`).
4.  Add the following secrets to your GitHub Repository:
    *   `AZURE_CLIENT_ID`
    *   `AZURE_TENANT_ID`
    *   `AZURE_SUBSCRIPTION_ID`
    *   `TF_STATE_RG` (The resource group for terraform state)
    *   `TF_STATE_SA` (The storage account name for terraform state)
5.  Push to the `main` branch. The GitHub Actions CD pipeline will automatically deploy the infrastructure and application.
