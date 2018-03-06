
mkdir public/media/
mkdir public/assets/

find storage/ -type d -exec chmod 777 {} \;
find bootstrap/cache/ -type d -exec chmod 777 {} \;
find public/media/ -type d -exec chmod 777 {} \;

cd public/assets/
ln -s ../../vendor/xpundel/facepalm/build/ facepalm
cd ../../
