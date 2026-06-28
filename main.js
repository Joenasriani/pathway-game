(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const startScreen = document.getElementById('startScreen');
  const startButton = document.getElementById('startButton');
  const topHud = document.getElementById('topHud');
  const bottomHud = document.getElementById('bottomHud');
  const statusText = document.getElementById('statusText');
  const resetButton = document.getElementById('resetButton');
  const soundButton = document.getElementById('soundButton');
  const bgMusic = document.getElementById('bgMusic');
  const levelResult = document.getElementById('levelResult');
  const nextButton = document.getElementById('nextButton');
  const levelStamp = document.getElementById('levelStamp');
  const levelTitle = document.getElementById('levelTitle');
  const objective = document.getElementById('objective');
  const levelMood = document.getElementById('levelMood');
  const resultTitle = document.getElementById('resultTitle');

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  });

  if (!gl) {
    document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;font:16px system-ui;color:#342b3d;background:#f7e7d4;text-align:center"><div><h1>WebGL is not available</h1><p>This prototype needs a browser with WebGL enabled.</p></div></main>';
    return;
  }

  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    uniform vec2 u_resolution;
    varying vec4 v_color;
    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 clipSpace = zeroToOne * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
      v_color = a_color;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(error || 'Shader compilation failed');
    }
    return shader;
  }

  function createProgram() {
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(error || 'Program link failed');
    }
    return program;
  }

  const program = createProgram();
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const colorLocation = gl.getAttribLocation(program, 'a_color');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  const buffer = gl.createBuffer();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const levels = [
    {
      id: 1,
      title: 'First Reflection',
      objective: 'Rotate the glass once. Bounce the beam into the bulb.',
      grid: 5,
      source: { col: 0, row: 2, dir: 'right' },
      target: { col: 2, row: 0 },
      mirrors: [
        { col: 2, row: 2, orientation: 1, solution: 0 }
      ]
    },
    {
      id: 2,
      title: 'Corner Bloom',
      objective: 'Use two glass turns. Send the beam up, then across.',
      grid: 5,
      source: { col: 0, row: 3, dir: 'right' },
      target: { col: 4, row: 1 },
      mirrors: [
        { col: 1, row: 3, orientation: 1, solution: 0 },
        { col: 1, row: 1, orientation: 1, solution: 0 }
      ]
    },
    {
      id: 3,
      title: 'Moon Turn',
      objective: 'Drop the beam, fold it left, then lift it into the bulb.',
      grid: 5,
      source: { col: 0, row: 1, dir: 'right' },
      target: { col: 0, row: 0 },
      mirrors: [
        { col: 2, row: 1, orientation: 0, solution: 1 },
        { col: 2, row: 3, orientation: 1, solution: 0 },
        { col: 0, row: 3, orientation: 0, solution: 1 }
      ]
    },
    {
      id: 4,
      title: 'Glass Stair',
      objective: 'Build a stepped reflection path through three turns.',
      grid: 5,
      source: { col: 0, row: 4, dir: 'right' },
      target: { col: 1, row: 0 },
      mirrors: [
        { col: 3, row: 4, orientation: 1, solution: 0 },
        { col: 3, row: 1, orientation: 0, solution: 1 },
        { col: 1, row: 1, orientation: 0, solution: 1 }
      ]
    },
    {
      id: 5,
      title: 'Quiet Loop',
      objective: 'Use the outer glass route. Ignore the calm decoys.',
      grid: 6,
      source: { col: 0, row: 0, dir: 'right' },
      target: { col: 0, row: 2 },
      mirrors: [
        { col: 2, row: 0, orientation: 0, solution: 1 },
        { col: 2, row: 4, orientation: 1, solution: 0 },
        { col: 0, row: 4, orientation: 0, solution: 1 },
        { col: 4, row: 2, orientation: 0, solution: 0 },
        { col: 5, row: 5, orientation: 1, solution: 1 }
      ]
    },
    {
      id: 6,
      title: 'Soft Return',
      objective: 'Turn left, climb, sweep right, then return the beam to the bulb.',
      grid: 6,
      source: { col: 5, row: 5, dir: 'left' },
      target: { col: 2, row: 4 },
      mirrors: [
        { col: 3, row: 5, orientation: 0, solution: 1 },
        { col: 3, row: 2, orientation: 1, solution: 0 },
        { col: 5, row: 2, orientation: 0, solution: 1 },
        { col: 5, row: 4, orientation: 1, solution: 0 },
        { col: 1, row: 1, orientation: 1, solution: 1 }
      ]
    },
    {
      id: 7,
      title: 'Botanical Fork',
      objective: 'Four reflections wrap the beam around the garden edge.',
      grid: 7,
      source: { col: 0, row: 3, dir: 'right' },
      target: { col: 5, row: 1 },
      mirrors: [
        { col: 2, row: 3, orientation: 0, solution: 1 },
        { col: 2, row: 6, orientation: 1, solution: 0 },
        { col: 0, row: 6, orientation: 0, solution: 1 },
        { col: 0, row: 1, orientation: 1, solution: 0 },
        { col: 4, row: 4, orientation: 1, solution: 1 },
        { col: 6, row: 2, orientation: 0, solution: 0 }
      ]
    },
    {
      id: 8,
      title: 'Long Crescent',
      objective: 'Send the beam across five crescent turns without losing the line.',
      grid: 7,
      source: { col: 6, row: 0, dir: 'left' },
      target: { col: 1, row: 6 },
      mirrors: [
        { col: 4, row: 0, orientation: 1, solution: 0 },
        { col: 4, row: 5, orientation: 0, solution: 1 },
        { col: 6, row: 5, orientation: 1, solution: 0 },
        { col: 6, row: 2, orientation: 0, solution: 1 },
        { col: 1, row: 2, orientation: 1, solution: 0 },
        { col: 3, row: 3, orientation: 0, solution: 0 }
      ]
    },
    {
      id: 9,
      title: 'Ink Circuit',
      objective: 'A longer circuit: down, left, up, right, down, then home.',
      grid: 7,
      source: { col: 0, row: 0, dir: 'right' },
      target: { col: 2, row: 5 },
      mirrors: [
        { col: 3, row: 0, orientation: 0, solution: 1 },
        { col: 3, row: 3, orientation: 1, solution: 0 },
        { col: 1, row: 3, orientation: 0, solution: 1 },
        { col: 1, row: 1, orientation: 1, solution: 0 },
        { col: 6, row: 1, orientation: 0, solution: 1 },
        { col: 6, row: 5, orientation: 1, solution: 0 },
        { col: 5, row: 6, orientation: 1, solution: 1 }
      ]
    },
    {
      id: 10,
      title: 'Full Pathway',
      objective: 'Seven glass turns. One clean route from the lower edge to the top bloom.',
      grid: 8,
      source: { col: 0, row: 7, dir: 'right' },
      target: { col: 1, row: 0 },
      mirrors: [
        { col: 6, row: 7, orientation: 1, solution: 0 },
        { col: 6, row: 4, orientation: 0, solution: 1 },
        { col: 2, row: 4, orientation: 1, solution: 0 },
        { col: 2, row: 6, orientation: 0, solution: 1 },
        { col: 5, row: 6, orientation: 1, solution: 0 },
        { col: 5, row: 2, orientation: 0, solution: 1 },
        { col: 1, row: 2, orientation: 0, solution: 1 },
        { col: 3, row: 1, orientation: 1, solution: 1 },
        { col: 7, row: 5, orientation: 0, solution: 0 }
      ]
    },

    {
      id: 11,
      title: 'Prism Wake',
      objective: 'Seven true lenses. Wake a longer prism path before the bulb answers.',
      grid: 9,
      source: { col: 0, row: 8, dir: 'right' },
      target: { col: 8, row: 0 },
      mirrors: [
        { col: 2, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 2, orientation: 0, solution: 1, role: 'true' },
        { col: 3, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 7, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 1, row: 6, orientation: 0, solution: 0, role: 'decoy' },
        { col: 1, row: 0, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 1, orientation: 0, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 12,
      title: 'Petal Relay',
      objective: 'Eight lenses relay the beam through a wider garden route.',
      grid: 10,
      source: { col: 9, row: 9, dir: 'left' },
      target: { col: 9, row: 0 },
      mirrors: [
        { col: 6, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 6, row: 6, orientation: 0, solution: 1, role: 'true' },
        { col: 2, row: 6, orientation: 0, solution: 1, role: 'true' },
        { col: 2, row: 3, orientation: 1, solution: 0, role: 'true' },
        { col: 7, row: 3, orientation: 0, solution: 1, role: 'true' },
        { col: 7, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 4, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 4, row: 0, orientation: 1, solution: 0, role: 'true' },
        { col: 0, row: 3, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 1, orientation: 1, solution: 1, role: 'decoy' },
        { col: 2, row: 7, orientation: 1, solution: 0, role: 'decoy' },
        { col: 5, row: 9, orientation: 1, solution: 1, role: 'decoy' }
      ]
    },
    {
      id: 13,
      title: 'Pearl Descent',
      objective: 'Nine lenses drop, fold, and release the beam into a distant bulb.',
      grid: 10,
      source: { col: 0, row: 1, dir: 'right' },
      target: { col: 0, row: 9 },
      mirrors: [
        { col: 8, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 5, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 5, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 9, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 9, row: 2, orientation: 0, solution: 1, role: 'true' },
        { col: 3, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 6, orientation: 1, solution: 0, role: 'true' },
        { col: 0, row: 6, orientation: 1, solution: 0, role: 'true' },
        { col: 8, row: 5, orientation: 0, solution: 1, role: 'decoy' },
        { col: 7, row: 7, orientation: 0, solution: 0, role: 'decoy' },
        { col: 3, row: 7, orientation: 0, solution: 1, role: 'decoy' },
        { col: 4, row: 9, orientation: 1, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 14,
      title: 'Sky Filament',
      objective: 'Ten lenses form a high filament. Follow the long airy thread.',
      grid: 10,
      source: { col: 0, row: 9, dir: 'right' },
      target: { col: 6, row: 3 },
      mirrors: [
        { col: 9, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 9, row: 6, orientation: 0, solution: 1, role: 'true' },
        { col: 1, row: 6, orientation: 0, solution: 1, role: 'true' },
        { col: 1, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 4, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 4, row: 4, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 8, row: 0, orientation: 0, solution: 1, role: 'true' },
        { col: 2, row: 0, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 3, orientation: 0, solution: 1, role: 'true' },
        { col: 9, row: 1, orientation: 1, solution: 0, role: 'decoy' },
        { col: 6, row: 2, orientation: 1, solution: 1, role: 'decoy' },
        { col: 8, row: 5, orientation: 1, solution: 0, role: 'decoy' },
        { col: 7, row: 5, orientation: 1, solution: 1, role: 'decoy' },
        { col: 1, row: 0, orientation: 0, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 15,
      title: 'Blush Detour',
      objective: 'Ten lenses. The direct instinct is wrong; let the beam take the detour.',
      grid: 10,
      source: { col: 9, row: 0, dir: 'left' },
      target: { col: 0, row: 8 },
      mirrors: [
        { col: 5, row: 0, orientation: 1, solution: 0, role: 'true' },
        { col: 5, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 1, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 1, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 7, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 7, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 0, row: 7, orientation: 0, solution: 1, role: 'decoy' },
        { col: 9, row: 1, orientation: 1, solution: 0, role: 'decoy' },
        { col: 6, row: 7, orientation: 0, solution: 1, role: 'decoy' },
        { col: 9, row: 9, orientation: 1, solution: 1, role: 'decoy' },
        { col: 4, row: 6, orientation: 1, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 16,
      title: 'Quiet Cascade',
      objective: 'Eleven lenses cascade across the board before climbing into the bulb.',
      grid: 11,
      source: { col: 0, row: 10, dir: 'right' },
      target: { col: 0, row: 0 },
      mirrors: [
        { col: 3, row: 10, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 2, orientation: 0, solution: 1, role: 'true' },
        { col: 6, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 1, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 1, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 8, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 0, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 4, row: 3, orientation: 0, solution: 1, role: 'decoy' },
        { col: 2, row: 6, orientation: 0, solution: 1, role: 'decoy' },
        { col: 3, row: 2, orientation: 0, solution: 1, role: 'decoy' },
        { col: 7, row: 4, orientation: 0, solution: 1, role: 'decoy' },
        { col: 4, row: 4, orientation: 1, solution: 0, role: 'decoy' },
        { col: 3, row: 4, orientation: 0, solution: 1, role: 'decoy' }
      ]
    },
    {
      id: 17,
      title: 'Orchid Return',
      objective: 'Eleven lenses send the beam away first, then return it with control.',
      grid: 11,
      source: { col: 10, row: 10, dir: 'left' },
      target: { col: 4, row: 0 },
      mirrors: [
        { col: 7, row: 10, orientation: 0, solution: 1, role: 'true' },
        { col: 7, row: 6, orientation: 0, solution: 1, role: 'true' },
        { col: 2, row: 6, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 5, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 5, row: 3, orientation: 1, solution: 0, role: 'true' },
        { col: 9, row: 3, orientation: 0, solution: 1, role: 'true' },
        { col: 9, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 0, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 0, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 4, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 0, row: 0, orientation: 0, solution: 1, role: 'decoy' },
        { col: 10, row: 1, orientation: 0, solution: 0, role: 'decoy' },
        { col: 1, row: 0, orientation: 0, solution: 0, role: 'decoy' },
        { col: 1, row: 1, orientation: 1, solution: 0, role: 'decoy' },
        { col: 6, row: 5, orientation: 0, solution: 0, role: 'decoy' },
        { col: 1, row: 4, orientation: 1, solution: 1, role: 'decoy' }
      ]
    },
    {
      id: 18,
      title: 'Glass Tide',
      objective: 'Twelve lenses create a tide route: across, down, back, and up again.',
      grid: 11,
      source: { col: 0, row: 0, dir: 'right' },
      target: { col: 0, row: 1 },
      mirrors: [
        { col: 10, row: 0, orientation: 0, solution: 1, role: 'true' },
        { col: 10, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 10, orientation: 1, solution: 0, role: 'true' },
        { col: 1, row: 10, orientation: 0, solution: 1, role: 'true' },
        { col: 1, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 4, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 4, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 8, row: 2, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 3, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 0, row: 10, orientation: 1, solution: 0, role: 'decoy' },
        { col: 7, row: 6, orientation: 1, solution: 0, role: 'decoy' },
        { col: 9, row: 3, orientation: 1, solution: 1, role: 'decoy' },
        { col: 7, row: 9, orientation: 0, solution: 1, role: 'decoy' },
        { col: 4, row: 1, orientation: 1, solution: 0, role: 'decoy' },
        { col: 7, row: 1, orientation: 0, solution: 1, role: 'decoy' },
        { col: 2, row: 3, orientation: 0, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 19,
      title: 'Velvet Gate',
      objective: 'Reject the nearest edge. Enter the bulb only after a U-shaped return.',
      grid: 12,
      source: { col: 11, row: 0, dir: 'left' },
      target: { col: 2, row: 10 },
      mirrors: [
        { col: 8, row: 0, orientation: 1, solution: 0, role: 'true' },
        { col: 8, row: 3, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 3, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 10, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 10, row: 11, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 11, orientation: 0, solution: 1, role: 'true' },
        { col: 11, row: 3, orientation: 0, solution: 1, role: 'decoy' },
        { col: 10, row: 5, orientation: 1, solution: 0, role: 'decoy' },
        { col: 6, row: 2, orientation: 0, solution: 1, role: 'decoy' },
        { col: 1, row: 7, orientation: 1, solution: 0, role: 'decoy' },
        { col: 5, row: 10, orientation: 0, solution: 1, role: 'decoy' },
        { col: 9, row: 1, orientation: 1, solution: 0, role: 'decoy' },
        { col: 4, row: 5, orientation: 0, solution: 1, role: 'decoy' },
        { col: 7, row: 9, orientation: 1, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 20,
      title: 'Final Resonance',
      objective: 'Eleven lenses. Fold away from the obvious edge route, then return to the bulb from below.',
      mood: 'Solar Resonance — disciplined final fold',
      grid: 12,
      source: { col: 0, row: 10, dir: 'right' },
      target: { col: 2, row: 5 },
      mirrors: [
        { col: 3, row: 10, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 4, orientation: 0, solution: 1, role: 'true' },
        { col: 1, row: 4, orientation: 0, solution: 1, role: 'true' },
        { col: 1, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 8, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 5, row: 7, orientation: 0, solution: 1, role: 'true' },
        { col: 5, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 2, orientation: 0, solution: 1, role: 'true' },
        { col: 10, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 4, row: 8, orientation: 1, solution: 0, role: 'decoy' },
        { col: 6, row: 4, orientation: 0, solution: 1, role: 'decoy' },
        { col: 9, row: 6, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 6, orientation: 0, solution: 1, role: 'decoy' },
        { col: 7, row: 10, orientation: 1, solution: 0, role: 'decoy' },
        { col: 11, row: 5, orientation: 0, solution: 1, role: 'decoy' }
      ]
    },
    {
      id: 21,
      title: 'Crystal Fold',
      objective: 'Fold the light away from the target before the final upward entry.',
      grid: 12,
      source: { col: 0, row: 11, dir: 'right' },
      target: { col: 6, row: 0 },
      mirrors: [
        { col: 4, row: 11, orientation: 1, solution: 0, role: 'true' },
        { col: 4, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 9, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 9, row: 3, orientation: 0, solution: 1, role: 'true' },
        { col: 2, row: 3, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 7, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 7, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 5, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 5, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 1, row: 10, orientation: 0, solution: 1, role: 'decoy' },
        { col: 6, row: 10, orientation: 1, solution: 0, role: 'decoy' },
        { col: 10, row: 9, orientation: 0, solution: 1, role: 'decoy' },
        { col: 8, row: 6, orientation: 1, solution: 0, role: 'decoy' },
        { col: 1, row: 4, orientation: 0, solution: 1, role: 'decoy' },
        { col: 4, row: 2, orientation: 1, solution: 0, role: 'decoy' },
        { col: 9, row: 1, orientation: 0, solution: 1, role: 'decoy' },
        { col: 11, row: 5, orientation: 1, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 22,
      title: 'Moon Lattice',
      objective: 'Read the lattice: the beam must cross the center before climbing into the bulb.',
      grid: 13,
      source: { col: 12, row: 12, dir: 'left' },
      target: { col: 10, row: 3 },
      mirrors: [
        { col: 9, row: 12, orientation: 0, solution: 1, role: 'true' },
        { col: 9, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 4, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 4, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 11, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 11, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 6, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 7, orientation: 0, solution: 1, role: 'true' },
        { col: 10, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 12, row: 9, orientation: 0, solution: 1, role: 'decoy' },
        { col: 8, row: 11, orientation: 1, solution: 0, role: 'decoy' },
        { col: 2, row: 11, orientation: 0, solution: 1, role: 'decoy' },
        { col: 1, row: 6, orientation: 1, solution: 0, role: 'decoy' },
        { col: 8, row: 4, orientation: 0, solution: 1, role: 'decoy' },
        { col: 12, row: 2, orientation: 1, solution: 0, role: 'decoy' },
        { col: 3, row: 2, orientation: 0, solution: 1, role: 'decoy' },
        { col: 7, row: 10, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 4, orientation: 0, solution: 1, role: 'decoy' }
      ]
    },
    {
      id: 23,
      title: 'Opal Spiral',
      objective: 'Seventeen true lenses. Spiral the beam without trusting the center.',
      grid: 13,
      source: { col: 0, row: 12, dir: 'right' },
      target: { col: 11, row: 2 },
      mirrors: [
        { col: 3, row: 12, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 4, orientation: 0, solution: 1, role: 'true' },
        { col: 5, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 5, row: 11, orientation: 0, solution: 1, role: 'true' },
        { col: 12, row: 11, orientation: 1, solution: 0, role: 'true' },
        { col: 12, row: 7, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 7, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 0, orientation: 0, solution: 1, role: 'true' },
        { col: 1, row: 0, orientation: 1, solution: 0, role: 'true' },
        { col: 1, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 6, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 6, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 10, orientation: 0, solution: 1, role: 'true' },
        { col: 11, row: 10, orientation: 1, solution: 0, role: 'true' },
        { col: 0, row: 6, orientation: 1, solution: 1, role: 'decoy' },
        { col: 11, row: 0, orientation: 0, solution: 0, role: 'decoy' },
        { col: 4, row: 7, orientation: 0, solution: 0, role: 'decoy' },
        { col: 12, row: 12, orientation: 1, solution: 1, role: 'decoy' },
        { col: 0, row: 3, orientation: 0, solution: 0, role: 'decoy' },
        { col: 8, row: 8, orientation: 1, solution: 1, role: 'decoy' },
        { col: 4, row: 4, orientation: 1, solution: 1, role: 'decoy' },
        { col: 2, row: 2, orientation: 1, solution: 1, role: 'decoy' },
        { col: 0, row: 0, orientation: 1, solution: 1, role: 'decoy' },
        { col: 6, row: 3, orientation: 0, solution: 0, role: 'decoy' },
        { col: 4, row: 1, orientation: 0, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 24,
      title: 'Aurora Weave',
      objective: 'Weave in two broad bands; the bulb accepts the beam only after the second fold.',
      grid: 13,
      source: { col: 12, row: 0, dir: 'left' },
      target: { col: 12, row: 7 },
      mirrors: [
        { col: 8, row: 0, orientation: 1, solution: 0, role: 'true' },
        { col: 8, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 10, orientation: 0, solution: 1, role: 'true' },
        { col: 10, row: 10, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 12, row: 2, orientation: 0, solution: 1, role: 'true' },
        { col: 11, row: 5, orientation: 0, solution: 1, role: 'decoy' },
        { col: 5, row: 1, orientation: 1, solution: 0, role: 'decoy' },
        { col: 4, row: 11, orientation: 0, solution: 1, role: 'decoy' },
        { col: 0, row: 7, orientation: 1, solution: 0, role: 'decoy' },
        { col: 7, row: 8, orientation: 0, solution: 1, role: 'decoy' },
        { col: 12, row: 11, orientation: 1, solution: 0, role: 'decoy' },
        { col: 6, row: 3, orientation: 0, solution: 1, role: 'decoy' },
        { col: 3, row: 1, orientation: 1, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 25,
      title: 'Glass Constellation',
      objective: 'Trace the outer constellation, then cut inward for the small final drop.',
      grid: 13,
      source: { col: 0, row: 0, dir: 'right' },
      target: { col: 9, row: 3 },
      mirrors: [
        { col: 12, row: 0, orientation: 0, solution: 1, role: 'true' },
        { col: 12, row: 12, orientation: 1, solution: 0, role: 'true' },
        { col: 7, row: 12, orientation: 0, solution: 1, role: 'true' },
        { col: 7, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 2, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 2, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 2, orientation: 0, solution: 1, role: 'true' },
        { col: 9, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 1, row: 3, orientation: 0, solution: 1, role: 'decoy' },
        { col: 4, row: 1, orientation: 1, solution: 0, role: 'decoy' },
        { col: 11, row: 6, orientation: 0, solution: 1, role: 'decoy' },
        { col: 6, row: 5, orientation: 1, solution: 0, role: 'decoy' },
        { col: 3, row: 11, orientation: 0, solution: 1, role: 'decoy' },
        { col: 9, row: 9, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 12, orientation: 0, solution: 1, role: 'decoy' },
        { col: 5, row: 2, orientation: 1, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 26,
      title: 'Prism Labyrinth',
      objective: 'Follow the corridor grammar: every corner is a gate, not decoration.',
      grid: 14,
      source: { col: 0, row: 1, dir: 'right' },
      target: { col: 10, row: 7 },
      mirrors: [
        { col: 2, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 2, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 6, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 6, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 13, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 13, row: 11, orientation: 1, solution: 0, role: 'true' },
        { col: 5, row: 11, orientation: 0, solution: 1, role: 'true' },
        { col: 5, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 3, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 13, orientation: 0, solution: 1, role: 'true' },
        { col: 11, row: 13, orientation: 1, solution: 0, role: 'true' },
        { col: 11, row: 10, orientation: 0, solution: 1, role: 'true' },
        { col: 4, row: 10, orientation: 0, solution: 1, role: 'true' },
        { col: 4, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 11, row: 4, orientation: 0, solution: 1, role: 'true' },
        { col: 11, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 1, row: 12, orientation: 0, solution: 1, role: 'decoy' },
        { col: 8, row: 12, orientation: 1, solution: 0, role: 'decoy' },
        { col: 12, row: 6, orientation: 0, solution: 1, role: 'decoy' },
        { col: 7, row: 3, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 6, orientation: 0, solution: 1, role: 'decoy' },
        { col: 9, row: 1, orientation: 1, solution: 0, role: 'decoy' },
        { col: 2, row: 11, orientation: 0, solution: 1, role: 'decoy' },
        { col: 13, row: 2, orientation: 1, solution: 0, role: 'decoy' },
        { col: 10, row: 9, orientation: 1, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 27,
      title: 'Lunar Relay',
      objective: 'Twenty-one true lenses. Long vertical relays and side folds hide the clean route.',
      grid: 14,
      source: { col: 9, row: 13, dir: 'up' },
      target: { col: 10, row: 2 },
      mirrors: [
        { col: 9, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 11, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 11, row: 3, orientation: 1, solution: 0, role: 'true' },
        { col: 13, row: 3, orientation: 1, solution: 0, role: 'true' },
        { col: 13, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 7, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 7, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 13, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 13, row: 11, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 11, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 13, orientation: 0, solution: 1, role: 'true' },
        { col: 11, row: 13, orientation: 1, solution: 0, role: 'true' },
        { col: 11, row: 6, orientation: 1, solution: 0, role: 'true' },
        { col: 13, row: 6, orientation: 0, solution: 1, role: 'true' },
        { col: 13, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 8, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 8, row: 12, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 12, orientation: 0, solution: 1, role: 'true' },
        { col: 3, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 4, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 0, row: 2, orientation: 1, solution: 1, role: 'decoy' },
        { col: 0, row: 4, orientation: 1, solution: 0, role: 'decoy' },
        { col: 8, row: 4, orientation: 0, solution: 1, role: 'decoy' },
        { col: 1, row: 5, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 7, orientation: 0, solution: 0, role: 'decoy' },
        { col: 2, row: 2, orientation: 0, solution: 1, role: 'decoy' },
        { col: 8, row: 5, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 13, orientation: 0, solution: 1, role: 'decoy' },
        { col: 12, row: 4, orientation: 1, solution: 1, role: 'decoy' },
        { col: 1, row: 3, orientation: 1, solution: 0, role: 'decoy' },
        { col: 11, row: 2, orientation: 1, solution: 1, role: 'decoy' },
        { col: 4, row: 11, orientation: 1, solution: 1, role: 'decoy' },
        { col: 6, row: 0, orientation: 1, solution: 1, role: 'decoy' },
        { col: 1, row: 2, orientation: 0, solution: 0, role: 'decoy' },
        { col: 6, row: 1, orientation: 1, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 28,
      title: 'Opal Switchback',
      objective: 'Twenty-two true lenses. The route switchbacks across the board before descending to the bulb.',
      grid: 15,
      source: { col: 14, row: 2, dir: 'left' },
      target: { col: 7, row: 11 },
      mirrors: [
        { col: 8, row: 2, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 0, orientation: 0, solution: 1, role: 'true' },
        { col: 6, row: 0, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 4, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 4, row: 11, orientation: 1, solution: 0, role: 'true' },
        { col: 2, row: 11, orientation: 0, solution: 1, role: 'true' },
        { col: 2, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 0, orientation: 1, solution: 0, role: 'true' },
        { col: 12, row: 0, orientation: 0, solution: 1, role: 'true' },
        { col: 12, row: 7, orientation: 0, solution: 1, role: 'true' },
        { col: 14, row: 7, orientation: 1, solution: 0, role: 'true' },
        { col: 14, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 9, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 9, row: 7, orientation: 0, solution: 1, role: 'true' },
        { col: 11, row: 7, orientation: 0, solution: 1, role: 'true' },
        { col: 11, row: 10, orientation: 1, solution: 0, role: 'true' },
        { col: 7, row: 10, orientation: 1, solution: 0, role: 'true' },
        { col: 7, row: 13, orientation: 0, solution: 1, role: 'true' },
        { col: 11, row: 13, orientation: 1, solution: 0, role: 'true' },
        { col: 11, row: 11, orientation: 0, solution: 1, role: 'true' },
        { col: 14, row: 0, orientation: 1, solution: 1, role: 'decoy' },
        { col: 5, row: 2, orientation: 0, solution: 0, role: 'decoy' },
        { col: 9, row: 14, orientation: 0, solution: 0, role: 'decoy' },
        { col: 2, row: 1, orientation: 0, solution: 1, role: 'decoy' },
        { col: 3, row: 6, orientation: 0, solution: 0, role: 'decoy' },
        { col: 5, row: 13, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 1, orientation: 0, solution: 0, role: 'decoy' },
        { col: 7, row: 4, orientation: 0, solution: 0, role: 'decoy' },
        { col: 10, row: 6, orientation: 1, solution: 1, role: 'decoy' },
        { col: 3, row: 4, orientation: 1, solution: 0, role: 'decoy' },
        { col: 1, row: 4, orientation: 0, solution: 0, role: 'decoy' },
        { col: 1, row: 2, orientation: 1, solution: 1, role: 'decoy' },
        { col: 4, row: 12, orientation: 1, solution: 0, role: 'decoy' },
        { col: 4, row: 6, orientation: 1, solution: 0, role: 'decoy' },
        { col: 5, row: 14, orientation: 0, solution: 1, role: 'decoy' },
        { col: 1, row: 12, orientation: 0, solution: 0, role: 'decoy' }
      ]
    },
    {
      id: 29,
      title: 'Velvet Keyhole',
      objective: 'The route draws a keyhole: go wide, close the loop, then drop into the target.',
      grid: 15,
      source: { col: 14, row: 2, dir: 'left' },
      target: { col: 1, row: 10 },
      mirrors: [
        { col: 10, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 10, row: 6, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 6, orientation: 1, solution: 0, role: 'true' },
        { col: 3, row: 12, orientation: 0, solution: 1, role: 'true' },
        { col: 12, row: 12, orientation: 1, solution: 0, role: 'true' },
        { col: 12, row: 8, orientation: 1, solution: 0, role: 'true' },
        { col: 14, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 14, row: 14, orientation: 1, solution: 0, role: 'true' },
        { col: 7, row: 14, orientation: 0, solution: 1, role: 'true' },
        { col: 7, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 1, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 13, row: 1, orientation: 0, solution: 1, role: 'decoy' },
        { col: 8, row: 4, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 6, orientation: 0, solution: 1, role: 'decoy' },
        { col: 5, row: 11, orientation: 1, solution: 0, role: 'decoy' },
        { col: 2, row: 2, orientation: 1, solution: 0, role: 'decoy' },
        { col: 12, row: 5, orientation: 0, solution: 1, role: 'decoy' },
        { col: 6, row: 7, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 13, orientation: 0, solution: 1, role: 'decoy' },
        { col: 11, row: 10, orientation: 1, solution: 0, role: 'decoy' },
        { col: 4, row: 4, orientation: 0, solution: 1, role: 'decoy' }
      ]
    },
    {
      id: 30,
      title: 'Solar Crown',
      objective: 'Final mastery: one crown-shaped route returns to the bottom and lights the last bulb.',
      grid: 16,
      source: { col: 9, row: 15, dir: 'up' },
      target: { col: 10, row: 15 },
      mirrors: [
        { col: 9, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 5, row: 8, orientation: 0, solution: 1, role: 'true' },
        { col: 5, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 0, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 0, row: 9, orientation: 0, solution: 1, role: 'true' },
        { col: 6, row: 9, orientation: 1, solution: 0, role: 'true' },
        { col: 6, row: 2, orientation: 1, solution: 0, role: 'true' },
        { col: 12, row: 2, orientation: 0, solution: 1, role: 'true' },
        { col: 12, row: 5, orientation: 0, solution: 1, role: 'true' },
        { col: 15, row: 5, orientation: 1, solution: 0, role: 'true' },
        { col: 15, row: 1, orientation: 0, solution: 1, role: 'true' },
        { col: 13, row: 1, orientation: 1, solution: 0, role: 'true' },
        { col: 13, row: 12, orientation: 1, solution: 0, role: 'true' },
        { col: 5, row: 12, orientation: 1, solution: 0, role: 'true' },
        { col: 5, row: 15, orientation: 0, solution: 1, role: 'true' },
        { col: 8, row: 14, orientation: 0, solution: 1, role: 'decoy' },
        { col: 3, row: 14, orientation: 1, solution: 0, role: 'decoy' },
        { col: 1, row: 4, orientation: 0, solution: 1, role: 'decoy' },
        { col: 4, row: 4, orientation: 1, solution: 0, role: 'decoy' },
        { col: 10, row: 0, orientation: 0, solution: 1, role: 'decoy' },
        { col: 15, row: 10, orientation: 1, solution: 0, role: 'decoy' },
        { col: 11, row: 11, orientation: 0, solution: 1, role: 'decoy' },
        { col: 2, row: 11, orientation: 1, solution: 0, role: 'decoy' },
        { col: 14, row: 3, orientation: 0, solution: 1, role: 'decoy' },
        { col: 7, row: 6, orientation: 1, solution: 0, role: 'decoy' },
        { col: 0, row: 15, orientation: 1, solution: 0, role: 'decoy' }
      ]
    }
  ];

  const levelThemes = [
    {
      name: 'Peach Dawn',
      mood: 'soft first spark',
      bgA: '#f9ded7', bgB: '#f4e6c9', bgC: '#d9eee3',
      auraA: '#b7dff0', auraB: '#e9aab7', auraC: '#b9dfd4',
      primary: '#4d355e', secondary: '#78b8b1',
      beam: '#2d1d36', hit: '#7b4aa0', glass: '#c9f0ee', glassEdge: '#5f4770',
      target: '#fff2a8', targetGlow: '#ffd56c', panel: '#fff5e8', meta: '#f6d8d3'
    },
    {
      name: 'Mint Garden',
      mood: 'gentle green confidence',
      bgA: '#d9f1df', bgB: '#eef3c8', bgC: '#c8ebea',
      auraA: '#8fd5c4', auraB: '#d7efb0', auraC: '#b8def4',
      primary: '#2e5a51', secondary: '#7abf8a',
      beam: '#173c37', hit: '#4e9a84', glass: '#d4fbf0', glassEdge: '#3f756a',
      target: '#fff4a6', targetGlow: '#cbe86e', panel: '#f5fff0', meta: '#d9f1df'
    },
    {
      name: 'Lavender Moon',
      mood: 'quiet lunar focus',
      bgA: '#e6def8', bgB: '#f2dfef', bgC: '#d7e7fb',
      auraA: '#c4b5fd', auraB: '#f0b5d8', auraC: '#a9d8f5',
      primary: '#4b386d', secondary: '#8d74c8',
      beam: '#241a3a', hit: '#8d64c8', glass: '#dfe8ff', glassEdge: '#5f4c8a',
      target: '#fff0ba', targetGlow: '#d3b2ff', panel: '#faf2ff', meta: '#e6def8'
    },
    {
      name: 'Sky Stair',
      mood: 'airy upward motion',
      bgA: '#d7ecff', bgB: '#e9f4f4', bgC: '#f5e1cf',
      auraA: '#92cfff', auraB: '#c4edf5', auraC: '#ffd2a9',
      primary: '#31537a', secondary: '#72bcd7',
      beam: '#17345a', hit: '#4b8fcb', glass: '#d7f4ff', glassEdge: '#416b93',
      target: '#fff1a4', targetGlow: '#91d8ff', panel: '#f3fbff', meta: '#d7ecff'
    },
    {
      name: 'Sage Loop',
      mood: 'patient slow orbit',
      bgA: '#e4ead2', bgB: '#f3e4c8', bgC: '#d4e8dc',
      auraA: '#a5c795', auraB: '#d4bc86', auraC: '#a7d6c0',
      primary: '#4d5c3c', secondary: '#93aa73',
      beam: '#2b341f', hit: '#849b4e', glass: '#e8f6d6', glassEdge: '#65734b',
      target: '#fff0a2', targetGlow: '#d7d46e', panel: '#fbf7df', meta: '#e4ead2'
    },
    {
      name: 'Apricot Return',
      mood: 'warm fold back home',
      bgA: '#ffe0c8', bgB: '#f7e6cf', bgC: '#d7ebe2',
      auraA: '#ffbf8e', auraB: '#f3a7a5', auraC: '#b8dccf',
      primary: '#6a4635', secondary: '#d28f67',
      beam: '#3c261b', hit: '#c47450', glass: '#fff0dc', glassEdge: '#8a5b47',
      target: '#fff2a7', targetGlow: '#ffb86b', panel: '#fff2df', meta: '#ffe0c8'
    },
    {
      name: 'Blush Fork',
      mood: 'curious branching bloom',
      bgA: '#f6d7e3', bgB: '#eadcf4', bgC: '#cceee6',
      auraA: '#f2a8c9', auraB: '#bfa2e7', auraC: '#8fd7ca',
      primary: '#633a58', secondary: '#b46f9a',
      beam: '#3a1e31', hit: '#b45a91', glass: '#f6e3f1', glassEdge: '#7d4b70',
      target: '#fff0a6', targetGlow: '#ffaad0', panel: '#fff0f7', meta: '#f6d7e3'
    },
    {
      name: 'Twilight Crescent',
      mood: 'deeper evening concentration',
      bgA: '#d8d4f0', bgB: '#ead5e1', bgC: '#c8dfe7',
      auraA: '#9ea0da', auraB: '#c99abf', auraC: '#86bfce',
      primary: '#35345d', secondary: '#756fc0',
      beam: '#19182f', hit: '#6c64cc', glass: '#d9e1fb', glassEdge: '#4a4a7e',
      target: '#fff1a0', targetGlow: '#b3a4ff', panel: '#f0edff', meta: '#d8d4f0'
    },
    {
      name: 'Ink Orchid',
      mood: 'precise electric thinking',
      bgA: '#ead7ed', bgB: '#dfe9f6', bgC: '#d1f0ec',
      auraA: '#c783d1', auraB: '#8ed7e3', auraC: '#bdb2ff',
      primary: '#4c2b5c', secondary: '#4da7b9',
      beam: '#22102d', hit: '#3a9fb4', glass: '#d9fbff', glassEdge: '#5b4070',
      target: '#fff4ae', targetGlow: '#8ce7ff', panel: '#fbf0ff', meta: '#ead7ed'
    },
    {
      name: 'Golden Bloom',
      mood: 'final luminous clarity',
      bgA: '#f7e6b8', bgB: '#f6d6c9', bgC: '#d7e8f2',
      auraA: '#ffd36d', auraB: '#e9a0a8', auraC: '#a8d4f2',
      primary: '#543b23', secondary: '#b9862f',
      beam: '#2e2210', hit: '#c28a25', glass: '#fff3cf', glassEdge: '#7d5b2f',
      target: '#fff6a3', targetGlow: '#ffcb46', panel: '#fff6de', meta: '#f7e6b8'
    },

    {
      name: 'Frosted Prism',
      mood: 'clean awakening',
      bgA: '#d9f3f7', bgB: '#e9f7ef', bgC: '#f4e0f0',
      auraA: '#92dce9', auraB: '#c8f0df', auraC: '#e7a9d9',
      primary: '#294f5c', secondary: '#66b7c7',
      beam: '#123441', hit: '#4aa9bd', glass: '#e0fbff', glassEdge: '#3c6f7d',
      target: '#fff4b8', targetGlow: '#9deeff', panel: '#f2ffff', meta: '#d9f3f7'
    },
    {
      name: 'Coral Relay',
      mood: 'warm chain reaction',
      bgA: '#ffd9cd', bgB: '#f7e8d8', bgC: '#d8edf0',
      auraA: '#ffad9a', auraB: '#f5c18a', auraC: '#9ed8e4',
      primary: '#684034', secondary: '#d57b61',
      beam: '#402116', hit: '#d06c51', glass: '#fff1e8', glassEdge: '#8a5748',
      target: '#fff0aa', targetGlow: '#ffb66f', panel: '#fff3ec', meta: '#ffd9cd'
    },
    {
      name: 'Pearl Descent',
      mood: 'slow falling light',
      bgA: '#f0e6f5', bgB: '#e6eef8', bgC: '#f6e7cf',
      auraA: '#d6b8ef', auraB: '#a8c9ef', auraC: '#efd0a1',
      primary: '#514365', secondary: '#9a82bf',
      beam: '#2c213a', hit: '#8d75b8', glass: '#eef4ff', glassEdge: '#65567d',
      target: '#fff3b0', targetGlow: '#d8c3ff', panel: '#faf4ff', meta: '#f0e6f5'
    },
    {
      name: 'Azure Filament',
      mood: 'high airy thread',
      bgA: '#d8efff', bgB: '#eaf6fb', bgC: '#d9f0e3',
      auraA: '#84cff7', auraB: '#b9e9ff', auraC: '#a7dfbe',
      primary: '#284b70', secondary: '#59a8d6',
      beam: '#102c4a', hit: '#3e92c8', glass: '#e5f8ff', glassEdge: '#3e6b93',
      target: '#fff5af', targetGlow: '#8ddcff', panel: '#f2fbff', meta: '#d8efff'
    },
    {
      name: 'Rose Detour',
      mood: 'delicate misdirection',
      bgA: '#f9d6e7', bgB: '#f3e2ee', bgC: '#ddeaf8',
      auraA: '#f4a2c7', auraB: '#d4a5e4', auraC: '#9dccf0',
      primary: '#62344f', secondary: '#c36d9c',
      beam: '#351929', hit: '#bd5b8d', glass: '#fde8f4', glassEdge: '#7e4566',
      target: '#fff2ad', targetGlow: '#ff9fc9', panel: '#fff0f8', meta: '#f9d6e7'
    },
    {
      name: 'Jade Cascade',
      mood: 'calm downward focus',
      bgA: '#d8f0df', bgB: '#e8f4de', bgC: '#d3edf1',
      auraA: '#92d2a2', auraB: '#c5e792', auraC: '#8bd4d9',
      primary: '#315d4b', secondary: '#6fb886',
      beam: '#183a2e', hit: '#5aa874', glass: '#e4fbec', glassEdge: '#47765d',
      target: '#fff3a7', targetGlow: '#b7e86f', panel: '#f4fff1', meta: '#d8f0df'
    },
    {
      name: 'Orchid Return',
      mood: 'reflective homecoming',
      bgA: '#ead7f6', bgB: '#f4ddeb', bgC: '#dbe9f8',
      auraA: '#c792ea', auraB: '#eea5ca', auraC: '#9ccdef',
      primary: '#4f3368', secondary: '#a66ccf',
      beam: '#281537', hit: '#9659c8', glass: '#f0e6ff', glassEdge: '#664484',
      target: '#fff3ad', targetGlow: '#d6a8ff', panel: '#fbf0ff', meta: '#ead7f6'
    },
    {
      name: 'Opal Tide',
      mood: 'flowing glass rhythm',
      bgA: '#d8f1ee', bgB: '#e8f2ff', bgC: '#f7dfd0',
      auraA: '#85d8cd', auraB: '#9dbff4', auraC: '#ffbfa2',
      primary: '#2f5561', secondary: '#5aaeb6',
      beam: '#153641', hit: '#43a1ab', glass: '#e5ffff', glassEdge: '#47737b',
      target: '#fff3a4', targetGlow: '#91ecdf', panel: '#f1ffff', meta: '#d8f1ee'
    },
    {
      name: 'Velvet Circuit',
      mood: 'deep quiet precision',
      bgA: '#dcd5ec', bgB: '#ead8e5', bgC: '#d7e4ee',
      auraA: '#9387c8', auraB: '#bf8eb2', auraC: '#7bb8ca',
      primary: '#34304f', secondary: '#7162ad',
      beam: '#171427', hit: '#6754bb', glass: '#e1e5fb', glassEdge: '#474064',
      target: '#fff1a8', targetGlow: '#a795ff', panel: '#f0edff', meta: '#dcd5ec'
    },
    {
      name: 'Solar Resonance',
      mood: 'complete radiant harmony',
      bgA: '#f8e3a6', bgB: '#f7d5c0', bgC: '#d8eaf0',
      auraA: '#ffd05d', auraB: '#f3a078', auraC: '#91d2e5',
      primary: '#563816', secondary: '#c58a28',
      beam: '#2d1d08', hit: '#d1971c', glass: '#fff4cd', glassEdge: '#7f5a26',
      target: '#fff7a4', targetGlow: '#ffc94d', panel: '#fff5dc', meta: '#f8e3a6'
    },
    {
      name: 'Crystal Fold',
      mood: 'sharp folded calm',
      bgA: '#dfeeff',
      bgB: '#f5e6ff',
      bgC: '#d8f7ef',
      auraA: '#9fc8ff',
      auraB: '#d9b8ff',
      auraC: '#9ce1d5',
      primary: '#2e4166',
      secondary: '#8aa9df',
      beam: '#172a48',
      hit: '#6f91de',
      glass: '#e5f7ff',
      glassEdge: '#4c6792',
      target: '#fff0a9',
      targetGlow: '#96d5ff',
      panel: '#f5f8ff',
      meta: '#dfeeff'
    },
    {
      name: 'Moon Lattice',
      mood: 'cool measured geometry',
      bgA: '#d9e2ff',
      bgB: '#ece4ff',
      bgC: '#d8f0ff',
      auraA: '#8fa9f2',
      auraB: '#c2a8ec',
      auraC: '#99d8ff',
      primary: '#2d346b',
      secondary: '#7d8dd9',
      beam: '#151b43',
      hit: '#7587e8',
      glass: '#edf1ff',
      glassEdge: '#465188',
      target: '#fff1bb',
      targetGlow: '#a8b9ff',
      panel: '#f4f6ff',
      meta: '#d9e2ff'
    },
    {
      name: 'Opal Spiral',
      mood: 'iridescent slow turn',
      bgA: '#f2dafa',
      bgB: '#d9eff4',
      bgC: '#f8ecd6',
      auraA: '#e4a8f1',
      auraB: '#96deea',
      auraC: '#f7cf97',
      primary: '#56315f',
      secondary: '#86b7c4',
      beam: '#35173f',
      hit: '#bd78cf',
      glass: '#f4ecff',
      glassEdge: '#74507f',
      target: '#fff3aa',
      targetGlow: '#e6b2ff',
      panel: '#fff5fb',
      meta: '#f2dafa'
    },
    {
      name: 'Aurora Weave',
      mood: 'wide luminous patience',
      bgA: '#d8f4ec',
      bgB: '#dbeaff',
      bgC: '#f7e0ef',
      auraA: '#8ee2c9',
      auraB: '#92bfff',
      auraC: '#f0a9cc',
      primary: '#245b64',
      secondary: '#78bed0',
      beam: '#12353e',
      hit: '#4eb3cc',
      glass: '#e6fff7',
      glassEdge: '#417b85',
      target: '#fff1a6',
      targetGlow: '#92f0d1',
      panel: '#f2fffb',
      meta: '#d8f4ec'
    },
    {
      name: 'Glass Constellation',
      mood: 'final star map clarity',
      bgA: '#efe1ff',
      bgB: '#d8eaff',
      bgC: '#fff0ce',
      auraA: '#c19cff',
      auraB: '#8fc7ff',
      auraC: '#ffd88a',
      primary: '#3f2f72',
      secondary: '#b08be8',
      beam: '#1f1742',
      hit: '#a37cf4',
      glass: '#eff6ff',
      glassEdge: '#5b4a98',
      target: '#fff5a6',
      targetGlow: '#ffd76e',
      panel: '#faf4ff',
      meta: '#efe1ff'
    },

    {
      name: 'Prism Labyrinth',
      mood: 'folded corridors of calm light',
      bgA: '#dfe7ff', bgB: '#eee0ff', bgC: '#d6f4ee',
      auraA: '#9fb8ff', auraB: '#d4a9ff', auraC: '#94e2d4',
      primary: '#30406c', secondary: '#8a8fdc',
      beam: '#182343', hit: '#7f7fe0', glass: '#e8f5ff', glassEdge: '#50609a',
      target: '#fff2a8', targetGlow: '#a9c8ff', panel: '#f6f5ff', meta: '#dfe7ff'
    },
    {
      name: 'Lunar Relay',
      mood: 'cold moonlight relay',
      bgA: '#d8e0fb', bgB: '#e7e5ff', bgC: '#d9f2ff',
      auraA: '#91a8e8', auraB: '#b9b0f4', auraC: '#8ad5ee',
      primary: '#2d3767', secondary: '#7c8bd7',
      beam: '#151c44', hit: '#6f7fe5', glass: '#edf2ff', glassEdge: '#46528d',
      target: '#fff1b3', targetGlow: '#b9c4ff', panel: '#f3f6ff', meta: '#d8e0fb'
    },
    {
      name: 'Opal Switchback',
      mood: 'soft iridescent reversal',
      bgA: '#f2dfff', bgB: '#dff3f6', bgC: '#fff0d8',
      auraA: '#e4a7f4', auraB: '#91dae5', auraC: '#ffd29a',
      primary: '#573565', secondary: '#74b7c2',
      beam: '#32183f', hit: '#b96bd2', glass: '#f5efff', glassEdge: '#745283',
      target: '#fff3aa', targetGlow: '#e7b4ff', panel: '#fff6fb', meta: '#f2dfff'
    },
    {
      name: 'Velvet Maze',
      mood: 'deep smooth concentration',
      bgA: '#ddd5ee', bgB: '#ead7e8', bgC: '#d6e7f0',
      auraA: '#9084c8', auraB: '#bf8cb5', auraC: '#80bfd0',
      primary: '#332f54', secondary: '#7361b0',
      beam: '#171328', hit: '#6b57bf', glass: '#e4e8fb', glassEdge: '#4a416b',
      target: '#fff1a8', targetGlow: '#a795ff', panel: '#f0edff', meta: '#ddd5ee'
    },
    {
      name: 'Solar Labyrinth',
      mood: 'large radiant resolution',
      bgA: '#fae5a7', bgB: '#f6d1bd', bgC: '#d7eef2',
      auraA: '#ffd15f', auraB: '#f29a76', auraC: '#8fd6e6',
      primary: '#563712', secondary: '#c78a25',
      beam: '#2c1c07', hit: '#d99b20', glass: '#fff4cc', glassEdge: '#7f5a24',
      target: '#fff7a2', targetGlow: '#ffcc4d', panel: '#fff5da', meta: '#fae5a7'
    }
 ];

  function parseHexColor(hex) {
    const value = String(hex || '#ffffff').replace('#', '').trim();
    const normalized = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
    const number = Number.parseInt(normalized, 16);
    if (!Number.isFinite(number)) return [1, 1, 1];
    return [((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
  }

  function colorWithAlpha(hex, alpha) {
    const rgb = parseHexColor(hex);
    return [rgb[0], rgb[1], rgb[2], alpha];
  }

  function cssRgba(hex, alpha) {
    const rgb = parseHexColor(hex).map((value) => Math.round(value * 255));
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  function setThemeVar(name, value) {
    document.documentElement.style.setProperty(name, value);
  }

  function currentTheme() {
    return levelThemes[state.levelIndex] || levelThemes[0];
  }

  function applyLevelTheme(index) {
    const theme = levelThemes[index] || levelThemes[0];

    setThemeVar('--theme-bg-a', theme.bgA);
    setThemeVar('--theme-bg-b', theme.bgB);
    setThemeVar('--theme-bg-c', theme.bgC);
    setThemeVar('--theme-aura-a', cssRgba(theme.auraA, 0.50));
    setThemeVar('--theme-aura-b', cssRgba(theme.auraB, 0.42));
    setThemeVar('--theme-aura-c', cssRgba(theme.auraC, 0.40));
    setThemeVar('--theme-primary', theme.primary);
    setThemeVar('--theme-primary-soft', cssRgba(theme.primary, 0.72));
    setThemeVar('--theme-primary-faint', cssRgba(theme.primary, 0.18));
    setThemeVar('--theme-secondary', theme.secondary);
    setThemeVar('--theme-secondary-soft', cssRgba(theme.secondary, 0.32));
    setThemeVar('--theme-panel', cssRgba(theme.panel, 0.46));
    setThemeVar('--theme-panel-strong', cssRgba(theme.panel, 0.78));
    setThemeVar('--theme-button-mid', cssRgba(theme.auraB, 0.78));
    setThemeVar('--theme-button-end', cssRgba(theme.auraC, 0.80));
    setThemeVar('--theme-glow', cssRgba(theme.targetGlow, 0.42));
    setThemeVar('--theme-beam', theme.beam);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', theme.meta || theme.bgA);

    Object.assign(colors, {
      background: colorWithAlpha(theme.bgB, 0.88),
      auraLight: [1, 1, 1, 0.20],
      auraA: colorWithAlpha(theme.auraA, 0.36),
      auraB: colorWithAlpha(theme.auraB, 0.34),
      auraC: colorWithAlpha(theme.auraC, 0.32),
      panel: colorWithAlpha(theme.panel, 0.42),
      panelStroke: colorWithAlpha(theme.primary, 0.16),
      gridStroke: colorWithAlpha(theme.primary, 0.16),
      gridMark: colorWithAlpha(theme.primary, 0.10),
      ornament: colorWithAlpha(theme.primary, 0.13),
      ornament2: colorWithAlpha(theme.secondary, 0.18),
      rose: colorWithAlpha(theme.auraB, 0.35),
      mint: colorWithAlpha(theme.auraC, 0.35),
      aqua: colorWithAlpha(theme.auraA, 0.36),
      ink: colorWithAlpha(theme.primary, 1),
      beamGlow: colorWithAlpha(theme.hit, 0.20),
      beam: colorWithAlpha(theme.beam, 0.96),
      beamHit: colorWithAlpha(theme.hit, 1),
      solvedGlow: colorWithAlpha(theme.hit, 0.25),
      victoryOuter: colorWithAlpha(theme.targetGlow, 0.22),
      victoryMid: colorWithAlpha(theme.hit, 0.54),
      victoryCore: colorWithAlpha(theme.target, 0.98),
      glass: colorWithAlpha(theme.glass, 0.50),
      glassEdge: colorWithAlpha(theme.glassEdge, 0.56),
      glassHighlight: colorWithAlpha('#ffffff', 0.46),
      source: colorWithAlpha(theme.primary, 0.94),
      targetOff: colorWithAlpha(theme.panel, 0.88),
      targetOn: colorWithAlpha(theme.target, 1),
      targetGlow: colorWithAlpha(theme.targetGlow, 0.38),
      tutorialCue: colorWithAlpha(theme.hit, 0.16),
      shadow: colorWithAlpha(theme.primary, 0.08),
      dangerSoft: colorWithAlpha(theme.auraB, 0.16)
    });
  }

  const colors = {
    panel: [1.0, 0.976, 0.91, 0.40],
    panelStroke: [0.42, 0.33, 0.46, 0.16],
    gridStroke: [0.38, 0.31, 0.42, 0.17],
    ornament: [0.50, 0.38, 0.50, 0.13],
    ornament2: [0.42, 0.70, 0.65, 0.16],
    rose: [0.90, 0.55, 0.63, 0.35],
    mint: [0.58, 0.84, 0.76, 0.35],
    aqua: [0.58, 0.80, 0.92, 0.36],
    ink: [0.18, 0.16, 0.21, 1],
    beamGlow: [0.49, 0.30, 0.60, 0.20],
    beam: [0.16, 0.11, 0.20, 0.96],
    beamHit: [0.30, 0.17, 0.42, 1],
    glass: [0.78, 0.95, 0.94, 0.46],
    glassEdge: [0.36, 0.27, 0.46, 0.55],
    source: [0.23, 0.18, 0.28, 0.94],
    targetOff: [0.96, 0.88, 0.80, 0.88],
    targetOn: [1.0, 0.98, 0.78, 1],
    targetGlow: [1.0, 0.84, 0.50, 0.36],
    dangerSoft: [0.82, 0.45, 0.54, 0.16]
  };

  const state = {
    mode: 'start',
    levelIndex: 0,
    dpr: 1,
    width: 0,
    height: 0,
    boardScale: 80,
    boardCenterX: 0,
    boardCenterY: 0,
    vertices: [],
    solved: false,
    beamSegments: [],
    mirrorStates: [],
    activeMirrorIndex: -1,
    completionQueued: false,
    victoryStart: 0,
    victoryDuration: 1450,
    victoryActive: false,
    victoryComplete: false,
    targetLit: false,
    targetLitSfxPlayed: false,
    targetEntryDir: 'left',
    victoryDanceSeed: 0,
    victoryDanceStarted: false,
    lastTime: 0
  };

  const audioState = {
    ctx: null,
    master: null,
    delay: null,
    delayWet: null,
    filter: null,
    enabled: true,
    unlocked: false,
    lastTrigger: 0,
    musicStarted: false,
    musicVolume: 0.78,
    sfxVolume: 0.92
  };

  function currentLevel() {
    return levels[state.levelIndex];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function safeLocalStorageGet(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_error) {
      return fallback;
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      // Ignore private browsing / blocked storage.
    }
  }

  function updateSoundButton() {
    if (!soundButton) return;
    soundButton.textContent = audioState.enabled ? 'Audio On' : 'Audio Off';
    soundButton.classList.toggle('soundOff', !audioState.enabled);
    soundButton.classList.toggle('isMuted', !audioState.enabled);
    soundButton.setAttribute('aria-pressed', audioState.enabled ? 'true' : 'false');
    soundButton.setAttribute('aria-label', audioState.enabled ? 'Mute music and sound effects' : 'Unmute music and sound effects');
  }

  function createNoiseBuffer(ctx, duration = 0.18) {
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < sampleCount; i += 1) {
      // Soft brown-ish noise. Smoother than raw white noise, with less harshness.
      const white = Math.random() * 2 - 1;
      last = last * 0.88 + white * 0.12;
      data[i] = last * 0.42;
    }
    return buffer;
  }

  function ensureAudio() {
    if (!audioState.enabled) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!audioState.ctx) {
      const ctx = new AudioContext({ latencyHint: 'interactive' });

      const master = ctx.createGain();
      master.gain.value = audioState.sfxVolume;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 6200;
      filter.Q.value = 0.28;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -30;
      compressor.knee.value = 32;
      compressor.ratio.value = 1.85;
      compressor.attack.value = 0.026;
      compressor.release.value = 0.31;

      const delay = ctx.createDelay(0.45);
      delay.delayTime.value = 0.142;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.075;
      const delayWet = ctx.createGain();
      delayWet.gain.value = 0.032;

      master.connect(filter);
      filter.connect(compressor);
      compressor.connect(ctx.destination);

      master.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(delayWet);
      delayWet.connect(compressor);

      audioState.ctx = ctx;
      audioState.master = master;
      audioState.delay = delay;
      audioState.delayWet = delayWet;
      audioState.filter = filter;
    }

    if (audioState.master) {
      audioState.master.gain.setTargetAtTime(audioState.sfxVolume, audioState.ctx.currentTime, 0.018);
    }

    if (audioState.ctx.state === 'suspended') {
      audioState.ctx.resume().catch(() => {});
    }

    audioState.unlocked = true;
    return audioState.ctx;
  }

  function configureMusicElement() {
    if (!bgMusic) return;
    bgMusic.loop = true;
    bgMusic.muted = !audioState.enabled;
    bgMusic.volume = audioState.enabled ? audioState.musicVolume : 0;
    bgMusic.setAttribute('playsinline', '');
  }

  function startMusic({ restart = false } = {}) {
    if (!bgMusic || !audioState.enabled) return;
    configureMusicElement();
    if (restart) {
      try { bgMusic.currentTime = 0; } catch (_error) {}
    }
    audioState.musicStarted = true;
    const playAttempt = bgMusic.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        audioState.musicBlocked = true;
      });
    }
  }

  function unlockMusicFromGesture() {
    if (state.mode !== 'play' || !audioState.enabled) return;
    ensureAudio();
    startMusic();
  }

  function pauseMusic() {
    if (!bgMusic) return;
    bgMusic.pause();
  }

  function resumeMusicIfAllowed() {
    if (document.hidden) {
      pauseMusic();
      return;
    }
    if (state.mode === 'play' && audioState.enabled && audioState.musicStarted) startMusic();
  }

  function tone({ freq, start = 0, duration = 0.2, gain = 0.08, type = 'sine', attack = 0.012, release = 0.13, detune = 0, destination = null }) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(detune, now);

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(attack + 0.02, duration - release));
    amp.gain.setValueAtTime(0.0001, now + duration + 0.02);

    if (pan) {
      pan.pan.value = (Math.random() - 0.5) * 0.18;
      osc.connect(amp);
      amp.connect(pan);
      pan.connect(destination || audioState.master);
    } else {
      osc.connect(amp);
      amp.connect(destination || audioState.master);
    }

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function glideTone({ freqStart, freqEnd, start = 0, duration = 0.5, gain = 0.035, type = 'sine', attack = 0.035, release = 0.24, destination = null }) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + Math.max(0.04, duration * 0.88));

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(attack + 0.02, duration - release));
    amp.gain.setValueAtTime(0.0001, now + duration + 0.03);

    osc.connect(amp);
    amp.connect(destination || audioState.master);
    osc.start(now);
    osc.stop(now + duration + 0.06);
  }

  function noiseSweep({ start = 0, duration = 0.16, gain = 0.035, frequency = 1400, q = 0.5 }) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime + start;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();

    src.buffer = createNoiseBuffer(ctx, duration);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, frequency * 0.62), now + duration);
    filter.Q.value = q;

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.018);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(amp);
    amp.connect(audioState.master);
    src.start(now);
    src.stop(now + duration + 0.03);
  }


  function softLayerBus({ start = 0, duration = 0.5, gain = 0.10, lowpass = 4200, resonance = 0.25 }) {
    const ctx = ensureAudio();
    if (!ctx) return null;
    const now = ctx.currentTime + start;
    const bus = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    const shelf = ctx.createBiquadFilter();

    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + 0.018);
    bus.gain.exponentialRampToValueAtTime(Math.max(0.00012, gain * 0.34), now + duration * 0.55);
    bus.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.05);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(lowpass, now);
    lp.Q.value = resonance;

    shelf.type = 'lowshelf';
    shelf.frequency.value = 260;
    shelf.gain.value = 0.7;

    bus.connect(shelf);
    shelf.connect(lp);
    lp.connect(audioState.master);
    return { ctx, now, bus, stopAt: now + duration + 0.08 };
  }

  function connectSmoothOsc({ bus, ctx, now, freq, endFreq = null, duration = 0.3, gain = 0.04, type = 'sine', detune = 0, start = 0, attack = 0.018, release = 0.18 }) {
    const t0 = now + start;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + Math.max(0.04, duration * 0.8));
    osc.detune.setValueAtTime(detune, t0);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(attack + 0.02, duration - release));
    amp.gain.setValueAtTime(0.0001, t0 + duration + 0.02);
    osc.connect(amp);
    amp.connect(bus);
    osc.start(t0);
    osc.stop(t0 + duration + 0.06);
  }

  function connectSmoothNoise({ bus, ctx, now, start = 0, duration = 0.24, gain = 0.025, from = 900, to = 1800, q = 0.25, type = 'bandpass' }) {
    const t0 = now + start;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    src.buffer = createNoiseBuffer(ctx, duration + 0.05);
    filter.type = type;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + duration);
    filter.Q.value = q;
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.028);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(bus);
    src.start(t0);
    src.stop(t0 + duration + 0.06);
  }

  function playLampOnSfx() {
    const pack = softLayerBus({ duration: 0.82, gain: 0.17, lowpass: 5400, resonance: 0.20 });
    if (!pack) return;
    const { ctx, now, bus } = pack;
    // Filament warming + glass bubble bloom. Soft attack, no arcade sparkle.
    connectSmoothOsc({ bus, ctx, now, freq: 130.81, endFreq: 196.00, duration: 0.70, gain: 0.050, type: 'sine', attack: 0.055, release: 0.45 });
    connectSmoothOsc({ bus, ctx, now, freq: 261.63, endFreq: 392.00, duration: 0.64, gain: 0.043, type: 'triangle', start: 0.035, attack: 0.060, release: 0.42 });
    connectSmoothOsc({ bus, ctx, now, freq: 622.25, endFreq: 783.99, duration: 0.56, gain: 0.025, type: 'sine', start: 0.110, attack: 0.070, release: 0.38, detune: -5 });
    connectSmoothOsc({ bus, ctx, now, freq: 932.33, endFreq: 1174.66, duration: 0.44, gain: 0.015, type: 'sine', start: 0.185, attack: 0.075, release: 0.30, detune: 4 });
    connectSmoothNoise({ bus, ctx, now, start: 0.045, duration: 0.45, gain: 0.014, from: 480, to: 1650, q: 0.18, type: 'bandpass' });
  }


  function premiumGlassSpark({ start = 0, base = 440, gain = 1, spread = 1 }) {
    const ctx = ensureAudio();
    if (!ctx) return;
    // Layered, tuned, soft-glass accent. It avoids stock UI beeps by combining
    // a rounded body, a quiet high refraction, and a short filtered breath.
    tone({ freq: base * 0.50, start, duration: 0.17, gain: 0.028 * gain, type: 'sine', attack: 0.006, release: 0.135, detune: -4 * spread });
    tone({ freq: base, start: start + 0.006, duration: 0.24, gain: 0.024 * gain, type: 'triangle', attack: 0.009, release: 0.175, detune: 3 * spread });
    tone({ freq: base * 1.498, start: start + 0.025, duration: 0.31, gain: 0.018 * gain, type: 'sine', attack: 0.014, release: 0.225, detune: -5 * spread });
    tone({ freq: base * 2.02, start: start + 0.045, duration: 0.26, gain: 0.010 * gain, type: 'sine', attack: 0.020, release: 0.205, detune: 7 * spread });
    noiseSweep({ start: start + 0.010, duration: 0.13, gain: 0.010 * gain, frequency: base * 2.1, q: 0.16 });
  }

  function playStartSfx() {
    const pack = softLayerBus({ duration: 0.92, gain: 0.135, lowpass: 4800, resonance: 0.22 });
    if (!pack) return;
    const { ctx, now, bus } = pack;
    // Soft lens-aperture opening: warm, slow, and tactile.
    connectSmoothOsc({ bus, ctx, now, freq: 73.42, endFreq: 98.00, duration: 0.82, gain: 0.055, type: 'sine', attack: 0.080, release: 0.50 });
    connectSmoothOsc({ bus, ctx, now, freq: 146.83, endFreq: 220.00, duration: 0.72, gain: 0.043, type: 'triangle', start: 0.025, attack: 0.070, release: 0.46 });
    connectSmoothOsc({ bus, ctx, now, freq: 293.66, endFreq: 329.63, duration: 0.64, gain: 0.028, type: 'sine', start: 0.100, attack: 0.080, release: 0.40, detune: -3 });
    connectSmoothNoise({ bus, ctx, now, start: 0.030, duration: 0.58, gain: 0.020, from: 320, to: 1580, q: 0.16 });
    connectSmoothOsc({ bus, ctx, now, freq: 587.33, endFreq: 659.25, duration: 0.44, gain: 0.012, type: 'sine', start: 0.330, attack: 0.080, release: 0.28 });
  }

  function playLevelRevealSfx() {
    const pack = softLayerBus({ duration: 0.70, gain: 0.090, lowpass: 4300, resonance: 0.18 });
    if (!pack) return;
    const { ctx, now, bus } = pack;
    // Pane-of-glass reveal: more breath than chime.
    connectSmoothNoise({ bus, ctx, now, start: 0.000, duration: 0.52, gain: 0.025, from: 280, to: 1150, q: 0.14, type: 'bandpass' });
    connectSmoothOsc({ bus, ctx, now, freq: 164.81, endFreq: 220.00, duration: 0.56, gain: 0.030, type: 'sine', attack: 0.070, release: 0.35 });
    connectSmoothOsc({ bus, ctx, now, freq: 329.63, endFreq: 415.30, duration: 0.42, gain: 0.018, type: 'triangle', start: 0.105, attack: 0.060, release: 0.28 });
    connectSmoothOsc({ bus, ctx, now, freq: 740.00, endFreq: 880.00, duration: 0.28, gain: 0.010, type: 'sine', start: 0.270, attack: 0.050, release: 0.18 });
  }

  function playVictoryBeamSfx() {
    const ctx = ensureAudio();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = state.victoryDuration / 1000;
    const arrivalTime = now + duration;
    const bus = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    const presence = ctx.createBiquadFilter();

    // The sound envelope is locked to drawVictoryBeam(): same duration, same
    // travel finish. The crescendo now peaks exactly when the beam head reaches
    // the bulb, then releases after the hit instead of continuing late.
    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.exponentialRampToValueAtTime(0.016, now + duration * 0.08);
    bus.gain.linearRampToValueAtTime(0.058, now + duration * 0.40);
    bus.gain.linearRampToValueAtTime(0.125, now + duration * 0.72);
    bus.gain.linearRampToValueAtTime(0.205, arrivalTime);
    bus.gain.exponentialRampToValueAtTime(0.0001, arrivalTime + 0.18);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(500, now);
    lp.frequency.exponentialRampToValueAtTime(1650, now + duration * 0.42);
    lp.frequency.exponentialRampToValueAtTime(8200, arrivalTime);
    lp.Q.value = 0.16;

    presence.type = 'peaking';
    presence.frequency.setValueAtTime(920, now);
    presence.frequency.exponentialRampToValueAtTime(3600, arrivalTime);
    presence.Q.value = 0.34;
    presence.gain.value = 2.4;

    const makeOsc = ({ type, startFreq, endFreq, start = 0, stop = duration, gain = 0.045, detune = 0 }) => {
      const t0 = now + start;
      const t1 = Math.min(now + stop, arrivalTime);
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), arrivalTime);
      osc.detune.setValueAtTime(detune, t0);
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(gain * 0.16, Math.min(t0 + 0.08, arrivalTime - 0.02));
      amp.gain.linearRampToValueAtTime(gain * 0.48, now + duration * 0.58);
      amp.gain.linearRampToValueAtTime(gain, arrivalTime);
      amp.gain.exponentialRampToValueAtTime(0.0001, arrivalTime + 0.16);
      osc.connect(amp);
      amp.connect(bus);
      osc.start(t0);
      osc.stop(arrivalTime + 0.20);
    };

    makeOsc({ type: 'sine', startFreq: 73.42, endFreq: 174.61, gain: 0.052, detune: -2 });
    makeOsc({ type: 'triangle', startFreq: 146.83, endFreq: 392.00, start: 0.040, gain: 0.043, detune: 3 });
    makeOsc({ type: 'sine', startFreq: 293.66, endFreq: 880.00, start: 0.150, gain: 0.032, detune: -4 });
    makeOsc({ type: 'sine', startFreq: 587.33, endFreq: 1760.00, start: duration * 0.43, gain: 0.022, detune: 5 });
    makeOsc({ type: 'sine', startFreq: 1174.66, endFreq: 2793.83, start: duration * 0.68, gain: 0.014, detune: -6 });

    const air = ctx.createBufferSource();
    const airFilter = ctx.createBiquadFilter();
    const airAmp = ctx.createGain();
    air.buffer = createNoiseBuffer(ctx, duration + 0.22);
    airFilter.type = 'bandpass';
    airFilter.frequency.setValueAtTime(300, now);
    airFilter.frequency.exponentialRampToValueAtTime(1400, now + duration * 0.48);
    airFilter.frequency.exponentialRampToValueAtTime(5600, arrivalTime);
    airFilter.Q.value = 0.10;
    airAmp.gain.setValueAtTime(0.0001, now);
    airAmp.gain.linearRampToValueAtTime(0.010, now + duration * 0.30);
    airAmp.gain.linearRampToValueAtTime(0.030, now + duration * 0.70);
    airAmp.gain.linearRampToValueAtTime(0.058, arrivalTime);
    airAmp.gain.exponentialRampToValueAtTime(0.0001, arrivalTime + 0.15);

    air.connect(airFilter);
    airFilter.connect(airAmp);
    airAmp.connect(bus);
    bus.connect(presence);
    presence.connect(lp);
    lp.connect(audioState.master);
    air.start(now);
    air.stop(arrivalTime + 0.18);
  }

  function playLaserSwordSfx() {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const duration = Math.max(1.05, state.victoryDuration / 1000);

    // Soft laser-blade tone: rounded movement, no brittle sci-fi buzz.
    const bus = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    const body = ctx.createBiquadFilter();
    const airFilter = ctx.createBiquadFilter();

    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.exponentialRampToValueAtTime(0.044, now + 0.080);
    bus.gain.linearRampToValueAtTime(0.080, now + duration * 0.70);
    bus.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.24);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1450, now);
    lp.frequency.exponentialRampToValueAtTime(4200, now + duration * 0.85);
    lp.Q.value = 0.20;

    body.type = 'peaking';
    body.frequency.value = 170;
    body.Q.value = 0.42;
    body.gain.value = 2.8;

    airFilter.type = 'bandpass';
    airFilter.frequency.setValueAtTime(520, now);
    airFilter.frequency.exponentialRampToValueAtTime(1500, now + duration * 0.75);
    airFilter.Q.value = 0.16;

    const humA = ctx.createOscillator();
    const humB = ctx.createOscillator();
    const humC = ctx.createOscillator();
    const humMix = ctx.createGain();
    humA.type = 'triangle';
    humB.type = 'sine';
    humC.type = 'sine';
    humA.frequency.setValueAtTime(68, now);
    humA.frequency.exponentialRampToValueAtTime(92, now + duration * 0.80);
    humB.frequency.setValueAtTime(103, now);
    humB.frequency.exponentialRampToValueAtTime(138, now + duration * 0.82);
    humC.frequency.setValueAtTime(136, now);
    humC.frequency.exponentialRampToValueAtTime(184, now + duration * 0.84);
    humMix.gain.value = 0.34;

    const ignition = ctx.createOscillator();
    const ignitionAmp = ctx.createGain();
    ignition.type = 'sine';
    ignition.frequency.setValueAtTime(72, now);
    ignition.frequency.exponentialRampToValueAtTime(238, now + 0.24);
    ignition.frequency.exponentialRampToValueAtTime(338, now + 0.42);
    ignitionAmp.gain.setValueAtTime(0.0001, now);
    ignitionAmp.gain.exponentialRampToValueAtTime(0.080, now + 0.060);
    ignitionAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.50);

    const noise = ctx.createBufferSource();
    const noiseAmp = ctx.createGain();
    noise.buffer = createNoiseBuffer(ctx, duration + 0.32);
    noiseAmp.gain.setValueAtTime(0.0001, now);
    noiseAmp.gain.exponentialRampToValueAtTime(0.018, now + 0.085);
    noiseAmp.gain.linearRampToValueAtTime(0.034, now + duration * 0.78);
    noiseAmp.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.22);

    humA.connect(humMix);
    humB.connect(humMix);
    humC.connect(humMix);
    humMix.connect(body);
    body.connect(bus);
    ignition.connect(ignitionAmp);
    ignitionAmp.connect(bus);
    noise.connect(airFilter);
    airFilter.connect(noiseAmp);
    noiseAmp.connect(bus);
    bus.connect(lp);
    lp.connect(audioState.master);

    humA.start(now);
    humB.start(now + 0.010);
    humC.start(now + 0.020);
    ignition.start(now);
    noise.start(now);
    humA.stop(now + duration + 0.24);
    humB.stop(now + duration + 0.24);
    humC.stop(now + duration + 0.24);
    ignition.stop(now + 0.55);
    noise.stop(now + duration + 0.28);
  }

  function playRotateSfx() {
    const ctx = ensureAudio();
    if (!ctx) return;
    const nowPerf = performance.now();
    if (nowPerf - audioState.lastTrigger < 38) return;
    audioState.lastTrigger = nowPerf;

    // Primary interaction sound: audible, velvety glass rotation, not a UI click.
    const pack = softLayerBus({ duration: 0.42, gain: 0.220, lowpass: 5200, resonance: 0.18 });
    if (!pack) return;
    const { ctx: c, now, bus } = pack;
    connectSmoothOsc({ bus, ctx: c, now, freq: 82.41, endFreq: 123.47, duration: 0.25, gain: 0.080, type: 'sine', attack: 0.012, release: 0.16 });
    connectSmoothOsc({ bus, ctx: c, now, freq: 196.00, endFreq: 261.63, duration: 0.24, gain: 0.066, type: 'triangle', start: 0.010, attack: 0.012, release: 0.16, detune: -3 });
    connectSmoothOsc({ bus, ctx: c, now, freq: 466.16, endFreq: 622.25, duration: 0.32, gain: 0.045, type: 'sine', start: 0.032, attack: 0.022, release: 0.22, detune: 4 });
    connectSmoothOsc({ bus, ctx: c, now, freq: 932.33, endFreq: 1244.51, duration: 0.27, gain: 0.026, type: 'sine', start: 0.085, attack: 0.030, release: 0.18, detune: -5 });
    connectSmoothNoise({ bus, ctx: c, now, start: 0.010, duration: 0.23, gain: 0.045, from: 360, to: 2100, q: 0.10, type: 'bandpass' });
    connectSmoothNoise({ bus, ctx: c, now, start: 0.120, duration: 0.20, gain: 0.020, from: 1700, to: 760, q: 0.12, type: 'bandpass' });
  }

  function playBeamMissSfx() {
    const pack = softLayerBus({ duration: 0.50, gain: 0.105, lowpass: 3600, resonance: 0.16 });
    if (!pack) return;
    const { ctx, now, bus } = pack;
    // Absorbed light: soft closure, no fail-buzzer.
    connectSmoothOsc({ bus, ctx, now, freq: 220.00, endFreq: 138.59, duration: 0.40, gain: 0.048, type: 'sine', attack: 0.030, release: 0.25 });
    connectSmoothOsc({ bus, ctx, now, freq: 110.00, endFreq: 82.41, duration: 0.42, gain: 0.038, type: 'sine', start: 0.030, attack: 0.040, release: 0.28 });
    connectSmoothNoise({ bus, ctx, now, start: 0.020, duration: 0.28, gain: 0.018, from: 560, to: 260, q: 0.13 });
  }

  function playLevelClearSfx() {
    // Delay the larger clear bloom slightly so the lamp-on sound gets the first word.
    const pack = softLayerBus({ start: 0.070, duration: 1.02, gain: 0.142, lowpass: 5200, resonance: 0.19 });
    if (!pack) return;
    const { ctx, now, bus } = pack;
    connectSmoothOsc({ bus, ctx, now, freq: 98.00, endFreq: 146.83, duration: 0.86, gain: 0.052, type: 'sine', attack: 0.075, release: 0.55 });
    connectSmoothOsc({ bus, ctx, now, freq: 196.00, endFreq: 293.66, duration: 0.82, gain: 0.044, type: 'triangle', start: 0.020, attack: 0.070, release: 0.52 });
    connectSmoothOsc({ bus, ctx, now, freq: 392.00, endFreq: 587.33, duration: 0.72, gain: 0.030, type: 'sine', start: 0.110, attack: 0.090, release: 0.44 });
    connectSmoothOsc({ bus, ctx, now, freq: 783.99, endFreq: 987.77, duration: 0.52, gain: 0.018, type: 'sine', start: 0.260, attack: 0.100, release: 0.32 });
    connectSmoothNoise({ bus, ctx, now, start: 0.050, duration: 0.58, gain: 0.020, from: 380, to: 1720, q: 0.14 });
  }

  function playResetSfx() {
    const pack = softLayerBus({ duration: 0.48, gain: 0.100, lowpass: 3900, resonance: 0.16 });
    if (!pack) return;
    const { ctx, now, bus } = pack;
    // Gentle reverse prism, not an error cue.
    connectSmoothOsc({ bus, ctx, now, freq: 349.23, endFreq: 174.61, duration: 0.38, gain: 0.052, type: 'triangle', attack: 0.020, release: 0.25 });
    connectSmoothOsc({ bus, ctx, now, freq: 196.00, endFreq: 130.81, duration: 0.40, gain: 0.034, type: 'sine', start: 0.045, attack: 0.030, release: 0.27 });
    connectSmoothNoise({ bus, ctx, now, start: 0.000, duration: 0.26, gain: 0.018, from: 980, to: 320, q: 0.11 });
  }

  function playAdvanceSfx() {
    const pack = softLayerBus({ duration: 0.52, gain: 0.115, lowpass: 4700, resonance: 0.18 });
    if (!pack) return;
    const { ctx, now, bus } = pack;
    // Forward refraction between levels.
    connectSmoothOsc({ bus, ctx, now, freq: 174.61, endFreq: 261.63, duration: 0.42, gain: 0.048, type: 'sine', attack: 0.040, release: 0.27 });
    connectSmoothOsc({ bus, ctx, now, freq: 440.00, endFreq: 659.25, duration: 0.36, gain: 0.024, type: 'sine', start: 0.090, attack: 0.050, release: 0.22 });
    connectSmoothNoise({ bus, ctx, now, start: 0.030, duration: 0.32, gain: 0.020, from: 520, to: 2100, q: 0.12 });
  }

  function toggleSound() {
    audioState.enabled = !audioState.enabled;
    safeLocalStorageSet('pathwayAudioEnabled', audioState.enabled ? '1' : '0');
    updateSoundButton();

    if (!audioState.enabled) {
      pauseMusic();
      if (audioState.ctx && audioState.master) {
        audioState.master.gain.cancelScheduledValues(audioState.ctx.currentTime);
        audioState.master.gain.setTargetAtTime(0.0001, audioState.ctx.currentTime, 0.018);
      }
      return;
    }

    ensureAudio();
    startMusic();
    tone({ freq: 440, start: 0.000, duration: 0.13, gain: 0.024, type: 'sine', attack: 0.009, release: 0.09 });
    tone({ freq: 660, start: 0.045, duration: 0.16, gain: 0.018, type: 'triangle', attack: 0.012, release: 0.11 });
  }

  function angleForOrientation(orientation) {
    return orientation === 0 ? Math.PI / 4 : -Math.PI / 4;
  }

  function paddedLevelNumber(id) {
    return String(id).padStart(2, '0');
  }

  function getPlaySafeFrame(cssW, cssH) {
    const shellRect = canvas.getBoundingClientRect();
    const landscape = cssW > cssH * 1.18;
    const desktopWide = landscape && cssW >= 900;
    const sidePad = desktopWide ? 36 : landscape ? 24 : 14;
    const gap = desktopWide ? 18 : landscape ? 12 : 16;

    const frame = {
      left: sidePad,
      right: cssW - sidePad,
      top: 14,
      bottom: cssH - 14
    };

    if (state.mode !== 'start') {
      if (!topHud.classList.contains('hidden')) {
        const hudRect = topHud.getBoundingClientRect();
        frame.top = Math.max(frame.top, hudRect.bottom - shellRect.top + gap);
      }

      if (!bottomHud.classList.contains('hidden')) {
        const barRect = bottomHud.getBoundingClientRect();
        frame.bottom = Math.min(frame.bottom, barRect.top - shellRect.top - gap);
      }
    }

    if (frame.right - frame.left < cssW * 0.54) {
      frame.left = sidePad * 0.5;
      frame.right = cssW - sidePad * 0.5;
    }

    if (frame.bottom - frame.top < cssH * 0.44) {
      const emergencyGap = landscape ? 8 : 10;
      frame.top = state.mode === 'start' ? 12 : Math.min(frame.top, cssH * 0.26);
      frame.bottom = Math.max(frame.bottom, cssH - (bottomHud.classList.contains('hidden') ? 12 : 64) - emergencyGap);
    }

    return frame;
  }

  function resize() {
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    state.dpr = dpr;
    state.width = width;
    state.height = height;

    const cssW = rect.width;
    const cssH = rect.height;
    const portrait = cssH > cssW * 1.08;
    const landscape = cssW > cssH * 1.18;
    const desktopWide = landscape && cssW >= 900;
    const level = currentLevel();
    const boardUnits = level.grid + 1.02;
    const safe = getPlaySafeFrame(cssW, cssH);
    const availableW = Math.max(1, safe.right - safe.left);
    const availableH = Math.max(1, safe.bottom - safe.top);
    const scaleCSS = Math.min(availableW / boardUnits, availableH / boardUnits);
    const maxScaleCSS = desktopWide ? 98 : landscape ? 86 : portrait ? 116 : 102;
    const minReadableCSS = portrait ? 30 : landscape ? 20 : 26;
    const fittedScaleCSS = Math.max(Math.min(scaleCSS, maxScaleCSS), Math.min(minReadableCSS, scaleCSS));

    state.boardScale = fittedScaleCSS * dpr;
    state.boardCenterX = ((safe.left + safe.right) * 0.5) * dpr;
    state.boardCenterY = ((safe.top + safe.bottom) * 0.5) * dpr;

    gl.viewport(0, 0, width, height);
    recalculateBeam();
  }

  function worldFromCell(col, row) {
    const level = currentLevel();
    const half = (level.grid - 1) / 2;
    return {
      x: col - half,
      y: half - row
    };
  }

  function screenFromWorld(x, y) {
    return {
      x: state.boardCenterX + x * state.boardScale,
      y: state.boardCenterY - y * state.boardScale
    };
  }

  function screenFromCell(col, row) {
    const p = worldFromCell(col, row);
    return screenFromWorld(p.x, p.y);
  }

  function cssPointerToDevice(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * state.dpr,
      y: (event.clientY - rect.top) * state.dpr
    };
  }

  function addTriangle(x1, y1, x2, y2, x3, y3, color) {
    state.vertices.push(
      x1, y1, color[0], color[1], color[2], color[3],
      x2, y2, color[0], color[1], color[2], color[3],
      x3, y3, color[0], color[1], color[2], color[3]
    );
  }

  function addRect(x, y, w, h, color) {
    addTriangle(x, y, x + w, y, x, y + h, color);
    addTriangle(x + w, y, x + w, y + h, x, y + h, color);
  }

  function addCircle(cx, cy, radius, color, segments = 56) {
    for (let i = 0; i < segments; i += 1) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      addTriangle(
        cx, cy,
        cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius,
        cx + Math.cos(a2) * radius, cy + Math.sin(a2) * radius,
        color
      );
    }
  }

  function addRing(cx, cy, radiusOuter, radiusInner, color, segments = 72) {
    for (let i = 0; i < segments; i += 1) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const ox1 = cx + Math.cos(a1) * radiusOuter;
      const oy1 = cy + Math.sin(a1) * radiusOuter;
      const ox2 = cx + Math.cos(a2) * radiusOuter;
      const oy2 = cy + Math.sin(a2) * radiusOuter;
      const ix1 = cx + Math.cos(a1) * radiusInner;
      const iy1 = cy + Math.sin(a1) * radiusInner;
      const ix2 = cx + Math.cos(a2) * radiusInner;
      const iy2 = cy + Math.sin(a2) * radiusInner;
      addTriangle(ox1, oy1, ox2, oy2, ix1, iy1, color);
      addTriangle(ox2, oy2, ix2, iy2, ix1, iy1, color);
    }
  }

  function addLine(x1, y1, x2, y2, width, color) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return;
    const nx = -dy / len * width * 0.5;
    const ny = dx / len * width * 0.5;
    addTriangle(x1 + nx, y1 + ny, x2 + nx, y2 + ny, x1 - nx, y1 - ny, color);
    addTriangle(x2 + nx, y2 + ny, x2 - nx, y2 - ny, x1 - nx, y1 - ny, color);
  }

  function addPartialLine(x1, y1, x2, y2, width, color, progress) {
    const t = clamp(progress, 0, 1);
    if (t <= 0) return;
    addLine(x1, y1, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width, color);
  }


  function softColor(color, alphaMultiplier = 1) {
    return [color[0], color[1], color[2], clamp((color[3] === undefined ? 1 : color[3]) * alphaMultiplier, 0, 1)];
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2;
  }

  function pulse01(value) {
    return 0.5 + 0.5 * Math.sin(value);
  }

  function addDiamond(cx, cy, r, color) {
    addTriangle(cx, cy - r, cx + r, cy, cx, cy + r, color);
    addTriangle(cx, cy - r, cx, cy + r, cx - r, cy, color);
  }

  function addFacet(cx, cy, r, angle, color) {
    const a = angle;
    const b = angle + Math.PI * 0.72;
    const c = angle - Math.PI * 0.72;
    addTriangle(
      cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2,
      cx + Math.cos(b) * r * 0.52, cy + Math.sin(b) * r * 0.52,
      cx + Math.cos(c) * r * 0.52, cy + Math.sin(c) * r * 0.52,
      color
    );
  }

  function beamPointAt(progress) {
    const totalLength = state.beamSegments.reduce((sum, segment) => sum + Math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y), 0);
    if (totalLength <= 0.001 || state.beamSegments.length === 0) return null;
    const targetLength = clamp(progress, 0, 1) * totalLength;
    let travelled = 0;
    for (const segment of state.beamSegments) {
      const length = Math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y);
      if (travelled + length >= targetLength) {
        const t = length <= 0.001 ? 0 : (targetLength - travelled) / length;
        return {
          x: segment.start.x + (segment.end.x - segment.start.x) * t,
          y: segment.start.y + (segment.end.y - segment.start.y) * t,
          dx: (segment.end.x - segment.start.x) / Math.max(length, 0.001),
          dy: (segment.end.y - segment.start.y) / Math.max(length, 0.001)
        };
      }
      travelled += length;
    }
    const last = state.beamSegments[state.beamSegments.length - 1];
    return { x: last.end.x, y: last.end.y, dx: 1, dy: 0 };
  }

  function drawBeamTravellers(now, count, radius, phaseStep, color, mode = 'dots') {
    for (let i = 0; i < count; i += 1) {
      const t = (now * 0.00018 + i / count + phaseStep) % 1;
      const p = beamPointAt(t);
      if (!p) continue;
      const sideX = -p.dy;
      const sideY = p.dx;
      const sway = Math.sin(now * 0.003 + i * 1.7) * state.boardScale * 0.055;
      const x = p.x + sideX * sway;
      const y = p.y + sideY * sway;
      if (mode === 'diamonds') addDiamond(x, y, radius * (0.72 + pulse01(now * 0.004 + i) * 0.35), softColor(color, 0.40));
      else addCircle(x, y, radius * (0.72 + pulse01(now * 0.004 + i) * 0.35), softColor(color, 0.42), 22);
    }
  }

  function addArcLine(cx, cy, radius, start, end, width, color, segments = 22) {
    let previous = null;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const a = start + (end - start) * t;
      const p = { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
      if (previous) addLine(previous.x, previous.y, p.x, p.y, width, color);
      previous = p;
    }
  }

  function addRoundedRect(x, y, w, h, r, color) {
    addRect(x + r, y, w - 2 * r, h, color);
    addRect(x, y + r, w, h - 2 * r, color);
    addCircle(x + r, y + r, r, color, 24);
    addCircle(x + w - r, y + r, r, color, 24);
    addCircle(x + r, y + h - r, r, color, 24);
    addCircle(x + w - r, y + h - r, r, color, 24);
  }

  function dirToDelta(direction) {
    switch (direction) {
      case 'right': return { dc: 1, dr: 0 };
      case 'left': return { dc: -1, dr: 0 };
      case 'up': return { dc: 0, dr: -1 };
      case 'down': return { dc: 0, dr: 1 };
      default: return { dc: 0, dr: 0 };
    }
  }

  function reflectDirection(direction, orientation) {
    if (orientation === 0) {
      return { right: 'up', up: 'right', left: 'down', down: 'left' }[direction];
    }
    return { right: 'down', down: 'right', left: 'up', up: 'left' }[direction];
  }

  function boundaryPointFromCell(col, row, direction) {
    const level = currentLevel();
    const world = worldFromCell(col, row);
    const half = level.grid / 2;
    let endX = world.x;
    let endY = world.y;
    if (direction === 'right') endX = half;
    if (direction === 'left') endX = -half;
    if (direction === 'up') endY = half;
    if (direction === 'down') endY = -half;
    return screenFromWorld(endX, endY);
  }

  function mirrorAt(col, row) {
    for (let i = 0; i < state.mirrorStates.length; i += 1) {
      const mirror = state.mirrorStates[i];
      if (mirror.col === col && mirror.row === row) return mirror;
    }
    return null;
  }

  function computeSolvedTargetEntryDir(level) {
    const solvedMirrors = new Map(level.mirrors.map((mirror) => [`${mirror.col},${mirror.row}`, mirror.solution]));
    let col = level.source.col;
    let row = level.source.row;
    let direction = level.source.dir;
    const seen = new Set();

    for (let guard = 0; guard < level.grid * level.grid * 5; guard += 1) {
      const key = `${col},${row},${direction}`;
      if (seen.has(key)) break;
      seen.add(key);

      const d = dirToDelta(direction);
      const nextCol = col + d.dc;
      const nextRow = row + d.dr;
      if (nextCol < 0 || nextCol >= level.grid || nextRow < 0 || nextRow >= level.grid) break;
      if (nextCol === level.target.col && nextRow === level.target.row) return direction;

      const solvedOrientation = solvedMirrors.get(`${nextCol},${nextRow}`);
      if (solvedOrientation !== undefined) direction = reflectDirection(direction, solvedOrientation);
      col = nextCol;
      row = nextRow;
    }
    return level.source.dir;
  }

  function recalculateBeam() {
    if (!state.width || !state.height) return;

    const level = currentLevel();
    const segments = [];
    let col = level.source.col;
    let row = level.source.row;
    let direction = level.source.dir;
    let start = screenFromCell(col, row);
    let solved = false;
    const seen = new Set();

    for (let guard = 0; guard < level.grid * level.grid * 3; guard += 1) {
      const key = `${col},${row},${direction}`;
      if (seen.has(key)) {
        segments.push({ start, end: boundaryPointFromCell(col, row, direction), hit: false });
        break;
      }
      seen.add(key);

      const d = dirToDelta(direction);
      const nextCol = col + d.dc;
      const nextRow = row + d.dr;

      if (nextCol < 0 || nextCol >= level.grid || nextRow < 0 || nextRow >= level.grid) {
        segments.push({ start, end: boundaryPointFromCell(col, row, direction), hit: false });
        break;
      }

      const next = screenFromCell(nextCol, nextRow);
      const isTarget = nextCol === level.target.col && nextRow === level.target.row;
      const mirror = mirrorAt(nextCol, nextRow);
      segments.push({ start, end: next, hit: isTarget });

      if (isTarget) {
        solved = true;
        break;
      }

      if (mirror) {
        direction = reflectDirection(direction, mirror.orientation);
        start = next;
        col = nextCol;
        row = nextRow;
        continue;
      }

      start = next;
      col = nextCol;
      row = nextRow;
    }

    state.beamSegments = segments;
    state.solved = solved;
    updateStatus();
  }

  function updateHud() {
    const level = currentLevel();
    const theme = currentTheme();
    levelStamp.textContent = `LEVEL ${paddedLevelNumber(level.id)}`;
    levelTitle.textContent = level.title;
    if (levelMood) levelMood.textContent = `${theme.name} · ${theme.mood}`;
    objective.textContent = level.objective;
    statusText.textContent = state.solved ? 'TARGET LIT' : 'BEAM MISSING';
    resultTitle.textContent = level.id === levels.length ? 'Path set' : 'Level clear';
    nextButton.textContent = level.id === levels.length ? `Replay Level ${level.id}` : 'Next Level';
  }

  function updateStatus() {
    if (state.mode !== 'play') return;
    statusText.textContent = state.solved ? 'TARGET LIT' : 'BEAM MISSING';
  }

  function retriggerHudReveal() {
    topHud.classList.remove('hudPulse');
    // Force a reflow so the glassmorph level reveal replays on every level load.
    void topHud.offsetWidth;
    topHud.classList.add('hudPulse');
  }

  function loadLevel(index) {
    state.levelIndex = clamp(index, 0, levels.length - 1);
    applyLevelTheme(state.levelIndex);
    const level = currentLevel();
    state.targetEntryDir = computeSolvedTargetEntryDir(level);
    state.mirrorStates = level.mirrors.map((mirror, idx) => ({
      index: idx,
      col: mirror.col,
      row: mirror.row,
      orientation: mirror.orientation,
      solution: mirror.solution,
      visualAngle: angleForOrientation(mirror.orientation),
      startAngle: angleForOrientation(mirror.orientation),
      targetAngle: angleForOrientation(mirror.orientation),
      animStart: 0,
      animDuration: 250,
      animating: false
    }));
    state.solved = false;
    state.activeMirrorIndex = -1;
    state.completionQueued = false;
    state.victoryStart = 0;
    state.victoryActive = false;
    state.victoryComplete = false;
    state.targetLit = false;
    state.targetLitSfxPlayed = false;
    state.victoryDanceSeed = level.id * 9973;
    state.victoryDanceStarted = false;
    levelResult.classList.add('hidden');
    topHud.classList.remove('hidden');
    bottomHud.classList.remove('hidden');
    updateHud();
    retriggerHudReveal();
    playLevelRevealSfx();
    resize();
    recalculateBeam();
  }

  function startGame() {
    ensureAudio();
    playStartSfx();
    startMusic({ restart: true });
    state.mode = 'play';
    startScreen.classList.add('hidden');
    loadLevel(0);
  }

  function resetLevel() {
    ensureAudio();
    playResetSfx();
    state.mode = 'play';
    loadLevel(state.levelIndex);
  }

  function nextLevel() {
    ensureAudio();
    playAdvanceSfx();
    if (state.levelIndex < levels.length - 1) {
      loadLevel(state.levelIndex + 1);
    } else {
      loadLevel(state.levelIndex);
    }
  }

  function startVictoryAnimation(now) {
    state.victoryStart = now || performance.now();
    state.victoryActive = true;
    state.victoryComplete = false;
    state.targetLit = false;
    state.targetLitSfxPlayed = false;
    state.victoryDanceSeed = currentLevel().id * 9973;
    state.victoryDanceStarted = true;
    playVictoryBeamSfx();
    // Keep the blade hum after the travelling-beam crescendo so it cannot
    // make the beam animation sound like it is falling downward.
    window.setTimeout(() => {
      if (state.solved && state.mode === 'play') playLaserSwordSfx();
    }, state.victoryDuration + 110);
  }

  function showCompleteSoon() {
    if (state.completionQueued) return;
    state.completionQueued = true;
    window.setTimeout(() => {
      if (!state.solved || state.mode !== 'play') return;
      levelResult.classList.remove('hidden');
    }, state.victoryDuration + 260);
  }

  function pointInMirror(point) {
    for (let i = 0; i < state.mirrorStates.length; i += 1) {
      const mirror = state.mirrorStates[i];
      const c = screenFromCell(mirror.col, mirror.row);
      const radius = state.boardScale * 0.48;
      if (Math.hypot(point.x - c.x, point.y - c.y) <= radius) return i;
    }
    return -1;
  }

  function rotateMirror(index) {
    if (state.mode !== 'play' || state.solved) return;
    const mirror = state.mirrorStates[index];
    if (!mirror || mirror.animating) return;
    ensureAudio();
    playRotateSfx();
    mirror.animating = true;
    mirror.startAngle = mirror.visualAngle;
    mirror.targetAngle = mirror.visualAngle + Math.PI / 2;
    mirror.animStart = performance.now();
    state.activeMirrorIndex = index;
  }

  function updateMirrorAnimations(now) {
    let anyCompleted = false;
    for (const mirror of state.mirrorStates) {
      if (!mirror.animating) continue;
      const elapsed = now - mirror.animStart;
      const t = clamp(elapsed / mirror.animDuration, 0, 1);
      const eased = easeOutCubic(t);
      mirror.visualAngle = mirror.startAngle + (mirror.targetAngle - mirror.startAngle) * eased;
      if (t >= 1) {
        mirror.animating = false;
        mirror.visualAngle = mirror.targetAngle;
        mirror.orientation = mirror.orientation === 1 ? 0 : 1;
        anyCompleted = true;
      }
    }

    if (anyCompleted) {
      recalculateBeam();
      if (state.solved) {
        startVictoryAnimation(now);
        window.setTimeout(() => {
          if (state.solved && state.mode === 'play') playLevelClearSfx();
        }, state.victoryDuration + 40);
        showCompleteSoon();
      } else {
        playBeamMissSfx();
      }
    }
  }

  function drawBackground(now) {
    addRect(0, 0, state.width, state.height, colors.background);
    const pulse = Math.sin(now * 0.0008) * 0.04;
    addCircle(state.width * 0.18, state.height * 0.14, state.boardScale * (1.28 + pulse), colors.auraLight, 64);
    addCircle(state.width * 0.82, state.height * 0.16, state.boardScale * 1.52, colors.auraA, 72);
    addCircle(state.width * 0.16, state.height * 0.88, state.boardScale * 1.68, colors.auraB, 72);
    addCircle(state.width * 0.86, state.height * 0.88, state.boardScale * 1.1, colors.auraC, 72);
  }

  function drawBoardFrame(now) {
    const level = currentLevel();
    const boardPx = state.boardScale * level.grid;
    const pad = state.boardScale * 0.36;
    const x = state.boardCenterX - boardPx / 2 - pad;
    const y = state.boardCenterY - boardPx / 2 - pad;
    const size = boardPx + pad * 2;
    addRoundedRect(x + state.boardScale * 0.06, y + state.boardScale * 0.12, size, size, state.boardScale * 0.23, colors.shadow);
    addRoundedRect(x, y, size, size, state.boardScale * 0.23, colors.panel);

    const t = now * 0.001;
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 + t * 0.08;
      const cx = state.boardCenterX + Math.cos(a) * (size * 0.52);
      const cy = state.boardCenterY + Math.sin(a) * (size * 0.52);
      addCircle(cx, cy, state.boardScale * 0.055, colors.panelStroke, 18);
    }
  }

  function drawGrid() {
    const level = currentLevel();
    const half = level.grid / 2;
    const minWorld = -half;
    const maxWorld = half;

    for (let i = 0; i <= level.grid; i += 1) {
      const xw = minWorld + i;
      const top = screenFromWorld(xw, maxWorld);
      const bottom = screenFromWorld(xw, minWorld);
      addLine(top.x, top.y, bottom.x, bottom.y, Math.max(1, state.dpr), colors.gridStroke);

      const yw = minWorld + i;
      const left = screenFromWorld(minWorld, yw);
      const right = screenFromWorld(maxWorld, yw);
      addLine(left.x, left.y, right.x, right.y, Math.max(1, state.dpr), colors.gridStroke);
    }

    for (let row = 0; row < level.grid; row += 1) {
      for (let col = 0; col < level.grid; col += 1) {
        const c = screenFromCell(col, row);
        const r = state.boardScale * 0.30;
        const phase = (col * 0.7 + row * 0.47) % Math.PI;
        addRing(c.x, c.y, r, r - state.boardScale * 0.012, colors.ornament, 50);
        addArcLine(c.x, c.y, r * 0.74, phase, phase + Math.PI * 0.78, state.boardScale * 0.015, colors.ornament2, 14);
        addArcLine(c.x, c.y, r * 0.52, phase + Math.PI, phase + Math.PI * 1.62, state.boardScale * 0.012, colors.ornament, 12);
        if ((col + row) % 3 === 0) {
          const world = worldFromCell(col, row);
          const p1 = screenFromWorld(world.x - 0.13, world.y + 0.13);
          const p2 = screenFromWorld(world.x + 0.13, world.y - 0.13);
          addLine(p1.x, p1.y, p2.x, p2.y, state.boardScale * 0.01, colors.gridMark);
        }
      }
    }
  }

  function drawBeam() {
    for (const segment of state.beamSegments) {
      const glowColor = segment.hit || state.solved ? colors.solvedGlow : colors.beamGlow;
      const mainColor = segment.hit || state.solved ? colors.beamHit : colors.beam;
      addLine(segment.start.x, segment.start.y, segment.end.x, segment.end.y, state.boardScale * 0.13, glowColor);
      addLine(segment.start.x, segment.start.y, segment.end.x, segment.end.y, state.boardScale * 0.038, mainColor);
      addCircle(segment.end.x, segment.end.y, state.boardScale * 0.045, mainColor, 24);
    }
  }

  function drawVictoryBeam(now) {
    if (!state.solved || (!state.victoryActive && !state.victoryComplete)) return;

    const raw = state.victoryActive ? (now - state.victoryStart) / state.victoryDuration : 1;
    // Use a linear travel clock so the visible beam head and the crescendo
    // envelope finish together. Rotation animations still ease; the solve beam
    // must be audio-synced, not visually fast-then-slow.
    const progress = clamp(raw, 0, 1);
    if (raw >= 1) {
      state.victoryActive = false;
      state.victoryComplete = true;
      if (!state.targetLit) {
        state.targetLit = true;
        if (!state.targetLitSfxPlayed) {
          state.targetLitSfxPlayed = true;
          playLampOnSfx();
        }
      }
    }

    const totalLength = state.beamSegments.reduce((sum, segment) => {
      return sum + Math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y);
    }, 0);
    if (totalLength <= 0.001) return;

    const pulse = 0.5 + 0.5 * Math.sin(now * 0.012);
    const targetLength = totalLength * progress;
    let travelled = 0;
    let head = null;

    for (const segment of state.beamSegments) {
      const length = Math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y);
      if (length <= 0.001 || travelled >= targetLength) break;

      const local = clamp((targetLength - travelled) / length, 0, 1);
      const hx = segment.start.x + (segment.end.x - segment.start.x) * local;
      const hy = segment.start.y + (segment.end.y - segment.start.y) * local;

      addPartialLine(segment.start.x, segment.start.y, segment.end.x, segment.end.y, state.boardScale * (0.25 + pulse * 0.02), colors.victoryOuter, local);
      addPartialLine(segment.start.x, segment.start.y, segment.end.x, segment.end.y, state.boardScale * 0.105, colors.victoryMid, local);
      addPartialLine(segment.start.x, segment.start.y, segment.end.x, segment.end.y, state.boardScale * 0.040, colors.victoryCore, local);

      head = { x: hx, y: hy };
      travelled += length;
    }

    if (head) {
      const level = currentLevel();
      const targetCenter = screenFromCell(level.target.col, level.target.row);
      const touchRadius = state.boardScale * 0.42;
      // Do not trigger the bulb/lamp SFX early by proximity. The lamp now fires
      // at the exact end of the beam travel so the audible crescendo and visible
      // beam animation land together.
      addCircle(head.x, head.y, state.boardScale * (0.16 + pulse * 0.025), colors.targetGlow, 36);
      addCircle(head.x, head.y, state.boardScale * 0.064, colors.victoryCore, 28);
    }
  }


  function drawVictoryDance(now) {
    if (!state.solved || (!state.victoryActive && !state.victoryComplete)) return;
    const level = currentLevel();
    const c = screenFromCell(level.target.col, level.target.row);
    const s = state.boardScale;
    const raw = state.victoryActive ? clamp((now - state.victoryStart) / state.victoryDuration, 0, 1) : 1;
    const post = clamp((raw - 0.55) / 0.45, 0, 1);
    const settle = state.victoryComplete ? 1 : post;
    const dance = (level.id - 1) % 30;
    const beat = now * 0.001 + level.id * 0.41;
    const core = colors.victoryCore || colors.targetOn;
    const mid = colors.victoryMid || colors.beamHit;
    const glow = colors.targetGlow || colors.victoryOuter || colors.beamGlow;
    const quiet = colors.victoryOuter || colors.beamGlow;
    if (settle <= 0.001 && dance !== 7 && dance !== 22) return;

    switch (dance) {
      case 0: { // petal bloom
        for (let i = 0; i < 8; i += 1) {
          const a = beat * 0.55 + (i / 8) * Math.PI * 2;
          const r = s * (0.48 + settle * (0.24 + (i % 2) * 0.06));
          addLine(c.x, c.y, c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, s * 0.028, softColor(mid, 0.35 * settle));
          addCircle(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, s * 0.060, softColor(core, 0.36 * settle), 20);
        }
        break;
      }
      case 1: { // counter orbit beads
        for (let i = 0; i < 10; i += 1) {
          const dir = i % 2 ? -1 : 1;
          const a = beat * dir * 0.90 + i * 0.628;
          const r = s * (0.52 + (i % 3) * 0.055);
          addCircle(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, s * 0.045, softColor(i % 2 ? mid : core, 0.38 * settle), 20);
        }
        break;
      }
      case 2: { // square ripple
        for (let i = 0; i < 4; i += 1) {
          const r = s * (0.44 + i * 0.16 + pulse01(beat * 2.0 + i) * 0.035);
          addLine(c.x - r, c.y - r, c.x + r, c.y - r, s * 0.016, softColor(mid, 0.22 * settle));
          addLine(c.x + r, c.y - r, c.x + r, c.y + r, s * 0.016, softColor(mid, 0.22 * settle));
          addLine(c.x + r, c.y + r, c.x - r, c.y + r, s * 0.016, softColor(mid, 0.22 * settle));
          addLine(c.x - r, c.y + r, c.x - r, c.y - r, s * 0.016, softColor(mid, 0.22 * settle));
        }
        break;
      }
      case 3: { // crescent sweeps
        for (let i = 0; i < 5; i += 1) {
          const a = beat * 0.6 + i * 0.86;
          addArcLine(c.x, c.y, s * (0.47 + i * 0.07), a, a + Math.PI * 0.86, s * 0.022, softColor(core, 0.30 * settle), 20);
        }
        break;
      }
      case 4: { // falling light drops
        for (let i = 0; i < 12; i += 1) {
          const x = c.x + Math.sin(i * 1.9) * s * 0.86;
          const y = c.y - s * 0.80 + ((beat * 0.45 + i * 0.13) % 1) * s * 1.55;
          addLine(x, y - s * 0.08, x, y + s * 0.035, s * 0.018, softColor(mid, 0.30 * settle));
          addCircle(x, y + s * 0.055, s * 0.026, softColor(core, 0.38 * settle), 14);
        }
        break;
      }
      case 5: { // mirror choir
        for (const mirror of state.mirrorStates) {
          const m = screenFromCell(mirror.col, mirror.row);
          const local = 0.5 + 0.5 * Math.sin(beat * 2.2 + mirror.index * 0.8);
          addRing(m.x, m.y, s * (0.40 + local * 0.035), s * 0.34, softColor(glow, 0.22 * settle), 44);
        }
        break;
      }
      case 6: { // spiral bloom
        for (let i = 0; i < 18; i += 1) {
          const t = i / 18;
          const a = beat * 0.8 + t * Math.PI * 5.4;
          const r = s * (0.18 + t * 0.78 * settle);
          addCircle(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, s * (0.023 + t * 0.020), softColor(i % 2 ? mid : core, 0.35 * settle), 14);
        }
        break;
      }
      case 7: { // aurora ribbons along path
        drawBeamTravellers(now, 12, s * 0.035, 0.0, mid, 'dots');
        drawBeamTravellers(now + 350, 8, s * 0.026, 0.25, core, 'dots');
        break;
      }
      case 8: { // constellation at target
        const pts = [];
        for (let i = 0; i < 7; i += 1) {
          const a = i * 2.399 + beat * 0.12;
          const r = s * (0.34 + (i % 3) * 0.18);
          pts.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
        }
        for (let i = 0; i < pts.length; i += 1) {
          const p = pts[i];
          addCircle(p.x, p.y, s * 0.030, softColor(core, 0.38 * settle), 16);
          if (i > 0) addLine(pts[i - 1].x, pts[i - 1].y, p.x, p.y, s * 0.012, softColor(mid, 0.20 * settle));
        }
        break;
      }
      case 9: { // radial spokes
        for (let i = 0; i < 16; i += 1) {
          const a = i * Math.PI / 8 + beat * 0.2;
          const r1 = s * (0.45 + pulse01(beat * 2 + i) * 0.05);
          const r2 = s * (0.82 + pulse01(beat * 2 + i) * 0.08);
          addLine(c.x + Math.cos(a) * r1, c.y + Math.sin(a) * r1, c.x + Math.cos(a) * r2, c.y + Math.sin(a) * r2, s * 0.015, softColor(core, 0.26 * settle));
        }
        break;
      }
      case 10: { // bubble fountain
        for (let i = 0; i < 14; i += 1) {
          const t = (beat * 0.28 + i * 0.073) % 1;
          const x = c.x + Math.sin(i * 1.23) * s * 0.48 * (1 - t * 0.15);
          const y = c.y + s * 0.48 - t * s * 1.20;
          addRing(x, y, s * (0.025 + t * 0.028), s * (0.017 + t * 0.018), softColor(core, 0.30 * settle * (1 - t * 0.35)), 18);
        }
        break;
      }
      case 11: { // horizontal light curtain
        for (let i = 0; i < 7; i += 1) {
          const yy = c.y + (i - 3) * s * 0.15;
          const width = s * (0.55 + pulse01(beat * 1.7 + i) * 0.34);
          addLine(c.x - width, yy, c.x + width, yy, s * 0.015, softColor(i % 2 ? mid : core, 0.25 * settle));
        }
        break;
      }
      case 12: { // diamond facets
        for (let i = 0; i < 9; i += 1) {
          const a = beat * 0.55 + i * 0.698;
          const r = s * (0.42 + (i % 3) * 0.14);
          addDiamond(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, s * (0.040 + (i % 2) * 0.018), softColor(i % 2 ? mid : core, 0.32 * settle));
        }
        break;
      }
      case 13: { // clock tick halo
        for (let i = 0; i < 12; i += 1) {
          const a = i * Math.PI / 6;
          const r = s * (0.58 + (i % 3 === Math.floor(beat * 2) % 3 ? 0.09 : 0));
          addLine(c.x + Math.cos(a) * s * 0.46, c.y + Math.sin(a) * s * 0.46, c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, s * 0.021, softColor(core, 0.30 * settle));
        }
        break;
      }
      case 14: { // dual orbit rings
        addRing(c.x, c.y, s * (0.60 + pulse01(beat * 1.7) * 0.04), s * 0.575, softColor(mid, 0.22 * settle), 72);
        addRing(c.x, c.y, s * (0.79 + pulse01(beat * 1.2 + 1) * 0.04), s * 0.765, softColor(core, 0.18 * settle), 72);
        for (let i = 0; i < 6; i += 1) {
          const a = beat * (i % 2 ? -0.75 : 0.75) + i * Math.PI / 3;
          addCircle(c.x + Math.cos(a) * s * 0.69, c.y + Math.sin(a) * s * 0.69, s * 0.035, softColor(core, 0.36 * settle), 18);
        }
        break;
      }
      case 15: { // lens breathing
        for (let i = 0; i < 5; i += 1) {
          const r = s * (0.40 + i * 0.12 + pulse01(beat * 2 + i) * 0.035);
          addRing(c.x, c.y, r, r - s * 0.018, softColor(i % 2 ? core : mid, (0.22 - i * 0.025) * settle), 72);
        }
        break;
      }
      case 16: { // rose petal wave
        for (let i = 0; i < 10; i += 1) {
          const a = i * 0.628 + Math.sin(beat + i) * 0.12;
          const r = s * (0.55 + Math.sin(beat * 1.3 + i) * 0.08);
          addFacet(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, s * 0.095, a, softColor(mid, 0.24 * settle));
        }
        break;
      }
      case 17: { // star map along beam
        drawBeamTravellers(now, 16, s * 0.020, 0.15, core, 'diamonds');
        for (let i = 0; i < 5; i += 1) {
          const p1 = beamPointAt((i + 0.15) / 5);
          const p2 = beamPointAt((i + 0.85) / 5);
          if (p1 && p2) addLine(p1.x, p1.y, p2.x, p2.y, s * 0.010, softColor(mid, 0.18 * settle));
        }
        break;
      }
      case 18: { // vertical rain
        for (let i = 0; i < 10; i += 1) {
          const x = c.x + (i - 4.5) * s * 0.13;
          const y = c.y + Math.sin(beat * 1.7 + i) * s * 0.50;
          addLine(x, y - s * 0.16, x, y + s * 0.16, s * 0.012, softColor(core, 0.26 * settle));
        }
        break;
      }
      case 19: { // golden corona
        for (let i = 0; i < 20; i += 1) {
          const a = i * Math.PI * 2 / 20 + beat * 0.17;
          const r = s * (0.50 + (i % 2) * 0.08);
          addFacet(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, s * 0.058, a, softColor(core, 0.22 * settle));
        }
        break;
      }
      case 20: { // prism shards
        for (let i = 0; i < 11; i += 1) {
          const a = beat * 0.45 + i * 0.571;
          const r = s * (0.38 + (i % 4) * 0.12);
          addFacet(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, s * (0.050 + i % 3 * 0.014), a + Math.PI * 0.5, softColor(i % 2 ? core : mid, 0.28 * settle));
        }
        break;
      }
      case 21: { // moon phases
        for (let i = 0; i < 8; i += 1) {
          const a = beat * 0.38 + i * Math.PI / 4;
          const x = c.x + Math.cos(a) * s * 0.68;
          const y = c.y + Math.sin(a) * s * 0.68;
          addCircle(x, y, s * 0.052, softColor(core, 0.28 * settle), 22);
          addCircle(x + Math.cos(a) * s * 0.020, y, s * 0.050, softColor(colors.background || quiet, 0.28 * settle), 22);
        }
        break;
      }
      case 22: { // serpentine afterglow
        drawBeamTravellers(now, 18, s * 0.024, 0.05, mid, 'dots');
        drawBeamTravellers(now + 700, 18, s * 0.018, 0.52, core, 'dots');
        break;
      }
      case 23: { // lattice flare
        for (let i = -3; i <= 3; i += 1) {
          addLine(c.x - s * 0.75, c.y + i * s * 0.14, c.x + s * 0.75, c.y - i * s * 0.14, s * 0.011, softColor(mid, 0.18 * settle));
          addLine(c.x - s * 0.75, c.y - i * s * 0.14, c.x + s * 0.75, c.y + i * s * 0.14, s * 0.011, softColor(core, 0.14 * settle));
        }
        break;
      }
      case 24: { // comet tails
        for (let i = 0; i < 9; i += 1) {
          const a = beat * 0.75 + i * 0.698;
          const r = s * 0.64;
          const x = c.x + Math.cos(a) * r;
          const y = c.y + Math.sin(a) * r;
          addLine(x, y, x - Math.cos(a) * s * 0.25, y - Math.sin(a) * s * 0.25, s * 0.018, softColor(mid, 0.28 * settle));
          addCircle(x, y, s * 0.033, softColor(core, 0.34 * settle), 16);
        }
        break;
      }
      case 25: { // micro fireworks
        for (let i = 0; i < 6; i += 1) {
          const cx = c.x + Math.cos(i * 1.047 + beat * 0.18) * s * 0.48;
          const cy = c.y + Math.sin(i * 1.047 + beat * 0.18) * s * 0.48;
          for (let j = 0; j < 5; j += 1) {
            const a = j * 1.257 + beat * 0.9;
            addLine(cx, cy, cx + Math.cos(a) * s * 0.12, cy + Math.sin(a) * s * 0.12, s * 0.010, softColor(core, 0.26 * settle));
          }
        }
        break;
      }
      case 26: { // helix bubbles
        for (let i = 0; i < 14; i += 1) {
          const t = i / 14;
          const a = beat * 1.0 + t * Math.PI * 4;
          const y = c.y + (t - 0.5) * s * 1.25;
          const x = c.x + Math.sin(a) * s * 0.34;
          addCircle(x, y, s * (0.020 + 0.018 * pulse01(a)), softColor(i % 2 ? mid : core, 0.30 * settle), 16);
        }
        break;
      }
      case 27: { // glass iris
        for (let i = 0; i < 12; i += 1) {
          const a = i * Math.PI / 6 + beat * 0.25;
          addFacet(c.x + Math.cos(a) * s * 0.44, c.y + Math.sin(a) * s * 0.44, s * 0.090, a + Math.PI, softColor(mid, 0.22 * settle));
        }
        addRing(c.x, c.y, s * 0.71, s * 0.67, softColor(core, 0.16 * settle), 72);
        break;
      }
      case 28: { // velvet waves
        for (let i = 0; i < 5; i += 1) {
          const y = c.y + (i - 2) * s * 0.16;
          let prev = null;
          for (let j = 0; j <= 12; j += 1) {
            const x = c.x - s * 0.78 + j * s * 0.13;
            const yy = y + Math.sin(beat * 1.6 + j * 0.9 + i) * s * 0.035;
            if (prev) addLine(prev.x, prev.y, x, yy, s * 0.012, softColor(i % 2 ? mid : core, 0.22 * settle));
            prev = { x, y: yy };
          }
        }
        break;
      }
      case 29: { // solar halo finale
        addCircle(c.x, c.y, s * (0.95 + pulse01(beat * 1.3) * 0.05), softColor(glow, 0.14 * settle), 96);
        for (let i = 0; i < 24; i += 1) {
          const a = i * Math.PI / 12 + beat * 0.13;
          const inner = s * 0.63;
          const outer = s * (0.92 + (i % 2) * 0.13);
          addLine(c.x + Math.cos(a) * inner, c.y + Math.sin(a) * inner, c.x + Math.cos(a) * outer, c.y + Math.sin(a) * outer, s * 0.016, softColor(core, 0.22 * settle));
        }
        break;
      }
      default:
        break;
    }
  }

  function drawSource() {
    const level = currentLevel();
    const c = screenFromCell(level.source.col, level.source.row);
    const s = state.boardScale;

    const axis = {
      right: { x: 1, y: 0 },
      left: { x: -1, y: 0 },
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 }
    }[level.source.dir] || { x: 1, y: 0 };
    const side = { x: -axis.y, y: axis.x };

    function p(forward, lateral) {
      return {
        x: c.x + axis.x * (forward * s) + side.x * (lateral * s),
        y: c.y + axis.y * (forward * s) + side.y * (lateral * s)
      };
    }

    function orientedQuad(f1, l1, f2, l2, color) {
      const a = p(f1, l1);
      const b = p(f2, l1);
      const d = p(f1, l2);
      const e = p(f2, l2);
      addTriangle(a.x, a.y, b.x, b.y, d.x, d.y, color);
      addTriangle(b.x, b.y, e.x, e.y, d.x, d.y, color);
    }

    addCircle(c.x, c.y, s * 0.40, [1, 1, 1, 0.22], 52);
    addCircle(p(0.42, 0).x, p(0.42, 0).y, s * 0.13, colors.sourceGlow || [1, 0.94, 0.72, 0.20], 36);

    orientedQuad(-0.34, -0.20, 0.30, 0.20, colors.source);
    orientedQuad(0.30, -0.085, 0.42, 0.085, colors.source);

    const bodyShineA = p(-0.22, -0.095);
    const bodyShineB = p(0.16, -0.095);
    addLine(bodyShineA.x, bodyShineA.y, bodyShineB.x, bodyShineB.y, s * 0.020, [1, 0.98, 0.9, 0.46]);

    const plusCenter = p(0.16, 0);
    const plusForwardA = p(0.09, 0);
    const plusForwardB = p(0.23, 0);
    const plusSideA = p(0.16, -0.07);
    const plusSideB = p(0.16, 0.07);
    addLine(plusForwardA.x, plusForwardA.y, plusForwardB.x, plusForwardB.y, s * 0.030, [1, 0.98, 0.88, 0.82]);
    addLine(plusSideA.x, plusSideA.y, plusSideB.x, plusSideB.y, s * 0.030, [1, 0.98, 0.88, 0.82]);

    const port = p(0.46, 0);
    const portBack = p(0.32, 0);
    addLine(portBack.x, portBack.y, port.x, port.y, s * 0.035, [1, 0.97, 0.78, 0.62]);
  }

  function drawTarget(now) {
    const level = currentLevel();
    const c = screenFromCell(level.target.col, level.target.row);
    const s = state.boardScale;
    const lit = state.targetLit || (state.solved && state.victoryComplete);
    const pulse = lit ? 1 + Math.sin(now * 0.006) * 0.04 : 1;
    if (lit) {
      addCircle(c.x, c.y, s * 0.70 * pulse, colors.targetGlow, 72);
      addCircle(c.x, c.y, s * 0.50 * pulse, [1, 0.97, 0.72, 0.28], 64);
    }

    const entryAxis = {
      right: { x: -1, y: 0, angle: Math.PI },
      left: { x: 1, y: 0, angle: 0 },
      up: { x: 0, y: 1, angle: Math.PI / 2 },
      down: { x: 0, y: -1, angle: -Math.PI / 2 }
    }[state.targetEntryDir] || { x: -1, y: 0, angle: Math.PI };
    const notchX = c.x + entryAxis.x * s * 0.38;
    const notchY = c.y + entryAxis.y * s * 0.38;
    addCircle(notchX, notchY, s * (lit ? 0.080 : 0.060), lit ? [1, 0.95, 0.63, 0.66] : [1, 0.94, 0.76, 0.34], 28);
    addArcLine(c.x, c.y, s * 0.43, entryAxis.angle - 0.28, entryAxis.angle + 0.28, s * 0.022, lit ? [1, 0.92, 0.55, 0.70] : [1, 0.91, 0.70, 0.36], 12);

    addCircle(c.x, c.y, s * 0.37, lit ? colors.targetOn : colors.targetOff, 64);
    addRing(c.x, c.y, s * 0.39, s * 0.35, lit ? [0.44, 0.27, 0.38, 0.40] : [0.30, 0.23, 0.34, 0.22], 64);
    addCircle(c.x, c.y - s * 0.055, s * 0.115, lit ? [0.36, 0.24, 0.23, 0.78] : [0.34, 0.28, 0.33, 0.55], 30);
    addRoundedRect(c.x - s * 0.065, c.y + s * 0.07, s * 0.13, s * 0.105, s * 0.02, lit ? [0.36, 0.24, 0.23, 0.75] : [0.34, 0.28, 0.33, 0.48]);
    addLine(c.x - s * 0.095, c.y + s * 0.20, c.x + s * 0.095, c.y + s * 0.20, s * 0.018, [0.34, 0.28, 0.33, lit ? 0.65 : 0.38]);
  }

  function drawMirror(now, mirror) {
    const c = screenFromCell(mirror.col, mirror.row);
    const s = state.boardScale;
    const tutorialCue = currentLevel().id === 1;
    const needsCue = tutorialCue && state.mode === 'play' && !state.solved && mirror.orientation !== mirror.solution;

    if (needsCue) {
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.004 + mirror.index);
      addRing(c.x, c.y, s * (0.47 + pulse * 0.035), s * (0.44 + pulse * 0.035), colors.tutorialCue, 72);
    }

    addCircle(c.x, c.y, s * 0.39, [1, 1, 1, 0.24], 64);
    addRing(c.x, c.y, s * 0.43, s * 0.405, [1, 1, 1, 0.18], 72);
    addCircle(c.x, c.y, s * 0.34, colors.glass, 64);
    addRing(c.x, c.y, s * 0.36, s * 0.32, colors.glassEdge, 64);
    addArcLine(c.x, c.y, s * 0.23, Math.PI * 0.05, Math.PI * 1.35, s * 0.018, colors.glassHighlight, 20);
    addArcLine(c.x, c.y, s * 0.27, Math.PI * 1.15, Math.PI * 1.72, s * 0.013, [0.43, 0.71, 0.74, 0.36], 12);

    const angle = mirror.visualAngle;
    const dx = Math.cos(angle) * s * 0.29;
    const dy = -Math.sin(angle) * s * 0.29;
    addLine(c.x - dx, c.y - dy, c.x + dx, c.y + dy, s * 0.083, [0.21, 0.17, 0.25, 0.92]);
    addLine(c.x - dx * 0.80, c.y - dy * 0.80, c.x + dx * 0.80, c.y + dy * 0.80, s * 0.025, [1, 1, 1, 0.58]);
  }

  function drawTapCue(now) {
    if (state.mode !== 'play' || state.solved || currentLevel().id !== 1) return;
    const mirror = state.mirrorStates.find((item) => item.orientation !== item.solution && !item.animating);
    if (!mirror) return;
    const c = screenFromCell(mirror.col, mirror.row);
    const s = state.boardScale;
    const bob = Math.sin(now * 0.005) * s * 0.035;
    const handX = c.x + s * 0.44;
    const handY = c.y + s * 0.39 + bob;
    addCircle(handX, handY, s * 0.075, [0.28, 0.22, 0.32, 0.58], 24);
    addLine(handX, handY + s * 0.02, handX - s * 0.18, handY - s * 0.15, s * 0.055, [0.28, 0.22, 0.32, 0.58]);
    addLine(handX - s * 0.16, handY - s * 0.14, handX - s * 0.23, handY - s * 0.12, s * 0.035, [0.28, 0.22, 0.32, 0.50]);
  }

  function flush() {
    const data = new Float32Array(state.vertices);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 24, 8);
    gl.uniform2f(resolutionLocation, state.width, state.height);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 6);
  }

  function draw(now) {
    resize();
    updateMirrorAnimations(now);

    state.vertices = [];
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawBackground(now);
    drawBoardFrame(now);
    drawGrid(now);

    // Beam layers must remain below gameplay objects.
    // The battery/source is drawn after the static beam, the crescendo travel beam,
    // and victory beam particles so the beam never visually sits on top of it.
    drawBeam();
    drawVictoryBeam(now);

    if (!state.solved) drawTarget(now);
    for (const mirror of state.mirrorStates) drawMirror(now, mirror);
    drawTapCue(now);
    drawVictoryDance(now);
    drawSource();
    if (state.solved) drawTarget(now);
    flush();

    requestAnimationFrame(draw);
  }

  function handlePointerDown(event) {
    if (state.mode !== 'play' || state.solved) return;
    const point = cssPointerToDevice(event);
    const mirrorIndex = pointInMirror(point);
    if (mirrorIndex >= 0) {
      event.preventDefault();
      rotateMirror(mirrorIndex);
    }
  }


  function init() {
    applyLevelTheme(0);
    state.mirrorStates = levels[0].mirrors.map((mirror, idx) => ({
      index: idx,
      col: mirror.col,
      row: mirror.row,
      orientation: mirror.orientation,
      solution: mirror.solution,
      visualAngle: angleForOrientation(mirror.orientation),
      startAngle: angleForOrientation(mirror.orientation),
      targetAngle: angleForOrientation(mirror.orientation),
      animStart: 0,
      animDuration: 250,
      animating: false
    }));

    resize();
    updateHud();
    recalculateBeam();

    audioState.enabled = safeLocalStorageGet('pathwayAudioEnabled', safeLocalStorageGet('pathwaySfxEnabled', '1')) !== '0';
    configureMusicElement();
    updateSoundButton();

    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetLevel);
    if (soundButton) soundButton.addEventListener('click', toggleSound);
    nextButton.addEventListener('click', nextLevel);
    document.addEventListener('pointerdown', unlockMusicFromGesture, { passive: true });
    document.addEventListener('click', unlockMusicFromGesture, { passive: true });
    canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => window.setTimeout(resize, 80));
    document.addEventListener('visibilitychange', resumeMusicIfAllowed);

    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'play') startGame();
    const requestedLevel = Number(params.get('level') || (params.get('debug') === 'level2' ? 2 : 0));
    if (Number.isFinite(requestedLevel) && requestedLevel >= 1 && requestedLevel <= levels.length) {
      state.mode = 'play';
      startScreen.classList.add('hidden');
      loadLevel(requestedLevel - 1);
    }

    requestAnimationFrame(draw);
  }

  init();
})();
