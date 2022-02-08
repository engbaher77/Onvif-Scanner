var os = require("os");

const util = require("util");

const onvif = require("shinobi-onvif");

const { stringContains } = require("../common.js");

const ipRange = (start_ip, end_ip) => {
  var startLong = toLong(start_ip);
  var endLong = toLong(end_ip);
  if (startLong > endLong) {
    var tmp = startLong;
    startLong = endLong;
    endLong = tmp;
  }

  var rangeArray = [];
  var i;
  for (i = startLong; i <= endLong; i++) {
    rangeArray.push(fromLong(i));
  }
  return rangeArray;
};

const portRange = (lowEnd, highEnd) => {
  var list = [];
  for (var i = lowEnd; i <= highEnd; i++) {
    list.push(i);
  }
  return list;
};

//toLong taken from NPM package 'ip'
const toLong = (ip) => {
  var ipl = 0;
  ip.split(".").forEach(function (octet) {
    ipl <<= 8;
    ipl += parseInt(octet);
  });
  return ipl >>> 0;
};

//fromLong taken from NPM package 'ip'
const fromLong = (ipl) => {
  return (
    (ipl >>> 24) +
    "." +
    ((ipl >> 16) & 255) +
    "." +
    ((ipl >> 8) & 255) +
    "." +
    (ipl & 255)
  );
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

exports.runOnvifScanner = async (options) => {
  var ip = options.ip.replace(/ /g, "");
  var ports = options.port.replace(/ /g, "");
  // console.log(`port list ${ports}`)

  // If no ip provided
  if (options.ip === "") {
    // Get network interfaces
    var interfaces = os.networkInterfaces();

    // addresses [ '192.168.1.77', '192.168.3.165' ]
    var addresses = [];

    // Loop through each interface make sure it's IPv4
    for (var k in interfaces) {
      for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === "IPv4" && !address.internal) {
          addresses.push(address.address);
        }
      }
    }

    console.log("addresses", addresses);

    // address range [ '192.168.1.1-192.168.1.254', '192.168.3.1-192.168.3.254' ]
    const addressRange = [];

    // Get Address Range
    addresses.forEach(function (address) {
      if (address.indexOf("0.0.0") > -1) {
        return false;
      }
      var addressPrefix = address.split(".");
      delete addressPrefix[3];
      addressPrefix = addressPrefix.join(".");
      addressRange.push(`${addressPrefix}1-${addressPrefix}254`);
    });

    ip = addressRange.join(",");

    console.log("Ip list", ip);
  }

  // If No port Provided
  if (ports === "") {
    ports = "80,8080,8000,7575,8081,9080,8090,8999,8899";
  }

  // If ports Provided as 80 - 8899
  // Split and get range as array ports = [80, 81, 82, ..etc]
  if (ports.indexOf("-") > -1) {
    ports = ports.split("-");
    var portRangeStart = parseInt(ports[0]);
    var portRangeEnd = parseInt(ports[1]);
    ports = portRange(portRangeStart, portRangeEnd);
  }

  // If ports provided as 80, 8899, 8800
  // Split by comma sperated
  else {
    ports = ports.split(",");
  }

  var ipList = options.ipList;
  var onvifUsername = options.user || "";
  var onvifPassword = options.pass || "";

  // Loop throug ip list
  // ip 192.168.1.1-192.168.1.254,192.168.3.1-192.168.3.254
  // ip 192.168.1.1-192.168.1.254
  // generate list from low end to high end 192.168.1.1, x.x.x.2,3,4, ..etc
  ip.split(",").forEach(function (addressRange) {
    var ipRangeStart = addressRange[0];
    var ipRangeEnd = addressRange[1];
    if (addressRange.indexOf("-") > -1) {
      addressRange = addressRange.split("-");
      ipRangeStart = addressRange[0];
      ipRangeEnd = addressRange[1];
    } else {
      ipRangeStart = addressRange;
      ipRangeEnd = addressRange;
    }
    if (!ipList) {
      ipList = ipRange(ipRangeStart, ipRangeEnd);
    } else {
      ipList = ipList.concat(ipRange(ipRangeStart, ipRangeEnd));
    }
  });

  console.log(`ip list ${ipList}`);
  console.log(`port list ${ports}`);

  var hitList = [];
  ipList.forEach((ipEntry, n) => {
    ports.forEach((portEntry, nn) => {
      hitList.push({
        xaddr: "http://" + ipEntry + ":" + portEntry + "/onvif/device_service",
        user: onvifUsername,
        pass: onvifPassword,
        ip: ipEntry,
        port: portEntry,
      });
    });
  });

  //console.log(util.inspect(hitList, {showHidden: false, depth: null}))

  const responseList = [];
  await Promise.all(
    hitList.map(async (camera) => {
      try {
        var device = new onvif.OnvifDevice(camera);
        var info = await device.init();
        var date = await device.services.device.getSystemDateAndTime();
        var stream = await device.services.media.getStreamUri({
          ProfileToken: device.current_profile.token,
          Protocol: "RTSP",
        });
        var cameraResponse = {
          ip: camera.ip,
          port: camera.port,
          info: info,
          date: date,
          uri: stream.data.GetStreamUriResponse.MediaUri.Uri,
        };
        try {
          const camPtzConfigs = (await device.services.ptz.getConfigurations())
            .data.GetConfigurationsResponse;
          if (
            camPtzConfigs.PTZConfiguration &&
            (camPtzConfigs.PTZConfiguration.PanTiltLimits ||
              camPtzConfigs.PTZConfiguration.ZoomLimits)
          ) {
            cameraResponse.isPTZ = true;
          }
        } catch (err) {
          console.log(`[Onvif Scanner Error] ${err}`);
        }

        responseList.push(cameraResponse);

        //console.log(util.inspect(responseList, {showHidden: false, depth: null}))
      } catch (err) {
        console.log(`[Onvif Scanner Error] ${err}`);
      }
    })
  );

  // 3
  // 2
  // 1

  console.log("Finished async");
  return responseList;
};
