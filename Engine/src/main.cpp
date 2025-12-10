#include "argv.hpp"

int main(int argc, char** argv) {
    using namespace tabxx::qd;
    auto config = parse_argv(argc, argv);
    if (config.mode == Mode::Help) {
        print_help();
        if (config.ready)
            return 0;
        else
            return -1;
    }
    return 0;
}