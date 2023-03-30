const { exec } = require("child_process");
const io = require("socket.io-client");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
console.log(`${process.env.IP}`, "ip");
const socket = io("http://"+process.env.IP+":"+process.env.PORT);
var comp_no = process.env.COMP_NO,
  comp_ip = "",
  lab_no = process.env.LAB_NO+"",
  college = process.env.COLLEGE+"",
  department = process.env.BRANCH+"";

socket.on("connect", () => {
  console.log("connected to server");
});

socket.on("retransmit", (data) => {
  console.log(data.lab_no, lab_no, "retransmit");
  if (data.lab_no == lab_no) {
    console.log("retransmit");
    socket.emit("client", { comp_no, lab_no , college , department});
  }
});

socket.emit("client", { comp_no, lab_no ,college , department });

socket.on("command", (data) => {
  exec(data.command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    socket.emit("output", stdout);
  });
});

let globalJSON = {};
let old_pendrive = {};
let old_mouse = {};
let old_keyboard = {};
let old_printer = {};
let old_ip = {};
let just_started = true;

const detectPendrive = () => {
  exec(
    "wmic diskdrive where \"InterfaceType='USB'\" get Caption,Size",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      const [caption, size] = stdout.trim().split("\n");
      const pendrive = {};
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
        pendrive[`item${i}`] = temp[0].trim() + " (" + size1 + "GB)";
      }
      if (
        JSON.stringify(old_pendrive) == JSON.stringify({}) &&
        JSON.stringify(pendrive) !== JSON.stringify({})
      ) {
        old_pendrive = pendrive;
        if (just_started) {
          socket.emit("change", {
            type: "pendrive",
            event: "insert",
            lengthOfData: Object.keys(pendrive).length,
            item: pendrive,
            comp_no: comp_no,
            comp_ip: comp_ip,
            lab_no,
            college,
            department
          });
        } else {
          socket.emit("change", {
            type: "pendrive",
            event: "insert",
            item: pendrive.item1,
            comp_no: comp_no,
            comp_ip: comp_ip,
            lab_no,
            college,
            department
          });
        }
      } else if (JSON.stringify(old_pendrive) !== JSON.stringify(pendrive)) {
        if (JSON.stringify(pendrive) === JSON.stringify({})) {
          for (key in old_pendrive) {
            if (pendrive[key] !== old_pendrive[key]) {
              removed = key;
            }
          }
          socket.emit("change", {
            type: "pendrive",
            event: "removed",
            item: old_pendrive[removed],
            comp_no: comp_no,
            comp_ip: comp_ip,
            lab_no,
            college,
            department
          });
        } else {
          let inserted, removed;
          if (
            JSON.stringify(old_pendrive).length >=
            JSON.stringify(pendrive).length
          ) {
            for (key in old_pendrive) {
              if (!pendrive[key]) {
                removed = key;
              }
            }
            socket.emit("change", {
              type: "pendrive",
              event: "removed",
              item: old_pendrive[removed],
              comp_no: comp_no,
              comp_ip: comp_ip,
              lab_no,
              college,
              department
            });
          } else if (
            JSON.stringify(old_pendrive).length <
            JSON.stringify(pendrive).length
          ) {
            for (key in pendrive) {
              if (!old_pendrive[key]) {
                inserted = key;
              }
            }
            socket.emit("change", {
              type: "pendrive",
              event: "insert",
              item: pendrive[inserted],
              comp_no: comp_no,
              comp_ip: comp_ip,
              lab_no,
              college,
              department
            });
          } else {
            socket.emit("change", {
              type: "pendrive",
              event: "changed",
              lengthOfData: Object.keys(pendrive).length,
              item,
              comp_no: comp_no,
              comp_ip: comp_ip,
              lab_no,
              college,
              department
            });
          }
        }
        old_pendrive = pendrive;
      }
      globalJSON.pendrive = pendrive;
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
      const mouse = {};
      name.forEach((element, index) => {
        if (element && element.trim() !== "Caption") {
          mouse[`item${index}`] = element.trim();
        }
      });
      if (JSON.stringify(old_mouse) === JSON.stringify({})) {
        old_mouse = mouse;
        if (just_started) {
          socket.emit("change", {
            type: "mouse",
            event: "insert",
            lengthOfData: Object.keys(mouse).length,
            item: mouse,
            comp_no: comp_no,
            comp_ip: comp_ip,
            lab_no,
            college,
            department
          });
        } else {
          socket.emit("change", {
            type: "mouse",
            event: "insert",
            item: mouse.item1,
            comp_no: comp_no,
            comp_ip: comp_ip,
            lab_no,
            college,
            department
          });
        }
      } else if (JSON.stringify(old_mouse) !== JSON.stringify(mouse)) {
        if (JSON.stringify(mouse) === JSON.stringify({})) {
          socket.emit("change", {
            type: "mouse",
            event: "removed",
            item: old_mouse.item1,
            comp_no: comp_no,
            comp_ip: comp_ip,
            lab_no,
            college,
            department
          });
        } else {
          let inserted, removed;
          if (
            JSON.stringify(old_mouse).length >= JSON.stringify(mouse).length
          ) {
            for (key in old_mouse) {
              if (!mouse[key]) {
                removed = key;
              }
            }
            socket.emit("change", {
              type: "mouse",
              event: "removed",
              item: old_mouse[removed],
              comp_no: comp_no,
              comp_ip: comp_ip,
              lab_no,
              college,
              department
            });
          } else if (
            JSON.stringify(old_mouse).length < JSON.stringify(mouse).length
          ) {
            for (key in mouse) {
              if (!old_mouse[key]) {
                inserted = key;
              }
            }
            socket.emit("change", {
              type: "mouse",
              event: "insert",
              item: mouse[inserted],
              comp_no: comp_no,
              comp_ip: comp_ip,
              lab_no,
              college,
              department
            });
          } else {
            socket.emit("change", {
              type: "mouse",
              event: "changed",
              lengthOfData: Object.keys(mouse).length,
              item,
              comp_no: comp_no,
              comp_ip: comp_ip,
              lab_no,
              college,
              department
            });
          }
        }
        old_mouse = mouse;
      }
      globalJSON.mouse = mouse;
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
        keyboard[`item${index}`] = element.trim();
      }
    });
    if (JSON.stringify(old_keyboard) === JSON.stringify({})) {
      old_keyboard = keyboard;
      socket.emit("change", {
        type: "keyboard",
        event: "insert",
        lengthOfData: Object.keys(keyboard).length,
        item: keyboard,
        comp_no,
        comp_ip,
        lab_no,
        college,
        department
      });
    } else if (JSON.stringify(old_keyboard) !== JSON.stringify(keyboard)) {
      if (JSON.stringify(keyboard) === JSON.stringify({})) {
        socket.emit("change", {
          type: "keyboard",
          event: "removed",
          item: old_keyboard.item1,
          comp_no,
          comp_ip,
          lab_no,
          college,
          department
        });
      } else {
        let inserted, removed;
        if (
          JSON.stringify(old_keyboard).length >= JSON.stringify(keyboard).length
        ) {
          for (key in old_keyboard) {
            if (!keyboard[key]) {
              removed = key;
            }
          }
          socket.emit("change", {
            type: "keyboard",
            event: "removed",
            item: old_keyboard[removed],
            comp_no,
            comp_ip,
            lab_no,
            college,
            department
          });
        } else if (
          JSON.stringify(old_keyboard).length < JSON.stringify(keyboard).length
        ) {
          for (key in keyboard) {
            if (!old_keyboard[key]) {
              inserted = key;
            }
          }
          socket.emit("change", {
            type: "keyboard",
            event: "insert",
            item: keyboard[inserted],
            comp_no,
            comp_ip,
            lab_no,
            college,
            department
          });
        } else {
          socket.emit("change", {
            type: "keyboard",
            event: "changed",
            lengthOfData: Object.keys(keyboard).length,
            item: keyboard,
            comp_no,
            comp_ip,
            lab_no,
            college,
            department
          });
        }
      }
    }
    old_keyboard = keyboard;
    globalJSON.keyboard = keyboard;
  });
};

const detectPrinter = () => {
  exec(
    "wmic printer where \"portname like 'USB%'\" get name, portname, drivername",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      var info = stdout.trim();

      var printer = {};
      if(JSON.stringify(old_printer) != JSON.stringify(printer)){
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
  socket.emit("deviceInfo", {data:globalJSON,sendTo:data.askedBy});
  console.log("sent deviceInfo", globalJSON);
});

const time = 1000;
setInterval(detectPendrive, time);
setInterval(detectMouse, time);
setInterval(detectKeyboard, time);
setInterval(detectPrinter, time);
