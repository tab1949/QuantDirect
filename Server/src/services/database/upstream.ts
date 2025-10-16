import axios from "axios";
import logger from "../../logger";

export enum DataType {
    FUTURES_LIST,
    FUTURES_1DAY,
    STOCK_LIST,
    STOCK_1DAY,
}

const upstreamConfig = {
    tushare: {
        api_name: [''],
        params: [{}],
        fields: [[""]]
    }
};

upstreamConfig.tushare.api_name[DataType.FUTURES_LIST] = "fut_basic";
upstreamConfig.tushare.api_name[DataType.STOCK_LIST] = "stock_basic";
upstreamConfig.tushare.api_name[DataType.FUTURES_1DAY] = "fut_daily";
upstreamConfig.tushare.api_name[DataType.STOCK_1DAY] = "daily";
upstreamConfig.tushare.fields[DataType.FUTURES_LIST] = [
    "ts_code",
    "symbol",
    "exchange",
    "name",
    "fut_code",
    "multiplier",
    "trade_unit",
    "per_unit",
    "quote_unit",
    "quote_unit_desc",
    "d_mode_desc",
    "list_date",
    "delist_date",
    "d_month",
    // "last_date",
    "trade_time_desc"
];

export function getRequestData(config: any, type: DataType): any {
    switch (config["name"]) {
    case "tushare":
        if (!config["token"] || config["token"] === "") {
            logger.error("Token is empty in config.json!");
            process.exit(1);
        }
        return {
            url: config["url_root"],
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: {
                api_name: upstreamConfig.tushare.api_name[type],
                token: config["token"],
                params: upstreamConfig.tushare.params[type],
                fields: upstreamConfig.tushare.fields[type]
            }
        };
        break;
    default:
        logger.error(`Unknown upstream data source: ${config["name"]}`);
        process.exit(1);
    }
}

export async function fetchFromUpstream(req: any): Promise<any> {
    switch (req.method) {
        case 'GET':
            return axios.get(req.url, { headers: req.headers, params: req.params });
        case 'POST':
            return axios.post(req.url, req.body, { headers: req.headers });
    }
}