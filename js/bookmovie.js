
// price object, set row range, and get price by row number
function SeatPrice()
{
    var rows = [];
    var prices = [];

    this.add = function(row, price) {
        if (this.rows == null) {
            this.rows = new Array();
            this.prices = new Array();
        }
        if (this.rows != null) {
            this.rows.push(row);
            this.prices.push(price);
        }
    }
    this.getPrice = function(row) {
        var price = 25;
        if (this.rows != null) {
            for (var i = 0; i < this.rows.length; i++) {
                if (this.rows[i] == row) {
                    price = this.prices[i];
                    break;
                }
            }
        } else {
            if (row <= 2) price = 20;
            else if (row <= 5) price = 22;
            else price = 25;
        }
        return price;
    }
}

// seat status object, push into row and col pairs, check seat exists by row and col number
// check seat status (invalid or booked) by row and col number
function SeatList()
{
    var rows = [];
    var cols = [];

    this.add = function(row, col) {
        if (this.rows == null) {
            this.rows = new Array();
            this.cols = new Array();
        }
        if (this.rows != null) {
            this.rows.push(row);
            this.cols.push(col);
        }
    }
    this.exits = function(row, col) {
        var ok = false;
        if (this.rows != null) {
            for (var i = 0; i < this.rows.length; i++) {
                ok = this.rows[i] == row && this.cols[i] == col;
                if (ok) break;
            }
        }
        return ok;
    }
}

function getSeatColor(cs)
{
    var color = "#00FFFF";
    if (cs == 0) { // invalid
        color = "#FFFFFF";
    } else if (cs == 1) { // vacant
        color = "#95B9C7";
    } else if (cs == 2) { // in action
        color = "#00FF00";
    } else if (cs == 3) { // booked
        color = "#2B65EC";
    } else if (cs == 4) { // recent booking
        color = "gold";
    }
    return color;
}

var rowCount = 8;
var leftColumnCount = 6, rightColumnCount = 5;

var prices = new SeatPrice();
var invalids = new SeatList();
var bookeds = new SeatList();
var roomLayout = [];
var rowLabels = [];
var showPrice = false;

var bookMovieCanvas;
var cntx;

var mouseIsDown = false;

function setMouseUpFlag()
{
    mouseIsDown = false;
}

function setCanvas(myc)
{
    bookMovieCanvas = myc;
    cntx = bookMovieCanvas.getContext('2d');
    bookMovieCanvas.addEventListener("mousedown", mouseDownFlag, false);
    bookMovieCanvas.addEventListener("mouseup", setMouseUpFlag, false);
    bookMovieCanvas.addEventListener("mousemove", changeCursorSelection, false);
}

function clearData()
{
    prices = new SeatPrice();
    invalids = new SeatList();
    bookeds = new SeatList();
    roomLayout = [];
}

var rowNames = ['R','A','B','C','D','E','F','G','H','I','J','K','L','M','N'];

function getRowName(row) {
    var name = '';
    if (row <= rowNames.length) {
        name = rowNames[row];
    } else {
        name = "R" + row;
    }
    return name;
}

function getSeatName(row, col) {
    var name = '';
    if (row >= 1 && col >= 1) {
        var c2 = col;
        var i = row - 1;
        if (roomLayout[i] != null) {
            for (var j = 0; j < roomLayout[i].length && j < leftColumnCount; j++) {
                var seat = roomLayout[i][j];
                if (seat.currentStatus == 0) c2--;
            }
        }
        if (row <= rowNames.length) {
            name = rowNames[row] + (c2 < 10 ? "0" : "") + c2;
        } else {
            name = "R" + row + '-' + (c2 < 10 ? "0" : "") + c2;
        }
    }
    return name;
}


function getSeatDisplayName(row, col) {
    if (row >= 1 && col >= 1) {
        var c2 = col;
        var i = row - 1;
        if (roomLayout[i] != null) {
            for (var j = 0; j < roomLayout[i].length && j < leftColumnCount; j++) {
                var seat = roomLayout[i][j];
                if (seat.currentStatus == 0) c2--;
            }
        }
        // c2
    }
    var name = '';
    if (c2 < 10) name = "0" + c2;
    else name = c2;
    return name;
}

function Seat(r, c, cs, rect)
{
    this.row = r;
    this.col = c;
    // 0: invalid, 1: vacant, 2: in action, 3: booked, 4: recent booking
    this.currentStatus = cs;
    this.rect = rect;
    // combine with row name and col number
    this.name = getSeatName(r, c);
    this.displayName = getSeatDisplayName(r, c);

    this.contains = function(x, y) {
        return this.rect.contains(x, y);
    }
}

function drawSeat(seat)
{
    if (cntx == null || seat.currentStatus == 0) return;
    
    cntx.save();
    
    cntx.strokeStyle = "black";
    cntx.lineWidth = "1";
    var fontSize = 12;
    cntx.font = fontSize + "px Arial";

    var r0 = seat.rect;
    var r = new JSRect(r0.x1, r0.y1, r0.x2, r0.y2);
    var margin = 2;
    r.x1 += margin, r.x2 -= margin, r.y1 += margin, r.y2 -= margin;

    cntx.save();
    cntx.fillStyle = getSeatColor(seat.currentStatus);
    cntx.fillRect(r.x1, r.y1+2, r.width(), r.height()-5);

    cntx.fillStyle = "darkgreen";
    var fw = 4;
    cntx.fillRect(r.x1, r.y1, fw, r.height());
    cntx.fillRect(r.x2-fw, r.y1, fw, r.height());
    cntx.fillRect(r.x1, r.y2-fw-2, r.width(), fw);

    cntx.restore();

    var ts = seat.displayName;
    //if (showPrice) ts += " ($" + prices.getPrice(seat.row) + ")";
    var tx = r.centerx()-cntx.measureText(ts).width;
    var ty = r.centery() + fontSize/2;

    cntx.translate(tx, ty);
    cntx.scale(2, 1)
    cntx.translate(-tx, -ty);

    cntx.fillText(ts, tx, ty);

    cntx.restore();
}

function bookSeats()
{
    if (roomLayout == null) return;
    
    var seatCount = 0;
    var totalPrice = 0;
    var seatInfos = [];
    for (var i = 0; i < roomLayout.length; i++) {
        if (roomLayout[i] == null) continue;
        for (var j = 0; j < roomLayout[i].length; j++) {
            var seat = roomLayout[i][j];
            if (seat.currentStatus == 2) {
                seat.currentStatus = 4;
                drawSeat(seat);
                var price = prices.getPrice(seat.row);
                totalPrice += price;
                seatCount++;
                var info = seat.name + ":$" + price;
                seatInfos.push(info);
            } else if (seat.currentStatus == 4) {
                seat.currentStatus = 3;
                drawSeat(seat);
            }
        }
    }
    var bookInfo = "";
    if (seatCount > 0) {
        bookInfo = "You booked <font color=\"red\"><b>" + seatCount + "</b></font> ";
        if (seatCount > 1) bookInfo += "seats";
        else bookInfo += "seat";
        bookInfo += " ( " + seatInfos.toString() + " )";
        bookInfo += ", the total price is <font color=\"red\"><b>$" + totalPrice + "</b></font>.";
    }
    return bookInfo;
}

function mouseDownFlag(e)
{
    mouseIsDown = true;
    selectSeat(e);
}

function selectSeat(e)
{
    if (roomLayout == null) return;

	var x = e.offsetX;
	var y = e.offsetY;

    var ok = false;
    for (var i = 0; i < roomLayout.length; i++) {
        if (roomLayout[i] == null) continue;
        for (var j = 0; j < roomLayout[i].length; j++) {
            var seat = roomLayout[i][j];
            if (seat.currentStatus != 0 && seat.contains(x, y)) {
                if (seat.currentStatus == 1) {
                    seat.currentStatus = 2;
                    ok = true;
                } else if (seat.currentStatus == 2) {
                    seat.currentStatus = 1;
                    ok = true;
                }
            }
            if (ok) {
                drawSeat(seat);
                break;
            }
        }
        if (ok) break;
    }
} 

function changeCursorSelection(e)
{
    if (roomLayout == null) return;
    
	var x = e.offsetX;
	var y = e.offsetY;

    var ok = false;
    for (var i = 0; i < roomLayout.length; i++) {
        if (roomLayout[i] == null) continue;
        for (var j = 0; j < roomLayout[i].length; j++) {
            var seat = roomLayout[i][j];
            if (seat.contains(x, y)) {
                ok = true;
                break;
            }
        }
        if (ok) break;
    }
    var cursorType = ok ? "pointer" : "auto";
    bookMovieCanvas.style.cursor = cursorType;
    if (mouseIsDown) selectSeat(e);
}

function getSeatStatus(row, col)
{
    var cs = 1;
    if (invalids.exits(row, col)) {
        cs = 0;
    } else if (bookeds.exits(row, col)) {
        cs = 3;
    }
    return cs;
}

// create and set roomLayout data
function createRoomLayout()
{
    if (bookMovieCanvas == null) return;
    var gap = 100, hmargin = 50, vfmargin = 200, vbmargin = 20;
    var columnCount = leftColumnCount + rightColumnCount;
    var seatWidth = (bookMovieCanvas.width - gap - hmargin*2) / columnCount;
    var seatHeight = (bookMovieCanvas.height - vfmargin - vbmargin) / rowCount;
    for (var i = 0; i < rowCount; i++) {
        var row = i + 1;
        var y = i * seatHeight + vfmargin;
        roomLayout[i] = [];
        rowLabels[i] = new JSRect(0, y, 50, y+seatHeight);
        for (var j = 0; j < columnCount; j++) {
            var col = j + 1;
            var cs = getSeatStatus(row, col);
            var x = j * seatWidth + hmargin;
            if (col > leftColumnCount) x += gap;
            var seatRect = new JSRect(x, y, x+seatWidth, y+seatHeight);
            roomLayout[i][j] = new Seat(row, col, cs, seatRect);
        }
    }
}

function drawScreen()
{
    if (cntx == null) return;
    
    cntx.save();

    var hmargin = 100, vmargin = 10;
    var r = new JSRect(hmargin, vmargin, bookMovieCanvas.width-hmargin, vmargin+25);

    cntx.fillStyle = "gray";
    cntx.fillRect(r.x1, r.y1, r.width(), r.height());

    var fontSize = 20;
    cntx.font = fontSize + "px Arial";
    cntx.fillStyle = "green";

    var ts = " S      C      R      E      E      N ";
    var tx = r.centerx()-cntx.measureText(ts).width/2, ty = r.y1 + fontSize;
    cntx.fillText(ts, tx, ty);

    cntx.restore();
}

function drawRowLabels()
{
    cntx.save();

    var fontSize = 12;
    cntx.font = fontSize + "px Arial";
    cntx.fillStyle = "darkred";

    for (var i = 0; i < rowCount; i++) {
        var row = i + 1;
        var r = rowLabels[i];
        var ts = getRowName(row);
        if (showPrice) ts += " ($" + prices.getPrice(row) + ")";
        var tx = r.centerx()-cntx.measureText(ts).width;
        var ty = r.centery() + fontSize / 2;
        if (showPrice) {
            tx += cntx.measureText(ts).width / 2;
            cntx.fillText(ts, tx, ty);
        } else {
            cntx.save();
            cntx.translate(tx, ty);
            cntx.scale(2, 1);
            cntx.translate(-tx, -ty);
            cntx.fillText(ts, tx, ty);
            cntx.restore();
        }
    }
    cntx.restore();
}

function drawRoomLayout()
{
    cntx.save();
    cntx.fillStyle = "white";
    cntx.fillRect(0, 0, bookMovieCanvas.width, bookMovieCanvas.height);
    cntx.restore();
    
    drawScreen();
    drawRowLabels();
    
    for (var i = 0; i < roomLayout.length; i++) {
        for (var j = 0; j < roomLayout[i].length; j++) {
            var seat = roomLayout[i][j];
            drawSeat(seat);
        }
    }
}

function loadCinemaRoomDataFromXml(filename)
{
    clearData();
    
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
	}
    else {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}

    // open xml file
	xmlhttp.open("GET", filename, false);
	xmlhttp.send();
	xmlDoc = xmlhttp.responseXML;

    // parse xml data to populate seat objects

	var rows = xmlDoc.getElementsByTagName("Row");
    if (rows != null) {
        rowCount = Number(rows[0].childNodes[0].nodeValue);
    }
	var leftColumns = xmlDoc.getElementsByTagName("LeftColumn");
    if (leftColumns != null) {
        leftColumnCount = Number(leftColumns[0].childNodes[0].nodeValue);
    }
	var rightColumns = xmlDoc.getElementsByTagName("RightColumn");
    if (rightColumns != null) {
        rightColumnCount = Number(rightColumns[0].childNodes[0].nodeValue);
    }

    var xprices = xmlDoc.getElementsByTagName("Price");
    if (xprices != null) {
        for (var i = 0; i < xprices.length; i++) {
            var startRow = Number(xprices[i].getAttributeNode("startRow").value);
            var endRow = Number(xprices[i].getAttributeNode("endRow").value);
            var price = Number(xprices[i].childNodes[0].nodeValue);
            for (var row = startRow; row <= endRow; row++) {
                prices.add(row, price);
            }
        }
    }
    
    var xinvalids = xmlDoc.getElementsByTagName("SeatInvalid");
    if (xinvalids != null) {
        var xseats = xinvalids[0].getElementsByTagName("Seat");
        if (xseats != null) {
            for (var i = 0; i < xseats.length; i++) {
                var row = Number(xseats[i].getAttributeNode("row").value);
                var col = Number(xseats[i].getAttributeNode("col").value);
                invalids.add(row, col);
            }
        }
    }
    
    var xbookeds = xmlDoc.getElementsByTagName("SeatBooked");
    if (xbookeds != null) {
        var xseats = xbookeds[0].getElementsByTagName("Seat");
        if (xseats != null) {
            for (var i = 0; i < xseats.length; i++) {
                var row = Number(xseats[i].getAttributeNode("row").value);
                var col = Number(xseats[i].getAttributeNode("col").value);
                bookeds.add(row, col);
            }
        }
    }

    // create and set roomLayout data
    createRoomLayout();
    drawRoomLayout();
}

