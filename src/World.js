function World() {
    ( function init( self )
    {
        self.focus = new Focus();
        self.bullets = [];
        self.bees = [];

        self.lastCreatedBullet = 0;
        self.lastCreatedBee = 0;
    } ) ( this );
}

// Create a bullet at Focus's position
World.prototype.createBullet = function (creation_time) {
    var x = this.focus.x;
    var y = this.focus.y;
    var z = this.focus.z;
    var life = 10000;

    var bullet = new Bullet(x,y,z,creation_time,life);
    this.bullets.push(bullet);
}

// Test function
World.prototype.createRandomBulletsInterval = function (current_time, period) {
    var current_time_integer = Math.round(current_time);
    var delta = Math.abs(current_time_integer - this.lastCreatedBullet);

    // Create a random bullet each period
    if ((current_time_integer % period < period/10)&&(delta>period/5)) {
        this.createBullet(current_time_integer);
        this.lastCreatedBullet = current_time_integer;
    }
}

World.prototype.createRandomBee = function (creation_time) {
    var random_x = (1-2*Math.round(Math.random()))*(5+Math.random()*10);
    var random_y = 5+Math.random()*10;
    var random_z = (1-2*Math.round(Math.random()))*(5+Math.random()*10);
    var random_life = 5000+Math.random()*10000
    var bee = new Bee(random_x,random_y,random_z,creation_time,10000);
    this.bees.push(bee);
}

World.prototype.createRandomBeesInterval = function (current_time, period) {
    var current_time_integer = Math.round(current_time);
    var delta = Math.abs(current_time_integer - this.lastCreatedBee);

    // Create a random bee each period
    if ((current_time_integer % period < period/10)&&(delta>period/5)) {
        this.createRandomBee(current_time_integer);
        this.lastCreatedBee = current_time_integer;
    }
}

function Focus() {
    ( function init( self )
    {
        self.d = 2;
        self.r = 1;

        self.theta = 0;
        self.phi = 0;
        self.calculateXYZ();
    } ) ( this );
}

Focus.prototype.calculateXYZ = function () {
    this.x = this.d*Math.sin(this.theta)*Math.cos(this.phi);
    this.y = this.d*Math.sin(this.theta)*Math.sin(this.phi);
    this.z = this.d*Math.cos(this.phi);
}

Focus.prototype.move = function (thetaChange, phiChange) {
    this.theta = this.theta + thetaChange;
    this.phi = this.phi + phiChange;
    this.calculateXYZ();
}

Focus.prototype.getRotation = function () {
    var rotation_info = [];

    var initial_axis = vec3(0,1,0);
    var facing_axis = vec3(this.x,this.y,this.z);
    var destination_axix = cross(initial_axis, facing_axis);
    var destination_angle = angle_vec(initial_axis, facing_axis);
    rotation_info.push(destination_angle);

    rotation_info.push(destination_axix[0]);
    rotation_info.push(destination_axix[1]);
    rotation_info.push(destination_axix[2]);

    return rotation_info;
}

function Bullet(x0, y0, z0, creationTime, lifeTime) {
    ( function init( self )
    {
        self.x0 = x0;
        self.y0 = y0;
        self.z0 = z0;
        self.creationTime = creationTime;
        self.lifeTime = lifeTime;
    } ) ( this );
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
