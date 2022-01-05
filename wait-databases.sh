

for i in $(seq 60); do
  docker-compose exec postgresql psql postgres://postgres:postgresrootpassword@localhost -c "SELECT 1" && break;
  sleep 1;
done

for i in $(seq 60); do
  docker-compose exec postgresql10 psql postgres://postgres:postgresrootpassword@localhost -c "SELECT 1" && break;
  sleep 1;
done

for i in $(seq 60); do
  docker-compose exec mysql mysql -hmysql -uroot -pmysqlrootpassword -e "SELECT 1" && break;
  sleep 1;
done

for i in $(seq 60); do
  docker-compose exec mysql8 mysql -hmysql -uroot -pmysqlrootpassword -e "SELECT 1" && break;
  sleep 1;
done
