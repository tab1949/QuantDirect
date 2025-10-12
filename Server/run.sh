# Start Redis Server
eval $(redis-server redis.conf) > /dev/null &

echo "Redis started."

echo "npm:"
if (($1 == "dev")) then
    npm run dev
else
    npm run build
    npm run start
fi