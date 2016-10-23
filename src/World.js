//----------------------------------------------------------------------------
//
//  World
//

// global
var world;

function World() {
    ( function init( self )
    {
        world = self;
        self.reset();
        self.highScore = 0;

        self.animation_time = 0;
    } ) ( this );
}

World.prototype.reset = function () {
    this.isGameOver = false;
    this.isGodMode = false;

    this.focus = new Focus();
    this.gun = new Gun();
    this.bullets = [];
    this.beeGenerator = new BeeGenerator();
    this.bees = [];

    this.score = 0;
}

World.prototype.stepUpdate = function (currentTime) {
    this.animation_time = Math.round(currentTime);
    if (this.isGameOver) return;

    // Step update child objects
    for (var i=0; i<this.bullets.length; i++) {
        this.bullets[i].stepUpdate(currentTime);
    }
    for (var i=0; i<this.bees.length; i++) {
        this.bees[i].stepUpdate(currentTime);
    }
    this.gun.stepUpdate(currentTime);
    this.beeGenerator.stepUpdate(currentTime);

    // Generate bee if possible
    if (this.beeGenerator.canCreate()) this.bees.push(this.beeGenerator.generateBee());

    // Update difficulty
    if (this.score<200) {
        this.beeGenerator.setDifficulty(2200, 1);
    } else if (this.score<1000) {
        this.beeGenerator.setDifficulty(2000, 2);
    } else {
        // Generate difficulty depend on score;
        var factor = Math.floor(this.score / 500);

        var p = Math.max(1000, 2000 - factor*200);
        var c = Math.max(10, Math.floor(Math.sqrt(factor))-1);
        this.beeGenerator.setDifficulty(2000, 3);
    }


    // Detect collision
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
                bee.shouldBeDeleted = true;
                bullet.shouldBeDeleted = true;
                this.score+=100;
            }
        }
    }

    // Collision between bee and player
    for (var k=0; k<this.bees.length; k++) {
        var bee = this.bees[k];
        var d = bee.x*bee.x + bee.y*bee.y + bee.z*bee.z;

        if (d<1) {
            console.log("Game Over!");
            this.gameOver();
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
    this.beeGenerator.updateBeeCount(a.length);
}

// Create a bullet at Focus's position
World.prototype.createBullet = function () {
    if (this.isGameOver) return;
    if (!this.gun.canFire()) return;
    this.gun.fire();

    var x = this.focus.x;
    var y = this.focus.y;
    var z = this.focus.z;
    var life = 10000;

    var bullet = new Bullet(x,y,z,this.animation_time,life);
    this.bullets.push(bullet);
}

World.prototype.gameOver = function () {
    if (world.isGodMode) return; // Never game over in god mode

    this.isGameOver = true;
    this.bees = [];
    if (this.score>this.highScore) this.highScore = this.score;
}

//----------------------------------------------------------------------------
//
//  Focus
//
function Focus() {
    ( function init( self )
    {
        self.d = 5;
        self.r = 0.25;

        self.theta = 70;
        self.phi = 90;
        self.calculateXYZ();
    } ) ( this );
}

Focus.prototype.calculateXYZ = function () {
    this.x = this.d*Math.sin(radians(this.theta))*Math.cos(radians(this.phi));
    this.y = this.d*Math.cos(radians(this.theta));
    this.z = this.d*Math.sin(radians(this.theta))*Math.sin(radians(this.phi));
}

Focus.prototype.move = function (thetaChange, phiChange) {
    if (world.isGameOver) return;

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
//  Gun
//
// Gun determine whether it can fire or not
function Gun() {
    ( function init( self )
    {
        self.bulletCountMax = 30;
        self.timeBetweenBullet = 100;
        self.timeReload = 2500;

        // State: 0: Can fire, 1: cooldown between bullets, 2: reloading
        self.state = 0;
        self.bulletCount = self.bulletCountMax;
        self.timeSinceLastBullet = 0;
        self.timeSinceReload = 0;

        self.animationTime = 0;
    } ) ( this );
}

Gun.prototype.reload = function () {
    if (this.state==2) return;

    this.timeSinceReload = this.animationTime;
    this.state = 2;
}

Gun.prototype.canFire = function () {
    if (this.state===0) return true;

    return false;
}

Gun.prototype.fire = function () {
    if (!this.canFire()) console.log("Warning: Gun can't fire");

    this.bulletCount = this.bulletCount-1;
    if (this.bulletCount<=0) {
        this.reload();
        return;
    }

    this.timeSinceLastBullet = this.animationTime;
    this.state = 1;
}

Gun.prototype.stepUpdate = function (currentTime) {
    this.animationTime = currentTime;

    if (this.state==1) {
        if (this.animationTime>this.timeSinceLastBullet+this.timeBetweenBullet) this.state = 0;
    } else if (this.state==2) {
        if (this.animationTime>this.timeSinceReload+this.timeReload)
        {
            this.bulletCount = this.bulletCountMax;
            this.state = 0;
        }
    }
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
//  Bee Generator
//
// Contain the logic of creating bees
function BeeGenerator() {
    ( function init( self )
    {
        self.period = 1000;
        self.maxBeeCount = 3;

        self.timeSinceLastBee = 0;
        self.animationTime = 0;
        self.beeCount = 0;
    } ) ( this );
}

BeeGenerator.prototype.canCreate = function () {
    if (this.animationTime<this.timeSinceLastBee+this.period) return false;
    if (this.beeCount>=this.maxBeeCount) return false;

    return true;
}

BeeGenerator.prototype.setDifficulty = function (period, maxBeeCount) {
    this.period = period;
    this.maxBeeCount = maxBeeCount;
}

// Note: To avoid unfair difficulty, only generate bees in one plane (not 360 degrees)
// Generate a random bee
BeeGenerator.prototype.generateBee = function () {
    if (!this.canCreate()) console.log("Warning: Can't generate bee");

    var random_x = -20+Math.random()*40;
    var random_y = 20+Math.random()*20;
    var random_z = 60;
    var random_life = 5000+Math.random()*10000;

    var bee = new Bee(random_x,random_y,random_z,this.animationTime,random_life);
    this.beeCount++;
    this.timeSinceLastBee = this.animationTime;

    return bee;
}

BeeGenerator.prototype.stepUpdate = function (current_time) {
    this.animationTime = current_time;
}

BeeGenerator.prototype.updateBeeCount = function (count) {
    this.beeCount = count;
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
