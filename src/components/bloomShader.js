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
    // Basic iridescent effect
    vec3 viewDir = normalize(cameraPosition - vNormal);
    float fresnel = 1.0 - dot(viewDir, vNormal);
    fresnel = pow(fresnel, 2.0);

    vec3 color = vec3(score, 1.0 - score, 0.5);
    vec3 iridescentColor = vec3(fresnel, fresnel * 0.5, fresnel * 0.2);

    gl_FragColor = vec4(color + iridescentColor, 1.0);
  }
`;
