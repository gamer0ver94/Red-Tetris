# #!/bin/bash
# COMPOSE = docker-compose

# export_machine_name:
# 	@for VAR in USER SESSION_MANAGER; do \
# 		if printenv $VAR >/dev/null; then \
# 			echo "Processing $(VAR)..."; \
# 			eval "var_value=$$(VAR)"; \
# 			echo "var_value for $$VAR: $${var_value}"; \
# 			if grep -q "^$$VAR=" .env; then \
# 				echo "Updating $$VAR in .env"; \
# 				sed -i "s|^$$VAR=.*|$$VAR=$$var_value|" .env; \
# 			else \
# 				echo "Adding $$VAR to .env"; \
# 				echo "$$VAR=$$var_value" >> .env; \
# 			fi; \
# 		else \
# 			echo "$$VAR is not set in the environment"; \
# 		fi; \
# 	done

SHELL := /bin/bash
COMPOSE := docker compose

.PHONY: up down logs clean re session-key client-build client-clean

session-key:
	@echo "SESSION_KEY_BASE64=$$(openssl rand -base64 32)"

up:
	$(COMPOSE) up

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f --tail=100 server client

clean:
	$(COMPOSE) down -v --remove-orphans

re: clean up

client-build:
	npm run build:client

client-clean:
	rm -rf src/client/dist
