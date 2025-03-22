BIN = $(PWD)/bin
PACKAGE=humpbackwhale
MIGRATIONS = "$(PWD)/migrations"
BUILD = $(PWD)/bin/build/$(PACKAGE)
MAIN = $(PWD)/cmd/$(PACKAGE)
GOLANG_MIGRATE_VER = "v4.16.2"
GOLANG_MIGRATE_DRIVER=postgres

# load environment variables from .env file
include .env
export

.env:
	touch "$@"

.PHONY: all
all: generate build

.PHONY: generate
generate: go-mod-fix swag

.PHONY: go-mod-fix
go-mod-fix:
	go mod tidy
	go mod vendor


.PHONY: run-env
run-env: .before-run-env .base-run-env .after-run-env

.base-run-env:
	docker-compose --project-name humpbackwhale up -d --wait
.before-run-env:
.after-run-env: migrate-up

.PHONY: restart-env
restart-env: stop-env run-env

.PHONY: stop-env
stop-env:
	docker-compose --project-name humpbackwhale down

bin/migrate:
	GOBIN=$(BIN) go install -tags '$(GOLANG_MIGRATE_DRIVER)' github.com/golang-migrate/migrate/v4/cmd/migrate@$(GOLANG_MIGRATE_VER)

.PHONY: run
run: build
	${BUILD}

.PHONY: build
build:
ifeq ($(shell uname -s),Linux)
	go build -tags musl -tags dynamic -mod=vendor -o ${BUILD} ${MAIN}
else
	go build -tags musl -mod=vendor -o ${BUILD} ${MAIN}
endif

.PHONY: cover
cover:
	go test -v -coverpkg=./... -coverprofile report.out -covermode=atomic ./...
	grep -v -E -- 'mocks|config|cmd|logging'  report.out > report1.out
	go tool cover -func=report1.out

lint:
	golangci-lint run ./...

.PHONY: migrate-new
migrate-new: bin/migrate
	migrate create -ext sql  -seq -dir $(MIGRATIONS) '$(name)'

migrate-up: bin/migrate
	$(BIN)/migrate -path=$(MIGRATIONS) -database "${MIGRATE_ENDPOINT}" up

.PHONY: swag
swag:
	swag init -g ./cmd/humpbackwhale/main.go