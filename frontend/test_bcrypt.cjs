const bcrypt = require('bcryptjs');
const hash = '$2a$10$hKDVYxLefV75igV09mDbSy.hZf52q.r1Xq6B7A6bF1C4wXvO3W5V2';
const password = '123456';
console.log(bcrypt.compareSync(password, hash) ? "MATCHES!" : "DOES NOT MATCH!");
