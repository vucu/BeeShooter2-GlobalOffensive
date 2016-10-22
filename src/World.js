//----------------------------------------------------------------------------
//
//  World
//
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

World.prototype.stepUpdate = function (currentTime) {
    for (var i=0; i<this.bullets.length; i++) {
        this.bullets[i].stepUpdate(currentTime);
    }

    for (var i=0; i<this.bees.length; i++) {
        this.bees[i].stepUpdate(currentTime);
    }

    this.detectCollision();
}

World.prototype.detectCollision = function () {

    // Collision between bullet and bee
    for (var i=0; i<this.bullets.length; i++) {
        for (var j=0; j<this.bees.length; j++) {
            var bullet = this.bullets[i];
            var bee = this.bees[j];

            var d = (bullet.x-bee.x)*(bullet.x-bee.x)
                + (bullet.y-bee.y)*(bullet.y-bee.y)
                + (bullet.z-bee.z)*(bullet.z-bee.z);
            
            if (d<1) {
                console.log("detected!")
                bee.shouldBeDeleted = true;
                bullet.shouldBeDeleted = true;
            }
        }
    }

    this.cleanup();
}

World.prototype.cleanup = function () {
    var a = [];
    for (var i=0; i<this.bullets.length; i++) {
       if (!this.bullets[i].shouldBeDeleted) {
           a.push(this.bullets[i]);
       }
    }
    this.bullets = a;

    var a = [];
    for (var i=0; i<this.bees.length; i++) {
        if (!this.bees[i].shouldBeDeleted) {
            a.push(this.bees[i]);
        }
    }
    this.bees = a;
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
    var random_x = (1-2*Math.round(Math.random()))*(20+Math.random()*40);
    var random_y = 20+Math.random()*40;
    var random_z = (1-2*Math.round(Math.random()))*(20+Math.random()*40);
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

//----------------------------------------------------------------------------
//
//  Focus
//
function Focus() {
    ( function init( self )
    {
        self.d = 5;
        self.r = 1;

        self.theta = 45;
        self.phi = 45;
        self.calculateXYZ();
    } ) ( this );
}

Focus.prototype.calculateXYZ = function () {
    this.x = this.d*Math.sin(radians(this.theta))*Math.cos(radians(this.phi));
    this.y = this.d*Math.cos(radians(this.theta));
    this.z = this.d*Math.sin(radians(this.theta))*Math.sin(radians(this.phi));
}

Focus.prototype.move = function (thetaChange, phiChange) {
    var old_theta = this.theta;
    var old_phi = this.phi ;

    this.theta = this.theta + thetaChange;
    this.phi = this.phi + phiChange;

    this.calculateXYZ();
    if (this.theta<=0) {                 // Theta can only between 0 and 90 degrees
        this.theta = old_theta;
        this.phi = old_phi;
        this.calculateXYZ();
        return;
    }
    if (this.theta>=90) {
        this.theta = old_theta;
        this.phi = old_phi;
        this.calculateXYZ();
        return;
    }
    if (this.y<1) {                     // Focus can't go too low
        this.theta = old_theta;
        this.phi = old_phi;
        this.calculateXYZ();
        return;
    }

    console.log(this.x,this.y,this.z,this.x*this.x+this.y*this.y+this.z+this.z);
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

//----------------------------------------------------------------------------
//
//  Bullet
//
function Bullet(x0, y0, z0, creationTime, lifeTime) {
    ( function init( self )
    {
        self.x0 = x0;
        self.y0 = y0;
        self.z0 = z0;
        self.creationTime = creationTime;
        self.lifeTime = lifeTime;

        self.shouldBeDeleted = false;
    } ) ( this );
}

Bullet.prototype.stepUpdate = function(currentTime) {
    if (currentTime > this.creationTime+this.lifeTime) this.shouldBeDeleted = true;

    var t = (currentTime - this.creationTime) / 100;
    this.x = this.x0 + t*(this.x0);
    this.y = this.y0 + t*(this.y0);
    this.z = this.z0 + t*(this.z0);
}

//----------------------------------------------------------------------------
//
//  Bee
//
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

        self.shouldBeDeleted = false;
    } ) ( this );
}

Bee.prototype.stepUpdate = function(currentTime) {
    if (currentTime > this.creationTime+this.lifeTime) this.shouldBeDeleted = true;

    var t = (currentTime - this.creationTime) / this.lifeTime;
    this.x = this.x0 + t*(-this.x0);
    this.y = this.y0 + t*(-this.y0);
    this.z = this.z0 + t*(-this.z0);
}
