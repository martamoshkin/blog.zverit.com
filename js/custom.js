// PURE JAVASCRIPT "Scroller" CLASS (OOP)

function Scroller(options) {
  this.options = options;
  this.button = null;
  this.stop = false;
}

Scroller.prototype.constructor = Scroller;

Scroller.prototype.createButton = function() {

    let icon = document.createElement('i');
    icon.classList.add('fa');
    icon.classList.add('fa-angle-up');
  this.button = document.createElement('div');
  this.button.classList.add('scroll-button');
  this.button.classList.add('scroll-button--hidden');
  this.button.appendChild(icon);
  let pageContent = document.getElementsByClassName('page-content')[0];

  pageContent.appendChild(this.button);
}
  
Scroller.prototype.init = function() {
  this.createButton();
  this.checkPosition();
  this.click();
  this.stopListener();
}

Scroller.prototype.scroll = function() {
  if (this.options.animate == false || this.options.animate == "false") {
    this.scrollNoAnimate();
    return;
  }
  if (this.options.animate == "normal") {
    this.scrollAnimate();
    return;
  }
  if (this.options.animate == "linear") {
    this.scrollAnimateLinear();
    return;
  }
}
Scroller.prototype.scrollNoAnimate = function() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}
Scroller.prototype.scrollAnimate = function() {
  if (this.scrollTop() > 0 && this.stop == false) {
    setTimeout(function() {
      this.scrollAnimate();
      window.scrollBy(0, (-Math.abs(this.scrollTop())/this.options.normal['steps']));
    }.bind(this), (this.options.normal['ms']));
  }
}
Scroller.prototype.scrollAnimateLinear = function() {
  if (this.scrollTop() > 0 && this.stop == false) {
    setTimeout(function() {
      this.scrollAnimateLinear();
      window.scrollBy(0, -Math.abs(this.options.linear['px']));
    }.bind(this), this.options.linear['ms']);
  }
}

Scroller.prototype.click = function() {
  
  this.button.addEventListener("click", function(e) {
    e.stopPropagation();
      this.scroll();
  }.bind(this), false);
  
  this.button.addEventListener("dblclick", function(e) {
    e.stopPropagation();
      this.scrollNoAnimate();
  }.bind(this), false);
  
}

Scroller.prototype.hide = function() {
  this.button.classList.add("scroll-button--hidden");
}

Scroller.prototype.show = function() {
  this.button.classList.remove("scroll-button--hidden");
}

Scroller.prototype.checkPosition = function() {
  window.addEventListener("scroll", function(e) {
    if (this.scrollTop() > this.options.showButtonAfter) {
      this.show();
    } else {
      this.hide();
    }
  }.bind(this), false);
}

Scroller.prototype.stopListener = function() {
  
  // stop animation on slider drag
  var position = this.scrollTop();
  window.addEventListener("scroll", function(e) {
    if (this.scrollTop() > position) {
      this.stopTimeout(200);
    } else {
      //...
    }
    position = this.scrollTop();
  }.bind(this, position), false);

  // stop animation on wheel scroll down
  window.addEventListener("wheel", function(e) {
    if(e.deltaY > 0) this.stopTimeout(200);
  }.bind(this), false);
}

Scroller.prototype.stopTimeout = function(ms){
   this.stop = true;
   setTimeout(function() {
     this.stop = false;
   }.bind(this), ms);
}

Scroller.prototype.scrollTop = function(){
   var curentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  return curentScrollTop;
}



// ------------------- USE EXAMPLE ---------------------
// *Set options
var options = {
  'showButtonAfter': 300, // show button after scroling down this amount of px
  'animate': "normal", // [false|normal|linear] - for false no aditional settings are needed
  // easy out effect
  'normal': { // applys only if [animate: normal] - set scroll loop "distanceLeft"/"steps"|"ms"
    'steps': 15, // more "steps" per loop => slower animation
    'ms': 300/60 // less "ms" => quicker animation, more "ms" => snapy
  },
  // linear effect
  'linear': { // applys only if [animate: linear] - set scroll "px"|"ms"
    'px': 80, // more "px" => quicker your animation gets
    'ms': 1000/60 // Less "ms" => quicker your animation gets, More "ms" =>
  }, 
};
// *Create new Scroller and run it.
var scroll = new Scroller(options);
scroll.init();