// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// no meaningful scenes to draw - you will fill it in (at the bottom of the file) with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes you see drawn are coded, and where to fill in your own code.

"use strict"      // Selects strict javascript
var canvas, canvas_size, shaders, gl = null, g_addrs,          // Global variables
    thrust = vec3(), 	origin = vec3( 0, 10, -15 ), looking = false, prev_time = 0, animate = false, animation_time = 0, gouraud = false, color_normals = false;

// *******************************************************
// IMPORTANT -- Any new variables you define in the shader programs need to be in the list below, so their GPU addresses get retrieved.

var shader_variable_names = [ "camera_transform", "camera_model_transform", "projection_camera_model_transform", "camera_model_transform_normal",
    "shapeColor", "lightColor", "lightPosition", "attenuation_factor", "ambient", "diffusivity", "shininess", "smoothness",
    "animation_time", "COLOR_NORMALS", "GOURAUD", "USE_TEXTURE" ];

function Color( r, g, b, a ) { return vec4( r, g, b, a ); }     // Colors are just special vec4s expressed as: ( red, green, blue, opacity )
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( Color( .8,.3,.8,1 ), .1, 1, 1, 40, undefined ) ); }

// *******************************************************
// IMPORTANT -- In the line below, add the filenames of any new images you want to include for textures!

var texture_filenames_to_load = [ "stars.png", "text.png", "earth.gif" ];

window.onload = function init() {	var anim = new Animation();	}   // Our whole program's entry point

// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- 
// which OpenGL is told to call upon every time a draw / keyboard / mouse event happens.
function Animation()    // A class.  An example of a displayable object that our class GL_Context can manage.
{
    ( function init( self )
    {
        self.context = new GL_Context( "gl-canvas", Color( 0, 0, 0, 1 ) );    // Set your background color here
        self.context.register_display_object( self );

        shaders = { "Default":     new Shader( "vertex-shader-id", "fragment-shader-id" ),
            "Demo_Shader": new Shader( "vertex-shader-id", "demo-shader-id"     )  };

        for( var i = 0; i < texture_filenames_to_load.length; i++ )
            initTexture( texture_filenames_to_load[i], true );
        self.mouse = { "from_center": vec2() };

        self.m_strip       = new Old_Square();                // At the beginning of our program, instantiate all shapes we plan to use,
        self.m_tip         = new Tip( 3, 10 );                // each with only one instance in the graphics card's memory.
        self.m_cylinder    = new Cylindrical_Tube( 10, 10 );  // For example we'll only create one "cube" blueprint in the GPU, but we'll re-use
        self.m_torus       = new Torus( 25, 25 );             // it many times per call to display to get multiple cubes in the scene.
        self.m_sphere      = new Sphere( 10, 10 );
        self.poly          = new N_Polygon( 7 );
        self.m_cone        = new Cone( 10, 10 );
        self.m_capped      = new Capped_Cylinder( 4, 12 );
        self.m_prism       = new Prism( 8, 8 );
        self.m_cube        = new Cube();
        self.m_obj         = new Shape_From_File( "teapot.obj", scale( .1, .1, .1 ) );
        self.m_sub         = new Subdivision_Sphere( 4, true );
        self.m_axis        = new Axis();

// 1st parameter is our starting camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        self.graphicsState = new GraphicsState( translation(0, 0,-25), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

        // Custom
        self.beeGenerator = new BeeGenerator();

        self.context.render();
    } ) ( this );

// *** Mouse controls: ***
    var mouse_position = function( e ) { return vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2 ); };   // Measure mouse steering, for rotating the flyaround camera.
    canvas.addEventListener("mouseup",   ( function(self) { return function(e)	{ e = e || window.event;		self.mouse.anchor = undefined;              } } ) (this), false );
    canvas.addEventListener("mousedown", ( function(self) { return function(e)	{	e = e || window.event;    self.mouse.anchor = mouse_position(e);      } } ) (this), false );
    canvas.addEventListener("mousemove", ( function(self) { return function(e)	{ e = e || window.event;    self.mouse.from_center = mouse_position(e); } } ) (this), false );
    canvas.addEventListener("mouseout", ( function(self) { return function(e)	{ self.mouse.from_center = vec2(); }; } ) (this), false );        // Stop steering if the mouse leaves the canvas.
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
    shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
    shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
    shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
    shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
    shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
    shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
    shortcut.add( "f",     function() { looking = !looking; } );
    shortcut.add( ",",   ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0,  1 ), self.graphicsState.camera_transform       ); } } ) (this) ) ;
    shortcut.add( ".",   ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0, -1 ), self.graphicsState.camera_transform       ); } } ) (this) ) ;
    shortcut.add( "o",   ( function(self) { return function() { origin = vec3( mult_vec( inverse( self.graphicsState.camera_transform ), vec4(0,0,0,1) )                       ); } } ) (this) ) ;
    shortcut.add( "r",   ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
    shortcut.add( "ALT+g", function() { gouraud = !gouraud; } );
    shortcut.add( "ALT+n", function() { color_normals = !color_normals;	} );
    shortcut.add( "ALT+a", function() { animate = !animate; } );
    shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; }; } ) (this) );
    shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; }; } ) (this) );
}

Animation.prototype.update_strings = function( debug_screen_strings )	      // Strings that this displayable object (Animation) contributes to the UI:	
{
    debug_screen_strings.string_map["time"]    = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
    debug_screen_strings.string_map["basis"]   = "Showing basis: " + this.m_axis.basis_selection;
    debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
    debug_screen_strings.string_map["thrust"]  = "Thrust: " + thrust;
}

function update_camera( self, animation_delta_time )
{
    var leeway = 70,  degrees_per_frame = .0004 * animation_delta_time,
        meters_per_frame  =   .01 * animation_delta_time;

    if( self.mouse.anchor ) // Dragging mode: Is a mouse drag occurring?
    {
        var dragging_vector = subtract( self.mouse.from_center, self.mouse.anchor);           // Arcball camera: Spin the scene around the world origin on a user-determined axis.
        if( length( dragging_vector ) > 0 )
            self.graphicsState.camera_transform = mult( self.graphicsState.camera_transform,    // Post-multiply so we rotate the scene instead of the camera.
                mult( translation(origin),
                    mult( rotation( .05 * length( dragging_vector ), dragging_vector[1], dragging_vector[0], 0 ),
                        translation(scale_vec( -1,origin ) ) ) ) );
    }
    // Flyaround mode:  Determine camera rotation movement first
    var movement_plus  = [ self.mouse.from_center[0] + leeway, self.mouse.from_center[1] + leeway ];  // mouse_from_center[] is mouse position relative to canvas center;
    var movement_minus = [ self.mouse.from_center[0] - leeway, self.mouse.from_center[1] - leeway ];  // leeway is a tolerance from the center before it starts moving.

    for( var i = 0; looking && i < 2; i++ )			// Steer according to "mouse_from_center" vector, but don't start increasing until outside a leeway window from the center.
    {
        var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
        self.graphicsState.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
    }
    self.graphicsState.camera_transform = mult( translation( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
}

// A short function for testing.  It draws a lot of things at once.  See display() for a more basic look at how to draw one thing at a time.
Animation.prototype.test_lots_of_shapes = function( model_transform )
{
    var shapes = [ this.m_prism, this.m_capped, this.m_cone, this.m_sub, this.m_sphere, this.m_obj, this.m_torus ];   // Randomly include some shapes in a list
    var tex_names = [ undefined, "stars.png", "earth.gif" ]

    for( var i = 3; i < shapes.length + 3; i++ )      // Iterate through that list
    {
        var spiral_transform = model_transform, funny_number = this.graphicsState.animation_time/20 + (i*i)*Math.cos( this.graphicsState.animation_time/2000 );
        spiral_transform = mult( spiral_transform, rotation( funny_number, i%3 == 0, i%3 == 1, i%3 == 2 ) );
        for( var j = 1; j < 4; j++ )                                                                                  // Draw each shape 4 times, in different places
        {
            var mat = new Material( Color( i % j / 5, j % i / 5, i*j/25, 1 ), .3,  1,  1, 40, tex_names[ (i*j) % tex_names.length ] )       // Use a random material
            // The draw call:
            shapes[i-3].draw( this.graphicsState, spiral_transform, mat );			                        //  Draw the current shape in the list, passing in the current matrices
            spiral_transform = mult( spiral_transform, rotation( 63, 3, 5, 7 ) );                       //  Move a little bit before drawing the next one
            spiral_transform = mult( spiral_transform, translation( 0, 5, 0) );
        }
        model_transform = mult( model_transform, translation( 0, -3, 0 ) );
    }
    return model_transform;
}

// *******************************************************	
// display(): Called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.display = function(time)
{
    if(!time) time = 0;                                                               // Animate shapes based upon how much measured real time has transpired
    this.animation_delta_time = time - prev_time;                                     // by using animation_time
    if( animate ) this.graphicsState.animation_time += this.animation_delta_time;
    prev_time = time;

    update_camera( this, this.animation_delta_time );

    var model_transform = mat4();	            // Reset this every frame.
    this.basis_id = 0;	                      // For the "axis" shape.  This variable uniquely marks each axis we draw in display() as it counts them up.

    shaders[ "Default" ].activate();                         // Keep the flags seen by the default shader program up-to-date
    gl.uniform1i( g_addrs.GOURAUD_loc, gouraud );		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);


    // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
    // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
    this.graphicsState.lights = [];                    // First clear the light list each frame so we can replace & update lights.

    this.graphicsState.lights.push( new Light( vec4( 0, 100, 0, 1 ), Color( 1, 1, 1, 1 ), 100000 ) );

    // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
    // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
    var purplePlastic = new Material( Color( .9,.5,.9,1 ), .01, .2, .4, 40 ), // Omit the final (string) parameter if you want no texture
        greyPlastic = new Material( Color( .5,.5,.5,1 ), .01, .4, .2, 20 ),
        earth = new Material( Color( .5,.5,.5,1 ), .1,  1, .5, 40, "earth.gif" ),
        stars = new Material( Color( .5,.5,.5,1 ), .1,  1,  1, 40, "stars.png" );

    /**********************************
     Start coding down here!!!!
     **********************************/                                     // From this point on down it's just some examples for you -- feel free to comment it all out.

    var ground_transform = this.draw_ground(mult(model_transform, translation(0, -5, 0)));
    var tree_transform = this.draw_tree(mult(ground_transform, translation(2, 0, 2)));
    this.draw_bees(tree_transform);
    this.draw_focus(tree_transform);
}

// *******************************************************	
// Custom
// *******************************************************	
// *** Ground ***
// Draw ground. Return original matrix
Animation.prototype.draw_ground = function (model_transform) {
    var MAT = new Material(Color(0.23, 0.28, 0.1, 1), 1, 1, 1, 40);
    var W = 100;
    var ground_transform = mult(model_transform, scale(W, 0.1, W));

    this.m_cube.draw(this.graphicsState, ground_transform, MAT);

    return model_transform;
};

// *** Tree ***

// Draw tree. Return original matrix
Animation.prototype.draw_tree = function (model_transform) {
    // Draw trunk
    var SEGMENT_COUNT = 8;
    var current_trunk_transform = model_transform;
    for (var i = 0; i < SEGMENT_COUNT; i++) {
        current_trunk_transform = this.draw_trunk_segment(current_trunk_transform);
    }

    // Draw foliage
    this.draw_foliage(current_trunk_transform);

    return model_transform;
};

// Draw tree trunk segment. Return matrix at top of tree trunk
Animation.prototype.draw_trunk_segment = function (model_transform) {
    var W = 0.3;
    var H = 1;
    var MAT = new Material(Color(0.25, 0.15, 0, 1), 1, 1, 1, 40);
    var SWAY_PERIOD = 7000;
    var SWAY_DEGREE = 5;

    var sway_transform = this.sway(model_transform, SWAY_PERIOD, SWAY_DEGREE);

    var top_transform = mult(sway_transform, translation(0, H, 0));
    var segment_transform = top_transform;
    segment_transform = mult(segment_transform, translation(0, -H / 2, 0));
    segment_transform = mult(segment_transform, scale(W, H, W));
    this.m_cube.draw(this.graphicsState, segment_transform, MAT);

    return top_transform;
};

// Return sway transformation matrix
Animation.prototype.sway = function (model_transform, period, degree) {
    var speed = period / (4*degree);

    var time = this.graphicsState.animation_time % period;
    if (time >= 0 && time < period/4) {
        model_transform = mult(model_transform, rotation(time/speed, 0, 0, 1));
    } else if (time >= period/4 && time < period/2) {
        model_transform = mult(model_transform, rotation(-(time - period/4) / speed + degree, 0, 0, 1));
    } else if (time >= period/2 && time < period * 3/4) {
        model_transform = mult(model_transform, rotation(-(time - period/2) / speed, 0, 0, 1));
    } else {
        model_transform = mult(model_transform, rotation((time - period*3/4) / speed - degree, 0, 0, 1));
    }

    return model_transform;
};

// Draw foliage. Return original matrix
Animation.prototype.draw_foliage = function (model_transform) {
    var R = 2;
    var MAT = new Material(Color(0.5, 0.1, 0.1, 1), 1, 0.5, 0.5, 100);

    var foliage_transform = mult(model_transform, scale(R, R, R));
    foliage_transform = mult(foliage_transform, translation(0,R*0.45,0));

    this.m_sphere.draw(this.graphicsState, foliage_transform, MAT);

    return model_transform;
}

// *** Bee ***
Animation.prototype.draw_bees = function (model_transform) {
    var animation_time_integer = Math.round(this.graphicsState.animation_time);
    if (animation_time_integer===0) return model_transform;

    this.beeGenerator.createRandomBeesInterval(animation_time_integer, 1000);
    for (var i=0;i<this.beeGenerator.bees.length;i++) {
        var bee = this.beeGenerator.bees[i];

        this.draw_bee(model_transform, bee.x0, bee.y0, bee.z0, bee.creationTime, bee.lifeTime);
    }
}

// Draw a bee flying from initial (x0,y0,z0) to (0,0,0)
Animation.prototype.draw_bee = function (model_transform, x0, y0, z0, creation_time, life_time) {
    if (this.graphicsState.animation_time < creation_time) return model_transform;
    if (this.graphicsState.animation_time > creation_time+life_time) return model_transform;

    var SCALE = 0.1;

    var MAT_HEAD = new Material(Color(0.1, 0.1, 0.2, 1), 1, 1, 1, 255);
    var MAT_BODY = new Material(Color(0.2, 0.2, 0.2, 1), 1, 1, 1, 255);
    var MAT_TAIL = new Material(Color(0.3, 0.3, 0, 1), 1, 1, 1, 255);

    // calculate position
    var t = (this.graphicsState.animation_time - creation_time) / life_time;
    var x1 = x0 + t*(-x0);
    var y1 = y0 + t*(-y0);
    var z1 = z0 + t*(-z0);

    // Fly to origin
    var bee_tranform = model_transform;
    var bee_tranform = mult(bee_tranform, translation(x1, y1, z1));

    // Rotate bee to v0 direction
    var v0 = vec3(-x0,-y0,-z0);
    var initial_axis = vec3(0,0,1); 					// Initial axix bee facing
    var destination_axix = cross(v0, initial_axis);
    var destination_angle = angle_vec(v0, initial_axis)
    var bee_tranform = mult(bee_tranform, rotation(-destination_angle, destination_axix[0], destination_axix[1], destination_axix[2]));

    // Scale bee
    bee_tranform = mult(bee_tranform, scale(SCALE, SCALE, SCALE));

    // Head
    var head_transform = mult(bee_tranform, translation(0, 0, 5));
    head_transform = mult(head_transform, scale(2, 2, 2));
    this.m_sphere.draw(this.graphicsState, head_transform, MAT_HEAD);

    // Body
    var body_tranform = mult(bee_tranform, scale(3, 3, 6));
    this.m_cube.draw(this.graphicsState, body_tranform, MAT_BODY);

    // Tail
    var tail_transform = mult(bee_tranform, translation(0, 0, -8));
    tail_transform = mult(tail_transform, scale(2, 2, 6));
    this.m_sphere.draw(this.graphicsState, tail_transform, MAT_TAIL);

    // Leg
    var bee_inverted_transform = mult(bee_tranform, rotation(180, 0, 1, 0));
    var bee_leg_1 = mult(bee_tranform, translation(1.5, -1, 1));
    this.draw_leg(bee_leg_1);
    var bee_leg_2 = mult(bee_tranform, translation(1.5, -1, 0));
    this.draw_leg(bee_leg_2);
    var bee_leg_3 = mult(bee_tranform, translation(1.5, -1, -1));
    this.draw_leg(bee_leg_3);
    var bee_leg_4 = mult(bee_inverted_transform, translation(1.5, -1, 1));
    this.draw_leg(bee_leg_4);
    var bee_leg_5 = mult(bee_inverted_transform, translation(1.5, -1, 0));
    this.draw_leg(bee_leg_5);
    var bee_leg_6 = mult(bee_inverted_transform, translation(1.5, -1, -1));
    this.draw_leg(bee_leg_6);

    // Wing
    var bee_wing_1 = mult(bee_tranform, translation(1.5, 1.5, 0));
    this.draw_wing(bee_wing_1);
    var bee_wing_2 = mult(bee_inverted_transform, translation(1.5, 1.5, 0));
    this.draw_wing(bee_wing_2);

    return model_transform;
}


// Draw leg. Return original matrix
Animation.prototype.draw_leg = function (model_transform) {
    var L = 3;
    var W = 0.4;
    var ROTATION = -60;

    var SWAY_PERIOD = 2000;
    var SWAY_DEGREE = 20;

    var MAT = new Material(Color(0.2, 0.2, 0.2, 1), 1, 1, 1, 255);

    // Draw upperleg
    var upperleg_transform = mult(model_transform, rotation(ROTATION, 0, 0, 1));
    upperleg_transform = this.sway(upperleg_transform, SWAY_PERIOD, SWAY_DEGREE);
    upperleg_transform = mult(upperleg_transform, translation(L / 2, 0, 0));
    upperleg_transform = mult(upperleg_transform, scale(L, W, W));
    this.m_cube.draw(this.graphicsState, upperleg_transform, MAT);

    // Draw lower leg
    var lowerleg_transform = mult(model_transform, rotation(ROTATION, 0, 0, 1));
    lowerleg_transform = this.sway(lowerleg_transform, SWAY_PERIOD, SWAY_DEGREE);
    lowerleg_transform = mult(lowerleg_transform, translation(L, 0, 0));
    lowerleg_transform = mult(lowerleg_transform, rotation(ROTATION * 1.1, 0, 0, 1));
    lowerleg_transform = this.sway(lowerleg_transform, SWAY_PERIOD, SWAY_DEGREE);
    lowerleg_transform = mult(lowerleg_transform, translation(L / 2, 0, 0));
    lowerleg_transform = mult(lowerleg_transform, scale(L, W, W));
    this.m_cube.draw(this.graphicsState, lowerleg_transform, MAT);

    return model_transform;
};

// Draw wing. Return original matrix
Animation.prototype.draw_wing = function (model_transform) {
    var L = 10;
    var W = 4;
    var H = 0.4;
    var ROTATION = 0;

    var SWAY_PERIOD = 1000;
    var SWAY_DEGREE = 60;

    var MAT = new Material(Color(0.1, 0.1, 0.1, 1), 1, 1, 1, 255);

    var wing_tranform = mult(model_transform, rotation(ROTATION, 0, 0, 1));
    wing_tranform = this.sway(wing_tranform, SWAY_PERIOD, SWAY_DEGREE);
    wing_tranform = mult(wing_tranform, translation(L / 2, 0, 0));
    wing_tranform = mult(wing_tranform, scale(L, H, W));
    this.m_cube.draw(this.graphicsState, wing_tranform, MAT);

    return model_transform;
};

// *** Focus ***
// Draw a focus for sniper
Animation.prototype.draw_focus = function (model_transform) {
    var R = 1;  // Radius
    var D = 2;  // Distance from origin
    var MAT1 = new Material(Color(1, 0, 0, 1), 1, 1, 1, 255);
    var MAT2 = new Material(Color(0, 1, 0, 1), 1, 1, 1, 255);

    var focus_tranform = model_transform;
    focus_tranform = mult(focus_tranform, rotation(this.graphicsState.animation_time/50,1,1,1));
    focus_tranform = mult(focus_tranform, translation(0, D, 0));

    var ring1_transform = focus_tranform;
    ring1_transform = mult(ring1_transform, scale(R, R/8, R));
    ring1_transform = mult(ring1_transform, rotation(90,1,0,0));
    this.m_cylinder.draw(this.graphicsState, ring1_transform, MAT1);

    var ring2_transform = focus_tranform;
    ring2_transform = mult(ring2_transform, scale(R*0.7, R/8, R*0.7));
    ring2_transform = mult(ring2_transform, rotation(90,1,0,0));
    this.m_cylinder.draw(this.graphicsState, ring2_transform, MAT2);

    var ring3_transform = focus_tranform;
    ring3_transform = mult(ring3_transform, scale(R*0.4, R/8, R*0.4));
    ring3_transform = mult(ring3_transform, rotation(90,1,0,0));
    this.m_cylinder.draw(this.graphicsState, ring3_transform, MAT1);

    return model_transform;
}

