#!/bin/bash

find storage/ -type d -exec chmod 755 {} \;
find bootstrap/cache/ -type d -exec chmod 755 {} \;
find public/media/ -type d -exec chmod 755 {} \;

cd public/assets/
ln -s ../../vendor/xpundel/facepalm/build/ facepalm
cd ../../
