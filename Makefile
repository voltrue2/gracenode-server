init:

	@echo 'create git pre-commit hook'
	ln -s ../../lint.sh .git/hooks/pre-commit
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'install dependencies'
	npm install
	@echo 'done'
