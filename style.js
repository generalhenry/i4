//style
var stylus = require('stylus'), fs = require('fs'),
  str = fs.readFileSync(__dirname + '/stylus/stylesheets/style.styl', 'utf8');

stylus(str)
  .set('filename', __dirname + '/public/stylesheets/style.css')
  .set('paths', [__dirname, __dirname + '/stylus'])
  .set('compress', true)
  .import('stylus/jquery-ui-1.8.9.MCi')
  .import('stylus/MCi')
  .import('stylus/Boiler')
  .import('stylus/css3')
  .render(function(err, css){
    if (err) throw err;
    console.log(css);
    fs.writeFile(__dirname + '/public/stylesheets/style.css', css, function (err) {
      if (err) throw err;
      console.log('It\'s saved!');
    });
  });