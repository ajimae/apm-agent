const os = require("os");
const { eachLimit } = require("async");
const onHeaders = require("on-headers");

const _metrics = ["cpu", "path", "os", "user", "memory", "uptime"];

function stats(_config) {
  return async function (req, res, next) {
    try {
      const { config } = req.body;
      const result = await monitor(config || _config);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

function responseTime() {
  return function (req, res, next) {
    var start = process.hrtime();

    if (res._responseTime) return next();
    res._responseTime = true;

    onHeaders(res, function () {
      var duration = process.hrtime(start);
      var time = duration[0] * 1e3 + duration[1] * 1e-6;
      res.setHeader("X-Tesponse-Time", time + "ms");
    });

    next();
  };
}

async function monitor(config) {
  if (!config || (Array.isArray(config) && config.length == 0)) {
    // use default
    config = _metrics;
  }

  const output = {};
  const concurrency = config.length < 1 ? 1 : config.length;

  eachLimit(config, concurrency, (configName, cb) => {
    try {
      const _config = metrics[configName];
      _config.getMetrics()
        .then((result) => {
          output[_config.name] = result;
          return cb();
        })
        .catch((err) => {
          throw err;
        });
    } catch (err) {
      return cb(err);
    }
  });

  return output;
}

// async function asyncForEach(array, callback) {
//   for (let index = 0; index < array.length; index += 1) {
//     await callback(array[index], index, array)
//   }
// }

const metrics = {
  cpu: {
    name: "cpu",
    async getMetrics() {
      return {
        usage: process.cpuUsage(),
        cores: os.cpus(),
      };
    },
  },
  memory: {
    name: "memory",
    async getMetrics() {
      return {
        usage: process.memoryUsage(),
        total: os.totalmem(),
        free: os.freemem(),
      };
    },
  },
  os: {
    name: "os",
    async getMetrics() {
      return {
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        hostname: os.hostname(),
      };
    },
  },
  path: {
    name: "path",
    async getMetrics() {
      return {
        cwd: process.cwd(),
      };
    },
  },
  uptime: {
    name: "uptime",
    async getMetrics() {
      return {
        process: {
          uptime: process.uptime(),
          hrtime: process.hrtime(),
        },
        os: {
          uptime: os.uptime(),
        },
      };
    },
  },
  user: {
    name: "user",
    async getMetrics() {
      return {
        ...os.userInfo(),
      };
    },
  },
};

module.exports = {
  stats,
  responseTime,
  // metrics,
};
