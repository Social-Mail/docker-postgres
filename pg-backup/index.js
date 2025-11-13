if (process.argv.includes("--restore")) {
    await import("./dist/restore.js");
} else {
    await import("./dist/index.js");
}