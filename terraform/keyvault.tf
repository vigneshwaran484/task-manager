data "azurerm_client_config" "current" {}

# ── Key Vault ─────────────────────────────────────────────────────────────
resource "azurerm_key_vault" "kv" {
  name                        = "kv-${local.name_prefix}"
  location                    = azurerm_resource_group.rg.location
  resource_group_name         = azurerm_resource_group.rg.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"

  # Standard RBAC model is recommended over legacy access policies
  enable_rbac_authorization   = true
  
  # Allow access from all networks for the student demo (simpler than VNet integration)
  public_network_access_enabled = true

  tags = azurerm_resource_group.rg.tags
}

# ── RBAC Assignment for Terraform ─────────────────────────────────────────
# The principal running Terraform (GitHub Actions) needs permission to create secrets
resource "azurerm_role_assignment" "tf_kv_admin" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# ── Generate JWT Secret ───────────────────────────────────────────────────
resource "random_password" "jwt_secret" {
  length  = 64 # 512 bits of entropy for HS256
  special = true
}

# ── Store Secrets ─────────────────────────────────────────────────────────
resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = random_password.db_password.result
  key_vault_id = azurerm_key_vault.kv.id

  # Ensure the role assignment exists before trying to write secrets
  depends_on = [azurerm_role_assignment.tf_kv_admin]
}

resource "azurerm_key_vault_secret" "jwt_secret_key" {
  name         = "jwt-secret-key"
  value        = random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.kv.id

  depends_on = [azurerm_role_assignment.tf_kv_admin]
}
