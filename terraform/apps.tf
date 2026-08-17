# ── Log Analytics Workspace (Required for Container Apps) ───────────────────
resource "azurerm_log_analytics_workspace" "law" {
  name                = "law-${local.name_prefix}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# ── Container Apps Environment ────────────────────────────────────────────
resource "azurerm_container_app_environment" "env" {
  name                       = "cae-${local.name_prefix}"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.law.id
}

# ── Managed Identity for the Apps ─────────────────────────────────────────
# We use a User Assigned Managed Identity so the apps can pull from ACR
# and read secrets from Key Vault without hardcoded credentials.
resource "azurerm_user_assigned_identity" "app_identity" {
  name                = "mi-${local.name_prefix}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

# Role: Allow apps to pull images from ACR
resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.app_identity.principal_id
}

# Role: Allow apps to read Key Vault Secrets
resource "azurerm_role_assignment" "kv_secrets_user" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.app_identity.principal_id
}

# ── Backend Container App ─────────────────────────────────────────────────
resource "azurerm_container_app" "backend" {
  name                         = "ca-backend-${local.name_prefix}"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app_identity.id]
  }

  registry {
    server   = azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.app_identity.id
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 0 # Scales to 0 to save money!
    max_replicas = 1

    container {
      name   = "backend"
      image  = "${azurerm_container_registry.acr.login_server}/backend:${var.backend_image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      # Pass non-sensitive env vars directly
      env {
        name  = "APP_ENV"
        value = "production"
      }
      env {
        name  = "JWT_ALGORITHM"
        value = "HS256"
      }
      # Notice we construct the DB URL using the dynamic host and username, 
      # but we fetch the password securely from Key Vault via secret_name mapping below.
      env {
        name  = "DATABASE_URL"
        value = "postgresql+asyncpg://${var.db_admin_username}:${azurerm_key_vault_secret.db_password.value}@${azurerm_postgresql_flexible_server.postgres.fqdn}:5432/postgres"
      }

      # Mount secrets from Key Vault
      env {
        name        = "JWT_SECRET_KEY"
        secret_name = "jwt-secret-key"
      }
    }
  }

  # Map the Azure Key Vault references to the Container App's secret store
  secret {
    name                = "jwt-secret-key"
    key_vault_secret_id = azurerm_key_vault_secret.jwt_secret_key.id
    identity            = azurerm_user_assigned_identity.app_identity.id
  }

  depends_on = [
    azurerm_role_assignment.acr_pull,
    azurerm_role_assignment.kv_secrets_user
  ]
}

# ── Frontend Container App ────────────────────────────────────────────────
resource "azurerm_container_app" "frontend" {
  name                         = "ca-frontend-${local.name_prefix}"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app_identity.id]
  }

  registry {
    server   = azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.app_identity.id
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "frontend"
      image  = "${azurerm_container_registry.acr.login_server}/frontend:${var.frontend_image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  depends_on = [azurerm_role_assignment.acr_pull]
}
