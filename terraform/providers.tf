terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # For the CI/CD pipeline, state will be stored in an Azure Storage Account.
  # The GitHub Action will pass these variables during init.
  # Local dev will just use local state if backend block is commented or overridden.
  backend "azurerm" {
    # Values provided via `terraform init -backend-config=...` in CI
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}
