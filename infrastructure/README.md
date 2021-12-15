# Infrastructure

This folder contains terraform configuration files to set up a kubernetes cluster in AWS using EKS. The kubernetes cluster + load balancer + docker pipeline has been tested and confirmed to work, but the connection from the kube pods to the mongo db cluster is timing out. For now, we are going to use Heroku + MongoDB Atlas UI for hosting this application, and will continue debugging the connection timeouts when it makes sense to invest more time in infrastructure.

## Configuring kubectl

Grab the cluster name from the terraform cloud state.

```
aws configure
aws eks --region us-west-2 update-kubeconfig --name INSERT_CLUSTER_NAME
```

## Appendix

Useful debugging links

- https://github.com/terraform-aws-modules/terraform-aws-eks/issues/911