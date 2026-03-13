#!/bin/bash
COMPOSE = docker-compose

# export_machine_name:
# 	@for VAR in USER SESSION_MANAGER; do \
# 		if printenv $VAR >/dev/null; then \
# 			eval "var_value=\$$VAR"; \
# 			if grep -q "^$VAR=" .env; then \
# 				sed -i "s|^$VAR=.*|$VAR=$var_value|" .env; \
# 			else \
# 				echo "$VAR=$var_value" >> .env; \
# 			fi; \
# 		fi; \
# 	done
export_machine_name:
	@for VAR in USER SESSION_MANAGER; do \
		if printenv $VAR >/dev/null; then \
			echo "Processing $(VAR)..."; \
			eval "var_value=$$(VAR)"; \
			echo "var_value for $$VAR: $${var_value}"; \
			if grep -q "^$$VAR=" .env; then \
				echo "Updating $$VAR in .env"; \
				sed -i "s|^$$VAR=.*|$$VAR=$$var_value|" .env; \
			else \
				echo "Adding $$VAR to .env"; \
				echo "$$VAR=$$var_value" >> .env; \
			fi; \
		else \
			echo "$$VAR is not set in the environment"; \
		fi; \
	done
.PHONY: up down clean purge prune re

up:	export_machine_name
	$(COMPOSE) up --build

down:
	$(COMPOSE) down
purge:
	docker rm -f $(docker ps -a -q) && docker rmi -f $(docker images -q) && docker volume rm $(docker volume ls -q)

prune:
# 	-a -> remove all , -f -> force without prompt
	docker system prune -a -f

clean:
	$(COMPOSE) down -v --remove-orphans

re: clean up