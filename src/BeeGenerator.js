function BeeGenerator() {
    ( function init( self )
    {
        self.bees = [];

        self.lastCreatedBee = 0;
    } ) ( this );

}

BeeGenerator.prototype.createRandomBee = function (creation_time) {
    var random_x = (1-2*Math.round(Math.random()))*(5+Math.random()*10);
    var random_y = 5+Math.random()*10;
    var random_z = (1-2*Math.round(Math.random()))*(5+Math.random()*10);
    var random_life = 5000+Math.random()*10000
    var bee = new Bee(random_x,random_y,random_z,creation_time,10000);
    this.bees.push(bee);
}

BeeGenerator.prototype.createRandomBeesInterval = function (current_time, period) {
    var current_time_integer = Math.round(current_time);
    var delta = Math.abs(current_time_integer - this.lastCreatedBee);

    // Create a random bee each period
    if ((current_time_integer % period < period/10)&&(delta>period/5)) {
        this.createRandomBee(current_time_integer);
        this.lastCreatedBee = current_time_integer;
    }
}

// A Bee is defined by initial position (x0, y0, z0), destination position (x1, y1, z1), creation time
// and it's life time
function Bee(x0, y0, z0, creationTime, lifeTime) {
    ( function init( self )
    {
        self.x0 = x0;
        self.y0 = y0;
        self.z0 = z0;
        self.creationTime = creationTime;
        self.lifeTime = lifeTime;
    } ) ( this );
}
