/// <reference path="jquery-3.6.2.js" />

$(()=>{

// ---------------------------------------------------------------------------------------------
// init of site

    let cryptoCoins = []
    let myFavCoins = []
    $("section").hide()
    $("#homeSection").show()
    $("#popUp").hide()
    handleCoins()
    

    // shows the new section and hides the previous section
    $("a").on("click", function () {
        const dataSection = $(this).attr("data-section")
        $("section").fadeOut()
        $("#" + dataSection).fadeIn()
        if($("#homeSection").is(":hidden")) $("#search").fadeOut()
        else $("#search").fadeIn()
    })

    // general ajax request
    function getList(url) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url,
                success: data => {
                    resolve(data);
                },
                error: error => {
                    reject(error)
                }
            })
        })
    }

    // executes the AJAX request for all the coins
    async function handleCoins() {
        try {
            cryptoCoins = await getList("https://api.coingecko.com/api/v3/coins/")
            displayCryptoCoins(cryptoCoins)
        }
        catch(error) {
            alert(error.message)
        }
    }

    // displays the coins
    function displayCryptoCoins(cryptoCoins) {
        let content = `<h1>Home</h1>`
        
        // goes through coins one by one
        for(const coin of cryptoCoins) {
            const card = newCard(coin)
            // adds new card to the page content
            content += card
        }
        // adds all cards to page
        $("#homeSection").html(content)
    }

    // creates new card
    function newCard(coin) {
        const cardContent = `
            <div class="coinCard">
            <div class="form-check form-switch form-check-reverse">
                <input class="form-check-input" type="checkbox" id="toggleSwitch_${coin.id}">
            </div>
            <span class="coinId"><b>${coin.id}</b></span><br>
            <span class="coinSymbol">${coin.symbol}</span><br>
            <img src="${coin.image.small}" class="coinImg"/><br>
            <p>
                <a class="coinBtn btn btn-dark" id="${coin.id}" data-bs-toggle="collapse" href="#collapse${coin.id}" role="button" aria-expanded="false" aria-controls="collapseExample">More Info</a>
            </p>
            <div class="collapse" id="collapse${coin.id}">
                <div class="loaderBlock" id="load${coin.id}"></div>     
                <div id="moreInfo${coin.id}" class="card card-body"></div>
            </div>
        </div>
        `
        return cardContent
    }

    // ---------------------------------------------------------------------------------------------
    // more info

    // when user clicks on "more info button"
    $("#homeSection").on("click", ".coinCard > p > a", async function() {
        // gets coin name
        const coinId = $(this).attr("id");
        $(this).text() == "More Info" ? $(this).html("Less Info") : $(this).html("More Info")
        // AJAX request for more info about this coin
        const coin = await getList("https://api.coingecko.com/api/v3/coins/"+coinId)
        fillMoreInfo(coinId, coin)
        // saves as cookie
        setCookie(coinId, coin.market_data.current_price.usd, coin.market_data.current_price.eur, coin.market_data.current_price.ils);
    })
    
    function fillMoreInfo(coinId, coin) {
        const myCookies = getCookie(coinId)
        if(myCookies != "") {
            $("#load"+coinId).hide()
            content = `
            <b>Current Prices</b>
            USD: ${myCookies[0]}<br>
            EUR: ${myCookies[1]}<br>
            ILS: ${myCookies[2]}<br>
        `
            $("#moreInfo"+coinId).html(content);
        }
        else {
            $("#load"+coinId).slideDown()
            content = `
            <b>Current Prices</b>
            USD: $${coin.market_data.current_price.usd}<br>
            EUR: €${coin.market_data.current_price.eur}<br>
            ILS: ₪${coin.market_data.current_price.ils}<br>
        `
            $("#load"+coinId).slideUp()
            $("#moreInfo"+coinId).html(content)
        }
        
    }

// ---------------------------------------------------------------------------------------------
// search box
    
    $("#search").on("keyup", function() {
        const searchTerm = $(this).val().toLowerCase()
        const filteredCoins = cryptoCoins?.filter(coin => coin.symbol.indexOf(searchTerm) >= 0)
        displayCryptoCoins(filteredCoins)
    })
    
// ---------------------------------------------------------------------------------------------
// cookies
    
    function setCookie(coinId, coinUsd, coinEur, coinIls) {
        const currentTime = new Date()
        currentTime.setTime(currentTime.getTime() + (2 * 60 * 1000))
        let expiry = "expires=" + currentTime.toUTCString();
        document.cookie = `${coinId}USDprice=$${coinUsd}; ${expiry}`
        document.cookie = `${coinId}EURprice=€${coinEur}; ${expiry}`
        document.cookie = `${coinId}ILSprice=₪${coinIls}; ${expiry}`
    }
    
    function getCookie(coinId) {
        const decodeCookie = decodeURIComponent(document.cookie)
        const cookieArray = decodeCookie.split("; ")
        let myCoinArray = []
        cookieArray.forEach(element => {
            
            if(element.indexOf(coinId) === 0) {
                result = element.substring(coinId.length + 9)
                myCoinArray.push(result)
            }
            
        })
        return myCoinArray
    }

// ---------------------------------------------------------------------------------------------
// toggle switch
    
    let addAfterDelete = "";

    $("#homeSection").on("click", "input", function() {
        const thisCoinId = $(this).attr("id")
        const thisCoin = thisCoinId.replace("toggleSwitch_", "")

        if(myFavCoins.some(checkCoin)) {
            // deleting this coin from array
            $(this).prop("checked", false)
            const coinIndex = myFavCoins.indexOf(thisCoin)
            myFavCoins.splice(coinIndex, 1)
        }
        else if(myFavCoins.length == 5) {
            // if maximum reached
            // alert("Sorry!\nYou can only have 5 coins in favourites!")
            deleteFromFavCoins()
            addAfterDelete = thisCoin
            $(this).prop("checked", false)
        }
        else {
            // pushing this coin into array
            myFavCoins.push(thisCoin)
            $(this).prop("checked", true)
        }    

        function checkCoin(coin) {
            return coin == thisCoin
        }

    })
    
    function deleteFromFavCoins() {
        $("#popUp").show()

        let content = ""

        for(coin of myFavCoins) {
            content += `<div class="form-check form-switch form-check">
                <input class="form-check-input" type="checkbox" id="delete${coin}">
                <label class="form-check-label" for="flexSwitchCheckReverse">${coin}</label>
            </div>`
        }

        $("#listOfCoins").html(content)
    }

    $("#cancel").on("click", ()=>{
        $("#popUp").hide()
    })

    $("#confirm").on("click", ()=>{
        for(coin of myFavCoins) {
            if($("#delete"+coin).is(":checked")) {
                const coinIndex = myFavCoins.indexOf(coin)
                myFavCoins.splice(coinIndex, 1)
                myFavCoins.push(addAfterDelete)

                $("#toggleSwitch_"+coin).prop("checked", false)
                $("#toggleSwitch_"+addAfterDelete).prop("checked", true)

            }
        }
        $("#popUp").hide()
    })  

// ---------------------------------------------------------------------------------------------
// Tools Section

    $("#htmlSection").hide()
    $("#cssSection").hide()
    $("#bootstrapSection").hide()
    $("#javascriptSection").hide()
    $("#jquerySection").hide()

    $("#aboutSection").on("click", ".aboutCard > button", function() {
        const sectionToShow = $(this).attr("id") + "Section"
        $("#"+sectionToShow).show()
    })

    $("#aboutSection").on("click", ".aboutCard > small", function() {
        $(this).parent().hide()
    })
})

