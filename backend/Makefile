BIN = $(PWD)/bin
PACKAGE=humpbackwhale
MIGRATIONS = "$(PWD)/migrations"
BUILD = $(PWD)/bin/build/$(PACKAGE)
MAIN = $(PWD)/cmd/$(PACKAGE)
GOLANG_MIGRATE_VER = "v4.16.2"
MIMIMOCK_VER = "v3.1.3"
GOLANG_MIGRATE_DRIVER=postgres

# load environment variables from .env file
include .env
export

.env:
	touch "$@"

.PHONY: all
all: generate build

.PHONY: generate
generate: mock go-mod-fix swag

.PHONY: go-mod-fix
go-mod-fix:
	go mod tidy
	go mod vendor


.PHONY: run-env
run-env: .before-run-env .base-run-env .after-run-env

.base-run-env:
	docker-compose --project-name humpbackwhale up -d --build
.before-run-env:
.after-run-env: migrate-up

.PHONY: restart-env
restart-env: stop-env run-env

.PHONY: stop-env
stop-env:
	docker-compose --project-name humpbackwhale down

bin/migrate:
	GOBIN=$(BIN) go install -tags '$(GOLANG_MIGRATE_DRIVER)' github.com/golang-migrate/migrate/v4/cmd/migrate@$(GOLANG_MIGRATE_VER)
bin/minimock:
	GOBIN=$(BIN) go install github.com/gojuno/minimock/v3/cmd/minimock@$(MIMIMOCK_VER)

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


.PHONY: test
test:
	go test -v -count=1 ./... -race -coverprofile=initial-coverage.txt -covermode=atomic
	grep -v 'internal/config' initial-coverage.txt  > coverage.txt
	rm initial-coverage.txt
	go tool cover -func coverage.txt | fgrep total | awk '{print "total coverage: "$$3}'

.PHONY: mock
mock:
ifeq ($(DISABLE_MOCKS),)
	$(MAKE) bin/minimock
	$(MAKE) clean-mocks
	@echo 'PATH=... go generate -run=minimock ./...'
	@PATH='$(BIN):$(PATH)' go generate -run=minimock ./...
endif

.PHONY: clean-mocks
clean-mocks:
	rm -rf $(PWD)/mocks
	$(MAKE) generate-mocks-dir

.PHONY: generate-mocks-dir
generate-mocks-dir:
	mkdir -p $(PWD)/mocks
	$(MAKE) create-mock-dirs

.PHONY: create-mock-dirs
create-mock-dirs: create-mock-dirs-exclude-internal-vendor create-internal-go-dirs

# Copy all directories exept the 'internal' the mocks directory
.PHONY: create-mock-dirs-exclude-internal-vendor
create-mock-dirs-exclude-internal-vendor:
	@find . -type f -name '*.go' | \
	grep -v './internal/' | grep -v './vendor/' | \
	grep -o '.*/' | sort -u | \
	xargs -I {} rsync -aR --include '*/' --exclude '*' {} ./mocks

.PHONY: create-internal-go-dirs
create-internal-go-dirs:
	@find . -type f -name '*.go' | \
	grep './internal/' | grep -v '/vendor/' | \
	grep -o '.*/' | sort -u | \
	sed 's|./internal/|./|' | \
	xargs -I {} rsync -aR --include '*/' --exclude '*' ./internal/{} ./mocks