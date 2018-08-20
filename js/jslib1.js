
function JSRect(x1, y1, x2, y2)
{
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    this.isNull = function() {
        return (this.x1 == this.x2 || this.y1 == this.y2);
    }
    this.width = function() {
        return (this.x2 - this.x1);
    }
    this.height = function() {
        return (this.y2 - this.y1);
    }
    this.centerx = function() {
        var cx = (this.x1 + this.x2) / 2;
        return cx;
    }
    this.centery = function() {
        var cy = (this.y1 + this.y2) / 2;
        return cy;
    }
    
    this.adjustSize = function(nsize) {
        var cx = this.centerx();
        var cy = this.centery();
        this.x2 = this.x1 + nsize;
        this.y2 = this.y1+ nsize;
        this.movecp(cx, cy);
    }

    this.movex = function(dx) {
        this.x1 += dx;
        this.x2 += dx;
    }
    this.movey = function(dy) {
        this.y1 += dy;
        this.y2 += dy;
    }
    this.move2x = function(x) {
        var dx = x - this.x1;
        this.movex(dx);
    }
    this.move2y = function(y) {
        var dy = y - this.y1;
        this.movey(dy);
    }
    this.move2p = function(x, y) {
        this.move2x(x);
        this.move2y(y);
    }
    this.movecpx = function(x) {
        var x0 = (this.x1 + this.x2) / 2;
        var dx = x - x0;
        this.movex(dx);
    }
    this.movecpy = function(y) {
        var y0 = (this.y1 + this.y2) / 2;
        var dy = y - y0;
        this.movey(dy);
    }
    this.movecp = function(x, y) {
        this.movecpx(x);
        this.movecpy(y);
    }

    this.contains = function(x, y) {
        return (x >= this.x1 && x <= this.x2 && y >= this.y1 && y <= this.y2);
    }
    this.containsRect = function(r) {
        return (this.contains(r.x1, r.y1) && this.contains(r.x2, r.y2));
    }
    
    this.intersects = function (r)
    {
        if (this.contains(r.x1, r.y1)) return true;
        if (this.contains(r.x1, r.y2)) return true;
        if (this.contains(r.x2, r.y1)) return true;
        if (this.contains(r.x2, r.y2)) return true;
        if (r.contains(this.x1, this.y1)) return true;
        if (r.contains(this.x1, this.y2)) return true;
        if (r.contains(this.x2, this.y1)) return true;
        if (r.contains(this.x2, this.y2)) return true;
        return false;
    }
}

