<p align="center">
<h1 align="center">
<img align="center" src="https://wwwallet.app/icons/logo.svg">
wwwallet
</h1>
<h3 align="center">Managing your crypto has never been this easy</h3>
</p>

<p align="center">
<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
<img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
<img src="https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D">
<img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white">
<img src="https://img.shields.io/badge/Bitcoin-000000?style=for-the-badge&logo=bitcoin&logoColor=white">
</p>

<p align="center">
<a href="https://github.com/Myphz/wwwallet-fe" target="_blank">Frontend repository</a>
</p>

<p align="center">
<img src="https://wwwallet.app/images/tablet_mockup.png">
</p>


# wwwallet
> A web application to track your investments anywhere, in real-time

<a href="https://wwwallet.app/" target="_blank">wwwallet</a> makes it easy for investors to track their movements in the cryptocurrency sector.  
With its easy and intuitive interface, it allows users to monitor their wallet by calculating and displaying many useful statistics, updated in real-time using data from Binance.

## Features
- Easy to use and intuitive interface
- Calculate earnings, percentage changes and many other useful statistics relative to any point in time, with many personalized charts to track your investments value by the second
- Completely ad-free and open source
- More than 500 cryptocurrencies, updated real-time using Binance APIs

## Usage
To start using the application, you can visit the website or deploy it locally.  
After registering and confirming your email, you can record your transactions from the wallet page or from any cryptocurrency's chart page.  
Click on the switch to choose from BUY/SELL options, select your pair and type in the crypto quantity and the price.  
The total value will be calculated and displayed automatically.

<img src="https://wwwallet.app/images/transaction.png">

## Deploy locally
If you want to test the app by yourself, follow these steps:
- Install <a href="https://nodejs.org/" target="_blank">NodeJS</a> and <a href="https://www.npmjs.com/">npm</a> on your machine.
- Clone the repository with `git clone https://github.com/Myphz/wwwallet-be.git`
- Inside the clone repository, execute these commands:
```
npm i
npm start
```
- Install and run the <a href="https://github.com/Myphz/wwwallet-fe">frontend</a> application    
The website will be available on `http://localhost:5000`.

>Optionally, you can set environment variables in a `.env` file in the project's root directory:
> - COINMARKETCAP_API_KEY: API key for CoinMarketCap data. There already is a default one, but its rate has severe limitations.
> - EMAIL_SETTINGS: JSON string to send emails, following the <a href="https://nodemailer.com/smtp/">Nodemailer SMTP transport</a> format. If not set, the server won't send any emails, but will print in the console the required information instead.
> - JWT_KEY: Private key to sign JWT tokens. Defaults to "TEST_KEY"
> - MONGO_URI: URI of the MongoDB database to store user data. If not set, the server will use a Memory Server, which will be reset after the server has shut down.


## Feedback and contributing
Feel free to <a href="https://wwwallet.app/feedback" target="_blank">send us feedback</a> or <a href="https://github.com/Myphz/wwwallet-be/issues" target="_blank">file an issue</a>.  
Feature requests are always welcome.  
If you wish to contribute, please take a quick look at the guidelines!

## License
> You can check out the full license <a href="https://github.com/Myphz/wwwallet-be/blob/main/LICENSE">here</a>

This project is licensed under the terms of the GNU General Public License
