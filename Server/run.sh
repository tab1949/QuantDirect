# Start Redis Server
clear
eval $(redis-server redis.conf) > /dev/null &

echo "Redis started."

echo "Run npm:"
if (($1 == "dev")) then
    npm run dev:nodemon
else
    npm run build
    npm run start
fi