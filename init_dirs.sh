#!/bin/bash

find storage/ -type d -exec chmod 755 {} \;
find bootstrap/cache/ -type d -exec chmod 755 {} \;
mkdir -p public/media
cd public/assets/
ln -s ../../vendor/xpundel/facepalm/build/ facepalm
cd ../../