## QDEngine Configuration

You can start QDEngine with command-line flags or with a JSON config file passed via `--config`. This document mirrors the options in `usage.md` and shows how to express them in a file.

### Supported fields

| Field | Type | Default | Description |
| :---- | :--- | :------ | :---------- |
| `host` | string | `"localhost"` | Hostname to listen on. |
| `port` | number | `8888` | Port to listen on (1–65535). |
| `data_source` | string | `"api"` | Data source: `"file"` or `"api"`. |
| `data_format` | string | `"CSV"` | Source data format: `"CSV"` or `"JSON"`. |
| `data_file` | string | `""` | Directory mapping for file data, e.g. `"futures_tick=./ticks"`. |
| `data_api` | string | `""` | API mapping for remote data, e.g. `"futures_tick=https://tabxx.net/api"`. |

#### Fields for `data_file` / `data_api`
Use `<data>=<path>` for `data_file` and `<data>=<URL>` for `data_api`. Valid `<data>` values:

| Data key | Description |
| :------- | :---------- |
| `futures_contracts` | Metadata table `Contracts` (futures contract info) |
| `futures_calendar` | Trading calendar table `TradingCalendar` |
| `futures_tick` | 0.5s snapshot table `HistoryTick` |
| `futures_minute` | 1-minute bars table `HistoryMinute` |
| `futures_daily_rank` | Broker ranking table `DailyRank` |
| `options_list` | Options metadata table `OptionsList` |
| `options_tick` | 0.5s snapshot table `OptionsHistoryTick` |

### Example config file

```json
{
	"host": "0.0.0.0",
	"port": 9000,
	"data_source": "file",
	"data_format": "CSV",
	"data_file": {
        "futures_tick": "./ticks"
    }
}
```

### Notes
- Command-line flags override these values when both are provided.
- If a field is omitted, QDEngine uses the default shown above.
