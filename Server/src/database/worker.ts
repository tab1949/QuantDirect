import { parentPort, workerData } from "worker_threads";
import logger from "../logger";
import fs from "fs";
import { getRequestData, fetchFromUpstream, DataType } from "./upstream";

const config = workerData;

function fetchCurrentFuturesList(): any {
    let requestData = getRequestData(config, DataType.FUTURES_LIST);
    // requestData.body.params.list_date = ret.Date;
    requestData.body.params.exchange = "DCE";
    fetchFromUpstream(requestData).then((resp) => {
        if (resp.data.code === 0) {
            logger.info(`DCE: updated ${resp.data.data.items.length} items.`);
            fs.writeFile('./test/data/list_DCE.json', JSON.stringify(resp.data.data), (err) => {
                if (err) logger.error("Error writing ./data/list_DCE.json:", err);
            });
        }
    });
    requestData.body.params.exchange = "CFFEX";
    fetchFromUpstream(requestData).then((resp) => {
        if (resp.data.code == 0) 
            logger.info(`CFFEX: updated ${resp.data.data.items.length} items.`);
    });
    requestData.body.params.exchange = "CZCE";
    fetchFromUpstream(requestData).then((resp) => {
        if (resp.data.code == 0) 
            logger.info(`CZCE: updated ${resp.data.data.items.length} items.`);
    });
    requestData.body.params.exchange = "GFEX";
    fetchFromUpstream(requestData).then((resp) => {
        if (resp.data.code == 0)
            logger.info(`GFEX: updated ${resp.data.data.items.length} items.`);
    });
    requestData.body.params.exchange = "INE";
    fetchFromUpstream(requestData).then((resp) => {
        if (resp.data.code == 0) 
            logger.info(`INE: updated ${resp.data.data.items.length} items.`);
    });
    requestData.body.params.exchange = "SHFE";
    fetchFromUpstream(requestData).then((resp) => {
        if (resp.data.code == 0) 
            logger.info(`SHFE: updated ${resp.data.data.items.length} items.`);
    });
}

parentPort?.on("message", (msg) =>  {
    switch(msg) {
    case "start":
        break;
    case "check-updates":
        let update = {
            market: "Futures, Stocks, ",
            type: "1min, ",
            info: "Market data updated."
        };
        parentPort?.postMessage(`Data update available.\nMarket: ${update.market};\nType: ${update.type};\nInfo: ${update.info}`);
        break;
    case "check-updates-lists":
        parentPort?.postMessage("Checking updates for tradable lists...");
        let futures = fetchCurrentFuturesList();
        parentPort?.postMessage(`Futures lists updated: ${JSON.stringify(futures)}`);
        break;
    default:
        logger.error(`Data worker: Unknown message: ${msg}`);
    }
});