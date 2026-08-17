# ── Dynamic Password Generation ───────────────────────────────────────────
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ── PostgreSQL Flexible Server ────────────────────────────────────────────
resource "azurerm_postgresql_flexible_server" "postgres" {
  name                   = "pg-${local.name_prefix}"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  version                = "16"
  administrator_login    = var.db_admin_username
  administrator_password = random_password.db_password.result

  # B1ms is a burstable, low-cost tier perfect for student/dev projects
  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768 # 32 GB is the minimum for Flexible Server

  # To save costs, we don't need high availability for this demo

  tags = azurerm_resource_group.rg.tags
}

# ── Firewall Rules ────────────────────────────────────────────────────────
# In a true enterprise setup, we'd use VNet Integration (Private DNS Zones).
# For a student project, we allow Azure services to reach it to keep the
# architecture simple and cheap (VNet gateways/peering costs money).
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.postgres.id
  
  # 0.0.0.0 for both indicates "Allow access to Azure services" in Azure Postgres
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
