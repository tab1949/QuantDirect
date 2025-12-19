mod args;

use std::process::ExitCode;

fn main() -> ExitCode {
    use args::Config;
    use args::Mode;

    let config = Config::parse(std::env::args());
    match config.mode {
        Mode::Help => args::print_help(),
        Mode::Version => args::print_version(),
        Mode::Server => {
            println!("This program is not completed...");
        }
        Mode::Unknown => {
            return ExitCode::FAILURE;
        }
    }
    ExitCode::SUCCESS
}