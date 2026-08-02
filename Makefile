APP_NAME = huixue-frontend
BUILD_DIR = dist
DEPLOY_USER = root
DEPLOY_HOST = 101.200.240.100
DEPLOY_DIRS = /opt/huixue_frontend /opt/huixue_frontend_sangao
DEPLOY_UAT_DIRS = /opt/uat-huixue_frontend_sangao
RSYNC_FLAGS = -avz --delete --progress
REMOTE = $(DEPLOY_USER)@$(DEPLOY_HOST)

.PHONY: build deploy deploy-rsync deploy-ssh uat-deploy uat-deploy-rsync uat-deploy-ssh clean

build:
	@echo "Building🚀..."
	npm run build

deploy: build
	@if ! [ -d "$(BUILD_DIR)" ]; then \
		echo "Error: Build output directory not found: $(BUILD_DIR)"; \
		exit 1; \
	fi
	@if command -v rsync >/dev/null 2>&1; then \
		$(MAKE) deploy-rsync; \
	else \
		echo "rsync not found, falling back to ssh + scp..."; \
		$(MAKE) deploy-ssh; \
	fi

deploy-rsync:
	@for dir in $(DEPLOY_DIRS); do \
		echo "Deploying to $$dir with rsync🚀..."; \
		rsync $(RSYNC_FLAGS) $(BUILD_DIR)/ $(REMOTE):$$dir/; \
	done

deploy-ssh:
	@for dir in $(DEPLOY_DIRS); do \
		echo "Deploying to $$dir with ssh + scp🚀..."; \
		ssh $(REMOTE) "mkdir -p '$$dir' && rm -rf '$$dir'/*"; \
		scp -r $(BUILD_DIR)/* $(REMOTE):$$dir/; \
	done

# UAT 部署（等价于 uat-deploy.ps1）：构建后同步到 UAT 前端目录
uat-deploy: build
	@if ! [ -d "$(BUILD_DIR)" ]; then \
		echo "Error: Build output directory not found: $(BUILD_DIR)"; \
		exit 1; \
	fi
	@if command -v rsync >/dev/null 2>&1; then \
		$(MAKE) uat-deploy-rsync; \
	else \
		echo "rsync not found, falling back to ssh + scp..."; \
		$(MAKE) uat-deploy-ssh; \
	fi

uat-deploy-rsync:
	@for dir in $(DEPLOY_UAT_DIRS); do \
		echo "Deploying to $$dir with rsync🚀..."; \
		rsync $(RSYNC_FLAGS) $(BUILD_DIR)/ $(REMOTE):$$dir/; \
	done

uat-deploy-ssh:
	@for dir in $(DEPLOY_UAT_DIRS); do \
		echo "Deploying to $$dir with ssh + scp🚀..."; \
		ssh $(REMOTE) "mkdir -p '$$dir' && rm -rf '$$dir'/*"; \
		scp -r $(BUILD_DIR)/* $(REMOTE):$$dir/; \
	done

clean:
	@echo "Cleaning🧹..."
	rm -rf $(BUILD_DIR)
