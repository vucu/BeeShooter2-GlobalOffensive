function BeeGenerator() {
    ( function init( self )
    {
        self.bees = [];

        self.lastCreatedBee = 0;
    } ) ( this );

}

BeeGenerator.prototype.createRandomBee = function (creation_time) {
    var bee = new Bee(Math.random()*10,Math.random()*10,Math.random()*10,creation_time,10000);
    this.bees.push(bee);
}

BeeGenerator.prototype.createRandomBeesInterval = function (current_time, period) {
    var current_time_integer = Math.round(current_time);
    var delta = Math.abs(current_time_integer - this.lastCreatedBee);

    if ((current_time_integer % period < period/10)&&(delta>period/5)) {
        this.createRandomBee(current_time_integer);
        this.lastCreatedBee = current_time_integer;
        console.log(this.bees.length);
    }
}

// A Bee is defined by initial position (x0, y0, z0), destination position (x1, y1, z1), creation time
// and it's life time
function Bee(x0, y0, z0, x1, y1, z1, creationTime, lifeTime) {
    ( function init( self )
    {
        self.x0 = x0;
        self.y0 = y0;
        self.z0 = z0;
        self.x1 = x1;
        self.y1 = y1;
        self.z1 = z1;
        self.t = 0;
        self.creationTime = creationTime;
        self.lifeTime = lifeTime;

        self.update = function (currentTime) {
            self.t = (currentTime - creationTime) / lifeTime;
        }
    } ) ( this );
}

Bee.prototype.getCurrentX = function () {
    return this.x0 - this.t*this.x1;
}

Bee.prototype.getCurrentY = function () {
    return this.y0 - this.t*this.y1;
}

Bee.prototype.getCurrentZ = function () {
    return this.z0 - this.t*this.z1;
}

Bee.prototype.getRotationAxisX = function () {
    return this.x1-this.x0;
}

Bee.prototype.getRotationAxisY = function () {
    return this.y1-this.y0;
}

Bee.prototype.getRotationAxisZ = function () {
    return this.z1-this.z0;
}

Bee.prototype.getRotationAngle = function () {
    var initial_axis = vec3(0,0,1);
    var facing_axis = vec3(this.getRotationAxisX(),this.getRotationAxisY(),this.getRotationAxisZ());
    var facing_angle = angle_vec(facing_axis, initial_axis);

    return facing_angle;
}


Bee.prototype.shouldBeDestroyed = function () {
    if (this.t>1) return true;
    if (this.t<0) return true;
    return false;
}
