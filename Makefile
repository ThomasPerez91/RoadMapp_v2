.PHONY: migrate rollback refresh reload

reload:
	docker compose down --volumes && docker compose up --build -d

migrate:
	node ace migration:run

rollback:
	node ace migration:rollback

refresh:
	node ace migration:refresh

run:
	node ace serve --hmr
