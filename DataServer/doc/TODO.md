# QuantDirect Data Server TODO List
Here listed unfinished tasks. For detailed interface description, see [API.md](./API.md).
## 1. Refactor
- Build the API server using **golang**;
- Build a docker **container**;  

### Framework
```
+--------+                 +-------+
| Client | <--- HTTPS ---> | Nginx |
+--------+                 +-------+
                               ^
                              HTTP
                               |
                        +------------+
                        | API Server |
                        +------------+

+------------+            +------------+
| API Server | <---+----> | Clickhouse |
+------------+     |      | (Core DB)  |
                   |      +------------+
                   |           
                   |      +------------+
                   +----> | Redis      |
                          | (Cache DB) |
                          +------------+

```

## 2. RESTful API

### Futures Query:
- [ ] Contract Information (**Single** / **Combination**)
- [ ] Trading Calender (**Period**)
- [ ] History Market Data (**Period**: 0.5s / 1s / 1min / 1h / 1d) (**Duration**)
- [ ] History Broker Position (**Duration** / **Single Day**)
- [ ] History Warehouse Data (**Duration** / **Single Day**)
- [ ] History Spot Commodity (**All** / **Region**) (**Duration** / **Single Day**)

### Options (Futures Options)
- [ ] Option Information (**Single** / **Combination**)
- [ ] History Market Data (**Period**: 1min / 1h / 1d) (**Duration**)

### Stocks (Chinese A-Share / Hong Kong / American)
- [ ] Basic Information
- [ ] History Market Data (**Period**: 1min / 1day) (**Duration**)
- [ ] Financial Statement

## 3. Database Building
- [ ] Build Database System
- [ ] Data Cleaning & Importing Tools