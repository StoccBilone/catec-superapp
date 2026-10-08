import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { Maze, Marble, MARBLE_RADIUS } from './engine';

type Matrix = number[];
const identity = (): Matrix => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
export function multiply(a: Matrix, b: Matrix): Matrix {
  const result = Array<number>(16).fill(0);
  for (let column = 0; column < 4; column++) for (let row = 0; row < 4; row++) for (let k = 0; k < 4; k++) result[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
  return result;
}
function vertex(list: number[], p: number[], normal: number[]) { list.push(...p, ...normal); }
function box(list: number[], x: number, y: number, z: number, w: number, h: number, d: number) {
  const p = [[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];
  const faces = [{ v: [0,1,2,3], n: [0,0,-1] }, { v: [4,7,6,5], n: [0,0,1] }, { v: [0,3,7,4], n: [-1,0,0] }, { v: [1,5,6,2], n: [1,0,0] }, { v: [3,2,6,7], n: [0,1,0] }, { v: [0,4,5,1], n: [0,-1,0] }];
  for (const face of faces) for (const index of [0,1,2,0,2,3]) vertex(list, p[face.v[index]], face.n);
}
function disk(radius: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * Math.PI * 2, b = (i + 1) / 48 * Math.PI * 2;
    for (const point of [[0,0,0],[Math.cos(a)*radius,0,Math.sin(a)*radius],[Math.cos(b)*radius,0,Math.sin(b)*radius]]) vertex(result, point, [0,1,0]);
  }
  return result;
}
function sphere(): number[] {
  const result: number[] = [];
  const point = (i: number, j: number) => { const a = i / 16 * Math.PI, b = j / 24 * Math.PI * 2; return [Math.sin(a)*Math.cos(b), Math.cos(a), Math.sin(a)*Math.sin(b)]; };
  for (let i = 0; i < 16; i++) for (let j = 0; j < 24; j++) {
    const p = [point(i,j), point(i+1,j), point(i+1,j+1), point(i,j+1)];
    for (const k of [0,1,2,0,2,3]) vertex(result, p[k].map(n => n * MARBLE_RADIUS), p[k]);
  }
  return result;
}

export function createMazeRenderer(gl: ExpoWebGLRenderingContext, maze: Maze, dark: boolean) {
  const shaders: WebGLShader[] = [];
  const buffers: WebGLBuffer[] = [];
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('GL shader unavailable');
    shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    return shader;
  };
  const program = gl.createProgram();
  if (!program) throw new Error('GL program unavailable');
  try {
    gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec3 aPosition; attribute vec3 aNormal; uniform mat4 uMatrix; varying vec3 vNormal; void main(){ vNormal=aNormal; gl_Position=uMatrix*vec4(aPosition,1.0); }'));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, 'precision mediump float; varying vec3 vNormal; uniform vec3 uColor; void main(){ vec3 n=normalize(vNormal); float diffuse=max(dot(n,normalize(vec3(-0.45,0.85,0.4))),0.0); float shine=pow(max(dot(n,normalize(vec3(-0.25,0.95,0.55))),0.0),32.0)*0.15; gl_FragColor=vec4(uColor*(0.52+0.48*diffuse)+shine,1.0); }'));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'GL linking failed');
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'aPosition'), normal = gl.getAttribLocation(program, 'aNormal');
    const matrix = gl.getUniformLocation(program, 'uMatrix'), color = gl.getUniformLocation(program, 'uColor');
    const mesh = (data: number[]) => {
      const buffer = gl.createBuffer(); if (!buffer) throw new Error('GL buffer unavailable');
      buffers.push(buffer); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      return { buffer, count: data.length / 6 };
    };
    const floorData: number[] = [], wallData: number[] = [];
    const half = maze.size / 2;
    box(floorData, -half - 0.07, -0.3, -half - 0.07, maze.size + 0.14, 0.3, maze.size + 0.14);
    for (let z = 0; z < maze.size; z++) for (let x = 0; x < maze.size; x++) if (maze.cells[z][x]) box(wallData, x-half, 0, z-half, 1, 0.55, 1);
    const floor = mesh(floorData), walls = mesh(wallData), ball = mesh(sphere()), goal = mesh(disk(0.34)), shadow = mesh(disk(0.27));
    // Orthographic projection, with a real 3D camera above and in front of the board.
    const view = [1,0,0,0, 0,0.6,0.8,0, 0,-0.8,0.6,0, 0,0,-22,1];
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const extent = maze.size / 2 + 0.65;
    const projection = [1/(extent*aspect),0,0,0, 0,1/extent,0,0, 0,0,-2/44,0, 0,0,-1,1];
    const camera = multiply(projection, view);
    const draw = (object: ReturnType<typeof mesh>, rgb: number[], x=0, y=0, z=0) => {
      const model = identity(); model[12]=x; model[13]=y; model[14]=z;
      gl.bindBuffer(gl.ARRAY_BUFFER, object.buffer);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 24, 0); gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 24, 12);
      gl.enableVertexAttribArray(position); gl.enableVertexAttribArray(normal);
      gl.uniformMatrix4fv(matrix, false, new Float32Array(multiply(camera, model))); gl.uniform3fv(color, new Float32Array(rgb));
      gl.drawArrays(gl.TRIANGLES, 0, object.count);
    };
    const dispose = () => { for (const buffer of buffers) gl.deleteBuffer(buffer); for (const shader of shaders) gl.deleteShader(shader); gl.deleteProgram(program); };
    return {
      draw: (marble: Marble) => {
        gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight); gl.enable(gl.DEPTH_TEST); gl.useProgram(program);
        const bg = dark ? 10/255 : 242/255; gl.clearColor(bg,bg,bg,1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        draw(floor, dark ? [0.19,0.21,0.20] : [0.95,0.95,0.95]);
        draw(walls, dark ? [0.40,0.43,0.41] : [0.83,0.85,0.84]);
        draw(goal,[0.025,0.025,0.025],maze.goal.x-half,0.012,maze.goal.z-half);
        draw(shadow,dark ? [0.08,0.08,0.08] : [0.58,0.59,0.58],marble.x-half,0.018,marble.z-half);
        draw(ball,dark ? [0.97,0.97,0.97] : [0.14,0.16,0.15],marble.x-half,MARBLE_RADIUS+0.022,marble.z-half);
        gl.flush(); gl.endFrameEXP();
      }, dispose,
    };
  } catch (error) {
    for (const buffer of buffers) gl.deleteBuffer(buffer); for (const shader of shaders) gl.deleteShader(shader); gl.deleteProgram(program); throw error;
  }
}
