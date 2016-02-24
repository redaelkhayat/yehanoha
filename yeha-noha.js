function YehaNoha(canvas, options){
	this.canvas = document.getElementById(canvas);
	if( undefined == this.canvas ){
		console.error('canvas element doesn\'t found, open the html file and add a <canvas /> element');
		return false;
	}
	this.construct(options);
}

YehaNoha.prototype = {
	construct: function(options){
		var self = this;

		self.options = extend(options, YehaNoha.__def);
		self.ctx = null;

		self.players = [];

		get_assets(YN._assets, function(d){
			self.assets = d;
			self.init();
		});
	},
	init: function(){
		var self = this;
		set(this.canvas, {
			width: this.options.col_x*this.options.col_size, height: this.options.col_y*this.options.col_size
		});
		this.canvas.style.background = '#ffdf92';

		this.ctx = this.canvas.getContext('2d');

		this.col_scale = this.options.col_size/84;

		this.env = new YehaNoha.env();

		this.obstacles = [];
		var col = 0;

		['hole', 'skull'].each(function(n){
			self.obstacles.push(new YehaNoha[n](YN._instance.options.col_size*col, YN._instance.options.col_size*col));
			col++;
		});

		this.join_player();
		this.join_player();
			/*
		this.join_player();*/
		
		timer(function(){
			self.update();
		});
	},
	draw: function(){
		var self = this;
		this.canvas.width = this.canvas.width;
		this.env.draw(this.ctx);
		this.players.each(function(player){
			player.draw(self.ctx);
		});
		this.obstacles.each(function(object){
			object.draw(self.ctx);
		});
	},
	update: function(){
		this.draw();
	},

	/*
		actions */
	join_player: function(options){
		if( options == undefined ) {
			options = {};
		}
		options.position = ( this.players.length )? 'left': 'right';
		this.players.push(new YehaNoha.player('p'+(this.players.length+1), options));
	}
};

/*
	objects */
/* env */
YehaNoha.env = function(){
	this.translate = {
		x: 0, y: 0
	};
	this.vibrating = false;
	this.vibrateReqId;
};
YehaNoha.env.prototype = {
	draw: function(ctx){
		var col_size = YN._instance.options.col_size;
		var i=0;
		for(; i < YN._instance.options.col_x; i++){
			for(var j=0; j < YN._instance.options.col_y; j++){
				ctx.fillStyle = 'rgba(0,0,0,'+((i+j)%2==0?.04:.02)+')';
				ctx.fillRect(col_size*i+~~this.translate.x, col_size*j+~~this.translate.y, col_size, col_size);
			}
		}
	},
	/* actions */
	vibrate: function(){
		if( this.vibrating ){
			return;
		}
		this.vibrating = true;

		to(this, { tick: function(reqId){
			if( ! this.vibrating ) {
				cancelAnimationFrame(reqId);
				return;
			}
			var tension = 6*YN._instance.col_scale;
			this.translate = {
				x: Math.random()*tension-tension/2, y: Math.random()*tension-tension/2
			};
		}}, 10);
	},
	stop_vibrate: function(){
		this.vibrating = false;
		this.translate = {
			x: 0, y: 0
		};
	}
};
/* player */
YehaNoha.player = function(id, options){
	this.on_action = false;

	this.id = id;
	this.options = extend(options, {
		position: 'left'
	});
	this.spr_name = '_invok';
	this.current_spr = 0;
};
YehaNoha.player.prototype = {
	draw: function(ctx){
		var col_scale = YN._instance.col_scale;
		var col_size = YN._instance.options.col_size, col_set = YN._instance.options.col_set;

		var posX = col_size*(this.options.position == 'right'? YN._instance.options.col_x-col_set[0]-1: col_set[0]);
		var posY = col_size*col_set[1];

		ctx.drawImage(YN._instance.assets[this.id+this.spr_name][this.current_spr], posX, posY, col_size, col_size);
		
		var arrow = YN._instance.assets.arrow[this.options.position=='right'?1:0];
		ctx.drawImage(arrow, posX+(col_size-arrow.width*col_scale)/2, posY-arrow.height*col_scale, arrow.width*col_scale, arrow.height*col_scale);
	},
	update: function(){

	},

	/* actions */
	invok: function(){
		var self = this;
		this.spr_name = '_invok';

		YN._instance.env.vibrate();

		to(this, {
			current_spr: 5,
			end: function(){
				this.current_spr = 0;
				YN._instance.env.stop_vibrate();
			}
		}, 7);

	}
};
/* obstacles */
/* hole */
YehaNoha.hole = function(x, y){
	this.spr = {
		x: 9, y: 166, width: 51, height: 23
	};
	this.translate = {
		x: x || 0, y: y || 0
	};
	this.col = [0, 0];
};
YehaNoha.hole.prototype = {
	draw: function(ctx){
		var instance = YN._instance;
		sprite_part(instance.assets.env[0], ctx, this.spr, this.translate, instance.options.col_size, instance.col_scale);
	}
};
/* skull */
YehaNoha.skull = function(x, y){
	this.spr = {
		x: 73, y: 97, width: 59, height: 35
	};
	this.translate = {
		x: x || 0, y: y || 0
	};
	this.col = [0, 0];
};
YehaNoha.skull.prototype = {
	draw: function(ctx){
		var instance = YN._instance;
		sprite_part(instance.assets.env[0], ctx, this.spr, this.translate, instance.options.col_size, instance.col_scale);
	}
};

/*
	globals */
var YN = {
	_instance: null,
	_path: 'assets/images/',
	_assets: {
		env: '{path}env.png',
		p1_invok: '{path}player1_invok_spr_{count:5}.png', p2_invok: '{path}player2_invok_spr_{count:5}.png',
		arrow: '{path}arrow_spr_{count:2}.png'
	},

	_def: { /* default options */
		dev: true
	},
};

/*
	init game */
YehaNoha.init = function(canvas, options){
	YN._instance = new YehaNoha(canvas, options);
}

/*
	helpers */
/*
	set */
function set(obj, attrs){
	for(var attr in attrs)
		obj[attr] = attrs[attr];
}
/* obj2 to obj1 -> only if the property doesn't exist */
function extend(obj1, obj2){
	for(var prop in obj2){
		if( obj1[prop] == undefined ){
			obj1[prop] = obj2[prop];
		}
	}
	return obj1;
};
/*
	each */
Array.prototype.each = function(func){
	for(var i=0; i < this.length; i++){
		func.call(null, this[i], i);
	}
};
/*
	get assets / load */
function get_assets(assets, callback){
	var progress = 0;
	var length = 0;

	var _assets = {};

	var regexp_count = /\{count:(\d+)\}/;

	for(var prop in assets){
		_assets[prop] = [];
		var count = 1;
		if( regexp_count.test(assets[prop]) ){
			var d = assets[prop].match(regexp_count);
			if( d != null ) {
				count = parseInt(d[1]);
				for(var i=0; i < count; i++){
					_assets[prop].push(assets[prop].replace(regexp_count, i).replace('{path}', YN._path));
				}
			}
		} else {
			_assets[prop].push(assets[prop].replace('{path}', YN._path));
		}
		length += count;
	}

	for(var prop in _assets){
		for(var i=0; i < _assets[prop].length; i++){
			asset_load(_assets[prop], i, function(){
				progress++;
				if( length == progress ){
					callback.call(null, _assets);
				}
			});
		}
	}
};
function asset_load(bundle, index, step){
	var img = new Image();
	img.onload = function(){
		bundle[index] = img;
		step();
	};
	img.src = bundle[index];
};

/*
	to */
function to(scope, d, fps){
	timer(function(reqId){
		for(var p in d){
			if( p == 'end' )
				continue;
			if( p != 'tick' ){
				scope[p] = scope[p]+(scope[p]<d[p]? 1: -1);
				if( scope[p] == d[p] ){
					if( undefined != d.end ){
						d.end.call(scope);
					}
					cancelAnimationFrame(reqId);
				}			
			} else {
				d.tick.call(scope, reqId);
			}
		}
	}, fps);
};
function timer(func, fps){
	var reqId;

	fps = fps || 60;

	var now, then = Date.now();
	var interval = 1000/fps;
	var delta ;

	(function tick(){
		reqId = requestAnimationFrame(tick);
		now = Date.now();
		delta = now-then;
		if( delta > interval ){
			then = now-(delta%interval);
			func.call(null, reqId);
		}
	})();
};
/* sprite part */
function sprite_part(img, ctx, d, translate, size_box, scale){
	scale = scale || 1;
	ctx.drawImage(img, d.x, d.y, d.width, d.height, ~~((size_box-d.width*scale)/2)+translate.x, ~~((size_box-d.height*scale)/2)+translate.y, ~~d.width*scale, ~~d.height*scale);
}