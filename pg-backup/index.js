if (process.argv.includes("--restore")) {
    await import("./dist/restore-db.js");
} else {
    await import("./dist/index.js");
}