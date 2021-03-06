const path = require('path');

const imagesToBlur = [];

function imagePath(imageName) {
  return path.join('assets/images', imageName);
}

const header = require(`data/nous-rejoindre/header.json`);
imagesToBlur.push(imagePath(header.image.default), imagePath(header.image.mobile));

module.exports = {
	images: imagesToBlur,
	blurImages: imagesToBlur,
	svgComponents: {
		PictoQuoteOrangeLeft: 'assets/images/svg/picto-quote-orange-left.svg',
		PictoQuoteOrangeRight: 'assets/images/svg/picto-quote-orange-right.svg'
	}
}