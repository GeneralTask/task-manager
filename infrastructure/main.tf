terraform {
  required_providers {
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
    mongodbatlas = {
      source = "mongodb/mongodbatlas"
    }
  }

  backend "remote" {
    organization = "generaltask"

    workspaces {
      name = "task-manager"
    }
  }
}


provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  token                  = data.aws_eks_cluster_auth.cluster.token
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
}
