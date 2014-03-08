var child = require('child_process'),
    through = require('through'),
    path = require('path'),
    fs = require('fs'),
    dir = path.join(__dirname, 'deps', 'grbl', 'sim');

var lineHandler = function() {
  var queue = '';
  return through(function(data) {
    queue += data.toString();
    var lines = queue.replace(/\r/g, '').split('\n');
    queue = lines.pop();

    while (lines.length) {
      var line = lines.shift();
      line && this.emit('data', line);
    };
  });
};

function Simulator(interval) {
  interval = interval || 0.1;


  var currentBlock = 0;
  this.positionStream = through(function(data) {
    if (data[0] === '#') {
      currentBlock = parseInt(data.split(' ').pop(), 10);
      return;
    }

    var parts = data.split(', ');

    var obj = {
      block : currentBlock,
      time: parseFloat(parts.shift()),
      x: parseInt(parts.shift(), 10),
      y: parseInt(parts.shift(), 10),
      z: parseInt(parts.shift(), 10),
    };

    this.emit('data', obj);
  });

  var sim_process = this.process = child.spawn(path.join(dir, 'grbl_sim.exe'), [interval]);

  sim_process.on('open', function() {
    console.log('open');
    [0, 1, 2].forEach(function(i) {
      sim_process.stdin.write('$' + i + '=1000\n');
    });
  });
  this.outputStream = lineHandler();
  this.process.stdout
    .pipe(this.outputStream);

  this.process.stderr
    .pipe(lineHandler())
    .pipe(this.positionStream);
};

Simulator.prototype.send = function(string) {
  this.process.stdin.write(string + '\r\n');
};

module.exports = Simulator;

