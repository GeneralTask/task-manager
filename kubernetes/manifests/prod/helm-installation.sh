#!/bin/bash

#================#
# ALB Controller #
#================#


echo "Adding required helm packages ...."
helm repo add eks https://aws.github.io/eks-charts

echo "Install the TargetGroupBinding CRDs if upgrading the chart via helm upgrade."
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

echo "Install the helm chart if using IAM roles for service accounts. "
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
 -n kube-system \
 --set clusterName=prd-gtsk-uswest1-backend \
 --set serviceAccount.create=false \
 --set serviceAccount.name=aws-load-balancer-controller \
 --set vpcId=vpc-0f4a35f3131c1aa49 \
 --set replicaCount=1 \


#================#
# AWS CSI Driver #
#================#

# The below is removed for later use

## Secrets Store CSI Driver
#helm repo rm secrets-store-csi-driver
#helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
#helm repo update
## Install chart using Helm v3.0+
#helm install csi-secrets-store secrets-store-csi-driver/secrets-skubectl
#rollout restart -n kube-system deployment coredns
#tore-csi-driver



#ASCP
#kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml