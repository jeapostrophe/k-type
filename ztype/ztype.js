// Built with IMPACT - impactjs.org
Number.prototype.map = function (istart, istop, ostart, ostop) {
    return ostart + (ostop - ostart) * ((this - istart) / (istop - istart));
};
Number.prototype.limit = function (min, max) {
    return Math.min(max, Math.max(min, this));
};
Number.prototype.round = function (precision) {
    precision = Math.pow(10, precision || 0);
    return Math.round(this * precision) / precision;
};
Number.prototype.floor = function () {
    return Math.floor(this);
};
Number.prototype.ceil = function () {
    return Math.ceil(this);
};
Number.prototype.toInt = function () {
    return (this | 0);
};
Array.prototype.erase = function (item) {
    for (var i = this.length; i--; i) {
        if (this[i] === item) this.splice(i, 1);
    }
    return this;
};
Array.prototype.random = function () {
    return this[(Math.random() * this.length).floor()];
};
Function.prototype.bind = function (bind) {
    var self = this;
    return function () {
        var args = Array.prototype.slice.call(arguments);
        return self.apply(bind || null, args);
    };
};
(function (window) {
    window.ig = {
        game: null,
        version: '1.15',
        global: window,
        modules: {},
        resources: [],
        ready: false,
        baked: false,
        nocache: '',
        ua: {},
        lib: 'lib/',
        _current: null,
        _loadQueue: [],
        _waitForOnload: 0,
        $: function (selector) {
            return selector.charAt(0) == '#' ? document.getElementById(selector.substr(1)) : document.getElementsByTagName(selector);
        },
        $new: function (name) {
            return document.createElement(name);
        },
        copy: function (object) {
            if (!object || typeof(object) != 'object' || object instanceof HTMLElement || object instanceof ig.Class) {
                return object;
            } else if (object instanceof Array) {
                var c = [];
                for (var i = 0, l = object.length; i < l; i++) {
                    c[i] = ig.copy(object[i]);
                }
                return c;
            } else {
                var c = {};
                for (var i in object) {
                    c[i] = ig.copy(object[i]);
                }
                return c;
            }
        },
        merge: function (original, extended) {
            for (var key in extended) {
                var ext = extended[key];
                if (typeof(ext) != 'object' || ext instanceof HTMLElement || ext instanceof ig.Class) {
                    original[key] = ext;
                } else {
                    if (!original[key] || typeof(original[key]) != 'object') {
                        original[key] = {};
                    }
                    ig.merge(original[key], ext);
                }
            }
            return original;
        },
        ksort: function (obj) {
            if (!obj || typeof(obj) != 'object') {
                return [];
            }
            var keys = [],
                values = [];
            for (var i in obj) {
                keys.push(i);
            }
            keys.sort();
            for (var i = 0; i < keys.length; i++) {
                values.push(obj[keys[i]]);
            }
            return values;
        },
        module: function (name) {
            if (ig._current) {
                throw ("Module '" + ig._current.name + "' defines nothing");
            }
            ig._current = {
                name: name,
                requires: [],
                loaded: false,
                body: null
            };
            ig.modules[name] = ig._current;
            ig._loadQueue.push(ig._current);
            ig._initDOMReady();
            return ig;
        },
        requires: function () {
            ig._current.requires = Array.prototype.slice.call(arguments);
            return ig;
        },
        defines: function (body) {
            name = ig._current.name;
            ig._current.body = body;
            ig._current = null;
            ig._execModules();
        },
        addResource: function (resource) {
            ig.resources.push(resource);
        },
        setNocache: function (set) {
            ig.nocache = set ? '?' + Math.random().toString().substr(2) : '';
        },
        _loadScript: function (name, requiredFrom) {
            ig.modules[name] = {
                name: name,
                requires: [],
                loaded: false,
                body: null
            };
            ig._waitForOnload++;
            var path = ig.lib + name.replace(/\./g, '/') + '.js' + ig.nocache;
            var script = ig.$new('script');
            script.type = 'text/javascript';
            script.src = path;
            script.onload = function () {
                ig._waitForOnload--;
                ig._execModules();
            };
            script.onerror = function () {
                throw ('Failed to load module ' + name + ' at ' + path + ' ' + 'required from ' + requiredFrom);
            };
            ig.$('head')[0].appendChild(script);
        },
        _execModules: function () {
            var modulesLoaded = false;
            for (var i = 0; i < ig._loadQueue.length; i++) {
                var m = ig._loadQueue[i];
                var dependenciesLoaded = true;
                for (var j = 0; j < m.requires.length; j++) {
                    var name = m.requires[j];
                    if (!ig.modules[name]) {
                        dependenciesLoaded = false;
                        ig._loadScript(name, m.name);
                    } else if (!ig.modules[name].loaded) {
                        dependenciesLoaded = false;
                    }
                }
                if (dependenciesLoaded && m.body) {
                    ig._loadQueue.splice(i, 1);
                    m.loaded = true;
                    m.body();
                    modulesLoaded = true;
                    i--;
                }
            }
            if (modulesLoaded) {
                ig._execModules();
            } else if (!ig.baked && ig._waitForOnload == 0 && ig._loadQueue.length != 0) {
                var unresolved = [];
                for (var i = 0; i < ig._loadQueue.length; i++) {
                    var unloaded = [];
                    var requires = ig._loadQueue[i].requires;
                    for (var j = 0; j < requires.length; j++) {
                        var m = ig.modules[requires[j]];
                        if (!m || !m.loaded) {
                            unloaded.push(requires[j]);
                        }
                    }
                    unresolved.push(ig._loadQueue[i].name + ' (requires: ' + unloaded.join(', ') + ')');
                }
                throw ('Unresolved (circular?) dependencies. ' + "Most likely there's a name/path mismatch for one of the listed modules:\n" + unresolved.join('\n'));
            }
        },
        _DOMReady: function () {
            if (!ig.modules['dom.ready'].loaded) {
                if (!document.body) {
                    return setTimeout(ig._DOMReady, 13);
                }
                ig.modules['dom.ready'].loaded = true;
                ig._waitForOnload--;
                ig._execModules();
            }
            return 0;
        },
        _boot: function () {
            if (document.location.href.match(/\?nocache/)) {
                ig.setNocache(true);
            }
            ig.ua.pixelRatio = window.devicePixelRatio || 1;
            ig.ua.viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            ig.ua.screen = {
                width: window.screen.availWidth * ig.ua.pixelRatio,
                height: window.screen.availHeight * ig.ua.pixelRatio
            };
            ig.ua.iPhone = /iPhone/i.test(navigator.userAgent);
            ig.ua.iPhone4 = (ig.ua.iPhone && ig.ua.pixelRatio == 2);
            ig.ua.iPad = /iPad/i.test(navigator.userAgent);
            ig.ua.android = /android/i.test(navigator.userAgent);
            ig.ua.iOS = ig.ua.iPhone || ig.ua.iPad;
            ig.ua.mobile = ig.ua.iOS || ig.ua.android;
        },
        _initDOMReady: function () {
            if (ig.modules['dom.ready']) {
                return;
            }
            ig._boot();
            ig.modules['dom.ready'] = {
                requires: [],
                loaded: false,
                body: null
            };
            ig._waitForOnload++;
            if (document.readyState === 'complete') {
                ig._DOMReady();
            } else {
                document.addEventListener('DOMContentLoaded', ig._DOMReady, false);
                window.addEventListener('load', ig._DOMReady, false);
            }
        },
    };
    var initializing = false,
        fnTest = /xyz/.test(function () {
            xyz;
        }) ? /\bparent\b/ : /.*/;
    window.ig.Class = function () {};
    window.ig.Class.extend = function (prop) {
        var parent = this.prototype;
        initializing = true;
        var prototype = new this();
        initializing = false;
        for (var name in prop) {
            if (typeof(prop[name]) == "function" && typeof(parent[name]) == "function" && fnTest.test(prop[name])) {
                prototype[name] = (function (name, fn) {
                    return function () {
                        var tmp = this.parent;
                        this.parent = parent[name];
                        var ret = fn.apply(this, arguments);
                        this.parent = tmp;
                        return ret;
                    };
                })(name, prop[name])
            } else {
                prototype[name] = prop[name];
            }
        }

        function Class() {
            if (!initializing) {
                if (this.staticInstantiate) {
                    var obj = this.staticInstantiate.apply(this, arguments);
                    if (obj) {
                        return obj;
                    }
                }
                for (p in this) {
                    this[p] = ig.copy(this[p]);
                }
                if (this.init) {
                    this.init.apply(this, arguments);
                }
            }
            return this;
        }
        Class.prototype = prototype;
        Class.constructor = Class;
        Class.extend = arguments.callee;
        return Class;
    };
})(window);

// lib/impact/image.js
ig.baked = true;
ig.module('impact.image').defines(function () {
    ig.Image = ig.Class.extend({
        data: null,
        width: 0,
        height: 0,
        loaded: false,
        failed: false,
        loadCallback: null,
        path: '',
        staticInstantiate: function (path) {
            return ig.Image.cache[path] || null;
        },
        init: function (path) {
            this.path = path;
            this.load();
        },
        load: function (loadCallback) {
            if (this.loaded) {
                if (loadCallback) {
                    loadCallback(this.path, true);
                }
                return;
            } else if (!this.loaded && ig.ready) {
                this.loadCallback = loadCallback || null;
                this.data = new Image();
                this.data.onload = this.onload.bind(this);
                this.data.onerror = this.onerror.bind(this);
                this.data.src = this.path + ig.nocache;
            } else {
                ig.addResource(this);
            }
            ig.Image.cache[this.path] = this;
        },
        reload: function () {
            this.loaded = false;
            this.data = new Image();
            this.data.onload = this.onload.bind(this);
            this.data.src = this.path + '?' + Math.random();
        },
        onload: function (event) {
            this.width = this.data.width;
            this.height = this.data.height;
            if (ig.system.scale != 1) {
                this.resize(ig.system.scale);
            }
            this.loaded = true;
            if (this.loadCallback) {
                this.loadCallback(this.path, true);
            }
        },
        onerror: function (event) {
            this.failed = true;
            if (this.loadCallback) {
                this.loadCallback(this.path, false);
            }
        },
        resize: function (scale) {
            var widthScaled = this.width * scale;
            var heightScaled = this.height * scale;
            var orig = ig.$new('canvas');
            orig.width = this.width;
            orig.height = this.height;
            var origCtx = orig.getContext('2d');
            origCtx.drawImage(this.data, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
            var origPixels = origCtx.getImageData(0, 0, this.width, this.height);
            var scaled = ig.$new('canvas');
            scaled.width = widthScaled;
            scaled.height = heightScaled;
            var scaledCtx = scaled.getContext('2d');
            var scaledPixels = scaledCtx.getImageData(0, 0, widthScaled, heightScaled);
            for (var y = 0; y < heightScaled; y++) {
                for (var x = 0; x < widthScaled; x++) {
                    var index = ((y / scale).floor() * this.width + (x / scale).floor()) * 4;
                    var indexScaled = (y * widthScaled + x) * 4;
                    scaledPixels.data[indexScaled] = origPixels.data[index];
                    scaledPixels.data[indexScaled + 1] = origPixels.data[index + 1];
                    scaledPixels.data[indexScaled + 2] = origPixels.data[index + 2];
                    scaledPixels.data[indexScaled + 3] = origPixels.data[index + 3];
                }
            }
            scaledCtx.putImageData(scaledPixels, 0, 0);
            this.data = scaled;
        },
        draw: function (targetX, targetY, sourceX, sourceY, width, height) {
            if (!this.loaded) {
                return;
            }
            var scale = ig.system.scale;
            sourceX = sourceX ? sourceX * scale : 0;
            sourceY = sourceY ? sourceY * scale : 0;
            width = (width ? width : this.width) * scale;
            height = (height ? height : this.height) * scale;
            ig.system.context.drawImage(this.data, sourceX, sourceY, width, height, ig.system.getDrawPos(targetX), ig.system.getDrawPos(targetY), width, height);
        },
        drawTile: function (targetX, targetY, tile, tileWidth, tileHeight, flipX, flipY) {
            tileHeight = tileHeight ? tileHeight : tileWidth;
            if (!this.loaded || tileWidth > this.width || tileHeight > this.height) {
                return;
            }
            var scale = ig.system.scale;
            var tileWidthScaled = tileWidth * scale;
            var tileHeightScaled = tileHeight * scale;
            var scaleX = flipX ? -1 : 1;
            var scaleY = flipY ? -1 : 1;
            if (flipX || flipY) {
                ig.system.context.save();
                ig.system.context.scale(scaleX, scaleY);
            }
            ig.system.context.drawImage(this.data, ((tile * tileWidth).floor() % this.width) * scale, ((tile * tileWidth / this.width).floor() * tileHeight) * scale, tileWidthScaled, tileHeightScaled, ig.system.getDrawPos(targetX) * scaleX - (flipX ? tileWidthScaled : 0), ig.system.getDrawPos(targetY) * scaleY - (flipY ? tileHeightScaled : 0), tileWidthScaled, tileHeightScaled);
            if (flipX || flipY) {
                ig.system.context.restore();
            }
        }
    });
    ig.Image.cache = {};
    ig.Image.reloadCache = function () {
        for (path in ig.Image.cache) {
            ig.Image.cache[path].reload();
        }
    };
});

// lib/impact/font.js
ig.baked = true;
ig.module('impact.font').requires('impact.image').defines(function () {
    ig.Font = ig.Image.extend({
        widthMap: [],
        indices: [],
        firstChar: 32,
        height: 0,
        onload: function (ev) {
            this._loadMetrics(this.data);
            this.parent(ev);
        },
        widthForString: function (s) {
            var width = 0;
            for (var i = 0; i < s.length; i++) {
                width += this.widthMap[s.charCodeAt(i) - this.firstChar] + 1;
            }
            return width;
        },
        draw: function (text, x, y, align) {
            if (typeof(text) != 'string') {
                text = text.toString();
            }
            if (align == ig.Font.ALIGN.RIGHT || align == ig.Font.ALIGN.CENTER) {
                var width = 0;
                for (var i = 0; i < text.length; i++) {
                    var c = text.charCodeAt(i);
                    width += this.widthMap[c - this.firstChar] + 1;
                }
                x -= align == ig.Font.ALIGN.CENTER ? width / 2 : width;
            }
            for (var i = 0; i < text.length; i++) {
                var c = text.charCodeAt(i);
                x += this._drawChar(c - this.firstChar, x, y);
            }
        },
        _drawChar: function (c, targetX, targetY) {
            if (!this.loaded || c < 0 || c >= this.indices.length) {
                return 0;
            }
            var scale = ig.system.scale;
            var charX = this.indices[c] * scale;
            var charY = 0;
            var charWidth = this.widthMap[c] * scale;
            var charHeight = (this.height - 2) * scale;
            ig.system.context.drawImage(this.data, charX, charY, charWidth, charHeight, ig.system.getDrawPos(targetX), ig.system.getDrawPos(targetY), charWidth, charHeight);
            return this.widthMap[c] + 1;
        },
        _loadMetrics: function (image) {
            this.height = image.height - 1;
            this.widthMap = [];
            this.indices = [];
            var canvas = ig.$new('canvas');
            canvas.width = image.width;
            canvas.height = 1;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, image.height - 1, image.width, 1, 0, 0, image.width, 1);
            var px = ctx.getImageData(0, 0, image.width, 1);
            var currentChar = 0;
            var currentWidth = 0;
            for (var x = 0; x < image.width; x++) {
                var index = x * 4 + 3;
                if (px.data[index] != 0) {
                    currentWidth++;
                } else if (px.data[index] == 0 && currentWidth) {
                    this.widthMap.push(currentWidth);
                    this.indices.push(x - currentWidth);
                    currentChar++;
                    currentWidth = 0;
                }
            }
            this.widthMap.push(currentWidth);
            this.indices.push(x - currentWidth);
        }
    });
    ig.Font.ALIGN = {
        LEFT: 0,
        RIGHT: 1,
        CENTER: 2
    };
});

// lib/impact/sound.js
ig.baked = true;
ig.module('impact.sound').defines(function () {
    ig.SoundManager = ig.Class.extend({
        clips: {},
        volume: 1,
        channels: 8,
        format: 'mp3',
        init: function () {
            this.format = ig.$new('audio').canPlayType('audio/mpeg') ? 'mp3' : 'ogg';
        },
        load: function (path, multiChannel, loadCallback) {
            if (this.clips[path]) {
                if (multiChannel && this.clips[path].length < this.channels) {
                    for (var i = this.clips[path].length; i < this.channels; i++) {
                        this.clips[path].push(this.clips[path][0].cloneNode(true));
                    }
                }
                return this.clips[path][0];
            }
            var realPath = path.match(/^(.*)\.[^\.]+$/)[1] + '.' + this.format + ig.nocache;
            var clip = ig.$new('audio');
            if (loadCallback) {
                clip.addEventListener('canplaythrough', function (ev) {
                    this.removeEventListener('canplaythrough', arguments.callee, false)
                    loadCallback(path, true, ev);
                }, false);
                clip.addEventListener('error', function (ev) {
                    loadCallback(path, true, ev);
                }, false);
            }
            clip.autobuffer = true;
            clip.preload = 'auto';
            clip.src = realPath;
            clip.load();
            this.clips[path] = [clip];
            if (multiChannel) {
                for (var i = 1; i < this.channels; i++) {
                    this.clips[path].push(clip.cloneNode(true));
                }
            }
            return clip;
        },
        get: function (path) {
            var channels = this.clips[path];
            for (var i = 0, clip; clip = channels[i++];) {
                if (clip.paused || clip.ended) {
                    if (clip.ended) {
                        clip.currentTime = 0;
                    }
                    return clip;
                }
            }
            channels[0].pause();
            channels[0].currentTime = 0;
            return channels[0];
        }
    });
    ig.Music = ig.Class.extend({
        tracks: [],
        currentTrack: null,
        currentIndex: 0,
        random: false,
        _volume: 1,
        _loop: false,
        _fadeInterval: 0,
        _fadeTimer: null,
        _endedCallbackBound: null,
        init: function () {
            this._endedCallbackBound = this._endedCallback.bind(this);
            if (Object.defineProperty) {
                Object.defineProperty(this, "volume", {
                    get: this.getVolume.bind(this),
                    set: this.setVolume.bind(this)
                });
                Object.defineProperty(this, "loop", {
                    get: this.getLooping.bind(this),
                    set: this.setLooping.bind(this)
                });
            } else if (this.__defineGetter__) {
                this.__defineGetter__('volume', this.getVolume.bind(this));
                this.__defineSetter__('volume', this.setVolume.bind(this));
                this.__defineGetter__('loop', this.getLooping.bind(this));
                this.__defineSetter__('loop', this.setLooping.bind(this));
            }
        },
        add: function (music) {
            if (!ig.Sound.enabled) {
                return;
            }
            var path = music instanceof ig.Sound ? music.path : music;
            var track = ig.soundManager.load(path, false);
            track.loop = this._loop;
            track.volume = this._volume;
            track.addEventListener('ended', this._endedCallbackBound, false);
            this.tracks.push(track);
            if (!this.currentTrack) {
                this.currentTrack = track;
            }
        },
        next: function () {
            if (!this.tracks.length) {
                return;
            }
            this.stop();
            this.currentIndex = this.random ? (Math.random() * this.tracks.length).floor() : (this.currentIndex + 1) % this.tracks.length;
            this.currentTrack = this.tracks[this.currentIndex];
            this.play();
        },
        pause: function () {
            if (!this.currentTrack) {
                return;
            }
            this.currentTrack.pause();
        },
        stop: function () {
            if (!this.currentTrack) {
                return;
            }
            this.currentTrack.pause();
            this.currentTrack.currentTime = 0;
        },
        play: function () {
            if (!this.currentTrack) {
                return;
            }
            this.currentTrack.play();
        },
        getLooping: function () {
            return this._loop;
        },
        setLooping: function (l) {
            this._loop = l;
            for (var i in this.tracks) {
                this.tracks[i].loop = l;
            }
        },
        getVolume: function () {
            return this._volume;
        },
        setVolume: function (v) {
            this._volume = v.limit(0, 1);
            for (var i in this.tracks) {
                this.tracks[i].volume = this._volume;
            }
        },
        fadeOut: function (time) {
            if (!this.currentTrack) {
                return;
            }
            clearInterval(this._fadeInterval);
            this.fadeTimer = new ig.Timer(time);
            this._fadeInterval = setInterval(this._fadeStep.bind(this), 50);
        },
        _fadeStep: function () {
            var v = this.fadeTimer.delta().map(-this.fadeTimer.target, 0, 1, 0).limit(0, 1) * this._volume;
            if (v <= 0.01) {
                this.stop();
                this.currentTrack.volume = this._volume;
                clearInterval(this._fadeInterval);
            } else {
                this.currentTrack.volume = v;
            }
        },
        _endedCallback: function () {
            if (this._loop) {
                this.play();
            } else {
                this.next();
            }
        }
    });
    ig.Sound = ig.Class.extend({
        path: '',
        volume: 1,
        currentClip: null,
        multiChannel: true,
        init: function (path, multiChannel) {
            this.path = path;
            this.multiChannel = (multiChannel !== false);
            this.load();
        },
        load: function (loadCallback) {
            if (!ig.Sound.enabled) {
                if (loadCallback) {
                    loadCallback(this.path, true);
                }
                return;
            }
            if (ig.ready) {
                ig.soundManager.load(this.path, this.multiChannel, loadCallback);
            } else {
                ig.addResource(this);
            }
        },
        play: function () {
            if (!ig.Sound.enabled) {
                return;
            }
            this.currentClip = ig.soundManager.get(this.path);
            this.currentClip.volume = ig.soundManager.volume * this.volume;
            this.currentClip.play();
        },
        stop: function () {
            if (this.currentClip) {
                this.currentClip.pause();
                this.currentClip.currentTime = 0;
            }
        }
    });
    ig.Sound.enabled = true;
});

// lib/impact/loader.js
ig.baked = true;
ig.module('impact.loader').requires('impact.image', 'impact.font', 'impact.sound').defines(function () {
    ig.Loader = ig.Class.extend({
        resources: [],
        gameClass: null,
        status: 0,
        done: false,
        _unloaded: [],
        _drawStatus: 0,
        _intervalId: 0,
        _loadCallbackBound: null,
        init: function (gameClass, resources) {
            this.gameClass = gameClass;
            this.resources = resources;
            this._loadCallbackBound = this._loadCallback.bind(this);
            for (var i = 0; i < this.resources.length; i++) {
                this._unloaded.push(this.resources[i].path);
            }
        },
        load: function () {
            ig.system.clear('#000');
            if (!this.resources.length) {
                this.end();
                return;
            }
            for (var i = 0; i < this.resources.length; i++) {
                this.loadResource(this.resources[i]);
            }
            this._intervalId = setInterval(this.draw.bind(this), 16);
        },
        loadResource: function (res) {
            res.load(this._loadCallbackBound);
        },
        end: function () {
            if (this.done) {
                return;
            }
            this.done = true;
            clearInterval(this._intervalId);
            ig.system.setGame(this.gameClass);
        },
        draw: function () {
            this._drawStatus += (this.status - this._drawStatus) / 5;
            var s = ig.system.scale;
            var w = ig.system.width * 0.6;
            var h = ig.system.height * 0.1;
            var x = ig.system.width * 0.5 - w / 2;
            var y = ig.system.height * 0.5 - h / 2;
            ig.system.context.fillStyle = '#000';
            ig.system.context.fillRect(0, 0, 480, 320);
            ig.system.context.fillStyle = '#fff';
            ig.system.context.fillRect(x * s, y * s, w * s, h * s);
            ig.system.context.fillStyle = '#000';
            ig.system.context.fillRect(x * s + s, y * s + s, w * s - s - s, h * s - s - s);
            ig.system.context.fillStyle = '#fff';
            ig.system.context.fillRect(x * s, y * s, w * s * this._drawStatus, h * s);
        },
        _loadCallback: function (path, status) {
            if (status) {
                this._unloaded.erase(path);
            } else {
                throw ('Failed to load resource: ' + path);
            }
            this.status = 1 - (this._unloaded.length / this.resources.length);
            if (this._unloaded.length == 0) {
                setTimeout(this.end.bind(this), 250);
            }
        }
    });
});

// lib/impact/timer.js
ig.baked = true;
ig.module('impact.timer').defines(function () {
    ig.Timer = ig.Class.extend({
        target: 0,
        base: 0,
        last: 0,
        init: function (seconds) {
            this.base = ig.Timer.time;
            this.last = ig.Timer.time;
            this.target = seconds || 0;
        },
        set: function (seconds) {
            this.target = seconds || 0;
            this.base = ig.Timer.time;
        },
        reset: function () {
            this.base = ig.Timer.time;
        },
        tick: function () {
            var delta = ig.Timer.time - this.last;
            this.last = ig.Timer.time;
            return delta;
        },
        delta: function () {
            return ig.Timer.time - this.base - this.target;
        }
    });
    ig.Timer._last = 0;
    ig.Timer.time = 0;
    ig.Timer.timeScale = 1;
    ig.Timer.maxStep = 0.05;
    ig.Timer.step = function () {
        var current = Date.now();
        var delta = (current - ig.Timer._last) / 1000;
        ig.Timer.time += Math.min(delta, ig.Timer.maxStep) * ig.Timer.timeScale;
        ig.Timer._last = current;
    };
});

// lib/impact/system.js
ig.baked = true;
ig.module('impact.system').requires('impact.timer', 'impact.image').defines(function () {
    ig.System = ig.Class.extend({
        fps: 30,
        width: 320,
        height: 240,
        realWidth: 320,
        realHeight: 240,
        scale: 1,
        tick: 0,
        intervalId: 0,
        newGameClass: null,
        running: false,
        delegate: null,
        clock: null,
        canvas: null,
        context: null,
        smoothPositioning: true,
        init: function (canvasId, fps, width, height, scale) {
            this.fps = fps;
            this.width = width;
            this.height = height;
            this.scale = scale;
            this.realWidth = width * scale;
            this.realHeight = height * scale;
            this.clock = new ig.Timer();
            this.canvas = ig.$(canvasId);
            this.canvas.width = this.realWidth;
            this.canvas.height = this.realHeight;
            this.context = this.canvas.getContext('2d');
        },
        setGame: function (gameClass) {
            if (this.running) {
                this.newGameClass = gameClass;
            } else {
                this.setGameNow(gameClass);
            }
        },
        setGameNow: function (gameClass) {
            ig.game = new(gameClass)();
            ig.system.setDelegate(ig.game);
        },
        setDelegate: function (object) {
            if (typeof(object.run) == 'function') {
                this.delegate = object;
                this.startRunLoop();
            } else {
                throw ('System.setDelegate: No run() function in object');
            }
        },
        stopRunLoop: function () {
            clearInterval(this.intervalId);
            this.running = false;
        },
        startRunLoop: function () {
            this.stopRunLoop();
            this.intervalId = setInterval(this.run.bind(this), 1000 / this.fps);
            this.running = true;
        },
        clear: function (color) {
            this.context.fillStyle = color;
            this.context.fillRect(0, 0, this.realWidth, this.realHeight);
        },
        run: function () {
            ig.Timer.step();
            this.tick = this.clock.tick();
            this.delegate.run();
            ig.input.clearPressed();
            if (this.newGameClass) {
                this.setGameNow(this.newGameClass);
                this.newGameClass = null;
            }
        },
        getDrawPos: function (p) {
            return this.smoothPositioning ? (p * this.scale).round() : p.round() * this.scale;
        }
    });
});

// lib/impact/input.js
ig.baked = true;
ig.module('impact.input').defines(function () {
    ig.KEY = {
        'MOUSE1': -1,
        'MOUSE2': -3,
        'MWHEEL_UP': -4,
        'MWHEEL_DOWN': -5,
        'BACKSPACE': 8,
        'TAB': 9,
        'ENTER': 13,
        'PAUSE': 19,
        'CAPS': 20,
        'ESC': 27,
        'SPACE': 32,
        'PAGE_UP': 33,
        'PAGE_DOWN': 34,
        'END': 35,
        'HOME': 36,
        'LEFT_ARROW': 37,
        'UP_ARROW': 38,
        'RIGHT_ARROW': 39,
        'DOWN_ARROW': 40,
        'INSERT': 45,
        'DELETE': 46,
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,
        'NUMPAD_0': 96,
        'NUMPAD_1': 97,
        'NUMPAD_2': 98,
        'NUMPAD_3': 99,
        'NUMPAD_4': 100,
        'NUMPAD_5': 101,
        'NUMPAD_6': 102,
        'NUMPAD_7': 103,
        'NUMPAD_8': 104,
        'NUMPAD_9': 105,
        'MULTIPLY': 106,
        'ADD': 107,
        'SUBSTRACT': 109,
        'DECIMAL': 110,
        'DIVIDE': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123,
        'SHIFT': 16,
        'CTRL': 17,
        'ALT': 18,
        'PLUS': 187,
        'COMMA': 188,
        'MINUS': 189,
        'PERIOD': 190
    };
    ig.Input = ig.Class.extend({
        bindings: {},
        actions: {},
        locks: {},
        delayedKeyup: [],
        isUsingMouse: false,
        isUsingKeyboard: false,
        mouse: {
            x: 0,
            y: 0
        },
        initMouse: function () {
            if (this.isUsingMouse) {
                return;
            }
            this.isUsingMouse = true;
            window.addEventListener('mousewheel', this.mousewheel.bind(this), false);
            ig.system.canvas.addEventListener('contextmenu', this.contextmenu.bind(this), false);
            ig.system.canvas.addEventListener('mousedown', this.keydown.bind(this), false);
            ig.system.canvas.addEventListener('mouseup', this.keyup.bind(this), false);
            ig.system.canvas.addEventListener('mousemove', this.mousemove.bind(this), false);
            ig.system.canvas.addEventListener('touchstart', this.keydown.bind(this), false);
            ig.system.canvas.addEventListener('touchend', this.keyup.bind(this), false);
            ig.system.canvas.addEventListener('touchmove', this.mousemove.bind(this), false);
        },
        initKeyboard: function () {
            if (this.isUsingKeyboard) {
                return;
            }
            this.isUsingKeyboard = true;
            window.addEventListener('keydown', this.keydown.bind(this), false);
            window.addEventListener('keyup', this.keyup.bind(this), false);
        },
        mousewheel: function (event) {
            var code = event.wheel > 0 ? ig.KEY.MWHEEL_UP : ig.KEY.MWHEEL_DOWN;
            var action = this.bindings[code];
            if (action) {
                this.actions[action] = true;
                event.stopPropagation();
                this.delayedKeyup.push(action);
            }
        },
        mousemove: function (event) {
            var el = ig.system.canvas;
            var pos = {
                left: 0,
                top: 0
            };
            while (el != null) {
                pos.left += el.offsetLeft;
                pos.top += el.offsetTop;
                el = el.offsetParent;
            }
            var tx = event.pageX;
            var ty = event.pageY;
            if (event.targetTouches) {
                tx = event.targetTouches[0].clientX;
                ty = event.targetTouches[0].clientY;
            }
            this.mouse.x = (tx - pos.left) / ig.system.scale;
            this.mouse.y = (ty - pos.top) / ig.system.scale;
        },
        contextmenu: function (event) {
            if (this.bindings[ig.KEY.MOUSE2]) {
                event.stopPropagation();
                event.preventDefault();
            }
        },
        keydown: function (event) {
            if (event.target.type == 'text') {
                return;
            }
            var code = event.type == 'keydown' ? event.keyCode : (event.button == 2 ? ig.KEY.MOUSE2 : ig.KEY.MOUSE1);
            if (event.type == 'touchstart') {
                this.mousemove(event);
            }
            var action = this.bindings[code];
            if (action) {
                this.actions[action] = true;
                event.stopPropagation();
                event.preventDefault();
            }
        },
        keyup: function (event) {
            if (event.target.type == 'text') {
                return;
            }
            var code = event.type == 'keyup' ? event.keyCode : (event.button == 2 ? ig.KEY.MOUSE2 : ig.KEY.MOUSE1);
            var action = this.bindings[code];
            if (action) {
                this.delayedKeyup.push(action);
                event.stopPropagation();
                event.preventDefault();
            }
        },
        bind: function (key, action) {
            if (key < 0) {
                this.initMouse();
            } else if (key > 0) {
                this.initKeyboard();
            }
            this.bindings[key] = action;
        },
        bindTouch: function (selector, action) {
            var element = ig.$(selector);
            var that = this;
            element.addEventListener('touchstart', function (ev) {
                that.touchStart(ev, action);
            }, false);
            element.addEventListener('touchend', function (ev) {
                that.touchEnd(ev, action);
            }, false);
        },
        unbind: function (key) {
            this.bindings[key] = null;
        },
        unbindAll: function () {
            this.bindings = [];
        },
        state: function (action) {
            return this.actions[action];
        },
        pressed: function (action) {
            if (!this.locks[action] && this.actions[action]) {
                this.locks[action] = true;
                return true;
            } else {
                return false;
            }
        },
        clearPressed: function () {
            for (var i = 0; i < this.delayedKeyup.length; i++) {
                var action = this.delayedKeyup[i];
                this.locks[action] = false;
                this.actions[action] = false;
            }
            this.delayedKeyup = [];
        },
        touchStart: function (event, action) {
            this.actions[action] = true;
            event.stopPropagation();
            event.preventDefault();
            return false;
        },
        touchEnd: function (event, action) {
            this.delayedKeyup.push(action);
            event.stopPropagation();
            event.preventDefault();
            return false;
        }
    });
});

// lib/impact/impact.js
ig.baked = true;
ig.module('impact.impact').requires('dom.ready', 'impact.loader', 'impact.system', 'impact.input', 'impact.sound').defines(function () {
    ig.main = function (canvasId, gameClass, fps, width, height, scale, loaderClass) {
        ig.system = new ig.System(canvasId, fps, width, height, scale || 1);
        ig.input = new ig.Input();
        ig.soundManager = new ig.SoundManager();
        ig.music = new ig.Music();
        ig.ready = true;
        var loader = new(loaderClass || ig.Loader)(gameClass, ig.resources);
        loader.load();
    };
});

// lib/impact/animation.js
ig.baked = true;
ig.module('impact.animation').requires('impact.timer', 'impact.image').defines(function () {
    ig.AnimationSheet = ig.Class.extend({
        width: 8,
        height: 8,
        image: null,
        init: function (path, width, height) {
            this.width = width;
            this.height = height;
            this.image = new ig.Image(path);
        }
    });
    ig.Animation = ig.Class.extend({
        sheet: null,
        timer: null,
        sequence: [],
        flip: {
            x: false,
            y: false
        },
        pivot: {
            x: 0,
            y: 0
        },
        frame: 0,
        tile: 0,
        loopCount: 0,
        alpha: 1,
        angle: 0,
        init: function (sheet, frameTime, sequence, stop) {
            this.sheet = sheet;
            this.pivot = {
                x: sheet.width / 2,
                y: sheet.height / 2
            };
            this.timer = new ig.Timer();
            this.frameTime = frameTime;
            this.sequence = sequence;
            this.stop = !! stop;
        },
        rewind: function () {
            this.timer.reset();
            this.loopCount = 0;
            this.tile = this.sequence[0];
            return this;
        },
        gotoFrame: function (f) {
            this.timer.set(this.frameTime * -f);
            this.update();
        },
        gotoRandomFrame: function () {
            this.gotoFrame((Math.random() * this.sequence.length).floor())
        },
        update: function () {
            var frameTotal = (this.timer.delta() / this.frameTime).floor();
            this.loopCount = (frameTotal / this.sequence.length).floor();
            if (this.stop && this.loopCount > 0) {
                this.frame = this.sequence.length - 1;
            } else {
                this.frame = frameTotal % this.sequence.length;
            }
            this.tile = this.sequence[this.frame];
        },
        draw: function (targetX, targetY) {
            var bbsize = Math.max(this.sheet.width, this.sheet.height);
            if (targetX > ig.system.width || targetY > ig.system.height || targetX + bbsize < 0 || targetY + bbsize < 0) {
                return;
            }
            if (this.alpha != 1) {
                ig.system.context.globalAlpha = this.alpha;
            }
            if (this.angle == 0) {
                this.sheet.image.drawTile(targetX, targetY, this.tile, this.sheet.width, this.sheet.height, this.flip.x, this.flip.y);
            } else {
                ig.system.context.save();
                ig.system.context.translate(ig.system.getDrawPos(targetX + this.pivot.x), ig.system.getDrawPos(targetY + this.pivot.y));
                ig.system.context.rotate(this.angle);
                this.sheet.image.drawTile(-this.pivot.x, -this.pivot.y, this.tile, this.sheet.width, this.sheet.height, this.flip.x, this.flip.y);
                ig.system.context.restore();
            }
            if (this.alpha != 1) {
                ig.system.context.globalAlpha = 1;
            }
        }
    });
});

// lib/impact/entity.js
ig.baked = true;
ig.module('impact.entity').requires('impact.animation', 'impact.impact').defines(function () {
    ig.Entity = ig.Class.extend({
        id: 0,
        settings: {},
        size: {
            x: 16,
            y: 16
        },
        offset: {
            x: 0,
            y: 0
        },
        pos: {
            x: 0,
            y: 0
        },
        last: {
            x: 0,
            y: 0
        },
        vel: {
            x: 0,
            y: 0
        },
        accel: {
            x: 0,
            y: 0
        },
        friction: {
            x: 0,
            y: 0
        },
        maxVel: {
            x: 100,
            y: 100
        },
        zIndex: 0,
        gravityFactor: 1,
        standing: false,
        bounciness: 0,
        minBounceVelocity: 40,
        anims: {},
        animSheet: null,
        currentAnim: null,
        health: 10,
        type: 0,
        checkAgainst: 0,
        collides: 0,
        init: function (x, y, settings) {
            this.id = ++ig.Entity._lastId;
            this.pos.x = x - this.size.x / 2;
            this.pos.y = y - this.size.y / 2;
            ig.merge(this, settings);
        },
        addAnim: function (name, frameTime, sequence, stop) {
            if (!this.animSheet) {
                throw ('No animSheet to add the animation ' + name + ' to.');
            }
            var a = new ig.Animation(this.animSheet, frameTime, sequence, stop);
            this.anims[name] = a;
            if (!this.currentAnim) {
                this.currentAnim = a;
            }
            return a;
        },
        update: function () {
            this.last.x = this.pos.x;
            this.last.y = this.pos.y;
            this.vel.y += ig.game.gravity * ig.system.tick * this.gravityFactor;
            this.vel.x = this.getNewVelocity(this.vel.x, this.accel.x, this.friction.x, this.maxVel.x);
            this.vel.y = this.getNewVelocity(this.vel.y, this.accel.y, this.friction.y, this.maxVel.y);
            var mx = this.vel.x * ig.system.tick;
            var my = this.vel.y * ig.system.tick;
            var res = ig.game.collisionMap.trace(this.pos.x, this.pos.y, mx, my, this.size.x, this.size.y);
            this.handleMovementTrace(res);
            if (this.currentAnim) {
                this.currentAnim.update();
            }
        },
        getNewVelocity: function (vel, accel, friction, max) {
            if (accel) {
                return (vel + accel * ig.system.tick).limit(-max, max);
            } else if (friction) {
                var delta = friction * ig.system.tick;
                if (vel - delta > 0) {
                    return vel - delta;
                } else if (vel + delta < 0) {
                    return vel + delta;
                } else {
                    return 0;
                }
            }
            return vel.limit(-max, max);
        },
        handleMovementTrace: function (res) {
            this.standing = false;
            if (res.collision.y) {
                if (this.bounciness > 0 && Math.abs(this.vel.y) > this.minBounceVelocity) {
                    this.vel.y *= -this.bounciness;
                } else {
                    if (this.vel.y > 0) {
                        this.standing = true;
                    }
                    this.vel.y = 0;
                }
            }
            if (res.collision.x) {
                if (this.bounciness > 0 && Math.abs(this.vel.x) > this.minBounceVelocity) {
                    this.vel.x *= -this.bounciness;
                } else {
                    this.vel.x = 0;
                }
            }
            this.pos = res.pos;
        },
        draw: function () {
            if (this.currentAnim) {
                this.currentAnim.draw(this.pos.x.round() - this.offset.x - ig.game.screen.x, this.pos.y.round() - this.offset.y - ig.game.screen.y);
            }
        },
        kill: function () {
            ig.game.removeEntity(this);
        },
        receiveDamage: function (amount, from) {
            this.health -= amount;
            if (this.health <= 0) {
                this.kill();
            }
        },
        touches: function (other) {
            return !(this.pos.x > other.pos.x + other.size.x || this.pos.x + this.size.x < other.pos.x || this.pos.y > other.pos.y + other.size.y || this.pos.y + this.size.y < other.pos.y);
        },
        distanceTo: function (other) {
            var xd = (this.pos.x + this.size.x / 2) - (other.pos.x + other.size.x / 2);
            var yd = (this.pos.y + this.size.y / 2) - (other.pos.y + other.size.y / 2);
            return Math.sqrt(xd * xd + yd * yd);
        },
        angleTo: function (other) {
            return Math.atan2((other.pos.y + other.size.y / 2) - (this.pos.y + this.size.y / 2), (other.pos.x + other.size.x / 2) - (this.pos.x + this.size.x / 2));
        },
        check: function (other) {},
        collideWith: function (other, axis) {}
    });
    ig.Entity._lastId = 0;
    ig.Entity.COLLIDES = {
        NEVER: 0,
        LITE: 1,
        PASSIVE: 2,
        ACTIVE: 4,
        FIXED: 8
    };
    ig.Entity.TYPE = {
        NONE: 0,
        A: 1,
        B: 2,
        BOTH: 3
    };
    ig.Entity.checkPair = function (a, b) {
        if (a.checkAgainst & b.type) {
            a.check(b);
        }
        if (b.checkAgainst & a.type) {
            b.check(a);
        }
        if (a.collides && b.collides && a.collides + b.collides > ig.Entity.COLLIDES.ACTIVE) {
            ig.Entity.solveCollision(a, b);
        }
    };
    ig.Entity.solveCollision = function (a, b) {
        var weak = null;
        if (a.collides == ig.Entity.COLLIDES.LITE || b.collides == ig.Entity.COLLIDES.FIXED) {
            weak = a;
        } else if (b.collides == ig.Entity.COLLIDES.LITE || a.collides == ig.Entity.COLLIDES.FIXED) {
            weak = b;
        }
        if (a.last.x + a.size.x > b.last.x && a.last.x < b.last.x + b.size.x) {
            if (a.last.y < b.last.y) {
                ig.Entity.seperateOnYAxis(a, b, weak);
            } else {
                ig.Entity.seperateOnYAxis(b, a, weak);
            }
            a.collideWith(b, 'y');
            b.collideWith(a, 'y');
        } else if (a.last.y + a.size.y > b.last.y && a.last.y < b.last.y + b.size.y) {
            if (a.last.x < b.last.x) {
                ig.Entity.seperateOnXAxis(a, b, weak);
            } else {
                ig.Entity.seperateOnXAxis(b, a, weak);
            }
            a.collideWith(b, 'x');
            b.collideWith(a, 'x');
        }
    };
    ig.Entity.seperateOnXAxis = function (left, right, weak) {
        var nudge = (left.pos.x + left.size.x - right.pos.x);
        if (weak) {
            var strong = left === weak ? right : left;
            weak.vel.x = -weak.vel.x * weak.bounciness + strong.vel.x;
            var resWeak = ig.game.collisionMap.trace(weak.pos.x, weak.pos.y, weak == left ? -nudge : nudge, 0, weak.size.x, weak.size.y);
            weak.pos.x = resWeak.pos.x;
        } else {
            var v2 = (left.vel.x - right.vel.x) / 2;
            left.vel.x = -v2;
            right.vel.x = v2;
            var resLeft = ig.game.collisionMap.trace(left.pos.x, left.pos.y, -nudge / 2, 0, left.size.x, left.size.y);
            left.pos.x = resLeft.pos.x.floor();
            var resRight = ig.game.collisionMap.trace(right.pos.x, right.pos.y, nudge / 2, 0, right.size.x, right.size.y);
            right.pos.x = resRight.pos.x.ceil();
        }
    };
    ig.Entity.seperateOnYAxis = function (top, bottom, weak) {
        var nudge = (top.pos.y + top.size.y - bottom.pos.y);
        if (weak) {
            var strong = top === weak ? bottom : top;
            weak.vel.y = -weak.vel.y * weak.bounciness + strong.vel.y;
            var nudgeX = 0;
            if (weak == top && Math.abs(weak.vel.y - strong.vel.y) < weak.minBounceVelocity) {
                weak.standing = true;
                nudgeX = strong.vel.x * ig.system.tick;
            }
            var resWeak = ig.game.collisionMap.trace(weak.pos.x, weak.pos.y, nudgeX, weak == top ? -nudge : nudge, weak.size.x, weak.size.y);
            weak.pos.y = resWeak.pos.y;
            weak.pos.x = resWeak.pos.x;
        } else if (ig.game.gravity && (bottom.standing || top.vel.y > 0)) {
            var resTop = ig.game.collisionMap.trace(top.pos.x, top.pos.y, 0, -(top.pos.y + top.size.y - bottom.pos.y), top.size.x, top.size.y);
            top.pos.y = resTop.pos.y;
            if (top.bounciness > 0 && top.vel.y > top.minBounceVelocity) {
                top.vel.y *= -top.bounciness;
            } else {
                top.standing = true;
                top.vel.y = 0;
            }
        } else {
            var v2 = (top.vel.y - bottom.vel.y) / 2;
            top.vel.y = -v2;
            bottom.vel.y = v2;
            var nudgeX = bottom.vel.x * ig.system.tick;
            var resTop = ig.game.collisionMap.trace(top.pos.x, top.pos.y, nudgeX, -nudge / 2, top.size.x, top.size.y);
            top.pos.y = resTop.pos.y;
            var resBottom = ig.game.collisionMap.trace(bottom.pos.x, bottom.pos.y, 0, nudge / 2, bottom.size.x, bottom.size.y);
            bottom.pos.y = resBottom.pos.y;
        }
    };
});

// lib/impact/map.js
ig.baked = true;
ig.module('impact.map').defines(function () {
    ig.Map = ig.Class.extend({
        tilesize: 8,
        width: 1,
        height: 1,
        data: [
            []
        ],
        init: function (tilesize, data) {
            this.tilesize = tilesize;
            this.data = data;
            this.height = data.length;
            this.width = data[0].length;
        },
        getTile: function (x, y) {
            var tx = (x / this.tilesize).floor();
            var ty = (y / this.tilesize).floor();
            if ((tx >= 0 && tx < this.width) && (ty >= 0 && ty < this.height)) {
                return this.data[ty][tx];
            } else {
                return 0;
            }
        },
        setTile: function (x, y, tile) {
            var tx = (x / this.tilesize).floor();
            var ty = (y / this.tilesize).floor();
            if ((tx >= 0 && tx < this.width) && (ty >= 0 && ty < this.height)) {
                this.data[ty][tx] = tile;
            }
        },
    });
});

// lib/impact/collision-map.js
ig.baked = true;
ig.module('impact.collision-map').requires('impact.map').defines(function () {
    ig.CollisionMap = ig.Map.extend({
        firstSolidTile: 1,
        lastSolidTile: 255,
        init: function (tilesize, data) {
            this.parent(tilesize, data);
        },
        trace: function (x, y, vx, vy, objectWidth, objectHeight) {
            var res = {
                collision: {
                    x: false,
                    y: false
                },
                pos: {
                    x: x,
                    y: y
                },
                tile: {
                    x: 0,
                    y: 0
                }
            };
            var steps = (Math.max(Math.abs(vx), Math.abs(vy)) / this.tilesize).ceil();
            if (steps > 1) {
                var sx = vx / steps;
                var sy = vy / steps;
                for (var i = 0; i < steps && (sx || sy); i++) {
                    this._traceStep(res, x, y, sx, sy, objectWidth, objectHeight);
                    x = res.pos.x;
                    y = res.pos.y;
                    if (res.collision.x) {
                        sx = 0;
                    }
                    if (res.collision.y) {
                        sy = 0;
                    }
                }
            } else {
                this._traceStep(res, x, y, vx, vy, objectWidth, objectHeight);
            }
            return res;
        },
        _traceStep: function (res, x, y, vx, vy, width, height) {
            res.pos.x += vx;
            res.pos.y += vy;
            if (vx) {
                var pxOffsetX = (vx > 0 ? width : 0);
                var tileOffsetX = (vx < 0 ? this.tilesize : 0);
                var firstTileY = (y / this.tilesize).floor();
                var lastTileY = ((y + height) / this.tilesize).ceil();
                var tileX = ((x + vx + pxOffsetX) / this.tilesize).floor();
                if (lastTileY >= 0 && firstTileY < this.height && tileX >= 0 && tileX < this.width) {
                    for (var tileY = firstTileY; tileY < lastTileY; tileY++) {
                        var t = this.data[tileY] && this.data[tileY][tileX];
                        if (t >= this.firstSolidTile && t <= this.lastSolidTile) {
                            res.collision.x = true;
                            res.tile.x = t;
                            res.pos.x = tileX * this.tilesize - pxOffsetX + tileOffsetX;
                            break;
                        }
                    }
                }
            }
            if (vy) {
                var pxOffsetY = (vy > 0 ? height : 0);
                var tileOffsetY = (vy < 0 ? this.tilesize : 0);
                var firstTileX = (res.pos.x / this.tilesize).floor();
                var lastTileX = ((res.pos.x + width) / this.tilesize).ceil();
                var tileY = ((y + vy + pxOffsetY) / this.tilesize).floor();
                if (lastTileX >= 0 && firstTileX < this.width && tileY >= 0 && tileY < this.height) {
                    for (var tileX = firstTileX; tileX < lastTileX; tileX++) {
                        var t = this.data[tileY] && this.data[tileY][tileX];
                        if (t >= this.firstSolidTile && t <= this.lastSolidTile) {
                            res.collision.y = true;
                            res.tile.y = t;
                            res.pos.y = tileY * this.tilesize - pxOffsetY + tileOffsetY;
                            break;
                        }
                    }
                }
            }
        }
    });
    ig.CollisionMap.staticNoCollision = {
        trace: function (x, y, vx, vy) {
            return {
                collision: {
                    x: false,
                    y: false
                },
                pos: {
                    x: x + vx,
                    y: y + vy
                },
                tile: {
                    x: 0,
                    y: 0
                }
            };
        }
    };
});

// lib/impact/background-map.js
ig.baked = true;
ig.module('impact.background-map').requires('impact.map', 'impact.image').defines(function () {
    ig.BackgroundMap = ig.Map.extend({
        tiles: null,
        scroll: {
            x: 0,
            y: 0
        },
        distance: 1,
        repeat: false,
        tilesetName: '',
        preRender: false,
        preRenderedChunks: null,
        chunkSize: 512,
        debugChunks: false,
        anims: {},
        init: function (tilesize, data, tileset) {
            this.parent(tilesize, data);
            this.setTileset(tileset);
        },
        setTileset: function (tileset) {
            this.tilesetName = tileset instanceof ig.Image ? tileset.path : tileset;
            this.tiles = new ig.Image(this.tilesetName);
            this.preRenderedChunks = null;
        },
        setScreenPos: function (x, y) {
            this.scroll.x = x / this.distance;
            this.scroll.y = y / this.distance;
        },
        preRenderMapToChunks: function () {
            var totalWidth = this.width * this.tilesize * ig.system.scale,
                totalHeight = this.height * this.tilesize * ig.system.scale;
            var chunkCols = (totalWidth / this.chunkSize).ceil(),
                chunkRows = (totalHeight / this.chunkSize).ceil();
            this.preRenderedChunks = [];
            for (var y = 0; y < chunkRows; y++) {
                this.preRenderedChunks[y] = [];
                for (var x = 0; x < chunkCols; x++) {
                    var chunkWidth = (x == chunkCols - 1) ? totalWidth - x * this.chunkSize : this.chunkSize;
                    var chunkHeight = (y == chunkRows - 1) ? totalHeight - y * this.chunkSize : this.chunkSize;
                    this.preRenderedChunks[y][x] = this.preRenderChunk(x, y, chunkWidth, chunkHeight);
                }
            }
        },
        preRenderChunk: function (cx, cy, w, h) {
            var tw = w / this.tilesize / ig.system.scale + 1;
            th = h / this.tilesize / ig.system.scale + 1;
            var nx = (cx * this.chunkSize / ig.system.scale) % this.tilesize,
                ny = (cy * this.chunkSize / ig.system.scale) % this.tilesize;
            var tx = (cx * this.chunkSize / this.tilesize / ig.system.scale).floor(),
                ty = (cy * this.chunkSize / this.tilesize / ig.system.scale).floor();
            var chunk = ig.$new('canvas');
            chunk.width = w;
            chunk.height = h;
            var oldContext = ig.system.context;
            ig.system.context = chunk.getContext("2d");
            for (var x = 0; x < tw; x++) {
                for (var y = 0; y < th; y++) {
                    if (x + tx < this.width && y + ty < this.height) {
                        var tile = this.data[y + ty][x + tx];
                        if (tile) {
                            this.tiles.drawTile(x * this.tilesize - nx, y * this.tilesize - ny, tile - 1, this.tilesize);
                        }
                    }
                }
            }
            ig.system.context = oldContext;
            return chunk;
        },
        draw: function () {
            if (!this.tiles.loaded) {
                return;
            }
            if (this.preRender) {
                this.drawPreRendered();
            } else {
                this.drawTiled();
            }
        },
        drawPreRendered: function () {
            if (!this.preRenderedChunks) {
                this.preRenderMapToChunks();
            }
            var dx = ig.system.getDrawPos(this.scroll.x),
                dy = ig.system.getDrawPos(this.scroll.y);
            if (this.repeat) {
                dx %= this.width * this.tilesize * ig.system.scale;
                dy %= this.height * this.tilesize * ig.system.scale;
            }
            var minChunkX = Math.max((dx / this.chunkSize).floor(), 0),
                minChunkY = Math.max((dy / this.chunkSize).floor(), 0),
                maxChunkX = ((dx + ig.system.realWidth) / this.chunkSize).ceil(),
                maxChunkY = ((dy + ig.system.realHeight) / this.chunkSize).ceil(),
                maxRealChunkX = this.preRenderedChunks[0].length,
                maxRealChunkY = this.preRenderedChunks.length;
            if (!this.repeat) {
                maxChunkX = Math.min(maxChunkX, maxRealChunkX);
                maxChunkY = Math.min(maxChunkY, maxRealChunkY);
            }
            var nudgeY = 0;
            for (var cy = minChunkY; cy < maxChunkY; cy++) {
                var nudgeX = 0;
                for (var cx = minChunkX; cx < maxChunkX; cx++) {
                    var chunk = this.preRenderedChunks[cy % maxRealChunkY][cx % maxRealChunkX];
                    var x = -dx + cx * this.chunkSize - nudgeX;
                    var y = -dy + cy * this.chunkSize - nudgeY;
                    ig.system.context.drawImage(chunk, x, y);
                    if (this.debugChunks) {
                        ig.system.context.strokeStyle = '#f0f';
                        ig.system.context.strokeRect(x, y, this.chunkSize, this.chunkSize);
                    }
                    if (this.repeat && chunk.width < this.chunkSize && x + chunk.width < ig.system.realWidth) {
                        nudgeX = this.chunkSize - chunk.width;
                        maxChunkX++;
                    }
                }
                if (this.repeat && chunk.height < this.chunkSize && y + chunk.height < ig.system.realHeight) {
                    nudgeY = this.chunkSize - chunk.height;
                    maxChunkY++;
                }
            }
        },
        drawTiled: function () {
            var tile = 0,
                anim = null,
                tileOffsetX = (this.scroll.x / this.tilesize).toInt(),
                tileOffsetY = (this.scroll.y / this.tilesize).toInt(),
                pxOffsetX = this.scroll.x % this.tilesize,
                pxOffsetY = this.scroll.y % this.tilesize,
                pxMinX = -pxOffsetX - this.tilesize,
                pxMinY = -pxOffsetY - this.tilesize,
                pxMaxX = ig.system.width + this.tilesize - pxOffsetX,
                pxMaxY = ig.system.height + this.tilesize - pxOffsetY;
            for (var mapY = -1, pxY = pxMinY; pxY < pxMaxY; mapY++, pxY += this.tilesize) {
                var tileY = mapY + tileOffsetY;
                if (tileY >= this.height || tileY < 0) {
                    if (!this.repeat) {
                        continue;
                    }
                    tileY = tileY > 0 ? tileY % this.height : ((tileY + 1) % this.height) + this.height - 1;
                }
                for (var mapX = -1, pxX = pxMinX; pxX < pxMaxX; mapX++, pxX += this.tilesize) {
                    var tileX = mapX + tileOffsetX;
                    if (tileX >= this.width || tileX < 0) {
                        if (!this.repeat) {
                            continue;
                        }
                        tileX = tileX > 0 ? tileX % this.width : ((tileX + 1) % this.width) + this.width - 1;
                    }
                    if ((tile = this.data[tileY][tileX])) {
                        if ((anim = this.anims[tile - 1])) {
                            anim.draw(pxX, pxY);
                        } else {
                            this.tiles.drawTile(pxX, pxY, tile - 1, this.tilesize);
                        }
                    }
                }
            }
        }
    });
});

// lib/impact/game.js
ig.baked = true;
ig.module('impact.game').requires('impact.impact', 'impact.entity', 'impact.collision-map', 'impact.background-map').defines(function () {
    ig.Game = ig.Class.extend({
        clearColor: '#000000',
        gravity: 0,
        screen: {
            x: 0,
            y: 0
        },
        entities: [],
        namedEntities: {},
        collisionMap: ig.CollisionMap.staticNoCollision,
        backgroundMaps: [],
        backgroundAnims: {},
        cellSize: 64,
        loadLevel: function (data) {
            this.screen = {
                x: 0,
                y: 0
            };
            this.entities = [];
            this.namedEntities = {};
            for (var i = 0; i < data.entities.length; i++) {
                var ent = data.entities[i];
                this.spawnEntity(ent.type, ent.x, ent.y, ent.settings);
            }
            this.sortEntities();
            this.collisionMap = null;
            this.backgroundMaps = [];
            for (var i = 0; i < data.layer.length; i++) {
                var ld = data.layer[i];
                if (ld.name == 'collision') {
                    this.collisionMap = new ig.CollisionMap(ld.tilesize, ld.data);
                } else {
                    var newMap = new ig.BackgroundMap(ld.tilesize, ld.data, ld.tilesetName);
                    newMap.anims = this.backgroundAnims[ld.tilesetName] || {};
                    newMap.repeat = ld.repeat;
                    newMap.distance = ld.distance;
                    this.backgroundMaps.push(newMap);
                }
            }
        },
        getEntityByName: function (name) {
            return this.namedEntities[name];
        },
        getEntitiesByType: function (type) {
            var entityClass = typeof(type) === 'string' ? ig.global[type] : type;
            var a = [];
            for (var i = 0; i < this.entities.length; i++) {
                if (this.entities[i] instanceof entityClass) {
                    a.push(this.entities[i]);
                }
            }
            return a;
        },
        spawnEntity: function (type, x, y, settings) {
            var entityClass = typeof(type) === 'string' ? ig.global[type] : type;
            if (!entityClass) {
                throw ("Can't spawn entity of type " + type);
            }
            var ent = new(entityClass)(x, y, settings || {});
            this.entities.unshift(ent);
            if (ent.name) {
                this.namedEntities[ent.name] = ent;
            }
            return ent;
        },
        sortEntities: function () {
            this.entities.sort(function (a, b) {
                return a.zIndex - b.zIndex;
            });
        },
        removeEntity: function (ent) {
            if (ent.name) {
                delete this.namedEntities[ent.name];
            }
            this.entities.erase(ent);
        },
        run: function () {
            this.update();
            this.draw();
        },
        update: function () {
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].update();
            }
            this.checkEntities();
            for (var tileset in this.backgroundAnims) {
                var anims = this.backgroundAnims[tileset];
                for (var a in anims) {
                    anims[a].update();
                }
            }
            for (var i = 0; i < this.backgroundMaps.length; i++) {
                this.backgroundMaps[i].setScreenPos(this.screen.x, this.screen.y);
            }
        },
        draw: function () {
            ig.system.clear(this.clearColor);
            for (var i = 0; i < this.backgroundMaps.length; i++) {
                this.backgroundMaps[i].draw();
            }
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].draw();
            }
        },
        checkEntities: function () {
            var hash = {};
            for (var e = 0; e < this.entities.length; e++) {
                var entity = this.entities[e];
                if (e.type == ig.Entity.TYPE.NONE && e.checkAgainst == ig.Entity.TYPE.NONE && e.collides == ig.Entity.COLLIDES.NEVER) {
                    continue;
                }
                var checked = {},
                    xmin = (entity.pos.x / this.cellSize).floor(),
                    ymin = (entity.pos.y / this.cellSize).floor(),
                    xmax = ((entity.pos.x + entity.size.x) / this.cellSize).floor() + 1,
                    ymax = ((entity.pos.y + entity.size.y) / this.cellSize).floor() + 1;
                for (var x = xmin; x < xmax; x++) {
                    for (var y = ymin; y < ymax; y++) {
                        if (!hash[x]) {
                            hash[x] = {};
                            hash[x][y] = [entity];
                        } else if (!hash[x][y]) {
                            hash[x][y] = [entity];
                        } else {
                            var cell = hash[x][y];
                            for (var c = 0; c < cell.length; c++) {
                                if (entity.touches(cell[c]) && !checked[cell[c].id]) {
                                    checked[cell[c].id] = true;
                                    ig.Entity.checkPair(entity, cell[c]);
                                }
                            }
                            cell.push(entity);
                        }
                    }
                }
            }
        }
    });
});

// lib/game/entities/particle.js
ig.baked = true;
ig.module('game.entities.particle').requires('impact.entity').defines(function () {
    EntityParticle = ig.Entity.extend({
        size: {
            x: 4,
            y: 4
        },
        offset: {
            x: 0,
            y: 0
        },
        maxVel: {
            x: 160,
            y: 160
        },
        minBounceVelocity: 0,
        type: ig.Entity.TYPE.NONE,
        checkAgainst: ig.Entity.TYPE.NONE,
        collides: ig.Entity.COLLIDES.LITE,
        lifetime: 5,
        fadetime: 1,
        bounciness: 0.6,
        friction: {
            x: 20,
            y: 0
        },
        init: function (x, y, settings) {
            this.parent(x, y, settings);
            this.vel.x = (Math.random() * 2 - 1) * this.vel.x;
            this.vel.y = (Math.random() * 2 - 1) * this.vel.y;
            this.currentAnim.flip.x = (Math.random() > 0.5);
            this.currentAnim.flip.y = (Math.random() > 0.5);
            this.currentAnim.gotoRandomFrame();
            this.idleTimer = new ig.Timer();
        },
        update: function () {
            if (this.idleTimer.delta() > this.lifetime) {
                this.kill();
                return;
            }
            this.currentAnim.alpha = this.idleTimer.delta().map(this.lifetime - this.fadetime, this.lifetime, 1, 0);
            this.parent();
        }
    });
});

// lib/game/words.js
ig.baked = true;
ig.module('game.words').defines(function () {
    WORDS = {};
});

// lib/game/entities/enemy.js
ig.baked = true;
ig.module('game.entities.enemy').requires('impact.entity', 'impact.font', 'game.words', 'game.entities.particle').defines(function () {
    EntityEnemy = ig.Entity.extend({
	entry: null,
        word: 'none',
        remainingWord: 'none',
        health: 8,
        currentLetter: 0,
        targeted: false,
        font: new ig.Font('media/fonts/tungsten-18.png'),
        fontActive: new ig.Font('media/fonts/tungsten-18-orange.png'),
        speed: 10,
        friction: {
            x: 100,
            y: 100
        },
        hitTimer: null,
        dead: false,
        angle: 0,
        soundHit: new ig.Sound('media/sounds/hit.ogg'),
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.A,
        init: function (x, y, settings) {
            this.parent(x, y, settings);
            this.entry = this.getWordWithLength(this.health);
	    this.word = this.entry[1];
            this.remainingWord = this.word;
            this.hitTimer = new ig.Timer(0);
            this.dieTimer = new ig.Timer(0);
            ig.game.registerTarget(this.word.charAt(0), this);
            this.angle = this.angleTo(ig.game.player);
        },
        getWordWithLength: function (l) {
	    var w = null;
	    var entry = null;
	    do {
		var len = Math.floor(Math.random()*l);
		var pos = WORDS[len];
		if (pos) {
		    entry = pos.random();
		    w = entry[1];
		}
	    } while (!w || ig.game.targets[w.charAt(0)].length);
	    this.health = w.length;
	    return entry;
        },
        target: function () {
            this.targeted = true;
            ig.game.currentTarget = this;
            ig.game.unregisterTarget(this.word.charAt(0), this);
            ig.game.entities.erase(this);
            ig.game.entities.push(this);
        },
        draw: function () {
            ig.system.context.globalCompositeOperation = 'lighter';
            this.parent();
            ig.system.context.globalCompositeOperation = 'source-over';
        },
        drawLabel: function () {
            if (!this.remainingWord.length) {
                return;
            }
            var w = this.font.widthForString(this.word);
            var x = (this.pos.x + 9).limit(w + 3, ig.system.width - 1);
            var y = (this.pos.y + this.size.y - 2).limit(2, ig.system.height - 19);
            var bx = ig.system.getDrawPos(x - w - 2);
            var by = ig.system.getDrawPos(y - 1);
            if (this.targeted) {
		ig.system.context.fillStyle = 'red';
		ig.system.context.font = "bold 20px sans-serif";
	    } else {
		ig.system.context.fillStyle = 'black';
		ig.system.context.font = "20px sans-serif";
	    }
	    ig.system.context.textAlign = 'right';
	    ig.system.context.fillText(this.entry[0], x, y);
        },
        kill: function () {
            ig.game.unregisterTarget(this.word.charAt(0), this);
            if (ig.game.currentTarget == this) {
                ig.game.currentTarget = null;
            }
            this.parent();
        },
        update: function () {
            if (this.hitTimer.delta() > 0) {
                this.vel.x = Math.cos(this.angle) * this.speed;
                this.vel.y = Math.sin(this.angle) * this.speed;
            }
            this.parent();
            if (this.pos.x < -this.animSheet.width || this.pos.x > ig.system.width + 10 || this.pos.y > ig.system.height + 10 || this.pos.y < -this.animSheet.height - 30) {
                this.kill();
            }
        },
        hit: function () {
            var numParticles = this.health <= 1 ? 10 : 4;
            for (var i = 0; i < numParticles; i++) {
                ig.game.spawnEntity(EntityExplosionParticle, this.pos.x, this.pos.y);
            }
            this.vel.x = -Math.cos(this.angle) * 20;
            this.vel.y = -Math.sin(this.angle) * 20;
            this.hitTimer.set(0.3);
            this.receiveDamage(1);
            ig.game.lastKillTimer.set(0.3);
            this.soundHit.play();
        },
        isHitBy: function (letter) {
            if (this.remainingWord.charAt(0) == letter) {
                this.remainingWord = this.remainingWord.substr(1);
                if (this.remainingWord.length == 0) {
                    ig.game.currentTarget = null;
                    ig.game.unregisterTarget(this.word.charAt(0), this);
                    this.dead = true;
                }
                return true;
            } else {
                return false;
            }
        },
        check: function (other) {
            other.kill();
            this.kill();
        }
    });
    EntityExplosionParticle = EntityParticle.extend({
        lifetime: 0.5,
        fadetime: 0.5,
        vel: {
            x: 60,
            y: 60
        },
        animSheet: new ig.AnimationSheet('media/sprites/explosion.png', 32, 32),
        init: function (x, y, settings) {
            this.addAnim('idle', 5, [0, 1, 2]);
            this.parent(x, y, settings);
        },
        draw: function () {
            ig.system.context.globalCompositeOperation = 'lighter';
            this.parent();
            ig.system.context.globalCompositeOperation = 'source-over';
        },
        update: function () {
            this.currentAnim.angle += 0.1 * ig.system.tick;
            this.parent();
        }
    });
});

// lib/game/entities/enemy-missle.js
ig.baked = true;
ig.module('game.entities.enemy-missle').requires('game.entities.enemy').defines(function () {
    EntityEnemyMissle = EntityEnemy.extend({
        size: {
            x: 8,
            y: 15
        },
        offset: {
            x: 6,
            y: 7
        },
        animSheet: new ig.AnimationSheet('media/sprites/missle.png', 20, 26),
        health: 4,
        speed: 35,
        targetTimer: null,
        init: function (x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('idle', 1, [0]);
            this.angle = settings.angle;
            this.currentAnim.angle = this.angle - Math.PI / 2;
            this.targetTimer = new ig.Timer(1);
        },
        update: function () {
            var d = this.targetTimer.delta();
            if (d > 0 && d < 0.7) {
                var ad = this.angle - this.angleTo(ig.game.player);
                this.angle -= ad * ig.system.tick * 2;
                this.currentAnim.angle = this.angle - Math.PI / 2;
            }
            this.parent();
        }
    });
});

// lib/game/entities/enemy-mine.js
ig.baked = true;
ig.module('game.entities.enemy-mine').requires('game.entities.enemy').defines(function () {
    EntityEnemyMine = EntityEnemy.extend({
        size: {
            x: 12,
            y: 12
        },
        offset: {
            x: 10,
            y: 10
        },
        animSheet: new ig.AnimationSheet('media/sprites/mine.png', 32, 32),
        speed: 30,
        health: 6,
        init: function (x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('idle', 1, [0]);
        },
        update: function () {
            this.angle = this.angleTo(ig.game.player);
            this.parent();
            this.currentAnim.angle += 2 * ig.system.tick;
        }
    });
});

// lib/game/entities/enemy-destroyer.js
ig.baked = true;
ig.module('game.entities.enemy-destroyer').requires('game.entities.enemy').defines(function () {
    EntityEnemyDestroyer = EntityEnemy.extend({
        size: {
            x: 24,
            y: 34
        },
        offset: {
            x: 10,
            y: 8
        },
        animSheet: new ig.AnimationSheet('media/sprites/destroyer.png', 43, 58),
        health: 8,
        speed: 20,
        shootTimer: null,
        init: function (x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('idle', 1, [0]);
            this.shootTimer = new ig.Timer(5);
            this.angle = (Math.random().map(0, 1, 67, 90) + (this.pos.x > ig.system.width / 2 ? 22.5 : 0)) * Math.PI / 180;
            this.currentAnim.angle = this.angle - Math.PI / 2;
        },
        update: function () {
            this.parent();
            if (this.shootTimer.delta() > 0) {
                this.shootTimer.reset();
                ig.game.spawnEntity(EntityEnemyMissle, this.pos.x + 12, this.pos.y + 22, {
                    angle: this.angle
                });
            }
        }
    });
});

// lib/game/entities/enemy-oppressor.js
ig.baked = true;
ig.module('game.entities.enemy-oppressor').requires('game.entities.enemy').defines(function () {
    EntityEnemyOppressor = EntityEnemy.extend({
        size: {
            x: 36,
            y: 58
        },
        offset: {
            x: 16,
            y: 10
        },
        animSheet: new ig.AnimationSheet('media/sprites/oppressor.png', 68, 88),
        health: 10,
        speed: 15,
        shootTimer: null,
        bullets: 16,
        init: function (x, y, settings) {
            this.parent(x, y - 18, settings);
            this.addAnim('idle', 1, [0]);
            this.shootTimer = new ig.Timer(7);
            this.angle = Math.PI / 2;
        },
        update: function () {
            this.parent();
            if (this.shootTimer.delta() > 0) {
                var inc = 140 / (this.bullets - 1);
                var a = 20;
                var radius = 21;
                for (var i = 0; i < this.bullets; i++) {
                    var angle = a * Math.PI / 180;
                    var x = this.pos.x + 18 + Math.cos(angle) * radius;
                    var y = this.pos.y + 48 + Math.sin(angle) * radius;
                    ig.game.spawnEntity(EntityEnemyBullet, x, y, {
                        angle: angle
                    });
                    a += inc;
                }
                this.shootTimer.reset();
            }
        }
    });
    EntityEnemyBullet = EntityEnemy.extend({
        size: {
            x: 2,
            y: 2
        },
        offset: {
            x: 8,
            y: 11
        },
        animSheet: new ig.AnimationSheet('media/sprites/bullet.png', 20, 24),
        health: 1,
        speed: 50,
        init: function (x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('idle', 1, [0]);
            this.angle = settings.angle;
            this.currentAnim.angle = this.angle - Math.PI / 2;
        }
    });
});

// lib/game/entities/player.js
ig.baked = true;
ig.module('game.entities.player').requires('impact.entity', 'game.entities.particle').defines(function () {
    EntityPlayer = ig.Entity.extend({
        animSheet: new ig.AnimationSheet('media/sprites/ship.png', 24, 24),
        targetAngle: 0,
        size: {
            x: 8,
            y: 8
        },
        offset: {
            x: 8,
            y: 8
        },
        angle: 0,
        targetAngle: 0,
        soundShoot: new ig.Sound('media/sounds/plasma.ogg'),
        soundMiss: new ig.Sound('media/sounds/click.ogg'),
        soundExplode: new ig.Sound('media/sounds/explosion.ogg'),
        type: ig.Entity.TYPE.A,
        init: function (x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('idle', 60, [0]);
            this.addAnim('shoot', 0.05, [3, 2, 1, 0], true);
            this.addAnim('miss', 0.05, [4, 5, 6], true);
        },
        draw: function () {
            ig.system.context.globalCompositeOperation = 'lighter';
            this.parent();
            ig.system.context.globalCompositeOperation = 'source-over';
        },
        update: function () {
            if (this.currentAnim.loopCount > 0) {
                this.currentAnim = this.anims.idle;
            }
            var ad = this.angle - this.targetAngle;
            if (Math.abs(ad) < 0.02) {
                this.angle = this.targetAngle;
            } else {
                this.angle -= ad * ig.system.tick * 10;
            }
            this.currentAnim.angle = this.angle;
            this.parent();
        },
        kill: function () {
            ig.game.setGameOver();
            this.soundExplode.play();
            for (var i = 0; i < 50; i++) {
                ig.game.spawnEntity(EntityExplosionParticleFast, this.pos.x, this.pos.y);
            }
            this.pos.y = ig.system.height + 300;
            this.parent();
        },
        shoot: function (target) {
            this.currentAnim = this.anims.shoot.rewind();
            var ent = ig.game.spawnEntity(EntityPlasma, this.pos.x + 6, this.pos.y + 4);
            ent.target = target;
            var angle = this.angleTo(target);
            this.targetAngle = angle + Math.PI / 2;
            this.soundShoot.play();
        },
        miss: function () {
            this.currentAnim = this.anims.miss.rewind();
            this.soundMiss.play();
        }
    });
    EntityPlasma = ig.Entity.extend({
        speed: 800,
        maxVel: {
            x: 1000,
            y: 1000
        },
        animSheet: new ig.AnimationSheet('media/sprites/plasma.png', 96, 96),
        size: {
            x: 4,
            y: 4
        },
        offset: {
            x: 46,
            y: 46
        },
        distance: 100000,
        init: function (x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('idle', 1, [0]);
        },
        draw: function () {
            ig.system.context.globalCompositeOperation = 'lighter';
            this.parent();
            ig.system.context.globalCompositeOperation = 'source-over';
        },
        update: function () {
            if (this.target) {
                var currentDistance = this.distanceTo(this.target);
                if (currentDistance > this.distance || currentDistance < this.target.size.y) {
                    this.target.hit();
                    this.kill();
                    return;
                } else {
                    var angle = this.angleTo(this.target);
                    this.currentAnim.angle = angle + Math.PI / 2;
                    this.vel.x = Math.cos(angle) * this.speed;
                    this.vel.y = Math.sin(angle) * this.speed;
                }
                this.distance = currentDistance;
                this.parent();
            } else {
                this.kill();
            }
        }
    });
    EntityExplosionParticleFast = EntityParticle.extend({
        lifetime: 2,
        fadetime: 2,
        maxVel: {
            x: 1000,
            y: 1000
        },
        vel: {
            x: 100,
            y: 100
        },
        animSheet: new ig.AnimationSheet('media/sprites/explosion.png', 32, 32),
        init: function (x, y, settings) {
            this.addAnim('idle', 5, [0, 1, 2]);
            this.parent(x, y, settings);
        },
        draw: function () {
            ig.system.context.globalCompositeOperation = 'lighter';
            this.parent();
            ig.system.context.globalCompositeOperation = 'source-over';
        },
        update: function () {
            this.currentAnim.angle += 0.1 * ig.system.tick;
            this.parent();
        }
    });
});

// lib/game/main.js
var dicts = [["Hiragana", "dicts.hira"], ["Katakana", "dicts.kana"], ["JMDict", "dicts.JMdict"]];
var current_dict = 0;

ig.baked = true;
ig.module('game.main').requires('impact.game', 'impact.font', 'game.entities.enemy-missle', 'game.entities.enemy-mine', 'game.entities.enemy-destroyer', 'game.entities.enemy-oppressor', 'game.entities.player', 'dicts.hira').defines(function () {
    Number.zeroes = '000000000000';
    Number.prototype.zeroFill = function (d) {
        var s = this.toString();
        return Number.zeroes.substr(0, d - s.length) + s;
    };
    ZType = ig.Game.extend({
        font: new ig.Font('media/fonts/tungsten-18.png'),
        fontScore: new ig.Font('media/fonts/04b03-mono-digits.png'),
        fontTitle: new ig.Font('media/fonts/tungsten-48.png'),
        spawnTimer: null,
        targets: {},
        currentTarget: null,
        yScroll: 0,
        backdrop: new ig.Image('media/background/backdrop.png'),
        grid: new ig.Image('media/background/grid.png'),
        music: new ig.Sound('media/music/endure.ogg', false),
        menu: null,
        mode: 0,
        score: 0,
        streak: 0,
        hits: 0,
        misses: 0,
        multiplier: 1,
        multiplierTiers: {
            25: true,
            50: true,
            100: true
        },
        wave: {},
        init: function () {
            var bgmap = new ig.BackgroundMap(62, [
                [1]
            ], this.grid);
            bgmap.repeat = true;
            this.backgroundMaps.push(bgmap);
            ig.music.add(this.music);
            window.addEventListener('keydown', this.keydown.bind(this), false);
            ig.input.bind(ig.KEY.ENTER, 'ok');
            ig.input.bind(ig.KEY.BACKSPACE, 'void');
            ig.input.bind(ig.KEY.ESC, 'menu');
            ig.input.bind(ig.KEY.UP_ARROW, 'up');
            ig.input.bind(ig.KEY.DOWN_ARROW, 'down');
            ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
            ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
            this.setTitle();
        },
        reset: function () {
            this.entities = [];
            this.currentTarget = null;
            this.wave = {
                wave: 0,
                spawn: [],
                spawnWait: 1,
                healthBoost: 0,
                types: [{
                    type: EntityEnemyOppressor,
                    count: 0,
                    incEvery: 13
                },
                {
                    type: EntityEnemyDestroyer,
                    count: 0,
                    incEvery: 5
                },
                {
                    type: EntityEnemyMine,
                    count: 3,
                    incEvery: 2
                }]
            };
            var first = 'a'.charCodeAt(0),
                last = 'z'.charCodeAt(0);
            for (var i = first; i <= last; i++) {
                this.targets[String.fromCharCode(i)] = [];
            }
            this.score = 0;
            this.streak = 0;
            this.hits = 0;
            this.misses = 0;
            this.multiplier = 1;
            this.multiplierTiers = {
                25: true,
                50: true,
                100: true
            };
            this.lastKillTimer = new ig.Timer();
            this.spawnTimer = new ig.Timer();
            this.waveEndTimer = null;
        },
        nextWave: function () {
            this.wave.wave++;
            this.wave.spawn = [];
            var dec = 0;
            for (var t = 0; t < this.wave.types.length; t++) {
                var type = this.wave.types[t];
                type.count -= dec;
                if (this.wave.wave % type.incEvery == 0) {
                    type.count++;
                    dec++;
                }
                for (var s = 0; s < type.count; s++) {
                    this.wave.spawn.push(t);
                }
            }
            this.wave.spawn.sort(function () {
                return Math.random() - 0.5;
            });
        },
        spawnCurrentWave: function () {
            if (!this.wave.spawn.length) {
                if (this.entities.length <= 1 && !this.waveEndTimer) {
                    this.waveEndTimer = new ig.Timer(2);
                } else if (this.waveEndTimer && this.waveEndTimer.delta() > 0) {
                    this.waveEndTimer = null;
                    this.nextWave();
                }
            } else if (this.spawnTimer.delta() > this.wave.spawnWait) {
                this.spawnTimer.reset();
                var type = this.wave.types[this.wave.spawn.pop()].type;
                var x = Math.random().map(0, 1, 10, ig.system.width - 10);
                var y = -30;
                this.spawnEntity(type, x, y, {
                    healthBoost: this.wave.healthBoost
                });
            }
        },
        registerTarget: function (letter, ent) {
            this.targets[letter].push(ent);
        },
        unregisterTarget: function (letter, ent) {
            this.targets[letter].erase(ent);
        },
        keydown: function (event) {
            if (event.target.type == 'text' || event.ctrlKey || event.shiftKey || event.altKey || this.mode != ZType.MODE.GAME || this.menu) {
                return true;
            }
            var c = event.which;
            if (!((c > 64 && c < 91) || (c > 96 && c < 123))) {
                return true;
            }
            event.stopPropagation();
            event.preventDefault();
            var letter = String.fromCharCode(c).toLowerCase();
            if (!this.currentTarget) {
                var potentialTargets = this.targets[letter];
                var nearestDistance = -1;
                var nearestTarget = null;
                for (var i = 0; i < potentialTargets.length; i++) {
                    var distance = this.player.distanceTo(potentialTargets[i]);
                    if (distance < nearestDistance || !nearestTarget) {
                        nearestDistance = distance;
                        nearestTarget = potentialTargets[i];
                    }
                }
                if (nearestTarget) {
                    nearestTarget.target();
                } else {
                    this.player.miss();
                    this.multiplier = 1;
                    this.streak = 0;
                    this.misses++;
                }
            }
            if (this.currentTarget) {
                var c = this.currentTarget;
                var hit = this.currentTarget.isHitBy(letter);
                if (hit) {
                    this.player.shoot(c);
                    this.score += this.multiplier;
                    this.hits++;
                    this.streak++;
                    if (this.multiplierTiers[this.streak]) {
                        this.multiplier += 1;
                    }
                } else {
                    this.player.miss();
                    this.multiplier = 1;
                    this.streak = 0;
                    this.misses++;
                }
            }
            return false;
        },
        setGame: function () {
            this.player = this.spawnEntity(EntityPlayer, ig.system.width / 2 - 4, ig.system.height - 50);
            this.mode = ZType.MODE.GAME;
            this.nextWave();
            ig.music.play();
        },
        setGameOver: function () {
            this.mode = ZType.MODE.GAME_OVER;
        },
        setTitle: function () {
            this.reset();
            this.mode = ZType.MODE.TITLE;
        },
        toggleMenu: function () {
            if (this.menu) {
                this.menu = null;
            } else {
                this.menu = new Menu();
            }
        },
        update: function () {
            if (ig.input.pressed('menu')) {
                this.toggleMenu();
            }
            if (this.menu) {
                this.menu.update();
                return;
            }
            this.parent();
            if (this.mode == ZType.MODE.GAME) {
                this.spawnCurrentWave();
            } else if (ig.input.pressed('ok')) {
                if (this.mode == ZType.MODE.TITLE) {
                    this.setGame();
                } else {
                    this.setTitle();
                }
            }
            this.yScroll -= 100 * ig.system.tick;
            this.backgroundMaps[0].scroll.y += this.yScroll;
        },
        draw: function () {
            this.backdrop.draw(0, 0);
            var d = this.lastKillTimer.delta();
            ig.system.context.globalAlpha = d < 0 ? d * -2 + 0.3 : 0.3;
            for (var i = 0; i < this.backgroundMaps.length; i++) {
                this.backgroundMaps[i].draw();
            }
            ig.system.context.globalAlpha = 1;
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].draw();
            }
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].drawLabel && this.entities[i].drawLabel();
            }
            if (this.mode == ZType.MODE.GAME) {
                this.drawUI();
            } else if (this.mode == ZType.MODE.TITLE) {
                this.drawTitle();
            } else if (this.mode == ZType.MODE.GAME_OVER) {
                this.drawGameOver();
            }
            if (this.menu) {
                this.menu.draw();
            }
        },
        drawUI: function () {
            var s = '(' + this.multiplier + 'x) ' + this.score.zeroFill(6);
            this.fontScore.draw(s, ig.system.width - 4, ig.system.height - 12, ig.Font.ALIGN.RIGHT);
            if (this.waveEndTimer) {
                var d = -this.waveEndTimer.delta();
                var a = d > 1.7 ? d.map(2, 1.7, 0, 1) : d < 1 ? d.map(1, 0, 1, 0) : 1;
                var xs = ig.system.width / 2;
                var ys = ig.system.height / 3 + (d < 1 ? Math.cos(1 - d).map(1, 0, 0, 250) : 0);
                var w = this.wave.wave.zeroFill(3);
                ig.system.context.globalAlpha = a;
                this.fontTitle.draw('Wave ' + w + ' Clear', xs, ys, ig.Font.ALIGN.CENTER);
                ig.system.context.globalAlpha = 1;
            }
        },
        drawTitle: function () {
            var xs = ig.system.width / 2;
            var ys = ig.system.height / 4;
            this.fontTitle.draw('Z-Type', xs, ys, ig.Font.ALIGN.CENTER);
            this.font.draw('Type to Shoot', xs, ys + 90, ig.Font.ALIGN.CENTER);
            this.font.draw('ESC: Menu/Pause', xs, ys + 160, ig.Font.ALIGN.CENTER);
            this.font.draw('ENTER: Start Game', xs, ys + 190, ig.Font.ALIGN.CENTER);
            var xc = 8;
            var yc = ig.system.height - 40;
            ig.system.context.globalAlpha = 0.6;
            this.font.draw('Gaijinization: Jay McCarthy and Marco Corradini', xc, yc - 20);
            this.font.draw('Concept, Graphics & Programming: Dominic Szablewski', xc, yc);
            this.font.draw('Music: Andreas Loesch', xc, yc + 20);
            ig.system.context.globalAlpha = 1;
        },
        drawGameOver: function () {
            var xs = ig.system.width / 2;
            var ys = ig.system.height / 4;
            var acc = this.hits ? this.hits / (this.hits + this.misses) * 100 : 0;
            this.fontTitle.draw('Game Over', xs, ys, ig.Font.ALIGN.CENTER);
            this.font.draw('Final Score: ' + this.score.zeroFill(6), xs - 58, ys + 90);
            this.font.draw('Accuracy: ' + acc.round(1) + '%', xs - 44, ys + 114);
            this.font.draw('Press ENTER to Continue', xs, ys + 190, ig.Font.ALIGN.CENTER);
        }
    });
    MenuItem = ig.Class.extend({
        getText: function () {
            return 'none'
        },
        left: function () {},
        right: function () {},
        ok: function () {}
    });
    MenuItemSoundVolume = MenuItem.extend({
        getText: function () {
            return 'Sound Volume: < ' + (ig.soundManager.volume * 100).round() + '% >';
        },
        left: function () {
            ig.soundManager.volume = (ig.soundManager.volume - 0.1).limit(0, 1);
        },
        right: function () {
            ig.soundManager.volume = (ig.soundManager.volume + 0.1).limit(0, 1);
        }
    });
    MenuItemMusicVolume = MenuItem.extend({
        getText: function () {
            return 'Music Volume: < ' + (ig.music.volume * 100).round() + '% >';
        },
        left: function () {
            ig.music.volume = (ig.music.volume - 0.1).limit(0, 1);
        },
        right: function () {
            ig.music.volume = (ig.music.volume + 0.1).limit(0, 1);
        }
    });
    MenuItemDictionary = MenuItem.extend({
        getText: function () {
            return 'Dictionary: < ' + dicts[current_dict][0] + ' >';
        },
        left: function () {
	    current_dict = Math.max(0, (current_dict-1));
	    this.update();
        },
        right: function () {
	    current_dict = Math.min((current_dict+1), (dicts.length)-1);
	    this.update();
        },
	update: function () {
	    window.ig._loadScript(dicts[current_dict][1], "game.main");
	},
    });
    MenuItemResume = MenuItem.extend({
        getText: function () {
            return 'Resume';
        },
        ok: function () {
            ig.game.toggleMenu();
        }
    });
    Menu = ig.Class.extend({
        font: new ig.Font('media/fonts/tungsten-18.png'),
        fontSelected: new ig.Font('media/fonts/tungsten-18-orange.png'),
        fontTitle: new ig.Font('media/fonts/tungsten-48.png'),
        current: 0,
        itemClasses: [MenuItemSoundVolume, MenuItemMusicVolume, MenuItemDictionary, MenuItemResume],
        items: [],
        init: function () {
            for (var i = 0; i < this.itemClasses.length; i++) {
                this.items.push(new this.itemClasses[i]());
            }
        },
        update: function () {
            if (ig.input.pressed('up')) {
                this.current--;
            }
            if (ig.input.pressed('down')) {
                this.current++;
            }
            this.current = this.current.limit(0, this.items.length - 1);
            if (ig.input.pressed('left')) {
                this.items[this.current].left();
            }
            if (ig.input.pressed('right')) {
                this.items[this.current].right();
            }
            if (ig.input.pressed('ok')) {
                this.items[this.current].ok();
            }
        },
        draw: function () {
            ig.system.context.fillStyle = 'rgba(0,0,0,0.9)';
            ig.system.context.fillRect(0, 0, ig.system.width, ig.system.height);
            var xs = ig.system.width / 2;
            var ys = ig.system.height / 4;
            this.fontTitle.draw('Menu', xs, ys, ig.Font.ALIGN.CENTER);
            ys += 160;
            for (var i = 0; i < this.items.length; i++) {
                var t = this.items[i].getText();
                if (i == this.current) {
                    this.fontSelected.draw(t, xs, ys, ig.Font.ALIGN.CENTER);
                } else {
                    this.font.draw(t, xs, ys, ig.Font.ALIGN.CENTER);
                }
                ys += 30;
            }
        }
    });
    ZType.MODE = {
        TITLE: 0,
        GAME: 1,
        GAME_OVER: 2
    };
    ig.main('#canvas', ZType, 60, 360, 640, 1);
});