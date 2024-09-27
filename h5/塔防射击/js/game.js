var CRENDER_DEBUG = false;
function ImagesPreloader() {
	var self = this;
	this.curItem = -1;
	this.loadedImages = {};
	this.data = null;
	this.endCallback = null;
	this.processCallback = null;
	this.load = function (data, endCallback, processCallback) {
		this.data = data;
		this.endCallback = endCallback;
		this.processCallback = processCallback;
		for (var i = 0; i < this.data.length; i++) {
			var item = this.data[i];
			var img = new Image();
			img.src = item.src;
			this.loadedImages[item.name] = img;
		}
		wait();
	};
	function wait() {
		var itemsLoaded = 0;
		var itemsTotal = 0;
		for (var key in self.loadedImages) {
			if (self.loadedImages[key].complete)
				itemsLoaded++;
			itemsTotal++;
		}
		if (itemsLoaded >= itemsTotal) {
			if (self.endCallback)
				self.endCallback(self.loadedImages);
			return;
		} else {
			if (self.processCallback)
				self.processCallback(Math.floor(itemsLoaded / itemsTotal * 100));
			setTimeout(wait, 50);
		}
	}
}
var Utils = {
	touchScreen : ("ontouchstart" in window),
	globalScale : 1,
	setCookie : function (name, value) {
		window.localStorage.setItem(name, value);
	},
	getCookie : function (name) {
		return window.localStorage.getItem(name);
	},
	bindEvent : function (el, eventName, eventHandler) {
		if (el.addEventListener) {
			el.addEventListener(eventName, eventHandler, false);
		} else if (el.attachEvent) {
			el.attachEvent('on' + eventName, eventHandler);
		}
	},
	getObjectLeft : function (element) {
		result = element.offsetLeft;
		if (element.offsetParent)
			result += Utils.getObjectLeft(element.offsetParent);
		return result;
	},
	getObjectTop : function (element) {
		result = element.offsetTop;
		if (element.offsetParent)
			result += Utils.getObjectTop(element.offsetParent);
		return result;
	},
	parseGet : function () {
		var get = {};
		var s = new String(window.location);
		var p = s.indexOf("?");
		var tmp,
		params;
		if (p != -1) {
			s = s.substr(p + 1, s.length);
			params = s.split("&");
			for (var i = 0; i < params.length; i++) {
				tmp = params[i].split("=");
				get[tmp[0]] = tmp[1];
			}
		}
		return get;
	},
	globalPixelScale : 1,
	getMouseCoord : function (event, object) {
		var e = event || window.event;
		if (e.touches)
			e = e.touches[0];
		if (!e)
			return {
				x : 0,
				y : 0
			};
		var x = 0;
		var y = 0;
		var mouseX = 0;
		var mouseY = 0;
		if (object) {
			x = Utils.getObjectLeft(object);
			y = Utils.getObjectTop(object);
		}
		if (e.pageX || e.pageY) {
			mouseX = e.pageX;
			mouseY = e.pageY;
		} else if (e.clientX || e.clientY) {
			mouseX = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
			mouseY = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
		}
		var retX = (mouseX - x);
		var retY = (mouseY - y);
		return {
			x : retX,
			y : retY
		};
	},
	extend : function (Child, Parent) {
		var F = function () {};
		F.prototype = Parent.prototype;
		Child.prototype = new F();
		Child.prototype.constructor = Child;
		Child.superclass = Parent.prototype;
	},
	removeFromArray : function (arr, item) {
		var tmp = [];
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] != item)
				tmp.push(arr[i]);
		}
		return tmp;
	},
	showLoadProgress : function (val) {
		var scl = Utils.globalScale;
		var s = 'Loading: ' + val + '%';
		s += '<br><br>';
		s += '<div style="display: block; background: #000; width: ' + (val * scl * 2) + 'px; height: ' + (10 * scl) + 'px;">&nbsp;</div>';
		document.getElementById('progress').innerHTML = s;
		Utils.fitLayoutToScreen();
	},
	mobileHideAddressBar : function () {
		window.scrollTo(0, 1);
	},
	mobileCheckIphone4 : function () {
		if (window.devicePixelRatio) {
			if (navigator.userAgent.indexOf('iPhone') != -1 && window.devicePixelRatio == 2)
				return true;
		}
		return false;
	},
	checkSpilgamesEnvironment : function () {
		return (typeof ExternalAPI != "undefined" && ExternalAPI.type == "Spilgames" && ExternalAPI.check());
	},
	mobileCorrectPixelRatio : function () {
		var meta = document.createElement('meta');
		meta.name = "viewport";
		var content = "target-densitydpi=device-dpi, user-scalable=no";
		if (Utils.checkSpilgamesEnvironment()) {
			if (window.devicePixelRatio > 1)
				content += ", initial-scale=0.5, maximum-scale=0.5, minimum-scale=0.5";
			else
				content += ", initial-scale=1, maximum-scale=1, minimum-scale=1";
		} else {
			if (Utils.mobileCheckIphone4())
				content += ", initial-scale=0.5, maximum-scale=0.5, minimum-scale=0.5";
			else
				content += ", initial-scale=1, maximum-scale=1, minimum-scale=1";
		}
		meta.content = content;
		document.getElementsByTagName('head')[0].appendChild(meta);
	},
	getMobileScreenResolution : function (landscape) {
		var scale = 1;
		var w = 0;
		var h = 0;
		var container = {
			width : window.innerWidth,
			height : window.innerHeight
		};
		if (!Utils.touchScreen || container.height > container.width) {
			w = container.width;
			h = container.height;
		} else {
			w = container.height;
			h = container.width;
		}
		if (Utils.touchScreen) {
			if (w > 320 && w <= 480)
				scale = 1.5;
			if (w > 480)
				scale = 2;
			if (Utils.mobileCheckIphone4())
				scale = 2;
		} else {
			if (landscape) {
				if (h >= 640)
					scale = 2;
				if (h < 640 && h >= 480)
					scale = 1.5;
			} else {
				if (h >= 800 && h < 960)
					scale = 1.5;
				if (h >= 960)
					scale = 2;
			}
		}
		return Utils.getScaleScreenResolution(scale, landscape);
	},
	getScaleScreenResolution : function (scale, landscape) {
		var w,
		h;
		w = Math.round(320 * scale);
		h = Math.round(480 * scale);
		if (landscape) {
			var tmp = w;
			w = h;
			h = tmp;
		}
		return {
			width : w,
			height : h,
			scale : scale
		};
	},
	imagesRoot : 'images',
	createLayout : function (container, resolution) {
		var scl = Utils.globalScale;
		var height = window.innerHeight;
		if ("orientation" in window)
			height = 1024;
		else
			document.body.style.overflow = "hidden";
		var s = "";
		s += '<div id="progress_container" align="center" style="width: 100%; height: ' + height + 'px; display: block; width: 100%; position: absolute; left: 0px; top: 0px;">';
		s += '<table><tr><td id="progress" align="center" valign="middle" style="width: ' + resolution.width + 'px; height: ' + resolution.height + 'px; color: #000; background: #fff; font-weight: bold; font-family: Verdana; font-size: ' + (12 * scl) + 'px; vertical-align: middle;"></td></tr></table>';
		s += '</div>';
		s += '<div id="screen_background_container" align="center" style="width: 100%; height: ' + height + 'px; position: absolute; left: 0px; top: 0px; display: none; z-index: 2;">'
		s += '<div id="screen_background_wrapper" style="width: ' + resolution.width + 'px; height: ' + resolution.height + 'px; overflow: hidden; position: relative;">';
		s += '<canvas id="screen_background" width="' + resolution.width + '" height="' + resolution.height + '"></canvas>';
		s += '</div>';
		s += '</div>';
		s += '<div id="screen_container" align="center" style="width: 100%; height: ' + height + 'px; position: absolute; left: 0px; top: 0px; display: none; z-index: 3;">';
		s += '<div id="screen_wrapper" style="width: ' + resolution.width + 'px; height: ' + resolution.height + 'px; overflow: hidden; position: relative;">';
		s += '<canvas id="screen" style="position: absolute; left: 0px; top: 0px; z-index: 1000000;" width="' + resolution.width + '" height="' + resolution.height + '">You browser does not support this application :(</canvas>';
		s += '</div>';
		s += '</div>';
		container.innerHTML = s;
		var p = document.createElement("div");
		p.setAttribute("id", "p2l_container");
		p.setAttribute("align", "center");
		var w = resolution.width;
		p.setAttribute("style", "width: 100%; height: " + height + "px; position: absolute; left: 0px; top: 0px; display: none; z-index: 1000; background: #fff;");
		p.innerHTML = '<img id="p2l" src="' + Utils.imagesRoot + '/p2l.jpg" style="padding-top: ' + ((w - 240) / 2) + 'px" />';
		document.body.appendChild(p);
	},
	preventEvent : function (e) {
		e.preventDefault();
		e.stopPropagation();
		e.cancelBubble = true;
		e.returnValue = false;
		return false;
	},
	addMobileListeners : function (landscape) {
		Utils.bindEvent(document.body, "touchstart", Utils.preventEvent);
		Utils.bindEvent(window, "scroll", function (e) {
			setTimeout("window.scrollTo(0, 1)", 300);
		});
		Utils.bindEvent(window, "orientationchange", function () {
			eval("Utils.checkOrientation(" + (landscape ? "true" : "false") + ")", 100);
		});
		setTimeout(Utils.mobileHideAddressBar, 500);
	},
	storeOrient : null,
	checkOrientation : function (landscape) {
		if (!("orientation" in window))
			return;
		if (!document.getElementById('screen_container'))
			return;
		var getParams = Utils.parseGet();
		if (getParams.nocheckorient == 1)
			return;
		var orient = (Math.abs(window.orientation) == 90);
		if (Utils.storeOrient === orient)
			return;
		Utils.storeOrient = orient;
		var ok = (orient == landscape);
		if (!ok) {
			Utils.dispatchEvent("lockscreen");
			document.getElementById('p2l_container').style.display = 'block';
			document.getElementById('screen_background_container').style.display = 'none';
			document.getElementById('screen_container').style.display = 'none';
		} else {
			Utils.dispatchEvent("unlockscreen");
			document.getElementById('p2l_container').style.display = 'none';
			document.getElementById('screen_background_container').style.display = 'block';
			document.getElementById('screen_container').style.display = 'block';
		}
		if (Utils.checkSpilgamesEnvironment())
			document.getElementById('p2l_container').style.display = 'none';
		setTimeout(Utils.mobileHideAddressBar, 50);
		setTimeout(Utils.fitLayoutToScreen, 100);
	},
	fitLayoutTimer : null,
	addFitLayoutListeners : function () {
		Utils.fitLayoutTimer = setInterval(Utils.fitLayoutToScreen, 500);
	},
	removeFitLayoutListeners : function () {
		clearInterval(Utils.fitLayoutTimer);
	},
	fitLayoutLock : false,
	fitLayoutToScreen : function (container) {
		if (Utils.fitLayoutLock)
			return;
		var p,
		s,
		width,
		height;
		if (typeof container != "object" || !container.width) {
			width = window.innerWidth;
			height = window.innerHeight;
			if (Utils.checkSpilgamesEnvironment())
				height -= 25;
			container = {
				width : width,
				height : height
			};
		}
		s = document.getElementById("screen");
		if (!s)
			return;
		if (!s.initWidth) {
			s.initWidth = s.width;
			s.initHeight = s.height;
		}
		width = s.initWidth;
		height = s.initHeight;
		var scale = 1;
		var scaleX = container.width / width;
		var scaleY = container.height / height;
		scale = (scaleX < scaleY ? scaleX : scaleY);
		Utils.globalPixelScale = scale;
		width = Math.floor(width * scale);
		height = Math.floor(height * scale);
		if (s.lastWidth == width && s.lastHeight == height)
			return;
		s.lastWidth = width;
		s.lastHeight = height;
		Utils.resizeElement("screen", width, height);
		Utils.resizeElement("screen_background", width, height);
		s = document.getElementById("progress");
		if (s) {
			s.style.width = (~~width) + "px";
			s.style.height = (~~height) + "px";
		}
		s = document.getElementById("screen_wrapper");
		s.style.width = (~~width) + "px";
		s.style.height = (~~height) + "px";
		s = document.getElementById("screen_background_wrapper");
		s.style.width = (~~width) + "px";
		s.style.height = (~~height) + "px";
		Utils.dispatchEvent("fitlayout");
		setTimeout(Utils.mobileHideAddressBar, 50);
	},
	resizeElement : function (id, width, height) {
		var s = document.getElementById(id);
		if (!s)
			return;
		s.setAttribute("width", width);
		s.setAttribute("height", height);
	},
	drawIphoneLimiter : function (stage, landscape) {
		if (landscape)
			stage.drawRectangle(240, 295, 480, 54, "#f00", true, 0.5, true);
		else
			stage.drawRectangle(160, 448, 320, 64, "#f00", true, 0.5, true);
	},
	drawGrid : function (stage, landscape, col) {
		if (typeof landscape == 'undefined')
			landscape = false;
		var dx = 10;
		var dy = 10;
		if (typeof col == 'undefined')
			col = '#FFF';
		var w = 1 / Utils.globalScale / Utils.globalPixelScale;
		var s = {
			w : (landscape ? 480 : 320),
			h : (landscape ? 320 : 480)
		}
		for (var x = dx; x < s.w; x += dx) {
			var o = 0.1 + 0.1 * (((x - dx) / dx) % 10);
			stage.drawLine(x, 0, x, s.h, w, col, o);
		}
		for (var y = dy; y < s.h; y += dy) {
			var o = 0.1 + 0.1 * (((y - dy) / dy) % 10);
			stage.drawLine(0, y, s.w, y, w, col, o);
		}
		stage.drawLine(s.w / 2, 0, s.w / 2, s.h, w, '#F00', 1);
		stage.drawLine(0, s.h / 2, s.w, s.h / 2, w, '#F00', 1);
	},
	drawScaleFix : function (stage, landscape) {
		if (Utils.globalScale == 0.75) {
			if (landscape)
				stage.drawRectangle(507, 160, 54, 320, "#000", true, 1, true);
			else
				stage.drawRectangle(160, 507, 320, 54, "#000", true, 1, true);
		}
		if (Utils.globalScale == 1.5) {
			if (landscape)
				stage.drawRectangle(510, 160, 60, 320, "#000", true, 1, true);
			else
				stage.drawRectangle(160, 510, 320, 60, "#000", true, 1, true);
		}
	},
	grad2radian : function (val) {
		return val / (180 / Math.PI);
	},
	radian2grad : function (val) {
		return val * (180 / Math.PI);
	},
	eventsListeners : [],
	onlockscreen : null,
	onunlockscreen : null,
	onfitlayout : null,
	addEventListener : function (type, callback) {
		EventsManager.addEvent(Utils, type, callback);
	},
	removeEventListener : function (type, callback) {
		EventsManager.removeEvent(Utils, type, callback);
	},
	dispatchEvent : function (type, params) {
		return EventsManager.dispatchEvent(Utils, type, params);
	}
}
var EventsManager = {
	addEvent : function (obj, type, callback) {
		if (!obj.eventsListeners)
			return;
		for (var i = 0; i < obj.eventsListeners.length; i++) {
			if (obj.eventsListeners[i].type === type && obj.eventsListeners[i].callback === callback)
				return;
		}
		obj.eventsListeners.push({
			type : type,
			callback : callback
		});
	},
	removeEvent : function (obj, type, callback) {
		if (!obj.eventsListeners)
			return;
		for (var i = 0; i < obj.eventsListeners.length; i++) {
			if (obj.eventsListeners[i].type === type && obj.eventsListeners[i].callback === callback) {
				obj.eventsListeners = Utils.removeFromArray(obj.eventsListeners, obj.eventsListeners[i]);
				return;
			}
		}
	},
	dispatchEvent : function (obj, type, params) {
		if (!obj.eventsListeners)
			return;
		var ret;
		if (typeof obj["on" + type] == "function") {
			ret = obj["on" + type](params);
			if (ret === false)
				return false;
		}
		for (var i = 0; i < obj.eventsListeners.length; i++) {
			if (obj.eventsListeners[i].type === type) {
				ret = obj.eventsListeners[i].callback(params);
				if (ret === false)
					return false;
			}
		}
	}
}
function Sprite(img, w, h, f, l) {
	this.uid = 0;
	this.stage = null;
	this.x = 0;
	this.y = 0;
	this.width = w;
	this.height = h;
	this.offset = {
		left : 0,
		top : 0
	};
	this.scaleX = 1;
	this.scaleY = 1;
	this.rotation = 0;
	this.zIndex = 0;
	this.visible = true;
	this.opacity = 1;
	this['static'] = false;
	this.ignoreViewport = false;
	this.animated = true;
	this.currentFrame = 0;
	this.totalFrames = Math.max(1, ~~f);
	if (this.totalFrames <= 1)
		this.animated = false;
	this.currentLayer = 0;
	this.totalLayers = Math.max(1, ~~l);
	this.bitmap = img;
	this.mask = null;
	this.fillColor = false;
	this.destroy = false;
	this.animStep = 0;
	this.animDelay = 1;
	this.drawAlways = false;
	this.dragged = false;
	this.dragX = 0;
	this.dragY = 0;
	this.getX = function () {
		return Math.round(this.x * Utils.globalScale);
	};
	this.getY = function () {
		return Math.round(this.y * Utils.globalScale);
	};
	this.getWidth = function () {
		return this.width * this.scaleX * Utils.globalScale;
	};
	this.getHeight = function () {
		return this.height * this.scaleY * Utils.globalScale;
	};
	this.startDrag = function (x, y) {
		this.dragged = true;
		this.dragX = x;
		this.dragY = y;
	}
	this.stopDrag = function () {
		this.dragged = false;
		this.dragX = 0;
		this.dragY = 0;
	}
	this.play = function () {
		this.animated = true;
	};
	this.stop = function () {
		this.animated = false;
	};
	this.gotoAndStop = function (frame) {
		this.currentFrame = frame;
		this.stop();
	};
	this.gotoAndPlay = function (frame) {
		this.currentFrame = frame;
		this.play();
	};
	this.removeTweens = function () {
		if (!this.stage)
			return;
		this.stage.clearObjectTweens(this);
	};
	this.addTween = function (prop, end, duration, ease, onfinish, onchange) {
		if (!this.stage)
			return;
		var val = this[prop];
		if (isNaN(val))
			return;
		var t = stage.createTween(this, prop, val, end, duration, ease);
		t.onchange = onchange;
		t.onfinish = onfinish;
		return t;
	};
	this.moveTo = function (x, y, duration, ease, onfinish, onchange) {
		duration = ~~duration;
		if (duration <= 0) {
			this.setPosition(x, y);
		} else {
			var t1 = this.addTween('x', x, duration, ease, onfinish, onchange);
			if (t1)
				t1.play();
			var t2 = this.addTween('y', y, duration, ease, (t1 ? null : onfinish), (t1 ? null : onchange));
			if (t2)
				t2.play();
		}
		return this;
	}
	this.moveBy = function (x, y, duration, ease, onfinish, onchange) {
		return this.moveTo(this.x + x, this.y + y, duration, ease, onfinish, onchange);
	}
	this.fadeTo = function (opacity, duration, ease, onfinish, onchange) {
		duration = ~~duration;
		if (duration <= 0) {
			this.opacity = opacity;
		} else {
			var t = this.addTween('opacity', opacity, duration, ease, onfinish, onchange);
			if (t)
				t.play();
		}
		return this;
	}
	this.fadeBy = function (opacity, duration, ease, onfinish, onchange) {
		var val = Math.max(0, Math.min(1, this.opacity + opacity));
		return this.fadeTo(val, duration, ease, onfinish, onchange);
	}
	this.rotateTo = function (rotation, duration, ease, onfinish, onchange) {
		duration = ~~duration;
		if (duration <= 0) {
			this.rotation = rotation;
		} else {
			var t = this.addTween('rotation', rotation, duration, ease, onfinish, onchange);
			if (t)
				t.play();
		}
		return this;
	}
	this.rotateBy = function (rotation, duration, ease, onfinish, onchange) {
		return this.rotateTo(this.rotation + rotation, duration, ease, onfinish, onchange);
	}
	this.scaleTo = function (scale, duration, ease, onfinish, onchange) {
		duration = ~~duration;
		if (duration <= 0) {
			this.scaleX = this.scaleY = scale;
		} else {
			var t1 = this.addTween('scaleX', scale, duration, ease, onfinish, onchange);
			if (t1)
				t1.play();
			var t2 = this.addTween('scaleY', scale, duration, ease, (t1 ? null : onfinish), (t1 ? null : onchange));
			if (t2)
				t2.play();
		}
		return this;
	}
	this.nextFrame = function () {
		this.dispatchEvent("enterframe", {
			target : this
		});
		if (!this.history.created)
			this.updateHistory();
		if (!this.animated)
			return;
		this.animStep++;
		if (this.animStep >= this.animDelay) {
			this.currentFrame++;
			this.animStep = 0;
		}
		if (this.currentFrame >= this.totalFrames)
			this.currentFrame = 0;
	};
	this.updateHistory = function () {
		this.history.x = this.getX();
		this.history.y = this.getY();
		this.history.rotation = this.rotation;
		this.history.frame = this.currentFrame;
		var rect = new Rectangle(this.history.x, this.history.y, this.getWidth(), this.getHeight(), this.rotation);
		rect.AABB[0].x -= 1;
		rect.AABB[0].y -= 1;
		rect.AABB[1].x += 1;
		rect.AABB[1].y += 1;
		this.history.AABB = rect.AABB;
		this.history.created = true;
		this.history.changed = false;
	};
	this.history = {
		created : false,
		drawed : false,
		changed : false,
		x : 0,
		y : 0,
		rotation : 0,
		frame : 0,
		AABB : []
	};
	this.eventsWhenInvisible = false;
	this.onmouseover = null;
	this.onmouseout = null;
	this.onmousedown = null;
	this.onmouseup = null;
	this.onclick = null;
	this.oncontextmenu = null;
	this.onmousemove = null;
	this.onenterframe = null;
	this.onrender = null;
	this.onadd = null;
	this.onremove = null;
	this.onbox2dsync = null;
	this.mouseOn = false;
	this.setPosition = function (x, y) {
		this.x = ~~x;
		this.y = ~~y;
	}
	this.setZIndex = function (z) {
		this.zIndex = ~~z;
		if (!this.stage)
			return;
		this.stage.setZIndex(this, ~~z);
	}
	this.eventsListeners = [];
	this.addEventListener = function (type, callback) {
		EventsManager.addEvent(this, type, callback);
	}
	this.removeEventListener = function (type, callback) {
		EventsManager.removeEvent(this, type, callback);
	}
	this.dispatchEvent = function (type, params) {
		return EventsManager.dispatchEvent(this, type, params);
	}
	this.hitTestPoint = function (x, y, checkPixel, checkDragged, debug) {
		if (!this.stage)
			return false;
		return this.stage.hitTestPointObject(this, x, y, checkPixel, checkDragged, debug);
	}
}
function Tween(obj, prop, start, end, duration, callback) {
	var self = this;
	if (typeof obj != 'object')
		obj = null;
	if (obj) {
		if (typeof obj[prop] == 'undefined')
			throw new Error('Trying to tween undefined property "' + prop + '"');
		if (isNaN(obj[prop]))
			throw new Error('Tweened value can not be ' + (typeof obj[prop]));
	} else {
		if (isNaN(prop))
			throw new Error('Tweened value can not be ' + (typeof prop));
	}
	if (typeof callback != 'function')
		callback = Easing.linear.easeIn;
	this.obj = obj;
	this.prop = prop;
	this.onchange = null;
	this.onfinish = null;
	this.start = start;
	this.end = end;
	this.duration = ~~duration;
	this.callback = callback;
	this.playing = false;
	this._pos = -1;
	this.play = function () {
		self.playing = true;
		self.tick();
	}
	this.pause = function () {
		self.playing = false;
	}
	this.rewind = function () {
		self._pos = -1;
	}
	this.forward = function () {
		self._pos = this.duration;
	}
	this.stop = function () {
		self.pause();
		self.rewind();
	}
	this.updateValue = function (val) {
		if (self.obj) {
			self.obj[self.prop] = val;
		} else {
			self.prop = val;
		}
	}
	this.tick = function () {
		if (!self.playing)
			return false;
		self._pos++;
		if (self._pos < 0)
			return false;
		if (self._pos > self.duration)
			return self.finish();
		var func = self.callback;
		var val = func(self._pos, self.start, self.end - self.start, self.duration);
		this.updateValue(val);
		self.dispatchEvent("change", {
			target : self,
			value : val
		});
		return false;
	}
	this.finish = function () {
		self.stop();
		self.updateValue(self.end);
		return self.dispatchEvent("finish", {
			target : self,
			value : self.end
		});
	}
	this.eventsListeners = [];
	this.addEventListener = function (type, callback) {
		EventsManager.addEvent(this, type, callback);
	}
	this.removeEventListener = function (type, callback) {
		EventsManager.removeEvent(this, type, callback);
	}
	this.dispatchEvent = function (type, params) {
		return EventsManager.dispatchEvent(this, type, params);
	}
}
var Easing = {
	back : {
		easeIn : function (t, b, c, d) {
			var s = 1.70158;
			return c * (t /= d) * t * ((s + 1) * t - s) + b;
		},
		easeOut : function (t, b, c, d) {
			var s = 1.70158;
			return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
		},
		easeInOut : function (t, b, c, d) {
			var s = 1.70158;
			if ((t /= d / 2) < 1)
				return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
			return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
		}
	},
	bounce : {
		easeIn : function (t, b, c, d) {
			return c - Easing.bounce.easeOut(d - t, 0, c, d) + b;
		},
		easeOut : function (t, b, c, d) {
			if ((t /= d) < (1 / 2.75))
				return c * (7.5625 * t * t) + b;
			else if (t < (2 / 2.75))
				return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
			else if (t < (2.5 / 2.75))
				return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
			else
				return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
		},
		easeInOut : function (t, b, c, d) {
			if (t < d / 2)
				return Easing.bounce.easeIn(t * 2, 0, c, d) * 0.5 + b;
			else
				return Easing.bounce.easeOut(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
		}
	},
	circular : {
		easeIn : function (t, b, c, d) {
			return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
		},
		easeOut : function (t, b, c, d) {
			return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
		},
		easeInOut : function (t, b, c, d) {
			if ((t /= d / 2) < 1)
				return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
			return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
		}
	},
	cubic : {
		easeIn : function (t, b, c, d) {
			return c * (t /= d) * t * t + b;
		},
		easeOut : function (t, b, c, d) {
			return c * ((t = t / d - 1) * t * t + 1) + b;
		},
		easeInOut : function (t, b, c, d) {
			if ((t /= d / 2) < 1)
				return c / 2 * t * t * t + b;
			return c / 2 * ((t -= 2) * t * t + 2) + b;
		}
	},
	exponential : {
		easeIn : function (t, b, c, d) {
			return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
		},
		easeOut : function (t, b, c, d) {
			return t == d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
		},
		easeInOut : function (t, b, c, d) {
			if (t == 0)
				return b;
			if (t == d)
				return b + c;
			if ((t /= d / 2) < 1)
				return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
			return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
		}
	},
	linear : {
		easeIn : function (t, b, c, d) {
			return c * t / d + b;
		},
		easeOut : function (t, b, c, d) {
			return c * t / d + b;
		},
		easeInOut : function (t, b, c, d) {
			return c * t / d + b;
		}
	},
	quadratic : {
		easeIn : function (t, b, c, d) {
			return c * (t /= d) * t + b;
		},
		easeOut : function (t, b, c, d) {
			return -c * (t /= d) * (t - 2) + b;
		},
		easeInOut : function (t, b, c, d) {
			if ((t /= d / 2) < 1)
				return c / 2 * t * t + b;
			return -c / 2 * ((--t) * (t - 2) - 1) + b;
		}
	},
	quartic : {
		easeIn : function (t, b, c, d) {
			return c * (t /= d) * t * t * t + b;
		},
		easeOut : function (t, b, c, d) {
			return -c * ((t = t / d - 1) * t * t * t - 1) + b;
		},
		easeInOut : function (t, b, c, d) {
			if ((t /= d / 2) < 1)
				return c / 2 * t * t * t * t + b;
			return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
		}
	},
	quintic : {
		easeIn : function (t, b, c, d) {
			return c * (t /= d) * t * t * t * t + b;
		},
		easeOut : function (t, b, c, d) {
			return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
		},
		easeInOut : function (t, b, c, d) {
			if ((t /= d / 2) < 1)
				return c / 2 * t * t * t * t * t + b;
			return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
		}
	},
	sine : {
		easeIn : function (t, b, c, d) {
			return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
		},
		easeOut : function (t, b, c, d) {
			return c * Math.sin(t / d * (Math.PI / 2)) + b;
		},
		easeInOut : function (t, b, c, d) {
			return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
		}
	}
}
function StageTimer(callback, timeout, repeat) {
	this.repeat = repeat;
	this.initialTimeout = timeout;
	this.timeout = timeout;
	this.callback = callback;
	this.paused = false;
	this.update = function () {
		if (this.paused)
			return;
		this.timeout--;
		if (this.timeout == 0) {
			if (typeof this.callback == "function")
				this.callback();
			if (typeof this.callback == "string")
				eval(this.callback);
			if (this.repeat)
				this.timeout = this.initialTimeout;
			else
				return true;
		}
		return false;
	};
	this.resume = function () {
		this.paused = false;
	};
	this.pause = function () {
		this.paused = true;
	};
}
function Stage(cnsId, w, h) {
	var self = this;
	this.canvas = document.getElementById(cnsId);
	this.canvas.renderController = this;
	this.canvas.ctx = this.canvas.getContext('2d');
	this.screenWidth = w;
	this.screenHeight = h;
	this.viewport = {
		x : 0,
		y : 0
	};
	this.objects = [];
	this.objectsCounter = 0;
	this.buffer = document.createElement('canvas');
	this.buffer.width = w * Utils.globalScale;
	this.buffer.height = h * Utils.globalScale;
	this.buffer.ctx = this.buffer.getContext('2d');
	this.delay = 40;
	this.fillColor = false;
	this.started = false;
	this.fps = 0;
	this.lastFPS = 0;
	this.showFPS = false;
	this.pixelClickEvent = false;
	this.pixelMouseUpEvent = false;
	this.pixelMouseDownEvent = false;
	this.pixelMouseMoveEvent = false;
	this.ceilSizes = false;
	this.tmMain;
	this.tmFPS;
	this.partialUpdate = false;
	this.clearLock = false;
	this.destroy = function () {
		clearTimeout(this.tmMain);
		clearTimeout(this.tmFPS);
		this.stop();
		this.clear();
		this.clearScreen(this.canvas);
	}
	this.clearScreen = function (canvas) {
		canvas.ctx.clearRect(0, 0, this.screenWidth * Utils.globalScale * Utils.globalPixelScale, this.screenHeight * Utils.globalScale * Utils.globalPixelScale);
	}
	this.findMaxZIndex = function () {
		var max = -1;
		var ix = false;
		for (var i = 0; i < this.objects.length; i++) {
			if (this.objects[i].zIndex > max) {
				max = this.objects[i].zIndex;
				ix = i;
			}
		}
		return {
			index : ix,
			zIndex : max
		};
	};
	this.findMinZIndex = function () {
		var min = -1;
		var ix = false;
		for (var i = 0; i < this.objects.length; i++) {
			if (i == 0) {
				min = this.objects[i].zIndex;
				ix = 0;
			}
			if (this.objects[i].zIndex < min) {
				min = this.objects[i].zIndex;
				ix = i;
			}
		}
		return {
			index : ix,
			zIndex : min
		};
	};
	this.addChild = function (item) {
		var f = this.findMaxZIndex();
		var z = item.zIndex;
		if (f.index !== false)
			item.zIndex = f.zIndex + 1;
		else
			item.zIndex = 0;
		this.objectsCounter++;
		item.uid = this.objectsCounter;
		item.stage = this;
		this.objects.push(item);
		if (z != 0) {
			this.setZIndex(item, ~~z);
		}
		item.dispatchEvent("add", {
			target : item
		});
		return item;
	};
	this.removeChild = function (item) {
		if (item) {
			this.clearObjectTweens(item);
			item.dispatchEvent("remove", {
				target : item
			});
			item.stage = null;
			this.objects = Utils.removeFromArray(this.objects, item);
		}
	};
	this.setZIndex = function (item, index) {
		var bSort = true;
		var i,
		tmp;
		item.zIndex = index;
		while (bSort) {
			bSort = false;
			for (i = 0; i < this.objects.length - 1; i++) {
				if (this.objects[i].zIndex > this.objects[i + 1].zIndex) {
					tmp = this.objects[i];
					this.objects[i] = this.objects[i + 1];
					this.objects[i + 1] = tmp;
					bSort = true;
				}
			}
		}
	}
	this.hitTestPointObject = function (obj, x, y, pixelCheck, includeDragged, debug) {
		var cX,
		cY,
		cW,
		cH,
		mX,
		mY,
		r,
		present,
		imageData;
		cW = obj.width * Math.abs(obj.scaleX);
		cH = obj.height * Math.abs(obj.scaleY);
		cX = obj.x - cW / 2;
		cY = obj.y - cH / 2;
		mX = x;
		mY = y;
		if (!obj.ignoreViewport) {
			mX += this.viewport.x;
			mY += this.viewport.y;
		}
		present = false;
		if (obj.rotation == 0) {
			if (cX <= mX && cY <= mY && cX + cW >= mX && cY + cH >= mY)
				present = true;
		} else {
			r = new Rectangle(obj.x, obj.y, cW, cH, obj.rotation);
			if (r.hitTestPoint(new Vector(mX, mY)))
				present = true;
		}
		if (present && pixelCheck) {
			this.buffer.width = this.screenWidth * Utils.globalScale * Utils.globalPixelScale;
			this.buffer.height = this.screenHeight * Utils.globalScale * Utils.globalPixelScale;
			this.clearScreen(this.buffer);
			this.renderObject(this.buffer, obj);
			var pX = Math.floor(x * Utils.globalScale * Utils.globalPixelScale);
			var pY = Math.floor(y * Utils.globalScale * Utils.globalPixelScale);
			imageData = this.buffer.ctx.getImageData(pX, pY, 1, 1);
			if (imageData.data[3] == 0)
				present = false;
		}
		if (!present && includeDragged && obj.dragged)
			present = true;
		return present;
	}
	this.getObjectsStackByCoord = function (x, y, pixelCheck, includeDragged, debug) {
		var obj;
		var tmp = [];
		for (var i = 0; i < this.objects.length; i++) {
			if (this.objects[i].visible || this.objects[i].eventsWhenInvisible) {
				obj = this.objects[i];
				if (this.hitTestPointObject(obj, x, y, pixelCheck, includeDragged, debug)) {
					tmp.push(obj);
				}
			}
		}
		return tmp;
	};
	this.getMaxZIndexInStack = function (stack) {
		var max = -1;
		var ix = 0;
		for (var i = 0; i < stack.length; i++) {
			if (stack[i].zIndex > max) {
				max = stack[i].zIndex;
				ix = i;
			}
		}
		return ix;
	};
	this.sortStack = function (stack, revert) {
		var bSort = true;
		var ok;
		var i,
		tmp;
		while (bSort) {
			bSort = false;
			for (i = 0; i < stack.length - 1; i++) {
				ok = false;
				if (stack[i].zIndex < stack[i + 1].zIndex && !revert)
					ok = true;
				if (stack[i].zIndex > stack[i + 1].zIndex && revert)
					ok = true;
				if (ok) {
					tmp = stack[i];
					stack[i] = stack[i + 1];
					stack[i + 1] = tmp;
					bSort = true;
				}
			}
		}
		return stack;
	}
	this.finalizeMouseCoords = function (obj, m) {
		if (!obj)
			return m;
		var eX = this.prepareMouseCoord(m.x);
		var eY = this.prepareMouseCoord(m.y);
		if (!obj.ignoreViewport) {
			eX += this.viewport.x;
			eY += this.viewport.y;
		}
		eX = eX - obj.x;
		eY = eY - obj.y;
		return {
			x : eX,
			y : eY
		};
	}
	this.prepareMouseCoord = function (val) {
		return val / Utils.globalScale / Utils.globalPixelScale;
	}
	this.checkClick = function (event) {
		var m = Utils.getMouseCoord(event, this.canvas);
		var stack = this.getObjectsStackByCoord(this.prepareMouseCoord(m.x), this.prepareMouseCoord(m.y), this.pixelClickEvent, false, true);
		var ret,
		f;
		if (stack.length > 0) {
			stack = this.sortStack(stack);
			for (var i = 0; i < stack.length; i++) {
				f = this.finalizeMouseCoords(stack[i], m);
				ret = stack[i].dispatchEvent("click", {
						target : stack[i],
						x : f.x,
						y : f.y
					});
				if (ret === false)
					return;
			}
		}
	};
	this.checkContextMenu = function (event) {
		var m = Utils.getMouseCoord(event, this.canvas);
		var stack = this.getObjectsStackByCoord(this.prepareMouseCoord(m.x), this.prepareMouseCoord(m.y), this.pixelClickEvent);
		var ret,
		f;
		if (stack.length > 0) {
			stack = this.sortStack(stack);
			for (var i = 0; i < stack.length; i++) {
				f = this.finalizeMouseCoords(stack[i], m);
				ret = stack[i].dispatchEvent("contextmenu", {
						target : stack[i],
						x : f.x,
						y : f.y
					});
				if (ret === false)
					return;
			}
		}
	};
	this.checkMouseMove = function (event) {
		var m = Utils.getMouseCoord(event, this.canvas);
		for (i = 0; i < this.objects.length; i++) {
			if (this.objects[i].dragged) {
				var eX = m.x / Utils.globalScale / Utils.globalPixelScale;
				var eY = m.y / Utils.globalScale / Utils.globalPixelScale;
				if (!this.objects[i].ignoreViewport) {
					eX += this.viewport.x;
					eY += this.viewport.y;
				}
				this.objects[i].x = eX - this.objects[i].dragX;
				this.objects[i].y = eY - this.objects[i].dragY;
			}
		}
		var stack = this.getObjectsStackByCoord(this.prepareMouseCoord(m.x), this.prepareMouseCoord(m.y), this.pixelMouseMoveEvent);
		var i,
		n,
		ret,
		bOk,
		f;
		var overStack = [];
		if (stack.length > 0) {
			stack = this.sortStack(stack);
			for (i = 0; i < stack.length; i++) {
				overStack.push(stack[i]);
				f = this.finalizeMouseCoords(stack[i], m);
				if (!stack[i].mouseOn)
					ret = stack[i].dispatchEvent("mouseover", {
							target : stack[i],
							x : f.x,
							y : f.y
						});
				stack[i].mouseOn = true;
				if (ret === false)
					break;
			}
			for (i = 0; i < stack.length; i++) {
				f = this.finalizeMouseCoords(stack[i], m);
				ret = stack[i].dispatchEvent("mousemove", {
						target : stack[i],
						x : f.x,
						y : f.y
					});
				if (ret === false)
					break;
			}
		}
		for (i = 0; i < this.objects.length; i++) {
			if (this.objects[i].mouseOn) {
				bOk = false;
				for (n = 0; n < overStack.length; n++) {
					if (overStack[n] == this.objects[i])
						bOk = true;
				}
				if (!bOk) {
					this.objects[i].mouseOn = false;
					f = this.finalizeMouseCoords(stack[i], m);
					ret = this.objects[i].dispatchEvent("mouseout", {
							target : this.objects[i],
							x : f.x,
							y : f.y
						});
					if (ret === false)
						break;
				}
			}
		}
	};
	this.checkMouseDown = function (event) {
		var m = Utils.getMouseCoord(event, this.canvas);
		var stack = this.getObjectsStackByCoord(this.prepareMouseCoord(m.x), this.prepareMouseCoord(m.y), this.pixelMouseDownEvent);
		var ret,
		f;
		if (stack.length > 0) {
			stack = this.sortStack(stack);
			for (var i = 0; i < stack.length; i++) {
				f = this.finalizeMouseCoords(stack[i], m);
				ret = stack[i].dispatchEvent("mousedown", {
						target : stack[i],
						x : f.x,
						y : f.y
					});
				if (ret === false)
					return;
			}
		}
	};
	this.checkMouseUp = function (event) {
		var m = Utils.getMouseCoord(event, this.canvas);
		var stack = this.getObjectsStackByCoord(this.prepareMouseCoord(m.x), this.prepareMouseCoord(m.y), this.pixelMouseUpEvent, true);
		var ret,
		f;
		if (stack.length > 0) {
			stack = this.sortStack(stack);
			for (var i = 0; i < stack.length; i++) {
				f = this.finalizeMouseCoords(stack[i], m);
				ret = stack[i].dispatchEvent("mouseup", {
						target : stack[i],
						x : f.x,
						y : f.y
					});
				if (ret === false)
					return;
			}
		}
	};
	this.clear = function () {
		for (var i = 0; i < this.objects.length; i++) {
			this.objects[i].dispatchEvent("remove", {
				target : this.objects[i]
			});
		}
		this.objects = [];
		this.tweens = [];
		this.timers = [];
		this.eventsListeners = [];
		this.objectsCounter = 0;
	};
	this.hitTest = function (obj1, obj2) {
		if (obj1.rotation == 0 && obj2.rotation == 0) {
			var cX1 = obj1.getX() - obj1.getWidth() / 2;
			var cY1 = obj1.getY() - obj1.getHeight() / 2;
			var cX2 = obj2.getX() - obj2.getWidth() / 2;
			var cY2 = obj2.getY() - obj2.getHeight() / 2;
			var top = Math.max(cY1, cY2);
			var left = Math.max(cX1, cX2);
			var right = Math.min(cX1 + obj1.getWidth(), cX2 + obj2.getWidth());
			var bottom = Math.min(cY1 + obj1.getHeight(), cY2 + obj2.getHeight());
			var width = right - left;
			var height = bottom - top;
			if (width > 0 && height > 0)
				return true;
			else
				return false;
		} else {
			var r1 = new Rectangle(obj1.getX(), obj1.getY(), obj1.getWidth(), obj1.getHeight(), obj1.rotation);
			var r2 = new Rectangle(obj2.getX(), obj2.getY(), obj2.getWidth(), obj2.getHeight(), obj2.rotation);
			return r1.hitTestRectangle(r2);
		}
	};
	this.drawRectangle = function (x, y, width, height, color, fill, opacity, ignoreViewport) {
		var cns = this.canvas;
		if (typeof opacity != 'undefined')
			cns.ctx.globalAlpha = opacity;
		else
			cns.ctx.globalAlpha = 1;
		cns.ctx.fillStyle = color;
		cns.ctx.strokeStyle = color;
		if (!ignoreViewport) {
			x -= this.viewport.x;
			y -= this.viewport.y;
		}
		x = x * Utils.globalScale * Utils.globalPixelScale;
		y = y * Utils.globalScale * Utils.globalPixelScale;
		width = width * Utils.globalScale * Utils.globalPixelScale;
		height = height * Utils.globalScale * Utils.globalPixelScale;
		if (fill)
			cns.ctx.fillRect(x - width / 2, y - height / 2, width, height);
		else
			cns.ctx.strokeRect(x - width / 2, y - height / 2, width, height);
	};
	this.drawCircle = function (x, y, radius, width, color, opacity, ignoreViewport) {
		this.drawArc(x, y, radius, 0, Math.PI * 2, false, width, color, opacity, ignoreViewport);
	};
	this.drawArc = function (x, y, radius, startAngle, endAngle, anticlockwise, width, color, opacity, ignoreViewport) {
		var cns = this.canvas;
		var oldLW = cns.ctx.lineWidth;
		if (typeof color == "undefined")
			color = "#000"
				cns.ctx.strokeStyle = color;
		if (typeof width == "undefined")
			width = 1;
		cns.ctx.lineWidth = width * Utils.globalScale * Utils.globalPixelScale;
		if (typeof opacity == "undefined")
			opacity = 1;
		cns.ctx.globalAlpha = opacity;
		if (!ignoreViewport) {
			x -= this.viewport.x;
			y -= this.viewport.y;
		}
		x = x * Utils.globalScale * Utils.globalPixelScale;
		y = y * Utils.globalScale * Utils.globalPixelScale;
		radius = radius * Utils.globalScale * Utils.globalPixelScale;
		cns.ctx.beginPath();
		cns.ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
		cns.ctx.stroke();
		cns.ctx.lineWidth = oldLW;
	};
	this.drawPolygon = function (points, width, color, opacity, ignoreViewport) {
		if ((typeof points != "object") || !(points instanceof Array) || points.length < 2)
			return;
		for (var i = 0; i < points.length - 1; i++) {
			this.drawLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, width, color, opacity, ignoreViewport);
		}
		this.drawLine(points[i].x, points[i].y, points[0].x, points[0].y, width, color, opacity, ignoreViewport);
	}
	this.drawLine = function (x1, y1, x2, y2, width, color, opacity, ignoreViewport) {
		var cns = this.canvas;
		var oldLW = cns.ctx.lineWidth;
		if (color)
			cns.ctx.strokeStyle = color;
		else
			cns.ctx.strokeStyle = '#000';
		if (width)
			cns.ctx.lineWidth = width * Utils.globalScale * Utils.globalPixelScale;
		else
			cns.ctx.lineWidth = 1 * Utils.globalScale * Utils.globalPixelScale;
		if (opacity)
			cns.ctx.globalAlpha = opacity;
		else
			cns.ctx.globalAlpha = 1;
		if (!ignoreViewport) {
			x1 -= this.viewport.x;
			y1 -= this.viewport.y;
			x2 -= this.viewport.x;
			y2 -= this.viewport.y;
		}
		x1 = x1 * Utils.globalScale * Utils.globalPixelScale;
		y1 = y1 * Utils.globalScale * Utils.globalPixelScale;
		x2 = x2 * Utils.globalScale * Utils.globalPixelScale;
		y2 = y2 * Utils.globalScale * Utils.globalPixelScale;
		cns.ctx.beginPath();
		cns.ctx.moveTo(x1, y1);
		cns.ctx.lineTo(x2, y2);
		cns.ctx.closePath();
		cns.ctx.stroke();
		cns.ctx.lineWidth = oldLW;
	};
	this.start = function () {
		if (this.started)
			return;
		this.started = true;
		clearFPS();
		render();
	}
	this.forceRender = function () {
		if (this.started)
			render();
	}
	this.stop = function () {
		this.started = false;
	}
	function clearFPS() {
		self.lastFPS = self.fps;
		self.fps = 0;
		if (self.started)
			self.tmFPS = setTimeout(clearFPS, 1000);
	}
	this.setTextStyle = function (font, size, style, color, borderColor, canvas) {
		var cns = (canvas ? canvas : this.canvas);
		cns.ctx.fillStyle = color;
		cns.ctx.strokeStyle = borderColor;
		var s = "";
		if (style)
			s += style + " ";
		if (size)
			s += Math.floor(size * Utils.globalScale * Utils.globalPixelScale) + "px ";
		if (font)
			s += font;
		cns.ctx.font = s;
	}
	this.drawText = function (text, x, y, opacity, ignoreViewport, alignCenter, canvas) {
		var cns = (canvas ? canvas : this.canvas);
		if (typeof opacity == "undefined")
			cns.ctx.globalAlpha = 1;
		else
			cns.ctx.globalAlpha = opacity;
		if (!ignoreViewport) {
			x -= this.viewport.x;
			y -= this.viewport.y;
		}
		x = x * Utils.globalScale * Utils.globalPixelScale;
		y = y * Utils.globalScale * Utils.globalPixelScale;
		if (alignCenter)
			x = x - this.getTextWidth(text) / 2;
		cns.ctx.fillText(text, x, y);
	}
	this.strokeText = function (text, x, y, opacity, ignoreViewport, alignCenter, canvas) {
		var cns = (canvas ? canvas : this.canvas);
		if (typeof opacity == "undefined")
			cns.ctx.globalAlpha = 1;
		else
			cns.ctx.globalAlpha = opacity;
		if (!ignoreViewport) {
			x -= this.viewport.x;
			y -= this.viewport.y;
		}
		x = x * Utils.globalScale * Utils.globalPixelScale;
		y = y * Utils.globalScale * Utils.globalPixelScale;
		if (alignCenter)
			x = x - this.getTextWidth(text) / 2;
		cns.ctx.strokeText(text, x, y);
	}
	this.getTextWidth = function (str, canvas) {
		var cns = (canvas ? canvas : this.canvas);
		return cns.ctx.measureText(str).width;
	}
	this.renderObject = function (cns, obj) {
		var canvasMod = false;
		var ow = obj.width * Utils.globalScale;
		var oh = obj.height * Utils.globalScale;
		var ox = obj.getX() * Utils.globalPixelScale - Math.floor(ow / 2);
		var oy = obj.getY() * Utils.globalPixelScale - Math.floor(oh / 2);
		if (!obj.ignoreViewport) {
			ox -= this.viewport.x * Utils.globalPixelScale * Utils.globalScale;
			oy -= this.viewport.y * Utils.globalPixelScale * Utils.globalScale;
		}
		var or = obj.rotation;
		var scX = obj.scaleX * Utils.globalPixelScale;
		var scY = obj.scaleY * Utils.globalPixelScale;
		if (or != 0 || scX != 1 || scY != 1) {
			canvasMod = true;
			cns.ctx.save();
			cns.ctx.translate(ox + Math.floor(ow / 2), oy + Math.floor(oh / 2));
			cns.ctx.rotate(or);
			cns.ctx.scale(scX, scY);
			ox = -Math.floor(ow / 2);
			oy = -Math.floor(oh / 2);
		}
		cns.ctx.globalAlpha = obj.opacity;
		if (this.ceilSizes) {
			ow = Math.ceil(ow);
			oh = Math.ceil(oh);
		}
		if (obj.fillColor) {
			cns.ctx.fillStyle = obj.fillColor;
			cns.ctx.strokeStyle = obj.fillColor;
			cns.ctx.fillRect(ox, oy, ow, oh);
		}
		if (obj.bitmap) {
			var iw = obj.bitmap.width;
			var ih = obj.bitmap.height;
			var fx = obj.currentLayer * ow + obj.offset.left * Utils.globalScale;
			var fy = obj.currentFrame * oh + obj.offset.top * Utils.globalScale;
			if (fx < iw && fy < ih) {
				var fw = ow;
				if (fx + fw > iw)
					fw = iw - fx;
				var fh = oh;
				if (fy + fh > ih)
					fh = ih - fy;
				var masked = false;
				if (obj.mask && obj.bitmap) {
					this.buffer.ctx.save();
					this.buffer.ctx.clearRect(0, 0, fw, fh);
					this.buffer.ctx.drawImage(obj.bitmap, fx, fy, fw, fh, 0, 0, fw, fh);
					this.buffer.ctx.globalCompositeOperation = "destination-in";
					this.buffer.ctx.drawImage(obj.mask, 0, 0);
					fx = 0;
					fy = 0;
					masked = true;
				}
				try {
					cns.ctx.drawImage(masked ? this.buffer : obj.bitmap, ~~fx, ~~fy, ~~fw, ~~fh, ~~ox, ~~oy, ~~ow, ~~oh);
				} catch (e) {}
				if (masked)
					this.buffer.ctx.restore();
			}
		}
		if (canvasMod)
			cns.ctx.restore();
		obj.dispatchEvent("render", {
			target : obj,
			canvas : cns
		});
	}
	this.clearObjectAABB = function (cns, obj) {
		var w = obj.history.AABB[1].x - obj.history.AABB[0].x;
		var h = obj.history.AABB[1].y - obj.history.AABB[0].y;
		if (!this.fillColor)
			cns.ctx.clearRect((obj.history.AABB[0].x - this.viewport.x) * Utils.globalPixelScale, (obj.history.AABB[0].y - this.viewport.y) * Utils.globalPixelScale, w * Utils.globalPixelScale, h * Utils.globalPixelScale);
		else {
			cns.ctx.fillStyle = this.fillColor;
			cns.ctx.fillRect((obj.history.AABB[0].x - this.viewport.x) * Utils.globalPixelScale, (obj.history.AABB[0].y - this.viewport.y) * Utils.globalPixelScale, w * Utils.globalPixelScale, h * Utils.globalPixelScale);
		}
	};
	this.addPartialDraw = function (partialDraw, obj) {
		partialDraw.push(obj);
		obj.history.drawed = true;
		obj.history.changed = true;
		for (var i = 0; i < this.objects.length; i++) {
			if (!this.objects[i].history.changed && this.objects[i].visible && !this.objects[i]['static']) {
				var top = Math.max(obj.history.AABB[0].y, this.objects[i].history.AABB[0].y);
				var left = Math.max(obj.history.AABB[0].x, this.objects[i].history.AABB[0].x);
				var right = Math.min(obj.history.AABB[1].x, this.objects[i].history.AABB[1].x);
				var bottom = Math.min(obj.history.AABB[1].y, this.objects[i].history.AABB[1].y);
				var width = right - left;
				var height = bottom - top;
				if (width > 0 && height > 0)
					this.addPartialDraw(partialDraw, this.objects[i]);
			}
		}
		return partialDraw;
	};
	this.drawScenePartial = function (cns) {
		var partialDraw = [];
		var rect,
		obj;
		if (!cns.ctx)
			cns.ctx = cns.getContext("2d");
		for (var i = 0; i < this.objects.length; i++) {
			this.objects[i].nextFrame();
		}
		for (i = 0; i < this.objects.length; i++) {
			obj = this.objects[i];
			if (obj.visible && !obj['static']) {
				if (obj.destroy || obj.drawAlways || !obj.history.drawed || obj.currentFrame != obj.history.frame || obj.getX() != obj.history.x || obj.getY() != obj.history.y || obj.rotation != obj.history.rotation) {
					partialDraw = this.addPartialDraw(partialDraw, obj);
				}
			}
		}
		partialDraw = this.sortStack(partialDraw, true);
		var w,
		h;
		for (i = 0; i < partialDraw.length; i++) {
			this.clearObjectAABB(cns, partialDraw[i]);
		}
		for (i = 0; i < partialDraw.length; i++) {
			obj = partialDraw[i];
			if (obj.destroy) {
				this.removeChild(obj);
			} else {
				this.renderObject(cns, obj);
				obj.updateHistory();
			}
		}
	}
	this.drawScene = function (cns, drawStatic) {
		var obj,
		ok;
		if (!cns.ctx)
			cns.ctx = cns.getContext("2d");
		if (!this.fillColor) {
			if (!this.clearLock)
				this.clearScreen(cns);
		} else {
			cns.ctx.fillStyle = this.fillColor;
			cns.ctx.fillRect(0, 0, this.screenWidth * Utils.globalScale * Utils.globalPixelScale, this.screenHeight * Utils.globalScale * Utils.globalPixelScale);
		}
		for (var i = 0; i < this.objects.length; i++) {
			obj = this.objects[i];
			ok = false;
			if (!drawStatic && !obj['static'])
				ok = true;
			if (drawStatic && obj['static'])
				ok = true;
			if (ok) {
				if (obj.destroy) {
					this.removeChild(obj);
					i--;
				} else {
					obj.nextFrame();
					if (obj.visible)
						this.renderObject(cns, obj);
				}
			}
		}
	};
	this.tweens = [];
	this.createTween = function (obj, prop, start, end, duration, ease) {
		var t = new Tween(obj, prop, start, end, duration, ease);
		self.tweens.push(t);
		return t;
	}
	this.removeTween = function (t) {
		var id = null;
		if (isNaN(t)) {
			for (var i = 0; i < self.tweens.length; i++)
				if (self.tweens[i] === t) {
					id = i;
					break;
				}
		} else
			id = t;
		self.tweens[id].pause();
		self.tweens.splice(id, 1);
		return id;
	}
	this.clearObjectTweens = function (obj) {
		for (var i = 0; i < self.tweens.length; i++)
			if (self.tweens[i].obj === obj) {
				i = self.removeTween(i);
			}
	}
	this.updateTweens = function () {
		for (var i = 0; i < self.tweens.length; i++) {
			if (self.tweens[i].tick()) {
				i = self.removeTween(i);
			}
		}
	}
	this.timers = [];
	this.setTimeout = function (callback, timeout) {
		var t = new StageTimer(callback, timeout);
		this.timers.push(t);
		return t;
	};
	this.clearTimeout = function (t) {
		this.timers = Utils.removeFromArray(this.timers, t);
	};
	this.setInterval = function (callback, timeout) {
		var t = new StageTimer(callback, timeout, true);
		this.timers.push(t);
		return t;
	};
	this.clearInterval = function (t) {
		this.clearTimeout(t);
	};
	this.updateTimers = function () {
		for (var i = 0; i < this.timers.length; i++) {
			if (this.timers[i].update()) {
				this.clearTimeout(this.timers[i]);
				i--;
			}
		}
	};
	function render() {
		clearTimeout(self.tmMain);
		var tm_start = new Date().getTime();
		self.updateTweens();
		self.updateTimers();
		self.dispatchEvent("pretick");
		if (self.partialUpdate)
			self.drawScenePartial(self.canvas);
		else
			self.drawScene(self.canvas, false);
		if (self.showFPS) {
			self.setTextStyle("sans-serif", 10, "bold", "#fff", "#000");
			self.drawText("FPS: " + self.lastFPS, 2, 10, 1, true);
		}
		self.dispatchEvent("posttick");
		var d = new Date().getTime() - tm_start;
		d = self.delay - d - 1;
		if (d < 1)
			d = 1;
		self.fps++;
		if (self.started)
			self.tmMain = setTimeout(render, d);
	};
	this.box2dSync = function (world) {
		var p;
		for (b = world.m_bodyList; b; b = b.m_next) {
			if (b.sprite) {
				b.sprite.rotation = b.GetRotation();
				p = b.GetPosition();
				b.sprite.x = p.x;
				b.sprite.y = p.y;
				b.sprite.dispatchEvent("box2dsync", {
					target : b.sprite
				});
			}
		}
	}
	this.lastTouchCoords = {
		x : 0,
		y : 0
	};
	this.storeTouchCoords = function (event) {
		var e = event || window.event;
		if (e.touches)
			e = e.touches[0];
		if (!e)
			return;
		this.lastTouchCoords.x = e.clientX;
		this.lastTouchCoords.y = e.clientY;
	}
	this.checkTouchEnd = function () {
		var e = {
			pageX : this.lastTouchCoords.x,
			pageY : this.lastTouchCoords.y
		};
		this.checkMouseUp(e);
	}
	this.processTouchEvent = function (event, controller) {
		for (var i = 0; i < event.touches.length; i++) {
			var e = {
				clientX : event.touches[i].clientX,
				clientY : event.touches[i].clientY
			};
			self[controller](e);
		}
	}
	if ("ontouchstart" in this.canvas) {
		this.canvas.ontouchstart = function (event) {
			this.renderController.processTouchEvent(event, "storeTouchCoords");
			this.renderController.processTouchEvent(event, "checkMouseDown");
			this.renderController.processTouchEvent(event, "checkClick");
		};
		this.canvas.ontouchmove = function (event) {
			this.renderController.processTouchEvent(event, "storeTouchCoords");
			this.renderController.processTouchEvent(event, "checkMouseMove");
		};
		this.canvas.ontouchend = function (event) {
			this.renderController.checkTouchEnd();
		};
	} else {
		this.canvas.onclick = function (event) {
			this.renderController.checkClick(event);
		};
		this.canvas.onmousemove = function (event) {
			this.renderController.checkMouseMove(event);
		};
		this.canvas.onmousedown = function (event) {
			if (event.button == 0)
				this.renderController.checkMouseDown(event);
		};
		this.canvas.onmouseup = function (event) {
			if (event.button == 0)
				this.renderController.checkMouseUp(event);
		};
		this.canvas.oncontextmenu = function (event) {
			this.renderController.checkContextMenu(event);
		};
	}
	this.onpretick = null;
	this.onposttick = null;
	this.eventsListeners = [];
	this.addEventListener = function (type, callback) {
		EventsManager.addEvent(this, type, callback);
	}
	this.removeEventListener = function (type, callback) {
		EventsManager.removeEvent(this, type, callback);
	}
	this.dispatchEvent = function (type, params) {
		return EventsManager.dispatchEvent(this, type, params);
	}
}
function Vector(x, y) {
	if (typeof(x) == 'undefined')
		x = 0;
	this.x = x;
	if (typeof(y) == 'undefined')
		y = 0;
	this.y = y;
	this.clone = function () {
		return new Vector(this.x, this.y);
	}
	this.add = function (p) {
		this.x += p.x;
		this.y += p.y;
	}
	this.subtract = function (p) {
		this.x -= p.x;
		this.y -= p.y;
	}
	this.rotate = function (angle, offset) {
		if (typeof(offset) == 'undefined')
			offset = new Vector(0, 0);
		var r = this.clone();
		r.subtract(offset);
		r.x = this.x * Math.cos(angle) + this.y * Math.sin(angle);
		r.y = this.x * -Math.sin(angle) + this.y * Math.cos(angle);
		r.add(offset);
		this.x = r.x;
		this.y = r.y;
	}
	this.normalize = function (angle, offset) {
		if (typeof(offset) == 'undefined')
			offset = new Vector(0, 0);
		this.subtract(offset);
		this.rotate(-angle);
	}
	this.getLength = function () {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
}
var Rectangle = function (x, y, w, h, angle) {
	this.center = new Vector(x, y);
	this.width = w;
	this.height = h;
	this.angle = angle;
	this.vertices = [];
	this.AABB = [];
	this.clone = function () {
		return new Rectangle(this.center.x, this.center.y, this.width, this.height, this.angle);
	}
	this.refreshVertices = function () {
		var w = this.width / 2;
		var h = this.height / 2;
		this.vertices = [];
		this.vertices.push(new Vector(-w, h));
		this.vertices.push(new Vector(w, h));
		this.vertices.push(new Vector(w, -h));
		this.vertices.push(new Vector(-w, -h));
		this.AABB = [this.center.clone(), this.center.clone()];
		for (var i = 0; i < 4; i++) {
			this.vertices[i].rotate(-this.angle, this.center);
			if (this.vertices[i].x < this.AABB[0].x)
				this.AABB[0].x = this.vertices[i].x;
			if (this.vertices[i].x > this.AABB[1].x)
				this.AABB[1].x = this.vertices[i].x;
			if (this.vertices[i].y < this.AABB[0].y)
				this.AABB[0].y = this.vertices[i].y;
			if (this.vertices[i].y > this.AABB[1].y)
				this.AABB[1].y = this.vertices[i].y;
		}
	}
	this.move = function (x, y) {
		this.center.add(new Vector(x, y));
		this.refreshVertices();
	}
	this.rotate = function (angle) {
		this.angle += angle;
		this.refreshVertices();
	}
	this.hitTestPoint = function (point) {
		var p = point.clone();
		p.normalize(-this.angle, this.center);
		return ((Math.abs(p.x) <= (this.width / 2)) && (Math.abs(p.y) <= (this.height / 2)));
	}
	this.hitTestRectangle = function (rect) {
		var r1 = this.clone();
		var r2 = rect.clone();
		var len,
		len1,
		len2;
		r1.move(-this.center.x, -this.center.y);
		r2.move(-this.center.x, -this.center.y);
		r2.center.rotate(this.angle);
		r1.rotate(-this.angle);
		r2.rotate(-this.angle);
		len = Math.max(r1.AABB[0].x, r1.AABB[1].x, r2.AABB[0].x, r2.AABB[1].x) - Math.min(r1.AABB[0].x, r1.AABB[1].x, r2.AABB[0].x, r2.AABB[1].x);
		len1 = r1.AABB[1].x - r1.AABB[0].x;
		len2 = r2.AABB[1].x - r2.AABB[0].x;
		if (len > len1 + len2)
			return false;
		len = Math.max(r1.AABB[0].y, r1.AABB[1].y, r2.AABB[0].y, r2.AABB[1].y) - Math.min(r1.AABB[0].y, r1.AABB[1].y, r2.AABB[0].y, r2.AABB[1].y);
		len1 = r1.AABB[1].y - r1.AABB[0].y;
		len2 = r2.AABB[1].y - r2.AABB[0].y;
		if (len > len1 + len2)
			return false;
		r1.move(-r2.center.x, -r2.center.y);
		r2.move(-r2.center.x, -r2.center.y);
		r1.center.rotate(r2.angle);
		r1.refreshVertices();
		r1.rotate(-r2.angle);
		r2.rotate(-r2.angle);
		len = Math.max(r1.AABB[0].x, r1.AABB[1].x, r2.AABB[0].x, r2.AABB[1].x) - Math.min(r1.AABB[0].x, r1.AABB[1].x, r2.AABB[0].x, r2.AABB[1].x);
		len1 = r1.AABB[1].x - r1.AABB[0].x;
		len2 = r2.AABB[1].x - r2.AABB[0].x;
		if (len > len1 + len2)
			return false;
		len = Math.max(r1.AABB[0].y, r1.AABB[1].y, r2.AABB[0].y, r2.AABB[1].y) - Math.min(r1.AABB[0].y, r1.AABB[1].y, r2.AABB[0].y, r2.AABB[1].y);
		len1 = r1.AABB[1].y - r1.AABB[0].y;
		len2 = r2.AABB[1].y - r2.AABB[0].y;
		if (len > len1 + len2)
			return false;
		return true;
	}
	this.refreshVertices();
}
var Asset = function (name, src, w, h, f, l) {
	this.name = name + '';
	this.src = src + '';
	this.width = w;
	this.height = h;
	this.frames = f;
	this.layers = l;
	this.bitmap = null;
	this.object = null;
	this.ready = (this.width && this.height);
	this.detectSize = function () {
		if (!this.bitmap)
			return false;
		try {
			if (isNaN(this.width)) {
				this.width = this.bitmap.width ? parseInt(this.bitmap.width) : 0;
			}
			if (isNaN(this.height)) {
				this.height = this.bitmap.height ? parseInt(this.bitmap.height) : 0;
			}
		} catch (e) {
			if (CRENDER_DEBUG)
				console.log(e);
		}
		return (!isNaN(this.width) && !isNaN(this.height));
	}
	this.normalize = function (scale) {
		if (this.ready)
			return;
		if (!this.detectSize())
			return;
		if (isNaN(this.frames) || this.frames < 1)
			this.frames = 1;
		if (isNaN(this.layers) || this.layers < 1)
			this.layers = 1;
		this.width = Math.ceil((this.width / this.layers) / scale);
		this.height = Math.ceil((this.height / this.frames) / scale);
		this.ready = true;
	}
}
var AssetsLibrary = function (path, scale, assets) {
	var self = this;
	this.path = 'images';
	this.scale = 1;
	this.items = {};
	this.bitmaps = {};
	this.loaded = false;
	this.onload = null;
	this.onloadprogress = null;
	this.spriteClass = Sprite;
	this.init = function (path, scale) {
		if (typeof path != 'undefined') {
			this.path = path + '';
		}
		if (typeof scale != 'undefined') {
			this.scale = parseFloat(scale);
			if (isNaN(this.scale))
				this.scale = 1;
		}
	}
	this.addAssets = function (data) {
		if (typeof data == 'undefined')
			return;
		if (typeof data != 'object')
			return;
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			item.noscale = (typeof item.noscale == 'undefined') ? false : item.noscale;
			if (!item.noscale)
				item.src = '%SCALE%/' + item.src;
			this.addAsset(item.src, item.name, item.width, item.height, item.frames, item.layers);
		}
	}
	this.addAsset = function (src, name, w, h, f, l) {
		function src2name(src) {
			var name = src.split('/');
			name = name.pop();
			name = name.split('.');
			name = name.shift() + '';
			return name;
		}
		src = src.replace('%SCALE%', '%PATH%/' + this.scale);
		src = src.replace('%PATH%', this.path);
		if (typeof name == 'undefined')
			name = src2name(src);
		var asset = new Asset(name, src, w, h, f, l);
		this.items[name] = asset;
		return asset;
	}
	this.addObject = function (obj) {
		var asset = this.addAsset('%SCALE%/' + obj.image, obj.name, obj.width * this.scale, obj.height * this.scale, obj.frames, obj.layers);
		if (asset)
			asset.object = obj;
		return asset;
	}
	this.load = function (onload, onloadprogress) {
		this.onload = onload;
		this.onloadprogress = onloadprogress;
		var preloader = new ImagesPreloader();
		var data = [];
		for (var n in this.items)
			data.push(this.items[n]);
		preloader.load(data, self.onLoadHandler, self.onLoadProgressHandler);
	}
	this.onLoadProgressHandler = function (val) {
		if (typeof self.onloadprogress == 'function') {
			self.onloadprogress(val);
		}
	}
	this.onLoadHandler = function (data) {
		self.loaded = true;
		for (var n in data) {
			var bmp = data[n];
			var asset = self.items[n];
			asset.bitmap = bmp;
			asset.normalize(self.scale);
		}
		if (typeof self.onload == 'function') {
			self.onload(self.items);
		}
	}
	this.getAsset = function (name, checkLoad) {
		var asset = null;
		if ((typeof this.items[name] != 'undefined') && (this.items[name].bitmap)) {
			checkLoad = (typeof checkLoad == 'undefined') ? true : checkLoad;
			asset = (!checkLoad || this.items[name].ready) ? this.items[name] : null;
		}
		if (!asset) {
			throw new Error('Trying to get undefined asset "' + name + '"');
		}
		return asset;
	}
	this.getSprite = function (name, params) {
		var mc = null;
		try {
			var asset = this.getAsset(name, true);
			mc = new this.spriteClass(asset.bitmap, asset.width, asset.height, asset.frames, asset.layers);
		} catch (e) {
			mc = new this.spriteClass(null, 1, 1, 1, 1);
		}
		if (typeof params == 'object') {
			for (var prop in params)
				mc[prop] = params[prop];
		}
		return mc;
	}
	this.getBitmap = function (name) {
		try {
			var asset = this.getAsset(name, true);
			return asset.bitmap;
		} catch (e) {
			return null;
		}
	}
	this.init(path, scale);
	this.addAssets(assets);
}
if (typeof console == 'undefined') {
	console = {
		log : function () {}

	}
};
var ExternalAPI = {
	type : "Spilgames",
	init : function (callback) {
		if (typeof SpilGames == 'undefined') {
			if (typeof window.parent != 'undefined') {
				SpilGames = window.parent.SpilGames;
			}
		}
		if (ExternalAPI.check())
			SpilGames.Events.subscribe('gamecontainer.resize', Utils.fitLayoutToScreen);
		else {
			Utils.addFitLayoutListeners();
		}
	},
	check : function () {
		return (typeof SpilGames != 'undefined');
	},
	checkUserLoggedIn : function () {
		var state = SpilGames.Auth.getAuthState();
		if (state == "NOT_AUTHENTICATED")
			return false;
		return true;
	},
	getUserInfo : function () {},
	addChangeLocaleListener : function (callback) {
		SpilGames.Events.subscribe('game.language.change', callback);
	},
	showLoginForm : function (callback) {
		if (!callback)
			callback = function () {};
		SpilGames.Portal.forceAuthentication(callback);
	},
	showScoreboard : function (callback) {
		/*
		if (!callback)
			callback = function () {};
		SpilGames.Portal.showScoreboard(callback);
		*/
		window.location.href='http://www.lehetj.com/game/html5';
	},
	submitScores : function (val, callback) {
		if (!callback)
			callback = function () {};
		SpilGames.Highscores.insert({
			score : val
		}, callback);
	}
}
if (!ExternalAPI.check())
	var SpilGames; ;
var stage;
var mc;
var fps = 24;
var bitmaps;
var GET;
var data = [];
var STATE_LOAD = 0;
var STATE_MENU = 1;
var STATE_GAME = 2;
var STATE_UPGRADE = 3;
var STATE_LOST = 4;
var STATE_TEST = 0xFFFF;
var scenes = {};
scenes[STATE_MENU] = 'menu';
scenes[STATE_GAME] = 'game';
scenes[STATE_UPGRADE] = 'upgrade';
scenes[STATE_LOST] = 'gameover';
scenes[STATE_TEST] = 'test';
scenes['DEFAULT'] = scenes[STATE_MENU];
var showDebugDraw;
var library;
var preventEvent = function (e) {
	e.preventDefault();
	return false;
}
window.ontouchstart = preventEvent;
window.onload = function () {
	GET = Utils.parseGet();
	Utils.addMobileListeners(true);
	Utils.mobileCorrectPixelRatio();
	ExternalAPI.init();
	setTimeout(startLoad, 600);
};
function startLoad() {
	document.body.ontouchstart = preventEvent;
	showDebugDraw = false;
	CRENDER_DEBUG = false;
	Utils.extend(GUIFont, Sprite);
	Utils.extend(Font1, GUIFont);
	Utils.extend(Font2, GUIFont);
	if (showDebugDraw) {
		var resolution = Utils.getScaleScreenResolution(2, true);
	} else {
		var resolution = Utils.getMobileScreenResolution(true);
	}
	Utils.globalScale = resolution.scale;
	Utils.createLayout(document.getElementById("main_container"), resolution, true);
	Utils.addEventListener("fitlayout", function () {
		if (stage) {
			stage.drawScene(document.getElementById("screen"));
			buildBackground();
		}
	});
	Utils.addEventListener("lockscreen", function () {
		if (stage && stage.started)
			stage.stop();
	});
	Utils.addEventListener("unlockscreen", function () {
		if (stage && !stage.started)
			stage.start();
	});
	Utils.mobileHideAddressBar();
	if (GET["debug"] != 1) {
		Utils.checkOrientation(true);
	}
	var path = "images/" + Utils.globalScale + "/";
	library = new AssetsLibrary('images', Utils.globalScale);
	library.addAsset('%PATH%/blank.gif', 'blank');
	library.addAsset('%SCALE%/spilgames.jpg', 'logo');
	library.addAsset('%SCALE%/hourglass.png', 'hourglass');
	library.addAsset('%SCALE%/bg/main_menu.jpg', 'main_menu', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/upgrade.png', 'upgrade', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/gameover.png', 'gameover', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/briefing.jpg', 'briefing', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/back00.jpg', 'back00', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/back01.jpg', 'back01', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/back02.jpg', 'back02', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/back10.jpg', 'back10', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/back11.jpg', 'back11', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/back12.jpg', 'back12', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/back20.jpg', 'back20', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/back21.jpg', 'back21', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/back22.jpg', 'back22', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/grass0.png', 'grass0', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/grass1.png', 'grass1', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/grass2.png', 'grass2', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/grass3.png', 'grass3', 480, 320, 1, 1);
	library.addAsset('%SCALE%/bg/grass4.png', 'grass4', 480, 320, 1, 1);
	library.addAsset('%SCALE%/ch/archer.png', 'archer', 45, 45, 20);
	library.addAsset('%SCALE%/ch/arrow.png', 'arrow', 22, 5, 1, 3);
	library.addAsset('%SCALE%/ch/health.png', 'health', 46, 12, 2, 1);
	library.addAsset('%SCALE%/ch/pike_attack.png', 'pike_attack', 56, 36, 10, 1);
	library.addAsset('%SCALE%/ch/pike_die.png', 'pike_die', 86, 82, 20, 1);
	library.addAsset('%SCALE%/ch/pike_run.png', 'pike_run', 42, 38, 15, 1);
	library.addAsset('%SCALE%/ch/sword_attack.png', 'sword_attack', 40, 36, 17, 1);
	library.addAsset('%SCALE%/ch/sword_die.png', 'sword_die', 56, 58, 20, 1);
	library.addAsset('%SCALE%/ch/sword_run.png', 'sword_run', 26, 36, 12, 1);
	library.addAsset('%SCALE%/ch/war_attack.png', 'war_attack', 66, 51, 16, 1);
	library.addAsset('%SCALE%/ch/war_die.png', 'war_die', 146, 90, 23, 1);
	library.addAsset('%SCALE%/ch/war_run.png', 'war_run', 36, 42, 8, 1);
	library.addAsset('%SCALE%/ch/barbarian_attack.png', 'barbarian_attack', 63, 46, 27, 1);
	library.addAsset('%SCALE%/ch/barbarian_die.png', 'barbarian_die', 71, 76, 30, 1);
	library.addAsset('%SCALE%/ch/barbarian_run.png', 'barbarian_run', 54, 44, 31, 1);
	library.addAsset('%SCALE%/ch/horse_attack.png', 'horse_attack', 88, 52, 12, 1);
	library.addAsset('%SCALE%/ch/horse_die.png', 'horse_die', 236, 94, 25, 1);
	library.addAsset('%SCALE%/ch/horse_run.png', 'horse_run', 88, 52, 14, 1);
	library.addAsset('%SCALE%/ui/close.png', 'close', 99, 33);
	library.addAsset('%SCALE%/ui/continue.png', 'continue', 98, 28);
	library.addAsset('%SCALE%/ui/highscores.png', 'highscores', 149, 38);
	library.addAsset('%SCALE%/ui/menu.png', 'menu', 99, 33);
	library.addAsset('%SCALE%/ui/money.png', 'money', 54, 18);
	library.addAsset('%SCALE%/ui/play.png', 'play', 113, 33);
	library.addAsset('%SCALE%/ui/plus.png', 'plus', 35, 35, 1, 2);
	library.addAsset('%SCALE%/ui/skill.png', 'skill', 6, 21, 1, 2);
	library.addAsset('%SCALE%/ui/submit.png', 'submit', 120, 33);
	library.addAsset('%SCALE%/ui/sword_plash.png', 'sword_plash', 247, 18);
	library.addAsset('%SCALE%/ui/sword.png', 'sword', 61, 39);
	library.addAsset('%SCALE%/ui/font1.png', 'font1', 10, 15, 11);
	library.addAsset('%SCALE%/ui/font2.png', 'font2', 16, 21, 11);
	library.load(onLibraryLoad, Utils.showLoadProgress);
}
function onLibraryLoad(assets) {
	document.getElementById('progress_container').style.display = 'none';
	document.getElementById('screen_container').style.display = 'block';
	document.getElementById('screen_background_container').style.display = 'block';
	Game.state = STATE_MENU;
	createScene();
}
function createStage() {
	if (stage) {
		stage.destroy();
		stage.stop();
	}
	stage = new Stage('screen', 480, 320, false);
	stage.delay = 1000 / fps;
	stage.onpretick = preTick;
	stage.onposttick = postTick;
	stage.ceilSizes = true;
	stage.showFPS = false;
}
function createScene() {
	Scene.reset();
	var ui = ((typeof scenes[Game.state]) != 'undefined') ? scenes[Game.state] : scenes['DEFAULT'];
	if (typeof Scene[ui] == 'function') {
		Scene[ui]();
	}
	Scene.draw();
}
var Scene = {
	reset : function () {
		Game.clearUI();
		createStage();
	},
	draw : function () {
		buildBackground();
		stage.start();
	},
	menu : function () {
		stage.addChild(library.getSprite('main_menu', {
				x : 240,
				y : 160,
				static : true
			}));
		stage.addChild(library.getSprite('play', {
				x : 136,
				y : 110,
				onclick : function () {
					Game.resetData();
					Game.state = STATE_GAME;
					createScene();
				}
			}));
		stage.addChild(library.getSprite('continue', {
				x : 136,
				y : 150,
				onclick : function () {
					if (!Game.wave)
						Game.resetData();
					Game.state = STATE_GAME;
					createScene();
				}
			}));
		stage.addChild(library.getSprite('highscores', {
				x : 136,
				y : 190,
				onclick : function () {}

			}));
	},
	game : function () {
		var wave = 0;
		if (Game.wave)
			wave = Game.wave.n + 1;
		Game.initWave(wave);
		stage.addChild(library.getSprite('menu', {
				x : 50,
				y : 18,
				static : true,
				onclick : showMenu
			}));
	},
	upgrade : function () {
		stage.addChild(library.getSprite('back00', {
				x : 240,
				y : 160,
				static : true
			}));
		stage.addChild(library.getSprite('upgrade', {
				x : 240,
				y : 160,
				static : true
			}));
		var rk = Math.floor(Game.wave.n / 5);
		var cost = {
			force : 20,
			dexterity : 50,
			damage : 40,
			repair : 50 * rk
		};
		var strings = {
			force : null,
			dexterity : null,
			damage : null,
			repair : null,
			money : null
		};
		for (var i in strings)
			strings[i] = new GUIString(Font1, false);
		var ups = {
			force : new UpgradeBar(15, Math.ceil(cost.force * (UP.force + 1) * 0.9)),
			dexterity : new UpgradeBar(15, Math.ceil(cost.dexterity * (UP.dexterity + 1) * 0.7)),
			damage : new UpgradeBar(15, Math.ceil(cost.damage * (UP.damage + 1) * 0.5)),
			repair : new UpgradeBar(12, cost.repair)
		};
		strings.money.write((Game.data ? Game.data.money : '---'), 417, 33, 'center');
		var p = {
			x : 102,
			y : 118
		}
		var dy = 45;
		ups.force.createUI(p.x, p.y, UP.force);
		ups.force.onchange = function (up) {
			UP.force = up.value;
			Game.data.money -= up.cost;
			strings.money.write(Game.data.money, 417, 33, 'center');
			up.cost = Math.ceil(cost.force * (UP.force + 1) * 0.9);
			strings.force.write(up.cost, p.x - 55, p.y, 'center');
			Game.changed = true;
			for (var i in ups)
				ups[i].refreshUI();
		}
		strings.force.write(ups.force.cost, p.x - 55, p.y, 'center');
		ups.dexterity.createUI(p.x, p.y + (dy * 1), UP.dexterity);
		ups.dexterity.onchange = function (up) {
			UP.dexterity = up.value;
			Game.data.money -= up.cost;
			strings.money.write(Game.data.money, 417, 33, 'center');
			up.cost = Math.ceil(cost.dexterity * (UP.dexterity + 1) * 0.7);
			strings.dexterity.write(up.cost, p.x - 55, p.y + (dy * 1), 'center');
			Game.changed = true;
			for (var i in ups)
				ups[i].refreshUI();
		}
		strings.dexterity.write(ups.dexterity.cost, p.x - 55, p.y + (dy * 1), 'center');
		ups.damage.createUI(p.x, p.y + (dy * 2), UP.damage, true);
		ups.damage.onchange = function (up) {
			UP.damage = up.value;
			Game.data.money -= up.cost;
			strings.money.write(Game.data.money, 417, 33, 'center');
			up.cost = Math.ceil(cost.damage * (UP.damage + 1) * 0.5)
				strings.damage.write(up.cost, p.x - 55, p.y + (dy * 2), 'center');
			Game.changed = true;
			for (var i in ups)
				ups[i].refreshUI();
		}
		strings.damage.write(ups.damage.cost, p.x - 55, p.y + (dy * 2), 'center');
		var hp = DEF.tower.hp + UP.hp * DEF.tower.up_hp;
		var repair_step = Math.ceil(hp / ups.repair.maxValue);
		var val = Math.floor((hp - Game.data.damage) / repair_step);
		ups.repair.createUI(p.x + 212, p.y - 1, val, true);
		ups.repair.onchange = function (up) {
			Game.data.damage = Math.max(0, (up.maxValue - up.value) * repair_step);
			Game.data.money -= up.cost;
			strings.money.write(Game.data.money, 417, 33, 'center');
			Game.changed = true;
			for (var i in ups)
				ups[i].refreshUI();
		}
		strings.repair.write(ups.repair.cost, p.x + 187, p.y - 1, 'center');
		btnContinue = stage.addChild(library.getSprite('continue', {
					x : 350,
					y : p.y + (dy * 2),
					onclick : function () {
						Game.state = STATE_GAME;
						createScene();
					}
				}));
	},
	gameover : function () {
		stage.addChild(library.getSprite('back00', {
				x : 240,
				y : 160,
				static : true,
				animated : false,
				currentFrame : 2
			}));
		stage.addChild(library.getSprite('gameover', {
				x : 240,
				y : 160,
				static : true
			}));
		btnMenu = stage.addChild(library.getSprite('menu', {
					x : 240,
					y : 235,
					onclick : showMenu
				}));
		var strings = {
			pike : null,
			sword : null,
			war : null,
			barbarian : null,
			horse : null
		};
		var n = 0;
		for (var i in strings) {
			var k = Game.data.killed[i];
			var pts = DEF.enemy[i].points * k;
			var p = {
				x : 120 + 120 * Math.floor(n / 2),
				y : 100 + 60 * (n % 2)
			}
			var e = stage.addChild(library.getSprite(i + '_run', {
						x : p.x,
						y : p.y,
						static : false
					}));
			if (k) {
				e.play();
				strings[i] = new GUIString(Font1, false);
				strings[i].write(k + ' - ' + pts, p.x + 5, p.y + 10, 'center');
			} else {
				e.opacity = 0.5;
				strings[i] = new GUIString(Font1, false);
				strings[i].write('---', p.x + 5, p.y + 10, 'center');
				e.stop();
			}
			n++;
		}
		var total = new GUIString(Font2, true);
		total.write(Game.data.points + '', 370, 165, 'center');
	},
	test : function () {
		stage.addChild(library.getSprite('upgrade', {
				x : 240,
				y : 160,
				static : true
			}));
		var up = new UpgradeBar(15);
		up.createUI(165, 130, 5, true);
	}
}
var DEF = {
	tower : {
		hp : 1500,
		up_hp : 100
	},
	field : {
		attack_line : 330,
		enemy_run_line : 210,
		enemy_run_range : 30
	},
	archer : {
		x : 378,
		y : 103,
		force : 7,
		up_force : 0.5,
		reload_time : 1200,
		up_dexterity : 30
	},
	arrow : {
		damage : 100,
		up_damage : 10,
		hit_range : 3
	},
	enemy : {
		pike : {
			hp : 100,
			speed : 4,
			strength : 10,
			value : 1,
			money : 10,
			points : 10,
			attack_time : 1000,
			attack_frame : 5,
			die_offset : {
				x : 0,
				y : -15
			}
		},
		sword : {
			hp : 200,
			speed : 2,
			strength : 30,
			value : 2,
			money : 20,
			points : 20,
			attack_time : 1500,
			attack_frame : 5,
			die_offset : {
				x : -5,
				y : -8
			}
		},
		war : {
			hp : 400,
			speed : 0.7,
			strength : 50,
			value : 3,
			money : 30,
			points : 30,
			attack_time : 2000,
			attack_frame : 5,
			die_offset : {
				x : 0,
				y : -15
			}
		},
		barbarian : {
			hp : 500,
			speed : 0.5,
			strength : 90,
			value : 5,
			money : 90,
			points : 50,
			attack_time : 2000,
			attack_frame : 15,
			die_offset : {
				x : -10,
				y : -15
			}
		},
		horse : {
			hp : 1000,
			speed : 1,
			strength : 90,
			value : 15,
			money : 150,
			points : 150,
			attack_time : 2000,
			attack_frame : 10,
			die_offset : {
				x : -55,
				y : -5
			}
		}
	},
	wave : {
		enemy_delay : 2000,
		full_speed : 15
	}
}
var UP = {
	hp : 0,
	force : 0,
	dexterity : 0,
	damage : 0
}
var Game = {
	state : STATE_LOAD,
	data : null,
	resetData : function () {
		Game.wave = null;
		Game.data = {
			money : 0,
			points : 0,
			killed : {
				pike : 0,
				sword : 0,
				war : 0,
				barbarian : 0,
				horse : 0
			},
			damage : 0
		}
		for (var i in UP)
			UP[i] = 0;
		Game.changed = true;
	},
	changed : true,
	strings : {
		money : null,
		wave : null
	},
	refreshUI : function () {
		if (Game.state != STATE_GAME)
			return;
		for (var i in Game.strings) {
			if (!Game.strings[i])
				Game.strings[i] = new GUIString(Font1, false);
		}
		if (Game.changed) {
			Game.strings.money.write((Game.data ? Game.data.money : '--'), 445, 18, 'center');
			Game.strings.wave.write((Game.wave ? Game.wave.n + 1 : 1), 125, 18, 'center');
		}
		Game.changed = false;
	},
	clearUI : function () {
		for (var i in Game.strings)
			Game.strings[i] = null;
	},
	wave : null,
	initWave : function (n) {
		if (!Game.data)
			Game.resetData();
		Game.wave = new EnemyWave(n);
		Game.createTower();
		Game.createArcher();
		stage.addChild(library.getSprite('money', {
				x : 440,
				y : 18
			}));
		Game.run();
		Game.wave.init();
		Game.wave.nextEnemy();
		Game.changed = true;
	},
	run : function () {
		if (Game.tower) {
			Game.tower.onclick = Game.shot;
		}
		for (var i = 0; i < Game.enemies.length; i++) {
			if (Game.enemies[i].mc)
				Game.enemies[i].mc.play();
		}
		Game.changed = true;
	},
	pause : function () {
		if (Game.tower) {
			Game.tower.onclick = null;
		}
		for (var i = 0; i < Game.enemies.length; i++) {
			if (Game.enemies[i].mc)
				Game.enemies[i].mc.stop();
		}
		Game.changed = true;
	},
	tower : null,
	createTower : function () {
		if (Game.tower) {
			stage.removeChild(Game.tower._hpBack);
			stage.removeChild(Game.tower._hp);
			stage.removeChild(Game.tower);
		}
		Game.tower = library.getSprite('back00', {
				x : 240,
				y : 160,
				static : true,
				animated : false
			});
		Game.tower.back = 0;
		Game.tower.dmg = 0;
		Game.tower.maxhp = DEF.tower.hp + UP.hp * DEF.tower.up_hp;
		Game.tower.hp = Game.tower.maxhp;
		Game.tower.hp -= Game.data.damage;
		Game.tower.refresh = function () {
			var newBmp = false;
			var b = min(2, ~~(Game.wave.n / 10));
			if (this.back != b) {
				this.back = b;
				newBmp = library.getAsset('back' + this.back + this.dmg).bitmap;
			}
			var k = this.hp / this.maxhp;
			var f = 0;
			if (k < 0.5)
				f = 1;
			if (k < 0.3)
				f = 2;
			if (f != this.dmg) {
				this.dmg = f;
				newBmp = library.getAsset('back' + this.back + this.dmg).bitmap;
			}
			if (newBmp) {
				this.bitmap = newBmp;
				buildBackground();
			}
			var dx = 8;
			this._hp.width = dx + (k * (this._hpBack.width - 2 * dx));
			this._hp.x = this._hpBack.x - (this._hpBack.width - this._hp.width) / 2;
		}
		Game.tower.damage = function (val) {
			this.hp = max(0, this.hp - ~~val);
			Game.data.damage += val;
			this.refresh();
			Game.changed = true;
			if (this.hp == 0)
				Game.waveLost();
		}
		stage.addChild(Game.tower);
		Game.tower._hpBack = library.getSprite('health', {
				x : 420,
				y : 210,
				animated : false
			});
		Game.tower._hp = library.getSprite('health', {
				x : 420,
				y : 210,
				animated : false,
				currentFrame : 1
			});
		stage.addChild(Game.tower._hpBack);
		stage.addChild(Game.tower._hp);
		var grass;
		grass = library.getSprite('grass' + Math.floor(Math.random() * 3), {
				x : 240,
				y : 160,
				static : true,
				animated : false
			});
		stage.addChild(grass);
		grass = library.getSprite('grass' + Math.floor(3 + Math.random() * 2), {
				x : 240,
				y : 160,
				static : true,
				animated : false
			});
		stage.addChild(grass);
		Game.tower.refresh();
		Game.changed = true;
		return Game.tower;
	},
	archer : null,
	createArcher : function () {
		if (Game.archer)
			stage.removeChild(Game.archer);
		Game.archer = library.getSprite('archer', {
				x : DEF.archer.x,
				y : DEF.archer.y,
				animated : false
			});
		Game.archer.onenterframe = function (e) {
			if ((this.currentFrame + 1) == this.totalFrames)
				this.gotoAndStop(0);
		}
		Game.archer.getForceValue = function () {
			var f = DEF.archer.force + UP.force * DEF.archer.up_force;
			if (UP.force == 15)
				f * 2;
			return f;
		}
		Game.archer.getReloadTimeout = function () {
			var t = DEF.archer.reload_time - UP.dexterity * DEF.archer.up_dexterity;
			return t;
		}
		Game.archer.getForceVector = function (x, y) {
			var f = new Vector(x, y);
			var maxF = this.getForceValue();
			var curF = f.getLength();
			f.x *= maxF / curF;
			f.y *= maxF / curF;
			this.rotation = atan(f.y / f.x) + 0.1;
			return f;
		}
		Game.archer.busyTimer = null;
		Game.archer.setBusy = function () {
			if (this.busy)
				return false;
			var t = this.getReloadTimeout();
			Game.archer.busyTimer = setTimeout(function () {
					Game.archer.busyTimer = clearTimeout(Game.archer.busyTimer);
					Game.archer.busy = false;
					if (Game.lastTap)
						Game.shot(Game.lastTap);
				}, t);
			this.busy = true;
			this.gotoAndPlay(0);
			return true;
		}
		Game.archer.busy = false;
		stage.addChild(Game.archer);
		Game.archer.setZIndex(5);
		Game.changed = true;
		return Game.archer;
	},
	arrows : [],
	createArrow : function () {
		var arrow = library.getSprite('arrow', {
				x : 0,
				y : 0,
				animated : false
			});
		arrow.strength = DEF.arrow.damage + UP.damage * DEF.arrow.up_damage;
		if (UP.damage > 9)
			arrow.currentLayer = 1;
		if (UP.damage == 15)
			arrow.currentLayer = 2;
		arrow.getHitAABB = function (a) {
			var p = new Vector(this.x - (Math.cos(this.rotation) * this.width * 0.4), this.y - (Math.sin(this.rotation) * this.width * 0.4));
			var r = DEF.arrow.hit_range + 0.2 * UP.force;
			var aabb = [new Vector(p.x - r, p.y - r), new Vector(p.x + r, p.y + r)]
			return aabb;
		}
		Game.changed = true;
		return arrow;
	},
	destroyArrow : function (arrow) {
		for (var i = 0; i < Game.arrows.length; i++) {
			if (Game.arrows[i].uid == arrow.uid) {
				Game.arrows.splice(i, 1);
			}
		}
		clearTimeout(arrow.flyTimer);
		if (arrow.stage)
			stage.removeChild(arrow);
	},
	clearArrows : function () {
		var a = Game.arrows.shift();
		while (a) {
			if (a.stage)
				stage.removeChild(a);
			a = Game.arrows.shift();
		}
	},
	lastTap : null,
	shot : function (x, y) {
		if (!Game.archer)
			return;
		var e = (typeof y == 'undefined') ? x : null;
		var tap = e ? {
			x : e.x + 240,
			y : e.y + 160
		}
		 : {
			x : ~~x,
			y : ~~y
		};
		var p = {
			x : Game.archer.x,
			y : Game.archer.y
		};
		if (tap.x >= p.x)
			return;
		if (UP.dexterity > 5)
			Game.lastTap = {
				x : e.x,
				y : e.y
			};
		if (!Game.archer.setBusy())
			return;
		function shotArrow(tap) {
			var p = {
				x : Game.archer.x,
				y : Game.archer.y
			};
			var arrow = Game.createArrow();
			arrow.setPosition(p.x, p.y);
			arrow.f = Game.archer.getForceVector(p.x - tap.x, p.y - tap.y);
			arrow.setZIndex(10);
			stage.addChild(arrow);
			Game.arrows.push(arrow);
			Game.changed = true;
		}
		shotArrow(tap);
		if (UP.dexterity > 10) {
			var t = Math.ceil(Game.archer.getReloadTimeout() / 3);
			setTimeout(function () {
				shotArrow(tap);
			}, t);
		}
	},
	refreshArrows : function () {
		if (!Game.archer)
			return;
		if (Game.arrows.length < 1)
			return;
		var g = 0.3;
		var enemy;
		for (var i = (Game.arrows.length - 1); i >= 0; i--) {
			var arrow = Game.arrows[i];
			if (!arrow)
				continue;
			var f = arrow.f;
			Game.arrows[i].x -= Game.arrows[i].f.x;
			Game.arrows[i].y -= Game.arrows[i].f.y;
			Game.arrows[i].rotation = atan(Game.arrows[i].f.y / Game.arrows[i].f.x);
			Game.arrows[i].f.y -= g;
			if ((Game.arrows[i].x < 0) || (Game.arrows[i].y > 320)) {
				Game.destroyArrow(arrow);
				continue;
			}
			enemy = Game.checkEnemyHit(arrow);
			if (enemy) {
				enemy.damage(arrow.strength);
				Game.destroyArrow(arrow);
			}
		}
		Game.changed = true;
	},
	enemies : [],
	createEnemy : function (type) {
		var enemy = new Enemy(type);
		Game.enemies.push(enemy);
		enemy.run();
		Game.changed = true;
		return enemy;
	},
	destroyEnemy : function (enemy) {
		if (!enemy.mc)
			return;
		for (var i = 0; i < Game.enemies.length; i++) {
			if (Game.enemies[i].mc && (Game.enemies[i].mc.uid == enemy.mc.uid)) {
				Game.enemies.splice(i, 1);
			}
		}
		clearTimeout(enemy.busyTimer);
		if (enemy.mc.stage) {
			enemy.mc.stop();
			stage.removeChild(enemy.mc);
		}
		if (Game.wave) {
			Game.wave.value -= enemy.value;
			Game.wave.refreshUI();
		}
		Game.changed = true;
	},
	clearEnemies : function () {
		var e = Game.enemies.shift();
		while (e) {
			clearTimeout(e.busyTimer);
			if (e.mc && e.mc.stage) {
				e.mc.stop();
				stage.removeChild(e.mc);
			}
			e = Game.enemies.shift();
		}
		Game.changed = true;
	},
	refreshEnemies : function () {
		var len = Game.enemies.length;
		if (len < 1)
			return;
		for (var i = 0; i < len; i++) {
			if (Game.enemies[i].state == ENEMY_RUN) {
				Game.enemies[i].mc.x += Game.enemies[i].speed;
				if (Game.enemies[i].mc.x > DEF.field.attack_line) {
					Game.enemies[i].attack();
				}
			}
		}
		Game.changed = true;
	},
	checkEnemyHit : function (arrow) {
		for (var i = 0; i < Game.enemies.length; i++) {
			var enemy = Game.enemies[i];
			if (enemy.state == ENEMY_DIE)
				continue;
			var k = enemy.checkHit(arrow.getHitAABB());
			if (k > 0) {
				arrow.strength *= k;
				Game.changed = true;
				return enemy;
			}
		}
		return false;
	},
	clearAll : function () {
		Game.pause();
		Game.clearEnemies();
		Game.clearArrows();
		Game.lastTap = null;
		clearTimeout(Game.archer.busyTimer);
		if (Game.wave) {
			Game.wave.clear();
		}
		Game.changed = true;
	},
	waveComplete : function () {
		if (Game.state != STATE_GAME)
			return;
		Game.clearAll();
		Game.state = STATE_UPGRADE;
		setTimeout(showUpgrade, 1000);
		Game.data.money += (Game.wave.n * 10);
	},
	waveLost : function () {
		Game.clearAll();
		for (var i in UP)
			UP[i] = 0;
		Game.data.points += Game.data.money;
		Game.wave = null;
		Game.data.money = 0;
		Game.data.damage = 0;
		Game.state = STATE_LOST;
		createScene();
	},
	fake : null
}
var ENEMY_RUN = 0;
var ENEMY_ATTACK = 1;
var ENEMY_DIE = 2;
var Enemy = function (type) {
	var self = this;
	this.state = ENEMY_RUN;
	this.type = type;
	this.mcMove = library.getSprite(type + '_run');
	this.mcDie = library.getSprite(type + '_die');
	this.mcAttack = library.getSprite(type + '_attack');
	this.mc = null;
	this.busyTimer = null;
	this.busy = false;
	var def = DEF.enemy[type];
	for (var prop in def) {
		this[prop] = def[prop];
	}
	this.setBusy = function () {
		if (self.busy)
			return false;
		self.busyTimer = setTimeout(function () {
				clearTimeout(self.busyTimer);
				self.busyTimer = null;
				self.busy = false;
				self.setBusy();
			}, ~~this.attack_time);
		self.busy = true;
		self.mc.gotoAndPlay(0);
		return true;
	}
	this.run = function () {
		this.state = ENEMY_RUN;
		var p;
		if (this.mc) {
			if (this.mc === this.mcMove)
				return;
			p = {
				x : this.mc.x,
				y : this.mc.y,
				z : this.mc.zIndex
			}
			stage.removeChild(this.mc);
		} else {
			p = {
				x : -Math.round(100 * Math.round),
				y : DEF.field.enemy_run_line + Math.round((DEF.field.enemy_run_range * 2) * (Math.random() - 0.5)),
				z : 50
			}
			p.z += p.y;
		}
		this.mc = this.mcMove;
		this.mc.setPosition(p.x, p.y);
		if (this.type == 'war')
			this.mc.animDelay = 3;
		if (this.type == 'horse')
			this.mc.animDelay = 2;
		stage.addChild(this.mc);
		this.mc.setZIndex(p.z);
	}
	this.attack = function () {
		if (!this.mc)
			return;
		this.state = ENEMY_ATTACK;
		var p = {
			x : DEF.field.attack_line,
			y : this.mc.y,
			z : ~~this.mc.zIndex
		}
		if (this.mc) {
			if (this.mc === this.mcAttack)
				return;
			var p = {
				x : this.mc.x,
				y : this.mc.y,
				z : ~~this.mc.zIndex
			}
			stage.removeChild(this.mc);
		}
		this.mc = this.mcAttack;
		this.mc.setPosition(p.x, p.y);
		this.mc.onenterframe = function (e) {
			if ((self.mc.currentFrame + 1) == self.mc.totalFrames)
				self.mc.gotoAndStop(0);
			if (self.mc.currentFrame == self.attack_frame) {
				Game.tower.damage(self.strength);
			}
		}
		stage.addChild(this.mc);
		this.mc.setZIndex(p.z);
		this.setBusy();
		Game.changed = true;
	}
	this.damage = function (val) {
		this.hp = max(0, this.hp - val);
		if (this.hp <= 0) {
			this.die();
		}
		Game.changed = true;
	}
	this.die = function () {
		if (!this.mc)
			return;
		this.state = ENEMY_DIE;
		clearTimeout(this.busyTimer);
		this.busy = true;
		Game.destroyEnemy(this);
		var p = {
			x : this.mc.x,
			y : this.mc.y,
			z : ~~this.mc.zIndex
		}
		stage.removeChild(this.mc);
		this.mc = null;
		this.mc = this.mcDie;
		this.mc.setPosition(p.x + this.die_offset.x, p.y + this.die_offset.y);
		this.mc.onenterframe = function (e) {
			if ((self.mc.currentFrame + 1) == self.mc.totalFrames) {
				self.mc.stop();
				self.mc.destroy = true;
				self.onenterframe = null;
			}
		}
		if (this.type == 'war')
			this.mc.animDelay = 2;
		if (this.type == 'horse')
			this.mc.animDelay = 2;
		stage.addChild(this.mc);
		this.mc.setZIndex(p.z);
		Game.data.money += this.money;
		Game.data.points += this.points;
		Game.data.killed[this.type]++;
		Game.changed = true;
	}
	var hits = [];
	this._addHit = function (p, s, k) {
		self.hits.push({
			aabb : [new Vector(p.x - s.x / 2, p.y - s.y / 2), new Vector(p.x + s.x / 2, p.y + s.y / 2)],
			k : k
		});
	}
	this.refreshHits = function () {
		self.hits = [];
		if (self.state == ENEMY_DIE)
			return false;
		if (!self.mc)
			return false;
		var kw = (self.state == ENEMY_ATTACK) ? 1.5 : 1.0;
		switch (self.type) {
		case 'horse':
			self._addHit(new Vector(self.mc.x, self.mc.y), new Vector(self.mc.width * 0.6, self.mc.height * 0.2), 0.6);
			self._addHit(new Vector(self.mc.x, self.mc.y - self.mc.height * 0.25), new Vector(self.mc.width * 0.2, self.mc.height * 0.2), 2.5);
			break;
		case 'barbarian':
			self._addHit(new Vector(self.mc.x + self.mc.width / 5, self.mc.y), new Vector(self.mc.width * 0.2 * kw, self.mc.height * 0.6), 1.0);
			self._addHit(new Vector(self.mc.x + self.mc.width / 5, self.mc.y - self.mc.height * 0.25), new Vector(self.mc.width * 0.2 * kw, self.mc.height * 0.1), 1.5);
			break;
		case 'war':
		case 'sword':
		case 'pike':
		default:
			self._addHit(new Vector(self.mc.x, self.mc.y), new Vector(self.mc.width * 0.2, self.mc.height * 0.6), 1.0);
			self._addHit(new Vector(self.mc.x, self.mc.y - self.mc.height * 0.25), new Vector(self.mc.width * 0.2 * kw, self.mc.height * 0.1), 2.0);
			break;
		}
		return self.hits;
	}
	this.checkHit = function (aabb) {
		var hit = 0;
		if (self.refreshHits()) {
			for (var i = 0; i < self.hits.length; i++) {
				var h = self.hits[i];
				if (aabb[1].x < h.aabb[0].x)
					continue;
				if (aabb[0].x > h.aabb[1].x)
					continue;
				if (aabb[1].y < h.aabb[0].y)
					continue;
				if (aabb[0].y > h.aabb[1].y)
					continue;
				hit = Math.max(hit, h.k);
			}
		}
		return hit;
	}
}
var EnemyWave = function (n) {
	var self = this;
	this.n = ~~n;
	this.countInitValue = function () {
		val = Math.max(3, Math.ceil(this.n * 1.1));
		if (this.n > 25) {
			var k = this.n / 25;
			val *= (k * k);
			val = Math.round(val);
		}
		return val;
	}
	this.value = this.countInitValue();
	this.getProgress = function () {
		var p = 1 - (this.value / this.countInitValue());
		return max(0, min(1, p));
	}
	this.ui = null;
	this.createUI = function () {
		this.clearUI();
		this.ui.back = stage.addChild(library.getSprite('sword_plash', {
					x : 260,
					y : 18
				}));
		this.ui.marker = stage.addChild(library.getSprite('sword', {
					x : 220,
					y : 22
				}));
		this.refreshUI();
	}
	this.refreshUI = function () {
		if (!this.ui)
			return false;
		var p = this.getProgress();
		var w = Math.round(this.ui.back.width * 0.9);
		var x = this.ui.back.x - Math.round(w / 2);
		this.ui.marker.x = x + w * p;
	}
	this.clearUI = function () {
		if (this.ui) {
			if (this.ui.back)
				stage.removeChild(this.ui.back);
			if (this.ui.marker)
				stage.removeChild(this.ui.marker);
		}
		this.ui = {
			back : null,
			marker : null
		}
	}
	this.enemies = [];
	this.enemyTimer = null;
	this.init = function () {
		this.enemies = [];
		list = ['pike', 'sword', 'war', 'barbarian', 'horse'];
		var val = this.countInitValue();
		var e = list[0];
		while (val > 0) {
			this.enemies.push(e);
			val -= DEF.enemy[e].value;
			var n = this.getRandomUnit(list.length);
			e = list[n];
		}
		this.createUI();
		Game.changed = true;
	}
	this.getRandomUnit = function (cnt) {
		var period = 5;
		var maxLevel = Math.ceil(this.n / period);
		maxLevel = Math.max(1, Math.min(maxLevel, cnt));
		for (var i = 0; i < maxLevel; i++) {
			var base = 0.3;
			var k = base;
			var pos = cnt - maxLevel;
			k += (1 - base) * (pos / cnt);
			if (Math.random() < k)
				return i;
		}
		return maxLevel - 1;
	}
	this.nextEnemy = function () {
		clearTimeout(this.enemyTimer);
		var type = this.enemies.shift();
		if (!type)
			return;
		var e = Game.createEnemy(type);
		var s = this.n / DEF.wave.full_speed;
		s = Math.max(0.6, s * s) * e.speed;
		e.speed = Math.min(DEF.enemy.pike.speed, s);
		if (e.type == 'horse') {
			e.speed = Math.min(DEF.enemy.pike.speed / 2, e.speed);
		}
		if (UP.force + UP.dexterity + UP.damage == 45) {
			e.hp += 50 * Math.max(1, this.n - 25);
		}
		this.value -= e.value;
		this.refreshUI();
		if (this.enemies.length > 0) {
			var dn = Math.min(3, 1 + (this.n / 5));
			var dt = Math.round(Math.random() * DEF.wave.enemy_delay * 2 / dn);
			this.enemyTimer = setTimeout('Game.wave.nextEnemy()', dt);
		}
		Game.changed = true;
	}
	this.stop = function () {
		clearTimeout(this.enemyTimer);
	}
	this.clear = function () {
		this.stop();
		this.enemies = [];
	}
}
var UpgradeBar = function (cnt, cost) {
	var self = this;
	cnt = ~~cnt ? ~~cnt : 15;
	this.maxValue = cnt;
	this.value = 0;
	this.cost = ~~cost;
	this.enabled = true;
	this.plus = library.getSprite('plus');
	this.bricks = [];
	for (var i = 0; i < this.maxValue; i++) {
		this.bricks.push(library.getSprite('skill'));
	}
	this.x = 0;
	this.y = 0;
	this.setValue = function (val) {
		this.value = max(0, min(this.maxValue, ~~val));
		this.enabled &= (this.value < this.maxValue);
		Game.changed = true;
	}
	this.createUI = function (x, y, val) {
		this.x = ~~x;
		this.y = ~~y;
		this.setValue(~~val);
		for (var i = 0; i < this.bricks.length; i++) {
			stage.addChild(this.bricks[i]);
		}
		stage.addChild(this.plus);
		this.refreshUI();
	}
	this.refreshUI = function () {
		this.enabled &= (Game.data.money >= this.cost);
		this.enabled &= (this.value < this.maxValue);
		for (var i = 0; i < this.bricks.length; i++) {
			this.bricks[i].x = this.x + i * 7;
			this.bricks[i].y = this.y;
			this.bricks[i].currentLayer = (this.value > i) ? 1 : 0;
		}
		this.plus.x = this.x + this.bricks.length * 7 + 20;
		this.plus.y = this.y;
		this.plus.opacity = this.enabled ? 1.0 : 0.5;
		this.plus.onclick = this.enabled ? function () {
			if (self.enabled) {
				self.setValue(self.value + 1);
				if (self.value >= self.maxValue)
					self.enabled = false;
				self.refreshUI();
			}
			if (self.onchange) {
				return self.onchange(self);
			}
		}
		 : null;
	}
	this.clearUI = function () {
		stage.removeChild(this.plus);
		for (var i = 0; i < this.bricks.length; i++) {
			stage.removeChild(this.bricks[i]);
		}
	}
	this.onchange = null;
}
function buildBackground() {
	stage.drawScene(document.getElementById("screen_background"), true);
}
function showMenu() {
	if (Game.wave && Game.wave.n > 0)
		Game.wave.n--;
	Game.clearAll();
	Game.state = STATE_MENU;
	createScene();
}
function showUpgrade() {
	Game.clearAll();
	Game.state = STATE_UPGRADE;
	Game.changed = true;
	createScene();
}
function preTick() {
	if (Game.state == STATE_GAME) {
		Game.refreshArrows();
		Game.refreshEnemies();
		Game.refreshUI();
	}
}
function postTick() {
	if (Game.state == STATE_GAME) {
		if (Game.wave && (Game.wave.getProgress() == 1)) {
			if ((Game.enemies.length == 0) && (Game.wave.enemies.length == 0)) {
				Game.waveComplete();
			}
		}
	}
	debugDraw();
}
var df = false;
function debugDraw() {
	if (!showDebugDraw)
		return;
	Utils.drawIphoneLimiter(stage, true);
	Utils.drawGrid(true);
}
function Text(font, width, height) {
	this.ALIGN_LEFT = 0;
	this.ALIGN_RIGHT = 1;
	this.ALIGN_CENTER = 2;
	this.font = font;
	this.x = 0;
	this.y = 0;
	this.width = width;
	this.height = height;
	this.align = this.ALIGN_LEFT;
	this.rotation = 0;
	this.static = false;
	this.charMap = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'];
	this.sprites = [];
	this.manageSprites = function (text) {
		var i,
		char;
		var len = text.length;
		var sp_len = this.sprites.length;
		if (sp_len < len) {
			for (i = 0; i < len - sp_len; i++) {
				char = new Sprite(this.font, this.width, this.height, this.charMap.length);
				this.sprites.push(char);
				stage.addChild(char);
			}
		}
		if (sp_len > len) {
			for (i = 0; i < sp_len - len; i++)
				stage.removeChild(this.sprites[i]);
			this.sprites.splice(0, sp_len - len);
		}
	}
	this.write = function (text) {
		var curX,
		curY,
		p,
		p2,
		n;
		this.manageSprites(text);
		curX = this.x;
		curY = this.y;
		if (this.align == this.ALIGN_CENTER)
			curX = this.x - (text.length - 1) / 2 * this.width;
		if (this.align == this.ALIGN_RIGHT)
			curX = this.x - (text.length - 1) * this.width;
		p = new Vector(curX - this.x, 0);
		p.rotate(-this.rotation);
		curX = p.x + this.x;
		curY = p.y + this.y;
		p = new Vector(0, 0);
		for (var i = 0; i < text.length; i++) {
			this.sprites[i].visible = true;
			n = this.charMap.indexOf(text.substr(i, 1));
			if (n < 0)
				this.sprites[i].visible = false;
			else {
				this.sprites[i].gotoAndStop(n);
				p2 = p.clone();
				p2.rotate(-this.rotation);
				this.sprites[i].x = p2.x + curX;
				this.sprites[i].y = p2.y + curY;
				this.sprites[i].rotation = this.rotation;
				this.sprites[i].static = this.static;
				p.x += this.width;
			}
		}
	}
}
var Font1 = function () {
	var s = library.getSprite('font1');
	var charmap = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'];
	Font1.superclass.constructor.call(this, 'font1', s.bitmap, s.width, s.height, charmap);
}
var Font2 = function () {
	var s = library.getSprite('font2');
	var charmap = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'];
	Font1.superclass.constructor.call(this, 'font1', s.bitmap, s.width, s.height, charmap);
}
var GUIFont = function (name, bitmap, w, h, charmap) {
	this.name = name;
	this.charmap = [];
	GUIFont.superclass.constructor.call(this, bitmap, w, h, 1);
	this.stop();
	this.static = true;
	this.setCharmap = function (charmap) {
		this.charmap = charmap;
		this.totalFrames = charmap.length;
	}
	GUIFont.prototype.validChar = function (char) {
		return (this.charmap.indexOf(char.toString()) >= 0);
	}
	GUIFont.prototype.setChar = function (char) {
		var i = this.charmap.indexOf(char.toString());
		if (i < 0)
			return;
		this.gotoAndStop(i);
	}
	GUIFont.prototype.getChar = function () {
		return this.charmap[this.currentFrame];
	}
	this.setCharmap(charmap);
}
var GUIString = function (fontClass, static) {
	this.font = fontClass;
	this.chars = [];
	this.align = 'left';
	this.valign = 'middle';
	this.vertical = false;
	var ch = new this.font();
	this.charWidth = ch.width;
	this.charHeight = ch.height;
	delete(ch);
	this.x = 0;
	this.y = 0;
	this.height = 0;
	this.width = 0;
	this.static = (typeof static == 'undefined') ? false : static;
	this.getString = function () {
		var str = '';
		for (var i = 0; i < this.chars.length; i++) {
			str += this.chars[i] ? this.chars[i].getChar() : '';
		}
		return str;
	}
	this.setPosition = function (x, y, align, valign) {
		if (typeof align == 'undefined')
			align = 'left';
		this.align = align.toString().toLowerCase();
		if (typeof valign == 'undefined')
			valign = 'middle';
		this.valign = valign.toString().toLowerCase();
		x = parseInt(x);
		y = parseInt(y);
		this.x = (isNaN(x)) ? this.x : x;
		this.y = (isNaN(y)) ? this.y : y;
		var left = this.x;
		var top = this.y;
		if (this.chars.length > 0) {
			if (this.align == 'center')
				left -= Math.round(this.width / 2);
			if (this.align == 'right')
				left -= this.width;
			if (this.valign == 'top')
				top += Math.round(this.height / 2);
			if (this.valign == 'bottom')
				top -= Math.round(this.height / 2);
		} else {
			this.width = 0;
			this.height = 0;
		}
		for (var i = 0; i < this.chars.length; i++) {
			if (this.chars[i]) {
				this.chars[i].x = left + (this.vertical ? 0 : this.chars[i].width * i);
				this.chars[i].y = top + (this.vertical ? this.chars[i].height * i : 0);
			}
		}
		if (this.static)
			buildBackground();
	}
	this._validateString = function (str) {
		str = str.toString();
		var valid = '';
		var font = new this.font();
		for (var i = 0; i < str.length; i++) {
			var char = str.substring(i, i + 1);
			if (font.validChar(char))
				valid += char;
		}
		return valid;
	}
	this._createStageChars = function (count) {
		var n = this.chars.length;
		var diff = n - count;
		if (diff == 0)
			return;
		while (diff != 0) {
			var mc;
			if (diff < 0) {
				mc = new this.font();
				mc = stage.addChild(mc);
				this.chars.push(mc);
			} else {
				mc = this.chars.pop();
				stage.removeChild(mc);
			}
			diff += diff < 0 ? 1 : -1;
		}
		if (count > 0) {
			this.width = this.charWidth * (this.vertical ? 1 : this.chars.length);
			this.height = this.charHeight * (this.vertical ? this.chars.length : 1);
		} else {
			this.width = 0;
			this.height = 0;
		}
	}
	this.write = function (str, x, y, align) {
		str = this._validateString(str);
		var len = str.length;
		this._createStageChars(len);
		for (var i = 0; i < len; i++) {
			var mc = this.chars[i];
			mc.static = this.static;
			stage.setZIndex(mc, this.chars[0].zIndex);
			mc.setChar(str.substring(i, i + 1));
		}
		this.setPosition(x, y, align);
	}
	this.clear = function () {
		this.write('');
	}
}
var PI = 3.1415;
function abs(a) {
	return (a < 0) ? -a : a;
}
function round(a) {
	return ~~(a + (a > 0 ? .5 :  - .5));
}
function max(a, b) {
	return (a < b) ? b : a;
}
function ceil(a) {
	return ~~a + 1;
}
function min(a, b) {
	return (a < b) ? a : b;
}
function atan(x) {
	return ((x < 0) ? -x : x) < 1 ? x / (1 + 0.28 * x * x) : (x < 0 ? -1 : 1) * PI / 2 - x / (x * x + 0.28);
}
function atan2(y, x) {
	var a;
	return x == 0 ? (y > 0 ? PI / 2 : (y == 0 ? 'error' : -PI / 2)) : (x < 0 ? (y >= 0 ? PI : -PI) : 0) + (((a = y / x) < 0 ? -a : a) < 1 ? a / (1 + 0.28 * a * a) : (a < 0 ? -1 : 1) * PI / 2 - a / (a * a + 0.28));
};
