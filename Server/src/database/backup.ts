import fs from "fs";
import logger from "../logger";

export function Exists(dir: string): boolean {
    return fs.existsSync(dir);
}

function DirStruct(dir: string): Array<string> {
    return [
        dir,
        `${dir}/futures`,
        `${dir}/futures/contracts`
    ];
}

export function CheckBackupIntegrity(dir: string): boolean {
    let ret: boolean = true;
    DirStruct(dir).forEach((value: string, index: number, array: string[]) => {
        if (!Exists(value) || fs.readdirSync(value).length == 0) {
            ret = false;
            return;
        }
    });
    return ret;
}

export function CreateBackupDirectory(dir: string): void {
    const structure = DirStruct(dir);
    for (const d of structure) {
        if (!fs.existsSync(d)) {
            fs.mkdirSync(d);
            logger.info(`Created directory ${d}.`);
        }
    }
}

export async function CreateFuturesContractList(dir: string, exchange: string, data: string) {
    const file = `${dir}/futures/contracts/${exchange}_list.json`;
    fs.writeFile(file, data, (err) => {
        if (err) logger.error(`Error writing ${file}`, err);
    });
}

/**
 * @param dir Root of backup directory
 * @param exchange Exchange code in upper case
 * @param data An Array including contract information
 */
export function UpdateFuturesContractList(dir: string, exchange: string, data: Array<Array<any>>) {
    const file = `${dir}/futures/contracts/${exchange}_list.json`;
    fs.readFile(file, (err: NodeJS.ErrnoException | null, buffer: NonSharedBuffer) => {
        if (err) {
            logger.error(`Failed to read ${file}, error: ${err}`);
            return;
        }
        let old = JSON.parse(buffer.toString());
        for (const item of data)
            old.items.push(item);
        fs.writeFile(file, JSON.stringify(old), (err) => {
            if (err) logger.error(`Error writing ${file}`, err);
        });
    });
}

export function SetUpdateTime(dir: string, date: string): void {
    fs.writeFileSync(`${dir}/futures/contracts/update`, date);
}

export function GetUpdateTime(dir: string): string {
    if (Exists(`${dir}/futures/contracts/update`)) {
        return fs.readFileSync(`${dir}/futures/contracts/update`).toString();
    }
    else {
        return '';
    }
}