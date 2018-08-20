
var gameCanvas;
var cntx;
var canvasBoundary = new JSRect(0, 0, 0, 0);
var rectangleFlag = false;

// growing
var growingStep = 500;
var growingTime = 5000;

var growingTimer;
var grownTime = 0;

// orange's mature period (changing color from green to orange)
var maturingStep = 200;
var maturingTime = 4000;

var maturingTimer;
var maturedTime = 0;

// falling
var fallingTime = 6000;
var fallingStep = 100;

var fallingTimer;
var fallenTime = 0;
var fallingDelayTimes = [];
var maxFallingDelayTime = 0;
var fallingMaximumDelay = 60000;
var collisionDetections = [];

// oranges
var oranges = [];

// Mr. X
var mrxPosX = 50;
var mrxPosY = 420;
var moveStep = 20;

var mx1 = new MrX(mrxPosX, mrxPosY);

// sounds

var audioBackground = new Audio('sounds/bg_bird.mp3');
var audioOver = new Audio('sounds/over.mp3');
var audioHappy = new Audio('sounds/happy.mp3');
var audioUnhappy = new Audio('sounds/unhappy.mp3');

// loop play
audioBackground.loop = true;

// game phase, 0: init status, 1: growing, 2: maturing, 3: falling, 4: game over
var gamePhase = 0;

// game score
var gameScore = 0;

function setGameSoundVolume(volume)
{
    audioBackground.volume = volume;
    audioOver.volume = volume;
    audioHappy.volume = volume;
    audioUnhappy.volume = volume;
}

function setCanvas(myc)
{
    gameCanvas = myc;
    cntx = gameCanvas.getContext('2d');
    canvasBoundary = new JSRect(0, 0, myc.width, myc.height);

    //gameCanvas.addEventListener("mousemove", showPosition, false);
    window.addEventListener('keydown', doKeyDown, true);
    
    audioBackground.play();
}

function clearOranges()
{
    if (oranges != null && oranges.length > 0) {
        oranges.splice(0);
    }
}

function clearFallingControlData()
{
    if (fallingDelayTimes != null && fallingDelayTimes.length > 0) {
        fallingDelayTimes.splice(0);
    }
    if (collisionDetections != null && collisionDetections.length > 0) {
        collisionDetections.splice(0);
    }
}

function stopGame()
{
    if (fallingTimer != null) {
        clearInterval(fallingTimer);
        fallingTimer = null;
        fallenTime = 0;
    }
    if (maturingTimer != null) {
        clearInterval(maturingTimer);
        maturingTimer = null;
        maturedTime = 0;
    }
    if (growingTimer != null) {
        clearInterval(growingTimer);
        growingTimer = null;
        grownTime = 0;
    }

    clearOranges();
    clearFallingControlData();

    audioBackground.pause();
}

function startGame()
{
    if (gamePhase != 0 && gamePhase != 4) return;
    
    stopGame();
    cleanCanvas();

    gamePhase = 0;
    gameScore = 0;
    
    audioBackground.play();

    mrxPosX = 50;
    mrxPosY = 420;
    mx1.direction = 1;
    mx1.setPosition(mrxPosX, mrxPosY);
    mx1.collectedOrangeCount = 0;
    updateScoreInformation();
    
    setTimeout(startPlaying, 3000);
}

function startPlaying()
{
    createOranges();

    updateAll();

    var gap0 = 2000;
    setTimeout(startOrangeGrowing, gap0);

    var gap1 = 2000+gap0, gap2 = 3000;
    setTimeout(startOrangeMaturing, growingTime + gap1);
    setTimeout(startOrangeFalling, growingTime + gap1 + maturingTime + gap2);
}

function showPosition(e)
{
	var x = e.offsetX;
	var y = e.offsetY;
    var str = "mouse position (x, y): " + x + ", " + y + "<br>";
    var info = document.getElementById("show_information");
    if (info != null) info.innerHTML = str;
}

function showInformation(str)
{
    var info = document.getElementById("show_information");
    if (info != null) info.innerHTML = str;
}

function updateScoreInformation()
{
    // collected orange number
    var str = "Mr. X has collected <font size=\"5\" color=\"red\"><b>" + mx1.collectedOrangeCount + "</b></font>";
    if (mx1.collectedOrangeCount > 1) str += " oranges.";
    else str += " orange.";
    // game score
    str += "&nbsp;&nbsp;&nbsp;Score: <font size=\"5\" color=\"red\"><b>" + gameScore + "</b></font>";

    showInformation(str);
}

function cleanCanvas()
{
    if (gameCanvas != null && cntx != null) {
        cntx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    }
}

function MrX(x, y)
{
    // TODO how to check all images are loaded
    
    this.mxImages = new Array();
    for (var i = 1; i <= 4; i++) {
        var img = new Image();
        img.src = "images/m" + i + ".png";
        this.mxImages.push(img);
    }

    this.basketImages = new Array();
    for (var i = 0; i < 6; i++) {
        var img = new Image();
        img.src = "images/b" + i + ".png";
        this.basketImages.push(img);
    }

    this.direction = 1; // -1: from right to left; 1: from left to right
    this.collectedOrangeCount = 0;

    this.x1 = x;
    this.y1 = y;
    this.mxBox = new JSRect(0, 0, 0, 0);
    this.basketBox = new JSRect(0, 0, 0, 0);

    this.setPosition = function(x, y) {
        this.x1 = x;
        this.y1 = y;
        this.mxBox = new JSRect(this.x1, this.y1, this.x1+190, this.y1+173);
        var bax1 = 0, bay1 = 0;
        if (this.direction == -1) {
            bax1 = this.mxBox.x1-30;
            bay1 = this.mxBox.y1-40;
        } else {
            bax1 = this.mxBox.x2-68;
            bay1 = this.mxBox.y1-40;
        }
        var bax2 = bax1 + 98;
        var bay2 = bay1 + 85;
        this.basketBox = new JSRect(bax1, bay1, bax2, bay2);
    }

    this.setPosition(x, y);

    this.contained = function(r) {
        return (r.containsRect(this.mxBox) && r.containsRect(this.basketBox));
    }

    // falling in basket
    this.isFallingInBasket = function(orange) {
        var collisionRect = new JSRect(this.basketBox.x1, this.basketBox.y1, this.basketBox.x2, this.basketBox.centery());
        var ok = collisionRect.intersects(orange.box);
        if (ok) {
            ok = orange.box.y2 <= collisionRect.y2;
        }
        return ok;
    }
    // falling on head
    this.isFallingOnHead = function(orange) {
        var collisionRect = new JSRect(this.mxBox.centerx()-40, this.mxBox.y1, this.mxBox.centerx()+40, this.mxBox.centery());
        return collisionRect.intersects(orange.box);
    }

    var bindex = 1;
    this.draw = function()
    {
        var isRunning = MrXIsRunning();
        var ct = Date.now();
        if (isRunning && gamePhase == 3 && ct - changePositionTime2 > 300) {
            if (this.direction == -1) {
                if (this.bindex == 1) this.bindex = 3;
                else this.bindex = 1;
            } else {
                if (this.bindex == 0) this.bindex = 2;
                else this.bindex = 0;
            }
        } else {
            this.bindex = 1;
            this.bindex = this.direction == -1 ? 1 : 0;
            if (this.direction == -1) {
                this.bindex = gamePhase != 3 ? 1 : 3;
            } else {
                this.bindex = gamePhase != 3 ? 0 : 2;
            }
        }
        var bodyImage = this.mxImages[this.bindex];
        cntx.drawImage(bodyImage, this.mxBox.x1, this.mxBox.y1);
        if (gamePhase >= 3) {
            var baindex = this.collectedOrangeCount < this.basketImages.length ? this.collectedOrangeCount : this.basketImages.length-1;
            var basketImage = this.basketImages[baindex];
            cntx.drawImage(basketImage, this.basketBox.x1, this.basketBox.y1);
        }
        
        if (rectangleFlag) {
            cntx.strokeStyle = "red";
            var collisionRect = new JSRect(this.basketBox.x1, this.basketBox.y1, this.basketBox.x2, this.basketBox.centery());
            cntx.strokeRect(collisionRect.x1, collisionRect.y1, collisionRect.width(), collisionRect.height());
            collisionRect = new JSRect(this.mxBox.centerx()-40, this.mxBox.y1, this.mxBox.centerx()+40, this.mxBox.centery());
            cntx.strokeRect(collisionRect.x1, collisionRect.y1, collisionRect.width(), collisionRect.height());
        }
    }
}

function Orange(x, y)
{
    this.visible = true;
    this.smallSize = 6;
    this.bigSize = 30;
    this.currentLightSize = 1;
    this.middleColorPos = 1; // 0.0 - 1.0
    this.color = "green";
    this.middleColor = "green";
    this.centerColor = "green";

    this.box = new JSRect(0, 0, this.smallSize*2, this.smallSize*2);
    this.box.movecpx(x);
    this.box.movecpy(y);
    this.fallingY = 580 + Math.floor(Math.random() * 50);
    this.originalPosY = y;

    this.draw = function()
    {
        if (!this.visible) return;

        cntx.save();

        var mygradient = cntx.createRadialGradient(this.box.centerx(), this.box.centery(), this.currentLightSize,
                                                   this.box.centerx(), this.box.centery(), this.box.width()/2);
        mygradient.addColorStop(0, this.centerColor);
        mygradient.addColorStop(this.middleColorPos, this.middleColor);
        mygradient.addColorStop(1, this.color);
        cntx.fillStyle = mygradient;

        cntx.beginPath();
        cntx.arc(this.box.centerx(), this.box.centery(), this.box.width()/2, 0, Math.PI * 2);
        cntx.closePath();
        cntx.fill();
        if (rectangleFlag) {
            cntx.strokeStyle = "red";
            cntx.strokeRect(this.box.x1, this.box.y1, this.box.width(), this.box.height());
        }
        
        cntx.restore();
    }
    
    this.growing = function(elapsedTime)
    {
        this.color = "green", this.middleColor = "green", this.centerColor = "#00b000";

        if (elapsedTime < growingStep) this.currentLightSize = 1;

        this.draw();

        var currentSize = this.box.width()/2;
        var sizeStep = (this.bigSize-currentSize)*5/24;
        if (sizeStep < 0.5) sizeStep = 0.5;
        if (this.currentLightSize < 5) this.currentLightSize += 0.5;
        if (currentSize < this.bigSize) currentSize += sizeStep;
        if (currentSize > this.bigSize) currentSize = this.bigSize;
        this.box.adjustSize(currentSize*2);
    }
    
    this.maturing = function(elapsedTime)
    {
        this.color = "green", this.middleColor = "#889200", this.centerColor = "orange";
        if (elapsedTime > maturingTime*0.8) {
            this.color = "orange"
            this.middleColor = "orange"
            this.centerColor = "yellow";
        }

        if (elapsedTime < maturingStep) this.currentLightSize = 1;
        this.middleColorPos = elapsedTime / maturingTime;
        if (this.middleColorPos > 1) this.middleColorPos = 1;

        this.draw();

        if (this.currentLightSize < 5) this.currentLightSize += 5*(maturingStep/maturingTime);
    }
    
    this.falling = function(elapsedTime)
    {
        if (elapsedTime > 0 && this.box.y1 < this.fallingY) {
            var dy = Math.pow(elapsedTime/1000, 2) / 36 * (this.fallingY-this.originalPosY);
            var y = this.originalPosY + dy;
            this.box.move2y(y);
        }
    }
}

function createOranges()
{
    clearOranges();
    var orangeCount = 16;
    var startx = 300, stepx = 1060 / orangeCount;
    for (var i = 0; i < orangeCount; i++) {
        var distancex = i * stepx;
        var dx = Math.floor(Math.random() * stepx/2);
        var x1 = startx + distancex + dx;
        var y1 = 30 + Math.floor(Math.random() * 100);
        var orange1 = new Orange(x1, y1);
        oranges.push(orange1);
    }
}

function startOrangeGrowing()
{
    gamePhase = 1;
    grownTime = 0;
    growingTimer = setInterval(orangeGrowingUp, growingStep);
}

function orangeGrowingUp()
{
    for (var i = 0; i < oranges.length; i++) {
        oranges[i].growing(grownTime);
    }
    grownTime += growingStep;
    if (grownTime >= growingTime) {
        clearInterval(growingTimer);
        growingTimer = null;
    }
}

function startOrangeMaturing()
{
    gamePhase = 2;
    maturedTime = 0;
    maturingTimer = setInterval(orangeMaturing, maturingStep);
}

function orangeMaturing()
{
    for (var i = 0; i < oranges.length; i++) {
        oranges[i].maturing(maturedTime);
    }
    maturedTime += maturingStep;
    if (maturedTime >= maturingTime) {
        clearInterval(maturingTimer);
        maturingTimer = null;
    }
}
                
function orangeFallingDown()
{
    for (var i = 0; i < oranges.length; i++) {
        var spentTime = fallenTime - fallingDelayTimes[i]
        if (spentTime > 0) {
            oranges[i].falling(spentTime);
            if (!collisionDetections[i]) {
                var updateInfoFlag = false;
                if (mx1.isFallingInBasket(oranges[i])) {
                    audioHappy.play();
                    gameScore++;
                    collisionDetections[i] = true;
                    oranges[i].visible = false;
                    mx1.collectedOrangeCount++;
                    updateInfoFlag = true;
                } else if (mx1.isFallingOnHead(oranges[i])) { 
                    collisionDetections[i] = true;
                    audioUnhappy.play();
                    if (gameScore > 0) gameScore--;
                    updateInfoFlag = true;
                }
                if (updateInfoFlag) updateScoreInformation();
            }
       }
    }
    updateAll();
    
    fallenTime += fallingStep;
    if (fallenTime >= fallingTime+maxFallingDelayTime) {
        clearInterval(fallingTimer);
        fallingTimer = null;
        audioOver.play();
        audioBackground.pause();
        gamePhase = 4;
        updateAll();
    }
}

function startOrangeFalling()
{
    gamePhase = 3;
    gameScore = 0;
    fallenTime = 0;
    clearFallingControlData();
    maxFallingDelayTime = 0;
    mx1.collectedOrangeCount = 0;
    for (var i = 0; i < oranges.length; i++) {
        var stime = Math.floor(Math.random() * fallingMaximumDelay);
        fallingDelayTimes.push(stime);
        collisionDetections.push(false);
        if (i == 0 || maxFallingDelayTime < stime) {
            maxFallingDelayTime = stime;
        }
    }
    fallingTimer = setInterval(orangeFallingDown, fallingStep);
}

function drawOranges()
{
    if (oranges != null) {
        for (var i = 0; i < oranges.length; i++) {
            oranges[i].draw();
        }
    }
}

function updateAll()
{
    cleanCanvas();
    mx1.draw();
    drawOranges();
}

var changePositionTime1 = Date.now();
var changePositionTime2 = Date.now();

function MrXIsRunning()
{
    var difft = changePositionTime2 - changePositionTime1;
    var ct = Date.now();
    var ok = (difft < 1000) && (ct - changePositionTime2 < 1000);
    return ok;
}

function changeMrXPosition(dx, dy)
{
    // TODO what is running? if it is running, eyes will movement like animation
    mrxPosX += dx;
    mrxPosY += dy;
    if (dx != 0) mx1.direction = dx > 0 ? 1 : -1;
    mx1.setPosition(mrxPosX, mrxPosY);
    if (!mx1.contained(canvasBoundary)) {
        if (dx != 0) mx1.direction *= -1;
        mrxPosX -= dx;
        mrxPosY -= dy;
        mx1.setPosition(mrxPosX, mrxPosY);
    }
    changePositionTime1 = changePositionTime2;
    changePositionTime2 = Date.now();

    updateAll();
}

function doKeyDown(e)
{
    e.preventDefault();

    switch(e.keyCode)
    {
        case 37: { // Left Arrow						
            changeMrXPosition(-moveStep, 0);
            break;
        }
        case 38: { // Up Arrow						
            changeMrXPosition(0, -moveStep);
            break;
        }
        case 39: { // Right Arrow						
            changeMrXPosition(moveStep, 0);
            break;
        }
        case 40: { // Down Arrow						
            changeMrXPosition(0, moveStep);
            break;
        }
        case 16: { // shift
            rectangleFlag = !rectangleFlag;
            var info = document.getElementById("debug_information");
            if (info != null) {
                if (rectangleFlag) {
                    info.innerHTML = "<font color=\"green\"><b>The debug status has been turned on, press Shift to turn off.</b></font>";

                } else {
                    info.innerHTML = "";
                }
            }
            updateAll();
            break;
        }
    }
}

