const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require("axios");



(async function main() {
    var browser;
    try{
        const currencyConvUrl = 'https://api.exchangeratesapi.io/latest?base=USD';
        var currencyRatio = 0;
        await axios.get(currencyConvUrl).then(function (response) {
            currencyRatio = response.data.rates.GBP;
        });

        browser = await puppeteer.launch( {args: ['--no-sandbox'], headless :false});
        const page = await browser.newPage();
        await page.setViewport({ 'width': 1440, 'height': 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');

        var url = 'https://stockx.com/new-releases/sneakers';

        var response = await page.goto(url);
        console.log(response);
        
        
        //await page.click('.collapsed');
        await page.waitForFunction('document.querySelectorAll(".categoryOption").length > 5');
        const categories = await page.$$('.categoryOption > div');
        var urls = [];

        for (let i = 5;i<categories.length;i++) {
            console.log("Going into category " + i);


            await page.evaluate(e => e.click(), categories[i]);
            await page.waitFor(2000);
            try{
                await page.waitForSelector('.no-results',{timeout:1000});
                await page.waitForSelector('.browse-grid');
                var items = await page.$$('.tile');
                if(items.length>0){
                    for(let k = 0; k<items.length;k++){
                        var divider = await items[k].$('a > div > div > div > .bid-ask-divider');
                        if(divider){ 
                            var href = await items[k].$eval('a', a => a.href);
                            urls.push(href);
                        };
                    }
                } 
            } catch(e){
                var show_more = await page.$('.show-more');
                if(show_more!=null){
                    await page.evaluate(e => e.click(), show_more);
                }
                await page.waitForSelector('.subcategory');
                var subcategories = await page.$$('.subcategory');
                for (let j=0;j<subcategories.length;j++) {
                    console.log("Going into subcategory " + j);
                    var show_more = await page.$('.show-more');
                    if(show_more!=null){
                        await page.evaluate(e => e.click(), show_more);
                    }
                    await page.waitForSelector('.subcategory');
                    var subcategories = await page.$$('.subcategory');
                    var button = await subcategories[j].$('input');
                    await page.evaluate(e => e.click(), button);
                    await page.waitFor(1000);
                    await page.waitForSelector('.browse-grid');
                    var items = await page.$$('.tile');
                    if(items.length>0){
                        for(let k = 0; k<items.length;k++){
                            var divider = await items[k].$('a > div > div > div > .bid-ask-divider');
                            if(divider){
                                var href = await items[k].$eval('a', a => a.href);
                                urls.push(href);
                            };
                        }
                    } 
                    
                }
            }
        }
        console.log(urls);

        var shoes = [];
        
        //for(let url in urls){
        for(let i = 0;i<urls.length;i++){
            console.log("Going to: " + urls[i]);
            var response = await page.goto(urls[i]);
            //console.log(response);
            await page.waitFor(1000);
            var shoe = new Object();
            let tries =1;
            while(tries < 5){
                try{
                    await page.waitForSelector('h1.name');
                    break;
                }catch(e){
                    var response = await page.goto(urls[i]);
                    console.log(response);
                    await page.waitFor(1000);
                }
                tries++;
            }
            if(tries==5){
                continue;
            }
            
            
            var name = await page.$eval('h1.name', name => name.textContent);
            console.log("Shoe #"+ i + "     Name: "+ name);
            shoe.name = name;
            // if(name.trim().toLowerCase().indexOf('yeezy') >-1){
            //     let bodyHTML = await page.evaluate(() => document.body.innerHTML);
            //     console.log(bodyHTML);
            // }
            await page.waitForSelector('.product-details');
            var fields = await page.$('.product-details');
            var styleElement = await fields.$x("//div[div[span[text()='Style']]]");
            var retailPriceElement = await fields.$x("//div[div[span[text()='Retail Price']]]");
            var releaseDateElement = await fields.$x("//div[div[span[text()='Release Date']]]");
            // console.log(style);
            // console.log(retailPrice);
            // console.log(releaseDate);

            var styleText = 'None';
            if(styleElement.length!=0){
                var spans = await styleElement[0].$$('span');
                styleText = (await page.evaluate(element => element.textContent, spans[2])).trim();
                //console.log("Style: " + styleText);
            }
            shoe.style = styleText;
            if(styleText!='TBD'){
                shoe.shoeTimeUrl = "https://thesolesupplier.co.uk/release-dates-filtered/?search_key=" + styleText;
            } else {
                shoe.shoeTimeUrl = 'TBD';
            }
            
            var retailPrice = 0;
            if(retailPriceElement.length!=0){
                var spans = await retailPriceElement[0].$$('span');
                var retailText = await page.evaluate(element => element.textContent, spans[2]);
                retailPrice = (parseInt(retailText.trim().substring(3)) * currencyRatio).toFixed(2);
                //console.log("Retail Price: " + retailPrice);
            }
            shoe.retailPrice = retailPrice;
            
            var releaseDate = "TBA";
            if(releaseDateElement.length!=0){
                var spans = await releaseDateElement[0].$$('span');
                releaseDate = (await page.evaluate(element => element.textContent, spans[2])).trim();
                //console.log("Release Date: " + releaseText);
            }
            shoe.releaseDate = releaseDate;

            

            var imageUrl = '';
            if(await page.$('.product-media > .full > .product-image')){
                imageUrl = await page.$eval('.product-media > .full > .product-image', image => image.src);
            } else if(await page.$('.image-container')){
                imageUrl = await page.$eval('.image-container > img', image => image.src);
            }

            //console.log("Image Url: "+imageUrl);
            shoe.imageUrl = imageUrl;

            var sizesList = [];
            await page.waitForSelector('.list-unstyled');
            var sizeContainer = await page.$('.list-unstyled');
            var sizes = await sizeContainer.$$('.inset');
            for(let j = 0; j<sizes.length;j++){
                var sizeName = await sizes[j].$eval('div.title', title => title.textContent);
                var priceOfSize = await sizes[j].$eval('div.subtitle', subtitle => subtitle.textContent);
                
                if(priceOfSize!='Bid' && sizeName!='All'){
                    priceOfSize = parseInt(priceOfSize.trim().substring(1).replace(/,/g, ''));
                    sizesList.push(new Size(sizeName, priceOfSize));
                }
            }

            var sizesSorted = sizesList.sort(function(a, b){return  b.price - a.price});
            //console.log(top10sizes);
            shoe.sizes = sizesSorted;
            //console.log(sizesList);

            await page.waitForSelector('.gauge-value');
            var resellAvgElement = (await page.$$('.gauge-value'))[2];
            var soldAmountElement = (await page.$$('.gauge-value'))[0];
            var soldAmount = (await page.evaluate(element => element.textContent, soldAmountElement));
            var soldAvg = (await page.evaluate(element => element.textContent, resellAvgElement));
            if(soldAvg == '--'){
                soldAvg = 0;
            } else {
                soldAvg = parseInt(soldAvg.trim().substring(1).replace(/,/g, '')).toFixed(2);
            }
            if(soldAmount == '--'){
                soldAmount = 0;
            }

            //console.log("No retail Avg.. Calculating now..");
            var currentResellAvgPrice  = 0;
            for(let j=0;j<sizesList.length;j++){
                currentResellAvgPrice+=sizesList[j].price;
            }
            //console.log(currentSizeAvg);
            currentResellAvgPrice =(currentResellAvgPrice / sizesList.length).toFixed(2);

            //console.log("Sold Amount: " + soldAmount);
            shoe.soldAmount = soldAmount;
            //console.log("Resell Average: " + soldAvg);
            shoe.soldAvgPrice = soldAvg;
            //console.log("Current Resell Average: " + currentResellAvgPrice);
            shoe.currentResellAvgPrice = currentResellAvgPrice;
            //console.log("\n");
            var avgSoldProfit = 0;
            var avgCurrentProfit = 0;
            var avgProfitCombined = 0;
            if(retailPrice!=0){
                if(soldAvg!=0){
                    avgSoldProfit = soldAvg - retailPrice;
                    avgProfitCombined = soldAvg - retailPrice;
                } else {
                    avgProfitCombined = currentResellAvgPrice - retailPrice;
                }
                avgCurrentProfit = currentResellAvgPrice - retailPrice;
            }
            avgSoldProfit = avgSoldProfit.toFixed(2);
            shoe.soldAvgProfit = avgSoldProfit;
            shoe.currentResellAvgProfit = avgCurrentProfit;
            shoe.avgProfitCombined = avgProfitCombined.toFixed(2);

            if(!(avgSoldProfit < 20 && avgCurrentProfit < 50)){
                shoes.push(shoe);
                console.log(shoe);
            }


        }

        console.log(shoes);

        fs.writeFileSync('shoes.json',JSON.stringify(shoes));

        console.log(shoes.sort(function(a, b){return  b.soldAvgProfit - a.soldAvgProfit}).slice(0,10));
        
    } catch(e) {
        //console.log('our error', e);
        var nodemailer = require('nodemailer');
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: false,
            port: 25,
            auth: {
              user: 'robochaseproject@gmail.com',
              pass: 'N-kWM#%>JD7q>P=5'
            },
            tls: {
              rejectUnauthorized: false
            }
        });

        let HelperOptions = {
        from: '"RoboChase" <robochaseproject@gmail.com',
        to: 'mehdidah1214@gmail.com',
        subject: 'Error has occured with StockX WebScrape script!',
        text: ('An error has occured: ' + e)
        };

        transporter.sendMail(HelperOptions, (error, info) => {
            console.log("The message was sent!");
            console.log(info);
        });



    }
    await browser.close();
    
})();


function Size(size, amount) {
    this.size = size;
    this.price = amount;
}
