cd /home/ubuntu/MileStone3_App
forever stopall
npm install
forever --watch start main.js 8181
