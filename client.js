const { exec } = require("child_process");
const io = require("socket.io-client");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
dotenv.config({ path: "c:/client-file/config.env" });
console.log(`${process.env.IP}`, "ip");
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
let userName ="manav";

// i need username using whoami command synchroneously for my purpose
// i need to get the username of the user who is logged in
/// console.log(userName,"outside");

console.log(`C:\\Users\\${userName}\\Desktop\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\run.bat`);

const startupFolder = path.join(
  process.env.APPDATA,
  "Microsoft",
  "Windows",
  "Start Menu",
  "Programs",
  "Startup"
);
const filePath = path.join(startupFolder, "run.bat");

fs.watch(`${startupFolder}\\`, { recursive: true }, (eventType, filename) => {
  // console.log(`File or directory ${filename} has been ${eventType}`);
  if (fs.existsSync(filePath)) {
    console.log("run.bat found in startup folder");
  } else {
    console.log("run.bat not found in startup folder");
    socket.emit("change", {
      type: "Critical File Change",
      event: "deleted",
      item: "run.bat",
      comp_no: comp_no,
      comp_ip: comp_ip,
      lab_no,
      college,
      department,
      critical: true,
    });
  }
});

if (fs.existsSync(filePath)) {
  console.log("run.bat found in startup folder");
} else {
  // console.log("run.bat not found in startup folder");
  socket.emit("change", {
    type: "Critical File Change",
    event: "deleted",
    item: "run.bat",
    comp_no: comp_no,
    comp_ip: comp_ip,
    lab_no,
    college,
    department,
    critical: true,
  });
}
if(!fs.existsSync("C:\\client-file")){
  console.log("client-file not exist");
  socket.emit("change",{
    type:"Critical File Change",
    event:"deleted",
    item:"client-file",
    comp_no:comp_no,
    comp_ip:comp_ip,
    lab_no,
    college,
    department,
    critical:true
  });
}else{
  fs.watch("C:\\client-file", { recursive: true }, (eventType, filename) => {
    if(!fs.existsSync("C:\\client-file\\config.env")){
      console.log("config file not exist");
      socket.emit("change",{
    type:"Critical File Change",
    event:"deleted",
    item:"config.env",
    comp_no:comp_no,
    comp_ip:comp_ip,
    lab_no,
    college,
    department,
    critical:true
    });
  }
  if(!fs.existsSync("C:\\client-file\\client.js")){
    console.log("client js file not exist");
    socket.emit("change",{
  type:"Critical File Change",
  event:"deleted",
  item:"client.js",
  comp_no:comp_no,
  comp_ip:comp_ip,
  lab_no,
  college,
  department,
  critical:true
    });
  }
});
}
function createWatch(dirName) {
  console.log("watching", dirName);
  fs.watch(`${dirName}\\`, { recursive: true }, (eventType, filename) => {
    console.log(`File or directory ${filename} has been ${eventType}`);
    // console.log(`${dirName} has been ${eventType} for ${filename}`);
    if (eventType === "rename") {
      let oldPath = path.join(dirName, filename);
      let newPath = path.join(dirName, filename);
      if (!fs.existsSync(newPath)) {
        // console.log(`${oldPath} moved out of the pendrive or deleted.`);
        socket.emit("change", {
          type: "pendrive modification",
          // type: device,
          event: "removed",
          // lengthOfData: removedDevice.length,
          item: `${filename}`,
          comp_no: comp_no,
          comp_ip: comp_ip,
          lab_no,
          college,
          department,
        });
      } else {
        fs.stat(`${dirName}\\${filename}`, (err, stats) => {
          if (stats.size === 0) {
            // console.log(`${filename} is created`);
            socket.emit("change", {
              type: "pendrive modification",
              // type: device,
              event: "created",
              // lengthOfData: removedDevice.length,
              item: `${filename}`,
              comp_no: comp_no,
              comp_ip: comp_ip,
              lab_no,
              college,
              department,
            });
          } else {
            // console.log(`${filename} is Pasted`);
            socket.emit("change", {
              type: "pendrive modification",
              // type: device,
              event: "pasted something",
              // lengthOfData: removedDevice.length,
              item: `${filename}`,
              comp_no: comp_no,
              comp_ip: comp_ip,
              lab_no,
              college,
              department,
            });
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
  console.log(data.lab_no, lab_no, "retransmit");
  if (data.lab_no == lab_no) {
    console.log("retransmit");
    socket.emit("client", { comp_no, lab_no, college, department });
  }
});

socket.emit("client", { comp_no, lab_no, college, department });

socket.on("command", (data) => {
  exec(`${data.data}`, (error, stdout, stderr) => {
    console.log(error,stdout,stderr);
    if(stderr){
      socket.emit("output", {data:stderr,askedBy:data.askedBy});
    }else{
      socket.emit("output", {data:stdout,askedBy:data.askedBy});
    }
    if (error) {
      console.error(`exec error: ${error}`);
      socket.emit("output", {data:"Oops something went wrong",askedBy:data.askedBy});
      return;
    }
  });
});

let globalJSON = {};
const detectChangeAndEmit = (updatedDevice, currentDevice, device) => {
  // console.log(updatedDevice, "updated device",currentDevice, "current device");
  let insertedDevice = [];
  let removedDevice = [];

  Object.values(updatedDevice).forEach((device) => {
    if (!Object.values(currentDevice).includes(device)) {
      // console.log("inserted=========================", device);
      insertedDevice.push(device);
    }
  });
  Object.values(currentDevice).forEach((device) => {
    if (!Object.values(updatedDevice).includes(device)) {
      removedDevice.push(device);
    }
  });
  // console.log(insertedDevice, "inserted device");
  // console.log(removedDevice, "removed device");
  if (removedDevice.length) {
    let temp = {};
    let counter = 1;
    removedDevice.map((item) => {
      temp[`item${counter++}`] = item;
    });
    // if (device == "Pendrive") {
    //   isDriveFound = false;
    //   console.log("pendrive removed");
    // }
    socket.emit("change", {
      type: device,
      event: "removed",
      lengthOfData: removedDevice.length,
      item: temp,
      comp_no: comp_no,
      comp_ip: comp_ip,
      lab_no,
      college,
      department,
    });
  }
  // console.log(insertedDevice, "inserted device");
  if (insertedDevice.length) {
    if (device == "Pendrive") {
      exec("wmic logicaldisk get name", (error, stdout, stderr) => {
        // console.log("found",stdout);
        const arr = stdout.trim().split("\n");
        // console.log("current pendrive",globalJSON.pendrive);
        // console.log("watching",)
        // console.log("Watchable",);
        const total = arr.length;
        const inbuilt = total - Object.keys(globalJSON.pendrive).length;
        // console.log("inbuilt",inbuilt,total,Object.keys(globalJSON.pendrive).length);
        arr.forEach((item, index) => {
          if (index >= inbuilt && !isDriveFound) {
            console.log("found", item.trim());
            drive_letter = item.trim();
            isDriveFound = true;
            createWatch(item.trim());
          }
        });
      });
    }
    // console.log("Here");
    let temp = {};
    let counter = 1;
    insertedDevice.map((item) => {
      temp[`item${counter++}`] = item;
    });
    socket.emit("change", {
      type: device,
      event: "insert",
      lengthOfData: insertedDevice.length,
      item: temp,
      comp_no: comp_no,
      comp_ip: comp_ip,
      lab_no,
      college,
      department,
    });
  }
  insertedDevice = [];
  removedDevice = [];
  // console.log(insertedDevice, "inserted device");
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
        // console.log();
        temp = name[i].split("  ").filter((item) => item.trim() !== "");
        if (!isNaN(temp[1].trim())) {
          size1 = temp[1].trim() / 1024 / 1024 / 1024;
          size1 = size1.toFixed(2);
        } else {
          size1 = temp[1].trim();
        }
        updatedPendrive[`item${i}`] = temp[0].trim() + " (" + size1 + "GB)";
      }
      // currentPendrive = updatedPendrive;
      detectChangeAndEmit(updatedPendrive, currentPendrive, "Pendrive");
      currentPendrive = updatedPendrive;
      // console.log(currentPendrive, "current pendrive@@@",updatedPendrive);
      updatedPendrive = {};
      globalJSON.pendrive = currentPendrive;
      // detectChangeAndEmit(updatedPendrive, currentPendrive, "pendrive");
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
        socket.emit("change", {
          type: "printer",
          event: "changed",
          lengthOfData: Object.keys(printer).length,
          item: printer,
          comp_no,
          comp_ip,
          lab_no,
          college,
          department,
        });
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
  console.log("got request on client");
  console.log("askDeviceInfo", data);
  socket.emit("deviceInfo", { data: globalJSON, sendTo: data.askedBy });
  console.log("sent deviceInfo", globalJSON);
});

const time = 3000;
setInterval(detectPendrive, time);
setInterval(detectMouse, time);
setInterval(detectKeyboard, time);
setInterval(detectPrinter, time);
