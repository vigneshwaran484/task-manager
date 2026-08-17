# ── Random string for globally unique names ───────────────────────────────
resource "random_string" "suffix" {
  length  = 5
  special = false
  upper   = false
}

locals {
  name_prefix = "${var.project_name}${random_string.suffix.result}"
}

# ── Resource Group ────────────────────────────────────────────────────────
resource "azurerm_resource_group" "rg" {
  name     = "rg-${local.name_prefix}"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "SecureTasks"
  }
}

# ── Azure Container Registry ──────────────────────────────────────────────
resource "azurerm_container_registry" "acr" {
  name                = "acr${local.name_prefix}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  
  # Basic SKU is the cheapest, perfect for student projects
  sku                 = "Basic"
  admin_enabled       = true # Enabled for easy Container App integration

  # For production, you'd disable admin_enabled and use Managed Identities (ACRPull)
  # But for a student demo, admin_enabled simplifies the Container App setup 
  # without needing complex role assignments that might hit AD propagation delays.

  tags = azurerm_resource_group.rg.tags
}
