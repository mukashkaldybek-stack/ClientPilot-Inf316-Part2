# ClientPilot — Production Deployment & Infrastructure Guide (`DEPLOYMENT.md`)

This document outlines the deployment architecture, configuration parameters, container management, and continuous delivery pipelines for **ClientPilot**.

---

## 1. Deployment Overview & Links

* **Live Deployment URL**: **Not deployed yet** *(Infrastructure-as-Code templates and CI/CD pipelines are fully prepared and tested)*
* **GitHub Repository**: [https://github.com/mukashkaldybek-stack/ClientPilot-Inf316-Part2](https://github.com/mukashkaldybek-stack/ClientPilot-Inf316-Part2)
* **API Documentation**: [`docs/openapi.yml`](docs/openapi.yml)
* **Primary Hosting Architecture**: AWS Free-Tier (EC2 `t2.micro` + RDS PostgreSQL `db.t3.micro`) & Multi-Container Docker Compose

---

## 2. Deployment Architecture

ClientPilot utilizes a multi-stage, unified runtime architecture designed for zero SSR overhead and resource efficiency:

```
[ Client Web Browser / Mobile ]
               |
         HTTPS (Port 443) / HTTP (Port 80 / 3000)
               v
+--------------------------------------------------------------+
| AWS EC2 t2.micro Host (Docker Engine)                        |
|                                                              |
|  +--------------------------------------------------------+  |
|  | Container: clientpilot-app                             |  |
|  |                                                        |  |
|  |  [ Static Asset Server (sirv) ]                        |  |
|  |     Serves pre-rendered Next.js SPA on /               |  |
|  |                                                        |  |
|  |  [ Hono API Gateway (Node.js runtime) ]                |  |
|  |     Handles /api/* requests with type-safe routing     |  |
|  +--------------------------------------------------------+  |
|               |                                              |
+---------------+----------------------------------------------+
                | Private VPC Connection (Port 5432)
                v
+--------------------------------------------------------------+
| AWS RDS db.t3.micro (PostgreSQL 15 - Free Tier)              |
|  Database: clientpilot                                       |
|  Security Group: Ingress restricted strictly to EC2 host    |
+--------------------------------------------------------------+
```

---

## 3. Environment Variables Configuration

ClientPilot relies on environment variables for runtime port binding and database connectivity. Production deployments should configure these secrets securely (e.g. AWS Systems Manager Parameter Store or GitHub Actions Secrets):

| Variable | Required | Default | Description | Example |
| :--- | :---: | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection URI | `postgresql://postgres:password@rds-host:5432/clientpilot?schema=public` |
| `PORT` | No | `3000` | Port on which the unified server listens | `3000` |
| `NODE_ENV` | No | `production` | Node execution environment | `production` |
| `USE_IN_MEMORY`| No | `false` | Fallback flag for isolated local/testing mode | `false` |

### Production `.env` Template
```ini
DATABASE_URL="postgresql://postgres:ClientPilot2026Secure!@db-host:5432/clientpilot?schema=public"
PORT=3000
NODE_ENV=production
USE_IN_MEMORY=false
```

---

## 4. Database Configuration & Prisma Migrations

ClientPilot uses **Prisma ORM** with **PostgreSQL 15**.

### Applying Migrations in Production
Before launching the application container, ensure database schemas are initialized:

```bash
# Push schema directly to target database
npx prisma db push

# Alternatively, apply declarative migrations
npx prisma migrate deploy

# Verify schema integrity
npx prisma validate
```

---

## 5. Docker Deployment

### Multi-Stage Single Dockerfile
The provided [`Dockerfile`](Dockerfile) bundles the static Next.js export and the compiled Hono backend into a lightweight Node.js 20 Alpine container image.

#### 1. Build Production Docker Image
```bash
docker build -t clientpilot:latest .
```

#### 2. Run Single Container (Standalone / In-Memory Mode)
```bash
docker run -d \
  --name clientpilot \
  -p 3000:3000 \
  -e USE_IN_MEMORY=true \
  clientpilot:latest
```

#### 3. Run Production Stack with PostgreSQL via Docker Compose
The [`docker-compose.yml`](docker-compose.yml) orchestrates both the database and the unified application service:

```bash
# Start all services in background
docker compose up -d

# Verify container health
docker compose ps

# Inspect logs
docker compose logs -f app

# Tear down stack and preserve volumes
docker compose down
```

---

## 6. AWS Free-Tier CloudFormation Deployment

The repository includes a 100% Free-Tier eligible CloudFormation blueprint located at [`infra/aws.yml`](infra/aws.yml).

### Resources Provisioned
* **VPC**: 10.0.0.0/16 with DNS Hostnames enabled
* **Subnets**: 2 Public Subnets in distinct Availability Zones
* **Internet Gateway & Route Tables**: Public internet access for HTTP/HTTPS/SSH
* **Security Groups**:
  * `AppSecurityGroup`: Allows Inbound 80 (HTTP), 443 (HTTPS), 22 (SSH), and 3000
  * `DBSecurityGroup`: Allows PostgreSQL 5432 restricted solely to `AppSecurityGroup`
* **Compute**: EC2 `t2.micro` running Amazon Linux 2023 with automated Docker & Docker Compose setup via `UserData`
* **Database**: RDS PostgreSQL `db.t3.micro` with 20GB gp2 storage

### Deployment Steps (AWS CLI)

```bash
# 1. Validate template syntax
aws cloudformation validate-template --template-body file://infra/aws.yml

# 2. Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name clientpilot-production \
  --template-body file://infra/aws.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=clientpilot-prod \
               ParameterKey=DBUser,ParameterValue=postgres \
               ParameterKey=DBPassword,ParameterValue=ClientPilot2026Secure! \
  --capabilities CAPABILITY_IAM

# 3. Wait for creation completion
aws cloudformation wait stack-create-complete --stack-name clientpilot-production

# 4. Fetch Public IP and RDS Endpoint
aws cloudformation describe-stacks \
  --stack-name clientpilot-production \
  --query "Stacks[0].Outputs"
```

---

## 7. Alternative: Google Cloud Platform (GCP) Deployment

### Option A: GCP Compute Engine (VM)
1. Launch an `e2-micro` instance (Free Tier eligible in us-central1, us-east1, us-west1).
2. Install Docker and Docker Compose via SSH.
3. Clone repository and run `docker compose up -d`.

### Option B: Google Cloud Run (Serverless Container)
```bash
# Build container using Google Cloud Build
gcloud builds submit --tag gcr.io/PROJECT_ID/clientpilot

# Deploy container to Cloud Run
gcloud run deploy clientpilot \
  --image gcr.io/PROJECT_ID/clientpilot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://...",PORT=3000
```

---

## 8. Continuous Integration & Continuous Delivery (CI/CD)

The GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) provides an end-to-end automated pipeline triggered on every commit to `main` and Pull Requests:

1. **Job: `test-and-validate`**:
   - Launches an ephemeral PostgreSQL 15 container.
   - Installs dependencies with `npm ci`.
   - Validates Prisma schema (`npx prisma validate`).
   - Executes Vitest unit and integration test suite (`npm run test`).
2. **Job: `build-and-e2e`**:
   - Compiles static export frontend and Hono backend (`npm run build`).
   - Runs Playwright end-to-end browser test suite (`npm run test:e2e`).
   - Builds multi-stage Docker image and executes Docker Compose smoke test with healthcheck probe.
3. **Job: `deploy`**:
   - Automatically executes upon successful merge into the `main` branch.
   - Deploys container image to production infrastructure.
