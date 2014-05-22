var sim = require('../')(1.0);
var fs = require('fs');

fs.createReadStream(__dirname + '/grbl.gcode')
  .pipe(sim)
  .pipe(process.stdout)
