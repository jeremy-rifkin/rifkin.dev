#!/bin/bash

mkdir -p src/public/icons

convert assets/pfp.jpg -resize 460x460 src/public/icons/cropped.png
convert src/public/icons/cropped.png \
        -gravity Center \
        \( -size 460x460 \
           xc:Black \
           -fill White \
           -draw 'circle 230 230 230 1' \
           -alpha Copy \
        \) -compose CopyOpacity -composite \
        -trim src/public/icons/cropped.png

convert src/public/icons/cropped.png -resize 16x16 src/public/icons/16.png
convert src/public/icons/cropped.png -resize 32x32 src/public/icons/32.png
convert src/public/icons/cropped.png -resize 48x48 src/public/icons/48.png
convert src/public/icons/16.png src/public/icons/32.png src/public/icons/48.png src/public/favicon.ico
rm -rfv src/public/icons
