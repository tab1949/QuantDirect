mod args;

use std::process::ExitCode;

fn main() -> ExitCode {
    use args::Config;
    use args::Mode;

    let config = Config::parse(&mut std::env::args());
    
    match config.mode {
        Some(Mode::Help) => args::print_help(),
        Some(Mode::Version) => args::print_version(),
        Some(Mode::Server) => {
            println!("This program is not completed...");
        }
        None => {
            return ExitCode::FAILURE;
        }
    }
    return ExitCode::SUCCESS;
}