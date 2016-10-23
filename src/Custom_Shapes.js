// *******************************************************
// The UCLA Shapes library - An attempt to generate the largest diversity of primitive 3D shapes using the smallest amount of code.
// CS 174a Graphics Example Code (Javascript or C++ versions)

// Custom_Shapes.js - Defines a number of objects that inherit from class Shape.  All Shapes have certain arrays.  Each array manages either the Shape's 3D vertex
// positions, vertex normal vectors, 2D texture coordinates, and any other per-vertex quantity.  All subclasses of Shape inherit all these arrays.
// Upon instantiation, any Shape subclass populates these lists in their own way, and then automatically makes GL calls -- special kernel
// functions to copy each of the lists one-to-one into new buffers in the graphics card's memory.



// *********** SHAPE FROM FILE ***********
// Finally, here's a versatile standalone shape that imports all its arrays' data from an .obj file.  See webgl-obj-loader.js for the rest of the relevant code.

function Shape_From_File( filename, points_transform )
	{
		Shape.call(this);

		this.draw = function( graphicsState, model_transform, material ) 	{
		 	if( this.ready ) Shape.prototype.draw.call(this, graphicsState, model_transform, material );		}

		this.filename = filename;     this.points_transform = points_transform;

		this.webGLStart = function(meshes)
			{
				for( var j = 0; j < meshes.mesh.vertices.length/3; j++ )
				{
					this.positions.push( vec3( meshes.mesh.vertices[ 3*j ], meshes.mesh.vertices[ 3*j + 1 ], meshes.mesh.vertices[ 3*j + 2 ] ) );

					this.normals.push( vec3( meshes.mesh.vertexNormals[ 3*j ], meshes.mesh.vertexNormals[ 3*j + 1 ], meshes.mesh.vertexNormals[ 3*j + 2 ] ) );
					this.texture_coords.push( vec2( meshes.mesh.textures[ 2*j ],meshes.mesh.textures[ 2*j + 1 ]  ));
				}
				this.indices  = meshes.mesh.indices;

        for( var i = 0; i < this.positions.length; i++ )                         // Apply points_transform to all points added during this call
        { this.positions[i] = vec3( mult_vec( this.points_transform, vec4( this.positions[ i ], 1 ) ) );
          this.normals[i]  = vec3( mult_vec( transpose( inverse( this.points_transform ) ), vec4( this.normals[ i ], 1 ) ) );     }

				this.init_buffers();
				this.ready = true;
			}                                                 // Begin downloading the mesh, and once it completes return control to our webGLStart function
		OBJ.downloadMeshes( { 'mesh' : filename }, (function(self) { return self.webGLStart.bind(self) }(this) ) );
	}
inherit( Shape_From_File, Shape );

Make_Shape_Subclass( "Diamond", Shape );
Diamond.prototype.populate = function( recipient, points_transform = mat4() )
{
	var offset = recipient.positions.length;
	var index_offset = recipient.indices.length;

	recipient.positions.push( vec3(1,0,0), vec3(0,2,0), vec3(0,0,1) );
	recipient.positions.push( vec3(-1,0,0), vec3(0,2,0), vec3(0,0,1) );
	recipient.positions.push( vec3(1,0,0), vec3(0,0,-1), vec3(0,2,0) );
	recipient.positions.push( vec3(-1,0,0), vec3(0,0,-1), vec3(0,2,0) );

	recipient.positions.push( vec3(0,0,1), vec3(0,-2,0), vec3(1,0,0) );
	recipient.positions.push( vec3(0,0,1), vec3(0,-2,0), vec3(-1,0,0) );
	recipient.positions.push( vec3(-1,0,0), vec3(0,-2,0), vec3(0,0,-1) );
	recipient.positions.push( vec3(1,0,0), vec3(0,-2,0), vec3(0,0,-1) );


	recipient.texture_coords.push( vec2(0,0), vec2(0,1), vec2(1,0) );
	recipient.texture_coords.push( vec2(0,0), vec2(0,1), vec2(1,0) );
	recipient.texture_coords.push( vec2(0,0), vec2(0,1), vec2(1,0) );
	recipient.texture_coords.push( vec2(0,0), vec2(0,1), vec2(1,0) );
	recipient.texture_coords.push( vec2(0,0), vec2(0,1), vec2(1,0) );
	recipient.texture_coords.push( vec2(0,0), vec2(0,1), vec2(1,0) );
	recipient.texture_coords.push( vec2(0,0), vec2(0,1), vec2(1,0) );
	recipient.texture_coords.push( vec2(0,0), vec2(0,1), vec2(1,0) );


	recipient.indices.push( 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 );
	recipient.flat_shade(offset, index_offset, true);

	for( var i = index_offset; i < recipient.indices.length; i++ )
		recipient.indices[i] += offset;

	for( var i = offset; i < recipient.positions.length; i++ )
		recipient.positions[i] = vec3( mult_vec( points_transform, vec4( recipient.positions[ i ], 1 ) ) );
};