const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;
const NODE_ENV = process.env.NODE_ENV;

if (!PORT) {
  console.error('PORT is required');
  process.exit(1);
}

if (!HOSTNAME) {
  console.error('HOSTNAME is required');
  process.exit(1);
}

if (!['development', 'production'].includes(NODE_ENV)) {
  console.error('NODE_ENV must be development or production');
  process.exit(1);
}

const config = {
  PORT,
  HOSTNAME,
  NODE_ENV,
};

export default config;
