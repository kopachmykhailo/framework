const { createServer } = require("node:http");

let BOOKS = [
  { id: 1, title: "Kobzar", author: "Shevchenko", year: 1840 },
];

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // GET /books?author=Shevchenko

  if (method === "GET" && pathname === "/books") {
    const author = parsedUrl.searchParams.get("author");

    let result = [...BOOKS];

    if (author) {
      result = result.filter(
        (book) => book.author.toLowerCase() === author.toLowerCase()
      );
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({
      count: result.length,
      items: result,
    }));
  }

  // POST /books

  if (method === "POST" && pathname === "/books") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (!data.title || !data.author || typeof data.year !== "number") {
          res.statusCode = 400;
          return res.end(JSON.stringify({
            error: "Title, author and numeric year are required",
          }));
        }

        const lastId = BOOKS.length > 0 ? BOOKS[BOOKS.length - 1].id : 0;

        const newBook = {
          id: lastId + 1,
          title: data.title,
          author: data.author,
          year: data.year,
        };

        BOOKS.push(newBook);

        res.statusCode = 201;
        res.end(JSON.stringify({
          message: "Created",
          book: newBook,
        }));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return;
  }

  // PATCH /books/:id

  if (method === "PATCH" && pathname.startsWith("/books/")) {
    const id = parseInt(pathname.split("/")[2]);
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const index = BOOKS.findIndex((b) => b.id === id);

        if (index === -1) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: "Book not found" }));
        }

        const updates = JSON.parse(body);

        if (updates.id) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Cannot update id" }));
        }

        if (updates.year && typeof updates.year !== "number") {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Year must be number" }));
        }

        BOOKS[index] = { ...BOOKS[index], ...updates };

        res.statusCode = 200;
        res.end(JSON.stringify({
          message: "Updated",
          book: BOOKS[index],
        }));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    return;
  }

  // DELETE /books/:id

  if (method === "DELETE" && pathname.startsWith("/books/")) {
    const id = parseInt(pathname.split("/")[2]);

    const originalLength = BOOKS.length;
    BOOKS = BOOKS.filter((book) => book.id !== id);

    if (BOOKS.length === originalLength) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "Book not found" }));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ message: "Deleted" }));
  }

  // 404
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});