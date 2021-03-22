variable "region" {
  default     = "us-west-2"
  description = "AWS region"
}

variable "region_atlas" {
  default     = "US_WEST_2"
  description = "AWS region for atlas"
}

variable "provider_name" {
  default     = "AWS"
  description = "Cloud provider name"
}

variable "docker_config" {
  default     = "to be filled by terraform cloud"
  description = "Configuration data used to pull docker images"
}
