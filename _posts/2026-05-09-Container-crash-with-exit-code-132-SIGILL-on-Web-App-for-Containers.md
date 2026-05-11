---
title: "Container crash with exit code 132 (SIGILL) on Web App for Containers"
author_name: "Anthony Salemo"
tags:
    - Web App for Containers
    - Docker
    - Troubleshooting
    - Linux
categories:
    - Web App for Containers
    - Troubleshooting
    - Linux
header:
    teaser: /assets/images/azurelinux.png
toc: true
toc_sticky: true
date: 2026-05-11 12:00:00
---

This post will cover containers crashing with exit code 132 (SIGILL - Illegal Instruction) on Web App for Containers, typically caused by CPU architecture mismatches between Intel and AMD workers.

# Overview
On Azure App Service, the underlying infrastructure fleet includes workers with different CPU vendors - specifically **Intel** and **AMD** processors. App Service does not guarantee a specific CPU vendor or instruction set for any given worker. Over time, stamps may transition between hardware generations, and instance movements (due to scaling, platform maintenance, or rebalancing) can place your application on a worker with a different CPU architecture than the one it was previously running on.

If your container image was compiled with CPU-specific instructions (for example, using `-march=native` on an Intel build machine, or linking against libraries that use Intel-specific instruction sets like `AVX-512`), the container may crash immediately when placed on an AMD worker - or vice versa.

This crash presents itself as **exit code 132**, which corresponds to **signal 4 (SIGILL - Illegal Instruction)**. The container typically exits so quickly that no application logs (stdout/stderr) are produced.

# What does exit code 132 mean?
Exit code 132 is the result of the Linux kernel sending **SIGILL (signal 4)** to a process. This signal is raised when the CPU encounters an instruction it does not recognize or support.

The formula is: `128 + signal number = exit code`. So `128 + 4 = 132`.

Common reasons for SIGILL:
- The binary was compiled with `-march=native` on an Intel machine, which may enable **`AVX-512`**, **SSE4.2**, or other Intel-specific instructions that AMD processors do not support (or vice versa)
- Native extensions or shared libraries (`.so` files) were built targeting a specific CPU microarchitecture
- Compiled languages such as C, C++, Rust, or Go (with assembly) may embed architecture-specific instructions at build time
- Python packages with native C extensions (like `numpy`, `scipy`, `cryptography`, etc.) may have been compiled from source on a specific CPU architecture

# How this manifests on App Service
A typical scenario looks like this:

1. Your application runs without any issues on a worker with an Intel CPU
2. An instance movement occurs - this could be due to platform maintenance, scaling events, or worker rebalancing
3. Your container is placed on a worker with an AMD CPU
4. The container starts, but crashes immediately with exit code 132
5. The container enters a crash loop - every restart attempt results in the same exit code 132
6. Since the crash happens so fast, **no application logs are produced** - you may see messages like `Failed to get container logs` in diagnostic logging
7. HTTP traffic returns **503 errors** since the container never becomes healthy

If you look at **Diagnose and Solve Problems** or App Service Logs, you'll see entries similar to:

```
Container [containerName] for site [siteName] has exited, exit code: 132
```

This will repeat for every restart attempt. The container never successfully starts.

> **NOTE**: This issue is classified as an **application-level** issue, even though it is triggered by an infrastructure change (instance movement). App Service does not guarantee a specific CPU vendor, and applications should be built to run on any supported `x86-64` processor.

# Identifying the issue
To confirm this is a CPU architecture mismatch:

1. **Check the exit code** - Exit code 132 specifically indicates `SIGILL`. This is different from other common exit codes like 137 (OOM kill) or 139 (segfault)
2. **Check if an instance movement occurred** - Look at App Service diagnostic logs or **Diagnose and Solve Problems** to see if the worker changed around the time the crashes started
3. **Check if the application was previously healthy** - If the same image was running without issues and then suddenly started crashing with exit code 132 after a worker change, this strongly suggests a CPU architecture mismatch
4. **No application logs** - The process is killed by the kernel before it can write any output. If you see empty logs or "Failed to get container logs", combined with exit code 132, this is characteristic of `SIGILL`

# Resolution
The fix is to rebuild your container image so that it does **not** rely on CPU-specific instructions. The following steps should be taken:

**1. Use architecture-agnostic compiler flags**

If you're compiling code (C, C++, Rust, Go with assembly, etc.), use generic `x86-64` baseline target flags instead of architecture-specific ones:

```dockerfile
# Instead of this (targets the build machine's exact CPU):
RUN gcc -march=native -O2 -o myapp myapp.c

# Use this (targets the generic x86-64 baseline):
RUN gcc -march=x86-64 -O2 -o myapp myapp.c

# Or use x86-64-v2 for a slightly newer baseline (SSE4.2, SSSE3, POPCNT):
RUN gcc -march=x86-64-v2 -O2 -o myapp myapp.c
```

**2. Check for SIMD intrinsics**

If your application or its dependencies use SIMD (Single Instruction, Multiple Data) intrinsics, ensure **runtime CPU feature detection** is in place rather than compile-time assumptions. Many modern libraries support this - for example, checking for AVX support at runtime before using AVX instructions.

**3. Python with native extensions**

If you're using Python with packages that have native C extensions (such as `numpy`, `scipy`, `cryptography`, `pillow`, etc.):
- Use **pre-built wheels** from PyPI instead of building from source. Pre-built wheels target the generic `x86-64` baseline
- If you must build from source, ensure the build does not use `-march=native`
- Consider using packages from `conda-forge`, which are also built for generic `x86-64`

**4. Rust applications**

For Rust, ensure your `.cargo/config.toml` or build command does not specify a CPU-specific target:

```toml
# Avoid this:
[build]
rustflags = ["-C", "target-cpu=native"]

# Use this instead (or simply omit the target-cpu flag):
[build]
rustflags = ["-C", "target-cpu=x86-64"]
```

**5. Go applications**

Go applications are generally safe, as Go compiles to a generic `x86-64` target by default. However, if you're using **assembly files** (`.s` files) or **cgo** with C code that targets a specific CPU, verify those components are architecture-agnostic.

**6. Push a new image and restart**

After rebuilding your image:
1. Push the new image to your container registry with a new tag
2. Update the Web App for Containers configuration to use the new image tag
3. The new image will be pulled

# Additional considerations
- **Multi-stage builds**: If you use multi-stage Docker builds, ensure the **build stage** uses generic compiler flags, not just the final stage
- **Base images**: Some base images may include pre-compiled binaries that target specific architectures. If you're using a niche or heavily optimized base image, verify it's compatible with both Intel and AMD x86-64 processors
- **Third-party binaries**: If your Dockerfile downloads pre-compiled binaries (rather than building from source), ensure those binaries target the generic x86-64 baseline
- **Testing**: To test locally, you can use `objdump -d <binary> | grep -i avx512` (or other instruction sets) to check if your binary contains architecture-specific instructions
