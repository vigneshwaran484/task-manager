variable "project_name" {
  type        = string
  default     = "taskmgr"
  description = "Base name for all resources (must be globally unique for ACR/KeyVault if not randomized)"
}

variable "location" {
  type        = string
  default     = "eastasia"
  description = "Azure region (East Asia is allowed by your Azure Policy)"
}

variable "db_admin_username" {
  type        = string
  default     = "pgadmin"
  description = "PostgreSQL administrator username"
}

# The password will be generated dynamically by Terraform to avoid hardcoding
# variable "db_admin_password" { ... }

variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment tag"
}

variable "frontend_image_tag" {
  type        = string
  default     = "latest"
  description = "Tag for the frontend Docker image"
}

variable "backend_image_tag" {
  type        = string
  default     = "latest"
  description = "Tag for the backend Docker image"
}
