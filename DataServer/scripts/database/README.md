# About Database
This database is designed to be maintained by the project owner (tabxx),
so the ETL scripts **may be not available** for your source data. This means that you may need to adjust the scripts to build such a database. (Because the data (files) we use may in different structures)  
By the way, here is no automatic fetching scripts. All data updating is designed to be delayed.
# About Source Data

## For history data:

* Trading Calender:  
  Assumed in CSV format with names line: (**Order-Sensitive**)
```CSV
"exchange","cal_date","is_open","pretrade_date"
```

* Contract Information:  
Assumed in CSV format with names line: (**Order-Sensitive**)   
```CSV
"code","symbol","exchange","name","fut_code","multiplier","trade_unit","per_unit","quote_unit","quote_unit_desc","d_mode_desc","list_date","delist_date","d_month","last_ddate","trade_time_desc"
``` 

* Futures Ticks:  
Assumed in CSV format with names line: (**Order-Sensitive**)
```CSV
TradingDay,InstrumentID,UpdateTime,UpdateMillisec,LastPrice,Volume,BidPrice1,BidVolume1,AskPrice1,AskVolume1,AveragePrice,Turnover,OpenInterest,UpperLimitPrice,LowerLimitPrice
``` 

* Futures Position Rank:  
Assumed in CSV format with names line: (**Order-Sensitive**)
```CSV
"trading_day","symbol","broker_name","volume","volume_variation","long_position","long_variation","short_position","short_variation"
``` 

* Options History (*Pending*):  
Assumed in CSV format with names line: (**Order-Sensitive**)
```
"time,current,volume,high,low,money,position,a1_p,b1_p,a1_v,b1_v,contract_code"
``` 
