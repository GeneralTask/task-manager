module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = local.cluster_name
  cluster_version = "1.21"
  subnets         = [aws_subnet.primary-az1.id, aws_subnet.primary-az2.id]

  tags = {
    Environment = "production"
    GithubRepo  = "terraform-aws-eks"
    GithubOrg   = "terraform-aws-modules"
  }

  # callout: https://github.com/terraform-aws-modules/terraform-aws-eks/blob/fb3a7ce450d42ebab1395720ed5f1ca49d6e14bb/docs/faq.md#networking
  # save https://github.com/terraform-aws-modules/terraform-aws-eks/blob/master/examples/complete/main.tf


  vpc_id = module.vpc.vpc_id

  worker_groups = [
    {
      name                          = "backend-servers"
      instance_type                 = "t2.micro"
      asg_desired_capacity          = 4
      asg_min_size                  = 2
      asg_max_size                  = 4
      additional_security_group_ids = [aws_security_group.backend_servers.id]
    },
  ]

  # This is here because we saw this error: https://github.com/terraform-aws-modules/terraform-aws-eks/issues/1205
  workers_group_defaults = {
  	root_volume_type = "gp2"
  }
}

data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_id
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_id
}
