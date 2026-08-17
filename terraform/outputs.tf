output "resource_group_name" {
  value       = azurerm_resource_group.rg.name
  description = "Name of the resource group"
}

output "acr_login_server" {
  value       = azurerm_container_registry.acr.login_server
  description = "ACR login server URL"
}

output "backend_url" {
  value       = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
  description = "Public URL of the backend API"
}

output "frontend_url" {
  value       = "https://${azurerm_container_app.frontend.latest_revision_fqdn}"
  description = "Public URL of the frontend application"
}
