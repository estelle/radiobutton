// JavaScript Document
// Makes the slidedeck work

(function() {
	var doc = document,
	    disableBuilds = true,
		ctr = 0,
		spaces = /\s+/,
		a1 = [''],
	    toArray = function(list) {
  			return Array.prototype.slice.call(list || [], 0);
		},
		byId = function(id) {
			if (typeof id == 'string') { 
				return doc.getElementById(id); 
			}
			return id;
		},
	
	query = function(query, root) {
	  if (!query) { return []; }
		if (typeof query != 'string') { 
			return toArray(query); }
		if (typeof root == 'string') {
		  root = byId(root);
		  if(!root){ return []; }
    	}
        root = root || document;
  		var rootIsDoc = (root.nodeType == 9);
  		var doc = rootIsDoc ? root : (root.ownerDocument || document);

		// rewrite the query to be ID rooted
		if (!rootIsDoc || ('>~+'.indexOf(query.charAt(0)) >= 0)) {
			root.id = root.id || ('qUnique' + (ctr++));
			query = '#' + root.id + ' ' + query;
		}
	
		// don't choke on something like ".yada.yada >"
		if ('>~+'.indexOf(query.slice(-1)) >= 0) { query += ' *'; }
		return toArray(doc.querySelectorAll(query));
	},
	
	strToArray = function(s) {
		if (typeof s == 'string' || s instanceof String) {
			if (s.indexOf(' ') < 0) {
				a1[0] = s;
				return a1;
			} 
			else {
				return s.split(spaces);
			}
		}
		return s;
	  }, 
	
	removeClass = function(node, classStr) {
		  if (classStr !== undefined) {
			classStr = strToArray(classStr);
			for (var i = 0, len = classStr.length; i < len; ++i) {
			  node.classList.remove(classStr[i]);
			}
		  } 
	  },
	
	  toggleClass = function(node, classStr) {
		  node.classList.toggle(classStr);
	  },

  	 	canTransition = (function() {
		  var ver = parseFloat(navigator.userAgent.split('Version/')[1]) || undefined;
  		}
  )();


//-----------------------------------------------------------------//

var Slide = function(node, idx) {
  this._node = node;
  if (idx >= 0) {
    this._count = idx + 1;
  }
  if (this._node) {
    this._node.classList.add('distant-slide');
  }
  //this._makeCounter();
  this._makeBuildList();
};



Slide.prototype = {
    _node: null,
    _count: 0,
    _buildList: [],
    _visited: false,
    _currentState: '',
    _states: [ 'distant-slide', 'far-past',
               'past', 'current', 'future',
               'far-future', 'distant-slide' ],
    setState: function(state) {
    if (typeof state != 'string') {
      state = this._states[state];
    }

    if (state == 'current' && !this._visited) {
      this._visited = true;
      this._makeBuildList();
    }

    removeClass(this._node, this._states);
    this._node.classList.add(state);
    this._currentState = state;



  var _t = this;
    setTimeout(function(){ _t._runAutos(); } , 400);
  },

    _makeCounter: function() {
    if(!this._count || !this._node) { return; }

      var c = doc.createElement('span');
    c.innerHTML = this._count;
    c.className = 'counter';
    this._node.appendChild(c);
  },

    _makeBuildList: function() {
    this._buildList = [];
    if (disableBuilds) { return; }

      if (this._node) {
      this._buildList = query('[data-build] > *', this._node);
    }

      this._buildList.forEach(function(el) {
      el.classList.add('to-build');
    });
  },

    _runAutos: function() {
    if (this._currentState != 'current') {
      return;
    }

      // find the next auto, slice it out of the list, and run it

      var idx = -1;
    this._buildList.some(function(n, i) {
      if (n.hasAttribute('data-auto')) {
        idx = i;
        return true;
      }

        return false;
    });
    if (idx >= 0) {
      var elem = this._buildList.splice(idx, 1)[0];
      var _t = this;
      var l = function(evt) {
          elem.parentNode.removeEventListener('transitionend', l, false);
          _t._runAutos();
        };
      elem.parentNode.addEventListener('transitionend', l, false);
      elem.classList.remove('to-build');
      } 


    },

    buildNext: function() {
    if (!this._buildList.length) {
      return false;
    }

      removeClass(this._buildList.shift(), 'to-build');
    return true;
  },

  };



  //
  // SlideShow class
  //

  var SlideShow = function(slides) {
  this._slides = (slides || []).map(function(el, idx) {
    return new Slide(el, idx);
  });



  var h = window.location.hash;
  try {
    this.current = parseInt(h.split('#slide')[1], 10);
  } catch (e) { /* squeltch */ }

  this.current = isNaN(this.current) ? 1 : this.current;
  var _t = this;
  doc.addEventListener('keydown', function(e) { _t.handleKeys(e); }, false);
  doc.addEventListener('mousewheel', function(e) { _t.handleWheel(e); }, false);
  doc.addEventListener('DOMMouseScroll', function(e) { _t.handleWheel(e); }, false);
  doc.addEventListener('touchstart',  function(e) { _t.handleTouchStart(e); }, false);
  doc.addEventListener('touchend', function(e) { _t.handleTouchEnd(e); }, false);
  window.addEventListener('popstate', function(e) { _t.go(e.state); }, false);
  doc.getElementById('back').addEventListener('click', function(e) {_t.prev();}, false);
  doc.getElementById('next').addEventListener('click', function(e) {_t.next();}, false);
  this._update();
};



SlideShow.prototype = {
  _slides: [],

    _update: function(dontPush) {
		//document.querySelector('#presentation-counter').innerText = this.current;
		if (history.pushState) {
		  if (!dontPush) {
			history.pushState(this.current, 'Slide ' + this.current, '#slide' + this.current);
		    }
		} else {
		  window.location.hash = 'flopslide' + this.current;
		}
	    for (var x = this.current-1; x < this.current + 7; x++) {
		    if (this._slides[x-4]) {
				this._slides[x-4].setState(Math.max(0, x-this.current));
		    }
		  }
    },

    current: 0,

    next: function() {
		if (!this._slides[this.current-1].buildNext()) {
		  this.current = Math.min(this.current + 1, this._slides.length);
		  this._update();
		}
	 },
	prev: function() {
	this.current = Math.max(this.current-1, 1);
	this._update();
  },

   go: function(num) {
	  if (!num) return;
	  if (history.pushState && this.current != num) {
	    history.replaceState(this.current, 'Slide ' + this.current, '#slide' + this.current);
	  }
	  this.current = num;
	  this._update(true);
    },



  _notesOn: false,
	
 showNotes: function() {
    var isOn = this._notesOn = !this._notesOn;
    query('.notes').forEach(function(el) {
      el.style.display = (isOn) ? '' : 'none';
    });
  },


    handleWheel: function(e) {
    var delta = 0;
    if (e.wheelDelta) {
      delta = e.wheelDelta/120;
      if (isOpera) {
			delta = -delta;
		  }
      } 
	  else if (e.detail) {
        delta = -e.detail/3;
      }

      if (delta > 0 ) {
		  this.prev();
		  return;
		}
      if (delta < 0 ) {
		  this.next();
		  return;
		}
    },
	
	addNotes: function(){
		if(document.querySelector('.current textarea.mynotes')) {
			document.querySelector('.current textarea.mynotes').classList.toggle('temphidden');
			return;
		}
		var ta = document.createElement('textarea'),
		     currentSlide = document.querySelector('.current section'),
			 path = window.location.pathname,
			 A = path.lastIndexOf('/') + 1, 
			 B = path.lastIndexOf('.'),
			 firstPartOfKey, key;
		if(B && B > A){	 
		    firstPartOfKey = path.substring(A, B);
		} else {
		    firstPartOfKey = path.substring(1, path.length-1) || 'home';	
		}
		//console.log(firstPartOfKey);
		key = firstPartOfKey +  window.location.hash;
		ta.value = window.localStorage.getItem(key) || '';
		ta.className = 'mynotes';
		
		ta.addEventListener('keyup', function(){
			//console.log(key + ' ' + ta.value)
		    window.localStorage.setItem(key,ta.value);
		});
		currentSlide.appendChild(ta);
	},
	
	
	removeHidingClass: function(){
		var paragraphToShow = document.querySelector('.current .temphidden');
		if(paragraphToShow) {
			paragraphToShow.classList.remove('temphidden');
			return true;
		} 
	},

	fadeOut: function(e) {
		var stuffToFade = document.querySelector('.current .visualfade');
		if(stuffToFade) {
			stuffToFade.classList.add('fadeout');
			stuffToFade.classList.remove('visualfade');
			return true;
		} 

	},
	
    handleKeys: function(e) {
      // disable keys for these elements
      if (/^(input|textarea|pre|object)$/i.test(e.target.nodeName)) return;
	 
      if(!ATUserPreference) {
      switch (e.keyCode) {
		  case 37: // left arrow
		  case 33: // left clicker
			 this.prev(); break;
		  case 39: // right arrow
		  case 32: // space
		  case 34: // clicker right
		     if(this.removeHidingClass()) {
		     	break;
		     } 
		     if(this.fadeOut()) {
		     	break;
		     }
			 this.next(); break;
		  case 50: // 2
		  case 190: // 2
			 this.showNotes(); 
			 this.removeHidingClass(); 
			 break;
	      case 52: // 4 (for taking notes with local storage (students)
		     this.addNotes(); break;
		     break;
    	}
      }
    },
	
    _touchStartX: 0,
    handleTouchStart: function(e) {
    this._touchStartX = e.touches[0].pageX;
  },

    handleTouchEnd: function(e) {
    var delta = this._touchStartX - e.changedTouches[0].pageX;
    var SWIPE_SIZE = 150;
    if (delta > SWIPE_SIZE) {
      this.next();
    } else if (delta< -SWIPE_SIZE) {
       this.prev();
     }
    },
  };

  // Initialize
  var slideshow = new SlideShow(query('.slide'));
})();

var removeCSS = document.getElementById('killCSS'),
	ATUserPreference = false;
console.dir(removeCSS);
if(removeCSS) {
	removeCSS.addEventListener('click', function () {
		console.log('hello');
		killCSS();
	});

	function killCSS() {
		ATUserPreference = true;
		var filesToKill = document.querySelectorAll('.removeForAT'),
		    l = filesToKill.length, i = 0;
		for ( ; i < l; i++) {
			filesToKill[i].setAttribute('href', '');
			filesToKill[i].setAttribute('src', '');
		}

	}
}
