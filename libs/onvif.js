os = require("os");

const { runOnvifScanner } = require("./scanner/utils.js");

exports.scan = async (req, res, next) => {
  console.log("scanning");

  let options = {
    //ip: ''
    // ip: '192.168.1.1-192.168.1.254,192.168.3.1-192.168.3.254'
    ip: "192.168.3.10-192.168.3.100",

    // port: '',
    // port: '80,81,82'
    port: "80",

    user: "admin",
    pass: "admin",
  };

  const scanedDevices = await runOnvifScanner(options);
  //console.log("scaned device" + scanedDevices);

  res.status(200).json({
    message: "scanning",
    devices: scanedDevices,
  });
};
