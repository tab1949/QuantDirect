# QuantDirect Server
## Usage
`run.sh`
## About API
### Endpoints:
| Endpoint | Parameters | Description |
| -------- | ---------- | ----------- |
|`/api/futures/contract/list/:exchange`||Get contracts of specified exchange(:exchange)|
|`/api/futures/contract/info/:symbol`||Get information of specified contract(:symbol)|
|`/api/futures/contract/assets/:exchange`||Get a list of subject asset names and codes of specified exchange(:exchange)|
|`/api/futures/contract/info/:symbol?g&e=`|e: Exchange Code|Get a group of asset names and codes of specified exchange(:exchange)|
|`/api/futures/contract/data/:code`||Get history market data of specified contract(:code).|
## About Redis
### Redis Keys
Database 0 (futures):
| Key | Type | Description | Field |
| --- | ---- | ----------- | ----- |
|"contracts:info"|Hash|Contract information|Contract Code|
|"contracts:list"|Hash|Contract list of each exchange|Exchange Code|
|"contracts:assets:EXCHANGE"|Set|Names of Subject Assets||
|"contracts:asset:code"|Hash|Codes of Subject Assets|Asset Name|
|"contracts:update"|String|Latest update date||
|"cache:futures:*"|String|Cached data||