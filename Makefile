SHELL := /bin/bash
COMPOSE := docker compose
TEST_HISTORY_FILE ?= test.history.json
TEST_HISTORY_PATH ?= /tmp/red-tetris-test.history.json
UNSET_HISTORY := env -u HISTORY_PATH
export SESSION_MANAGER

.PHONY: up \
        build \
        deploy \
        asyncapi \
        down \
        logs \
        lint \
		lint-server \
        clean \
        re \
        session-key \
        sync-session-manager \
        ensure-history \
        ensure-test-history \
        client-build \
        client-clean \
        test \
        test-server \
        test-server-watch \
        test-server-coverage \
        test-client \
        test-client-watch \
        test-client-coverage \
        test-coverage \

session-key:
	@echo "SESSION_KEY_BASE64=$$(openssl rand -base64 32)";

sync-session-manager:
	@set -e; \
	tmp_file="$$(mktemp .env.XXXXXX)"; \
	if [ -f .env ]; then \
		sed '/^SESSION_MANAGER=/d' .env > "$$tmp_file"; \
	else \
		: > "$$tmp_file"; \
	fi; \
	mv "$$tmp_file" .env; \
	if [ -n "$$SESSION_MANAGER" ]; then \
		printf '%s\n' "SESSION_MANAGER=$$SESSION_MANAGER" >> .env; \
		echo "Updated SESSION_MANAGER in .env"; \
	else \
		echo "SESSION_MANAGER not set; removed SESSION_MANAGER from .env"; \
	fi

ensure-history:
	@if [ ! -f history.json ]; then \
		printf '[]\n' > history.json; \
		echo "Created history.json"; \
	fi; \
	chmod a+rw history.json || true; \
	echo "history.json set to read/write";

ensure-test-history:
	@if [ ! -f "$(TEST_HISTORY_FILE)" ]; then \
		printf '[]\n' > "$(TEST_HISTORY_FILE)"; \
		echo "Created $(TEST_HISTORY_FILE)"; \
	fi; \
	chmod a+rw "$(TEST_HISTORY_FILE)" || true; \
	echo "$(TEST_HISTORY_FILE) set to read/write";

up: sync-session-manager
	$(MAKE) ensure-history ensure-test-history client-build
	$(UNSET_HISTORY) $(COMPOSE) up server

build:
	$(UNSET_HISTORY) $(COMPOSE) build server client

deploy: sync-session-manager
	$(MAKE) ensure-history ensure-test-history client-build
	$(UNSET_HISTORY) $(COMPOSE) up --build server

asyncapi:
	$(COMPOSE) --profile docs run --rm docs-builder

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f --tail=100 server

lint:
	$(COMPOSE) run --rm -w /repo -v .:/repo -v redtetris_root_node_modules:/repo/node_modules client sh -lc "npm install && npm run lint"

clean:
	$(UNSET_HISTORY) $(COMPOSE) down -v --remove-orphans
	docker builder prune -f

re: clean up

client-build:
	$(COMPOSE) run --rm client sh -lc "npm install && npm run build"

client-clean:
	rm -rf src/client/dist

test: test-server test-client

test-server:
	$(MAKE) ensure-test-history
	$(COMPOSE) run --rm -e HISTORY_PATH=$${HISTORY_PATH:-$(TEST_HISTORY_PATH)} server sh -lc "npm run test"

test-server-watch:
	$(MAKE) ensure-test-history
	$(COMPOSE) run --rm -e HISTORY_PATH=$${HISTORY_PATH:-$(TEST_HISTORY_PATH)} server sh -lc "npm run test:watch"

test-server-coverage:lint-server
	$(MAKE) ensure-test-history
	$(COMPOSE) run --rm -e HISTORY_PATH=$${HISTORY_PATH:-$(TEST_HISTORY_PATH)} server sh -lc "npm run test:coverage"

test-client:
	$(COMPOSE) run --rm client sh -lc "npm install && npm run test"

test-client-watch:
	$(COMPOSE) run --rm client sh -lc "npm install && npm run test -- --watch"

test-client-coverage:
	$(COMPOSE) run --rm client sh -lc "npm install && npm run test"

test-coverage: lint test-server-coverage test-client-coverage

lint-server:
	$(COMPOSE) run --rm -w /repo -v .:/repo -v redtetris_root_node_modules:/repo/node_modules client sh -lc "npm install && npx eslint src/server"
