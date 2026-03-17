function formatDate() {
  const now = new Date();

  const pad = (n) => n.toString().padStart(2, '0');

  return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function log(level, method, url, status) {
  const date = formatDate();

  console.log(
    `[${date}] [${level}] - - > ${method} ${url} | Status: ${status}`,
  );
}

export default log;
