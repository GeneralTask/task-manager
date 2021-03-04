variable "region" {
  default     = "us-west-2"
  description = "AWS region"
}

variable "docker_config" {
  default     = "to be filled by terraform cloud"
  description = "Configuration data used to pull docker images"
}
