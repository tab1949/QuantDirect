# QuantDirect Server
## About API
### Endpoints:
 - 
## About Redis
### Redis Keys
Database 1 (futures):
| Key | Type | Description | Field |
| --- | ---- | ----------- | ----- |
|"contracts:info"|Hash|Contract information|Contract Code|
|"contracts:list"|Hash|Contract list of each exchange|Exchange Code|
|"contracts:assets:EXCHANGE"|Set|Names of Subject Assets||
|"contracts:asset:code"|Hash|Codes of Subject Assets|Asset Name|
|"contracts:update"|String|Latest update date||