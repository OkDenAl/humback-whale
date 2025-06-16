## Инструкция по запуску
1) В ./backend выполнить команду run-env для поднятия PostgreSQL и MinIO
2) В ./backend создать файл .env и заполнить в нем переменные среды как в файле .env.example
3) В ./backend выполнить команду export $(grep -v '^#' .env | xargs) && go build -o humpbackwhale ./cmd/humpbackwhale/

ПУНКТЫ 2 и 3 можно пропустить, если есть бинарный файл!


4) В ./ml/app запустить мл модуль uvicorn main:app --host 0.0.0.0 --port 8001
5) использовать сайт на localhost:80