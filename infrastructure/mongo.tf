resource "mongodbatlas_project" "main" {
  name   = "main"
  org_id = "604076ef034c06744782d24a"
}

resource "mongodbatlas_cluster" "main" {
  project_id              = mongodbatlas_project.main.id
  name                    = "main"

  // M30 is required ($380 / mo) to do sharded
  cluster_type = "REPLICASET"
  //M2 must be 2, M5 must be 5
  disk_size_gb = "10"

  //Provider Settings "block"
  provider_name = "AWS"
  provider_region_name = "US_WEST_2"
  provider_instance_size_name = "M10"

  //These must be the following values
  mongo_db_major_version = "4.4"
  auto_scaling_disk_gb_enabled = "true"
}

# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity
data "aws_caller_identity" "current" {}

# https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs/resources/network_peering
# https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest?tab=outputs
# Create the peering connection request
resource "mongodbatlas_network_peering" "mongo_peer" {
  accepter_region_name   = var.region
  project_id             = mongodbatlas_project.main.id
  container_id           = mongodbatlas_cluster.main.container_id
  provider_name          = "AWS"
  route_table_cidr_block = module.vpc.vpc_cidr_block
  vpc_id                 = module.vpc.vpc_id
  aws_account_id         = data.aws_caller_identity.current.account_id
}

# Accept the connection 
resource "aws_vpc_peering_connection_accepter" "aws_peer" {
  vpc_peering_connection_id = mongodbatlas_network_peering.mongo_peer.connection_id
  auto_accept               = true

  tags = {
    Side = "Accepter"
  }
}
