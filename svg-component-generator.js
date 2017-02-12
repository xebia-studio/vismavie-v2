const glob = require('glob');
const SVGO  = require('svgo');
const _ = require('lodash');
const path = require('path');
const svgpath = require('svgpath');
const fs = require('fs');
const dom = require('@alexistessier/dom').default;
const jsdom = require('jsdom');
const saveFile = require('xebia-web-common/scripts/save-file.js');
const svgo = new SVGO();

const cssInline = (function () {
	function traverse(obj) {
	    const tree = [];
	    tree.push(obj);
	    visit(obj);
	    
    	function visit(node) {
	      if (node && node.hasChildNodes()) {
	        let child = node.firstChild;
	        while (child) {
	          if (child.nodeType === 1 && child.nodeName !== 'SCRIPT'){
	            tree.push(child);
	            visit(child);
	          }
	          child = child.nextSibling;
	        }
	      }
	    }
	    return tree;
	}

	function explicitlySetStyle(element, _window) {
	    const cSSStyleDeclarationComputed = (_window || window).getComputedStyle(element);
	    let i, len, key, value;
	    let computedStyleStr = '';
	    for (i=0, len=cSSStyleDeclarationComputed.length; i<len; i++) {
	        key = cSSStyleDeclarationComputed[i];
	        value = cSSStyleDeclarationComputed.getPropertyValue(key);
	        // Write style if not a null value AND not set by an inline style
	        // or set with !important.
	        if (
	          value !== '' &&
	          (element.attributes.getNamedItem(key) === null || value.indexOf('!important') > -1)
	        ) {
	            computedStyleStr += key + ':' + value + ';';
	        }
	    }
	    if (computedStyleStr.length > 0) {
	      element.setAttribute('style', computedStyleStr);
	    }
	    else{
	      element.removeAttribute('style');
	    }
	}


	return function(svg, _window) {
	    const allElements = traverse(svg);
	    let i = allElements.length;
	    while (i--) {
	      explicitlySetStyle(allElements[i], _window);
	    }
	};
})();

const SvgComponentGenerator = (function() {
	'use strict';

	function SvgComponentGenerator(params) {
		// enforces new
		if (!(this instanceof SvgComponentGenerator)) {
			return new SvgComponentGenerator(params);
		}
		
		this.inputPath = params.inputPath;
		this.fileContentTransformMethod = (params.fileContentTransformMethod || function (name, content) {
			return content;
		});
		this.toolsOutputPath = params.toolsOutputPath;
		this.classAttributeString = params.classAttributeString || 'class';
		this.outputPath = params.outputPath;
		this.outputExt = params.outputExt || '.svg';
		this.sizeAliases = params.sizeAliases;
		this.attributesToRemove = params.attributesToRemove || ['id'];

		this.generatedList = {};
	}

	SvgComponentGenerator.prototype.run = function() {
		const self = this;
		this.totalCount = 0;
		this.totalGeneratedCount = 0;

		glob(path.join(this.inputPath, '*.svg'), function (err, fileList) {
			self.totalCount+= _.size(fileList);

			_.forEach(fileList, function (filePath) {
				self.optimizeFile(filePath, function (name, originalSize, sizeAliases, data) {
					self.totalCount+=_.size(sizeAliases);

					self.createComponent(name, '', originalSize, data, originalSize, function () {
						self.generateToolAtEnd();
					});

					_.forEach(sizeAliases, function (sizeInline, alias) {
						const size = {
							width: sizeInline.split('x')[0],
							height: sizeInline.split('x')[1]
						};

						self.createComponent(name, alias, size, data, originalSize, function () {
							self.generateToolAtEnd();
						});
					});
				});
			});
		});
	};

	SvgComponentGenerator.prototype.optimizeFile = function(filePath, callback) {
		const basename = path.basename(filePath, '.svg');
		const sizeAliases = this.sizeAliases[basename] || {};

		fs.readFile(filePath, 'utf8', function(err, data) {
			if (err) {
				throw err;
			}

			svgo.optimize(data, function(result) {
				const mark = 'viewBox="';
				let vb = result.data.indexOf(mark);
				vb+=mark.length;
				const end_vb = result.data.indexOf('"', vb);
				const viewBox = result.data.substring(vb, end_vb).split(' ');

				if (typeof result.info.width !== 'number') {
					result.info.width = parseInt(viewBox[2], 10);
				}
				if (typeof result.info.height !== 'number') {
					result.info.height = parseInt(viewBox[3], 10);
				}
				callback(basename, {width:result.info.width, height:result.info.height}, sizeAliases, result.data);
			});
		});
	};

	SvgComponentGenerator.prototype.generateToolAtEnd = function() {
		if(this.totalGeneratedCount >= this.totalCount && this.totalGeneratedCount > 0){
			const jsonData = JSON.stringify(this.generatedList);

			const tab = '\t';
			const newLine = '\n';

			const fileContent = newLine
				+'svgComponent__data = '+jsonData
				+newLine+newLine
				+'svgComponent__absoluteCenter(svgName, containerWidth, containerHeight = containerWidth, centerX = true, centerY = true)'
				+newLine+tab+'svgElement = svgComponent__data[svgName]'
				+newLine+tab+'svgClass = svgElement.className'
				+newLine+tab+'svgWidth = svgElement.width'
				+newLine+tab+'svgHeight = svgElement.height'
				+newLine+tab+'topPosition = ((containerHeight - svgHeight) / 2)'
				+newLine+tab+'leftPosition = ((containerWidth - svgWidth) / 2)'
				+newLine
				+newLine+tab+'.{svgClass}'
				+newLine+tab+tab+'position absolute'
				+newLine+tab+tab+'if centerY'
				+newLine+tab+tab+tab+'top (topPosition)px'
				+newLine+tab+tab+'if centerX'
				+newLine+tab+tab+tab+'left (leftPosition)px'
				+newLine+newLine
				+'svgComponent__absoluteAlignCenter(svgName, targetWidth, targetHeight = targetWidth, centerX = true, centerY = true)'
				+newLine+tab+'svgElement = svgComponent__data[svgName]'
				+newLine+tab+'svgWidth = svgElement.width'
				+newLine+tab+'svgHeight = svgElement.height'
				+newLine+tab+'topPosition = -((targetWidth - svgHeight) / 2)'
				+newLine+tab+'leftPosition = -((targetWidth - svgWidth) / 2)'
				+newLine
				+newLine+tab+'position absolute'
				+newLine+tab+'if centerY'
				+newLine+tab+tab+'top (topPosition)px'
				+newLine+tab+'if centerX'
				+newLine+tab+tab+'left (leftPosition)px'
				+newLine+newLine
				+'svgComponent__wrapper(svgName)'
				+newLine+tab+'svgElement = svgComponent__data[svgName]'
				+newLine+tab+'svgWidth = svgElement.width'
				+newLine+tab+'svgHeight = svgElement.height'
				+newLine
				+newLine+tab+'width (svgWidth)px'
				+newLine+tab+'height (svgHeight)px'
				+newLine+tab+'> svg'
				+newLine+tab+tab+'display block'
			;

			this.save(this.toolsOutputPath, fileContent);
		}
	};

	SvgComponentGenerator.prototype.createComponent = function(name, aliasName, size, data, originalSize, callback) {
		const self = this;
		const modifier = _.trim(aliasName).length > 0 ? '--'+_.kebabCase(aliasName) : '';
		const elementClass = _.upperFirst(_.camelCase(name))+modifier;
		const fileNameBase = _.kebabCase(name)+modifier;
		const fileName = fileNameBase+this.outputExt;

		const sx = size.width/originalSize.width;
		const sy = size.height/originalSize.height;

		jsdom.env(data, [], function (err, window) {
			const all = window.document.querySelectorAll('*');
			dom.forEach(all, function (el) {
				_.forEach(self.attributesToRemove, function (attr) {
					el.removeAttribute(attr);
				});
			});

			const svgroot = window.document.querySelector('svg');
			cssInline(svgroot, window);

			/*-------*/
			// remove useless tags
			/*-------*/

			dom.forEach(svgroot.querySelectorAll('style'), function (styleElement) {
				dom.remove(styleElement);
			});

			dom.forEach(svgroot.querySelectorAll('defs'), function (styleElement) {
				dom.remove(styleElement);
			});

			dom.forEach(svgroot.querySelectorAll('title'), function (styleElement) {
				dom.remove(styleElement);
			});

			/*-------*/
			/*-------*/
			/*-------*/
			
			svgroot.setAttribute(self.classAttributeString, elementClass);
			const viewBox = (svgroot.getAttribute('viewBox') || '0 0 '+size.width+' '+size.height).split(' ');

			viewBox[0] = viewBox[0] * sx;
			viewBox[1] = viewBox[1] * sy;
			viewBox[2] = size.width;
			viewBox[3] = size.height;

			self.generatedList[fileNameBase] = {
				name: fileNameBase,
				className: elementClass,
				width: parseInt(viewBox[2], 10),
				height: parseInt(viewBox[3], 10)
			};

			self.totalGeneratedCount++;
			callback();

			svgroot.setAttribute('viewBox', viewBox.join(' '));

			if (!_.includes(self.attributesToRemove, 'height')) {
				svgroot.setAttribute('height', size.height);
			}
			if (!_.includes(self.attributesToRemove, 'width')) {
				svgroot.setAttribute('width', size.width);
			}

			const pathList = window.document.querySelectorAll('path');

			dom.forEach(pathList, function (path) {
				const transformed = svgpath(path.getAttribute('d'))
                    .scale(sx, sy)
                    .translate(0,0)
                    .rel()
                    .round(10)
                    .toString();

                path.setAttribute('d', transformed);
			});

			const fileContent = window.document.querySelector('body').innerHTML;

			let fileList = self.fileContentTransformMethod(fileNameBase, fileContent);
			fileList = _.isArray(fileList) ? fileList : [{name: fileName, content:fileList}];

			_.forEach(fileList, function (file) {
				const outputPath = path.join(self.outputPath, file.name);
				
				self.save(outputPath, file.content);
			});
		});
	};

	SvgComponentGenerator.prototype.save = function(path, content) {
		saveFile({
			path: path,
			content: content,
			reportMessageTransform: function (message) {
				return 'SvgComponentGenerator => '+message;
			}
		});
	};

	return SvgComponentGenerator;
}());

module.exports = SvgComponentGenerator;
