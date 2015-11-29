'use strict';


// From http://fabricjs.com/fabric-intro-part-2/#image_filters
fabric.Image.filters.Redify = fabric.util.createClass({

  type: 'Redify',

  applyTo: function(canvasEl) {
    var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data;

    for (var i = 0, len = data.length; i < len; i += 4) {
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
    context.putImageData(imageData, 0, 0);
  }
});


// Adding transparency to images, couldn't find a filter in Fabric for this
fabric.Image.filters.Alpha = fabric.util.createClass({

  type: 'Alpha',

  initialize: function(options) {
    // alpha 'strength' is 0 - 255
    // default is ~ 1/2
    options = options || { };
    this.strength = options.strength || 127;
  },

  applyTo: function(canvasEl) {
    var context = canvasEl.getContext('2d')
      , imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height)
      , data = imageData.data;
    for (var i=3; i < data.length; i += 4) {
      data[i] = this.strength; 
    }
    context.putImageData(imageData, 0, 0);
  }
});


$(document).ready(function() {

  var w = $(window).width()
    , h = $(window).height();

  var canvas = new fabric.Canvas('c');
  canvas.setHeight(h - 20);
  canvas.setWidth(w - 20);
  var f = fabric.Image.filters;

  var filters = [
    new f.Grayscale(),
    new f.Sepia(),
    new f.Sepia2(),
    new f.Invert(),
    new f.Brightness({ brightness: 100 }),
    new f.GradientTransparency({ threshold: 100 }),
    new f.Noise(),
    //new f.RemoveWhite({ threshold: 100, distance: 50 }),
    new f.Redify(),
  ];

  $.get('/bigpicture', function(word) {
    $('#word').html(word.word);
    $.each(word.images, function(index, image) {
      var pic = image.file.replace(/^.*?public/,"");
      fabric.Image.fromURL(pic, function(img) {
        //console.log(img);
        // img.width
        // img.height
        //console.log(img.getBoundingRect());
        img.set({
          // TODO: random image placement isn't right yet
          left: rand( (w + w/2) - img.width),
          top: rand( (h + h/2) - img.height),
        });
        img.filters[0] = filters[rand(filters.length)];
        //img.filters[1] = filters[rand(filters.length)];
        img.filters[1] = new f.Alpha({ strength: rand(255, 50) });
        img.filters[2] = new f.RemoveWhite({ threshold: rand(100), distance: rand(100) });
        img.applyFilters(canvas.renderAll.bind(canvas));
        canvas.add(img);
      });
    });
  });
});

function rand (to, from) {
  from = from || 1;
  return (Math.floor (Math.random()*(to-from))+from);
}
