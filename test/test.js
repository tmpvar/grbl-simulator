var Simulator = require('../');
var fs = require('fs');

var sim = new Simulator(0.1);

sim.process.stdout.pipe(process.stdout);
sim.process.stderr.pipe(process.stdout);

fs.createReadStream(__dirname + '/grbl.gcode').pipe(sim.process.stdin);
