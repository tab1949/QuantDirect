@echo off
echo Starting Redis server using Docker Compose...
docker-compose up -d redis
echo.
echo Redis server is starting up...
echo You can check the status with: docker-compose ps
echo You can view logs with: docker-compose logs redis
echo.
echo To stop Redis server: docker-compose down
pause
