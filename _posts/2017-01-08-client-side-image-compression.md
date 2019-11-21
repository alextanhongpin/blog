---
layout: post
title:  "JavaScript Client Side Image Compression"
date:   2017-01-08 7:58:16 +0800
categories: image
comments: true
---

For almost every project that I worked on, I find that storing images is one the most common operation. To keep things simple, I will usually store the images as base64 string in the database. But storing long strings in the database can really slow down your request when you start firing an ajax to get the image source. That is why I wrote a simple utility called 
[compress.js](https://github.com/alextanhongpin/compress.js).

This library does only one thing, and it does it well:

1. Load the image as data uri
2. Draw the image on the canvas with a downscaled width and height
3. Reduce the image size by downscaling the quality
4. Returns the compressed base64 string

With this library, you can get up to 90% reduction in image size (If the input is 10 MB, you can reduce it up to 1 MB in a single iteration). That is a whooping 9 MB size reduction.

:smile: Happy compressing your images.
