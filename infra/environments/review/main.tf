module "base" {
  source = "../../modules/base"

  vpc_cidr           = "10.40.0.0/16"
  availability_zones = ["eu-west-1a", "eu-west-1b"]
  project_name       = "altergen"
  environment        = "review"
}

module "compute" {
  source = "../../modules/compute"

  vpc_id         = module.base.vpc_id
  public_subnets = module.base.public_subnets
  project_name   = "altergen"
  environment    = "review"
}

module "data" {
  source = "../../modules/data"

  vpc_id            = module.base.vpc_id
  private_subnets   = module.base.private_subnets
  app_sg_id         = module.compute.app_sg_id
  project_name      = "altergen"
  environment       = "review"
  db_instance_class = "db.t3.micro"
  db_name           = "altergen_review"
  db_username       = "admin"
  db_password       = var.db_password
  db_allocated_storage = 20
}

variable "db_password" {
  sensitive = true
}
