# Example Terraform variables file
# Copy this to production.tfvars and fill in your values
# DO NOT commit production.tfvars to version control

aws_region = "eu-west-1"
environment = "production"
project_name = "altergen"

# Database Configuration
db_instance_class = "db.t3.micro"
db_name = "altergen"
db_username = "altergen_admin"
db_password = "CHANGE_ME_TO_SECURE_PASSWORD"
db_allocated_storage = 20

# Compute Configuration
container_cpu = 256
container_memory = 512
desired_count = 2

# Networking
vpc_cidr = "10.0.0.0/16"
availability_zones = ["eu-west-1a", "eu-west-1b"]
