#ifndef TABXX_QD_ARGV_HPP
#define TABXX_QD_ARGV_HPP

#include <string>

namespace tabxx::qd {

using string = std::string;

enum class Mode {
    Help,
    Live,
    Backtest,
    Replay
};

struct config {
    bool   ready = false;          // Start program
    Mode   mode = Mode::Help;      // Operation mode
    string config_file = "";       // [Optional] Configure file

}; // struct config

config parse_argv(int argc, char** argv);

void print_help();

} // namespace tabxx::qd

#endif //TABXX_QD_ARGV_HPP