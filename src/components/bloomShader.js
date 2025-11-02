export const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  uniform float score;
  varying vec3 vNormal;

  void main() {
    // Pastel iridescent effect
    vec3 viewDir = normalize(cameraPosition - vNormal);
    float fresnel = 1.0 - dot(viewDir, vNormal);
    fresnel = pow(fresnel, 2.5);

    float hue = mix(0.6, 0.95, score);
    vec3 color = hsl2rgb(hue, 0.7, 0.8);

    vec3 iridescentColor = hsl2rgb(hue + fresnel * 0.1, 0.7, 0.8);

    gl_FragColor = vec4(mix(color, iridescentColor, fresnel), 1.0);
  }

  // HSL to RGB conversion
  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }
`;
