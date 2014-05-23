var child = require('child_process'),
    through = require('through'),
    duplexer = require('duplexer'),
    split = require('split'),
    path = require('path'),
    dir = path.join(__dirname, 'deps', 'grbl', 'sim');

function createSimulator(interval, stepsPerMM) {
  interval = interval || 0.1;
  stepsPerMM = stepsPerMM || 250;

  var sim_process = child.spawn(path.join(dir, 'grbl_sim.exe'), [interval]);

  sim_process.on('open', function() {
    [0, 1, 2].forEach(function(i) {
      sim_process.stdin.write('$' + i + '=' + stepsPerMM + '\r\n');
    });
  });

  sim_process.stdout.pipe(process.stdout);

  return duplexer(
    sim_process.stdin,
    sim_process.stderr.pipe(split()).pipe(through(function(d) {
      d = d.trim();

      var parts = d.split(', ');

      if (d[0] !== '#' && parts.length) {

        var obj = {
          time : parseFloat(parts[0]),
          x : parseInt(parts[1]) / stepsPerMM,
          y : parseInt(parts[2]) / stepsPerMM,
          z : parseInt(parts[3]) / stepsPerMM
        };
        this.push(JSON.stringify(obj) + '\n');
      }
    })));

  return stream;
};

module.exports = createSimulator;
