# varies
APP_NAME = huixue-frontend
BUILD_DIR = dist
DEPLOY_DIR = /opt/huixue_frontend
DEPLOY_USER = root
DEPLOY_HOST = 101.200.240.100
RSYNC_FLAGS = -avz --delete --progress

build:
	@echo "building🚀..."
	npm run build

deploy: build
	@echo "syncing with rsync 🚀..."
	rsync $(RSYNC_FLAGS) $(BUILD_DIR)/ $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_DIR)/

clean:
	@echo "cleaning🧹..."
	rm -rf $(BUILD_DIR)