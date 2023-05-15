const { exec } = require("child_process");
const io = require("socket.io-client");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { exit } = require("process");
dotenv.config({ path: "./config.env" });
const socket = io("http://" + process.env.IP + ":" + process.env.PORT);

var comp_no = process.env.COMP_NO,
  comp_ip = "",
  lab_no = process.env.LAB_NO + "",
  college = process.env.COLLEGE + "",
  department = process.env.BRANCH + "";
let isDriveFound = false;
let drive_letter;
let currentPendrive = {};
let updatedPendrive = {};
let currentMouse = {};
let updatedMouse = {};
let currentKeyboard = {};
let updatedKeyboard = {};


const sendChangeSocket = (type,event,lengthOfData=1,item,critical) => {
  socket.emit("change", {
		type,
		event,
		lengthOfData,
		item,
		comp_no,
		comp_ip,
		lab_no,
		college,
		department,
		critical,
		date: `${new Date().getTime()}`,
		time: `${new Date().toLocaleTimeString("en-US", { hour12: true })}`,
	});
}


const startupFolder = path.join(
  process.env.APPDATA,
  "Microsoft",
  "Windows",
  "Start Menu",
  "Programs",
  "Startup"
);
const filePath = path.join(startupFolder, "run.vbs");

fs.watch(`${startupFolder}\\`, { recursive: true }, (eventType, filename) => {
  if (!fs.existsSync(filePath)) {
    sendChangeSocket("Critical File Change","deleted","run file",true);
  }
});

if (!fs.existsSync(filePath)) {
  sendChangeSocket("Critical File Change","deleted","run file",true);
}
if(!fs.existsSync("C:\\client-file")){
  sendChangeSocket("Critical File Change","deleted","client-file",true);
}else{
  fs.watch("C:\\client-file", { recursive: true }, (eventType, filename) => {
    if(!fs.existsSync("C:\\client-file\\config.env")){
      sendChangeSocket("Critical File Change","deleted","config.env",true);
  }
  if(!fs.existsSync("C:\\client-file\\client.js")){
    sendChangeSocket("Critical File Change","deleted","client.js",true);
  }
});
}
function createWatch(dirName) {
  fs.watch(`${dirName}\\`, { recursive: true }, (eventType, filename) => {
    if (eventType === "rename") {
      let oldPath = path.join(dirName, filename);
      let newPath = path.join(dirName, filename);
      if (!fs.existsSync(newPath)) {
        sendChangeSocket("pendrive modification on" + dirName, "removed", filename, false);
      } else {
        fs.stat(`${dirName}\\${filename}`, (err, stats) => {
          if (stats.size === 0) {
            sendChangeSocket("pendrive modification on" + dirName, "created", filename, false);
          } else {
            sendChangeSocket("pendrive modification on" + dirName, "pasted something", filename, false);
          }
        });
      }
    }
  });
}

socket.on("connect", () => {
  console.log("connected to server");
});

socket.on("retransmit", (data) => {
  if (data.lab_no == lab_no) {
    socket.emit("client", { comp_no, lab_no, college, department });
  }
});

socket.emit("client", { comp_no, lab_no, college, department });

socket.on("duplicate",(nullObj)=>{
  console.log("so i am duplicate ahhhhh who started before me bad people 🥺🥺🥺🥺🥺");
  exit();
})

socket.on("command", (data) => {
  exec(`${data.data}`, (error, stdout, stderr) => {
    console.log(error,stdout,stderr);
    if(stderr){
      socket.emit("output", {data:stderr,askedBy:data.askedBy});
      sendChangeSocket("Code output",stdout,data.data,false);
    }else{
      socket.emit("output", {data:stdout,askedBy:data.askedBy});
      sendChangeSocket("Code output",stdout,data.data,false);
    }
    if (error) {
      console.error(`exec error: ${error}`);
      socket.emit("output", {data:"Oops something went wrong",askedBy:data.askedBy});
      return;
    }
  });
});

let globalJSON = {};
const detectChangeAndEmit = (updatedDevice, currentDevice, device_name) => {
  let insertedDevice = [];
  let removedDevice = [];

  Object.values(updatedDevice).forEach((device) => {
    if (!Object.values(currentDevice).includes(device)) {
      insertedDevice.push(device);
    }
  });
  Object.values(currentDevice).forEach((device) => {
    if (!Object.values(updatedDevice).includes(device)) {
      removedDevice.push(device);
    }
  });
  if (removedDevice.length) {
    let temp = {};
    let counter = 1;
    removedDevice.map((item) => {
      temp[`item${counter++}`] = item;
    });
    sendChangeSocket(device_name,`removed ${device_name}`,removedDevice.length,temp,false);
  }
  if (insertedDevice.length) {
    if (device_name == "Pendrive") {
      exec("wmic logicaldisk get name", (error, stdout, stderr) => {
        const arr = stdout.trim().split("\n");
        const total = arr.length;
        const inbuilt = total - Object.keys(globalJSON.pendrive).length;
        arr.forEach((item, index) => {
          if (index >= inbuilt && !isDriveFound) {
            drive_letter = item.trim();
            isDriveFound = true;
            createWatch(item.trim());
          }
        });
      });
    }
    let temp = {};
    let counter = 1;
    insertedDevice.map((item) => {
      temp[`item${counter++}`] = item;
    });
    sendChangeSocket(device_name,`inserted ${device_name}`,insertedDevice.length,temp,false);
  }
  insertedDevice = [];
  removedDevice = [];
};
const detectPendrive = () => {
  exec(
    "wmic diskdrive where \"InterfaceType='USB'\" get Caption,Size",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      const name = stdout.trim().split("\n");
      let temp, size1;
      for (let i = 1; i < name.length; i++) {
        temp = name[i].split("  ").filter((item) => item.trim() !== "");
        if (!isNaN(temp[1].trim())) {
          size1 = temp[1].trim() / 1024 / 1024 / 1024;
          size1 = size1.toFixed(2);
        } else {
          size1 = temp[1].trim();
        }
        updatedPendrive[`item${i}`] = temp[0].trim() + " (" + size1 + "GB)";
      }
      detectChangeAndEmit(updatedPendrive, currentPendrive, "Pendrive");
      currentPendrive = updatedPendrive;
      updatedPendrive = {};
      globalJSON.pendrive = currentPendrive;
    }
  );
};

const detectMouse = () => {
  exec(
    "wmic path Win32_PointingDevice get Caption",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      const name = stdout.trim().split("\n");
      name.forEach((element, index) => {
        if (element && element.trim() !== "Caption") {
          updatedMouse[`item${index}`] = element.trim();
        }
      });

      detectChangeAndEmit(updatedMouse, currentMouse, "Mouse");
      currentMouse = updatedMouse;
      updatedMouse = {};

      globalJSON.mouse = currentMouse;
    }
  );
};

const detectKeyboard = () => {
  exec("wmic path Win32_Keyboard get Caption", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    const name = stdout.trim().split("\n");
    const keyboard = {};
    name.forEach((element, index) => {
      if (element && element.trim() !== "Caption") {
        updatedKeyboard[`item${index}`] = element.trim();
      }
    });

    detectChangeAndEmit(updatedKeyboard, currentKeyboard, "Keyboard");
    currentKeyboard = updatedKeyboard;
    updatedKeyboard = {};
    globalJSON.keyboard = currentKeyboard;
  });
};

const detectPrinter = () => {
  let old_printer = {};
  let printer = {};
  exec(
    "wmic printer where \"portname like 'USB%'\" get name, portname, drivername",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      var info = stdout.trim();

      var printer = {};
      if (JSON.stringify(old_printer) != JSON.stringify(printer)) {
        sendChangeSocket("Printer",`changed Printer`,Object.keys(printer).length,printer,true);
      }
    }
  );
};

const detectIP = () => {
  let old_ip;
  exec('ipconfig | findstr /i  "ipv4"', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    const ipaddress = stdout.split("\n");
    const ip = {};
    ipaddress.forEach((element, index) => {
      if (element) {
        ip[`ip${index}`] = element.split(": ")[1];
      }
    });
    comp_ip = ip["ip1"];
    if (JSON.stringify(old_ip) === JSON.stringify({})) {
      old_ip = ip;
      socket.emit("change_in_ip", { event: "detected", ip, main: ip.ip1 });
    } else if (JSON.stringify(old_ip) !== JSON.stringify(ip)) {
      if (JSON.stringify(ip) === JSON.stringify({})) {
        socket.emit("change_in_ip", { event: "removed", ip });
      } else {
        socket.emit("change_in_ip", { event: "changed", ip });
      }
      old_ip = ip;
    }
    globalJSON.ip = ip;
  });
};

detectIP();
detectPendrive();
detectMouse();
detectKeyboard();
detectPrinter();

socket.on("askDeviceInfo", (data) => {
  socket.emit("deviceInfo", { data: globalJSON, sendTo: data.askedBy });
});

const time = 3000;
setInterval(detectPendrive, time);
setInterval(detectMouse, time);
setInterval(detectKeyboard, time);
setInterval(detectPrinter, time);

process.on("uncaughtException", (err) => {
	console.log("an uncaught error caught is " + err);
	console.log(err.stack);
});
