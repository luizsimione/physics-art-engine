#include "simulation.h"
#include <iostream>
#include <string>
#include <cstring>

struct SimulationConfig {
    int numParticles = 100;
    int steps = 1000;
    unsigned int seed = 42;
    std::string mode = "batch"; // "batch" or "stream"
    double dt = 0.01; // Time step
    bool showHelp = false;
};

void printHelp(const char* programName) {
    std::cout << "Generative Physics Art Engine - Simulation\n";
    std::cout << "Usage: " << programName << " [options]\n\n";
    std::cout << "Options:\n";
    std::cout << "  --particles <N>    Number of particles (default: 100)\n";
    std::cout << "  --steps <N>        Number of simulation steps (default: 1000)\n";
    std::cout << "  --seed <N>         Random seed for reproducibility (default: 42)\n";
    std::cout << "  --mode <mode>      Output mode: 'batch' or 'stream' (default: batch)\n";
    std::cout << "  --dt <value>       Time step size (default: 0.01)\n";
    std::cout << "  --help             Show this help message\n\n";
    std::cout << "Examples:\n";
    std::cout << "  " << programName << " --particles 50 --steps 500 --seed 123\n";
    std::cout << "  " << programName << " --mode stream --particles 100 --steps 1000\n";
}

SimulationConfig parseArguments(int argc, char* argv[]) {
    SimulationConfig config;
    
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        
        if (arg == "--help" || arg == "-h") {
            config.showHelp = true;
            return config;
        } else if (arg == "--particles" && i + 1 < argc) {
            config.numParticles = std::stoi(argv[++i]);
        } else if (arg == "--steps" && i + 1 < argc) {
            config.steps = std::stoi(argv[++i]);
        } else if (arg == "--seed" && i + 1 < argc) {
            config.seed = std::stoul(argv[++i]);
        } else if (arg == "--mode" && i + 1 < argc) {
            config.mode = argv[++i];
            if (config.mode != "batch" && config.mode != "stream") {
                std::cerr << "Error: mode must be 'batch' or 'stream'\n";
                exit(1);
            }
        } else if (arg == "--dt" && i + 1 < argc) {
            config.dt = std::stod(argv[++i]);
        } else {
            std::cerr << "Unknown argument: " << arg << "\n";
            std::cerr << "Use --help for usage information\n";
            exit(1);
        }
    }
    
    // Validate configuration
    if (config.numParticles <= 0) {
        std::cerr << "Error: Number of particles must be positive\n";
        exit(1);
    }
    if (config.steps <= 0) {
        std::cerr << "Error: Number of steps must be positive\n";
        exit(1);
    }
    if (config.dt <= 0) {
        std::cerr << "Error: Time step must be positive\n";
        exit(1);
    }
    
    return config;
}

int main(int argc, char* argv[]) {
    SimulationConfig config = parseArguments(argc, argv);
    
    if (config.showHelp) {
        printHelp(argv[0]);
        return 0;
    }
    
    // Create and run simulation
    try {
        Simulation sim(config.numParticles, config.seed);
        sim.run(config.steps, config.dt, config.mode);
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}
