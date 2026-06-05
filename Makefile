SHELL := /bin/bash
COMPOSE := docker compose

.PHONY: up \
        build \
        deploy \
        asyncapi \
        down \
        logs \
        clean \
        re \
        session-key \
        client-build \
        client-clean \
        test-server \
        test-server-watch \
        test-server-coverage \

session-key:
	@echo "SESSION_KEY_BASE64=$$(openssl rand -base64 32)";

up:
	@if [ -n "$(SESSION_MANAGER)" ]; then \
		echo "SESSION_MANAGER=$(SESSION_MANAGER)" >> .env; \
		echo "Wrote SESSION_MANAGER to .env"; \
	else \
		echo "SESSION_MANAGER not set"; \
	fi; \
	if [ -f src/server/history.json ]; then \
		chmod a-w src/server/history.json || true; \
		echo "Found src/server/history.json — set to readonly"; \
	fi; \
	$(COMPOSE) up server client

build:
	$(COMPOSE) build server client

deploy:
	$(COMPOSE) up --build server client

asyncapi:
	$(COMPOSE) --profile docs run --rm docs-builder

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f --tail=100 server client

clean:
	$(COMPOSE) down -v --remove-orphans
	docker builder prune -f

re: clean up

client-build:
	npm run build:client

client-clean:
	rm -rf src/client/dist

test-server:
	docker compose run --rm server sh -lc "npm run test"

test-server-watch:
	docker compose run --rm server sh -lc "npm run test:watch"

test-server-coverage:
	docker compose run --rm server sh -lc "npm run test:coverage"

tetris:
	bash ./tetris-cli.sh