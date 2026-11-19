# Cloud Deployment Configurations for CS Odyssey

CS Odyssey is self-contained (Next.js standalone server + Python 3 + GCC sandbox + local atomic JSON storage) and can run in any container cloud without an external database.

## Included Cloud Config Files

| Platform | Config File | Persistence Target | Health Probe |
| :--- | :--- | :--- | :--- |
| **Docker / Any Cloud VM** | `Dockerfile`, `compose.yaml` | Named volume `cs_odyssey_data -> /app/.data` | `GET /api/health` |
| **Google Cloud Run** | `cloud/cloudrun-service.yaml` | Container `/app/.data` (or Cloud Storage FUSE mount) | `GET /api/health` |
| **Kubernetes (GKE / EKS / AKS / k3s)** | `cloud/k8s-deployment.yaml` | 1Gi `PersistentVolumeClaim` (`cs-odyssey-data`) | `GET /api/health` |
| **Render** | `render.yaml` | 1GB Render Disk at `/app/.data` | `GET /api/health` |
| **Fly.io** | `fly.toml` | Fly Volume `cs_odyssey_data` at `/app/.data` | `GET /api/health` |
| **Railway** | `railway.toml` | Ephemeral or Railway Volume at `/app/.data` | `GET /api/health` |

---

## Quick Deploy Commands

### 1. Docker Compose (AWS EC2, DigitalOcean, Hetzner, Linode, Home Server)
```bash
cp .env.example .env.local
# Edit .env.local if you want GEMINI_API_KEY or GitHub OAuth
docker compose --env-file .env.local up -d --build
```

### 2. Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/cs-odyssey:latest
# Update image project ID in cloud/cloudrun-service.yaml, then:
gcloud run services replace cloud/cloudrun-service.yaml --region=europe-west1
```
Or source-deploy directly from the repository root:
```bash
gcloud run deploy cs-odyssey --source . --region=europe-west1 --port=3000 --allow-unauthenticated
```

### 3. Kubernetes (GKE / EKS / AKS / k3s)
```bash
# Build & push image to your registry, update image in cloud/k8s-deployment.yaml
kubectl apply -f cloud/k8s-deployment.yaml
kubectl port-forward svc/cs-odyssey 3000:80
```

### 4. Fly.io
```bash
fly launch --no-deploy
fly volumes create cs_odyssey_data --size 1
fly secrets set GEMINI_API_KEY="your-key-optional"
fly deploy
```

### 5. Render & Railway
- **Render**: Connect your repository and Render automatically detects `render.yaml`.
- **Railway**: Connect your repository and Railway automatically builds via `railway.toml` + `Dockerfile`.

---

## Environment Variables Reference

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `3000` | HTTP server port |
| `CS_ODYSSEY_DATA_DIR` | No | `.data` (`/app/.data` in Docker) | Directory storing progress & daily mentor quota JSON |
| `APP_URL` | Optional | Request origin / `http://localhost:3000` | Public base URL for GitHub OAuth callbacks |
| `GEMINI_API_KEY` | Optional | Unset (offline engine active) | Server-side key for live Gemini mentor & Search grounding |
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | Optional | Unset | Custom OpenAI-compatible or Ollama server endpoint |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional | Unset | GitHub OAuth progress sync |
