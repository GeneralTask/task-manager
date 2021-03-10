terraform {
  required_version = ">= 0.12"
  
  required_providers {
    aws = {
      version = "~> 3.25"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
    mongodbatlas = {
      source = "mongodb/mongodbatlas"
    }
    random = {
      version = "~> 2.1"
    }
    local = {
      version = "~> 1.2"
    }
  }

  backend "remote" {
    organization = "generaltask"

    workspaces {
      name = "task-manager"
    }
  }
}

provider "aws" {
  region  = var.region
}


provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  token                  = data.aws_eks_cluster_auth.cluster.token
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
}

provider "null" {
  version = "~> 2.1"
}

provider "template" {
  version = "~> 2.1"
}
