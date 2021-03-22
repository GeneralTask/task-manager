# # Kubernetes provider
# # https://learn.hashicorp.com/terraform/kubernetes/provision-eks-cluster#optional-configure-terraform-kubernetes-provider
# # To learn how to schedule deployments and services using the provider, go here: ttps://learn.hashicorp.com/terraform/kubernetes/deploy-nginx-kubernetes.

resource "kubernetes_deployment" "backend" {
  metadata {
    name = "backend"
    labels = {
      App = "Backend"
    }
  }

  spec {
    replicas = 2
    selector {
      match_labels = {
        App = "Backend"
      }
    }
    template {
      metadata {
        labels = {
          App = "Backend"
        }
      }
      spec {
        container {
          image = "johngeneraltask/task-manager:47468dd"
          name  = "task-manager"
          env {
            name = "MONGO_URI"
            value_from {
              secret_key_ref {
                name  = "mongo-uri"
                key = "mongo_uri"
              }
            }
          }

          port {
            container_port = 8080
          }
        }

        image_pull_secrets {
          name = "docker-config"
        }
      }
    }
  }
}

resource "kubernetes_ingress" "backend_ingress" {
  metadata {
    name = "backend-ingress"

    annotations = {
      "ingress.kubernetes.io/rewrite-target" = "/"
    }
  }

  spec {
    backend {
      service_name = "backend"
      service_port = 443
    }

    rule {
      host = "api.generaltask.io"

      http {
        path {
          path = "/"

          backend {
            service_name = "backend"
            service_port = 443
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "backend" {
  metadata {
    name = "backend"
  }
  spec {
    selector = {
      App = kubernetes_deployment.backend.spec.0.template.0.metadata[0].labels.App
    }
    port {
      port        = 443
      target_port = 8080
    }

    type = "LoadBalancer"
  }
}

resource "kubernetes_secret" "docker_config" {
  metadata {
    name = "docker-config"
  }

  data = {
    ".dockerconfigjson" = var.docker_config
  }

  type = "kubernetes.io/dockerconfigjson"
}

resource "kubernetes_secret" "mongo_uri" {
  metadata {
    name = "mongo-uri"
  }

  data = {
    "mongo_uri" = lookup(mongodbatlas_cluster.main.connection_strings[0].aws_private_link_srv, aws_vpc_endpoint.ptfe_service.id)
  }
}
