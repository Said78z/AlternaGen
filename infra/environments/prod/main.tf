module "base" {
  source = "../../modules/base"

  vpc_cidr           = "10.10.0.0/16"
  availability_zones = ["eu-west-1a", "eu-west-1b"]
  project_name       = "altergen"
  environment        = "prod"
}

module "compute" {
  source = "../../modules/compute"

  vpc_id         = module.base.vpc_id
  public_subnets = module.base.public_subnets
  project_name   = "altergen"
  environment    = "prod"
}

module "data" {
  source = "../../modules/data"

  vpc_id            = module.base.vpc_id
  private_subnets   = module.base.private_subnets
  app_sg_id         = module.compute.app_sg_id
  project_name      = "altergen"
  environment       = "prod"
  db_instance_class = "db.t3.small"
  db_name           = "altergen_prod"
  db_username       = "admin"
  db_password       = var.db_password
  db_allocated_storage = 50
}

variable "db_password" {
  sensitive = true
}
