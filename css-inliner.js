/**
 * Javascript CSS Inliner
 * Licensed under the MIT License
 * Copyright (c) 2017 Filip Vincůrek
 * Using parts of aramk's CSS-JSON Converter for JavaScript -> https://github.com/aramk/CSSJSON
 */
var inliner = new function(){
	var self = this;
	var commentX = /\/\*[\s\S]*?\*\//g;
	var lineAttrX = /([^\:]+):([^\;]*);/;
	var altX = /(\/\*[\s\S]*?\*\/)|([^\s\;\{\}][^\;\{\}]*(?=\{))|(\})|([^\;\{\}]+\;(?!\s*\*\/))/gmi;
	var capComment = 1;
	var capSelector = 2;
	var capEnd = 3;
	var capAttr = 4;
	//
	var isEmpty = function (x) {
		return typeof x == 'undefined' || x.length == 0 || x == null;
	};
	self.styles = '';
	self.config = {
		'moz-do-not-send': true
		,'rgb-to-hex': true
		,'printout': true
	};
	self.init = function () {
		// String functions
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, '');
		};
		String.prototype.repeat = function (n) {
			return new Array(1 + n).join(this);
		};
		// add button on the top
		self.addPanel();
	};
	self.rgbToHex = function(r, g, b) { return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b); };
	self.toJSON = function (cssString, args) {
		var node = {
			children: {},
			attributes: {}
		};
		var match = null;
		var count = 0;

		if (typeof args == 'undefined') {
			var args = {
				ordered: false,
				comments: false,
				stripComments: false,
				split: false
			};
		}
		if (args.stripComments) {
			args.comments = false;
			cssString = cssString.replace(commentX, '');
		}

		while ((match = altX.exec(cssString)) != null) {
			if (!isEmpty(match[capComment]) && args.comments) {
				// Comment
				var add = match[capComment].trim();
				node[count++] = add;
			} else if (!isEmpty(match[capSelector])) {
				// New node, we recurse
				var name = match[capSelector].trim();
				// This will return when we encounter a closing brace
				var newNode = self.toJSON(cssString, args);
				if (args.ordered) {
					var obj = {};
					obj['name'] = name;
					obj['value'] = newNode;
					// Since we must use key as index to keep order and not
					// name, this will differentiate between a Rule Node and an
					// Attribute, since both contain a name and value pair.
					obj['type'] = 'rule';
					node[count++] = obj;
				} else {
					if (args.split) {
						var bits = name.split(',');
					} else {
						var bits = [name];
					}
					for (i in bits) {
						var sel = bits[i].trim();
						if (sel in node.children) {
							for (var att in newNode.attributes) {
								node.children[sel].attributes[att] = newNode.attributes[att];
							}
						} else {
							node.children[sel] = newNode;
						}
					}
				}
			} else if (!isEmpty(match[capEnd])) {
				// Node has finished
				return node;
			} else if (!isEmpty(match[capAttr])) {
				var line = match[capAttr].trim();
				var attr = lineAttrX.exec(line);
				if (attr) {
					// Attribute
					var name = attr[1].trim();
					var value = attr[2].trim();
					if (args.ordered) {
						var obj = {};
						obj['name'] = name;
						obj['value'] = value;
						obj['type'] = 'attr';
						node[count++] = obj;
					} else {
						if (name in node.attributes) {
							var currVal = node.attributes[name];
							if (!(currVal instanceof Array)) {
								node.attributes[name] = [currVal];
							}
							node.attributes[name].push(value);
						} else {
							node.attributes[name] = value;
						}
					}
				} else {
					// Semicolon terminated line
					node[count++] = line;
				}
			}
		}
		return node;
	};
	self.merge = function(obj1,obj2){
		var obj3 = {};
		for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
		for (var attrname in obj2) {
			if( typeof obj1[attrname] === 'object' ){
				obj3[attrname] = self.merge( obj1[attrname], obj2[attrname]);
			}else{
				obj3[attrname] = obj2[attrname];
			}
		}
		return obj3;
	};
	self.addPanel = function(){
		var panel = '<div id="css-inliner-panel">'+
									'<label class="css-inliner-input"><input id="moz-do-not-send" type="checkbox" '+(self.config["moz-do-not-send"] === true ? "checked" : "")+'/> moz-do-not-send</label>'+
									'<label class="css-inliner-input"><input id="rgb-to-hex" type="checkbox" '+(self.config["rgb-to-hex"] === true ? "checked" : "")+'/> rgb-to-hex</label>'+
									'<label class="css-inliner-input"><input id="printout" type="checkbox" '+(self.config["printout"] === true ? "checked" : "")+'/> print to page</label>'+
									'<button class="css-inliner-button">Run CSS Inliner</button>'+
								'</div>';
		document.body.insertAdjacentHTML('beforeend', panel);

		var $panel = $('#css-inliner-panel');
		$panel.css({
			'position': 'fixed'
			,'top': 0
			,'right': 0
			,'background':'white'
			,'border':'1px solid black'
		});

		var $inputs = $('.css-inliner-input');
		$inputs.css({
			'display': 'block'
			,'padding': '4px 10px'
			,'vertical-align': 'middle'
		});

		var $button = $('.css-inliner-button');
		$button.css({
			'border': 'none'
			,'border-radius': 0
			,'color': '#fff'
			,'padding': '10px'
			,'cursor':'pointer'
			,'background':'black'
			,'width':'100%'
		});
		$button.on('click',function(){
			self.run();
		});
		function openWindow(){
			window.open().document.write(myHtml);
		}
	};
	self.run = function(){
		var config = {
			'moz-do-not-send': document.getElementById('moz-do-not-send').checked
			,'rgb-to-hex': document.getElementById('rgb-to-hex').checked
			,'printout': document.getElementById('printout').checked
		};
		self.config = self.merge(self.config,config);
		// remove all inliner elements from html
		$('[id^="css-inliner-"]').remove();
		// concat all styles from page (does not work with included styles)
		$("style").each(function(id,elem){
			if($(this).attr('id') !== 'responsive'){
				self.styles = self.styles + "\n" + $(elem).html();
				$(this).remove();
			}
		});
		// add 'moz-do-not-send' to images
		if(self.config['moz-do-not-send']){
			$("img").each(function(id,elem){
				$(this).attr('moz-do-not-send','true');
			});
		}
		// loop through JSON of CSS styles and apply all parametters to elements
		var jsoncss = self.toJSON(self.styles);
		for( style in jsoncss.children ){
			//
			$(style).css(jsoncss.children[style].attributes);
		};
		//
		var finalHtml = $('html').html();
		// replace rgb(0,0,0) colors with #hex values
		// because browsers likes rgb() but mail clients do not
		if(self.config['rgb-to-hex']){
			finalHtml = finalHtml.replace(
			  /\brgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
			  function($0, $1, $2, $3) {
			    return "#" + ("0"+Number($1).toString(16)).substr(-2) + ("0"+Number($2).toString(16)).substr(-2) + ("0"+Number($3).toString(16)).substr(-2);
			  }
			);
		};
		// wrap parsed html code in <html> tag and print the result in console
		var completeCode = '<html xmlns="http://www.w3.org/1999/xhtml" style="margin: 0px; padding: 0px; height: 100%; width: 100%;">'+finalHtml+'</html>';
		console.log(completeCode);
		// print out final code on page
		if(self.config['printout']){
			document.body.insertAdjacentHTML('beforeend', '<pre id="css-inliner-code"></pre>');
			$('pre').text(completeCode);
		};
		//
		self.addPanel();
	};
	//
	self.init();
};