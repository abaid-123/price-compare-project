const { spawn } = require("child_process");
const path = require("path");

let scraperProcess = null;

const scraperStatus = {
running: false,
pid: null,
startedAt: null,
finishedAt: null,
query: null,
category: null,
logs: [],
error: null,
exitCode: null,
};

function addLog(message) {
const text = String(message || "").trim();

if (!text) {
return;
}

scraperStatus.logs.push(text);

if (scraperStatus.logs.length > 200) {
scraperStatus.logs = scraperStatus.logs.slice(-200);
}
}

function getStatus() {
return {
...scraperStatus,
logs: [...scraperStatus.logs],
};
}

function finishProcess(code = null, error = null) {
scraperStatus.running = false;
scraperStatus.pid = null;
scraperStatus.finishedAt = new Date().toISOString();
scraperStatus.exitCode = code;
scraperStatus.error = error;
scraperProcess = null;
}

const startScraper = (req, res) => {
if (scraperProcess || scraperStatus.running) {
return res.status(409).json({
message: "Scraper is already running",
status: getStatus(),
});
}

const body = req.body || {};

const query = String(body.query || "").trim();

const category =
String(body.category || "Search Results").trim() ||
"Search Results";

const maxPages = Math.max(
1,
Math.min(Number(body.maxPages) || 1, 5)
);

const maxProducts = Math.max(
1,
Math.min(Number(body.maxProducts) || 15, 100)
);

const runAllCategories =
body.runAllCategories === true;

const reset = body.reset === true;

const analyze = body.analyze !== false;

if (!runAllCategories && !query) {
return res.status(400).json({
message: "Search query is required",
});
}

const scraperPath = path.join(
__dirname,
"..",
"scraper",
"multi_store_scraper.py"
);

const pythonCommand =
process.env.PYTHON_BIN || "python";

const args = [
scraperPath,
"--max-pages",
String(maxPages),
"--max-products",
String(maxProducts),
];

if (runAllCategories) {
args.push("--all-categories");
} else {
args.push(
"--query",
query,
"--category",
category
);
}

if (reset) {
args.push("--reset");
}

if (!analyze) {
args.push("--skip-analysis");
}

scraperStatus.running = true;
scraperStatus.pid = null;
scraperStatus.startedAt =
new Date().toISOString();
scraperStatus.finishedAt = null;

scraperStatus.query = runAllCategories
? "ALL CATEGORIES"
: query;

scraperStatus.category = runAllCategories
? "ALL CATEGORIES"
: category;

scraperStatus.logs = [];
scraperStatus.error = null;
scraperStatus.exitCode = null;

try {
scraperProcess = spawn(
pythonCommand,
args,
{
cwd: path.join(__dirname, ".."),
shell: false,
env: {
...process.env,
PYTHONUNBUFFERED: "1",
},
}
);

```
scraperStatus.pid = scraperProcess.pid;
```

} catch (error) {
finishProcess(null, error.message);

```
return res.status(500).json({
  message: "Failed to start scraper",
  error: error.message,
});
```

}

scraperProcess.stdout.on("data", (data) => {
const output = data.toString();

```
console.log("Scraper Output: " + output);
addLog(output);
```

});

scraperProcess.stderr.on("data", (data) => {
const output = data.toString();

```
console.error("Scraper Error: " + output);
addLog("ERROR: " + output);
```

});

scraperProcess.on("error", (error) => {
console.error(
"Failed to start scraper:",
error.message
);

```
addLog("ERROR: " + error.message);

finishProcess(null, error.message);
```

});

scraperProcess.on("close", (code) => {
console.log(
"Scraper stopped with code " + code
);

```
addLog(
  "Scraper stopped with code " + code
);

finishProcess(
  code,
  code === 0
    ? null
    : "Scraper exited with code " + code
);
```

});

return res.status(202).json({
message:
"Multi-store scraper started successfully",
status: getStatus(),
});
};

const stopScraper = (req, res) => {
if (
!scraperProcess ||
!scraperStatus.running
) {
return res.status(409).json({
message:
"No scraper is currently running",
status: getStatus(),
});
}

const processId = scraperProcess.pid;

if (process.platform === "win32") {
const killProcess = spawn(
"taskkill",
[
"/PID",
String(processId),
"/T",
"/F",
],
{
shell: false,
}
);

```
killProcess.on("error", (error) => {
  console.error(
    "Failed to stop scraper:",
    error.message
  );

  addLog(
    "ERROR stopping scraper: " +
      error.message
  );
});
```

} else {
scraperProcess.kill("SIGTERM");
}

addLog("Stop requested by admin");

return res.status(200).json({
message: "Scraper stop request sent",
status: getStatus(),
});
};

const getScraperStatus = (req, res) => {
return res.status(200).json(getStatus());
};

module.exports = {
startScraper,
stopScraper,
getScraperStatus,

startDarazScraper: startScraper,
stopDarazScraper: stopScraper,
};
