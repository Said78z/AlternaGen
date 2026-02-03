variable "vpc_id" {}
variable "private_subnets" { type = list(string) }
variable "app_sg_id" {}
variable "project_name" {}
variable "environment" {}
variable "db_instance_class" {}
variable "db_name" {}
variable "db_username" {}
variable "db_password" {}
variable "db_allocated_storage" {}
