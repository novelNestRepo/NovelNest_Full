# NovelNest Northflank Deployment Guide

## Prerequisites
- Northflank account
- Git repository connected to Northflank

## Deployment Steps

1. **Connect Repository**: Link your Git repository to Northflank
2. **Create Service**: Create a new build service
3. **Configure Build**:
   - Build Type: Dockerfile
   - Dockerfile Path: `/Dockerfile`
   - Build Context: `/`
4. **Set Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
   - `NODE_ENV`: `production`
5. **Configure Resources**:
   - CPU: 0.2 vCPU
   - Memory: 512 MB
   - Port: 3000

## Environment Variables Required
- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- `NODE_ENV` - Set to "production"

## Build Configuration
The project uses:
- Node.js 18 Alpine
- Next.js standalone output
- Multi-stage Docker build for optimization
- Port 3000 for HTTP traffic

## Auto-scaling
- Min replicas: 1
- Max replicas: 3
- CPU target: 70%
- Memory target: 80%