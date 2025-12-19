pub enum Mode {
    Unknown,
    Help,
    Version,
    Server
}

pub enum DataFormat {
    CSV,
    JSON
}

pub struct DataOptions {
    futures_contracts: String,
    futures_calendar: String,
    futures_tick: String,
    futures_minute: String,
    futures_daily_rank: String,
    options_list: String,
    options_tick: String,
}

pub struct Config {
    pub mode: Mode,
    pub host: String,
    pub port: u16,
    pub config_file: String,
    pub data_source: String,
    pub data_format: DataFormat,
    pub data_options: DataOptions,
}

fn parse_setting(exp: String) -> (String, String) {
    let sep: Vec<&str> = exp.split('=').collect();
    (sep[0].to_string(), sep[1].to_string())
}

fn read_config_file(file: String, config: &mut Config) {
    // TODO: Load config from file 
}

impl Config {
    pub fn parse(args: std::env::Args) -> Config {
        let mut ret: Config = Config {
            mode: Mode::Server,
            host: String::from("localhost"),
            port: 8888,
            config_file: String::new(),
            data_source: String::from("api"),
            data_format: DataFormat::CSV,
            data_options: DataOptions {
                futures_contracts: String::new(),
                futures_calendar: String::new(),
                futures_tick: String::new(),
                futures_minute: String::new(),
                futures_daily_rank: String::new(),
                options_list: String::new(),
                options_tick: String::new(),
            },
        };
        let args = args.skip(1);
        let mut need_value_for: String = String::new();
        for arg in args {
            if arg == "--help" || arg == "-h" {
                ret.mode = Mode::Help;
                break;
            } else if arg == "--version" || arg == "-v" {
                ret.mode = Mode::Version;
                break;
            } else if arg == "--host" || arg == "-H" {
                need_value_for = String::from("host");
                continue;
            } else if arg == "--port" || arg == "-p" {
                need_value_for = String::from("port");
                continue;
            } else if arg == "--config" || arg == "-c" {
                need_value_for = String::from("config");
                continue;
            } else if arg == "--data-source" || arg == "-d" {
                need_value_for = String::from("data_source");
                continue;
            } else if arg == "--data-format" || arg == "-F" {
                need_value_for = String::from("data_format");
                continue;
            } else if arg == "--data-file" {
                need_value_for = String::from("data_file");
                continue;
            } else if arg == "--data-api" {
                need_value_for = String::from("data_api");
                continue;
            } else if need_value_for != "" {
                if need_value_for == "host" {
                    ret.host = arg;
                } else if need_value_for == "port" {
                    match arg.parse::<u16>() {
                        Ok(port) if port > 0 && port < 65535 => {
                            ret.port = port;
                        },
                        _ => {
                            ret.mode = Mode::Unknown;
                            eprintln!("Invalid port: {}", arg);
                            eprintln!("Run `qd-engine --help` for usage.");
                            break;
                        }
                    }
                } else if need_value_for == "config" {
                    ret.config_file = arg;
                    read_config_file(ret.config_file.clone(), &mut ret);
                } else if need_value_for == "data_source" {
                    let value_lower = arg.to_ascii_lowercase();
                    if value_lower == "file" || value_lower == "api" {
                        ret.data_source = value_lower;
                    } else {
                        ret.mode = Mode::Unknown;
                        eprintln!("Invalid data source: {}", arg);
                        eprintln!("Run `qd-engine --help` for usage.");
                        break;
                    }
                } else if need_value_for == "data_format" {
                    let upper = arg.to_ascii_uppercase();
                    if upper == "CSV" {
                        ret.data_format = DataFormat::CSV;
                    } else if upper == "JSON" {
                        ret.data_format = DataFormat::JSON;
                    } else {
                        ret.mode = Mode::Unknown;
                        eprintln!("Invalid data format: {}", arg);
                        eprintln!("Run `qd-engine --help` for usage.");
                        break;
                    }
                } else if need_value_for == "data_file" || need_value_for == "data_api" {
                    let (key, value) = parse_setting(arg);
                    match key.as_str() {
                        "futures_contracts" => {
                            ret.data_options.futures_contracts = value;
                        },
                        "futures_calendar" => {
                            ret.data_options.futures_calendar = value;
                        },
                        "futures_tick" => {
                            ret.data_options.futures_tick = value;
                        },
                        "futures_minute" => {
                            ret.data_options.futures_minute = value;
                        },
                        "futures_daily_rank" => {
                            ret.data_options.futures_daily_rank = value;
                        },
                        "options_list" => {
                            ret.data_options.options_list = value;
                        },
                        "options_tick" => {
                            ret.data_options.options_tick = value;
                        },
                        _ => {
                            ret.mode = Mode::Unknown;
                            eprintln!("Unknown data file/API key: {}", key);
                            eprintln!("Run `qd-engine --help` for usage.");
                            break;
                        }
                    }
                    
                } 
                need_value_for.clear();
            } else {
                ret.mode = Mode::Unknown;
                eprintln!("Unknown argument: {}", arg);
                eprintln!("Run `qd-engine --help` for usage.");
                break;
            }
        }

        if !need_value_for.is_empty() {
            ret.mode = Mode::Unknown;
            eprintln!("Missing value for option: --{}", need_value_for);
            eprintln!("Run `qd-engine --help` for usage.");
        }

        ret
    }
}


pub fn print_help() {
    println!("Usage: qd-engine [OPTIONS]");
    println!("Options:");
    println!("  -h, --help                 Display help information");
    println!("  -v, --version              Display version information");
    println!("  -H, --host <HOST>          Specify the host name to listen (default: localhost)");
    println!("  -p, --port <PORT>          Specify the port to listen (1-65535, default: 8888)");
    println!("  -c, --config <FILE>        Specify the config file (.json)");
    println!("The following options can be set in the config file:");
    println!("  -d, --data-source <SRC>    Specify the data source (file or api, default: api)");
    println!("  -F, --data-format <FMT>    Specify the data format (CSV or JSON, default: CSV)");
    println!("      --data-file <DATA=PATH>  Specify directory of data files (e.g., futures_tick=./ticks)");
    println!("      --data-api <DATA=URL>    Specify the data API (e.g., futures_tick=https://tabxx.net/api)");
}

pub fn print_version() {
    println!("QDEngine version 0.0.1;");
}