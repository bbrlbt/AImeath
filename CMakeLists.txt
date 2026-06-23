cmake_minimum_required(VERSION 3.12)
project(demo LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_subdirectory(module/game)
add_subdirectory(module/core)
add_subdirectory(frontend/app/snake/backend)
add_subdirectory(frontend/app/gomoku/backend)
add_subdirectory(frontend/app/pacman/backend)
add_subdirectory(frontend/app/go/backend)
add_subdirectory(frontend/app/chat/backend)
add_subdirectory(backend)

add_executable(demo main.cpp)
target_include_directories(demo PRIVATE module/game/include module/core/include)
target_link_libraries(demo game core dl)
add_dependencies(demo game snake gomoku pacman go)

# 让运行 demo 时 dlopen 能找到 .so
set_target_properties(demo PROPERTIES
    BUILD_RPATH "${CMAKE_BINARY_DIR}/output/lib"
)
