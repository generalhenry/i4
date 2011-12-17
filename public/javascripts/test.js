//helpers
var console = console || { log : function() {return false;}};

//ready function
$(document).ready(function(){
  //show options
  $('#headcontent, #footcontent').slideDown(1200);
  $('#loading').fadeOut(1500);
  
  //globals
  var connect = false;
  var trying;
  var user = store.get('user');
  var users = {};
  users.count = 0;
  
  //test
  /*$().toastmessage('showToast', {
    text     : 'Some information for you ...',
    sticky   : true,
    type     : 'notice'
  });*/
  
  //socket connection
  var socket = new io.Socket(); 
  $().toastmessage('showNoticeToast', 'trying to connect');
  socket.connect();
  socket.on('connect', function(){ 
    connect = true; 
    $().toastmessage('showSuccessToast', 'connected');
    socket.send('string!');
    //console.log('string!');
    if(store.get('user') && store.get('sid'))
    {
      //console.log({type:'login',user:store.get('user'),sid:store.get('sid')});
      socket.send({type:'login',user:store.get('user'),sid:store.get('sid')});
    }
  });
  socket.on('message',function(msg){
    console.log(msg);
    switch(msg.type)
    {
      case 'notice':
        $().toastmessage('showNoticeToast', msg.message);
        break;
      case 'warning':
        $().toastmessage('showWarningToast', msg.message);
        break;
      case 'login':
        $('#loading').hide();
        if(msg.success)
        {
          //console.log('success');
          if(msg.sid != 'temp')
          {
            store.set('user',msg.user);
            store.set('sid', msg.sid);
          }
          $('#loginbox').slideUp(100,function(){
            $('#login').removeClass('active');
            $('#login').removeClass('login').addClass('logout');
          });
        }
        else
        {
          user = null
          store.remove('user');
          store.remove('sid');
          $().toastmessage('showWarningToast', msg.message);
        }
        break;
      case 'logout':
        user = null;
        store.remove('user');
        store.remove('sid');
        $('#login').removeClass('logout').addClass('login');
        break;
      case 'user':
        if(msg.add)
          countInc(msg.user);
        else
          countDec(msg.user);
        break;
      case 'load':
        $('#content').load(msg.url,function(){
          draw();
        });
        break;
      case 'boxstart':
        draw.bstart(msg);
        break;
      case 'boxmove':
        draw.bmove(msg);
        break;
      case 'boxup':
        draw.bup(msg);
        break; 
      case 'report':
        (function(){
          var nine;
          $('#dialog-report').html('');
          var header = $('<div class=header></div>');
          var activity = $('<div class=activity>' + msg.activity + '</div>');
          header.append(activity);
          var date = $('<div class=date>' + (new Date()).toDateString() + '</div>');
          header.append(date);
          var score = $('<div class=score></div>');
          score.append('Score: '+msg.correct+' / '+msg.total);
          if(msg.total)
          {
            var progressbar = $('<div class="progessbar no-print"></div>');
            var value = (msg.correct / msg.total) * 100;
            console.log(value);
            progressbar.progressbar({
              value: value
            });
            score.append(progressbar);
          }
          header.append(score);
          $('#dialog-report').append(header);
          var table = $('<table></table>');
          var head = $('<tr></tr>');
          head.append('<th>Problem<br>Number</th>');
          for(var j = 0; j < msg.headers.length; j++)
          {
            head.append('<th>'+msg.headers[j].value+'</th>');
          }
          table.append(head);
          for(var i = 0; i < msg.dataarray.length; i++)
          {
            var row = $('<tr></tr>');
            if(msg.dataarray[i].correct)
            {
              row.addClass('correct');
            }
            else
            {
              row.addClass('incorrect');
            }
            row.append('<td>'+(i+1)+'</td>');
            for(var j = 0; j < msg.headers.length; j++) {
              if( msg.headers[j].key === 'nine' ) {
                nine = $('<td></td>');
                nine.append('<span>' + msg.dataarray[i]['nine'][0] + '</span>');
                nine.append(' = ');
                nine.append('<span>' + msg.dataarray[i]['nine'][1] + '</span>');
                nine.append(msg.dataarray[i]['nine'][4]  ? ' + ' : ' &ndash; ');
                nine.append('<span>' + msg.dataarray[i]['nine'][2] + '</span>');
                nine.find('span').eq(msg.dataarray[i]['nine'][3] ).html(' &nbsp; ').addClass('blank');
                row.append(nine);
              } else {
                row.append('<td>'+msg.dataarray[i][msg.headers[j].key]+'</td>');
              }
            }
            table.append(row);
          }
          $('#dialog-report').append(table);
          $('#dialog-report').css('max-height',$('#main').height());
          $('#dialog-report').dialog({
            modal: true,
            title: msg.activity + ' Report',
            width: 'auto',
            height: 'auto',
            buttons: {
              ok: function(){
                $(this).dialog('close');
              },
              print: function() {
                $("#dialog-report").printElement({ pageTitle: msg.activity + ' Report' });
              }
            }
          });
        })();
        break;
    }
    if(msg.count)
    {
      $('#chatcount').text(msg.count);
    }
  });
  socket.on('disconnect', function(){
    connect = false;
    user = null;
    users = {};
    users.count = 0;
    $('#chatwindow').html('');
    $('#chatcount').html(0);
    $('#login').removeClass('logout').addClass('login');
    trying = setTimeout(tryconnect,500);
  });
  function tryconnect(){
    if(!connect)
    {
      $().toastmessage('showWarningToast', 'disconnected, trying to reconnect. . .');
      socket.connect();
      clearTimeout(trying);
      trying = setTimeout(tryconnect,30000);
    }
  }
  function countInc(usr){
    if(!users[usr] && usr != user)
    {
      users[usr] = true;
      $('#chatcount').text(++users.count);
      var div = $('<div>'+usr+'</div>');
      div.click(function(){
        var usr = $(this).text();
        socket.send({'type':'ping',user:usr});
      });
      $('#chatwindow').prepend(div);
    }
  }
  function countDec(usr){
    if(users[usr])
    {
      delete users[usr];
      $('#chatcount').text(--users.count);
      $('#chatwindow :contains('+usr+')').remove();
    }
  }
  $('#login:not(.active)').live('click',function(){
    if($('#login').hasClass('logout'))
    {
      socket.send({'type':'logout'});
      user = null;
      store.remove('user');
      store.remove('sid');
      $('#login').removeClass('logout').addClass('login');
    }
    else
    {
      $('#login').addClass('active');
      $('#loginbox').slideDown(100);
    }
  });
  $('#login.active').live('click',function(){
    $('#loginbox').slideUp(100,function(){
      $('#login').removeClass('active');
    });
  });
  $('#loginform form').submit(function(event){
    if($('input#loginuser').val() && $('input#loginpassword').val())
    {
      user = $('input#loginuser').val();
      var password = $('input#loginpassword').val();
      socket.send({'type':'login', 'user': user, 'password': password, 'rememberme':true});
      //$('#loading').show();
    }
    event.preventDefault();
    return false;
  });
  $('#chatcount').click(function(){
    $('#chatwindow').slideToggle(200);
  });
  $('a').live('click',function(e){
    e.preventDefault();
    var href = $(this).attr('href')
    $('#dialog-message').dialog('close');
    $('#main').slideUp(200,function(){
      $('#content').load(href, function(){
        $('#main').slideDown(300, 'linear');
        if(href == '/factfam')
        {
          initsetclouds();
        }
        if(href == '/equivfrac')
        {
          draw();
        }
      });
    })
    return false;
  });
  $('#options').click(function(){
    socket.send({type:'factfamreport'});
  });
  general();
  var draw = function(){
    //parameters
    var padding = 10;
    var width = (($('body').width()*.9)/3 )-10-padding*2;
    var height = width / 8;
    var curve = 2;
    var types = 9;
    var start = 2;
    var boxes = [];
    var texts = [];
    var ghosts = {};
    var clones = {};
    var place;
    var fills = { 
      2 : '#E3004F',
      3 : '#3D0093', 
      4 : '#FF5B00',
      5 : '#2230D3',
      6 : '#E0E43B',
      8 : '#73EC5A',
      9 : '#C5DFFF',
      10 : '#537BE3',
      12 : '#17D92E'
    };
    //paper
    $('#notepad').html('');
    var paper = Raphael("notepad", width*3+padding*2, height*(types)+padding*2);
    //icon!
    var ipaper = Raphael("logos", Math.min(800,$('body').width()) - $('#footinfo').width(),41);
    var nodejsi = ipaper.path(icons.nodejs).attr({fill: "#2230D3", stroke: "none",title:'nodejs',href:'http://nodejs.org',target:'_blank'}).scale(2,2,-1,10);
    var jqueryi = ipaper.path(icons.jquery).attr({fill: "#2230D3", stroke: "none",title:'jquery',href:'http://jquery.com',target:'_blank'}).scale(1.3,1.3,-230,-1);
    var raphaeli = ipaper.path(icons.raphael).attr({fill: "#2230D3", stroke: "none",title:'raphaeljs',href:'http://raphaeljs.com',target:'_blank'}).scale(1.4,1.4,-270,-.5);
    //box
    var box = paper.rect(padding, padding, width, height*(types), curve);
    //animate functions
    var bstart = function () {
        // storing original coordinates
        this.scale(1,1);
        var x = this.attr("x");
        var y = this.attr("y");
        if(this.ox === undefined)
          this.ox = x;
        if(this.oy === undefined)
          this.oy = y;
        //clone
        this.dragclone = this.clone();
        this.dragclone.xsnap = this.xsnap;
        this.dragclone.ysnap = this.ysnap;
        this.dragclone.place = this.place;
        
        //set opacity
        this.dragclone.attr({opacity: .6});
        
        //stop animation
        this.stop();
        this.attr({x: x, y: y});
        
        //send info
        this.rand = Math.random();
        this.inc = 0;
        socket.send({
          type:'boxstart', 
          row:this.row, 
          col:this.col, 
          width:width, 
          rand: this.rand,
          xsnap: (1000* this.xsnap)/width,
          ysnap: (1000* this.ysnap)/width,
          place: this.place
        });
        var dragclone = this.dragclone;
        var random = this.rand;
        this.interval = setInterval(function(){
          socket.send({
            type:'boxmove', 
            x:(1000 *(dragclone.attr('x'))) / width, 
            y:(1000 * (dragclone.attr('y'))) / width, 
            rand: random
          });
        },100);
    },
    bmove = function (dx, dy) {
        // move will be called with dx and dy
        this.dragclone.attr({x: this.ox + dx, y: this.oy + dy});
        /*if(!this.inc++)
          socket.send({type:'boxmove', x:(1000 *(this.ox + dx-padding)) / width, y:(1000 * (this.oy + dy-padding)) / width, rand: this.rand});
        if(this.inc > 10)
          this.inc = 0;*/
    },
    bup = function () {
        clearInterval(this.interval);
        var random = this.rand;
        // restoring state
        var dragclone = this.dragclone;
        var x = dragclone.attr("x") - padding;
        var y = dragclone.attr("y") - padding;
        x = Raphael.snapTo(this.xsnap, x, this.xsnap/2) + padding;
        y = Raphael.snapTo(this.ysnap, y, this.ysnap/2) + padding;
        var collision = false;
        var clone;
        for(rand in clones)
        {
          clone = clones[rand]; 
          //console.log(clone.attr("x")+' <= '+x+' && '+(clone.attr("x") + clone.xsnap)+' >= '+(x + dragclone.xsnap));
          //console.log(x+' <= '+clone.attr("x")+' && '+(x + dragclone.xsnap)+' >= '+(clone.attr("x") + clone.xsnap));
          //console.log(~~x+' < '+~~(clone.attr("x") + clone.xsnap)+' && !('+(x + dragclone.xsnap)+' <= '+clone.attr('x')+')');
          //console.log(clone.attr("y")+' <= '+y+' && '+(clone.attr("y") + clone.ysnap)+' >= '+(y + dragclone.ysnap));
          if(  ((clone.attr("x") <= x && clone.attr("x") + clone.xsnap >= (x + dragclone.xsnap)) || 
            (x <= clone.attr("x") && (x + dragclone.xsnap) >= clone.attr("x") + clone.xsnap )  ||
             (~~x < ~~(clone.attr("x") + clone.xsnap) && !(x + dragclone.xsnap <= clone.attr('x'))) )&&
            (clone.attr("y") <= y && clone.attr("y") + clone.ysnap >= y + dragclone.ysnap ) )
          {
            collision = true;
            clone.attr({opacity:1}).animate({opacity:.3},500);
            break;
          }
        }
        //console.log(collision);
        if(x <= width || collision)
        {
          dragclone.animate({opacity: .1},500,function(){
            dragclone.remove();
          });
          socket.send({type:'boxup', remove:true, rand: this.rand});
        }
        else
        {
          clones[random] = dragclone;
          clones[random].xsnap = dragclone.xsnap;
          clones[random].ysnap = dragclone.ysnap;
          clones[random].attr({x: x, y: y});
          random = this.rand;
          dragclone.animate({opacity: .3},500).click(function(){
            dragclone.animate({scale:'0.2,0.2',opacity:0,rotation:270},500,function(){
              dragclone.remove();
              delete clones[random];
            });
          });
          var row = Math.round((y - padding)/height);
          console.log('row: '+row);
          var col = Math.round((x - padding - width)/dragclone.xsnap);
          console.log('col: '+col);
          socket.send({type:'boxup', row:row, col:col, rand: random});
          
        }
    };
    draw.bstart = function(msg) {
      ghosts[msg.rand] = boxes[msg.row][msg.col].clone().attr({opacity: .6,title:msg.user});
      //console.log('msg.xsnap'+msg.xsnap);
      ghosts[msg.rand].xsnap = (msg.xsnap * width) / 1000;
      ghosts[msg.rand].ysnap = (msg.ysnap * width) / 1000;
      ghosts[msg.rand].lastmove = (new Date()).getTime();
      ghosts[msg.rand].place = msg.place;
    }
    draw.bmove = function(msg) {
      ghosts[msg.rand].animate({x: ((msg.x * width) / 1000) + padding, y: ((msg.y * width) / 1000) + padding},100);
      ghosts[msg.rand].lastmove = (new Date()).getTime();
    }
    draw.bup = function(msg) {
      if(msg.remove)
      {
        ghosts[msg.rand].animate({opacity: .1},500,function(){
          ghosts[msg.rand].remove();
        });
        return false;
      }
      console.log('bup');
      var collision = false;
      var clone;
      var x = (msg.col * width / ghosts[msg.rand].place) + width + padding;
      var y = (msg.row * height) + padding;
      console.log('msg.row: '+msg.row);
      console.log('msg.col: '+msg.col);
      console.log('y: '+y);
      var dragclone = ghosts[msg.rand];
      for(rand in clones)
      {
        clone = clones[rand]; 
        //console.log(clone.xsnap);
        //console.log(x+' <= '+clone.attr("x")+' && '+x+' >= '+(clone.attr("x") + clone.xsnap));
        if(  ((clone.attr("x") <= x && clone.attr("x") + clone.xsnap >= (x + dragclone.xsnap)) || 
            (x <= clone.attr("x") && (x + dragclone.xsnap) >= clone.attr("x") + clone.xsnap )  ||
             (Math.round(x) < Math.round(clone.attr("x") + clone.xsnap) && !(x + dragclone.xsnap <= clone.attr('x'))) )&&
            (clone.attr("y") <= y && clone.attr("y") + clone.ysnap >= y + dragclone.ysnap ) )
        {
          collision = true;
          break;
        }
      }
      console.log(collision);
      if(collision)
      {
        ghosts[msg.rand].animate({opacity: .1},500,function(){
          ghosts[msg.rand].remove();
        });
      }
      else
      {
        clones[msg.rand] = ghosts[msg.rand];
        clones[msg.rand].xsnap = ghosts[msg.rand].xsnap;
        clones[msg.rand].ysnap = ghosts[msg.rand].ysnap;
        console.log('y: '+y);
        clones[msg.rand].attr({x: x, y: y});
        ghosts[msg.rand].animate({x: x, y: y,opacity: .3},500).click(function(){
          ghosts[msg.rand].remove();
          delete clones[msg.rand];
          delete ghosts[msg.rand];
        });
      }
    }
    for(var row = 0; row < types; row++)
    {
      boxes[row] = [];
      place = start + row;
      if(place > 6)
        place++;
      if(place > 10)
        place++;
      if(place != 11)
      {
        for(var col = 0; col < place; col++)
        {
          boxes[row][col] = paper.rect(col*width/place+padding, row*height+padding, width/place, height, curve);
          boxes[row][col].attr({
            fill: fills[place],
            opacity: .3,
            stroke: "#33333D",
            'stroke-width': 2
          });
          boxes[row][col].xsnap = width/place;
          boxes[row][col].ysnap = height;
          boxes[row][col].row = row;
          boxes[row][col].col = col;
          boxes[row][col].place = place;
          boxes[row][col].drag(bmove, bstart, bup);
          //boxes[row][col].attr({title: '1\n-\n'+place});
          boxes[row][col].hover(function (event) {
              texts[this.row].animate({opacity:1,'font-size':height / 2.2},200);
              boxes[this.row][0].scale(1.1,1.3).attr({opacity:.8});
          }, function (event) {
              texts[this.row].animate({opacity:0,'font-size':height / 4},200);
              boxes[this.row][0].scale(1,1).attr({opacity:.3});
          });
        }
      }
      var textheight = (row*height+padding) + height / 1.7;
        
      texts[row] = paper.set();
      texts[row].push(
        paper.text((width/(place*2))+padding, textheight, 1).attr({y:textheight -(height / 4)}),
        paper.text((width/(place*2))+padding, textheight, '—').attr({y:textheight -(height / 32)}),
        paper.text((width/(place*2))+padding, textheight, place).attr({y:textheight+(height / 4)})
      ).attr({
        'font-size':height / 4,
        'font-weight':'bold',
        'fill':'#33333D',
        'font-family':"'Lato', Helvetica, Arial, sans-serif",
        opacity:0});
      var deghost = setInterval(function(){
        for(rand in ghosts)
        {
          if(!clones[rand] && ghosts[rand].lastmove + 1000 < (new Date()).getTime())
          {
            ghosts[rand].remove();
            delete ghosts[rand];
          }
        }
      },1000);
    }
  };
  //draw();
  //fact fam!
  var relate = new function() {
      var multi = false;
      var numbers = true;
      var tenframes = true;
      var model = false;
      var difficulty = 'easy';
      if ($.getUrlVar('multi') == 'true') multi = true;
      if ($.getUrlVar('numbers') == 'false') numbers = false;
      if ($.getUrlVar('tenframes') == 'false') tenframes = false;
      if ($.getUrlVar('model') == 'true') model = true;
      if ($.getUrlVar('difficulty')) difficulty = $.getUrlVar('difficulty');
      var s = -1;
      var a = -1;
      var b = -1;
      var anew = -1;
      var bnew = -1;
      var six = [];
      var three = [];
      var sixused = [];
      var threeused = [];
      var nine = [];
      var current = -1;
      this.setsab = function() {
          s = -1;
          a = -1;
          b = -1;
          while (multi && s > 100 || !multi && s > 10 || s < 1 || a == b && multi) {
              switch (difficulty) {
              case 'easy':
                  a = Math.floor(Math.random() * 7);
                  b = Math.floor(Math.random() * 7);
                  break;
              case 'medium':
                  a = Math.floor(Math.random() * 6);
                  b = Math.floor(Math.random() * 5) + 6;
                  break;
              case 'hard':
                  a = Math.floor(Math.random() * 8) + 3;
                  b = Math.floor(Math.random() * 8) + 3;
                  break;
              case 'random':
                  a = Math.floor(Math.random() * 7) + 4;
                  b = Math.floor(Math.random() * 11);
                  break;
              }

              if (multi) {
                  s = a * b;
              }
              else {
                  s = a + b;
              }
          }
          testinc = 0;
          while (multi && anew * bnew != s || !multi && anew + bnew != s || a == anew || a == bnew) {
              switch (difficulty) {
              case 'easy':
                  anew = Math.floor(Math.random() * 7);
                  bnew = Math.floor(Math.random() * 7);
                  break;
              case 'medium':
                  anew = Math.floor(Math.random() * 6);
                  bnew = Math.floor(Math.random() * 5) + 6;
                  break;
              case 'hard':
                  anew = Math.floor(Math.random() * 8) + 3;
                  bnew = Math.floor(Math.random() * 8) + 3;
                  break;
              case 'random':
                  anew = Math.floor(Math.random() * 7) + 4;
                  bnew = Math.floor(Math.random() * 11);
                  break;
              }
              if (testinc++ > 10000) {
                  s = -1;
                  a = -1;
                  b = -1;
                  this.setsab();
                  break;
              }
          }
          six = [
              [s, a, b, 0, true],
              [s, a, b, 1, true],
              [s, a, b, 2, true],
              [s, b, a, 0, true],
              [s, b, a, 1, true],
              [s, b, a, 2, true],
              [a, s, b, 0, false],
              [a, s, b, 1, false],
              [a, s, b, 2, false],
              [b, s, a, 0, false],
              [b, s, a, 1, false],
              [b, s, a, 2, false]
          ]
          three = [
              [s, anew, bnew, 0, true],
              [s, anew, bnew, 1, true],
              [s, anew, bnew, 2, true],
              [s, bnew, anew, 0, true],
              [s, bnew, anew, 1, true],
              [s, bnew, anew, 2, true],
              [anew, s, bnew, 0, false],
              [anew, s, bnew, 1, false],
              [anew, s, bnew, 2, false],
              [bnew, s, anew, 0, false],
              [bnew, s, anew, 1, false],
              [bnew, s, anew, 2, false]
          ]
      }
      this.setnine = function() {
          nine = [];
          sixused = [];
          threeused = [];
          while (nine.length < 9) {
              var skip = false;
              var usesix = false;
              var usethree = false;
              if (sixused.length == 6) {
                  skip = true;
                  usethree = true;
              }
              if (threeused.length == 3) {
                  skip = true;
                  usesix = true;
              }
              if (!skip) {
                  if (Math.floor(Math.random() + 0.5)) {
                      usesix = true;
                  }
                  else {
                      usethree = true;
                  }
              }
              if (usesix) {
                  var done = false;
                  while (!done) {
                      var random = Math.floor(Math.random() * 12);
                      var conflict = false;
                      for (var i = 0; i < sixused.length; i++) {
                          if (sixused[i] == random) {
                              conflict = true;
                          }
                      }
                      if (!conflict) {
                          sixused[sixused.length] = random;
                          prospect = six[random];
                          done = true;
                      }
                  }
              }
              if (usethree) {
                  done = false;
                  while (!done) {
                      random = Math.floor(Math.random() * 6);
                      conflict = false;
                      for (var i = 0; i < sixused.length; i++) {
                          if (threeused[i] == random) {
                              conflict = true;
                          }
                      }
                      if (!conflict) {
                          threeused[threeused.length] = random;
                          prospect = three[random];
                          done = true;
                      }
                  }
              }
              conflict = false;
              for (var i = 0; i < nine.length; i++) {
                  if (nine[i] == prospect) {
                      conflict = true;
                  }
              }
              if (!conflict) {
                  nine[nine.length] = prospect;
              }
          }
      }
      this.applynine = function() {
          for (var i = 0; i < 9; i++) {
              box = $('<div class=box></div>');
              if (model) {
                  model = $('<div class=model></div>');
                  if (nine[i][4]) {
                      for (var j = 0; j < nine[i][0]; j++) {
                          model.append('<div class=block></div>');
                      }
                      model.width(nine[i][1] * 10);
                  }
                  else {
                      for (var j = 0; j < nine[i][0]; j++) {
                          group = $('<div class=group></div>');
                          for (var k = 0; k < nine[i][2]; k++) {
                              group.append('<div class=block></div>');
                          }
                          group.width(nine[i][2] * 10);
                          model.append(group);
                      }
                  }
                  box.append(model);
                  box.append('<br>');
              }
              for (var j = 0; j < 3 && numbers; j++) {
                  if (nine[i][3] == j) {
                      box.append('<div class="blank number">' + nine[i][j] + '</div>');
                  }
                  else {
                      if (true) {
                          frame = ('<div class=fix>' + nine[i][j] + '<div>');
                      }
                      box.append(frame);
                  }

                  if (j == 0) {
                      box.append('<div class="operator number">=</div>');
                  }
                  if (j == 1) {
                      if (nine[i][4]) {
                          if (multi) {
                              box.append('<div class="operator number">&times;</div>');
                          }
                          else {
                              box.append('<div class="operator number">+</div>');
                          }
                      }
                      else {
                          if (multi) {
                              box.append('<div class="operator number">&divide;</div>');
                          }
                          else {
                              box.append('<div class="operator number">&ndash;</div>');
                          }
                      }
                  }
              }
              if (numbers) {
                  box.append('<br>');
              }
              for (var j = 0; j < 3 && tenframes; j++) {
                  if (nine[i][3] == j) {
                      box.append('<div class=blank>' + nine[i][j] + '</div>');
                  }
                  else {
                      if (j == 2 && !nine[i][4]) {
                          frame = $('<div class=subframe></div>');
                          frame.append('<img alt="subframe" class=subframe src="http://mathcoach.net/Interactive/Interactive3/media/tenframe/sub0s.png">');
                          for (var k = 0; k < 10; k++) {
                              if (nine[i][j] >= 10 - k) {
                                  frame.append('<div class=dash><img alt="dash" class=dash src="http://mathcoach.net/Interactive/Interactive3/media/tenframe/singledashs.png"></div>');
                              }
                              else {
                                  frame.append('<div></div>');
                              }
                          }
                      }
                      else {
                          frame = $('<div class=tenframe></div>');
                          frame.append('<img alt="tenframe" class=tenframe src="http://mathcoach.net/Interactive/Interactive3/media/tenframe/dot0s.png">');
                          frame.append('<img alt="fullframe" class="tenframe full" src="http://mathcoach.net/Interactive/Interactive3/media/tenframe/dot10s.png">');
                          for (var k = 0; k < 10; k++) {
                              if (nine[i][j] >= 10 - k) {
                                  frame.append('<div class=dot><img alt="dot" class=dot src="http://mathcoach.net/Interactive/Interactive3/media/tenframe/singledots.png"></div>');
                              }
                              else {
                                  frame.append('<div></div>');
                              }
                          }
                          if (nine[i][j] == 10) {
                              frame.addClass('full');
                          }
                      }
                      if (false) {
                          frame = ('<div class=fix>' + nine[i][j] + '<div>');
                      }
                      box.append(frame);
                  }

                  if (j == 0) {
                      box.append('<div class=operator>=</div>');
                  }
                  if (j == 1) {
                      if (nine[i][4]) {
                          if (multi) {
                              box.append('<div class="operator">&times;</div>');
                          }
                          else {
                              box.append('<div class=operator>+</div>');
                          }
                      }
                      else {
                          if (multi) {
                              box.append('<div class="operator">&divide;</div>');
                          }
                          else {
                              box.append('<div class=operator>&ndash;</div>');
                          }
                      }
                  }
              }
              if (tenframes) {
                  box.append('<br>');
              }
              
              $("#clouds").append(box)
              if (i % 3 == 2) {
                  $("#clouds").append('<br>');
              }
          }
          $("#clouds").append('<br>');
          $(".blank").html('');
      }
      this.ninealert = function(index) {
          var value = nine[index][nine[index][3]];
          if (value == current) {
              socket.send({type:'factfam',correct:true,index:index,current:current,value:value,nine:nine[index], difficulty:difficulty});
              $("#right").html(Number($("#right").html()) + 1);
              $("#clouds .box:eq(" + index + ")").removeClass('incorrect').addClass('correct');
              $("#clouds .box:eq(" + index + ") .blank.number").html(value)
              blankframe = $("#clouds .box:eq(" + index + ") .blank:not(.number)");
              if (blankframe.length) {
                  blankframe.removeClass('blank');
                  blankframe.hide();
                  if (nine[index][3] == 2 && !nine[index][4]) {
                      blankframe.addClass('subframe');
                      blankframe.append('<img alt="subframe" class=subframe src="http://mathcoach.net/Interactive/Interactive3/media/tenframe/sub0s.png">');
                      for (var i = 0; i < 10; i++) {
                          if (i >= 10 - value) {
                              blankframe.append('<div class=dash><img alt="dash" class=dash src="http://mathcoach.net/Interactive/Interactive3/media/tenframe/singledashs.png"></div>');
                          }
                          else {
                              blankframe.append('<div></div>');
                          }
                      }
                      blankframe.show();
                  }
                  else {
                      blankframe.addClass('tenframe');
                      blankframe.append('<img alt="tenframe" class=tenframe src="http://mathcoach.net/Interactive/Interactive3/media/tenframe/dot0s.png">');
                      for (var i = 0; i < 10; i++) {
                          if (i >= 10 - value) {
                              blankframe.append('<div class=dot><img alt="dot" class=dot src="http://mathcoach.net/Interactive/Interactive3/media/tenframe/singledots.png"></div>');
                          }
                          else {
                              blankframe.append('<div></div>');
                          }
                      }
                      if (value == 10) {
                          blankframe.addClass('full');
                      }
                      blankframe.show();
                  }
              }
          }
          else {
              socket.send({type:'factfam',correct:false,index:index,current:current,value:value,nine:nine[index], difficulty:difficulty});
              $("#wrong").html(Number($("#wrong").html()) + 1);
              $("#clouds .box:eq(" + index + ")");
              $("#clouds .box:eq(" + index + ")").removeClass('correct').addClass('incorrect');
          }
          //ticpost(index, $(this));
          if ($('#clouds .box.correct').length == 9) {
              $().toastmessage('showSuccessToast', 'woohoo');
              setclouds();
          }
      }
      this.settools = function() {
          if (tenframes && false) {
              for (var i = 0; i <= 10; i++) {
                  tenframe = $('<div class=tenframe></div>');
                  for (var j = 0; j < 10; j++) {
                      if (j >= 10 - i) {
                          tenframe.append('<div class=dot></div>');
                      }
                      else {
                          tenframe.append('<div></div>');
                      }
                  }
                  $("#selectbar").append(tenframe);
              }
              $("#selectbar .tenframe").click(function() {
                  index = $(this).index("#selectbar .tenframe");
                  relate.toolclick(index);
              })
              $("#selectbar").append('<br>');
          }
          if (!multi) {
              for (var i = 0; i <= 10; i++) {
                  $("#selectbar").append('<div class=number>' + i + '</div>')
              }
              $("#selectbar .number").click(function() {
                  index = $(this).index("#selectbar .number");
                  relate.toolclick(index);
              })
              $("#selectbar").append('<br>');
          }
          if (multi) {
              keypad = $('<div id=keypad></div>');
              for (var i = 1; i <= 9; i++) {
                  keypad.append('<div class=key>' + i + '</div>');
              }
              keypad.append('<div class=key></div>');
              keypad.append('<div class=key>0</div>');
              keypad.append('<div class=key></div>');
              keypad.append('<div id=delete class=key>Delete</div>');
              keypad.appendTo('#status');
              div = $('<div id=current></div>');
              div.appendTo('#selectbar');
              $('.key').click(function() {
                  relate.keyclick($(this).text());
              })
          }
      }
      this.keyclick = function(text) {
          switch (text) {
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
              oldtext = $('#current').text();
              current = oldtext + '' + text;
              $('#current').html(current);
              break;
          case 'Delete':
              $('#current').html('');
              break;
          }
      }
      this.toolclick = function(index) {
          current = index;
          $("#selectbar .highlight").removeClass('highlight');
          $("#selectbar .number:eq(" + index + ")").addClass('highlight');
      }
      this.chosennumber = function() {
          return current;
      }
      this.getnumber = function() {
          return current;
      }
      this.getChosenDisplay = function() {
          return current;
      }
  }
  selected = relate;

  function initsetclouds() {
      $('#notepad').append('<div id=clouds></div><div id=selectbar></div>');
      $('#clouds, #selectbar').html('');
      relate.setsab();
      relate.setnine();
      relate.applynine();
      relate.settools();
      $(".box").die('click');
      $(".box").live('click', function() {
          index = $(this).index(".box");
          relate.ninealert(index);
      })
  }

  function setclouds() {
      $('#clouds').html('');
      relate.setsab();
      relate.setnine();
      relate.applynine();
  }

  function chosennumber(index) {
      return relate.chosennumber();
  }
  initsetclouds();
});