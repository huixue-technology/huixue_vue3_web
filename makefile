# varies
APP_NAME = huixue-frontend
BUILD_DIR = dist
DEPLOY_DIR = /opt/huixue_frontend
DEPLOY_USER = root
DEPLOY_HOST = 101.200.240.100


build:
	@echo "building🚀..."
	npm run build

deploy: build
	@echo "sending🤡..."
	ssh $(DEPLOY_USER)@$(DEPLOY_HOST) "rm -rf $(DEPLOY_DIR)/*"
	scp -r $(BUILD_DIR)/* $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_DIR)

clean:
	@echo "cleaning🧹..."
	rm -rf $(BUILD_DIR)