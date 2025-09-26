Write-Host "Starting Redis server using Docker Compose..." -ForegroundColor Green
docker-compose up -d redis

Write-Host ""
Write-Host "Redis server is starting up..." -ForegroundColor Yellow
Write-Host "You can check the status with: docker-compose ps" -ForegroundColor Cyan
Write-Host "You can view logs with: docker-compose logs redis" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop Redis server: docker-compose down" -ForegroundColor Red

# 等待几秒钟让Redis启动
Start-Sleep -Seconds 3

# 检查Redis是否启动成功
Write-Host "Checking Redis status..." -ForegroundColor Yellow
docker-compose ps redis
