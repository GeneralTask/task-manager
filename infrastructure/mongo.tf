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
  provider_name = var.provider_name
  provider_region_name = var.region_atlas
  provider_instance_size_name = "M10"

  //These must be the following values
  mongo_db_major_version = "4.4"
  auto_scaling_disk_gb_enabled = "true"
}

# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity
data "aws_caller_identity" "current" {}

resource "mongodbatlas_network_container" "main" {
    project_id       = mongodbatlas_project.main.id
    atlas_cidr_block = "10.8.0.0/21"
    provider_name    = var.provider_name
    region_name      = var.region_atlas
  }

# https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs/resources/network_peering
# https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest?tab=outputs
# Create the peering connection request
resource "mongodbatlas_network_peering" "mongo_peer" {
  accepter_region_name   = var.region
  project_id             = mongodbatlas_project.main.id
  container_id           = mongodbatlas_network_container.main.container_id
  provider_name          = var.provider_name
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

# Worth exploring: https://github.com/nikhil-mongo/aws-atlas-privatelink

# Trying out privatelink setup
//Subnet-A (TODO: use the ones from the VPC module)
resource "aws_subnet" "primary-az1" {
  vpc_id                  = module.vpc.vpc_id
  cidr_block              = "10.0.7.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.region}a"
}

//Subnet-B
resource "aws_subnet" "primary-az2" {
  vpc_id                  = module.vpc.vpc_id
  cidr_block              = "10.0.8.0/24"
  map_public_ip_on_launch = false
  availability_zone       = "${var.region}b"
}

resource "mongodbatlas_privatelink_endpoint" "atlaspl" {
  project_id    = mongodbatlas_project.main.id
  provider_name = var.provider_name
  region        = var.region
}

resource "aws_vpc_endpoint" "ptfe_service" {
  vpc_id             = module.vpc.vpc_id
  service_name       = mongodbatlas_privatelink_endpoint.atlaspl.endpoint_service_name
  vpc_endpoint_type  = "Interface"
  subnet_ids         = [aws_subnet.primary-az1.id, aws_subnet.primary-az2.id]
  security_group_ids = [aws_security_group.all_worker_mgmt.id]
}

resource "mongodbatlas_privatelink_endpoint_service" "atlaseplink" {
  project_id            = mongodbatlas_privatelink_endpoint.atlaspl.project_id
  private_link_id       = mongodbatlas_privatelink_endpoint.atlaspl.private_link_id
  endpoint_service_id = aws_vpc_endpoint.ptfe_service.id
  provider_name = var.provider_name
}
