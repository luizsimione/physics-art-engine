# Production Deployment Guide

Complete guide for deploying the Physics Art Engine to production environments.

## Prerequisites

- AWS Account with appropriate permissions
- Docker installed locally
- kubectl (for Kubernetes deployments)
- Terraform (optional, for infrastructure as code)
-GitHub repository with Actions enabled

## Option 1: AWS ECS (Elastic Container Service)

### 1. Push Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name physics-art-backend
aws ecr create-repository --repository-name physics-art-frontend

# Build and push backend
cd backend
docker build -t physics-art-backend .
docker tag physics-art-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/physics-art-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/physics-art-backend:latest
```

### 2. Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name physics-art-cluster

# Create task definition (see ecs-task-definition.json)
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster physics-art-cluster \
  --service-name backend \
  --task-definition physics-art-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### 3. Setup RDS and ElastiCache

```bash
# Create RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier physics-art-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14 \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 20

# Create ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id physics-art-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

## Option 2: AWS EKS (Kubernetes)

### 1. Create EKS Cluster

```bash
# Create cluster
eksctl create cluster \
  --name physics-art \
  --region us-east-1 \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 4 \
  --node-type t3.medium

# Configure kubectl
aws eks update-kubeconfig --name physics-art --region us-east-1
```

### 2. Deploy to Kubernetes

```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n physics-art
kubectl get services -n physics-art
```

## Option 3: Docker Compose on EC2

### 1. Launch EC2 Instance

```bash
# Launch t3.medium instance
aws ec2 run-instances \
  --image-id ami-xxx \
  --instance-type t3.medium \
  --key-name your-key \
  --security-groups physics-art-sg \
  --user-data file://user-data.sh
```

### 2. Deploy with Docker Compose

```bash
# SSH to instance
ssh -i your-key.pem ec2-user@<public-ip>

# Clone repository
git clone https://github.com/luizsimione/physics-art-engine.git
cd physics-art-engine

# Build C++ simulation
cd simulation-engine
g++ -std=c++17 -O3 -I./include -o sim src/main.cpp src/simulation.cpp
cd ..

# Start services
docker compose up -d

# Check logs
docker compose logs -f
```

## GitHub Actions Secrets

Add these secrets to your GitHub repository (Settings → Secrets):

```
AWS_ACCESS_KEY_ID           # AWS access key
AWS_SECRET_ACCESS_KEY       # AWS secret key
ECR_REGISTRY                # ECR registry URL
DB_PASSWORD                 # Production database password
REDIS_PASSWORD              # Production Redis password
```

## Environment Variables

### Production `.env`

```bash
# Application
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/physics_art
DB_HOST=${RDS_ENDPOINT}
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=physics_art

# Redis
REDIS_HOST=${ELASTICACHE_ENDPOINT}
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# Simulation
SIMULATION_BINARY_PATH=/app/simulation-engine/sim
SIMULATION_OUTPUT_DIR=/app/output

# CORS
CORS_ORIGIN=https://physics-art.example.com

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
DATADOG_API_KEY=${DATADOG_API_KEY}
```

## SSL/TLS Configuration

### Using AWS Certificate Manager

```bash
# Request certificate
aws acm request-certificate \
  --domain-name physics-art.example.com \
  --domain-name api.physics-art.example.com \
  --validation-method DNS

# Validate via DNS
# Add CNAME records provided by ACM to your DNS

# Attach to load balancer
aws elbv2 create-listener \
  --load-balancer-arn ${LB_ARN} \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=${CERT_ARN} \
  --default-actions Type=forward,TargetGroupArn=${TG_ARN}
```

## Monitoring Setup

### CloudWatch Logs

```bash
# Create log group
aws logs create-log-group --log-group-name /physics-art/backend

# Configure ECS to send logs
# Add to task definition:
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/physics-art/backend",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

### CloudWatch Alarms

```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name physics-art-cpu-high \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --period 300 \
  --statistic Average \
  --threshold 80 \
  --alarm-actions ${SNS_TOPIC_ARN}

# Error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name physics-art-error-rate \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --period 60 \
  --statistic Sum \
  --threshold 10 \
  --alarm-actions ${SNS_TOPIC_ARN}
```

## Backup Strategy

### Database Backups

```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier physics-art-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"

# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier physics-art-db \
  --db-snapshot-identifier physics-art-snapshot-$(date +%Y%m%d)
```

### Redis Backups

```bash
# Enable automatic snapshots
aws elasticache modify-cache-cluster \
  --cache-cluster-id physics-art-redis \
  --snapshot-retention-limit 7 \
  --snapshot-window "03:00-05:00"
```

## Scaling Configuration

### Auto Scaling

```bash
# Create scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/physics-art-cluster/backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/physics-art-cluster/backend \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Health Checks

### Application Load Balancer

```bash
# Create target group with health check
aws elbv2 create-target-group \
  --name physics-art-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id ${VPC_ID} \
  --health-check-protocol HTTP \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

## Rollback Procedure

### ECS Deployment Rollback

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix physics-art-backend

# Update service to previous version
aws ecs update-service \
  --cluster physics-art-cluster \
  --service backend \
  --task-definition physics-art-backend:previous-version
```

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/backend -n physics-art

# Rollback to previous version
kubectl rollout undo deployment/backend -n physics-art

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n physics-art
```

## Cost Optimization

### Recommended Instance Sizes

**Development:**
- EC2: t3.small ($0.02/hour)
- RDS: db.t3.micro ($0.017/hour)
- Redis: cache.t3.micro ($0.017/hour)
- **Total: ~$40/month**

**Production (Low Traffic):**
- ECS: 2× t3.medium ($0.04/hour each)
- RDS: db.t3.small ($0.034/hour)
- Redis: cache.t3.small ($0.034/hour)
- **Total: ~$150/month**

**Production (High Traffic):**
- ECS: 4× t3.large ($0.08/hour each)
- RDS: db.t3.medium ($0.07/hour)
- Redis: cache.t3.medium ($0.07/hour)
- **Total: ~$400/month**

### Savings Tips

1. **Use Reserved Instances** - 40% savings for 1-year commitment
2. **Use Spot Instances** - 70% savings for fault-tolerant workloads
3. **S3 Intelligent Tiering** - Automatic cost optimization for storage
4. **CloudFront CDN** - Reduce bandwidth costs for frontend
5. **Cleanup Old Resources** - Delete unused snapshots, images, volumes

## Disaster Recovery

### Backup Plan

- **Database**: Daily automated snapshots (7-day retention)
- **Redis**: Daily snapshots (7-day retention)
- **Application**: Images stored in ECR with versioning
- **Configuration**: Infrastructure as Code (Terraform) in Git

### Recovery Time Objective (RTO)

- Database restore: ~15 minutes
- Application redeployment: ~10 minutes
- Total: **~30 minutes**

### Recovery Point Objective (RPO)

- Database: Maximum 24 hours (last automated backup)
- For critical workloads, enable continuous backup (5-minute RPO)

## Troubleshooting

### Common Issues

**High CPU Usage:**
```bash
# Check running tasks
kubectl top pods -n physics-art

# Scale up
kubectl scale deployment backend --replicas=4 -n physics-art
```

**Database Connection Errors:**
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids ${SG_ID}

# Verify connection from ECS
aws ecs execute-command \
  --cluster physics-art-cluster \
  --task ${TASK_ID} \
  --container backend \
  --interactive \
  --command "/bin/sh"
```

**Job Queue Stuck:**
```bash
# Check Redis connection
redis-cli -h ${REDIS_ENDPOINT} ping

# View queue status
# Access backend container and run
npm run queue:status
```

## Security Checklist

- [ ] All secrets in AWS Secrets Manager
- [ ] Security groups properly configured
- [ ] IAM roles with least privilege
- [ ] SSL/TLS enabled
- [ ] VPC properly configured with private subnets
- [ ] Database not publicly accessible
- [ ] WAF enabled on ALB
- [ ] CloudTrail logging enabled
- [ ] GuardDuty enabled
- [ ] Regular security updates

## Next Steps After Deployment

1. **Monitor Performance** - Set up dashboards in CloudWatch/DataDog
2. **Load Testing** - Use k6 or Locust to test at scale
3. **Optimize Costs** - Analyze with AWS Cost Explorer
4. **Document Runbooks** - SOPs for common operations
5. **Set Up Alerts** - PagerDuty/Opsgenie for critical issues
6. **Regular Updates** - Keep dependencies and images updated
7. **Backup Testing** - Regularly test restore procedures

---

**For questions or issues, open a GitHub issue or contact the DevOps team.**
