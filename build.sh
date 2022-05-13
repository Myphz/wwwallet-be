git clone https://github.com/Myphz/wwwallet-fe.git
cd wwwallet-fe
npm ci --include=dev
npm run build
cd ..
rm -rf wwwallet-fe/