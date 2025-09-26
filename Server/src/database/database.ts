import dataService from "./dataService";
import config from "../config.json";

const database = dataService(config);

export async function getContractsList(exchange: string): Promise<any> {
    return database.getContractsList(exchange);
}