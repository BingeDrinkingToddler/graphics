// Directional lighting demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE = 
'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec2 a_texcoords;\n' + //TEXTURE
  'attribute vec4 a_Normal;\n' +          // Normal
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec3 v_Lighting;\n' +
  'varying vec2 v_TexCoords;\n' + //TEXTURE
  'varying vec4 v_Color;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  if(u_isLighting)\n' + 
  '  {\n' +
  'vec3 ambientLight = vec3(0.3, 0.3, 0.3);\n'+
  'vec3 directionalLightColor = vec3(1,1,1);\n'+
  'vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));\n'+
  'vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n'+
  'float directional = max(dot(normal,u_LightDirection), 0.0);\n'+
  'v_Lighting = ambientLight + (directionalLightColor * directional);\n' +
  ' vec3 diffuse = u_LightColor * a_Color.rgb * directional;\n' +
  '     v_TexCoords = a_texcoords;\n' +  //TEXTURE
  '   v_Color = vec4(diffuse,a_Color.a);\n' +
  '  }\n' +
  '  else\n' +
  '  {\n' +
    ' v_Color = a_Color;\n' +
  '     v_TexCoords = a_texcoords;\n' + //TEXTURE
  '  }\n' + 
  '}\n';

var FSHADER_SOURCE =
'precision mediump float;\n' +
'varying vec3 v_Lighting;\n'+
'varying vec2 v_TexCoords;\n' + //TEXTURE
'varying vec4 v_Color;\n'+
'uniform sampler2D sampler;\n' +
'void main() {\n' +
'vec4 texelColor = texture2D(sampler, v_TexCoords);\n'+ //TEXTURE
'gl_FragColor = vec4(texelColor.rgb * v_Lighting, texelColor.a);\n'+ //TEXTURE
'}\n';

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)
var oar_rotate = 0; //angle of oars
var boat_posx = 0.0; //x position of boat
var boat_posz = 40.0; //z position of boat
var boat_rotate = 0; //boat rotation
var boat_direction = true;
var boat_turning = true;
var then = 0;

var brick;
var boat;
var grass;
var leaves;
var road;
var tree;
var water;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

 brick = gl.createTexture();
 brick.image = new Image();
 brick.image.src = "../Textures/brick.jpg";

 boat = gl.createTexture();
 boat.image = new Image();
 boat.image.src = "../Textures/boat.jpg";

 grass = gl.createTexture();
 grass.image = new Image();
 grass.image.src = "../Textures/grass.jpg";

 leaves = gl.createTexture();
 leaves.image = new Image();
 leaves.image.src = "../Textures/leaves.jpg";

 road = gl.createTexture();
 road.image = new Image();
 road.image.src = "../Textures/road.jpg";


 tree = gl.createTexture();
 tree.image = new Image();
 tree.image.src = "../Textures/tree.jpg";

 water = gl.createTexture();
 water.image = new Image();
 water.image.src = "../Textures/water.jpg";

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
      !u_isLighting ) { 
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([0.5, 3.0, 4.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(70, 100, 190, 10, 0, 0, 0, 1, 0);
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 400);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  };

  draw(0,gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(0,gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);

}
function initVertexBufferstri(gl) {
  // Create a triangular prism
  //    
  //     v4----v5
  //     |\    /|
  //     |  v3  |
  //     v1-|--v2  
  //      \ |  /
  //        v0
  var vertices = new Float32Array([   // Coordinates
     0.0,-0.5,0.577,  -0.5,-0.5,-0.289,  0.5,-0.5,-0.289,// v0-v1-v2 base
     0.0,-0.5,0.577,  0.0,0.5,0.577,  0.5,0.5,-0.289,   0.5,-0.5,-0.289,  // v0-v3-v5-v2 right
     0.0,-0.5,0.577,  0.0,0.5,0.577,   -0.5,0.5,-0.289,  -0.5,-0.5,-0.289,//v0-v3-v4-v1 left
     -0.5,-0.5,-0.289,  0.5,-0.5,-0.289,  0.5,0.5,-0.289,  -0.5,0.5,-0.289,//v1-v2-v5-v4 back
     0.0,0.5,0.577,  -0.5,0.5,-0.289,  0.5,0.5,-0.289//v3-v4-v5 top
  ]);


  var colors = new Float32Array([    // Colors
    0.8, 0.52, 0.25,  0.8, 0.52, 0.25,  0.8, 0.52, 0.25,     // v0-v1-v2 base
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25, 0.8, 0.52, 0.25,    // v0-v3-v5-v2 right
    0.8, 0.52, 0.25,  0.8, 0.52, 0.25,  0.8, 0.52, 0.25, 0.8, 0.52, 0.25,     // v0-v3-v4-v1 left
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25,    // v1-v2-v5-v4 back
    0.8, 0.52, 0.25,  0.8, 0.52, 0.25,   0.8, 0.52, 0.25     //v3-v4-v5 top
 ]);


  var normals = new Float32Array([    // Normal
    0.0, -1.0, 0.0,   0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  // v0-v1-v2 base
    -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,  // v0-v3-v5-v2 right
    0.5, 0.0, 0.866,   0.5, 0.0, 0.866,   0.5, 0.0, 0.866,   0.5, 0.0, 0.866,  //  v0-v3-v4-v1 left
    0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  // v1-v2-v5-v4 back
    0.0,1.0, 0.0,   0.0,1.0, 0.0,    0.0,1.0, 0.0   // v3-v4-v5 top
  ]);

  var texCoords = new Float32Array([
    0.5, 1.0,   0.0, 0.0,   1.0, 0.0, // v0-v1-v2 base
    0.0, 0.0,   0.0, 1.0,   1.0, 1.0,   1.0, 0.0, // v0-v3-v5-v2 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, //  v0-v3-v4-v1 left
    1.0, 0.0,   0.0, 0.0,   0.0, 1.0,   1.0, 1.0, // v1-v2-v5-v4 back
    0.5, 1.0,   1.0, 0.0,   0.0, 0.0 // v3-v4-v5 top
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
   0,1,2, //base 0 1 2
   3,4,6,  4,5,6, //right 3 4 5 6
   7,8,10, 8,9,10, //left 7 8 9 10
   11,12,14,  12,13,14, //back 11 12 13 14
    15,16,17//top 15 16 17
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindTexture(gl.TEXTURE_2D, brick);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, brick.image);
  
  gl.activeTexture(gl.TEXTURE0);

  return indices.length;
}

function initVertexBufferstribrown(gl) {
  // Create a triangular prism
  //    
  //     v4----v5
  //     |\    /|
  //     |  v3  |
  //     v1-|--v2  
  //      \ |  /
  //        v0
  var vertices = new Float32Array([   // Coordinates
     0.0,-0.5,0.577,  -0.5,-0.5,-0.289,  0.5,-0.5,-0.289,// v0-v1-v2 base
     0.0,-0.5,0.577,  0.0,0.5,0.577,  0.5,0.5,-0.289,   0.5,-0.5,-0.289,  // v0-v3-v5-v2 right
     0.0,-0.5,0.577,  0.0,0.5,0.577,   -0.5,0.5,-0.289,  -0.5,-0.5,-0.289,//v0-v3-v4-v1 left
     -0.5,-0.5,-0.289,  0.5,-0.5,-0.289,  0.5,0.5,-0.289,  -0.5,0.5,-0.289,//v1-v2-v5-v4 back
     0.0,0.5,0.577,  -0.5,0.5,-0.289,  0.5,0.5,-0.289//v3-v4-v5 top
  ]);


  var colors = new Float32Array([    // Colors
    0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,     // v0-v1-v2 base
    0.410, 0.304, 0.172,   0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,    // v0-v3-v5-v2 right
    0.410, 0.304, 0.172,   0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,     // v0-v3-v4-v1 left
    0.410, 0.304, 0.172,   0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,     // v1-v2-v5-v4 back
    0.410, 0.304, 0.172,  0.410, 0.304, 0.172,   0.410, 0.304, 0.172,    //v3-v4-v5 top
 ]);


  var normals = new Float32Array([    // Normal
    0.0, -1.0, 0.0,   0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  // v0-v1-v2 base
    -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,  // v0-v3-v5-v2 right
    0.5, 0.0, 0.866,   0.5, 0.0, 0.866,   0.5, 0.0, 0.866,   0.5, 0.0, 0.866,  //  v0-v3-v4-v1 left
    0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  // v1-v2-v5-v4 back
    0.0,1.0, 0.0,   0.0,1.0, 0.0,    0.0,1.0, 0.0   // v3-v4-v5 top
  ]);

  var texCoords = new Float32Array([
    0.5, 1.0,   0.0, 0.0,   1.0, 0.0, // v0-v1-v2 base
    0.0, 0.0,   0.0, 1.0,   1.0, 1.0,   1.0, 0.0, // v0-v3-v5-v2 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, //  v0-v3-v4-v1 left
    1.0, 0.0,   0.0, 0.0,   0.0, 1.0,   1.0, 1.0, // v1-v2-v5-v4 back
    0.5, 1.0,   1.0, 0.0,   0.0, 0.0 // v3-v4-v5 top
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
   0,1,2, //base 0 1 2
   3,4,6,  4,5,6, //right 3 4 5 6
   7,8,10, 8,9,10, //left 7 8 9 10
   11,12,14,  12,13,14, //back 11 12 13 14
    15,16,17//top 15 16 17
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindTexture(gl.TEXTURE_2D, boat);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, boat.image);
  
  gl.activeTexture(gl.TEXTURE0);

  return indices.length;
}

function initVertexBufferstrigreen(gl) {
  // Create a triangular prism
  //    
  //     v4----v5
  //     |\    /|
  //     |  v3  |
  //     v1-|--v2  
  //      \ |  /
  //        v0
  var vertices = new Float32Array([   // Coordinates
     0.0,-0.5,0.577,  -0.5,-0.5,-0.289,  0.5,-0.5,-0.289,// v0-v1-v2 base
     0.0,-0.5,0.577,  0.0,0.5,0.577,  0.5,0.5,-0.289,   0.5,-0.5,-0.289,  // v0-v3-v5-v2 right
     0.0,-0.5,0.577,  0.0,0.5,0.577,   -0.5,0.5,-0.289,  -0.5,-0.5,-0.289,//v0-v3-v4-v1 left
     -0.5,-0.5,-0.289,  0.5,-0.5,-0.289,  0.5,0.5,-0.289,  -0.5,0.5,-0.289,//v1-v2-v5-v4 back
     0.0,0.5,0.577,  -0.5,0.5,-0.289,  0.5,0.5,-0.289//v3-v4-v5 top
  ]);


  var colors = new Float32Array([    // Colors
    0.2916, 0.5928, 0.0,  0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0,     // v0-v1-v2 base
    0.2916, 0.5928, 0.0,  0.2916, 0.5928,0.0,  0.2916, 0.5928, 0.0,  0.2916, 0.5928,0.0,    // v0-v3-v5-v2 right
    0.2916, 0.5928, 0.0,  0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0,  0.2916, 0.5928, 0.0,   // v0-v3-v4-v1 left
    0.2916, 0.5928, 0.0,  0.2916, 0.5928,0.0,  0.2916, 0.5928, 0.0,  0.2916, 0.5928,  0.0,  // v1-v2-v5-v4 back
    0.2916, 0.5928, 0.0,  0.2916, 0.5928, 0.0,   0.2916, 0.5928, 0.0   //v3-v4-v5 top
 ]);


  var normals = new Float32Array([    // Normal
    0.0, -1.0, 0.0,   0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  // v0-v1-v2 base
    -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,  // v0-v3-v5-v2 right
    0.5, 0.0, 0.866,   0.5, 0.0, 0.866,   0.5, 0.0, 0.866,   0.5, 0.0, 0.866,  //  v0-v3-v4-v1 left
    0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  // v1-v2-v5-v4 back
    0.0,1.0, 0.0,   0.0,1.0, 0.0,    0.0,1.0, 0.0   // v3-v4-v5 top
  ]);

  var texCoords = new Float32Array([
    0.5, 1.0,   0.0, 0.0,   1.0, 0.0, // v0-v1-v2 base
    0.0, 0.0,   0.0, 1.0,   1.0, 1.0,   1.0, 0.0, // v0-v3-v5-v2 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, //  v0-v3-v4-v1 left
    1.0, 0.0,   0.0, 0.0,   0.0, 1.0,   1.0, 1.0, // v1-v2-v5-v4 back
    0.5, 1.0,   1.0, 0.0,   0.0, 0.0 // v3-v4-v5 top
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
   0,1,2, //base 0 1 2
   3,4,6,  4,5,6, //right 3 4 5 6
   7,8,10, 8,9,10, //left 7 8 9 10
   11,12,14,  12,13,14, //back 11 12 13 14
    15,16,17//top 15 16 17
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


  gl.bindTexture(gl.TEXTURE_2D, grass);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, grass.image);
 
  gl.activeTexture(gl.TEXTURE0);

  return indices.length;
}

function initVertexBuffershex(gl) {
  // Create a haxagonal prism
  //
  //      v10---v9
  //    /  |    |  \
  //  v11  |    |  v8
  //   | \v4----v3/ |
  //   | /v6----v7\ |    
  //   v5 |      | v2   
  //    \ |      | / 
  //      v0----v1
  var vertices = new Float32Array([   // Coordinates
     0.0,-0.5,0.0,  -0.5,-0.5, 0.866,  0.5,-0.5,0.866,  1.0,-0.5,0.0,  0.5,-0.5,-0.866,  -0.5,-0.5,-0.866,  -1.0,-0.5,0.0, //c-v0-v1-v2-v3-v4-v5 base
     -0.5,-0.5,0.866,  -0.5,0.5,0.866,  0.5,0.5,0.866,  0.5,-0.5,0.866,   //v0-v6-v7-v1 front
    -1.0,-0.5,0.0,  -1.0,0.5,0.0,   -0.5,0.5,0.866,  -0.5,-0.5, 0.866, //v5-v11-v6-v0 front left
    -1.0,-0.5,0.0,  -1.0,0.5,0.0,  -0.5,0.5,-0.866,   -0.5,-0.5,-0.866,  //v5-v11-v10-v4 back left
    -0.5,-0.5,-0.866,  0.5,-0.5,-0.866,  0.5,0.5,-0.866,  -0.5,0.5,-0.866,  //v4-v3-v9-v10 back
    0.5,-0.5,-0.866,  0.5,0.5,-0.866,  1.0,0.5,0.0,  1.0,-0.5,0.0,  //v3-v9-v8-v2 back right
    1.0,-0.5,0.0,  1.0,0.5,0.0,  0.5,0.5,0.866, 0.5,-0.5,0.866, //v2-v8-v7-v1 front right
    0.0,0.5,0.0,  -0.5,0.5,0.866,  0.5,0.5,0.866,  1.0,0.5,0.0,  0.5,0.5,-0.866,   -0.5,0.5,-0.866,  -1.0,0.5,0.0 //c-v6-v7-v8-v9-10-v11 top
  ]);


  var colors = new Float32Array([    // Colors
    0.312, 0.234, 0.132,    0.312, 0.234, 0.132,   0.312, 0.234, 0.132,    0.312, 0.234, 0.132, 0.312, 0.234, 0.132,    0.312, 0.234, 0.132, 0.312, 0.234, 0.132,   // c-v0-v1-v2-v3-v4-v5 base
    0.312, 0.234, 0.132,    0.312, 0.234, 0.132,   0.312, 0.234, 0.132,    0.312, 0.234, 0.132,    // v0-v6-v7-v1 front
    0.312, 0.234, 0.132,    0.312, 0.234, 0.132,   0.312, 0.234, 0.132,    0.312, 0.234, 0.132,     // v5-v11-v6-v0 front left
    0.312, 0.234, 0.132,    0.312, 0.234, 0.132,  0.312, 0.234, 0.132,    0.312, 0.234, 0.132,    // v5-v11-v10-v4 back left
    0.312, 0.234, 0.132,    0.312, 0.234, 0.132,   0.312, 0.234, 0.132,    0.312, 0.234, 0.132,    // v4-v3-v9-v10 back
    0.312, 0.234, 0.132,    0.312, 0.234, 0.132,  0.312, 0.234, 0.132,    0.312, 0.234, 0.132,    // v3-v9-v8-v2 back right
    0.312, 0.234, 0.132,    0.312, 0.234, 0.132,  0.312, 0.234, 0.132,    0.312, 0.234, 0.132,    // v2-v8-v7-v1 front right
    0.312, 0.234, 0.132,    0.312, 0.234, 0.132,   0.312, 0.234, 0.132,    0.312, 0.234, 0.132,　0.312, 0.234, 0.132,    0.312, 0.234, 0.132,  0.312, 0.234, 0.132, // c-v6-v7-v8-v9-v10-v11 top
 ]);


  var normals = new Float32Array([    // Normal
    0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0,  0.0, -1.0, 0.0,   0.0, -1.0, 0.0,  0.0, -1.0, 0.0,//c-v0-v1-v2-v3-v4-v5 base
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v6-v7-v1 front
    -0.5, 0.0, 0.866,  -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,  -0.5, 0.0, 0.866,  // v5-v11-v6-v0 front left
    -0.5, 0.0, -0.866,  -0.5, 0.0, -0.866,  -0.5, 0.0, -0.866,  -0.5, 0.0, -0.866,  //v5-v11-v10-v4 back left
    0.0,0.0, -1.0,   0.0,0.0, -1.0,   0.0,0.0, -1.0,   0.0,0.0, -1.0,  // //v4-v3-v9-v10 back
    0.5, 0.0,-0.866,  0.5, 0.0,-0.866,   0.5, 0.0,-0.866,  0.5, 0.0,-0.866,  //v3-v9-v8-v2 back right
    0.5, 0.0,0.866,   0.5, 0.0,0.866,   0.5, 0.0,0.866,   0.5, 0.0,0.866,  // v2-v8-v7-v1 front right
    0.0, 1.0,0.0,   0.0, 1.0,0.0,    0.0, 1.0,0.0,    0.0, 1.0,0.0,  0.0,1.0,0.0,  0.0,1.0,0.0,  0.0,1.0,0.0 // v6-v7-v8-v9-10-v11 top
  ]);

  var texCoords = new Float32Array([
   0.5,0.5,   0.25, 0.0,  0.75, 0.0,   1.0, 0.5,   0.75, 1.0,   0.25, 1.0,   0.0, 0.5,  //c-v0-v1-v2-v3-v4-v5 base
   0.0, 0.0,   0.0, 1.0,   1.0, 1.0,   1.0, 0.0, // v0-v6-v7-v1 front
   0.0, 0.0,   0.0, 1.0,   1.0, 1.0,   1.0, 0.0, // v5-v11-v6-v0 front left
   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, //v5-v11-v10-v4 back left
   1.0, 0.0,   0.0, 0.0,   0.0, 1.0,   1.0, 1.0, //v4-v3-v9-v10 back
   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, //v3-v9-v8-v2 back right
   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, // v2-v8-v7-v1 front right
   0.5, 0.5,   0.25, 0.0,  0.75, 0.0,   1.0, 0.5,   0.75, 1.0,   0.25, 1.0,   0.0, 0.5// c-v6-v7-v8-v9-v10-v11 top
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0,1,2,  0,2,3,  0,3,4,  0,4,5,  0,5,6,  0,1,6, //base
     7,8,10, 8,9,10,//front 7 8 9 10
     11,12,14,  12,13,14, //front left 11 12 13 14
     15,16,18, 16,17,18,//back left 15 16 17 18
     19,20,22, 20,21,22,//back 19 20 21 22
     23,24,26, 24,25,26,//back right 23 24 25 26
     27,28,30, 28,29,30,//front right 27 28 29 30
     31,32,33, 31,33,34, 31,34,35, 31,35,36, 31,36,37,  31,37,32//top 31 32 33 34 35 36 37
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

 
  gl.bindTexture(gl.TEXTURE_2D, tree);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tree.image);
  
  gl.activeTexture(gl.TEXTURE0);


  return indices.length;
}

function initVertexBuffershexbrown(gl) {
  // Create a haxagonal prism
  //
  //      v10---v9
  //    /  |    |  \
  //  v11  |    |  v8
  //   | \v4----v3/ |
  //   | /v6----v7\ |    
  //   v5 |      | v2   
  //    \ |      | / 
  //      v0----v1
  var vertices = new Float32Array([   // Coordinates
     0.0,-0.5,0.0,  -0.5,-0.5, 0.866,  0.5,-0.5,0.866,  1.0,-0.5,0.0,  0.5,-0.5,-0.866,  -0.5,-0.5,-0.866,  -1.0,-0.5,0.0, //c-v0-v1-v2-v3-v4-v5 base
     -0.5,-0.5,0.866,  -0.5,0.5,0.866,  0.5,0.5,0.866,  0.5,-0.5,0.866,   //v0-v6-v7-v1 front
    -1.0,-0.5,0.0,  -1.0,0.5,0.0,   -0.5,0.5,0.866,  -0.5,-0.5, 0.866, //v5-v11-v6-v0 front left
    -1.0,-0.5,0.0,  -1.0,0.5,0.0,  -0.5,0.5,-0.866,   -0.5,-0.5,-0.866,  //v5-v11-v10-v4 back left
    -0.5,-0.5,-0.866,  0.5,-0.5,-0.866,  0.5,0.5,-0.866,  -0.5,0.5,-0.866,  //v4-v3-v9-v10 back
    0.5,-0.5,-0.866,  0.5,0.5,-0.866,  1.0,0.5,0.0,  1.0,-0.5,0.0,  //v3-v9-v8-v2 back right
    1.0,-0.5,0.0,  1.0,0.5,0.0,  0.5,0.5,0.866, 0.5,-0.5,0.866, //v2-v8-v7-v1 front right
    0.0,0.5,0.0,  -0.5,0.5,0.866,  0.5,0.5,0.866,  1.0,0.5,0.0,  0.5,0.5,-0.866,   -0.5,0.5,-0.866,  -1.0,0.5,0.0 //c-v6-v7-v8-v9-10-v11 top
  ]);


  var colors = new Float32Array([    // Colors
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,    0.8, 0.52, 0.25, 0.8, 0.52, 0.25,  0.8, 0.52, 0.25,  0.8, 0.52, 0.25,  0.8, 0.52, 0.25,   // c-v0-v1-v2-v3-v4-v5 base
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25, 0.8, 0.52, 0.25,     // v0-v6-v7-v1 front
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25, 0.8, 0.52, 0.25,      // v5-v11-v6-v0 front left
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25, 0.8, 0.52, 0.25,     // v5-v11-v10-v4 back left
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25, 0.8, 0.52, 0.25,     // v4-v3-v9-v10 back
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25, 0.8, 0.52, 0.25,    // v3-v9-v8-v2 back right
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25, 0.8, 0.52, 0.25,     // v2-v8-v7-v1 front right
    0.8, 0.52, 0.25,     0.8, 0.52, 0.25,    0.8, 0.52, 0.25,    0.8, 0.52, 0.25,　 0.8, 0.52, 0.25,   0.8, 0.52, 0.25,   0.8, 0.52, 0.25, // c-v6-v7-v8-v9-v10-v11 top
 ]);

 

  var normals = new Float32Array([    // Normal
    0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0,  0.0, -1.0, 0.0,   0.0, -1.0, 0.0,  0.0, -1.0, 0.0,//c-v0-v1-v2-v3-v4-v5 base
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v6-v7-v1 front
    -0.5, 0.0, 0.866,  -0.5, 0.0, 0.866,   -0.5, 0.0, 0.866,  -0.5, 0.0, 0.866,  // v5-v11-v6-v0 front left
    -0.5, 0.0, -0.866,  -0.5, 0.0, -0.866,  -0.5, 0.0, -0.866,  -0.5, 0.0, -0.866,  // //v5-v11-v10-v4 back left
    0.0,0.0, -1.0,   0.0,0.0, -1.0,   0.0,0.0, -1.0,   0.0,0.0, -1.0,  // //v4-v3-v9-v10 back
    0.5, 0.0,-0.866,  0.5, 0.0,-0.866,   0.5, 0.0,-0.866,  0.5, 0.0,-0.866,  //v3-v9-v8-v2 back right
    0.5, 0.0,0.866,   0.5, 0.0,0.866,   0.5, 0.0,0.866,   0.5, 0.0,0.866,  // v2-v8-v7-v1 front right
    0.0, 1.0,0.0,   0.0, 1.0,0.0,    0.0, 1.0,0.0,    0.0, 1.0,0.0,  0.0,1.0,0.0,  0.0,1.0,0.0,  0.0,1.0,0.0 // v6-v7-v8-v9-10-v11 top
  ]);

  var texCoords = new Float32Array([
    0.5,0.5,   0.25, 0.0,  0.75, 0.0,   1.0, 0.5,   0.75, 1.0,   0.25, 1.0,   0.0, 0.5,  //c-v0-v1-v2-v3-v4-v5 base
    0.0, 0.0,   0.0, 1.0,   1.0, 1.0,   1.0, 0.0, // v0-v6-v7-v1 front
    0.0, 0.0,   0.0, 1.0,   1.0, 1.0,   1.0, 0.0, // v5-v11-v6-v0 front left
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, //v5-v11-v10-v4 back left
    1.0, 0.0,   0.0, 0.0,   0.0, 1.0,   1.0, 1.0, //v4-v3-v9-v10 back
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, //v3-v9-v8-v2 back right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, // v2-v8-v7-v1 front right
    0.5, 0.5,   0.25, 0.0,  0.75, 0.0,   1.0, 0.5,   0.75, 1.0,   0.25, 1.0,   0.0, 0.5// c-v6-v7-v8-v9-v10-v11 top
   ]);
 

  // Indices of the vertices
  var indices = new Uint8Array([
     0,1,2,  0,2,3,  0,3,4,  0,4,5,  0,5,6,  0,1,6, //base
     7,8,10, 8,9,10,//front 7 8 9 10
     11,12,14,  12,13,14, //front left 11 12 13 14
     15,16,18, 16,17,18,//back left 15 16 17 18
     19,20,22, 20,21,22,//back 19 20 21 22
     23,24,26, 24,25,26,//back right 23 24 25 26
     27,28,30, 28,29,30,//front right 27 28 29 30
     31,32,33, 31,33,34, 31,34,35, 31,35,36, 31,36,37,  31,37,32//top 31 32 33 34 35 36 37
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;
  

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  
  gl.bindTexture(gl.TEXTURE_2D, brick);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, brick.image);
  
  gl.activeTexture(gl.TEXTURE0);


  return indices.length;
}

function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25, 0.8, 0.52, 0.25,     // v0-v1-v2-v3 front
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25,  0.8, 0.52, 0.25,    // v0-v3-v4-v5 right
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,   0.8, 0.52, 0.25, 0.8, 0.52, 0.25,     // v0-v5-v6-v1 up
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25,  0.8, 0.52, 0.25,     // v1-v6-v7-v2 left
    0.8, 0.52, 0.25,  0.8, 0.52, 0.25,  0.8, 0.52, 0.25,  0.8, 0.52, 0.25,    // v7-v4-v3-v2 down
    0.8, 0.52, 0.25,   0.8, 0.52, 0.25,   0.8, 0.52, 0.25,  0.8, 0.52, 0.25　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v0-v1-v2-v3 front
    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0, // v0-v3-v4-v5 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, // v0-v5-v6-v1 up
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v1-v6-v7-v2 left
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // v7-v4-v3-v2 down
    0.0, 0.0,   1.0, 0.0,   0.0, 1.0,   1.0, 1.0 // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


 
  gl.bindTexture(gl.TEXTURE_2D, brick);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, brick.image);
   
   gl.activeTexture(gl.TEXTURE0);

  return indices.length;
}

function initVertexBuffersCubeBrown(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    0.410, 0.304, 0.172,   0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,     // v0-v1-v2-v3 front
    0.410, 0.304, 0.172,   0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,    // v0-v3-v4-v5 right
    0.410, 0.304, 0.172,   0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,     // v0-v5-v6-v1 up
    0.410, 0.304, 0.172,   0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,     // v1-v6-v7-v2 left
    0.410, 0.304, 0.172,   0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,    // v7-v4-v3-v2 down
    0.410, 0.304, 0.172,   0.410, 0.304, 0.172, 0.410, 0.304, 0.172, 0.410, 0.304, 0.172,　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v0-v1-v2-v3 front
    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0, // v0-v3-v4-v5 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, // v0-v5-v6-v1 up
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v1-v6-v7-v2 left
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // v7-v4-v3-v2 down
    0.0, 0.0,   1.0, 0.0,   0.0, 1.0,   1.0, 1.0 // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


  gl.bindTexture(gl.TEXTURE_2D, boat);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, boat.image);
 
  gl.activeTexture(gl.TEXTURE0);


  return indices.length;
}

function initVertexBuffersCubeBlue(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    0.0, 0.2, 0.4,   0.0, 0.2, 0.4,  0.0, 0.2, 0.4,  0.0, 0.2, 0.4,     // v0-v1-v2-v3 front
    0.0, 0.2, 0.4,   0.0, 0.2, 0.4,  0.0, 0.2, 0.4,  0.0, 0.2, 0.4,    // v0-v3-v4-v5 right
    0.0, 0.2, 0.4,   0.0, 0.2, 0.4,   0.0, 0.2, 0.4, 0.0, 0.2, 0.4,     // v0-v5-v6-v1 up
    0.0, 0.2, 0.4,   0.0, 0.2, 0.4,  0.0, 0.2, 0.4,  0.0, 0.2, 0.4,     // v1-v6-v7-v2 left
    0.0, 0.2, 0.4,  0.0, 0.2, 0.4, 0.0, 0.2, 0.4,  0.0, 0.2, 0.4,    // v7-v4-v3-v2 down
    0.0, 0.2, 0.4,  0.0, 0.2, 0.4,   0.0, 0.2, 0.4,  0.0, 0.2, 0.4,　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v0-v1-v2-v3 front
    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0, // v0-v3-v4-v5 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, // v0-v5-v6-v1 up
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v1-v6-v7-v2 left
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // v7-v4-v3-v2 down
    0.0, 0.0,   1.0, 0.0,   0.0, 1.0,   1.0, 1.0 // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindTexture(gl.TEXTURE_2D, water);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, water.image);
  
  gl.activeTexture(gl.TEXTURE0);


  return indices.length;
}

function initVertexBuffersCubeMud(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0,     // v0-v1-v2-v3 front
    0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0,     // v0-v3-v4-v5 right
    0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0,     // v0-v5-v6-v1 up
    0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0,      // v1-v6-v7-v2 left
    0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0,    // v7-v4-v3-v2 down
    0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 0.2916, 0.5928, 0.0, 　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v0-v1-v2-v3 front
    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0, // v0-v3-v4-v5 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, // v0-v5-v6-v1 up
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v1-v6-v7-v2 left
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // v7-v4-v3-v2 down
    0.0, 0.0,   1.0, 0.0,   0.0, 1.0,   1.0, 1.0 // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
  
  gl.bindTexture(gl.TEXTURE_2D, grass);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, grass.image);
  
  gl.activeTexture(gl.TEXTURE0);


  return indices.length;
}


function initVertexBuffersCubegrey(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,     // v0-v1-v2-v3 front
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,    // v0-v3-v4-v5 right
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,     // v0-v5-v6-v1 up
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,    // v1-v6-v7-v2 left
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,    // v7-v4-v3-v2 down
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v0-v1-v2-v3 front
    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0, // v0-v3-v4-v5 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, // v0-v5-v6-v1 up
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v1-v6-v7-v2 left
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // v7-v4-v3-v2 down
    0.0, 0.0,   1.0, 0.0,   0.0, 1.0,   1.0, 1.0 // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  

  gl.bindTexture(gl.TEXTURE_2D, road);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, road.image);
  
  gl.activeTexture(gl.TEXTURE0);


  return indices.length;
}

function initVertexBuffersCubeleaf(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,     // v0-v1-v2-v3 front
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,    // v0-v3-v4-v5 right
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,     // v0-v5-v6-v1 up
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,    // v1-v6-v7-v2 left
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,    // v7-v4-v3-v2 down
    0.525, 0.533, 0.541,   0.525, 0.533, 0.541, 0.525, 0.533, 0.541,   0.525, 0.533, 0.541,　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v0-v1-v2-v3 front
    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0, // v0-v3-v4-v5 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0, // v0-v5-v6-v1 up
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0, // v1-v6-v7-v2 left
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // v7-v4-v3-v2 down
    0.0, 0.0,   1.0, 0.0,   0.0, 1.0,   1.0, 1.0 // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_texcoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  

  gl.bindTexture(gl.TEXTURE_2D, leaves);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, leaves.image);
 
  gl.activeTexture(gl.TEXTURE0);


  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}



var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(now,gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  
  gl.uniform1i(u_isLighting, true); // Will apply lighting

  var cube = initVertexBuffers(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Rotate, and then translate
  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

  //Bridge
  pushMatrix(modelMatrix);
  modelMatrix.translate(10,0,-10);
  // Model road

  var cube = initVertexBuffersCubegrey(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
    modelMatrix.translate(0,14.3,0);
    modelMatrix.scale(62, 2, 11); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
 
  //pavements
  pushMatrix(modelMatrix);
    modelMatrix.translate(0,15.3,4);
    modelMatrix.scale(63, 0.6, 3); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(0,15.3,-4);
    modelMatrix.scale(63, 0.6, 3); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-34.25,15.3,-5.75);
  modelMatrix.rotate(-30,0,1,0);
  modelMatrix.scale(8, 0.6, 3); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-44,15.3,-7.5);
  modelMatrix.scale(15, 0.6, 3); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-44,14.3,-7);
  modelMatrix.scale(15, 2, 4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-34.25,15.3,5.75);
  modelMatrix.rotate(30,0,1,0);
  modelMatrix.scale(8, 0.6, 3); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-44,15.3,7.5);
  modelMatrix.scale(15, 0.6, 3); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-44,14.3,7);
  modelMatrix.scale(15, 2, 4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);

  pushMatrix(modelMatrix);
  modelMatrix.translate(-34.25,15.3,-5.75);
  modelMatrix.rotate(-30,0,1,0);
  modelMatrix.scale(8, 0.6, 3); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-44,15.3,-7.5);
  modelMatrix.scale(15, 0.6, 3); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-44,14.3,-7);
  modelMatrix.scale(15, 2, 4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-34.25,15.3,5.75);
  modelMatrix.rotate(30,0,1,0);
  modelMatrix.scale(8, 0.6, 3); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-44,15.3,7.5);
  modelMatrix.scale(15, 0.6, 3); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-44,14.3,7);
  modelMatrix.scale(15, 2, 4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0); //normalise

  var cube = initVertexBuffers(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //walls

  //back right
  pushMatrix(modelMatrix);
    modelMatrix.translate(21.75,14.25,-5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(12, 0.6, 2.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(21.75,17.75,-5.5);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(12, 0.6, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(14.5,15.5,-5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(4, 0.6, 5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(29,15.5,-5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(4, 0.6, 5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  var cube = initVertexBuffershexbrown(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(17.25,16.5,-5.5);
  modelMatrix.scale(0.35, 3, 0.35);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(18.75,16.5,-5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(20.25,16.5,-5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(21.75,16.5,-5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(23.25,16.5,-5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(24.75,16.5,-5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(26.25,16.5,-5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();



  var cube = initVertexBuffers(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //front right

  pushMatrix(modelMatrix);
    modelMatrix.translate(21.75,14.25,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(12, 0.6, 2.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(21.75,17.75,5.5);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(12, 0.6, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(14.5,15.5,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(4, 0.6, 5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(29,15.5,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(4, 0.6, 5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  var cube = initVertexBuffershexbrown(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(17.25,16.5,5.5);
  modelMatrix.scale(0.35, 3, 0.35);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(18.75,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(20.25,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(21.75,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(23.25,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(24.75,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(26.25,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();



  var cube = initVertexBuffers(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(-43.5,0,0);

  //front right
  pushMatrix(modelMatrix);
    modelMatrix.translate(21.75,14.25,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(12, 0.6, 2.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(21.75,17.75,5.5);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(12, 0.6, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(14.5,15.5,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(4, 0.6, 5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(29,15.5,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(4, 0.6, 5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  var cube = initVertexBuffershexbrown(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(17.25,16.5,5.5);
  modelMatrix.scale(0.35, 3, 0.35);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(18.75,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(20.25,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(21.75,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(23.25,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(24.75,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(26.25,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();



  var cube = initVertexBuffers(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  
  modelMatrix.translate(0,0,-11);

  //back left
  
  pushMatrix(modelMatrix);
    modelMatrix.translate(21.75,14.25,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(12, 0.6, 2.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(21.75,17.75,5.5);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(12, 0.6, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(14.5,15.5,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(4, 0.6, 5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(29,15.5,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(4, 0.6, 5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  var cube = initVertexBuffershexbrown(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(17.25,16.5,5.5);
  modelMatrix.scale(0.35, 3, 0.35);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(18.75,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(20.25,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(21.75,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(23.25,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(24.75,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(26.25,16.5,5.5);
    modelMatrix.scale(0.35, 3, 0.35);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();



  var cube = initVertexBuffers(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  modelMatrix.translate(43.5,0,10);
  modelMatrix = popMatrix();

  //front middle

  pushMatrix(modelMatrix);
    modelMatrix.translate(0,15.5,5.5);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(14, 0.6, 5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //back middle
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15.5,-5.5);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(14, 0.6, 5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();


  pushMatrix(modelMatrix);
    modelMatrix.translate(-33.75,11.5,7.25);
    modelMatrix.rotate(30,0,1,0);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(7, 0.6, 13);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
    modelMatrix.translate(-44,14,9);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(15, 0.6, 8);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(-33.75,11.5,-7.25);
    modelMatrix.rotate(-30,0,1,0);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(7, 0.6, 13);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
    modelMatrix.translate(-44,14,-9);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(15, 0.6, 8);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

modelMatrix.rotate(180,0,1,0);

pushMatrix(modelMatrix);
    modelMatrix.translate(-33.75,11.5,7.25);
    modelMatrix.rotate(30,0,1,0);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(7, 0.6, 13);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
    modelMatrix.translate(-44,14,9);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(15, 0.6, 8);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(-33.75,11.5,-7.25);
    modelMatrix.rotate(-30,0,1,0);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(7, 0.6, 13);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
    modelMatrix.translate(-44,14,-9);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(15, 0.6, 8);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);//normalise


  //indents in walls
  pushMatrix(modelMatrix);
  modelMatrix.translate(-7.25,13,6.25);
  modelMatrix.rotate(45,0,1,0);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(2, 0.6, 10);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
  modelMatrix.translate(-12.25,13,6.25);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(2, 0.6, 10);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
  modelMatrix.translate(-9.75,13,7);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(4, 0.6, 10);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
  modelMatrix.translate(-9.75,15.3,6);
  modelMatrix.scale(5, 0.6, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

modelMatrix.translate(19.5,0,0);

pushMatrix(modelMatrix);
modelMatrix.translate(-7.25,13,6.25);
modelMatrix.rotate(45,0,1,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 0.6, 10);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-12.25,13,6.25);
modelMatrix.rotate(-45,0,1,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 0.6, 10);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-9.75,13,7);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(4, 0.6, 10);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
  modelMatrix.translate(-9.75,15.3,6);
  modelMatrix.scale(5, 0.6, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

modelMatrix.translate(-19.5,0,0); //normalise

modelMatrix.rotate(180,0,1,0);

pushMatrix(modelMatrix);
modelMatrix.translate(-7.25,13,6.25);
modelMatrix.rotate(45,0,1,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 0.6, 10);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-12.25,13,6.25);
modelMatrix.rotate(-45,0,1,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 0.6, 10);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-9.75,13,7);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(4, 0.6, 10);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
  modelMatrix.translate(-9.75,15.3,6);
  modelMatrix.scale(5, 0.6, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

modelMatrix.translate(19.5,0,0);

pushMatrix(modelMatrix);
modelMatrix.translate(-7.25,13,6.25);
modelMatrix.rotate(45,0,1,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 0.6, 10);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-12.25,13,6.25);
modelMatrix.rotate(-45,0,1,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 0.6, 10);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-9.75,13,7);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(4, 0.6, 10);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
  modelMatrix.translate(-9.75,15.3,6);
  modelMatrix.scale(5, 0.6, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

modelMatrix.translate(-19.5,0,0); //re-standard modelmatrix
modelMatrix.rotate(180,0,1,0);  //normalise

//structs
pushMatrix(modelMatrix);
modelMatrix.translate(-9.75,9,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(7, 11, 12);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();


pushMatrix(modelMatrix);
modelMatrix.translate(9.75,9,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(7, 11, 12);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-28.5,9,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 12);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(30,9,0);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 12);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();


//arches
pushMatrix(modelMatrix);
modelMatrix.translate(-8.5,6,0);
modelMatrix.rotate(-10,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-8,8,0);
modelMatrix.rotate(-20,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-7.25,10,0);
modelMatrix.rotate(-30,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-6,12,0);
modelMatrix.rotate(-40,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-3.9,13.25,0);
modelMatrix.rotate(-50,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(3.5, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-2,13.75,0);
modelMatrix.rotate(-60,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-1,14.25,0);
modelMatrix.rotate(-90,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

//new half arch
modelMatrix.rotate(180,0,1,0);

pushMatrix(modelMatrix);
modelMatrix.translate(-8.5,6,0);
modelMatrix.rotate(-10,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-8,8,0);
modelMatrix.rotate(-20,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-7.25,10,0);
modelMatrix.rotate(-30,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-6,12,0);
modelMatrix.rotate(-40,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-3.9,13.25,0);
modelMatrix.rotate(-50,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(3.5, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-2,13.75,0);
modelMatrix.rotate(-60,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-1,14.25,0);
modelMatrix.rotate(-90,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

modelMatrix.rotate(180,0,1,0);

modelMatrix.translate(19.5,0,0);

//new arch
pushMatrix(modelMatrix);
modelMatrix.translate(-8.5,6,0);
modelMatrix.rotate(-10,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-8,8,0);
modelMatrix.rotate(-20,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-7.25,10,0);
modelMatrix.rotate(-30,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-6,12,0);
modelMatrix.rotate(-40,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-3.9,13.25,0);
modelMatrix.rotate(-50,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(3.5, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-2,13.75,0);
modelMatrix.rotate(-60,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-1,14.25,0);
modelMatrix.rotate(-90,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

//new half arch
modelMatrix.rotate(180,0,1,0);

pushMatrix(modelMatrix);
modelMatrix.translate(-8.5,6,0);
modelMatrix.rotate(-10,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-8,8,0);
modelMatrix.rotate(-20,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-7.25,10,0);
modelMatrix.rotate(-30,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-6,12,0);
modelMatrix.rotate(-40,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-3.9,13.25,0);
modelMatrix.rotate(-50,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(3.5, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-2,13.75,0);
modelMatrix.rotate(-60,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-1,14.25,0);
modelMatrix.rotate(-90,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

modelMatrix.rotate(180,0,1,0);
modelMatrix.translate(-39,0,0);
pushMatrix(modelMatrix);
modelMatrix.translate(-8.5,6,0);
modelMatrix.rotate(-10,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-8,8,0);
modelMatrix.rotate(-20,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-7.25,10,0);
modelMatrix.rotate(-30,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-6,12,0);
modelMatrix.rotate(-40,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-3.9,13.25,0);
modelMatrix.rotate(-50,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(3.5, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-2,13.75,0);
modelMatrix.rotate(-60,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-1,14.25,0);
modelMatrix.rotate(-90,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

//new half arch
modelMatrix.rotate(180,0,1,0);

pushMatrix(modelMatrix);
modelMatrix.translate(-8.5,6,0);
modelMatrix.rotate(-10,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-8,8,0);
modelMatrix.rotate(-20,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-7.25,10,0);
modelMatrix.rotate(-30,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-6,12,0);
modelMatrix.rotate(-40,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(5, 11, 3);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-3.9,13.25,0);
modelMatrix.rotate(-50,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(3.5, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-2,13.75,0);
modelMatrix.rotate(-60,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

pushMatrix(modelMatrix);
modelMatrix.translate(-1,14.25,0);
modelMatrix.rotate(-90,0,0,1);
modelMatrix.rotate(90,1,0,0);
modelMatrix.scale(2, 11, 2);
drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
modelMatrix = popMatrix();

modelMatrix.rotate(180,0,1,0);

modelMatrix.translate(19.5,0,0);

var cube = initVertexBufferstri(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(-9.75,5.5,6.5);
  modelMatrix.scale(7, 5, 4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.translate(19.75,0,0);

  pushMatrix(modelMatrix);
  modelMatrix.translate(-9.75,5.5,6.5);
  modelMatrix.scale(7, 5, 4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.translate(-19.75,0,0);
  modelMatrix.rotate(180,0,1,0);

  pushMatrix(modelMatrix);
  modelMatrix.translate(-9.75,5.5,6.5);
  modelMatrix.scale(7, 5, 4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.translate(19.75,0,0);

  pushMatrix(modelMatrix);
  modelMatrix.translate(-9.75,5.5,6.5);
  modelMatrix.scale(7, 5, 4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.translate(-19.75,0,0);

  modelMatrix.rotate(180,1,0,0);
modelMatrix = popMatrix();

//ground
var cube = initVertexBuffersCubeBlue(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(10,2,0);
  modelMatrix.scale(60,2,100);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  var cube = initVertexBuffersCubegrey(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(-30.5,14.3,-10);
  modelMatrix.scale(22,2,11);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(50.5,14.3,-10);
  modelMatrix.scale(22,2,11);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(34.5,3.75,0);
  modelMatrix.scale(3,1,100);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  var cube = initVertexBuffersCubeMud(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(43,6.5,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(20,4,100);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(34.5,3,0);
  modelMatrix.scale(6,2,100);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  pushMatrix(modelMatrix);
  modelMatrix.translate(-25,6.5,0);
  modelMatrix.rotate(-40,0,0,1);
  modelMatrix.scale(20,4,100);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-36.5,7.95,0);
  modelMatrix.scale(10,13,100);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(55.5,7.95,0);
  modelMatrix.scale(12,13,100);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(10,-1,0);
  modelMatrix.scale(103,5,100);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


var cube = initVertexBufferstrigreen(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(45.5,5.5,0);
  modelMatrix.rotate(45,0,0,1);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(18,100,10);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-27.5,5.5,0);
  modelMatrix.rotate(-45,0,0,1);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.scale(18,100,10);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  

  // tree
  var cube = initVertexBuffershex(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(-20,0,8);

  //trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,10,0);
  modelMatrix.scale(1,15,1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.8,20,-0.3);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,18.5,1);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.scale(0.5,2,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.7,19.5,-0.5);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(-15,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //2nd lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,13,0);
  modelMatrix.rotate(60,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.75,16.25,0.75);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(5,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,11,-1.25);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-60,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25,12.75,-2.5);
  modelMatrix.rotate(-30,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,15.5,-3);
  modelMatrix.rotate(-5,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(20,0,0,1);
  modelMatrix.scale(0.3,3,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.75,16,-3);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-20,0,0,1);
  modelMatrix.scale(0.3,4,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //middle branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15,2);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,17.75,3.25);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //2nd highsest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,15,-1.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(50,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,18,-2.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //highest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,17,1);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-50,0,0,1);
  modelMatrix.scale(0.5,6,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.35,20.65,2.5);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  var cube = initVertexBuffersCubeleaf(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //leaves
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  
  modelMatrix.translate(-0.5,1,2);
  modelMatrix.rotate(180,0,1,0);
  

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);
  modelMatrix.translate(0.5,-1,-2);

  pushMatrix(modelMatrix);
  modelMatrix.translate(3,18.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1,17.5,-2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  var cube = initVertexBuffershex(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(-25,6,25);
  modelMatrix.rotate(45,0,1,0);

  //trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,10,0);
  modelMatrix.scale(1,15,1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.8,20,-0.3);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,18.5,1);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.scale(0.5,2,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.7,19.5,-0.5);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(-15,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //2nd lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,13,0);
  modelMatrix.rotate(60,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.75,16.25,0.75);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(5,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,11,-1.25);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-60,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25,12.75,-2.5);
  modelMatrix.rotate(-30,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,15.5,-3);
  modelMatrix.rotate(-5,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(20,0,0,1);
  modelMatrix.scale(0.3,3,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.75,16,-3);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-20,0,0,1);
  modelMatrix.scale(0.3,4,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //middle branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15,2);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,17.75,3.25);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //2nd highsest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,15,-1.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(50,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,18,-2.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //highest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,17,1);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-50,0,0,1);
  modelMatrix.scale(0.5,6,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.35,20.65,2.5);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  var cube = initVertexBuffersCubeleaf(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //leaves
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  
  modelMatrix.translate(-0.5,1,2);
  modelMatrix.rotate(180,0,1,0);
  

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);
  modelMatrix.translate(0.5,-1,-2);

  pushMatrix(modelMatrix);
  modelMatrix.translate(3,18.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1,17.5,-2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  var cube = initVertexBuffershex(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(-22,3,38);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.rotate(60,0,1,0);
  

  //trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,10,0);
  modelMatrix.scale(1,15,1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.8,20,-0.3);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,18.5,1);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.scale(0.5,2,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.7,19.5,-0.5);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(-15,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //2nd lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,13,0);
  modelMatrix.rotate(60,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.75,16.25,0.75);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(5,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,11,-1.25);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-60,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25,12.75,-2.5);
  modelMatrix.rotate(-30,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,15.5,-3);
  modelMatrix.rotate(-5,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(20,0,0,1);
  modelMatrix.scale(0.3,3,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.75,16,-3);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-20,0,0,1);
  modelMatrix.scale(0.3,4,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //middle branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15,2);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,17.75,3.25);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //2nd highsest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,15,-1.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(50,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,18,-2.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //highest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,17,1);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-50,0,0,1);
  modelMatrix.scale(0.5,6,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.35,20.65,2.5);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  var cube = initVertexBuffersCubeleaf(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //leaves
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  
  modelMatrix.translate(-0.5,1,2);
  modelMatrix.rotate(180,0,1,0);
  

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);
  modelMatrix.translate(0.5,-1,-2);

  pushMatrix(modelMatrix);
  modelMatrix.translate(3,18.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1,17.5,-2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  var cube = initVertexBuffershex(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(-25,6,-33);
  modelMatrix.rotate(25,0,1,0);

  //trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,10,0);
  modelMatrix.scale(1,15,1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.8,20,-0.3);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,18.5,1);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.scale(0.5,2,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.7,19.5,-0.5);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(-15,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //2nd lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,13,0);
  modelMatrix.rotate(60,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.75,16.25,0.75);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(5,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,11,-1.25);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-60,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25,12.75,-2.5);
  modelMatrix.rotate(-30,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,15.5,-3);
  modelMatrix.rotate(-5,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(20,0,0,1);
  modelMatrix.scale(0.3,3,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.75,16,-3);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-20,0,0,1);
  modelMatrix.scale(0.3,4,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //middle branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15,2);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,17.75,3.25);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //2nd highsest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,15,-1.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(50,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,18,-2.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //highest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,17,1);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-50,0,0,1);
  modelMatrix.scale(0.5,6,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.35,20.65,2.5);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  var cube = initVertexBuffersCubeleaf(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //leaves
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  
  modelMatrix.translate(-0.5,1,2);
  modelMatrix.rotate(180,0,1,0);
  

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);
  modelMatrix.translate(0.5,-1,-2);

  pushMatrix(modelMatrix);
  modelMatrix.translate(3,18.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1,17.5,-2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  var cube = initVertexBuffershex(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(42,4,-28);
  modelMatrix.rotate(-45,0,1,0);

  //trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,10,0);
  modelMatrix.scale(1,15,1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.8,20,-0.3);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,18.5,1);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.scale(0.5,2,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.7,19.5,-0.5);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(-15,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //2nd lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,13,0);
  modelMatrix.rotate(60,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.75,16.25,0.75);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(5,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,11,-1.25);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-60,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25,12.75,-2.5);
  modelMatrix.rotate(-30,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,15.5,-3);
  modelMatrix.rotate(-5,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(20,0,0,1);
  modelMatrix.scale(0.3,3,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.75,16,-3);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-20,0,0,1);
  modelMatrix.scale(0.3,4,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //middle branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15,2);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,17.75,3.25);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //2nd highsest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,15,-1.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(50,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,18,-2.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //highest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,17,1);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-50,0,0,1);
  modelMatrix.scale(0.5,6,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.35,20.65,2.5);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  var cube = initVertexBuffersCubeleaf(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //leaves
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  
  modelMatrix.translate(-0.5,1,2);
  modelMatrix.rotate(180,0,1,0);
  

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);
  modelMatrix.translate(0.5,-1,-2);

  pushMatrix(modelMatrix);
  modelMatrix.translate(3,18.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1,17.5,-2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  var cube = initVertexBuffershex(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(38,1,25);
  modelMatrix.rotate(90,0,1,0);

  //trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,10,0);
  modelMatrix.scale(1,15,1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.8,20,-0.3);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,18.5,1);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.scale(0.5,2,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.7,19.5,-0.5);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(-15,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //2nd lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,13,0);
  modelMatrix.rotate(60,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.75,16.25,0.75);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(5,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,11,-1.25);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-60,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25,12.75,-2.5);
  modelMatrix.rotate(-30,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,15.5,-3);
  modelMatrix.rotate(-5,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(20,0,0,1);
  modelMatrix.scale(0.3,3,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.75,16,-3);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-20,0,0,1);
  modelMatrix.scale(0.3,4,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //middle branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15,2);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,17.75,3.25);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //2nd highsest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,15,-1.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(50,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,18,-2.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //highest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,17,1);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-50,0,0,1);
  modelMatrix.scale(0.5,6,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.35,20.65,2.5);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  var cube = initVertexBuffersCubeleaf(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //leaves
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  
  modelMatrix.translate(-0.5,1,2);
  modelMatrix.rotate(180,0,1,0);
  

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);
  modelMatrix.translate(0.5,-1,-2);

  pushMatrix(modelMatrix);
  modelMatrix.translate(3,18.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1,17.5,-2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  var cube = initVertexBuffershex(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(45,7,42);
  modelMatrix.rotate(130,0,1,0);

  //trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,10,0);
  modelMatrix.scale(1,15,1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.8,20,-0.3);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,18.5,1);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.scale(0.5,2,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.7,19.5,-0.5);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(-15,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //2nd lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,13,0);
  modelMatrix.rotate(60,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.75,16.25,0.75);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(5,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,11,-1.25);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-60,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25,12.75,-2.5);
  modelMatrix.rotate(-30,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,15.5,-3);
  modelMatrix.rotate(-5,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(20,0,0,1);
  modelMatrix.scale(0.3,3,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.75,16,-3);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-20,0,0,1);
  modelMatrix.scale(0.3,4,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //middle branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15,2);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,17.75,3.25);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //2nd highsest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,15,-1.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(50,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,18,-2.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //highest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,17,1);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-50,0,0,1);
  modelMatrix.scale(0.5,6,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.35,20.65,2.5);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  var cube = initVertexBuffersCubeleaf(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //leaves
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  
  modelMatrix.translate(-0.5,1,2);
  modelMatrix.rotate(180,0,1,0);
  

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);
  modelMatrix.translate(0.5,-1,-2);

  pushMatrix(modelMatrix);
  modelMatrix.translate(3,18.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1,17.5,-2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  var cube = initVertexBuffershex(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(40,2,7);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.rotate(90,0,1,0);

  //trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,10,0);
  modelMatrix.scale(1,15,1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.8,20,-0.3);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,18.5,1);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.scale(0.5,2,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.7,19.5,-0.5);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(-15,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //2nd lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,13,0);
  modelMatrix.rotate(60,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.75,16.25,0.75);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(5,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,11,-1.25);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-60,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25,12.75,-2.5);
  modelMatrix.rotate(-30,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,15.5,-3);
  modelMatrix.rotate(-5,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(20,0,0,1);
  modelMatrix.scale(0.3,3,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.75,16,-3);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-20,0,0,1);
  modelMatrix.scale(0.3,4,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //middle branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15,2);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,17.75,3.25);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //2nd highsest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,15,-1.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(50,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,18,-2.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //highest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,17,1);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-50,0,0,1);
  modelMatrix.scale(0.5,6,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.35,20.65,2.5);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  var cube = initVertexBuffersCubeleaf(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //leaves
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  
  modelMatrix.translate(-0.5,1,2);
  modelMatrix.rotate(180,0,1,0);
  

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5,19.5,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,0);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.5,21.5,4);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,22,2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,20.5,4.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3,20,5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4,19.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2,20.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,21.5,-0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,22.5,0.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix.rotate(180,0,1,0);
  modelMatrix.translate(0.5,-1,-2);

  pushMatrix(modelMatrix);
  modelMatrix.translate(3,18.5,-2.5);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1,17.5,-2);
  modelMatrix.scale(2.5,2.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  var cube = initVertexBuffershex(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(-16,-3,2);
  modelMatrix.rotate(-75,0,0,1);
  modelMatrix.rotate(90,0,1,0);

  //trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,10,0);
  modelMatrix.scale(1,15,1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.8,20,-0.3);
  modelMatrix.rotate(-10,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,18.5,1);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.scale(0.5,2,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.7,19.5,-0.5);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(-15,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //2nd lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,13,0);
  modelMatrix.rotate(60,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.75,16.25,0.75);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(5,0,0,1);
  modelMatrix.scale(0.5,5,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();


  //lowest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,11,-1.25);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-60,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25,12.75,-2.5);
  modelMatrix.rotate(-30,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(10,0,0,1);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,15.5,-3);
  modelMatrix.rotate(-5,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(20,0,0,1);
  modelMatrix.scale(0.3,3,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.75,16,-3);
  modelMatrix.rotate(20,1,0,0);
  modelMatrix.rotate(40,0,1,0);
  modelMatrix.rotate(-20,0,0,1);
  modelMatrix.scale(0.3,4,0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //middle branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,15,2);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(40,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0,17.75,3.25);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.scale(0.5,3,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //2nd highsest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5,15,-1.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(50,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.5,18,-2.5);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  //highest branch
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5,17,1);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-50,0,0,1);
  modelMatrix.scale(0.5,6,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.35,20.65,2.5);
  modelMatrix.rotate(-40,0,1,0);
  modelMatrix.rotate(-5,0,0,1);
  modelMatrix.scale(0.5,4,0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();


  pushMatrix(modelMatrix);
  modelMatrix.translate(boat_posx,4,boat_posz);
  modelMatrix.rotate(boat_rotate,0,1,0);

  var cube = initVertexBufferstribrown(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //boat

  pushMatrix(modelMatrix);
  modelMatrix.translate(10,-1,-3.5);
  modelMatrix.rotate(180,0,1,0);
  modelMatrix.scale(2,1.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(10,-1,3.5);
  modelMatrix.scale(2,1.5,2.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  var cube = initVertexBuffersCubeBrown(gl);
  if (cube < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(10.75,-1,0);
  modelMatrix.scale(0.5,1.5,5.75);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(9.25,-1,0);
  modelMatrix.scale(0.5,1.5,5.75);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(10,-1.25,0);
  modelMatrix.scale(2,1,5.75);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.rotate(oar_rotate,1,0,0);

//right oar
  pushMatrix(modelMatrix);
  modelMatrix.translate(11.75,0,0);
  modelMatrix.rotate(-25,0,0,1);
  modelMatrix.scale(3,0.25,0.25);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(13.5,-0.75,0);
  modelMatrix.rotate(-25,0,0,1);
  modelMatrix.scale(1,1,0.25);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

//left oar
  pushMatrix(modelMatrix);
  modelMatrix.translate(8.25,0,0);
  modelMatrix.rotate(25,0,0,1);
  modelMatrix.scale(3,0.25,0.25);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(6.5,-0.75,0);
  modelMatrix.rotate(25,0,0,1);
  modelMatrix.scale(1,1,0.25);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, cube);
  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  modelMatrix = popMatrix();

  now *= 0.01
  var delta_time = now - then;
  then = now;

  if(boat_direction == true){
    if (boat_posz > -21){
    boat_posz = boat_posz -(1*delta_time);
    if (boat_posz < -21) {
      boat_posz = -21
    }
    }
  }
  if(boat_direction == false){
    if(boat_posz <30){
      boat_posz = boat_posz +(1*delta_time);
      if (boat_posz > 30) {
        boat_posz = 30
      }
    }
  }
  
  if (boat_posz <-20 && boat_direction == true){
    boat_rotate += (2.5*delta_time);
    if(boat_rotate > 180){
      boat_rotate = 180;
      boat_direction = false;
    }
  }
  if(boat_posz > 29 && boat_direction == false){
    boat_rotate += (2.5*delta_time);
    if(boat_rotate > 360){
      boat_direction = true;
      boat_rotate = 0;
    }
  }

  oar_rotate = (oar_rotate-(15*delta_time))%360;
  
      
  requestAnimationFrame(function(now){draw(now,gl, u_ModelMatrix, u_NormalMatrix, u_isLighting)});
  
}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}
