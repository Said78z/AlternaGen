# AlternaGen Infrastructure

This directory contains Infrastructure as Code (IaC) using Terraform to provision and manage AlternaGen's cloud infrastructure.

## ⚠️ Important

**DO NOT** run `terraform apply` without explicit approval. These files are provided as a skeleton for infrastructure planning.

## Architecture

The infrastructure includes:
- **Managed PostgreSQL Database** - Production-ready database with backups
- **Container Deployment Platform** - Infrastructure to run Docker containers
- **Networking** - VPC, subnets, security groups
- **Monitoring** - Basic logging and metrics

## Prerequisites

- Terraform >= 1.5.0
- Cloud provider CLI configured (AWS, GCP, or Azure)
- Appropriate cloud credentials

## Usage

### Initialize Terraform

```bash
cd infra
terraform init
```

### Plan Changes

```bash
terraform plan -var-file="production.tfvars"
```

### Apply Changes (REQUIRES APPROVAL)

```bash
terraform apply -var-file="production.tfvars"
```

### Destroy Infrastructure (DANGEROUS)

```bash
terraform destroy -var-file="production.tfvars"
```

## Configuration

1. Copy `example.tfvars` to `production.tfvars`
2. Fill in your specific values
3. Review the plan carefully before applying

## State Management

Terraform state should be stored remotely (S3, GCS, or Azure Blob Storage) for production use. Configure backend in `backend.tf`.

## Security

- Never commit `.tfvars` files with real credentials
- Use secrets management for sensitive values
- Review security groups and IAM policies carefully
- Enable encryption at rest and in transit

## Cost Estimation

Before applying, use `terraform plan` and cloud provider cost calculators to estimate monthly costs.

## Support

For infrastructure questions, contact the DevOps team.
