/**
 * Configuration interfaces for Docker Provider
 */

export interface DockerConfig {
  // Docker daemon connection
  socketPath?: string;
  host?: string;
  port?: number;
  protocol?: 'http' | 'https';
  
  // Container configuration
  image: string;
  containerName?: string;
  ports?: { [key: string]: string };
  volumes?: { [key: string]: string };
  environment?: { [key: string]: string };
  
  // Network configuration
  networkName?: string;
  networkSubnet?: string;
  
  // Resource limits
  memory?: string;
  cpus?: string;
  
  // Lifecycle settings
  autoRemove?: boolean;
  restartPolicy?: 'no' | 'always' | 'unless-stopped' | 'on-failure';
  healthCheckInterval?: number;
  startupTimeout?: number;
  shutdownTimeout?: number;
}

export interface DockerManagerConfig {
  docker: DockerConfig;
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default Docker configuration
 */
export const DEFAULT_DOCKER_CONFIG: DockerConfig = {
  image: 'codebolt/dockerserver:latest',
  containerName: 'codebolt-dockerserver',
  ports: {
    '3001': '3001'
  },
  environment: {
    NODE_ENV: 'production',
    PORT: '3001'
  },
  networkName: 'codebolt-network',
  networkSubnet: '172.20.0.0/16',
  memory: '512m',
  cpus: '1',
  autoRemove: false,
  restartPolicy: 'unless-stopped',
  healthCheckInterval: 30000,
  startupTimeout: 60000,
  shutdownTimeout: 10000
};

/**
 * Default Docker Manager configuration
 */
export const DEFAULT_DOCKER_MANAGER_CONFIG: DockerManagerConfig = {
  docker: DEFAULT_DOCKER_CONFIG,
  maxRetries: 3,
  retryDelay: 5000,
  healthCheckInterval: 30000,
  logLevel: 'info'
};

/**
 * Build Docker configuration from environment variables
 */
export function getDockerConfig(): DockerConfig {
  return {
    ...DEFAULT_DOCKER_CONFIG,
    image: process.env.DOCKER_IMAGE || DEFAULT_DOCKER_CONFIG.image,
    containerName: process.env.DOCKER_CONTAINER_NAME || DEFAULT_DOCKER_CONFIG.containerName,
    ports: process.env.DOCKER_PORTS ? 
      JSON.parse(process.env.DOCKER_PORTS) : 
      DEFAULT_DOCKER_CONFIG.ports,
    environment: {
      ...DEFAULT_DOCKER_CONFIG.environment,
      ...(process.env.DOCKER_ENV ? JSON.parse(process.env.DOCKER_ENV) : {})
    },
    networkName: process.env.DOCKER_NETWORK_NAME || DEFAULT_DOCKER_CONFIG.networkName,
    networkSubnet: process.env.DOCKER_NETWORK_SUBNET || DEFAULT_DOCKER_CONFIG.networkSubnet,
    memory: process.env.DOCKER_MEMORY || DEFAULT_DOCKER_CONFIG.memory,
    cpus: process.env.DOCKER_CPUS || DEFAULT_DOCKER_CONFIG.cpus,
    autoRemove: process.env.DOCKER_AUTO_REMOVE === 'true',
    restartPolicy: (process.env.DOCKER_RESTART_POLICY as any) || DEFAULT_DOCKER_CONFIG.restartPolicy,
    healthCheckInterval: process.env.DOCKER_HEALTH_CHECK_INTERVAL ? 
      parseInt(process.env.DOCKER_HEALTH_CHECK_INTERVAL) : 
      DEFAULT_DOCKER_CONFIG.healthCheckInterval,
    startupTimeout: process.env.DOCKER_STARTUP_TIMEOUT ? 
      parseInt(process.env.DOCKER_STARTUP_TIMEOUT) : 
      DEFAULT_DOCKER_CONFIG.startupTimeout,
    shutdownTimeout: process.env.DOCKER_SHUTDOWN_TIMEOUT ? 
      parseInt(process.env.DOCKER_SHUTDOWN_TIMEOUT) : 
      DEFAULT_DOCKER_CONFIG.shutdownTimeout
  };
}

/**
 * Build Docker Manager configuration from environment variables
 */
export function getDockerManagerConfig(): DockerManagerConfig {
  return {
    docker: getDockerConfig(),
    maxRetries: process.env.DOCKER_MAX_RETRIES ? 
      parseInt(process.env.DOCKER_MAX_RETRIES) : 
      DEFAULT_DOCKER_MANAGER_CONFIG.maxRetries,
    retryDelay: process.env.DOCKER_RETRY_DELAY ? 
      parseInt(process.env.DOCKER_RETRY_DELAY) : 
      DEFAULT_DOCKER_MANAGER_CONFIG.retryDelay,
    healthCheckInterval: process.env.DOCKER_HEALTH_CHECK_INTERVAL ? 
      parseInt(process.env.DOCKER_HEALTH_CHECK_INTERVAL) : 
      DEFAULT_DOCKER_MANAGER_CONFIG.healthCheckInterval,
    logLevel: (process.env.DOCKER_LOG_LEVEL as any) || DEFAULT_DOCKER_MANAGER_CONFIG.logLevel
  };
}
