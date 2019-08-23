/* 'use strict';
const docxConverter = require('docx-pdf');
var path = require('path');
var fs = require('fs');
function convertDocToImage(inputPath, callback) {
    var filename = path.basename(inputPath);
    var dir = inputPath.replace(filename, "");
    var ext = path.extname(filename);

    var bufferPath = path.resolve(dir, Date.now() + '.pdf')

    docxConverter(inputPath, bufferPath, (err, result) => {
        if (err) callback(err);
        else {
            var pdftoimage = require('pdftoimage');
            var file = bufferPath;

            // Returns a Promise
            pdftoimage(file, {
                format: 'png',  // png, jpeg, tiff or svg, defaults to png
                prefix: filename,  // prefix for each image except svg, defaults to input filename
                outdir: dir   // path to output directory, defaults to current directory
            }).then(function (s) {
                console.log('Conversion done');
                var fileNames = [];
                fs.readdir(dir, (err, files) => {
                    files.forEach(file => {
                        if (path.extname(file) === '.png') {
                            fileNames.push(path.resolve(dir, file))
                        }
                        // if(file)
                    });
                    callback(null, fileNames);
                });
            }).catch(function (err) {
                console.log(err);
            });
            // var pdfImage = new PDFImage(bufferPath);
            // pdfImage.convertFile().then(function (imagePaths) {
            //     // [ /tmp/slide-0.png, /tmp/slide-1.png ]
            //     callback(null, imagePaths);
            // }).catch(function (err) {
            //     console.log(err)

            // });
        }
    });
}


module.exports.convertPdfToImage = function (inputPath, callback) {
    var filename = path.basename(inputPath);
    var dir = inputPath.replace(filename, "");
    var ext = path.extname(filename);

    var bufferPath = inputPath;

    var pdftoimage = require('pdftoimage');
    var file = bufferPath;

    // Returns a Promise
    pdftoimage(file, {
        format: 'png',  // png, jpeg, tiff or svg, defaults to png
        prefix: filename,  // prefix for each image except svg, defaults to input filename
        outdir: dir   // path to output directory, defaults to current directory
    }).then(function (s) {
        console.log('Conversion done');
        var fileNames = [];
        fs.readdir(dir, (err, files) => {
            files.forEach(file => {
                if (path.extname(file) === '.png') {
                    fileNames.push(path.resolve(dir, file))
                }
                // if(file)
            });
            callback(null, fileNames);
        });
    }).catch(function (err) {
        console.log(err);
    });
}
module.exports.convertDocToImage = convertDocToImage; */