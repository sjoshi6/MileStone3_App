cd /home/ubuntu/MileStone3_App
forever stopall
npm install
forever start --watch main.js 8181
